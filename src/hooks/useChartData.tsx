import { useMemo } from 'react';
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfYear, endOfYear, eachDayOfInterval, eachMonthOfInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useTransactions, type Transaction } from '@/hooks/useTransactions';
import type { PeriodType } from '@/components/PeriodFilter';
import type { DonutDataItem } from '@/components/CategoryDonutChart';
import type { BarLineChartDataItem } from '@/components/BarLineChart';

interface UseChartDataParams {
  period: PeriodType;
  customRange: { from?: Date; to?: Date };
}

function groupByCategory(transactions: Transaction[]): DonutDataItem[] {
  const byCategory: Record<string, DonutDataItem> = {};
  transactions.forEach(t => {
    const cat = (t as any).categories;
    const catName = cat?.name || 'Outros';
    const catColor = cat?.color || '#6b7280';
    if (!byCategory[catName]) {
      byCategory[catName] = { name: catName, value: 0, color: catColor };
    }
    byCategory[catName].value += Number(t.amount);
  });
  return Object.values(byCategory).sort((a, b) => b.value - a.value);
}

export function useChartData({ period, customRange }: UseChartDataParams) {
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

  const chartData = useMemo<BarLineChartDataItem[]>(() => {
    const allExpenses = periodExpenses || [];
    const allIncomes = periodIncomes || [];
    if (!periodExpenses && !periodIncomes) return [];

    if (period === 'day') {
      return [{
        name: 'Hoje',
        despesas: allExpenses.reduce((s, t) => s + Number(t.amount), 0),
        receitas: allIncomes.reduce((s, t) => s + Number(t.amount), 0),
      }];
    }

    if (period === 'week') {
      const start = startOfWeek(new Date(), { locale: ptBR });
      const end = endOfWeek(new Date(), { locale: ptBR });
      return eachDayOfInterval({ start, end }).map(d => {
        const dateStr = format(d, 'yyyy-MM-dd');
        return {
          name: format(d, 'EEE', { locale: ptBR }),
          despesas: allExpenses.filter(t => t.date === dateStr).reduce((s, t) => s + Number(t.amount), 0),
          receitas: allIncomes.filter(t => t.date === dateStr).reduce((s, t) => s + Number(t.amount), 0),
        };
      });
    }

    if (period === 'month') {
      const start = startOfMonth(new Date());
      const end = endOfMonth(new Date());
      return eachDayOfInterval({ start, end }).map(d => {
        const dateStr = format(d, 'yyyy-MM-dd');
        return {
          name: format(d, 'dd'),
          despesas: allExpenses.filter(t => t.date === dateStr).reduce((s, t) => s + Number(t.amount), 0),
          receitas: allIncomes.filter(t => t.date === dateStr).reduce((s, t) => s + Number(t.amount), 0),
        };
      });
    }

    if (period === 'year') {
      const start = startOfYear(new Date());
      const end = endOfYear(new Date());
      return eachMonthOfInterval({ start, end }).map(m => {
        const mStart = format(startOfMonth(m), 'yyyy-MM-dd');
        const mEnd = format(endOfMonth(m), 'yyyy-MM-dd');
        return {
          name: format(m, 'MMM', { locale: ptBR }),
          despesas: allExpenses.filter(t => t.date >= mStart && t.date <= mEnd).reduce((s, t) => s + Number(t.amount), 0),
          receitas: allIncomes.filter(t => t.date >= mStart && t.date <= mEnd).reduce((s, t) => s + Number(t.amount), 0),
        };
      });
    }

    // all/custom: group by month
    if (allExpenses.length === 0 && allIncomes.length === 0) return [];
    const allDates = [...allExpenses, ...allIncomes].map(t => t.date).sort();
    const firstDate = parseISO(allDates[0]);
    const lastDate = parseISO(allDates[allDates.length - 1]);
    return eachMonthOfInterval({ start: startOfMonth(firstDate), end: endOfMonth(lastDate) }).map(m => {
      const mStart = format(startOfMonth(m), 'yyyy-MM-dd');
      const mEnd = format(endOfMonth(m), 'yyyy-MM-dd');
      return {
        name: format(m, 'MMM/yy', { locale: ptBR }),
        despesas: allExpenses.filter(t => t.date >= mStart && t.date <= mEnd).reduce((s, t) => s + Number(t.amount), 0),
        receitas: allIncomes.filter(t => t.date >= mStart && t.date <= mEnd).reduce((s, t) => s + Number(t.amount), 0),
      };
    });
  }, [period, periodExpenses, periodIncomes]);

  const donutExpenseData = useMemo(() => groupByCategory(periodExpenses || []), [periodExpenses]);
  const donutIncomeData = useMemo(() => groupByCategory(periodIncomes || []), [periodIncomes]);

  const totals = useMemo(() => {
    const expenses = periodExpenses?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
    const income = periodIncomes?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
    return { expenses, income, balance: income - expenses };
  }, [periodExpenses, periodIncomes]);

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

  return {
    isLoading: loadingExp || loadingInc,
    chartData,
    donutExpenseData,
    donutIncomeData,
    totals,
    chartTitle,
  };
}
