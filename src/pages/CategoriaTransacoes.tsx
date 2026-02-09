import { useState, useMemo, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, ArrowUpDown } from 'lucide-react';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useTransactions, useDeleteTransaction, useDuplicateTransaction, Transaction } from '@/hooks/useTransactions';
import { TransactionList } from '@/components/TransactionList';
import { EditTransactionModal } from '@/components/EditTransactionModal';
import { CategoryBarChart } from '@/components/CategoryBarChart';
import { CategoryIcon } from '@/components/CategoryIcon';
import { PeriodFilter, PeriodType } from '@/components/PeriodFilter';
import { cn } from '@/lib/utils';

type SortOption = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc' | 'name';

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'date-desc', label: 'Mais recente' },
  { value: 'date-asc', label: 'Mais antigo' },
  { value: 'amount-desc', label: 'Maior valor' },
  { value: 'amount-asc', label: 'Menor valor' },
  { value: 'name', label: 'Nome A-Z' },
];

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

function detectInitialPeriod(start?: string, end?: string): PeriodType {
  if (!start || !end) return 'month';
  const now = new Date();
  const monthStart = format(startOfMonth(now), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd');
  if (start === monthStart && end === monthEnd) return 'month';

  const yearStart = format(startOfYear(now), 'yyyy-MM-dd');
  const yearEnd = format(endOfYear(now), 'yyyy-MM-dd');
  if (start === yearStart && end === yearEnd) return 'year';

  const weekStart = format(startOfWeek(now, { weekStartsOn: 0 }), 'yyyy-MM-dd');
  const weekEnd = format(endOfWeek(now, { weekStartsOn: 0 }), 'yyyy-MM-dd');
  if (start === weekStart && end === weekEnd) return 'week';

  const dayStart = format(startOfDay(now), 'yyyy-MM-dd');
  const dayEnd = format(endOfDay(now), 'yyyy-MM-dd');
  if (start === dayStart && end === dayEnd) return 'day';

  return 'month';
}

export default function CategoriaTransacoes() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const categoryName = searchParams.get('name') || '';
  const type = (searchParams.get('type') as 'expense' | 'income') || 'expense';
  const initialStart = searchParams.get('start') || undefined;
  const initialEnd = searchParams.get('end') || undefined;

  const [period, setPeriod] = useState<PeriodType>(() => detectInitialPeriod(initialStart, initialEnd));
  const [customRange, setCustomRange] = useState<{ from?: Date; to?: Date }>({});
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
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

  const sorted = useMemo(() => {
    const list = [...filtered];
    switch (sortBy) {
      case 'date-desc':
        return list.sort((a, b) => b.date.localeCompare(a.date));
      case 'date-asc':
        return list.sort((a, b) => a.date.localeCompare(b.date));
      case 'amount-desc':
        return list.sort((a, b) => Number(b.amount) - Number(a.amount));
      case 'amount-asc':
        return list.sort((a, b) => Number(a.amount) - Number(b.amount));
      case 'name':
        return list.sort((a, b) => a.description.localeCompare(b.description));
      default:
        return list;
    }
  }, [filtered, sortBy]);

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

        {/* Sort Options */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
            {sortOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSortBy(option.value)}
                className={cn(
                  'shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-all',
                  sortBy === option.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

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
            transactions={sorted}
            onDelete={(id) => deleteTransaction.mutate(id)}
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
