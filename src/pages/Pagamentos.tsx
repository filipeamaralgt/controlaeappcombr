import { CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Pagamentos() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
      <h1 className="text-2xl font-bold text-foreground">Pagamentos Regulares</h1>

      <Card className="border-border/50 bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="h-5 w-5 text-primary" />
            Despesas Recorrentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <CreditCard className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Em breve!</h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Aqui você poderá cadastrar pagamentos recorrentes como aluguel, assinaturas e contas mensais para lançamento automático.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
