import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AppLogo } from '@/components/AppLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { Mail, Loader2, AlertCircle, Crown, ArrowLeft } from 'lucide-react';
import { z } from 'zod';

const emailSchema = z.string().email('Email inválido');

const PLANS: Record<string, { label: string; price: string; desc: string }> = {
  mensal: { label: 'Plano Mensal', price: 'R$ 11,90/mês', desc: '7 dias grátis para testar' },
  anual: { label: 'Plano Anual', price: 'R$ 97/ano', desc: '7 dias grátis · Economize 32%' },
};

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const planParam = searchParams.get('plan') || 'mensal';
  const plan = PLANS[planParam] ? planParam : 'mensal';
  const planInfo = PLANS[plan];

  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const result = emailSchema.safeParse(email);
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('create-checkout', {
        body: { email, plan },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);
      if (!data?.url) throw new Error('Não foi possível criar a sessão de pagamento.');

      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar. Tente novamente.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-sm animate-fade-in">
        <div className="mb-10 flex flex-col items-center text-center">
          <AppLogo size="lg" className="mb-4" />
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Assinar {planInfo.label}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{planInfo.desc}</p>
        </div>

        <div className="rounded-2xl border border-border/40 bg-card/80 p-6 shadow-2xl backdrop-blur-sm">
          <div className="mb-6 flex items-center justify-between rounded-xl bg-primary/10 p-4">
            <div>
              <p className="text-sm font-semibold text-foreground">{planInfo.label}</p>
              <p className="text-xs text-muted-foreground">Cancele quando quiser</p>
            </div>
            <span className="text-lg font-extrabold text-primary">{planInfo.price}</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="checkout-email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Seu email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="checkout-email"
                  type="email"
                  placeholder="seu@email.com"
                  className="h-11 rounded-xl border-border/60 bg-muted/40 pl-10 transition-colors focus:bg-background"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Use o mesmo email para criar sua conta depois.
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2.5 rounded-xl bg-destructive/10 p-3.5 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="h-11 w-full rounded-xl text-sm font-semibold shadow-lg shadow-primary/20 gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Crown className="h-4 w-4" /> Ir para pagamento
                </>
              )}
            </Button>
          </form>

          <a
            href="/landing"
            className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3 w-3" /> Voltar
          </a>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground/60">
          Pagamento seguro via Stripe. 7 dias grátis.
        </p>
      </div>
    </div>
  );
}
