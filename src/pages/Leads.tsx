import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Loader2, Users, ShieldAlert, Phone, Mail, Calendar, Tag, Globe, Megaphone } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/hooks/useAuth';
import { getLeads, type Lead } from '@/services/leadsClient';
import { Button } from '@/components/ui/button';
import { PageBackHeader } from '@/components/PageBackHeader';
import { Badge } from '@/components/ui/badge';

const MASTER_EMAILS = ['monicahartmann99@gmail.com', 'filipeamaralgt@gmail.com'];

const statusConfig: Record<string, { label: string; className: string }> = {
  lead: { label: 'Lead', className: 'bg-muted text-muted-foreground' },
  assinante: { label: 'Assinante', className: 'bg-primary/15 text-primary' },
  cancelado: { label: 'Cancelado', className: 'bg-destructive/15 text-destructive' },
};

function LeadCard({ lead }: { lead: Lead }) {
  const status = statusConfig[lead.status] || statusConfig.lead;
  const hasUtm = lead.utm_source || lead.utm_medium || lead.utm_campaign || lead.utm_content || lead.utm_term;

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-foreground truncate">{lead.name}</p>
          <p className="text-sm text-muted-foreground truncate flex items-center gap-1.5 mt-0.5">
            <Mail className="h-3.5 w-3.5 shrink-0" />
            {lead.email}
          </p>
        </div>
        <Badge variant="secondary" className={`shrink-0 text-[11px] ${status.className}`}>
          {status.label}
        </Badge>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
        {lead.whatsapp && (
          <div className="flex items-center gap-1.5 text-muted-foreground col-span-2">
            <Phone className="h-3.5 w-3.5 shrink-0" />
            <span>{lead.whatsapp}</span>
          </div>
        )}
        {lead.subscription_type && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Tag className="h-3.5 w-3.5 shrink-0" />
            <span className="capitalize">{lead.subscription_type}</span>
          </div>
        )}
        {lead.payment_method && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <span className="text-xs">💳</span>
            <span className="capitalize">{lead.payment_method}</span>
          </div>
        )}
        {lead.payment_date && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span>{format(new Date(lead.payment_date), 'dd/MM/yyyy', { locale: ptBR })}</span>
          </div>
        )}
      </div>

      {/* UTMs */}
      {hasUtm && (
        <div className="border-t border-border/50 pt-2.5 space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 flex items-center gap-1">
            <Globe className="h-3 w-3" /> UTMs
          </p>
          <div className="flex flex-wrap gap-1.5">
            {lead.utm_source && (
              <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                source: <strong className="ml-0.5 text-foreground">{lead.utm_source}</strong>
              </span>
            )}
            {lead.utm_medium && (
              <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                medium: <strong className="ml-0.5 text-foreground">{lead.utm_medium}</strong>
              </span>
            )}
            {lead.utm_campaign && (
              <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                campaign: <strong className="ml-0.5 text-foreground">{lead.utm_campaign}</strong>
              </span>
            )}
            {lead.utm_content && (
              <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                content: <strong className="ml-0.5 text-foreground">{lead.utm_content}</strong>
              </span>
            )}
            {lead.utm_term && (
              <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                term: <strong className="ml-0.5 text-foreground">{lead.utm_term}</strong>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <p className="text-[11px] text-muted-foreground/60 text-right">
        {format(new Date(lead.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
      </p>
    </div>
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

  // Stats
  const totalLeads = leads.length;
  const assinantes = leads.filter(l => l.status === 'assinante').length;
  const cancelados = leads.filter(l => l.status === 'cancelado').length;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">
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
        <div className="grid gap-3">
          {leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} />
          ))}
        </div>
      )}
    </div>
  );
}
