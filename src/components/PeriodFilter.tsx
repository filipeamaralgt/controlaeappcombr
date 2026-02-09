import { Button } from '@/components/ui/button';

export type PeriodType = 'day' | 'week' | 'month' | 'year' | 'custom';

interface PeriodFilterProps {
  selected: PeriodType;
  onSelect: (period: PeriodType) => void;
}

const periods: { value: PeriodType; label: string }[] = [
  { value: 'day', label: 'Dia' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mês' },
  { value: 'year', label: 'Ano' },
];

export function PeriodFilter({ selected, onSelect }: PeriodFilterProps) {
  return (
    <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
      {periods.map((period) => (
        <Button
          key={period.value}
          variant={selected === period.value ? 'default' : 'secondary'}
          size="sm"
          className="shrink-0 rounded-full text-xs"
          onClick={() => onSelect(period.value)}
        >
          {period.label}
        </Button>
      ))}
    </div>
  );
}
