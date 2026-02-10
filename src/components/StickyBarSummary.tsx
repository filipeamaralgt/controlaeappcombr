import { useMemo } from 'react';

interface StickyBarSummaryProps {
  data: { name: string; value: number; color: string }[];
  total: number;
  visible: boolean;
}

export function StickyBarSummary({ data, total, visible }: StickyBarSummaryProps) {
  const formatCurrency = (value: number) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const segments = useMemo(() => {
    if (total === 0) return [];
    return data.map((item) => ({
      ...item,
      percentage: (item.value / total) * 100,
    }));
  }, [data, total]);

  if (!visible || segments.length === 0) return null;

  return (
    <div
      className="fixed left-0 right-0 z-30 px-4 transition-all duration-300"
      style={{ top: '3.5rem' }}
    >
      <div className="mx-auto max-w-4xl rounded-xl bg-card/95 backdrop-blur-md px-4 py-3 shadow-lg border border-border/30">
        <div className="flex h-3 w-full overflow-hidden rounded-full gap-[2px]">
          {segments.map((seg, i) => (
            <div
              key={i}
              className="h-full rounded-sm transition-all duration-500"
              style={{
                width: `${Math.max(seg.percentage, 1)}%`,
                backgroundColor: seg.color,
              }}
            />
          ))}
        </div>
        <p className="mt-2 text-center text-lg font-bold text-foreground">
          {formatCurrency(total)}
        </p>
      </div>
    </div>
  );
}
