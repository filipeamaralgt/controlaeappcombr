import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface BalanceCardProps {
  totalIncome: number;
  totalExpenses: number;
}

export function BalanceCard({ totalIncome, totalExpenses }: BalanceCardProps) {
  const balance = totalIncome - totalExpenses;
  const isPositive = balance >= 0;

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="space-y-3">
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-500 via-emerald-400 to-teal-400 shadow-xl shadow-emerald-500/20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.2)_0%,_transparent_60%)]" />
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/15 blur-2xl" />
        <CardContent className="relative p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/25 backdrop-blur-sm">
              <Wallet className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-xs font-medium text-white/80">Saldo Total</p>
              <p className={`text-2xl font-bold ${isPositive ? 'text-white' : 'text-red-200'}`}>
                {formatCurrency(balance)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card className="border-border/30 bg-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-medium text-muted-foreground">Receitas</p>
                <p className="text-sm font-bold text-primary">{formatCurrency(totalIncome)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/30 bg-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/15">
                <TrendingDown className="h-4 w-4 text-destructive" />
              </div>
              <div>
                <p className="text-[10px] font-medium text-muted-foreground">Despesas</p>
                <p className="text-sm font-bold text-destructive">{formatCurrency(totalExpenses)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
