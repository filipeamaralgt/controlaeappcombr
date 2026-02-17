import { useState, useMemo, useCallback, useEffect } from 'react';
import { Transaction } from '@/hooks/useTransactions';
import { Trash2, ArrowUp, ArrowDown, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CategoryIcon } from '@/components/CategoryIcon';
import { SwipeableRow } from '@/components/SwipeableRow';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSpendingProfiles } from '@/hooks/useSpendingProfiles';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (params: { id: string; installment_group_id?: string | null }) => void;
  onEdit?: (transaction: Transaction) => void;
  onDuplicate?: (transaction: Transaction) => void;
  preserveOrder?: boolean;
}

interface GroupedTransaction {
  representative: Transaction;
  totalAmount: number;
  installmentIds: string[];
}

function groupInstallments(transactions: Transaction[], preserveOrder = false): GroupedTransaction[] {
  const groups = new Map<string, Transaction[]>();
  const standalone: Transaction[] = [];

  for (const t of transactions) {
    if (t.installment_group_id && t.installment_total > 1) {
      const existing = groups.get(t.installment_group_id);
      if (existing) {
        existing.push(t);
      } else {
        groups.set(t.installment_group_id, [t]);
      }
    } else {
      standalone.push(t);
    }
  }

  const result: GroupedTransaction[] = standalone.map((t) => ({
    representative: t,
    totalAmount: t.amount,
    installmentIds: [t.id],
  }));

  for (const [, items] of groups) {
    items.sort((a, b) => (a.installment_number ?? 0) - (b.installment_number ?? 0));
    const totalAmount = items.reduce((sum, t) => sum + Number(t.amount), 0);
    result.push({
      representative: items[0],
      totalAmount,
      installmentIds: items.map((t) => t.id),
    });
  }

  if (!preserveOrder) {
    result.sort((a, b) => b.representative.date.localeCompare(a.representative.date));
  }
  return result;
}

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function SortableHead({
  sortKey: key,
  currentKey,
  dir,
  onToggle,
  className,
  children,
}: {
  sortKey: SortKey;
  currentKey: SortKey;
  dir: SortDir;
  onToggle: (k: SortKey) => void;
  className?: string;
  children: React.ReactNode;
}) {
  const isActive = key === currentKey;
  const Icon = isActive ? (dir === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <TableHead className={cn(className, 'select-none', isActive && 'bg-muted/40')}>
      <button
        className={cn(
          'inline-flex items-center gap-1 transition-colors',
          isActive ? 'text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'
        )}
        onClick={() => onToggle(key)}
      >
        {children}
        <Icon className={cn('h-3 w-3 shrink-0', isActive ? 'text-primary' : 'text-muted-foreground/40')} />
      </button>
    </TableHead>
  );
}

type SortKey = 'category' | 'description' | 'date' | 'person' | 'installments' | 'notes' | 'amount';
type SortDir = 'asc' | 'desc';

