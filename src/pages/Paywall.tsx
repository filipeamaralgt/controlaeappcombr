import { useState } from 'react';
import { Crown, Check, Sparkles, Loader2, Shield, Smartphone } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GreenPageHeader } from '@/components/GreenPageHeader';
import { useSubscription, PLANS } from '@/hooks/useSubscription';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';

const PLAN_FEATURES = [
  'Registro de gastos e entradas pelo app',
  'Chat Dora/Kauê com IA 24h',
  'Categorização automática e personalizável de despesas',
  'Controle de dívidas, cartões e parcelamentos',
  'Criação e acompanhamento de metas financeiras',
  'Relatórios, gráficos e insights sobre seus gastos',
  'Exportação e importação de dados',
  'Compartilhamento de despesas com família ou parceiros',
  'Lembretes de contas e vencimentos',
  'Funciona no celular e computador',
];

const savingsPercent = Math.round(
  (1 - PLANS.annual.amount / (PLANS.monthly.amount * 12)) * 100
);

export default function Paywall() {
  const { startCheckout } = useSubscription();
  const isMobile = useIsMobile();
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  // Detect if running as installed PWA / mobile webview (heuristic)
  const isNativeMobile =
    typeof window !== 'undefined' &&
    (window.matchMedia('(display-mode: standalone)').matches ||
      /android|iphone|ipad/i.test(navigator.userAgent));

  const isWebOnly = !isNativeMobile || !isMobile;

  const handleCheckout = async (priceId: string) => {
    if (!isWebOnly) {
      toast.info('Para assinar, acesse pelo navegador do computador.');
      return;
    }
    setCheckoutLoading(priceId);
    try {
      await startCheckout(priceId);
    } catch {
      toast.error('Erro ao iniciar checkout. Tente novamente.');
    } finally {
      setCheckoutLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <GreenPageHeader
        title="Desbloqueie o Premium 👑"
        subtitle="Acesso completo a todas as funcionalidades. 7 dias grátis para testar."
      />

      <div className="mx-auto max-w-lg space-y-4 px-4 py-6">
        {/* Features list */}
        <Card className="border-primary/20">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              <h2 className="font-bold text-foreground">O que você ganha:</h2>
            </div>
            <ul className="space-y-2">
              {PLAN_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {f}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {isWebOnly ? (
          <>
            {/* Monthly */}
            <Card className="border-border/50">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-foreground">{PLANS.monthly.label}</h3>
                  <span className="text-xs text-muted-foreground">7 dias grátis</span>
                </div>
                <p className="text-2xl font-extrabold text-foreground">
                  {PLANS.monthly.price.split('/')[0]}
                  <span className="text-sm font-normal text-muted-foreground">
                    /{PLANS.monthly.price.split('/')[1]}
                  </span>
                </p>
                <Button
                  className="w-full gap-2"
                  onClick={() => handleCheckout(PLANS.monthly.priceId)}
                  disabled={!!checkoutLoading}
                >
                  {checkoutLoading === PLANS.monthly.priceId ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  Começar 7 dias grátis
                </Button>
              </CardContent>
            </Card>

            {/* Annual */}
            <Card className="border-primary/50 ring-2 ring-primary/20 shadow-lg shadow-primary/10">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-foreground">{PLANS.annual.label}</h3>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    Economize {savingsPercent}%
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-base text-muted-foreground line-through">
                    R$ {Math.round(PLANS.monthly.amount * 12)}
                  </span>
                  <p className="text-2xl font-extrabold text-foreground">
                    {PLANS.annual.price.split('/')[0]}
                    <span className="text-sm font-normal text-muted-foreground">
                      /{PLANS.annual.price.split('/')[1]}
                    </span>
                  </p>
                </div>
                <Button
                  className="w-full gap-2"
                  onClick={() => handleCheckout(PLANS.annual.priceId)}
                  disabled={!!checkoutLoading}
                >
                  {checkoutLoading === PLANS.annual.priceId ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  Começar 7 dias grátis
                </Button>
              </CardContent>
            </Card>
          </>
        ) : (
          /* Mobile native message */
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="p-6 text-center space-y-3">
              <Smartphone className="mx-auto h-10 w-10 text-amber-500" />
              <h2 className="text-lg font-bold text-foreground">Assine pelo navegador</h2>
              <p className="text-sm text-muted-foreground">
                Para assinar o plano Premium, acesse{' '}
                <span className="font-semibold text-foreground">controlaeappcombr.lovable.app</span>{' '}
                pelo navegador do seu computador ou celular.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Disclaimer */}
        <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3">
          <Shield className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            O pagamento será cobrado após o período de 7 dias gratuitos, caso não seja cancelado
            antes. Você pode cancelar a qualquer momento.
          </p>
        </div>
      </div>
    </div>
  );
}
