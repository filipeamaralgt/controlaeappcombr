import { TrendingUp, TrendingDown, Scale } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface BalanceCardProps {
  totalIncome: number;
  totalExpenses: number;
  periodIncome?: number;
  periodExpenses?: number;
}

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function BalanceCard({ totalIncome, totalExpenses, periodIncome, periodExpenses }: BalanceCardProps) {
  const balance = totalIncome - totalExpenses;
  const displayIncome = periodIncome ?? totalIncome;
  const displayExpenses = periodExpenses ?? totalExpenses;
  const isPositive = balance >= 0;

  return (
    <div className="grid gap-3 grid-cols-3">
      <Card className="group relative overflow-hidden">
        <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-primary/5 transition-transform group-hover:scale-125" />
        <CardHeader className="p-3 pb-0.5">
          <CardTitle className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10">
              <TrendingUp className="h-3 w-3 text-primary" />
            </div>
            Receitas
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-1">
          <p className="text-sm sm:text-lg font-bold tabular-nums text-primary">{formatCurrency(displayIncome)}</p>
        </CardContent>
      </Card>

      <Card className="group relative overflow-hidden">
        <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-destructive/5 transition-transform group-hover:scale-125" />
        <CardHeader className="p-3 pb-0.5">
          <CardTitle className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-destructive/10">
              <TrendingDown className="h-3 w-3 text-destructive" />
            </div>
            Despesas
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-1">
          <p className="text-sm sm:text-lg font-bold tabular-nums text-destructive">{formatCurrency(displayExpenses)}</p>
        </CardContent>
      </Card>

      <Card className="group relative overflow-hidden">
        <div className={`absolute -right-4 -top-4 h-16 w-16 rounded-full transition-transform group-hover:scale-125 ${isPositive ? 'bg-primary/5' : 'bg-destructive/5'}`} />
        <CardHeader className="p-3 pb-0.5">
          <CardTitle className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            <div className={`flex h-6 w-6 items-center justify-center rounded-lg ${isPositive ? 'bg-primary/10' : 'bg-destructive/10'}`}>
              <Scale className={`h-3 w-3 ${isPositive ? 'text-primary' : 'text-destructive'}`} />
            </div>
            Balanço
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-1">
          <p className={`text-sm sm:text-lg font-bold tabular-nums ${isPositive ? 'text-primary' : 'text-destructive'}`}>
            {formatCurrency(balance)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}