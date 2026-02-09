import { MessageCircle, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ChatIA() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
      <h1 className="text-2xl font-bold text-foreground">Chat IA</h1>

      <Card className="border-border/50 bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            Assistente Financeiro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <MessageCircle className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Em breve!</h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Converse com nossa IA para obter insights sobre suas finanças, dicas de economia e análises personalizadas.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
