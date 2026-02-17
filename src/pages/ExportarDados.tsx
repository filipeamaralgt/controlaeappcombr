import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ArrowLeft, FileSpreadsheet, FileText, FileDown, Loader2, CheckCircle2, CalendarIcon, Users } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  buildExcelFile,
  buildPdfFile,
  downloadBlob,
  fetchAllUserData,
  type ExportOptions,
  type UserData,
} from '@/lib/exportUtils';
import { useSpendingProfiles } from '@/hooks/useSpendingProfiles';
import type { DateRange } from 'react-day-picker';

type ExportFormat = 'excel' | 'pdf';

type ExportCard = { id: ExportFormat; label: string; desc: string; icon: typeof FileText };

const formats: ExportCard[] = [
  { id: 'excel', label: 'Excel (.xlsx)', desc: 'Todas as tabelas em um único arquivo', icon: FileSpreadsheet },
  { id: 'pdf', label: 'PDF', desc: 'Relatório resumido das finanças', icon: FileText },
];

export default function ExportarDados() {
  const [loading, setLoading] = useState<ExportFormat | null>(null);
  const [done, setDone] = useState<ExportFormat | null>(null);
  const [stats, setStats] = useState<UserData | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [allTime, setAllTime] = useState(true);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const { data: profiles } = useSpendingProfiles();

  const buildOptions = (): ExportOptions => ({
    startDate: !allTime && dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
    endDate: !allTime && dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
    profileId: selectedProfileId || undefined,
  });

  const handleExport = async (fmt: ExportFormat) => {
    setLoading(fmt);
    setDone(null);

    try {
      const data = await fetchAllUserData(buildOptions());
      setStats(data);

      const file = fmt === 'excel' ? buildExcelFile(data) : buildPdfFile(data);
      downloadBlob(file.blob, file.filename);

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
    setLoading('excel');
    try {
      const data = await fetchAllUserData(buildOptions());
      setStats(data);

      const excelFile = buildExcelFile(data);
      const pdfFile = buildPdfFile(data);

      downloadBlob(excelFile.blob, excelFile.filename);
      downloadBlob(pdfFile.blob, pdfFile.filename);

      setDone('excel');
      toast.success('Todos os formatos exportados!');
    } catch (err) {
      toast.error('Erro ao exportar');
      console.error(err);
    } finally {
      setLoading(null);
    }
  };

  const totalRecords = stats ? Object.values(stats).reduce((sum, arr) => sum + arr.length, 0) : 0;

  const dateLabel = allTime
    ? 'Todas as datas'
    : dateRange?.from && dateRange?.to
      ? `${format(dateRange.from, 'dd/MM/yy', { locale: ptBR })} - ${format(dateRange.to, 'dd/MM/yy', { locale: ptBR })}`
      : dateRange?.from
        ? `A partir de ${format(dateRange.from, 'dd/MM/yy', { locale: ptBR })}`
        : 'Selecione um período';

  return (
    <div className="mx-auto max-w-5xl space-y-5 px-4 py-6">
      <div className="flex items-center gap-3">
        <Link to="/perfil">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-foreground">Exportar Dados</h1>
      </div>

      {/* Date range filter */}
      <Card className="border-border/50 bg-card">
        <CardContent className="space-y-3 p-4">
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
                <div className="flex items-center gap-2 border-b border-border px-3 py-2">
                  <Checkbox
                    id="all-time"
                    checked={allTime}
                    onCheckedChange={(checked) => {
                      setAllTime(!!checked);
                      if (checked) setDateRange(undefined);
                    }}
                  />
                  <label htmlFor="all-time" className="text-sm font-medium text-foreground cursor-pointer select-none">
                    Tempo integral
                  </label>
                </div>
                <Calendar
                  mode="range"
                  selected={allTime ? undefined : dateRange}
                  onSelect={(range) => {
                    setDateRange(range);
                    if (range?.from) setAllTime(false);
                  }}
                  numberOfMonths={1}
                  locale={ptBR}
                  disabled={allTime}
                  className="pointer-events-auto p-3"
                />
              </PopoverContent>
            </Popover>
            {!allTime && dateRange?.from && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground"
                onClick={() => {
                  setDateRange(undefined);
                  setAllTime(true);
                }}
              >
                Limpar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Profile filter - only show if there are profiles */}
      {profiles && profiles.length > 0 && (
        <Card className="border-border/50 bg-card">
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Users className="h-4 w-4 text-primary" />
              Membro
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedProfileId === null ? 'default' : 'outline'}
                size="sm"
                className="text-xs"
                onClick={() => setSelectedProfileId(null)}
              >
                Todos
              </Button>
              {profiles.map((p) => (
                <Button
                  key={p.id}
                  variant={selectedProfileId === p.id ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs"
                  onClick={() => setSelectedProfileId(p.id)}
                >
                  {p.icon} {p.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {stats && (
        <Card className="border-border/50 bg-card">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">{totalRecords}</strong> registros encontrados em{' '}
              <strong className="text-foreground">{Object.entries(stats).filter(([, v]) => v.length > 0).length}</strong> tabelas
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
                  <CheckCircle2 className="h-4 w-4 text-primary" />
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

