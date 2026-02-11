import { useMemo, useState } from 'react';
import { format, subMonths, startOfMonth, endOfMonth, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfYear, endOfYear, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
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

  // Build chart data based on the selected period
  const chartData = useMemo(() => {
    if (!periodExpenses && !periodIncomes) return [];
    const allExpenses = periodExpenses || [];
    const allIncomes = periodIncomes || [];

    // For day: show single bar
    if (period === 'day') {
      return [{
        name: 'Hoje',
        despesas: allExpenses.reduce((s, t) => s + Number(t.amount), 0),
        receitas: allIncomes.reduce((s, t) => s + Number(t.amount), 0),
      }];
    }

    // For week: show each day
    if (period === 'week') {
      const start = startOfWeek(new Date(), { locale: ptBR });
      const end = endOfWeek(new Date(), { locale: ptBR });
      const days = eachDayOfInterval({ start, end });
      return days.map(d => {
        const dateStr = format(d, 'yyyy-MM-dd');
        return {
          name: format(d, 'EEE', { locale: ptBR }),
          despesas: allExpenses.filter(t => t.date === dateStr).reduce((s, t) => s + Number(t.amount), 0),
          receitas: allIncomes.filter(t => t.date === dateStr).reduce((s, t) => s + Number(t.amount), 0),
        };
      });
    }

    // For month: show each day of the month
    if (period === 'month') {
      const start = startOfMonth(new Date());
      const end = endOfMonth(new Date());
      const days = eachDayOfInterval({ start, end });
      return days.map(d => {
        const dateStr = format(d, 'yyyy-MM-dd');
        return {
          name: format(d, 'dd'),
          despesas: allExpenses.filter(t => t.date === dateStr).reduce((s, t) => s + Number(t.amount), 0),
          receitas: allIncomes.filter(t => t.date === dateStr).reduce((s, t) => s + Number(t.amount), 0),
        };
      });
    }

    // For year: show each month
    if (period === 'year') {
      const start = startOfYear(new Date());
      const end = endOfYear(new Date());
      const months = eachMonthOfInterval({ start, end });
      return months.map(m => {
        const mStart = format(startOfMonth(m), 'yyyy-MM-dd');
        const mEnd = format(endOfMonth(m), 'yyyy-MM-dd');
        return {
          name: format(m, 'MMM', { locale: ptBR }),
          despesas: allExpenses.filter(t => t.date >= mStart && t.date <= mEnd).reduce((s, t) => s + Number(t.amount), 0),
          receitas: allIncomes.filter(t => t.date >= mStart && t.date <= mEnd).reduce((s, t) => s + Number(t.amount), 0),
        };
      });
    }

    // For all/custom: group by month
    if (allExpenses.length === 0 && allIncomes.length === 0) return [];
    const allDates = [...allExpenses, ...allIncomes].map(t => t.date).sort();
    const firstDate = parseISO(allDates[0]);
    const lastDate = parseISO(allDates[allDates.length - 1]);
    const months = eachMonthOfInterval({ start: startOfMonth(firstDate), end: endOfMonth(lastDate) });
    return months.map(m => {
      const mStart = format(startOfMonth(m), 'yyyy-MM-dd');
      const mEnd = format(endOfMonth(m), 'yyyy-MM-dd');
      return {
        name: format(m, 'MMM/yy', { locale: ptBR }),
        despesas: allExpenses.filter(t => t.date >= mStart && t.date <= mEnd).reduce((s, t) => s + Number(t.amount), 0),
        receitas: allIncomes.filter(t => t.date >= mStart && t.date <= mEnd).reduce((s, t) => s + Number(t.amount), 0),
      };
    });
  }, [period, periodExpenses, periodIncomes]);

  // Donut chart: expenses by category
  const donutData = useMemo(() => {
    if (!periodExpenses || periodExpenses.length === 0) return [];
    const byCategory: Record<string, { name: string; value: number; color: string }> = {};
    periodExpenses.forEach(t => {
      const cat = (t as any).categories;
      const catName = cat?.name || 'Outros';
      const catColor = cat?.color || '#6b7280';
      if (!byCategory[catName]) {
        byCategory[catName] = { name: catName, value: 0, color: catColor };
      }
      byCategory[catName].value += Number(t.amount);
    });
    return Object.values(byCategory).sort((a, b) => b.value - a.value);
  }, [periodExpenses]);

  // Donut chart: incomes by category
  const donutIncomeData = useMemo(() => {
    if (!periodIncomes || periodIncomes.length === 0) return [];
    const byCategory: Record<string, { name: string; value: number; color: string }> = {};
    periodIncomes.forEach(t => {
      const cat = (t as any).categories;
      const catName = cat?.name || 'Outros';
      const catColor = cat?.color || '#6b7280';
      if (!byCategory[catName]) {
        byCategory[catName] = { name: catName, value: 0, color: catColor };
      }
      byCategory[catName].value += Number(t.amount);
    });
    return Object.values(byCategory).sort((a, b) => b.value - a.value);
  }, [periodIncomes]);

  const totals = useMemo(() => {
    const totalExp = periodExpenses?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
    const totalInc = periodIncomes?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
    return { expenses: totalExp, income: totalInc, balance: totalInc - totalExp };
  }, [periodExpenses, periodIncomes]);

  const formatCurrency = (value: number) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const chartTitle = useMemo(() => {
    switch (period) {
      case 'day': return 'Hoje';
      case 'week': return 'Esta Semana';
      case 'month': return 'Este Mês';
      case 'year': return 'Este Ano';
      case 'all': return 'Todo o Período';
      case 'custom': return 'Período Selecionado';
      default: return 'Visão Geral';
    }
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

      {/* Bar/Line Chart */}
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
            {chartData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Nenhuma transação neste período
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                {viewType === 'bar' ? (
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                    <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} interval={period === 'month' ? 4 : 0} />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => v >= 1000 ? `R$${(v / 1000).toFixed(1)}k` : `R$${v}`} />
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
                    <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} interval={period === 'month' ? 4 : 0} />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => v >= 1000 ? `R$${(v / 1000).toFixed(1)}k` : `R$${v}`} />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))' }}
                      labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
                      itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
                    />
                    <Line type="monotone" dataKey="receitas" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="despesas" stroke="hsl(var(--destructive))" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                )}
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Donut Chart - Expenses by Category */}
      <Card className="border-border/50 bg-card">
        <CardHeader>
          <CardTitle className="text-lg">Despesas por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          {donutData.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
              Nenhuma despesa neste período
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="h-56 w-56 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {donutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                      itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2 w-full">
                {donutData.map((item, i) => {
                  const pct = totals.expenses > 0 ? ((item.value / totals.expenses) * 100).toFixed(1) : '0';
                  return (
                    <div key={i} className="flex items-center justify-between gap-3 text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="truncate text-foreground">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-muted-foreground text-xs">{pct}%</span>
                        <span className="font-medium text-foreground">{formatCurrency(item.value)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Donut Chart - Incomes by Category */}
      <Card className="border-border/50 bg-card">
        <CardHeader>
          <CardTitle className="text-lg">Receitas por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          {donutIncomeData.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
              Nenhuma receita neste período
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="h-56 w-56 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutIncomeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {donutIncomeData.map((entry, index) => (
                        <Cell key={`cell-inc-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                      itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2 w-full">
                {donutIncomeData.map((item, i) => {
                  const pct = totals.income > 0 ? ((item.value / totals.income) * 100).toFixed(1) : '0';
                  return (
                    <div key={i} className="flex items-center justify-between gap-3 text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="truncate text-foreground">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-muted-foreground text-xs">{pct}%</span>
                        <span className="font-medium text-foreground">{formatCurrency(item.value)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
