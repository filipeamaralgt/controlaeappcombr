import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ArrowLeft, FileSpreadsheet, FileText, FileDown, Loader2, CheckCircle2, CalendarIcon, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { fetchAllUserData, exportCSV, exportExcel, exportPDF, type UserData, type DataTableKey, type ExportOptions } from '@/lib/exportUtils';
import type { DateRange } from 'react-day-picker';

type ExportFormat = 'csv' | 'excel' | 'pdf';

const formats: { id: ExportFormat; label: string; desc: string; icon: typeof FileText }[] = [
  { id: 'csv', label: 'CSV', desc: 'Planilhas separadas por tabela', icon: FileSpreadsheet },
  { id: 'excel', label: 'Excel (.xlsx)', desc: 'Todas as tabelas em um único arquivo', icon: FileSpreadsheet },
  { id: 'pdf', label: 'PDF', desc: 'Relatório resumido das finanças', icon: FileText },
];

const dataOptions: { key: DataTableKey; label: string }[] = [
  { key: 'transactions', label: 'Transações' },
  { key: 'categories', label: 'Categorias' },
  { key: 'goals', label: 'Metas' },
  { key: 'debts', label: 'Dívidas' },
  { key: 'installments', label: 'Parcelamentos' },
  { key: 'budget_limits', label: 'Limites de Orçamento' },
  { key: 'recurring_payments', label: 'Pagamentos Recorrentes' },
  { key: 'reminders', label: 'Lembretes' },
];

export default function ExportarDados() {
  const [loading, setLoading] = useState<ExportFormat | null>(null);
  const [done, setDone] = useState<ExportFormat | null>(null);
  const [stats, setStats] = useState<UserData | null>(null);
  const [selectedTables, setSelectedTables] = useState<Set<DataTableKey>>(new Set(dataOptions.map(d => d.key)));
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const allSelected = selectedTables.size === dataOptions.length;

  const toggleTable = (key: DataTableKey) => {
    setSelectedTables(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelectedTables(new Set());
    } else {
      setSelectedTables(new Set(dataOptions.map(d => d.key)));
    }
  };

  const buildOptions = (): ExportOptions => ({
    tables: Array.from(selectedTables),
    startDate: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
    endDate: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
  });

  const handleExport = async (fmt: ExportFormat) => {
    if (selectedTables.size === 0) { toast.error('Selecione ao menos um dado para exportar'); return; }
    setLoading(fmt);
    setDone(null);
    try {
      const data = await fetchAllUserData(buildOptions());
      setStats(data);
      switch (fmt) {
        case 'csv': exportCSV(data); break;
        case 'excel': exportExcel(data); break;
        case 'pdf': exportPDF(data); break;
      }
      setDone(fmt);
      toast.success('Exportação concluída!');
    } catch (err) {
      toast.error('Erro ao exportar dados');
      console.error(err);
    } finally {
      setLoading(null);
    }
  };

  const handleExportAll = async () => {
    if (selectedTables.size === 0) { toast.error('Selecione ao menos um dado para exportar'); return; }
    setLoading('excel');
    try {
      const data = await fetchAllUserData(buildOptions());
      setStats(data);
      exportExcel(data);
      exportPDF(data);
      setDone('excel');
      toast.success('Todos os formatos exportados!');
    } catch (err) {
      toast.error('Erro ao exportar');
      console.error(err);
    } finally {
      setLoading(null);
    }
  };

  const totalRecords = stats
    ? Object.values(stats).reduce((sum, arr) => sum + arr.length, 0)
    : 0;

  const dateLabel = dateRange?.from && dateRange?.to
    ? `${format(dateRange.from, 'dd/MM/yy', { locale: ptBR })} - ${format(dateRange.to, 'dd/MM/yy', { locale: ptBR })}`
    : dateRange?.from
      ? `A partir de ${format(dateRange.from, 'dd/MM/yy', { locale: ptBR })}`
      : 'Todas as datas';

  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 py-6">
      <div className="flex items-center gap-3">
        <Link to="/perfil">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <h1 className="text-xl font-bold text-foreground">Exportar Dados</h1>
      </div>

      {/* Date range filter */}
      <Card className="border-border/50 bg-card">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <CalendarIcon className="h-4 w-4 text-primary" />
            Período (transações)
          </div>
          <div className="flex flex-wrap gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="text-xs">
                  <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                  {dateLabel}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={1}
                  locale={ptBR}
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            {dateRange?.from && (
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => setDateRange(undefined)}>
                Limpar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table selection */}
      <Card className="border-border/50 bg-card">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Filter className="h-4 w-4 text-primary" />
              Dados para exportar
            </div>
            <button onClick={toggleAll} className="text-xs text-primary font-medium hover:underline">
              {allSelected ? 'Desmarcar tudo' : 'Selecionar tudo'}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {dataOptions.map(opt => (
              <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={selectedTables.has(opt.key)}
                  onCheckedChange={() => toggleTable(opt.key)}
                />
                <span className="text-sm text-foreground">{opt.label}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {stats && (
        <Card className="border-border/50 bg-card">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">{totalRecords}</strong> registros encontrados em{' '}
              <strong className="text-foreground">{Object.entries(stats).filter(([,v]) => v.length > 0).length}</strong> tabelas
            </p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {formats.map((f) => (
          <Card key={f.id} className="border-border/50 bg-card">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">{f.label}</p>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
              <Button
                size="sm"
                variant={done === f.id ? 'outline' : 'default'}
                disabled={loading !== null}
                onClick={() => handleExport(f.id)}
              >
                {loading === f.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : done === f.id ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <FileDown className="h-4 w-4" />
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button className="w-full" size="lg" disabled={loading !== null} onClick={handleExportAll}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
        Exportar Tudo
      </Button>
    </div>
  );
}