export function TransactionList({ transactions, onDelete, onEdit, onDuplicate, preserveOrder }: TransactionListProps) {
  const isMobile = useIsMobile();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; installment_group_id?: string | null } | null>(null);
  const { data: profiles } = useSpendingProfiles();
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const grouped = useMemo(() => groupInstallments(transactions, preserveOrder), [transactions, preserveOrder]);

  const profileMap = useMemo(() => {
    const map = new Map<string, { name: string; icon: string; color: string }>();
    profiles?.forEach((p) => map.set(p.id, { name: p.name, icon: p.icon, color: p.color }));
    return map;
  }, [profiles]);

  const toggleSort = useCallback((key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'amount' || key === 'date' ? 'desc' : 'asc');
    }
  }, [sortKey]);

  const sortedGrouped = useMemo(() => {
    const list = [...grouped];
    const dir = sortDir === 'asc' ? 1 : -1;
    list.sort((a, b) => {
      const ta = a.representative;
      const tb = b.representative;
      switch (sortKey) {
        case 'category':
          return dir * (ta.categories?.name || '').localeCompare(tb.categories?.name || '');
        case 'description':
          return dir * ta.description.localeCompare(tb.description);
        case 'date':
          return dir * ta.date.localeCompare(tb.date);
        case 'person': {
          const pa = ta.profile_id ? profileMap.get(ta.profile_id)?.name || '' : '';
          const pb = tb.profile_id ? profileMap.get(tb.profile_id)?.name || '' : '';
          return dir * pa.localeCompare(pb);
        }
        case 'installments':
          return dir * ((ta.installment_total || 0) - (tb.installment_total || 0));
        case 'notes':
          return dir * (ta.notes || '').localeCompare(tb.notes || '');
        case 'amount':
          return dir * (a.totalAmount - b.totalAmount);
        default:
          return 0;
      }
    });
    return list;
  }, [grouped, sortKey, sortDir, profileMap]);

  const totalPages = Math.ceil(sortedGrouped.length / pageSize);
  const paginatedGrouped = useMemo(
    () => sortedGrouped.slice(page * pageSize, (page + 1) * pageSize),
    [sortedGrouped, page, pageSize]
  );

  // Reset page when data changes
  useEffect(() => { setPage(0); }, [transactions, sortKey, sortDir]);

  if (transactions.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Nenhuma transação encontrada
      </p>
    );
  }

  // Desktop table view
  if (!isMobile) {
    return (
      <>
        <ScrollArea className="w-full">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHead sortKey="category" currentKey={sortKey} dir={sortDir} onToggle={toggleSort} className="w-[140px]">Categoria</SortableHead>
                <SortableHead sortKey="description" currentKey={sortKey} dir={sortDir} onToggle={toggleSort} className="min-w-[120px]">Descrição</SortableHead>
                <SortableHead sortKey="date" currentKey={sortKey} dir={sortDir} onToggle={toggleSort} className="w-[95px]">Data</SortableHead>
                <SortableHead sortKey="person" currentKey={sortKey} dir={sortDir} onToggle={toggleSort} className="w-[110px]">Pessoa</SortableHead>
                <SortableHead sortKey="installments" currentKey={sortKey} dir={sortDir} onToggle={toggleSort} className="w-[80px] text-center">Parcelas</SortableHead>
                <SortableHead sortKey="notes" currentKey={sortKey} dir={sortDir} onToggle={toggleSort} className="min-w-[100px] max-w-[200px]">Observação</SortableHead>
                <SortableHead sortKey="amount" currentKey={sortKey} dir={sortDir} onToggle={toggleSort} className="w-[110px] text-right">Valor</SortableHead>
                <TableHead className="w-[36px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedGrouped.map((group, index) => {
                const t = group.representative;
                const profile = t.profile_id ? profileMap.get(t.profile_id) : null;
                return (
                  <TableRow
                    key={t.installment_group_id || t.id}
                    className={cn(
                      'transition-all',
                      index % 2 === 1 && 'bg-muted/30',
                      onEdit && 'cursor-pointer'
                    )}
                    onClick={() => onEdit?.(t)}
                  >
                    <TableCell className="pr-0">
                      <div className="flex items-center gap-2">
                        <div
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                          style={{ backgroundColor: t.categories?.color || '#6b7280' }}
                        >
                          <CategoryIcon iconName={t.categories?.icon} className="h-3 w-3 text-white" />
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{t.categories?.name || 'Outros'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{t.description}</TableCell>
                    <TableCell className="text-muted-foreground text-xs tabular-nums whitespace-nowrap">
                      {format(parseISO(t.date), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {profile ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex items-center gap-1.5 cursor-default">
                                <span
                                  className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px]"
                                  style={{ backgroundColor: profile.color }}
                                >
                                  {profile.icon}
                                </span>
                                {profile.name}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{profile.name}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs tabular-nums text-center">
                      {t.installment_total > 1
                        ? `${t.installment_number}/${t.installment_total}`
                        : '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs max-w-[200px] truncate">
                      {t.notes || '—'}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      <span className={cn(
                        'text-sm font-semibold',
                        t.type === 'income' ? 'text-success' : 'text-foreground'
                      )}>
                        {t.type === 'income' ? '+' : '-'}{formatCurrency(group.totalAmount)}
                      </span>
                    </TableCell>
                    <TableCell className="pl-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget({ id: t.id, installment_group_id: t.installment_group_id });
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {sortedGrouped.length > 10 && (
          <div className="flex items-center justify-between pt-3">
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground">
                {page * pageSize + 1}–{Math.min((page + 1) * pageSize, sortedGrouped.length)} de {sortedGrouped.length}
              </p>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}
                className="h-7 rounded-md border border-input bg-background px-2 text-xs text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value={10}>10 / pág</option>
                <option value={20}>20 / pág</option>
                <option value={50}>50 / pág</option>
              </select>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs text-muted-foreground px-2 tabular-nums">
                  {page + 1} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}

        <DeleteConfirmDialog
          open={!!deleteTarget}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          title={deleteTarget?.installment_group_id ? 'Excluir todas as parcelas' : 'Excluir transação'}
          description={deleteTarget?.installment_group_id ? 'Tem certeza que deseja excluir todas as parcelas desta transação? Essa ação não pode ser desfeita.' : 'Tem certeza que deseja excluir esta transação? Essa ação não pode ser desfeita.'}
          onConfirm={() => {
            if (deleteTarget) {
              onDelete(deleteTarget);
              setDeleteTarget(null);
            }
          }}
        />
      </>
    );
  }

  // Mobile card view (unchanged)
  return (
    <>
      <div className="space-y-2">
        {grouped.map((group, index) => {
          const t = group.representative;
          return (
            <SwipeableRow
              key={t.installment_group_id || t.id}
              onEdit={() => onEdit?.(t)}
              onDelete={() => setDeleteTarget({ id: t.id, installment_group_id: t.installment_group_id })}
              onDuplicate={() => onDuplicate?.(t)}
            >
              <div
                className={cn(
                  'flex items-center gap-3 rounded-xl bg-card p-3 transition-all animate-fade-in',
                  onEdit && 'cursor-pointer active:scale-[0.98]'
                )}
                style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'backwards' }}
                onClick={() => onEdit?.(t)}
              >
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: t.categories?.color || '#6b7280' }}
                >
                  <CategoryIcon
                    iconName={t.categories?.icon}
                    className="h-3.5 w-3.5 text-white"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{t.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.categories?.name} • {format(parseISO(t.date), "dd MMM yyyy", { locale: ptBR })}
                    {t.installment_total > 1 && ` • ${t.installment_total}x de ${formatCurrency(t.amount)}`}
                  </p>
                  {t.notes && (
                    <p className="truncate text-xs text-muted-foreground/70 italic mt-0.5">{t.notes}</p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <p className={`text-sm font-semibold ${t.type === 'income' ? 'text-success' : 'text-foreground'}`}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(group.totalAmount)}
                  </p>
                </div>
              </div>
            </SwipeableRow>
          );
        })}
      </div>

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={deleteTarget?.installment_group_id ? 'Excluir todas as parcelas' : 'Excluir transação'}
        description={deleteTarget?.installment_group_id ? 'Tem certeza que deseja excluir todas as parcelas desta transação? Essa ação não pode ser desfeita.' : 'Tem certeza que deseja excluir esta transação? Essa ação não pode ser desfeita.'}
        onConfirm={() => {
          if (deleteTarget) {
            onDelete(deleteTarget);
            setDeleteTarget(null);
          }
        }}
      />
    </>
  );
}
