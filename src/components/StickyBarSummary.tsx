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
    <div className="sticky top-0 z-20 animate-fade-in">
      <div className="rounded-xl bg-card/95 backdrop-blur-sm px-4 py-3 shadow-lg border border-border/30">
        <div className="flex h-3 w-full overflow-hidden rounded-full">
          {segments.map((seg, i) => (
            <div
              key={i}
              className="h-full transition-all duration-500"
              style={{
                width: `${Math.max(seg.percentage, 0.5)}%`,
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
