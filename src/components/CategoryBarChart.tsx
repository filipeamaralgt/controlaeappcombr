import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip, LabelList } from 'recharts';
import { format, parseISO, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Transaction } from '@/hooks/useTransactions';

interface CategoryBarChartProps {
  transactions: Transaction[];
  startDate: string;
  endDate: string;
  color: string;
  period: 'day' | 'week' | 'month' | 'year' | 'all' | 'custom';
}

const showLabels = (period: string) => period !== 'year' && period !== 'all';


export function CategoryBarChart({ transactions, startDate, endDate, color, period }: CategoryBarChartProps) {
  const chartData = useMemo(() => {
    if (transactions.length === 0) return [];

    const start = parseISO(startDate);
    const end = parseISO(endDate);

    // Determine grouping based on period
    if (period === 'day') {
      // Single day: group by individual transaction
      return transactions.map((t) => ({
        label: t.description.slice(0, 10),
        value: Number(t.amount),
      }));
    }

    if (period === 'week') {
      // Week: group by day
      const days = eachDayOfInterval({ start, end });
      return days.map((day) => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const dayTotal = transactions
          .filter((t) => t.date === dayStr)
          .reduce((sum, t) => sum + Number(t.amount), 0);
        return {
          label: format(day, 'EEE', { locale: ptBR }),
          value: dayTotal,
        };
      });
    }

    if (period === 'month' || period === 'custom') {
      // Month: group by week
      const weeks = eachWeekOfInterval({ start, end }, { weekStartsOn: 0 });
      return weeks.map((weekStart, i) => {
        const weekEnd = i < weeks.length - 1 ? weeks[i + 1] : end;
        const weekTotal = transactions
          .filter((t) => {
            const d = parseISO(t.date);
            return d >= weekStart && d < (i < weeks.length - 1 ? weekEnd : new Date(end.getTime() + 86400000));
          })
          .reduce((sum, t) => sum + Number(t.amount), 0);
        return {
          label: `S${i + 1}`,
          value: weekTotal,
        };
      });
    }

    if (period === 'year' || period === 'all') {
      // Year/All: group by month
      const months = eachMonthOfInterval({ start, end });
      return months.map((month) => {
        const monthStr = format(month, 'yyyy-MM');
        const monthTotal = transactions
          .filter((t) => t.date.startsWith(monthStr))
          .reduce((sum, t) => sum + Number(t.amount), 0);
        return {
          label: format(month, period === 'all' ? 'MMM/yy' : 'MMM', { locale: ptBR }),
          value: monthTotal,
        };
      });
    }

    return [];
  }, [transactions, startDate, endDate, period]);

  const formatCurrency = (value: number) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const formatShort = (value: number): string => {
    if (value === 0) return '';
    if (value >= 1000) {
      const k = value / 1000;
      return k % 1 === 0 ? `${k}k` : `${k.toFixed(1).replace('.', ',')}k`;
    }
    return value.toFixed(0);
  };

  if (chartData.length === 0) return null;

  const maxValue = Math.max(...chartData.map((d) => d.value));

  return (
    <div className="rounded-xl bg-card p-4 animate-fade-in">
      <p className="mb-3 text-xs font-semibold text-muted-foreground">Distribuição no período</p>
      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barCategoryGap="20%">
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: 'hsl(var(--foreground))' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip
              cursor={{ fill: 'hsl(var(--muted) / 0.3)' }}
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '0.5rem',
                fontSize: '12px',
              }}
              formatter={(value: number) => [formatCurrency(value), 'Valor']}
              labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
              itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} animationDuration={800} animationEasing="ease-out">
              {chartData.map((entry, index) => (
                <Cell
                  key={`bar-${index}`}
                  fill={color}
                  opacity={maxValue > 0 ? 0.4 + (entry.value / maxValue) * 0.6 : 0.5}
                />
              ))}
              {showLabels(period) && (
                <LabelList
                  dataKey="value"
                  position="inside"
                  style={{ fontSize: 10, fontWeight: 600, fill: '#ffffff' }}
                  formatter={(v: number) => formatShort(v)}
                />
              )}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
