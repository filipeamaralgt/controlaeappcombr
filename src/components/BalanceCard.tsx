import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface BalanceCardProps {
  totalIncome: number;
  totalExpenses: number;
  periodIncome?: number;
  periodExpenses?: number;
}

export function BalanceCard({ totalIncome, totalExpenses, periodIncome, periodExpenses }: BalanceCardProps) {
  const balance = totalIncome - totalExpenses;
  const displayIncome = periodIncome ?? totalIncome;
  const displayExpenses = periodExpenses ?? totalExpenses;
  const isPositive = balance >= 0;

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="space-y-2">
      <Card className="border-border/30 bg-gradient-to-br from-primary/20 via-primary/10 to-secondary/5 shadow-lg">
        <CardContent className="p-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/20">
              <Wallet className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-medium text-muted-foreground">Saldo Total</p>
              <p className={`text-lg font-bold ${isPositive ? 'text-primary' : 'text-destructive'}`}>
                {formatCurrency(balance)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-2">
        <Card className="border-border/30 bg-card">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15">
                <TrendingUp className="h-3.5 w-3.5 text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-medium text-muted-foreground">Receitas</p>
                <p className="text-xs font-bold text-primary">{formatCurrency(displayIncome)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/30 bg-card">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-destructive/15">
                <TrendingDown className="h-3.5 w-3.5 text-destructive" />
              </div>
              <div>
                <p className="text-[10px] font-medium text-muted-foreground">Despesas</p>
                <p className="text-xs font-bold text-destructive">{formatCurrency(displayExpenses)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
