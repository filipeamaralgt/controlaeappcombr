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
    <div className="space-y-2">
      {/* Hero balance card */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 px-4 py-3 text-primary-foreground shadow-md shadow-primary/20">
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary-foreground/5" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-medium text-primary-foreground/70 uppercase tracking-wider">Saldo Total</p>
            <p className={cn(
              'text-xl font-bold tabular-nums tracking-tight',
              !isPositive && 'text-destructive-foreground/80'
            )}>
              {visible ? formatCurrency(balance) : hidden}
            </p>
          </div>
          <button
            onClick={() => setVisible(!visible)}
            className="rounded-full p-1 transition-colors hover:bg-primary-foreground/10"
            aria-label={visible ? 'Ocultar saldo' : 'Mostrar saldo'}
          >
            {visible ? <Eye className="h-3.5 w-3.5 text-primary-foreground/70" /> : <EyeOff className="h-3.5 w-3.5 text-primary-foreground/70" />}
          </button>
        </div>
      </div>

      {/* Income / Expense mini cards */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-card px-2.5 py-2 shadow-sm">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <TrendingUp className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-medium text-muted-foreground">Receitas</p>
            <p className="truncate text-xs font-bold tabular-nums text-primary">
              {visible ? formatCurrency(displayIncome) : hidden}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-card px-2.5 py-2 shadow-sm">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
            <TrendingDown className="h-3.5 w-3.5 text-destructive" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-medium text-muted-foreground">Despesas</p>
            <p className="truncate text-xs font-bold tabular-nums text-destructive">
              {visible ? formatCurrency(displayExpenses) : hidden}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
