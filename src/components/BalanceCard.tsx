import { TrendingUp, TrendingDown, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface BalanceCardProps {
  totalIncome: number;
  totalExpenses: number;
  periodIncome?: number;
  periodExpenses?: number;
}

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function BalanceCard({ totalIncome, totalExpenses, periodIncome, periodExpenses }: BalanceCardProps) {
  const [visible, setVisible] = useState(true);
  const balance = totalIncome - totalExpenses;
  const displayIncome = periodIncome ?? totalIncome;
  const displayExpenses = periodExpenses ?? totalExpenses;
  const isPositive = balance >= 0;

  const hidden = '••••••';

  return (
    <div className="space-y-3">
      {/* Hero balance card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-4 text-primary-foreground shadow-lg shadow-primary/20">
        {/* Decorative circles */}
        <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-primary-foreground/5" />
        <div className="absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-primary-foreground/5" />

        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-primary-foreground/70 uppercase tracking-wider">Saldo Total</p>
            <button
              onClick={() => setVisible(!visible)}
              className="rounded-full p-1.5 transition-colors hover:bg-primary-foreground/10"
              aria-label={visible ? 'Ocultar saldo' : 'Mostrar saldo'}
            >
              {visible ? <Eye className="h-4 w-4 text-primary-foreground/70" /> : <EyeOff className="h-4 w-4 text-primary-foreground/70" />}
            </button>
          </div>
          <p className={cn(
            'mt-0.5 text-2xl font-bold tabular-nums tracking-tight',
            !isPositive && 'text-destructive-foreground/80'
          )}>
            {visible ? formatCurrency(balance) : hidden}
          </p>
        </div>
      </div>

      {/* Income / Expense mini cards */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center gap-2.5 rounded-xl border border-border/50 bg-card p-3 shadow-sm">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-muted-foreground">Receitas</p>
            <p className="truncate text-sm font-bold tabular-nums text-primary">
              {visible ? formatCurrency(displayIncome) : hidden}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-card p-3.5 shadow-sm">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-destructive/10">
            <TrendingDown className="h-4 w-4 text-destructive" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-muted-foreground">Despesas</p>
            <p className="truncate text-sm font-bold tabular-nums text-destructive">
              {visible ? formatCurrency(displayExpenses) : hidden}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
