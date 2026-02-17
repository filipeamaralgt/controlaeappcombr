import { useState, useMemo, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useTransactions, useDeleteTransaction, useDuplicateTransaction, Transaction } from '@/hooks/useTransactions';
import { TransactionList } from '@/components/TransactionList';
import { EditTransactionModal } from '@/components/EditTransactionModal';
import { CategoryBarChart } from '@/components/CategoryBarChart';
import { CategoryIcon } from '@/components/CategoryIcon';
import { PeriodFilter, PeriodType } from '@/components/PeriodFilter';

function getDateRange(period: PeriodType, customRange?: { from?: Date; to?: Date }) {
  const now = new Date();
  switch (period) {
    case 'day':
      return { start: format(startOfDay(now), 'yyyy-MM-dd'), end: format(endOfDay(now), 'yyyy-MM-dd') };
    case 'week':
      return { start: format(startOfWeek(now, { weekStartsOn: 0 }), 'yyyy-MM-dd'), end: format(endOfWeek(now, { weekStartsOn: 0 }), 'yyyy-MM-dd') };
    case 'month':
      return { start: format(startOfMonth(now), 'yyyy-MM-dd'), end: format(endOfMonth(now), 'yyyy-MM-dd') };
    case 'year':
      return { start: format(startOfYear(now), 'yyyy-MM-dd'), end: format(endOfYear(now), 'yyyy-MM-dd') };
    case 'custom':
      if (customRange?.from && customRange?.to) {
        return { start: format(customRange.from, 'yyyy-MM-dd'), end: format(customRange.to, 'yyyy-MM-dd') };
      }
      return { start: format(startOfMonth(now), 'yyyy-MM-dd'), end: format(endOfMonth(now), 'yyyy-MM-dd') };
    default:
      return { start: format(startOfMonth(now), 'yyyy-MM-dd'), end: format(endOfMonth(now), 'yyyy-MM-dd') };
  }
}

function detectInitialPeriod(start?: string, end?: string): { period: PeriodType; customRange?: { from: Date; to: Date } } {
  if (!start || !end) return { period: 'month' };
  const now = new Date();
  const monthStart = format(startOfMonth(now), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd');
  if (start === monthStart && end === monthEnd) return { period: 'month' };

  const yearStart = format(startOfYear(now), 'yyyy-MM-dd');
  const yearEnd = format(endOfYear(now), 'yyyy-MM-dd');
  if (start === yearStart && end === yearEnd) return { period: 'year' };

  const weekStart = format(startOfWeek(now, { weekStartsOn: 0 }), 'yyyy-MM-dd');
  const weekEnd = format(endOfWeek(now, { weekStartsOn: 0 }), 'yyyy-MM-dd');
  if (start === weekStart && end === weekEnd) return { period: 'week' };

  const dayStart = format(startOfDay(now), 'yyyy-MM-dd');
  const dayEnd = format(endOfDay(now), 'yyyy-MM-dd');
  if (start === dayStart && end === dayEnd) return { period: 'day' };

  return { period: 'custom', customRange: { from: new Date(start + 'T00:00:00'), to: new Date(end + 'T00:00:00') } };
}

export default function CategoriaTransacoes() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const categoryName = searchParams.get('name') || '';
  const type = (searchParams.get('type') as 'expense' | 'income') || 'expense';
  const initialStart = searchParams.get('start') || undefined;
  const initialEnd = searchParams.get('end') || undefined;

  const initialDetected = useMemo(() => detectInitialPeriod(initialStart, initialEnd), [initialStart, initialEnd]);
  const [period, setPeriod] = useState<PeriodType>(initialDetected.period);
  const [customRange, setCustomRange] = useState<{ from?: Date; to?: Date }>(initialDetected.customRange || {});
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const handleCustomRangeChange = useCallback((range: { from?: Date; to?: Date }) => {
    setCustomRange(range);
  }, []);

  const dateRange = useMemo(() => getDateRange(period, customRange), [period, customRange]);

  const { data: transactions, isLoading } = useTransactions({
    type,
    startDate: dateRange.start,
    endDate: dateRange.end,
  });

  const deleteTransaction = useDeleteTransaction();
  const duplicateTransaction = useDuplicateTransaction();

  const filtered = useMemo(() => {
    if (!transactions) return [];
    return transactions.filter((t) => (t.categories?.name || 'Outros') === categoryName);
  }, [transactions, categoryName]);

  const { data: allCategories } = useCategories(type);

  const categoryInfo = useMemo(() => {
    const fromDb = allCategories?.find((c) => c.name === categoryName);
    if (fromDb) {
      return { color: fromDb.color, icon: fromDb.icon || 'circle' };
    }
    const first = filtered[0];
    return {
      color: first?.categories?.color || '#6b7280',
      icon: first?.categories?.icon || 'circle',
    };
  }, [allCategories, categoryName, filtered]);

  const total = useMemo(
    () => filtered.reduce((sum, t) => sum + Number(t.amount), 0),
    [filtered]
  );

  const formatCurrency = (value: number) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
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

        {/* Period Filter */}
        <PeriodFilter
          selected={period}
          onSelect={setPeriod}
          customRange={customRange}
          onCustomRangeChange={handleCustomRangeChange}
        />

        {/* Bar Chart */}
        {!isLoading && filtered.length > 0 && (
          <CategoryBarChart
            transactions={filtered}
            startDate={dateRange.start}
            endDate={dateRange.end}
            color={categoryInfo.color}
            period={period}
          />
        )}

        {/* Transactions */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <TransactionList
            transactions={filtered}
            onDelete={(params) => deleteTransaction.mutate(params)}
            onEdit={(t) => setEditingTransaction(t)}
            onDuplicate={(t) => duplicateTransaction.mutate(t)}
          />
        )}
      </div>

      <EditTransactionModal
        open={!!editingTransaction}
        onOpenChange={(open) => !open && setEditingTransaction(null)}
        transaction={editingTransaction}
      />
    </div>
  );
}
