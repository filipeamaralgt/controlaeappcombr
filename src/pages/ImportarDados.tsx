import { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Upload, Loader2, CheckCircle2, AlertTriangle, FileUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCategories } from '@/hooks/useCategories';
import { parseImportFile, detectColumnMapping, ParsedSheet } from '@/lib/exportUtils';
import { format, parse, isValid } from 'date-fns';

interface MappedRow {
  date: string;
  description: string;
  amount: number;
  type: 'expense' | 'income';
  category: string;
  valid: boolean;
  error?: string;
}

export default function ImportarDados() {
  const { user } = useAuth();
  const expenseCats = useCategories('expense');
  const incomeCats = useCategories('income');
  const allCategories = [...(expenseCats.data || []), ...(incomeCats.data || [])];

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sheets, setSheets] = useState<ParsedSheet[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<MappedRow[]>([]);
  const [step, setStep] = useState<'upload' | 'sheets' | 'map' | 'preview' | 'done'>('upload');
  const [importing, setImporting] = useState(false);
  const [importCount, setImportCount] = useState(0);
  const [selectedSheets, setSelectedSheets] = useState<Set<number>>(new Set());

  const generatePreview = (rows: Record<string, string>[], colMap: Record<string, string>, forceType?: 'expense' | 'income'): MappedRow[] => {
    return rows.map((row) => {
      const rawDate = row[colMap.date] || '';
      const rawAmount = row[colMap.amount] || '0';
      const rawType = (row[colMap.type] || '').toLowerCase();
      const category = row[colMap.category] || '';
      const description = row[colMap.description] || category || '';

      const numericAmount = parseFloat(rawAmount.replace(/[^\d.,-]/g, '').replace(',', '.')) || 0;
      const amount = Math.abs(numericAmount);

      // Type detection
      let type: 'expense' | 'income' = forceType || 'expense';
      if (!forceType) {
        if (rawType.includes('renda') || rawType.includes('receita') || rawType.includes('income')) {
          type = 'income';
        }
      }

      // Parse date - try multiple strategies
      let parsedDate = '';
      
      // Strategy 1: Try as Excel serial number (e.g., 45678)
      const serialNum = Number(rawDate);
      if (!isNaN(serialNum) && serialNum > 30000 && serialNum < 70000) {
        // Excel serial date: days since 1899-12-30
        const excelEpoch = new Date(1899, 11, 30);
        const d = new Date(excelEpoch.getTime() + serialNum * 86400000);
        if (isValid(d)) {
          parsedDate = format(d, 'yyyy-MM-dd');
        }
      }
      
      // Strategy 2: Try common date string formats
      if (!parsedDate) {
        const dateFormats = [
          'yyyy-MM-dd', 'dd/MM/yyyy', 'MM/dd/yyyy', 'dd-MM-yyyy',
          'yyyy-MM-dd HH:mm:ss', 'dd/MM/yyyy HH:mm:ss', 'dd/MM/yyyy HH:mm',
          "yyyy-MM-dd'T'HH:mm:ss", 'dd.MM.yyyy', 'yyyy/MM/dd',
          'M/d/yyyy', 'd/M/yyyy',
        ];
        for (const fmt of dateFormats) {
          const d = parse(rawDate, fmt, new Date());
          if (isValid(d) && d.getFullYear() > 1900 && d.getFullYear() < 2100) {
            parsedDate = format(d, 'yyyy-MM-dd');
            break;
          }
        }
      }
      
      // Strategy 3: Try native Date parsing as last resort
      if (!parsedDate) {
        const d = new Date(rawDate);
        if (isValid(d) && d.getFullYear() > 1900 && d.getFullYear() < 2100) {
          parsedDate = format(d, 'yyyy-MM-dd');
        }
      }

      const valid = !!parsedDate && !!description && amount > 0;
      return {
        date: parsedDate || rawDate,
        description,
        amount,
        type,
        category,
        valid,
        error: !valid ? (!parsedDate ? 'Data inválida' : !description ? 'Sem descrição' : 'Valor inválido') : undefined,
      };
    });
  };

  const inferTypeFromSheetName = (name: string): 'expense' | 'income' | undefined => {
    const lower = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (lower.includes('receita') || lower.includes('renda') || lower.includes('income') || lower.includes('entrada')) return 'income';
    if (lower.includes('despesa') || lower.includes('gasto') || lower.includes('expense') || lower.includes('saida')) return 'expense';
    return undefined;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const parsedSheets = await parseImportFile(file);
      if (!parsedSheets.length) { toast.error('Arquivo vazio'); return; }
      setSheets(parsedSheets);
      
      if (parsedSheets.length > 1) {
        // Multiple sheets — let user see them, auto-select all
        setSelectedSheets(new Set(parsedSheets.map((_, i) => i)));
        setStep('sheets');
        const totalRows = parsedSheets.reduce((s, sh) => s + sh.rows.length, 0);
        toast.success(`${parsedSheets.length} abas encontradas com ${totalRows} linhas no total`);
      } else {
        // Single sheet — proceed as before
        proceedWithSheets(parsedSheets, new Set([0]));
      }
    } catch {
      toast.error('Erro ao ler arquivo');
    }
  };

  const proceedWithSheets = (sheetsData: ParsedSheet[], selected: Set<number>) => {
    // Merge selected sheets, inferring type from sheet name
    const allRows: Record<string, string>[] = [];
    const typeOverrides: ('expense' | 'income' | undefined)[] = [];
    
    sheetsData.forEach((sheet, i) => {
      if (!selected.has(i)) return;
      const inferredType = inferTypeFromSheetName(sheet.name);
      sheet.rows.forEach(row => {
        allRows.push(row);
        typeOverrides.push(inferredType);
      });
    });

    if (!allRows.length) { toast.error('Nenhuma linha nas abas selecionadas'); return; }
    
    const hdrs = Object.keys(allRows[0]);
    setRawRows(allRows);
    setHeaders(hdrs);
    console.log('[Import] Headers detectados:', hdrs);
    const autoMap = detectColumnMapping(hdrs);
    console.log('[Import] Mapeamento automático:', autoMap);
    setMapping(autoMap);

    if (autoMap.date && autoMap.description && autoMap.amount) {
      // Generate preview with type inference from sheet names
      const mapped = allRows.map((row, idx) => {
        const rows = generatePreview([row], autoMap, typeOverrides[idx]);
        return rows[0];
      });
      setPreview(mapped);
      setStep('preview');
      toast.info('Colunas detectadas automaticamente — confira a pré-visualização');
    } else {
      setStep('map');
    }
  };

  const handleMapColumns = () => {
    if (!mapping.date || !mapping.description || !mapping.amount) {
      toast.error('Mapeie pelo menos: Data, Descrição e Valor');
      return;
    }

    const mapped = generatePreview(rawRows, mapping);
    setPreview(mapped);
    setStep('preview');
  };

  const handleImport = async () => {
    if (!user) return;
    setImporting(true);

    try {
      const validRows = preview.filter((r) => r.valid);

      // Build category map from existing categories
      const catMap = new Map(allCategories.map((c) => [c.name.toLowerCase().trim(), c.id]));
      
      // Find categories that need to be created
      const newCatNames = new Set<string>();
      const newCatTypes = new Map<string, 'expense' | 'income'>();
      validRows.forEach((r) => {
        const catLower = r.category.toLowerCase().trim();
        if (catLower && !catMap.has(catLower)) {
          newCatNames.add(r.category.trim());
          newCatTypes.set(catLower, r.type);
        }
      });

      // Auto-create missing categories
      if (newCatNames.size > 0) {
        const newCats = Array.from(newCatNames).map((name) => ({
          user_id: user.id,
          name,
          type: newCatTypes.get(name.toLowerCase().trim()) || 'expense',
          color: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`,
          icon: 'circle',
          is_default: false,
        }));

        const { data: createdCats, error: catError } = await supabase
          .from('categories')
          .insert(newCats)
          .select();

        if (catError) {
          console.error('[Import] Erro ao criar categorias:', catError);
        } else if (createdCats) {
          createdCats.forEach((c) => catMap.set(c.name.toLowerCase().trim(), c.id));
          toast.info(`${createdCats.length} categorias criadas automaticamente`);
        }
      }

      const defaultCat = allCategories[0];

      const transactions = validRows.map((r) => ({
        user_id: user.id,
        description: r.description,
        amount: r.amount,
        date: r.date,
        type: r.type,
        category_id: catMap.get(r.category.toLowerCase().trim()) || defaultCat?.id || '',
        installment_number: 1,
        installment_total: 1,
      }));

      // Check duplicates
      const { data: existing } = await supabase
        .from('transactions')
        .select('date, description, amount');

      const existingSet = new Set(
        (existing || []).map((t) => `${t.date}|${t.description}|${t.amount}`)
      );

      const unique = transactions.filter(
        (t) => !existingSet.has(`${t.date}|${t.description}|${t.amount}`)
      );

      if (!unique.length) {
        toast.info('Todas as transações já existem — nenhuma duplicata importada');
        setStep('done');
        setImporting(false);
        return;
      }

      // Batch insert in chunks of 100
      const chunkSize = 100;
      let inserted = 0;
      for (let i = 0; i < unique.length; i += chunkSize) {
        const chunk = unique.slice(i, i + chunkSize);
        const { error } = await supabase.from('transactions').insert(chunk);
        if (error) throw error;
        inserted += chunk.length;
      }

      setImportCount(inserted);
      setStep('done');
      toast.success(`${inserted} transações importadas!`);
    } catch (err) {
      toast.error('Erro ao importar');
      console.error(err);
    } finally {
      setImporting(false);
    }
  };

  const validCount = preview.filter((r) => r.valid).length;
  const invalidCount = preview.length - validCount;

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
      <div className="flex items-center gap-3">
        <Link to="/perfil">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <h1 className="text-xl font-bold text-foreground">Importar Dados</h1>
      </div>

      {/* Step: Upload */}
      {step === 'upload' && (
        <Card className="border-border/50 bg-card">
          <CardContent className="flex flex-col items-center gap-4 p-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <FileUp className="h-8 w-8 text-primary" />
            </div>
            <div className="text-center">
              <p className="font-medium text-foreground">Envie um arquivo CSV ou Excel</p>
              <p className="text-sm text-muted-foreground">
                O arquivo deve ter colunas como data, descrição, valor, tipo e categoria
              </p>
            </div>
            <Button onClick={() => fileInputRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" /> Selecionar Arquivo
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={handleFileSelect}
            />
          </CardContent>
        </Card>
      )}

      {/* Step: Select sheets */}
      {step === 'sheets' && (
        <div className="space-y-4">
          <Card className="border-border/50 bg-card">
            <CardContent className="p-4">
              <p className="mb-4 text-sm text-muted-foreground">
                O arquivo contém <strong className="text-foreground">{sheets.length}</strong> abas.
                Selecione quais deseja importar:
              </p>
              {sheets.map((sheet, i) => {
                const inferredType = inferTypeFromSheetName(sheet.name);
                return (
                  <label key={i} className="flex items-center gap-3 rounded-lg border border-border/50 p-3 mb-2 cursor-pointer hover:bg-muted/50">
                    <input
                      type="checkbox"
                      checked={selectedSheets.has(i)}
                      onChange={(e) => {
                        setSelectedSheets(prev => {
                          const next = new Set(prev);
                          e.target.checked ? next.add(i) : next.delete(i);
                          return next;
                        });
                      }}
                      className="h-4 w-4 accent-primary"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{sheet.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {sheet.rows.length} linhas
                        {inferredType && (
                          <span className={inferredType === 'income' ? ' text-green-500' : ' text-destructive'}>
                            {' · '}Detectado como {inferredType === 'income' ? 'Receita' : 'Despesa'}
                          </span>
                        )}
                      </p>
                    </div>
                  </label>
                );
              })}
            </CardContent>
          </Card>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setStep('upload')}>Voltar</Button>
            <Button
              className="flex-1"
              disabled={selectedSheets.size === 0}
              onClick={() => proceedWithSheets(sheets, selectedSheets)}
            >
              Continuar ({selectedSheets.size} {selectedSheets.size === 1 ? 'aba' : 'abas'})
            </Button>
          </div>
        </div>
      )}

      {/* Step: Map columns */}
      {step === 'map' && (
        <div className="space-y-4">
          <Card className="border-border/50 bg-card">
            <CardContent className="p-4">
              <p className="mb-4 text-sm text-muted-foreground">
                Mapeie as colunas do seu arquivo para os campos corretos.
                Detectamos <strong className="text-foreground">{rawRows.length}</strong> linhas com{' '}
                <strong className="text-foreground">{headers.length}</strong> colunas.
              </p>

              {['date', 'description', 'amount', 'type', 'category'].map((field) => {
                const labels: Record<string, string> = {
                  date: 'Data *',
                  description: 'Descrição *',
                  amount: 'Valor *',
                  type: 'Tipo (gasto/renda)',
                  category: 'Categoria',
                };
                return (
                  <div key={field} className="mb-3 flex items-center gap-3">
                    <span className="w-32 text-sm font-medium text-foreground">{labels[field]}</span>
                    <Select
                      value={mapping[field] || '__none__'}
                      onValueChange={(v) => setMapping((prev) => ({ ...prev, [field]: v === '__none__' ? '' : v }))}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Selecionar coluna" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">— Nenhuma —</SelectItem>
                        {headers.map((h) => (
                          <SelectItem key={h} value={h}>{h}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setStep('upload')}>Voltar</Button>
            <Button className="flex-1" onClick={handleMapColumns}>Pré-visualizar</Button>
          </div>
        </div>
      )}

      {/* Step: Preview */}
      {step === 'preview' && (
        <div className="space-y-4">
          <div className="flex gap-3">
            <Card className="flex-1 border-border/50 bg-card">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-green-500">{validCount}</p>
                <p className="text-xs text-muted-foreground">Válidas</p>
              </CardContent>
            </Card>
            {invalidCount > 0 && (
              <Card className="flex-1 border-border/50 bg-card">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-destructive">{invalidCount}</p>
                  <p className="text-xs text-muted-foreground">Inválidas</p>
                </CardContent>
              </Card>
            )}
          </div>

          <Card className="border-border/50 bg-card">
            <CardContent className="max-h-72 overflow-auto p-0">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted">
                  <tr>
                    <th className="p-2 text-left font-medium">Status</th>
                    <th className="p-2 text-left font-medium">Data</th>
                    <th className="p-2 text-left font-medium">Descrição</th>
                    <th className="p-2 text-right font-medium">Valor</th>
                    <th className="p-2 text-left font-medium">Tipo</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(0, 100).map((row, i) => (
                    <tr key={i} className={`border-t border-border/30 ${!row.valid ? 'bg-destructive/5' : ''}`}>
                      <td className="p-2">
                        {row.valid ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                        )}
                      </td>
                      <td className="p-2 text-muted-foreground">{row.date}</td>
                      <td className="p-2 text-foreground">{row.description}</td>
                      <td className="p-2 text-right text-foreground">
                        R$ {row.amount.toFixed(2)}
                      </td>
                      <td className="p-2 text-muted-foreground">
                        {row.type === 'expense' ? 'Despesa' : 'Receita'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {preview.length > 100 && (
                <p className="p-2 text-center text-xs text-muted-foreground">
                  Mostrando 100 de {preview.length} linhas
                </p>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setStep('map')}>Voltar</Button>
            <Button className="flex-1" disabled={importing || !validCount} onClick={handleImport}>
              {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Importar {validCount} transações
            </Button>
          </div>
        </div>
      )}

      {/* Step: Done */}
      {step === 'done' && (
        <Card className="border-border/50 bg-card">
          <CardContent className="flex flex-col items-center gap-4 p-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-lg font-semibold text-foreground">Importação concluída!</p>
            <p className="text-sm text-muted-foreground">
              {importCount > 0
                ? `${importCount} transações foram adicionadas.`
                : 'Nenhuma transação nova (duplicatas evitadas).'}
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => { setStep('upload'); setRawRows([]); setPreview([]); }}>
                Importar mais
              </Button>
              <Link to="/">
                <Button>Ver Dashboard</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
