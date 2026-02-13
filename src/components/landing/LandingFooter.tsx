import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppLogo } from '@/components/AppLogo';

export function LandingFooter() {
  const navigate = useNavigate();

  return (
    <>
      {/* Security */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Shield className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-xl font-bold">Seus dados 100% protegidos</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              Criptografia de ponta a ponta, servidores seguros e nenhum acesso à sua conta bancária.
              Sua privacidade é nossa prioridade absoluta.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-xl text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
            <h2 className="text-3xl font-bold md:text-4xl">Pare de perder dinheiro. Comece hoje.</h2>
            <p className="mt-3 text-muted-foreground">
              Junte-se a mais de 2.000 pessoas que já transformaram suas finanças.
            </p>
            <Button
              size="lg"
              className="mt-8 h-13 gap-2 px-10 text-base font-bold shadow-lg shadow-primary/25"
              onClick={() => navigate('/checkout?plan=anual')}
            >
              <Sparkles className="h-5 w-5" /> Assinar agora — R$ 97/ano
            </Button>
            <p className="mt-3 text-xs text-muted-foreground">
              ✅ Garantia de 7 dias • Cancele quando quiser
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 px-4 py-8">
        <div className="mx-auto max-w-5xl flex flex-col items-center gap-4 text-center">
          <AppLogo size="sm" />
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Controlaê. Todos os direitos reservados.
          </p>
          <p className="text-xs text-muted-foreground">
            contato@controlaeapp.com.br
          </p>
        </div>
      </footer>
    </>
  );
}
