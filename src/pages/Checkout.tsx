import { useState } from 'react';
import { Crown, Check, Sparkles, Loader2, Shield, Mail } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GreenPageHeader } from '@/components/GreenPageHeader';
import { useSubscription, PLANS } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const PLAN_FEATURES = [
  'Chat com IA 24h',
  'Categorização automática de despesas',
  'Controle de dívidas, cartões e parcelamentos',
  'Metas financeiras e relatórios',
  'Exportação e importação de dados',
  'Lembretes de contas e vencimentos',
];

const savingsPercent = Math.round(
  (1 - PLANS.annual.amount / (PLANS.monthly.amount * 12)) * 100
);

export default function Checkout() {
  const { startCheckout } = useSubscription();
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');
  const [whatsapp, setWhatsapp] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const plan = PLANS[selectedPlan];

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    try {
      await startCheckout(plan.priceId);
    } catch {
      toast.error('Erro ao iniciar checkout. Tente novamente.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <GreenPageHeader
        title="Finalizar Assinatura 👑"
        subtitle="Escolha seu plano e comece com 7 dias grátis."
      />

      <div className="mx-auto max-w-lg space-y-5 px-4 py-6">
        {/* User info */}
        <Card className="border-border/50">
          <CardContent className="p-5 space-y-4">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              Seus dados
            </h3>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Email
              </Label>
              <Input
                value={user?.email ?? ''}
                disabled
                className="h-11 rounded-xl bg-muted/40"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                WhatsApp (opcional)
              </Label>
              <Input
                type="tel"
                placeholder="(11) 99999-9999"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="h-11 rounded-xl border-border/60 bg-muted/40"
              />
            </div>
          </CardContent>
        </Card>

        {/* Plan selection */}
        <div className="grid grid-cols-2 gap-3">
          {/* Monthly */}
          <button
            type="button"
            onClick={() => setSelectedPlan('monthly')}
            className={`rounded-xl border-2 p-4 text-left transition-all ${
              selectedPlan === 'monthly'
                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                : 'border-border/50 hover:border-border'
            }`}
          >
            <p className="text-xs font-semibold text-muted-foreground">{PLANS.monthly.label}</p>
            <p className="mt-1 text-lg font-extrabold text-foreground">
              R$ {PLANS.monthly.amount.toFixed(2).replace('.', ',')}
            </p>
            <p className="text-xs text-muted-foreground">/mês</p>
          </button>

          {/* Annual */}
          <button
            type="button"
            onClick={() => setSelectedPlan('annual')}
            className={`relative rounded-xl border-2 p-4 text-left transition-all ${
              selectedPlan === 'annual'
                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                : 'border-border/50 hover:border-border'
            }`}
          >
            <span className="absolute -top-2.5 right-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
              -{savingsPercent}%
            </span>
            <p className="text-xs font-semibold text-muted-foreground">{PLANS.annual.label}</p>
            <p className="mt-1 text-lg font-extrabold text-foreground">
              R$ {PLANS.annual.amount.toFixed(2).replace('.', ',')}
            </p>
            <p className="text-xs text-muted-foreground">/ano</p>
          </button>
        </div>

        {/* Features */}
        <Card className="border-primary/20">
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <Crown className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">Incluso no Premium:</h3>
            </div>
            <ul className="space-y-1.5">
              {PLAN_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  {f}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* CTA */}
        <Button
          className="w-full gap-2 h-12 text-base font-bold shadow-lg shadow-primary/20"
          size="lg"
          onClick={handleCheckout}
          disabled={checkoutLoading}
        >
          {checkoutLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Sparkles className="h-5 w-5" />
          )}
          Continuar para pagamento
        </Button>

        {/* Disclaimer */}
        <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3">
          <Shield className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            O pagamento será cobrado após o período de 7 dias gratuitos.
            Cancele a qualquer momento sem custo.
          </p>
        </div>
      </div>
    </div>
  );
}
