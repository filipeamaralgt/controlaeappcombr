import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { PeriodFilter, type PeriodType } from '@/components/PeriodFilter';
import { CategoryDonutChart } from '@/components/CategoryDonutChart';
import { BarLineChart } from '@/components/BarLineChart';
import { SummaryCards } from '@/components/SummaryCards';
import { useChartData } from '@/hooks/useChartData';

export default function Graficos() {
  const [period, setPeriod] = useState<PeriodType>('month');
  const [customRange, setCustomRange] = useState<{ from?: Date; to?: Date }>({});

  const { isLoading, chartData, donutExpenseData, donutIncomeData, totals, chartTitle } =
    useChartData({ period, customRange });

  if (isLoading) {
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

      <PeriodFilter
        selected={period}
        onSelect={setPeriod}
        customRange={customRange}
        onCustomRangeChange={setCustomRange}
      />

      <SummaryCards income={totals.income} expenses={totals.expenses} balance={totals.balance} />

      <BarLineChart
        title={chartTitle}
        data={chartData}
        xAxisInterval={period === 'month' ? 4 : 0}
      />

      <CategoryDonutChart
        title="Despesas por Categoria"
        data={donutExpenseData}
        total={totals.expenses}
        emptyMessage="Nenhuma despesa neste período"
      />

      <CategoryDonutChart
        title="Receitas por Categoria"
        data={donutIncomeData}
        total={totals.income}
        emptyMessage="Nenhuma receita neste período"
      />
    </div>
  );
}
