import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { PageBackHeader } from '@/components/PageBackHeader';
import { PeriodFilter, type PeriodType } from '@/components/PeriodFilter';
import { CategoryDonutChart } from '@/components/CategoryDonutChart';
import { BarLineChart } from '@/components/BarLineChart';
import { SummaryCards } from '@/components/SummaryCards';
import { useChartData } from '@/hooks/useChartData';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const } },
};

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
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      <PageBackHeader title="Gráficos" />

      <PeriodFilter
        selected={period}
        onSelect={setPeriod}
        customRange={customRange}
        onCustomRangeChange={setCustomRange}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={period + (customRange.from?.toISOString() || '') + (customRange.to?.toISOString() || '')}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit={{ opacity: 0, transition: { duration: 0.15 } }}
          className="space-y-6"
        >
          <motion.div variants={itemVariants}>
            <SummaryCards income={totals.income} expenses={totals.expenses} balance={totals.balance} />
          </motion.div>

          <motion.div variants={itemVariants}>
            <BarLineChart
              title={chartTitle}
              data={chartData}
              xAxisInterval={period === 'month' ? 4 : 0}
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <CategoryDonutChart
              title="Despesas por Categoria"
              data={donutExpenseData}
              total={totals.expenses}
              emptyMessage="Nenhuma despesa neste período"
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <CategoryDonutChart
              title="Receitas por Categoria"
              data={donutIncomeData}
              total={totals.income}
              emptyMessage="Nenhuma receita neste período"
            />
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
