import { useMemo, useState } from 'react';
import { format, subMonths, subWeeks, subYears, startOfMonth, endOfMonth, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfYear, endOfYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useTransactions } from '@/hooks/useTransactions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PeriodFilter, type PeriodType } from '@/components/PeriodFilter';

export default function Graficos() {
  const [viewType, setViewType] = useState<'bar' | 'line'>('bar');
  const [period, setPeriod] = useState<PeriodType>('month');
  const [customRange, setCustomRange] = useState<{ from?: Date; to?: Date }>({});

  const dateRange = useMemo(() => {
    const now = new Date();
    switch (period) {
      case 'day':
        return { start: format(startOfDay(now), 'yyyy-MM-dd'), end: format(endOfDay(now), 'yyyy-MM-dd') };
      case 'week':
        return { start: format(startOfWeek(now, { locale: ptBR }), 'yyyy-MM-dd'), end: format(endOfWeek(now, { locale: ptBR }), 'yyyy-MM-dd') };
      case 'month':
        return { start: format(startOfMonth(now), 'yyyy-MM-dd'), end: format(endOfMonth(now), 'yyyy-MM-dd') };
      case 'year':
        return { start: format(startOfYear(now), 'yyyy-MM-dd'), end: format(endOfYear(now), 'yyyy-MM-dd') };
      case 'custom':
        if (customRange.from && customRange.to) {
          return { start: format(customRange.from, 'yyyy-MM-dd'), end: format(customRange.to, 'yyyy-MM-dd') };
        }
        return { start: format(startOfMonth(now), 'yyyy-MM-dd'), end: format(endOfMonth(now), 'yyyy-MM-dd') };
      case 'all':
        return { start: '2000-01-01', end: '2099-12-31' };
      default:
        return { start: format(startOfMonth(now), 'yyyy-MM-dd'), end: format(endOfMonth(now), 'yyyy-MM-dd') };
    }
  }, [period, customRange]);

  // Always fetch last 6 months for the chart
  const monthsData = useMemo(() => {
    const months = [];
    const numMonths = period === 'year' || period === 'all' ? 12 : 6;
    for (let i = numMonths - 1; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      months.push({
        month: format(date, 'MMM', { locale: ptBR }),
        start: format(startOfMonth(date), 'yyyy-MM-dd'),
        end: format(endOfMonth(date), 'yyyy-MM-dd'),
      });
    }
    return months;
  }, [period]);

  const { data: periodExpenses, isLoading: loadingExp } = useTransactions({
    type: 'expense',
    startDate: dateRange.start,
    endDate: dateRange.end,
  });

  const { data: periodIncomes, isLoading: loadingInc } = useTransactions({
    type: 'income',
    startDate: dateRange.start,
    endDate: dateRange.end,
  });

  // Chart data uses broader range
  const { data: chartExpenses } = useTransactions({
    type: 'expense',
    startDate: monthsData[0].start,
    endDate: monthsData[monthsData.length - 1].end,
  });

  const { data: chartIncomes } = useTransactions({
    type: 'income',
    startDate: monthsData[0].start,
    endDate: monthsData[monthsData.length - 1].end,
  });

  const chartData = useMemo(() => {
    return monthsData.map((m) => {
      const expenses = chartExpenses?.filter((t) => t.date >= m.start && t.date <= m.end) || [];
      const incomes = chartIncomes?.filter((t) => t.date >= m.start && t.date <= m.end) || [];
      return {
        name: m.month,
        despesas: expenses.reduce((sum, t) => sum + Number(t.amount), 0),
        receitas: incomes.reduce((sum, t) => sum + Number(t.amount), 0),
      };
    });
  }, [monthsData, chartExpenses, chartIncomes]);

  const totals = useMemo(() => {
    const totalExp = periodExpenses?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
    const totalInc = periodIncomes?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
    return { expenses: totalExp, income: totalInc, balance: totalInc - totalExp };
  }, [periodExpenses, periodIncomes]);

  const formatCurrency = (value: number) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const chartTitle = useMemo(() => {
    if (period === 'year' || period === 'all') return 'Últimos 12 Meses';
    return 'Últimos 6 Meses';
  }, [period]);

  if (loadingExp || loadingInc) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">Gráficos</h1>
      </div>

      {/* Period Filter */}
      <PeriodFilter
        selected={period}
        onSelect={setPeriod}
        customRange={customRange}
        onCustomRangeChange={setCustomRange}
      />

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/50 bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <TrendingUp className="h-4 w-4 text-primary" />
              Total Receitas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">{formatCurrency(totals.income)}</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <TrendingDown className="h-4 w-4 text-destructive" />
              Total Despesas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">{formatCurrency(totals.expenses)}</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Balanço</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${totals.balance >= 0 ? 'text-primary' : 'text-destructive'}`}>
              {formatCurrency(totals.balance)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card className="border-border/50 bg-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{chartTitle}</CardTitle>
            <Tabs value={viewType} onValueChange={(v) => setViewType(v as 'bar' | 'line')}>
              <TabsList className="h-8">
                <TabsTrigger value="bar" className="text-xs">Barras</TabsTrigger>
                <TabsTrigger value="line" className="text-xs">Linha</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              {viewType === 'bar' ? (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                  <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `R$${v / 1000}k`} />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))' }}
                    labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
                    itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
                  />
                  <Bar dataKey="receitas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="despesas" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                  <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `R$${v / 1000}k`} />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))' }}
                    labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
                    itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
                  />
                  <Line type="monotone" dataKey="receitas" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="despesas" stroke="hsl(var(--destructive))" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
