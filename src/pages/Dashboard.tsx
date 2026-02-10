import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useTransactions, useDeleteTransaction, useDuplicateTransaction, Transaction } from '@/hooks/useTransactions';
import { useAutoGenerateRecurring } from '@/hooks/useAutoGenerateRecurring';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { BalanceCard } from '@/components/BalanceCard';
import { DonutChart } from '@/components/DonutChart';
import { StickyBarSummary } from '@/components/StickyBarSummary';
import { CategoryList } from '@/components/CategoryList';
import { PeriodFilter, PeriodType } from '@/components/PeriodFilter';
import { TransactionList } from '@/components/TransactionList';
import { AddTransactionModal } from '@/components/AddTransactionModal';
import { EditTransactionModal } from '@/components/EditTransactionModal';
import { useProfileFilter } from '@/hooks/useProfileFilter';
import { cn } from '@/lib/utils';

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
    case 'all':
      return { start: '2000-01-01', end: '2099-12-31' };
    case 'custom':
      if (customRange?.from && customRange?.to) {
        return { start: format(customRange.from, 'yyyy-MM-dd'), end: format(customRange.to, 'yyyy-MM-dd') };
      }
      return { start: format(startOfMonth(now), 'yyyy-MM-dd'), end: format(endOfMonth(now), 'yyyy-MM-dd') };
    default:
      return { start: format(startOfMonth(now), 'yyyy-MM-dd'), end: format(endOfMonth(now), 'yyyy-MM-dd') };
  }
}

