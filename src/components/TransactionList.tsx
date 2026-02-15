import { useState, useMemo } from 'react';
import { Transaction } from '@/hooks/useTransactions';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CategoryIcon } from '@/components/CategoryIcon';
import { SwipeableRow } from '@/components/SwipeableRow';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

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
    // Sort by installment number, pick first visible as representative
    items.sort((a, b) => (a.installment_number ?? 0) - (b.installment_number ?? 0));
    const totalAmount = items.reduce((sum, t) => sum + Number(t.amount), 0);
    result.push({
      representative: items[0],
      totalAmount,
      installmentIds: items.map((t) => t.id),
    });
  }

  // Only apply default sort if order isn't already managed by parent
  if (!preserveOrder) {
    result.sort((a, b) => b.representative.date.localeCompare(a.representative.date));
  }
  return result;
}

export function TransactionList({ transactions, onDelete, onEdit, onDuplicate, preserveOrder }: TransactionListProps) {
  const isMobile = useIsMobile();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; installment_group_id?: string | null } | null>(null);

  const grouped = useMemo(() => groupInstallments(transactions, preserveOrder), [transactions, preserveOrder]);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  if (transactions.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Nenhuma transação encontrada
      </p>
    );
  }

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
                  !isMobile && 'hover:bg-secondary/50',
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
                  {!isMobile && (
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
                  )}
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
