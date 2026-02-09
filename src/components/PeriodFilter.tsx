import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DateRange } from 'react-day-picker';

export type PeriodType = 'day' | 'week' | 'month' | 'year' | 'custom';

interface PeriodFilterProps {
  selected: PeriodType;
  onSelect: (period: PeriodType) => void;
  customRange?: { from?: Date; to?: Date };
  onCustomRangeChange?: (range: { from?: Date; to?: Date }) => void;
}

const periods: { value: PeriodType; label: string }[] = [
  { value: 'day', label: 'Dia' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mês' },
  { value: 'year', label: 'Ano' },
  { value: 'custom', label: 'Período' },
];

export function PeriodFilter({ selected, onSelect, customRange, onCustomRangeChange }: PeriodFilterProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);

  const handlePeriodClick = (period: PeriodType) => {
    if (period === 'custom') {
      setPopoverOpen(true);
    }
    onSelect(period);
  };

  const handleRangeSelect = (range: DateRange | undefined) => {
    onCustomRangeChange?.({ from: range?.from, to: range?.to });
    if (range?.from && range?.to) {
      setPopoverOpen(false);
    }
  };

  const customLabel = selected === 'custom' && customRange?.from && customRange?.to
    ? `${format(customRange.from, 'dd/MM', { locale: ptBR })} - ${format(customRange.to, 'dd/MM', { locale: ptBR })}`
    : null;

  return (
    <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
      {periods.map((period) => {
        const isSelected = selected === period.value;
        const isCustom = period.value === 'custom';

        if (isCustom) {
          return (
            <Popover key="custom" open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'shrink-0 rounded-full text-xs font-medium transition-all',
                    isSelected
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground'
                      : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                  onClick={() => handlePeriodClick('custom')}
                >
                  <CalendarIcon className="mr-1 h-3.5 w-3.5" />
                  {customLabel || period.label}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="range"
                  selected={customRange?.from ? { from: customRange.from, to: customRange.to } : undefined}
                  onSelect={handleRangeSelect}
                  numberOfMonths={1}
                  locale={ptBR}
                  className={cn('p-3 pointer-events-auto')}
                />
              </PopoverContent>
            </Popover>
          );
        }

        return (
          <Button
            key={period.value}
            variant="ghost"
            size="sm"
            className={cn(
              'shrink-0 rounded-full text-xs font-medium transition-all',
              isSelected
                ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground'
                : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
            onClick={() => handlePeriodClick(period.value)}
          >
            {period.label}
          </Button>
        );
      })}
    </div>
  );
}
