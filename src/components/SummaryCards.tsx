import { TrendingUp, TrendingDown, Scale } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SummaryCardsProps {
  income: number;
  expenses: number;
  balance: number;
}

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function SummaryCards({ income, expenses, balance }: SummaryCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card className="group relative overflow-hidden border-border/40 bg-gradient-to-br from-card to-card/80 shadow-lg transition-shadow hover:shadow-xl">
        <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-primary/5 transition-transform group-hover:scale-125" />
        <CardHeader className="pb-1">
          <CardTitle className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
            </div>
            Receitas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold tabular-nums text-primary">{formatCurrency(income)}</p>
        </CardContent>
      </Card>

      <Card className="group relative overflow-hidden border-border/40 bg-gradient-to-br from-card to-card/80 shadow-lg transition-shadow hover:shadow-xl">
        <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-destructive/5 transition-transform group-hover:scale-125" />
        <CardHeader className="pb-1">
          <CardTitle className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-destructive/10">
              <TrendingDown className="h-3.5 w-3.5 text-destructive" />
            </div>
            Despesas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold tabular-nums text-destructive">{formatCurrency(expenses)}</p>
        </CardContent>
      </Card>

      <Card className="group relative overflow-hidden border-border/40 bg-gradient-to-br from-card to-card/80 shadow-lg transition-shadow hover:shadow-xl">
        <div className={`absolute -right-4 -top-4 h-20 w-20 rounded-full transition-transform group-hover:scale-125 ${balance >= 0 ? 'bg-primary/5' : 'bg-destructive/5'}`} />
        <CardHeader className="pb-1">
          <CardTitle className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${balance >= 0 ? 'bg-primary/10' : 'bg-destructive/10'}`}>
              <Scale className={`h-3.5 w-3.5 ${balance >= 0 ? 'text-primary' : 'text-destructive'}`} />
            </div>
            Balanço
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className={`text-2xl font-bold tabular-nums ${balance >= 0 ? 'text-primary' : 'text-destructive'}`}>
            {formatCurrency(balance)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