export default function Dashboard() {
  useAutoGenerateRecurring();
  
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
  const [period, setPeriod] = useState<PeriodType>('month');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [customRange, setCustomRange] = useState<{ from?: Date; to?: Date }>({});
  const [viewMode, setViewMode] = useState<'categories' | 'transactions'>('categories');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const { profileFilter } = useProfileFilter();
  const [donutHidden, setDonutHidden] = useState(false);
  const donutRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      ([entry]) => setDonutHidden(!entry.isIntersecting),
      { threshold: 0.1 }
    );
    return () => observerRef.current?.disconnect();
  }, []);

  // Re-attach observer when donutRef element changes (tab switch re-renders content)
  const setDonutRefCallback = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      if (node) observerRef.current.observe(node);
    }
    (donutRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
  }, []);

  const handleCustomRangeChange = useCallback((range: { from?: Date; to?: Date }) => {
    setCustomRange(range);
  }, []);

  const dateRange = useMemo(() => getDateRange(period, customRange), [period, customRange]);

  const { data: expenses, isLoading: loadingExpenses } = useTransactions({
    type: 'expense',
    startDate: dateRange.start,
    endDate: dateRange.end,
  });

  const { data: incomes, isLoading: loadingIncomes } = useTransactions({
    type: 'income',
    startDate: dateRange.start,
    endDate: dateRange.end,
  });

  // All-time totals for the balance card (independent of period filter)
  const { data: allExpenses } = useTransactions({
    type: 'expense',
    startDate: '2000-01-01',
    endDate: '2099-12-31',
  });

  const { data: allIncomes } = useTransactions({
    type: 'income',
    startDate: '2000-01-01',
    endDate: '2099-12-31',
  });

  const allTimeTotalExpenses = useMemo(
    () => allExpenses?.reduce((sum, t) => sum + Number(t.amount), 0) || 0,
    [allExpenses]
  );

  const allTimeTotalIncome = useMemo(
    () => allIncomes?.reduce((sum, t) => sum + Number(t.amount), 0) || 0,
    [allIncomes]
  );

  const deleteTransaction = useDeleteTransaction();
  const duplicateTransaction = useDuplicateTransaction();

  const filteredExpenses = useMemo(
    () => profileFilter ? expenses?.filter((t: any) => t.profile_id === profileFilter) : expenses,
    [expenses, profileFilter]
  );

  const filteredIncomes = useMemo(
    () => profileFilter ? incomes?.filter((t: any) => t.profile_id === profileFilter) : incomes,
    [incomes, profileFilter]
  );

  const totalExpenses = useMemo(
    () => (profileFilter ? filteredExpenses : expenses)?.reduce((sum, t) => sum + Number(t.amount), 0) || 0,
    [expenses, filteredExpenses, profileFilter]
  );

  const totalIncome = useMemo(
    () => (profileFilter ? filteredIncomes : incomes)?.reduce((sum, t) => sum + Number(t.amount), 0) || 0,
    [incomes, filteredIncomes, profileFilter]
  );

  const chartData = useMemo(() => {
    const transactions = activeTab === 'expense' ? filteredExpenses : filteredIncomes;
    if (!transactions) return [];

    const grouped: Record<string, { name: string; value: number; color: string; icon?: string }> = {};
    transactions.forEach((t) => {
      const catName = t.categories?.name || 'Outros';
      const catColor = t.categories?.color || '#6b7280';
      const catIcon = t.categories?.icon || 'circle';
      if (!grouped[catName]) {
        grouped[catName] = { name: catName, value: 0, color: catColor, icon: catIcon };
      }
      grouped[catName].value += Number(t.amount);
    });

    return Object.values(grouped).sort((a, b) => b.value - a.value);
  }, [filteredExpenses, filteredIncomes, activeTab]);

  const total = activeTab === 'expense' ? totalExpenses : totalIncome;

  const categoryItems = useMemo(
    () =>
      chartData.map((item) => ({
        ...item,
        percentage: total > 0 ? (item.value / total) * 100 : 0,
      })),
    [chartData, total]
  );

  const currentTransactions = activeTab === 'expense' ? filteredExpenses : filteredIncomes;
  const isLoading = activeTab === 'expense' ? loadingExpenses : loadingIncomes;

  const periodLabel = useMemo(() => {
    const now = new Date();
    switch (period) {
      case 'day': {
        const day = format(now, "dd 'de' MMMM", { locale: ptBR });
        return `Hoje, ${day}`;
      }
      case 'week': {
        const s = startOfWeek(now, { weekStartsOn: 0 });
        const e = endOfWeek(now, { weekStartsOn: 0 });
        return `${format(s, "d 'de' MMM", { locale: ptBR })} – ${format(e, "d 'de' MMM", { locale: ptBR })}`;
      }
      case 'month':
        return format(now, "MMMM 'de' yyyy", { locale: ptBR });
      case 'year':
        return format(now, 'yyyy');
      case 'all':
        return 'Tempo integral';
      case 'custom':
        if (customRange?.from && customRange?.to) {
          return `${format(customRange.from, "d 'de' MMM", { locale: ptBR })} – ${format(customRange.to, "d 'de' MMM", { locale: ptBR })}`;
        }
        return '';
      default:
        return '';
    }
  }, [period, customRange]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      );
    }

    return (
      <>
        {periodLabel && (
          <p className="text-center text-sm font-medium text-muted-foreground capitalize">{periodLabel}</p>
        )}
        <div ref={setDonutRefCallback} className="relative">
          <DonutChart data={chartData} total={total} />
          <Button
            size="lg"
            className="absolute -bottom-2 right-0 h-12 w-12 rounded-full z-10"
            onClick={() => setAddModalOpen(true)}
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>

        {/* View mode toggle */}
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          <button
            onClick={() => setViewMode('categories')}
            className={cn(
              'flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all',
              viewMode === 'categories'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Por Categoria
          </button>
          <button
            onClick={() => setViewMode('transactions')}
            className={cn(
              'flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all',
              viewMode === 'transactions'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Transações
          </button>
        </div>

        {/* Animated content swap */}
        <div key={viewMode} className="animate-fade-in">
          {viewMode === 'categories' ? (
            <CategoryList
              items={categoryItems}
              transactionType={activeTab}
              startDate={dateRange.start}
              endDate={dateRange.end}
            />
          ) : (
            <TransactionList
              transactions={currentTransactions || []}
              onDelete={(params) => deleteTransaction.mutate(params)}
              onEdit={(t) => setEditingTransaction(t)}
              onDuplicate={(t) => duplicateTransaction.mutate(t)}
            />
          )}
        </div>
      </>
    );
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <StickyBarSummary data={chartData} total={total} visible={donutHidden} />
      <div className="space-y-6">
        <BalanceCard totalIncome={allTimeTotalIncome} totalExpenses={allTimeTotalExpenses} />

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'expense' | 'income')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="expense">Despesas</TabsTrigger>
            <TabsTrigger value="income">Receitas</TabsTrigger>
          </TabsList>

          <div className="mt-4">
            <PeriodFilter
              selected={period}
              onSelect={setPeriod}
              customRange={customRange}
              onCustomRangeChange={handleCustomRangeChange}
            />
          </div>

          <TabsContent value="expense" className="mt-4 space-y-4">
            {renderContent()}
          </TabsContent>

          <TabsContent value="income" className="mt-4 space-y-4">
            {renderContent()}
          </TabsContent>
        </Tabs>
          </div>


      <AddTransactionModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        type={activeTab}
      />

      <EditTransactionModal
        open={!!editingTransaction}
        onOpenChange={(open) => !open && setEditingTransaction(null)}
        transaction={editingTransaction}
      />
    </div>
  );
}
