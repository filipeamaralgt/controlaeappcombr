import { useState, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { Plus, Loader2 } from 'lucide-react';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { useTransactions, useDeleteTransaction } from '@/hooks/useTransactions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { BalanceCard } from '@/components/BalanceCard';
import { DonutChart } from '@/components/DonutChart';
import { CategoryList } from '@/components/CategoryList';
import { PeriodFilter, PeriodType } from '@/components/PeriodFilter';
import { TransactionList } from '@/components/TransactionList';
import { AddTransactionModal } from '@/components/AddTransactionModal';

function getDateRange(period: PeriodType) {
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
    default:
      return { start: format(startOfMonth(now), 'yyyy-MM-dd'), end: format(endOfMonth(now), 'yyyy-MM-dd') };
  }
}

export default function Index() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
  const [period, setPeriod] = useState<PeriodType>('month');
  const [addModalOpen, setAddModalOpen] = useState(false);

  const dateRange = useMemo(() => getDateRange(period), [period]);

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

  const deleteTransaction = useDeleteTransaction();

  const totalExpenses = useMemo(
    () => expenses?.reduce((sum, t) => sum + Number(t.amount), 0) || 0,
    [expenses]
  );

  const totalIncome = useMemo(
    () => incomes?.reduce((sum, t) => sum + Number(t.amount), 0) || 0,
    [incomes]
  );

  const chartData = useMemo(() => {
    const transactions = activeTab === 'expense' ? expenses : incomes;
    if (!transactions) return [];

    const grouped: Record<string, { name: string; value: number; color: string }> = {};
    transactions.forEach((t) => {
      const catName = t.categories?.name || 'Outros';
      const catColor = t.categories?.color || '#6b7280';
      if (!grouped[catName]) {
        grouped[catName] = { name: catName, value: 0, color: catColor };
      }
      grouped[catName].value += Number(t.amount);
    });

    return Object.values(grouped).sort((a, b) => b.value - a.value);
  }, [expenses, incomes, activeTab]);

  const total = activeTab === 'expense' ? totalExpenses : totalIncome;

  const categoryItems = useMemo(
    () =>
      chartData.map((item) => ({
        ...item,
        percentage: total > 0 ? (item.value / total) * 100 : 0,
      })),
    [chartData, total]
  );

  const currentTransactions = activeTab === 'expense' ? expenses : incomes;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-lg px-4 pb-24 pt-4">
        <div className="animate-fade-in space-y-5">
          <BalanceCard totalIncome={totalIncome} totalExpenses={totalExpenses} />

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'expense' | 'income')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="expense">Despesas</TabsTrigger>
              <TabsTrigger value="income">Receitas</TabsTrigger>
            </TabsList>

            <div className="mt-4">
              <PeriodFilter selected={period} onSelect={setPeriod} />
            </div>

            <TabsContent value="expense" className="mt-4 space-y-4">
              {loadingExpenses ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  <DonutChart data={chartData} total={total} />
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Por Categoria</h3>
                    <CategoryList items={categoryItems} />
                  </div>
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Transações</h3>
                    <TransactionList
                      transactions={currentTransactions || []}
                      onDelete={(id) => deleteTransaction.mutate(id)}
                    />
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="income" className="mt-4 space-y-4">
              {loadingIncomes ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  <DonutChart data={chartData} total={total} />
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Por Categoria</h3>
                    <CategoryList items={categoryItems} />
                  </div>
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Transações</h3>
                    <TransactionList
                      transactions={currentTransactions || []}
                      onDelete={(id) => deleteTransaction.mutate(id)}
                    />
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* FAB */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg shadow-primary/30"
          onClick={() => setAddModalOpen(true)}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      <AddTransactionModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        type={activeTab}
      />
    </div>
  );
}
