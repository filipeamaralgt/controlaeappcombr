import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Loader2, Users, ShieldAlert, Search, Download, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import { useAuth } from '@/hooks/useAuth';
import { getLeads, type Lead } from '@/services/leadsClient';
import { Button } from '@/components/ui/button';
import { PageBackHeader } from '@/components/PageBackHeader';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

const MASTER_EMAILS = ['monicahartmann99@gmail.com', 'filipeamaralgt@gmail.com'];

const statusConfig: Record<string, { label: string; className: string }> = {
  lead: { label: 'Lead', className: 'bg-muted text-muted-foreground' },
  assinante: { label: 'Assinante', className: 'bg-primary/15 text-primary' },
  cancelado: { label: 'Cancelado', className: 'bg-destructive/15 text-destructive' },
};

const fmtDate = (d: string | null, withTime = true) => {
  if (!d) return '—';
  return format(new Date(d), withTime ? 'dd/MM/yy HH:mm' : 'dd/MM/yy', { locale: ptBR });
};

type SortKey = 'name' | 'email' | 'status' | 'created_at' | 'payment_date' | 'subscription_end' | 'canceled_at' | null;
type SortDir = 'asc' | 'desc';

function SortIcon({ column, sortKey, sortDir }: { column: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (sortKey !== column) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
  return sortDir === 'asc'
    ? <ArrowUp className="h-3 w-3 ml-1" />
    : <ArrowDown className="h-3 w-3 ml-1" />;
}

function SortableHead({ column, label, sortKey, sortDir, onSort, className = '' }: {
  column: SortKey; label: string; sortKey: SortKey; sortDir: SortDir;
  onSort: (col: SortKey) => void; className?: string;
}) {
  return (
    <TableHead
      className={`whitespace-nowrap cursor-pointer select-none hover:text-foreground transition-colors ${className}`}
      onClick={() => onSort(column)}
    >
      <span className="inline-flex items-center">
        {label}
        <SortIcon column={column} sortKey={sortKey} sortDir={sortDir} />
      </span>
    </TableHead>
  );
}

export default function Leads() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(20);
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const isMaster = user?.email && MASTER_EMAILS.includes(user.email);

  const handleSort = useCallback((col: SortKey) => {
    if (sortKey === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(col);
      setSortDir('asc');
    }
  }, [sortKey]);

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

  const filteredLeads = useMemo(() => {
    let result = leads;
    if (statusFilter !== 'all') {
      result = result.filter(l => l.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(l =>
        l.name.toLowerCase().includes(q) || l.email.toLowerCase().includes(q)
      );
    }
    // Sort
    if (sortKey) {
      result = [...result].sort((a, b) => {
        const aVal = a[sortKey] ?? '';
        const bVal = b[sortKey] ?? '';
        const cmp = String(aVal).localeCompare(String(bVal), 'pt-BR', { sensitivity: 'base' });
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return result;
  }, [leads, statusFilter, search, sortKey, sortDir]);

  // Reset page when filters change
  useEffect(() => { setPage(0); }, [statusFilter, search]);

  const totalPages = Math.ceil(filteredLeads.length / perPage);
  const paginatedLeads = filteredLeads.slice(page * perPage, (page + 1) * perPage);

  const exportToExcel = useCallback(() => {
    const rows = filteredLeads.map((l, i) => ({
      '#': i + 1,
      Nome: l.name,
      Email: l.email,
      WhatsApp: l.whatsapp || '',
      Status: statusConfig[l.status]?.label || l.status,
      Plano: l.subscription_type || '',
      Cadastro: fmtDate(l.created_at),
      Pagamento: fmtDate(l.payment_date),
      Vencimento: fmtDate(l.subscription_end, false),
      Cancelamento: fmtDate(l.canceled_at),
      'UTM Source': l.utm_source || '',
      'UTM Medium': l.utm_medium || '',
      'UTM Campaign': l.utm_campaign || '',
      'UTM Content': l.utm_content || '',
      'UTM Term': l.utm_term || '',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Leads');
    XLSX.writeFile(wb, `leads_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  }, [filteredLeads]);

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
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportToExcel} disabled={loading || filteredLeads.length === 0}>
            <Download className="h-4 w-4" />
            Exportar
          </Button>
          <Button variant="outline" size="sm" onClick={fetchLeads} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-9 text-sm"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px] h-9 text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="lead">Lead</SelectItem>
            <SelectItem value="assinante">Assinante</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>
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
      ) : filteredLeads.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center space-y-2">
          <Users className="h-10 w-10 mx-auto text-muted-foreground/50" />
          <p className="text-muted-foreground">
            {leads.length === 0 ? 'Nenhum lead cadastrado ainda.' : 'Nenhum lead encontrado com os filtros atuais.'}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="whitespace-nowrap min-w-[50px] text-center">#</TableHead>
                <SortableHead column="name" label="Nome" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="min-w-[160px]" />
                <SortableHead column="email" label="Email" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="min-w-[200px]" />
                <TableHead className="whitespace-nowrap min-w-[130px]">WhatsApp</TableHead>
                <SortableHead column="status" label="Status" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="min-w-[90px]" />
                <TableHead className="whitespace-nowrap min-w-[90px]">Plano</TableHead>
                <SortableHead column="created_at" label="Cadastro" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="min-w-[110px]" />
                <SortableHead column="payment_date" label="Pagamento" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="min-w-[110px]" />
                <SortableHead column="subscription_end" label="Vencimento" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="min-w-[110px]" />
                <SortableHead column="canceled_at" label="Cancelamento" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="min-w-[110px]" />
                <TableHead className="whitespace-nowrap min-w-[90px]">Source</TableHead>
                <TableHead className="whitespace-nowrap min-w-[90px]">Medium</TableHead>
                <TableHead className="whitespace-nowrap min-w-[100px]">Campaign</TableHead>
                <TableHead className="whitespace-nowrap min-w-[90px]">Content</TableHead>
                <TableHead className="whitespace-nowrap min-w-[90px]">Term</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedLeads.map((lead, idx) => {
                const status = statusConfig[lead.status] || statusConfig.lead;
                const rowNum = page * perPage + idx + 1;
                return (
                  <TableRow key={lead.id} className="group">
                    <TableCell className="text-muted-foreground text-xs text-center tabular-nums">{rowNum}</TableCell>
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
                      {fmtDate(lead.created_at)}
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap text-xs">
                      {lead.payment_date ? fmtDate(lead.payment_date) : <span className="text-muted-foreground/40">—</span>}
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap text-xs">
                      {lead.subscription_end ? fmtDate(lead.subscription_end, false) : <span className="text-muted-foreground/40">—</span>}
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap text-xs">
                      {lead.canceled_at ? fmtDate(lead.canceled_at) : <span className="text-muted-foreground/40">—</span>}
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
          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{filteredLeads.length} resultado{filteredLeads.length !== 1 ? 's' : ''}</span>
              <span>·</span>
              <Select value={String(perPage)} onValueChange={v => { setPerPage(Number(v)); setPage(0); }}>
                <SelectTrigger className="h-7 w-[70px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <span>por página</span>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground px-2">
                {page + 1} / {totalPages || 1}
              </span>
              <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
