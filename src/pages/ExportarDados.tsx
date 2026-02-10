import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileSpreadsheet, FileText, FileDown, Loader2, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { fetchAllUserData, exportCSV, exportExcel, exportPDF, type UserData } from '@/lib/exportUtils';

type ExportFormat = 'csv' | 'excel' | 'pdf';

const formats: { id: ExportFormat; label: string; desc: string; icon: typeof FileText }[] = [
  { id: 'csv', label: 'CSV', desc: 'Planilhas separadas por tabela', icon: FileSpreadsheet },
  { id: 'excel', label: 'Excel (.xlsx)', desc: 'Todas as tabelas em um único arquivo', icon: FileSpreadsheet },
  { id: 'pdf', label: 'PDF', desc: 'Relatório resumido das finanças', icon: FileText },
];

export default function ExportarDados() {
  const [loading, setLoading] = useState<ExportFormat | null>(null);
  const [done, setDone] = useState<ExportFormat | null>(null);
  const [stats, setStats] = useState<UserData | null>(null);

  const handleExport = async (format: ExportFormat) => {
    setLoading(format);
    setDone(null);
    try {
      const data = await fetchAllUserData();
      setStats(data);

      switch (format) {
        case 'csv': exportCSV(data); break;
        case 'excel': exportExcel(data); break;
        case 'pdf': exportPDF(data); break;
        
      }
      setDone(format);
      toast.success('Exportação concluída!');
    } catch (err) {
      toast.error('Erro ao exportar dados');
      console.error(err);
    } finally {
      setLoading(null);
    }
  };

  const handleExportAll = async () => {
    setLoading('excel');
    try {
      const data = await fetchAllUserData();
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

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
      <div className="flex items-center gap-3">
        <Link to="/perfil">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <h1 className="text-xl font-bold text-foreground">Exportar Dados</h1>
      </div>

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
