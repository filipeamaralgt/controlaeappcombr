import { Card, CardContent } from '@/components/ui/card';
import { User } from 'lucide-react';

interface ProfileRequiredGuardProps {
  icon?: React.ReactNode;
  title?: string;
  message?: string;
}

export function ProfileRequiredGuard({
  icon,
  title = 'Selecione um perfil',
  message = 'Esta seção é pessoal. Selecione um perfil no cabeçalho para visualizar.',
}: ProfileRequiredGuardProps) {
  return (
    <Card className="border-border/50 bg-card">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          {icon || <User className="h-8 w-8 text-primary" />}
        </div>
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  );
}
