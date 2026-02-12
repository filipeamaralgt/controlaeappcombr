import { useState } from 'react';
import { Check, Crown, Sparkles, Loader2, Shield } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GreenPageHeader } from '@/components/GreenPageHeader';
import { useSubscription, PLANS } from '@/hooks/useSubscription';
import { toast } from 'sonner';

const savingsPercent = Math.round(
  (1 - PLANS.annual.amount / (PLANS.monthly.amount * 12)) * 100
);

export default function Assinatura() {
  const { subscribed, productId, isTrial, subscriptionEnd, loading, startCheckout, openPortal } =
    useSubscription();
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  const handleCheckout = async (priceId: string) => {
    setCheckoutLoading(priceId);
    try {
      await startCheckout(priceId);
    } catch {
      toast.error('Erro ao iniciar checkout. Tente novamente.');
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handlePortal = async () => {
    try {
      await openPortal();
    } catch {
      toast.error('Erro ao abrir portal de assinatura.');
    }
  };

  const activePlan =
    productId === PLANS.monthly.productId
      ? 'monthly'
      : productId === PLANS.annual.productId
        ? 'annual'
        : null;

  return (
    <div className="min-h-screen bg-background">
      <GreenPageHeader
        title="Experimente o Controlaê grátis por 7 dias 🎁"
        subtitle="Acesso completo a todas as funcionalidades. Cancele a qualquer momento antes do fim do teste."
      />

      <div className="mx-auto max-w-lg space-y-4 px-4 py-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : subscribed ? (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-6 text-center space-y-3">
              <Crown className="mx-auto h-10 w-10 text-primary" />
              <h2 className="text-lg font-bold text-foreground">
                {isTrial ? 'Período de teste ativo' : 'Assinatura ativa'} ✨
              </h2>
              <p className="text-sm text-muted-foreground">
                Plano: {activePlan === 'annual' ? PLANS.annual.label : PLANS.monthly.label}
              </p>
              {subscriptionEnd && (
                <p className="text-xs text-muted-foreground">
                  {isTrial ? 'Teste até' : 'Renova em'}:{' '}
                  {new Date(subscriptionEnd).toLocaleDateString('pt-BR')}
                </p>
              )}
              <Button variant="outline" className="mt-2" onClick={handlePortal}>
                Gerenciar assinatura
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Monthly */}
            <PlanCard
              label={PLANS.monthly.label}
              price={PLANS.monthly.price}
              trial="7 dias grátis"
              features={['Todas as funcionalidades', 'IA financeira', 'Relatórios ilimitados']}
              loading={checkoutLoading === PLANS.monthly.priceId}
              disabled={!!checkoutLoading}
              onSelect={() => handleCheckout(PLANS.monthly.priceId)}
            />

            {/* Annual */}
            <PlanCard
              label={PLANS.annual.label}
              price={PLANS.annual.price}
              trial="7 dias grátis"
              badge={`Economize ${savingsPercent}%`}
              highlight
              features={['Todas as funcionalidades', 'IA financeira', 'Relatórios ilimitados']}
              loading={checkoutLoading === PLANS.annual.priceId}
              disabled={!!checkoutLoading}
              onSelect={() => handleCheckout(PLANS.annual.priceId)}
            />

            {/* Disclaimer */}
            <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3">
              <Shield className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                O pagamento será cobrado após o período de 7 dias gratuitos, caso não seja cancelado
                antes. Você pode cancelar a qualquer momento pelo portal de assinatura.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

interface PlanCardProps {
  label: string;
  price: string;
  trial: string;
  badge?: string;
  highlight?: boolean;
  features: string[];
  loading: boolean;
  disabled: boolean;
  onSelect: () => void;
}

function PlanCard({
  label,
  price,
  trial,
  badge,
  highlight,
  features,
  loading,
  disabled,
  onSelect,
}: PlanCardProps) {
  return (
    <Card
      className={
        highlight
          ? 'border-primary/50 ring-2 ring-primary/20 shadow-lg shadow-primary/10'
          : 'border-border/50'
      }
    >
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-foreground">{label}</h3>
            <p className="text-xs text-muted-foreground">{trial}</p>
          </div>
          {badge && (
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {badge}
            </span>
          )}
        </div>

        <p className="text-2xl font-extrabold text-foreground">
          {price.split('/')[0]}
          <span className="text-sm font-normal text-muted-foreground">/{price.split('/')[1]}</span>
        </p>

        <ul className="space-y-1.5">
          {features.map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="h-4 w-4 text-primary" />
              {f}
            </li>
          ))}
        </ul>

        <Button className="w-full gap-2" onClick={onSelect} disabled={disabled}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          Começar 7 dias grátis
        </Button>
      </CardContent>
    </Card>
  );
}
