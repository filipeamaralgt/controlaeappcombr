import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Loader2, Users, ShieldAlert } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/hooks/useAuth';
import { getLeads, type Lead } from '@/services/leadsClient';
import { Button } from '@/components/ui/button';
import { PageBackHeader } from '@/components/PageBackHeader';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const MASTER_EMAILS = ['monicahartmann99@gmail.com', 'filipeamaralgt@gmail.com'];

const statusConfig: Record<string, { label: string; className: string }> = {
  lead: { label: 'Lead', className: 'bg-muted text-muted-foreground' },
  assinante: { label: 'Assinante', className: 'bg-primary/15 text-primary' },
  cancelado: { label: 'Cancelado', className: 'bg-destructive/15 text-destructive' },
};

function UtmBadge({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <span className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground whitespace-nowrap">
      {label}: <strong className="ml-0.5 text-foreground">{value}</strong>
    </span>
  );
}

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
    if (!authLoading && isMaster) fetchLeads();
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

  const totalLeads = leads.length;
  const assinantes = leads.filter(l => l.status === 'assinante').length;
  const cancelados = leads.filter(l => l.status === 'cancelado').length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-5">
      <PageBackHeader title="Leads" />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span className="text-sm font-medium">{totalLeads}</span>
          </div>
          {assinantes > 0 && (
            <Badge variant="secondary" className="bg-primary/15 text-primary text-[11px]">
              {assinantes} assinante{assinantes !== 1 ? 's' : ''}
            </Badge>
          )}
          {cancelados > 0 && (
            <Badge variant="secondary" className="bg-destructive/15 text-destructive text-[11px]">
              {cancelados} cancelado{cancelados !== 1 ? 's' : ''}
            </Badge>
          )}
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
        <div className="rounded-xl border border-border bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="whitespace-nowrap min-w-[160px]">Nome</TableHead>
                <TableHead className="whitespace-nowrap min-w-[200px]">Email</TableHead>
                <TableHead className="whitespace-nowrap min-w-[130px]">WhatsApp</TableHead>
                <TableHead className="whitespace-nowrap min-w-[90px]">Status</TableHead>
                <TableHead className="whitespace-nowrap min-w-[90px]">Plano</TableHead>
                <TableHead className="whitespace-nowrap min-w-[110px]">Cadastro</TableHead>
                <TableHead className="whitespace-nowrap min-w-[110px]">Pagamento</TableHead>
                <TableHead className="whitespace-nowrap min-w-[110px]">Vencimento</TableHead>
                <TableHead className="whitespace-nowrap min-w-[110px]">Cancelamento</TableHead>
                <TableHead className="whitespace-nowrap min-w-[90px]">Source</TableHead>
                <TableHead className="whitespace-nowrap min-w-[90px]">Medium</TableHead>
                <TableHead className="whitespace-nowrap min-w-[100px]">Campaign</TableHead>
                <TableHead className="whitespace-nowrap min-w-[90px]">Content</TableHead>
                <TableHead className="whitespace-nowrap min-w-[90px]">Term</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead) => {
                const status = statusConfig[lead.status] || statusConfig.lead;
                const hasUtm = lead.utm_source || lead.utm_medium || lead.utm_campaign || lead.utm_content || lead.utm_term;

                return (
                  <TableRow key={lead.id} className="group">
                    <TableCell className="font-medium whitespace-nowrap">{lead.name}</TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">{lead.email}</TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {lead.whatsapp || <span className="text-muted-foreground/40">—</span>}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`text-[11px] whitespace-nowrap ${status.className}`}>
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap capitalize">
                      {lead.subscription_type || <span className="text-muted-foreground/40">—</span>}
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap text-xs">
                      {format(new Date(lead.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap text-xs">
                      {lead.payment_date
                        ? format(new Date(lead.payment_date), "dd/MM/yy HH:mm", { locale: ptBR })
                        : <span className="text-muted-foreground/40">—</span>}
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap text-xs">
                      {lead.subscription_end
                        ? format(new Date(lead.subscription_end), "dd/MM/yy", { locale: ptBR })
                        : <span className="text-muted-foreground/40">—</span>}
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap text-xs">
                      {lead.canceled_at
                        ? format(new Date(lead.canceled_at), "dd/MM/yy HH:mm", { locale: ptBR })
                        : <span className="text-muted-foreground/40">—</span>}
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap text-xs">
                      {lead.utm_source || <span className="text-muted-foreground/40">—</span>}
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap text-xs">
                      {lead.utm_medium || <span className="text-muted-foreground/40">—</span>}
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap text-xs">
                      {lead.utm_campaign || <span className="text-muted-foreground/40">—</span>}
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap text-xs">
                      {lead.utm_content || <span className="text-muted-foreground/40">—</span>}
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap text-xs">
                      {lead.utm_term || <span className="text-muted-foreground/40">—</span>}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
