import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AppLogo } from '@/components/AppLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { Mail, Loader2, AlertCircle, ArrowLeft, Check, Phone, Rocket, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { z } from 'zod';

const emailSchema = z.string().email('Email inválido');
const nameSchema = z.string().trim().min(2, 'Informe seu nome').max(100);

const PLANS: Record<string, { label: string; price: string; originalPrice?: string; desc: string }> = {
  mensal: { label: 'Plano Mensal', price: 'R$ 11,90/mês', desc: '' },
  anual: { label: 'Plano Anual', price: 'R$ 97,00/ano', originalPrice: 'R$ 142', desc: 'Economize 32%' },
};

export default function Checkout() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const planParam = searchParams.get('plan') || 'mensal';
  const isDirectAnual = planParam === 'anual';
  const [selectedPlan, setSelectedPlan] = useState(PLANS[planParam] ? planParam : 'mensal');
  const planInfo = PLANS[selectedPlan];

  const handlePlanChange = (plan: string) => {
    setSelectedPlan(plan);
    setSearchParams({ plan });
  };

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [consent, setConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const nameResult = nameSchema.safeParse(name);
    if (!nameResult.success) {
      setError(nameResult.error.errors[0].message);
      return;
    }

    const result = emailSchema.safeParse(email);
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    if (!consent) {
      setError('Você precisa concordar com o uso dos seus dados para continuar.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Save lead
      await supabase.from('leads').insert({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        consent: true,
      });

      const { data, error: fnError } = await supabase.functions.invoke('create-checkout', {
        body: { email, name: name.trim(), whatsapp, plan: selectedPlan },
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
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {isDirectAnual ? 'Plano Anual' : 'Escolha seu plano'}
          </h1>
          {isDirectAnual && (
            <p className="mt-1 text-sm text-muted-foreground">
              Economize 32% — apenas <strong className="text-foreground">R$ 8,08/mês</strong>
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-border/40 bg-card/80 p-6 shadow-2xl backdrop-blur-sm">
          {/* Plan selector — hidden if came from anual CTA */}
          {isDirectAnual ? (
            <div className="mb-6 rounded-xl border-2 border-primary bg-primary/5 p-4 text-center">
              <p className="text-sm font-semibold text-muted-foreground">Plano Anual</p>
              <div className="mt-1 flex items-baseline justify-center gap-1 whitespace-nowrap">
                <span className="text-xs text-muted-foreground line-through">R$ 142</span>
                <span className="text-2xl font-extrabold text-foreground">R$ 97,00</span>
                <span className="text-sm text-muted-foreground">/ano</span>
              </div>
              <p className="mt-1 text-xs text-primary font-semibold">R$ 8,08/mês • Economize 32%</p>
            </div>
          ) : (
            <div className="mb-6 grid grid-cols-2 gap-3">
              {Object.entries(PLANS).map(([key, p]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handlePlanChange(key)}
                  className={cn(
                    "relative rounded-xl border-2 p-3 text-left transition-all",
                    selectedPlan === key
                      ? "border-primary bg-primary/5"
                      : "border-border/60 hover:border-border"
                  )}
                >
                  {key === 'anual' && (
                    <span className="absolute -top-2.5 right-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                      -32%
                    </span>
                  )}
                  <p className="text-xs font-semibold text-muted-foreground">{p.label}</p>
                  <p className="mt-0.5 text-sm font-extrabold text-foreground whitespace-nowrap">
                    {p.originalPrice && <span className="mr-1 text-[10px] font-medium text-muted-foreground line-through">{p.originalPrice}</span>}
                    {p.price}
                  </p>
                  {selectedPlan === key && (
                    <Check className="absolute right-2 bottom-2 h-4 w-4 text-primary" />
                  )}
                </button>
              ))}
            </div>
          )}

          <p className="mb-6 text-center text-xs font-medium text-muted-foreground">
            7 dias para testar. Não gostou? <span className="font-bold text-foreground">Reembolso garantido.</span>
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="checkout-name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Seu nome
              </Label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="checkout-name"
                  type="text"
                  placeholder="Seu nome completo"
                  className="h-11 rounded-xl border-border/60 bg-muted/40 pl-10 transition-colors focus:bg-background"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                  maxLength={100}
                />
              </div>
            </div>

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
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Use o mesmo email para criar sua conta depois.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="checkout-whatsapp" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Seu WhatsApp
              </Label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="checkout-whatsapp"
                  type="tel"
                  placeholder="(11) 99999-9999"
                  className="h-11 rounded-xl border-border/60 bg-muted/40 pl-10 transition-colors focus:bg-background"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Para recuperação de conta, caso necessário.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="checkout-consent"
                checked={consent}
                onCheckedChange={(checked) => setConsent(checked === true)}
                className="mt-0.5"
              />
              <Label htmlFor="checkout-consent" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                Concordo em receber comunicações do Controlaê e que meus dados sejam usados conforme a{' '}
                <span className="text-foreground font-medium">Política de Privacidade</span>.
              </Label>
            </div>

            {error && (
              <div className="flex items-center gap-2.5 rounded-xl bg-destructive/10 p-3.5 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="cta-primary cta-glow h-14 w-full rounded-2xl text-base font-bold border-0 text-white gap-2 shadow-lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Rocket className="h-5 w-5" />
                  {isDirectAnual ? 'Garantir meu plano anual' : selectedPlan === 'anual' ? 'Economizar 32% agora' : 'Começar por R$ 11,90/mês'}
                </>
              )}
            </Button>
          </form>

          <button
            onClick={() => navigate('/landing')}
            className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
          >
            <ArrowLeft className="h-3 w-3" /> Voltar
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground/60">
          Pagamento seguro via Stripe.
        </p>
      </div>
    </div>
  );
}
