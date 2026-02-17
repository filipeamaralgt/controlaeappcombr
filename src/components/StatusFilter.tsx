import { cn } from '@/lib/utils';

const EXPENSE_STATUSES = [
  { value: 'all', label: 'Todos' },
  { value: 'overdue', label: 'Atrasado', color: 'bg-destructive/15 text-destructive' },
  { value: 'to_pay', label: 'A pagar', color: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
  { value: 'paid', label: 'Pago', color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
];

const INCOME_STATUSES = [
  { value: 'all', label: 'Todos' },
  { value: 'to_receive', label: 'A receber', color: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
  { value: 'received', label: 'Recebido', color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
];

interface StatusFilterProps {
  type: 'expense' | 'income';
  value: string;
  onChange: (status: string) => void;
}

export function StatusFilter({ type, value, onChange }: StatusFilterProps) {
  const statuses = type === 'expense' ? EXPENSE_STATUSES : INCOME_STATUSES;

  return (
    <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
      {statuses.map((s) => (
        <button
          key={s.value}
          onClick={() => onChange(s.value)}
          className={cn(
            'shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-all',
            value === s.value
              ? s.value === 'all'
                ? 'bg-primary text-primary-foreground'
                : s.color || 'bg-primary text-primary-foreground'
              : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
