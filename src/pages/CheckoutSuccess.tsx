import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AppLogo } from '@/components/AppLogo';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight, Mail, KeyRound, Rocket } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function CheckoutSuccess() {
  useEffect(() => {
    const colors = ['#22c55e', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6', '#ef4444', '#14b8a6'];
    const bursts = 7;
    let i = 0;
    const id = setInterval(() => {
      if (i >= bursts) { clearInterval(id); return; }
      confetti({
        particleCount: 14,
        angle: 60,
        spread: 70,
        origin: { x: 0, y: 0.6 },
        colors,
      });
      confetti({
        particleCount: 14,
        angle: 120,
        spread: 70,
        origin: { x: 1, y: 0.6 },
        colors,
      });
      i++;
    }, 350);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-sm animate-fade-in">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex items-center gap-2">
            <AppLogo size="md" />
            <span className="text-xl font-bold tracking-tight text-foreground">Controlaê</span>
          </div>
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 animate-scale-in">
            <CheckCircle className="h-9 w-9 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Pagamento confirmado!
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sua assinatura está ativa. Agora crie sua conta para começar.
          </p>
        </div>

        <div className="rounded-2xl border border-border/40 bg-card/80 p-6 shadow-2xl backdrop-blur-sm">
          <h2 className="mb-4 text-sm font-semibold text-foreground">
            Como acessar o Controlaê:
          </h2>

          <ol className="space-y-4">
            <li className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">1</span>
              <div>
                <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <Mail className="h-4 w-4 text-muted-foreground" /> Use o mesmo email
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Crie sua conta com o <strong className="text-foreground">mesmo email</strong> usado no pagamento para ativar automaticamente.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">2</span>
              <div>
                <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <KeyRound className="h-4 w-4 text-muted-foreground" /> Crie uma senha
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">Escolha uma senha segura na tela de cadastro.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">3</span>
              <div>
                <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <Rocket className="h-4 w-4 text-muted-foreground" /> Comece a usar
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">Após o cadastro, sua assinatura será reconhecida automaticamente.</p>
              </div>
            </li>
          </ol>

          <Button asChild className="cta-primary cta-glow mt-6 h-14 w-full rounded-2xl text-base font-bold border-0 text-white gap-2 shadow-lg">
            <Link to="/auth?tab=signup">
              Criar minha conta
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Já tem conta?{' '}
            <Link to="/auth" className="text-primary underline underline-offset-2 hover:text-primary/80 font-medium">
              Fazer login
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground/60">
          Dúvidas? contato@controlaeapp.com.br
        </p>
      </div>
    </div>
  );
}
