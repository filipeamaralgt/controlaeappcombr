import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CloudCog, RefreshCw, CheckCircle2, WifiOff, AlertTriangle, Loader2, Database } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { fetchAllUserData } from '@/lib/exportUtils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline';

export default function BackupDados() {
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [recordCount, setRecordCount] = useState(0);
  const [tableDetails, setTableDetails] = useState<{ name: string; count: number }[]>([]);

  const checkConnection = async () => {
    try {
      const { error } = await supabase.from('profiles').select('id').limit(1);
      if (error) throw error;
      return true;
    } catch {
      return false;
    }
  };

  const syncNow = async () => {
    setStatus('syncing');
    try {
      const isOnline = navigator.onLine;
      if (!isOnline) {
        setStatus('offline');
        toast.error('Sem conexão com a internet');
        return;
      }

      const connected = await checkConnection();
      if (!connected) {
        setStatus('error');
        toast.error('Não foi possível conectar ao Supabase');
        return;
      }

      const data = await fetchAllUserData();
      const details = [
        { name: 'Transações', count: data.transactions.length },
        { name: 'Categorias', count: data.categories.length },
        { name: 'Metas', count: data.goals.length },
        { name: 'Dívidas', count: data.debts.length },
        { name: 'Parcelas', count: data.installments.length },
        { name: 'Limites', count: data.budget_limits.length },
        { name: 'Pagamentos Recorrentes', count: data.recurring_payments.length },
        { name: 'Lembretes', count: data.reminders.length },
      ];

      const total = details.reduce((s, d) => s + d.count, 0);
      setTableDetails(details);
      setRecordCount(total);
      setLastSync(new Date());
      setStatus('synced');
      toast.success('Dados sincronizados!');
    } catch (err) {
      setStatus('error');
      toast.error('Erro ao verificar dados');
      console.error(err);
    }
  };

  useEffect(() => {
    syncNow();
  }, []);

  const statusConfig = {
    idle: { icon: CloudCog, color: 'text-muted-foreground', bg: 'bg-muted', label: 'Verificando...' },
    syncing: { icon: Loader2, color: 'text-primary', bg: 'bg-primary/10', label: 'Sincronizando...' },
    synced: { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10', label: 'Sincronizado' },
    error: { icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10', label: 'Erro de conexão' },
    offline: { icon: WifiOff, color: 'text-orange-500', bg: 'bg-orange-500/10', label: 'Offline' },
  };

  const cfg = statusConfig[status];
  const StatusIcon = cfg.icon;

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
      <div className="flex items-center gap-3">
        <Link to="/perfil">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <h1 className="text-xl font-bold text-foreground">Backup & Sincronização</h1>
      </div>

      {/* Status Card */}
      <Card className="border-border/50 bg-card">
        <CardContent className="flex flex-col items-center gap-4 p-8">
          <div className={`flex h-20 w-20 items-center justify-center rounded-full ${cfg.bg}`}>
            <StatusIcon className={`h-10 w-10 ${cfg.color} ${status === 'syncing' ? 'animate-spin' : ''}`} />
          </div>
          <div className="text-center">
            <p className={`text-lg font-semibold ${cfg.color}`}>{cfg.label}</p>
            {lastSync && (
              <p className="text-sm text-muted-foreground">
                Última verificação: {format(lastSync, "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
              </p>
            )}
          </div>
          <Button
            onClick={syncNow}
            disabled={status === 'syncing'}
            variant={status === 'synced' ? 'outline' : 'default'}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${status === 'syncing' ? 'animate-spin' : ''}`} />
            Sincronizar agora
          </Button>
        </CardContent>
      </Card>

      {/* Data details */}
      {tableDetails.length > 0 && (
        <Card className="border-border/50 bg-card">
          <CardContent className="p-0">
            <div className="flex items-center gap-3 border-b border-border/50 p-4">
              <Database className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-foreground">Dados no Supabase</p>
                <p className="text-sm text-muted-foreground">{recordCount} registros em {tableDetails.filter(t => t.count > 0).length} tabelas</p>
              </div>
            </div>
            {tableDetails.map((t, i) => (
              <div
                key={t.name}
                className={`flex items-center justify-between px-4 py-3 ${
                  i < tableDetails.length - 1 ? 'border-b border-border/30' : ''
                }`}
              >
                <span className="text-sm text-foreground">{t.name}</span>
                <span className="text-sm font-medium text-muted-foreground">{t.count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Info */}
      <Card className="border-border/50 bg-card">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">
            💡 Todos os seus dados são salvos automaticamente no Supabase em tempo real.
            Esta tela verifica a integridade e mostra o status da conexão.
            Para um backup local, use a opção <Link to="/exportar-dados" className="font-medium text-primary underline">Exportar Dados</Link>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
