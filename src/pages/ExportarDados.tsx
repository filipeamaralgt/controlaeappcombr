import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ArrowLeft, FileSpreadsheet, FileText, FileDown, Loader2, CheckCircle2, CalendarIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  buildExcelFile,
  buildPdfFile,
  downloadBlob,
  fetchAllUserData,
  type ExportBuiltFile,
  type ExportOptions,
  type UserData,
} from '@/lib/exportUtils';
import type { DateRange } from 'react-day-picker';

type ExportFormat = 'excel' | 'pdf';

type ReadyFiles = Partial<Record<ExportFormat, ExportBuiltFile>>;

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
  const [readyFiles, setReadyFiles] = useState<ReadyFiles>({});

  const isEmbedded = (() => {
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  })();

  const buildOptions = (): ExportOptions => ({
    startDate: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
    endDate: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
  });

  const handleExport = async (fmt: ExportFormat) => {
    // No preview (iframe), downloads automáticos após await podem ser bloqueados.
    // Pré-abrimos uma aba aqui para garantir que o arquivo consiga ser aberto/baixado.
    const popup = isEmbedded ? window.open('', '_blank') : null;

    setLoading(fmt);
    setDone(null);

    try {
      const data = await fetchAllUserData(buildOptions());
      setStats(data);

      const file = fmt === 'excel' ? buildExcelFile(data) : buildPdfFile(data);
      setReadyFiles((prev) => ({ ...prev, [fmt]: file }));

      downloadBlob(file.blob, file.filename, { preOpenedWindow: popup });

      setDone(fmt);
      toast.success('Arquivo gerado. Se não baixar, use os botões abaixo.');
    } catch (err) {
      toast.error('Erro ao exportar dados');
      console.error(err);
    } finally {
      setLoading(null);
    }
  };

  const handleExportAll = async () => {
    const popup = isEmbedded ? window.open('', '_blank') : null;

    setLoading('excel');
    try {
      const data = await fetchAllUserData(buildOptions());
      setStats(data);

      const excelFile = buildExcelFile(data);
      const pdfFile = buildPdfFile(data);

      setReadyFiles({ excel: excelFile, pdf: pdfFile });

      // Em iframe: abre pelo menos o Excel na aba pré-aberta (o PDF fica disponível nos botões abaixo).
      downloadBlob(excelFile.blob, excelFile.filename, { preOpenedWindow: popup });
      if (!isEmbedded) {
        downloadBlob(pdfFile.blob, pdfFile.filename);
      }

      setDone('excel');
      toast.success('Arquivos gerados. Se precisar, baixe pelos botões abaixo.');
    } catch (err) {
      toast.error('Erro ao exportar');
      console.error(err);
    } finally {
      setLoading(null);
    }
  };

  const totalRecords = stats ? Object.values(stats).reduce((sum, arr) => sum + arr.length, 0) : 0;

  const dateLabel =
    dateRange?.from && dateRange?.to
      ? `${format(dateRange.from, 'dd/MM/yy', { locale: ptBR })} - ${format(dateRange.to, 'dd/MM/yy', { locale: ptBR })}`
      : dateRange?.from
        ? `A partir de ${format(dateRange.from, 'dd/MM/yy', { locale: ptBR })}`
        : 'Todas as datas';

  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 py-6">
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
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={1}
                  locale={ptBR}
                  className="pointer-events-auto p-3"
                />
              </PopoverContent>
            </Popover>
            {dateRange?.from && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground"
                onClick={() => setDateRange(undefined)}
              >
                Limpar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

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

      {(readyFiles.excel || readyFiles.pdf) && (
        <Card className="border-border/50 bg-card">
          <CardContent className="space-y-3 p-4">
            <div>
              <p className="text-sm font-medium text-foreground">Downloads prontos</p>
              <p className="text-xs text-muted-foreground">
                Se o download automático não iniciar no preview, use os botões abaixo (abre em nova aba).
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {readyFiles.excel && (
                <Button
                  size="sm"
                  onClick={() => {
                    const popup = isEmbedded ? window.open('', '_blank') : null;
                    downloadBlob(readyFiles.excel!.blob, readyFiles.excel!.filename, { preOpenedWindow: popup, openInNewTab: isEmbedded });
                  }}
                >
                  <FileDown className="mr-2 h-4 w-4" />
                  Baixar Excel
                </Button>
              )}
              {readyFiles.pdf && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const popup = isEmbedded ? window.open('', '_blank') : null;
                    downloadBlob(readyFiles.pdf!.blob, readyFiles.pdf!.filename, { preOpenedWindow: popup, openInNewTab: isEmbedded });
                  }}
                >
                  <FileDown className="mr-2 h-4 w-4" />
                  Baixar PDF
                </Button>
              )}

              {isEmbedded && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs text-muted-foreground"
                  onClick={() => window.open(window.location.href, '_blank')}
                >
                  Abrir esta tela em nova aba
                </Button>
              )}
            </div>
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

