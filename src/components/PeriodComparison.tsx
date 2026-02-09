import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PeriodComparisonProps {
  currentExpenses: number;
  previousExpenses: number;
  currentIncome: number;
  previousIncome: number;
  periodLabel: string;
  isLoading?: boolean;
}

function getChangeInfo(current: number, previous: number) {
  if (previous === 0 && current === 0) return { percentage: 0, direction: 'same' as const };
  if (previous === 0) return { percentage: 100, direction: 'up' as const };
  const percentage = ((current - previous) / previous) * 100;
  if (Math.abs(percentage) < 0.5) return { percentage: 0, direction: 'same' as const };
  return {
    percentage: Math.abs(percentage),
    direction: percentage > 0 ? 'up' as const : 'down' as const,
  };
}

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function PeriodComparison({
  currentExpenses,
  previousExpenses,
  currentIncome,
  previousIncome,
  periodLabel,
  isLoading,
}: PeriodComparisonProps) {
  if (isLoading) return null;

  const expenseChange = getChangeInfo(currentExpenses, previousExpenses);
  const incomeChange = getChangeInfo(currentIncome, previousIncome);

  // Don't show if there's no data at all
  if (previousExpenses === 0 && previousIncome === 0 && currentExpenses === 0 && currentIncome === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      <ComparisonItem
        label="Despesas"
        current={currentExpenses}
        previous={previousExpenses}
        change={expenseChange}
        periodLabel={periodLabel}
        invertColor // For expenses, "up" is bad (red), "down" is good (green)
      />
      <ComparisonItem
        label="Receitas"
        current={currentIncome}
        previous={previousIncome}
        change={incomeChange}
        periodLabel={periodLabel}
      />
    </div>
  );
}

interface ComparisonItemProps {
  label: string;
  current: number;
  previous: number;
  change: { percentage: number; direction: 'up' | 'down' | 'same' };
  periodLabel: string;
  invertColor?: boolean;
}

function ComparisonItem({ label, current, previous, change, periodLabel, invertColor }: ComparisonItemProps) {
  const isUp = change.direction === 'up';
  const isDown = change.direction === 'down';
  const isSame = change.direction === 'same';

  // Determine color: for expenses, up=bad(destructive), down=good(success); for income, up=good, down=bad
  const colorClass = isSame
    ? 'text-muted-foreground'
    : invertColor
      ? isUp ? 'text-destructive' : 'text-success'
      : isUp ? 'text-success' : 'text-destructive';

  const bgClass = isSame
    ? 'bg-muted/50'
    : invertColor
      ? isUp ? 'bg-destructive/10' : 'bg-success/10'
      : isUp ? 'bg-success/10' : 'bg-destructive/10';

  const Icon = isSame ? Minus : isUp ? TrendingUp : TrendingDown;

  const diff = current - previous;

  return (
    <div className={cn('rounded-xl p-3 transition-all', bgClass)}>
      <div className="flex items-center gap-1.5">
        <Icon className={cn('h-3.5 w-3.5', colorClass)} />
        <span className={cn('text-xs font-semibold', colorClass)}>
          {isSame ? 'Igual' : `${change.percentage.toFixed(0)}%`}
        </span>
      </div>
      <p className="mt-1 text-[10px] text-muted-foreground">
        {label} vs {periodLabel}
      </p>
      {!isSame && previous > 0 && (
        <p className={cn('mt-0.5 text-[10px] font-medium', colorClass)}>
          {diff > 0 ? '+' : ''}{formatCurrency(diff)}
        </p>
      )}
    </div>
  );
}
