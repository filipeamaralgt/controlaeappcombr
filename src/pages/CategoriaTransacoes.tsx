import { useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTransactions, useDeleteTransaction } from '@/hooks/useTransactions';
import { TransactionList } from '@/components/TransactionList';
import { CategoryIcon } from '@/components/CategoryIcon';

export default function CategoriaTransacoes() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const categoryName = searchParams.get('name') || '';
  const type = (searchParams.get('type') as 'expense' | 'income') || 'expense';
  const startDate = searchParams.get('start') || undefined;
  const endDate = searchParams.get('end') || undefined;

  const { data: transactions, isLoading } = useTransactions({
    type,
    startDate,
    endDate,
  });

  const deleteTransaction = useDeleteTransaction();

  const filtered = useMemo(() => {
    if (!transactions) return [];
    return transactions.filter((t) => (t.categories?.name || 'Outros') === categoryName);
  }, [transactions, categoryName]);

  const categoryInfo = useMemo(() => {
    const first = filtered[0];
    return {
      color: first?.categories?.color || '#6b7280',
      icon: first?.categories?.icon || 'circle',
    };
  }, [filtered]);

  const total = useMemo(
    () => filtered.reduce((sum, t) => sum + Number(t.amount), 0),
    [filtered]
  );

  const formatCurrency = (value: number) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: categoryInfo.color }}
          >
            <CategoryIcon iconName={categoryInfo.icon} className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold text-foreground">{categoryName}</h1>
            <p className="text-sm text-muted-foreground">
              {filtered.length} {filtered.length === 1 ? 'transação' : 'transações'} • {formatCurrency(total)}
            </p>
          </div>
        </div>

        {/* Transactions */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <TransactionList
            transactions={filtered}
            onDelete={(id) => deleteTransaction.mutate(id)}
          />
        )}
      </div>
    </div>
  );
}
