import { Globe, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GreenPageHeader } from '@/components/GreenPageHeader';

const SITE_URL = 'https://controlaeappcombr.lovable.app/assinatura';

export default function AssinarNoSite() {
  const handleOpen = () => {
    // On Capacitor, open in external browser
    if ((window as any).Capacitor?.Plugins?.Browser) {
      (window as any).Capacitor.Plugins.Browser.open({ url: SITE_URL });
    } else {
      window.open(SITE_URL, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <GreenPageHeader
        title="Assine pelo site 🌐"
        subtitle="A assinatura é feita pelo navegador para sua segurança."
      />

      <div className="mx-auto max-w-lg space-y-6 px-4 py-8">
        <Card className="border-primary/20">
          <CardContent className="p-6 text-center space-y-4">
            <Globe className="mx-auto h-12 w-12 text-primary" />

            <h2 className="text-lg font-bold text-foreground">
              Assine o Controlaê Premium
            </h2>

            <p className="text-sm text-muted-foreground leading-relaxed">
              Por questões de segurança e conformidade com as lojas de aplicativos,
              a assinatura do plano Premium é realizada pelo nosso site.
              Você será redirecionado para uma página segura onde poderá
              escolher seu plano e iniciar o período de 7 dias grátis.
            </p>

            <Button className="w-full gap-2" size="lg" onClick={handleOpen}>
              <ExternalLink className="h-4 w-4" />
              Abrir página de assinatura
            </Button>

            <p className="text-xs text-muted-foreground">
              Após assinar, volte ao app e faça login novamente para desbloquear
              todas as funcionalidades.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
