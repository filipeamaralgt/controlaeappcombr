import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Loader2, Users, ShieldAlert } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/hooks/useAuth';
import { getLeads, type Lead } from '@/services/leadsClient';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageBackHeader } from '@/components/PageBackHeader';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

const MASTER_EMAILS = ['monicahartmann99@gmail.com', 'filipeamaralgt@gmail.com'];

const statusColors: Record<string, string> = {
  lead: 'bg-muted text-muted-foreground',
  assinante: 'bg-primary/15 text-primary',
  cancelado: 'bg-destructive/15 text-destructive',
};

export default function Leads() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isMaster = user?.email && MASTER_EMAILS.includes(user.email);

  const fetchLeads = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getLeads();
      setLeads(data);
    } catch (err: any) {
      setError(err?.message || 'Erro ao carregar leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && isMaster) {
      fetchLeads();
    }
  }, [authLoading, isMaster]);

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isMaster) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center space-y-4">
        <ShieldAlert className="h-12 w-12 mx-auto text-destructive" />
        <h1 className="text-xl font-bold text-foreground">Acesso restrito</h1>
        <p className="text-muted-foreground">Apenas administradores podem acessar esta página.</p>
        <Button variant="outline" onClick={() => navigate('/')}>Voltar ao início</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
      <PageBackHeader title="Leads" />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Users className="h-5 w-5" />
          <span className="text-sm font-medium">{leads.length} lead{leads.length !== 1 ? 's' : ''}</span>
        </div>
        <Button variant="outline" size="sm" onClick={fetchLeads} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={fetchLeads}>Tentar novamente</Button>
        </div>
      ) : leads.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center space-y-2">
          <Users className="h-10 w-10 mx-auto text-muted-foreground/50" />
          <p className="text-muted-foreground">Nenhum lead cadastrado ainda.</p>
        </div>
      ) : (
        <ScrollArea className="rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Data Pgto</TableHead>
                <TableHead>UTM Source</TableHead>
                <TableHead>UTM Medium</TableHead>
                <TableHead>UTM Campaign</TableHead>
                <TableHead className="text-right">Cadastro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium whitespace-nowrap">{lead.name}</TableCell>
                  <TableCell className="text-muted-foreground">{lead.email}</TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">{lead.whatsapp || '—'}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={statusColors[lead.status] || statusColors.lead}>
                      {lead.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{lead.subscription_type || '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{lead.user_type || '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{lead.payment_method || '—'}</TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {lead.payment_date
                      ? format(new Date(lead.payment_date), 'dd/MM/yyyy', { locale: ptBR })
                      : '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">{lead.utm_source || '—'}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{lead.utm_medium || '—'}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{lead.utm_campaign || '—'}</TableCell>
                  <TableCell className="text-right text-muted-foreground whitespace-nowrap">
                    {format(new Date(lead.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}
    </div>
  );
}
