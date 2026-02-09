import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays, subWeeks, subMonths, subYears, format, differenceInDays } from 'date-fns';
import { PeriodType } from '@/components/PeriodFilter';

export function getPreviousDateRange(
  period: PeriodType,
  customRange?: { from?: Date; to?: Date }
): { start: string; end: string } {
  const now = new Date();

  switch (period) {
    case 'day': {
      const prev = subDays(now, 1);
      return { start: format(startOfDay(prev), 'yyyy-MM-dd'), end: format(endOfDay(prev), 'yyyy-MM-dd') };
    }
    case 'week': {
      const prev = subWeeks(now, 1);
      return {
        start: format(startOfWeek(prev, { weekStartsOn: 0 }), 'yyyy-MM-dd'),
        end: format(endOfWeek(prev, { weekStartsOn: 0 }), 'yyyy-MM-dd'),
      };
    }
    case 'month': {
      const prev = subMonths(now, 1);
      return {
        start: format(startOfMonth(prev), 'yyyy-MM-dd'),
        end: format(endOfMonth(prev), 'yyyy-MM-dd'),
      };
    }
    case 'year': {
      const prev = subYears(now, 1);
      return {
        start: format(startOfYear(prev), 'yyyy-MM-dd'),
        end: format(endOfYear(prev), 'yyyy-MM-dd'),
      };
    }
    case 'custom': {
      if (customRange?.from && customRange?.to) {
        const days = differenceInDays(customRange.to, customRange.from);
        const prevEnd = subDays(customRange.from, 1);
        const prevStart = subDays(prevEnd, days);
        return { start: format(prevStart, 'yyyy-MM-dd'), end: format(prevEnd, 'yyyy-MM-dd') };
      }
      const prev = subMonths(now, 1);
      return {
        start: format(startOfMonth(prev), 'yyyy-MM-dd'),
        end: format(endOfMonth(prev), 'yyyy-MM-dd'),
      };
    }
    default: {
      const prev = subMonths(now, 1);
      return {
        start: format(startOfMonth(prev), 'yyyy-MM-dd'),
        end: format(endOfMonth(prev), 'yyyy-MM-dd'),
      };
    }
  }
}

export function getPeriodLabel(period: PeriodType): string {
  switch (period) {
    case 'day': return 'ontem';
    case 'week': return 'semana passada';
    case 'month': return 'mês passado';
    case 'year': return 'ano passado';
    case 'custom': return 'período anterior';
    default: return 'período anterior';
  }
}
