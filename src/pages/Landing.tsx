import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Crown, Sparkles, Shield, BarChart3, CreditCard, Target,
  MessageSquare, Bell, Download, Check, ChevronRight, ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import { AppLogo } from '@/components/AppLogo';

const PLANS = {
  monthly: { label: 'Plano Mensal', price: 'R$ 11,90/mês', amount: 11.9 },
  annual: { label: 'Plano Anual', price: 'R$ 97/ano', amount: 97 },
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

const FEATURES = [
  { icon: MessageSquare, title: 'Chat com IA', desc: 'Registre despesas por conversa, como se fosse um chat.' },
  { icon: BarChart3, title: 'Relatórios visuais', desc: 'Gráficos e insights para entender seus gastos.' },
  { icon: CreditCard, title: 'Cartões e parcelas', desc: 'Controle faturas, limites e parcelamentos.' },
  { icon: Target, title: 'Metas financeiras', desc: 'Defina metas e acompanhe seu progresso.' },
  { icon: Bell, title: 'Lembretes', desc: 'Nunca mais esqueça de pagar uma conta.' },
  { icon: Download, title: 'Exportar dados', desc: 'Exporte tudo em PDF ou planilha quando quiser.' },
];

const FAQ_ITEMS = [
  { q: 'Posso testar antes de pagar?', a: 'Sim! Você pode assinar e começar a usar imediatamente. Caso não goste, cancele a qualquer momento.' },
  { q: 'Como funciona o cancelamento?', a: 'Você pode cancelar a qualquer momento sem custo. Basta acessar as configurações da sua conta.' },
  { q: 'Meus dados estão seguros?', a: 'Sim. Utilizamos criptografia de ponta a ponta e servidores seguros para proteger todas as suas informações financeiras.' },
  { q: 'Funciona no celular?', a: 'Sim! O Controlaê funciona perfeitamente em qualquer dispositivo — celular, tablet ou computador.' },
  { q: 'Preciso colocar dados do banco?', a: 'Não. Você registra seus gastos manualmente ou por chat com IA. Não pedimos acesso à sua conta bancária.' },
];

const savingsPercent = Math.round(
  (1 - PLANS.annual.amount / (PLANS.monthly.amount * 12)) * 100
);

export default function Landing() {
  const navigate = useNavigate();

  const handleCTA = (plan = 'mensal') => navigate(`/checkout?plan=${plan}`);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Nav */}
      <nav className="sticky top-0 z-50 backdrop-blur-lg bg-background/80 border-b border-border/50">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <AppLogo size="md" />
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}>
              Entrar
            </Button>
            <Button size="sm" onClick={() => handleCTA()} className="gap-1.5">
              Assinar <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative px-4 pb-20 pt-16 md:pt-24">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="mx-auto max-w-3xl text-center">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-6">
              <Sparkles className="h-3.5 w-3.5" /> Controle financeiro inteligente
            </span>
          </motion.div>

          <motion.h1
            className="text-4xl font-extrabold tracking-tight md:text-6xl leading-[1.1]"
            initial="hidden" animate="visible" variants={fadeUp} custom={1}
          >
            Controle total das suas{' '}
            <span className="text-primary">finanças</span>
          </motion.h1>

          <motion.p
            className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground"
            initial="hidden" animate="visible" variants={fadeUp} custom={2}
          >
            Registre gastos, acompanhe metas e tenha relatórios inteligentes.
            Simples, rápido e seguro.
          </motion.p>

          <motion.div
            className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
            initial="hidden" animate="visible" variants={fadeUp} custom={3}
          >
            <Button size="lg" className="h-13 gap-2 px-8 text-base font-bold shadow-lg shadow-primary/25" onClick={() => handleCTA('anual')}>
              <Crown className="h-5 w-5" /> Assinar agora
            </Button>
            <Button variant="outline" size="lg" className="h-13 gap-2 px-8 text-base" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
              Ver funcionalidades <ChevronRight className="h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="features" className="px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <motion.div className="text-center mb-12" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <h2 className="text-3xl font-bold md:text-4xl">Tudo que você precisa</h2>
            <p className="mt-2 text-muted-foreground">Funcionalidades pensadas para simplificar sua vida financeira.</p>
          </motion.div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <motion.div key={f.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
                <Card className="h-full">
                  <CardContent className="p-6 flex flex-col gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                      <f.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-bold text-foreground">{f.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section id="precos" className="px-4 py-20 bg-muted/30">
        <div className="mx-auto max-w-4xl">
          <motion.div className="text-center mb-12" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <h2 className="text-3xl font-bold md:text-4xl">Planos simples e acessíveis</h2>
            <p className="mt-2 text-muted-foreground">Escolha o plano ideal para você. Cancele quando quiser.</p>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2 max-w-2xl mx-auto">
            {/* Monthly */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
              <Card className="h-full">
                <CardContent className="p-6 flex flex-col justify-between h-full gap-6">
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground">{PLANS.monthly.label}</p>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold text-foreground">R$ {PLANS.monthly.amount.toFixed(2).replace('.', ',')}</span>
                      <span className="text-muted-foreground">/mês</span>
                    </div>
                    <ul className="mt-5 space-y-2">
                      {['Chat com IA 24h', 'Relatórios e gráficos', 'Metas e lembretes', 'Exportação de dados'].map(f => (
                        <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Check className="h-4 w-4 text-primary shrink-0" /> {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Button variant="outline" className="w-full" onClick={() => handleCTA('mensal')}>
                    Assinar mensal
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Annual */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}>
              <Card className="h-full relative border-primary/40 ring-2 ring-primary/20">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-bold text-primary-foreground">
                  Recomendado
                </span>
                <CardContent className="p-6 flex flex-col justify-between h-full gap-6">
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground">{PLANS.annual.label}</p>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold text-foreground">R$ {PLANS.annual.amount.toFixed(2).replace('.', ',')}</span>
                      <span className="text-muted-foreground">/ano</span>
                    </div>
                    <p className="mt-1 text-xs font-semibold text-primary">Economize {savingsPercent}%</p>
                    <ul className="mt-5 space-y-2">
                      {['Tudo do plano mensal', 'Economia de ' + savingsPercent + '%', 'Prioridade no suporte', 'Cancele quando quiser'].map(f => (
                        <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Check className="h-4 w-4 text-primary shrink-0" /> {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Button className="w-full gap-2 shadow-lg shadow-primary/20" onClick={() => handleCTA('anual')}>
                    <Crown className="h-4 w-4" /> Assinar agora
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-2xl">
          <motion.div className="text-center mb-10" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <h2 className="text-3xl font-bold md:text-4xl">Perguntas frequentes</h2>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}>
            <Accordion type="single" collapsible className="w-full">
              {FAQ_ITEMS.map((item, i) => (
                <AccordionItem key={i} value={`faq-${i}`}>
                  <AccordionTrigger className="text-left">{item.q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </section>

      {/* ─── Security ─── */}
      <section className="px-4 py-16 bg-muted/30">
        <div className="mx-auto max-w-2xl text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Shield className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-xl font-bold">Seus dados protegidos</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              Criptografia de ponta a ponta, servidores seguros e nenhum acesso à sua conta bancária.
              Sua privacidade é nossa prioridade.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-xl text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <h2 className="text-3xl font-bold md:text-4xl">Comece a controlar suas finanças hoje</h2>
            <p className="mt-3 text-muted-foreground">Simples, rápido e sem compromisso.</p>
            <Button size="lg" className="mt-8 h-13 gap-2 px-10 text-base font-bold shadow-lg shadow-primary/25" onClick={() => handleCTA('anual')}>
              <Sparkles className="h-5 w-5" /> Assinar agora
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ─── Footer ─── */}
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
    </div>
  );
}
