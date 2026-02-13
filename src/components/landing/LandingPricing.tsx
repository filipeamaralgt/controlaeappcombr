import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Crown, Check, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

const BENEFITS = [
  'Registro de gastos e entradas pelo app',
  'Chat com IA 24h',
  'Categorização automática e personalizável',
  'Controle de dívidas, cartões e parcelamentos',
  'Metas financeiras',
  'Relatórios, gráficos e insights',
  'Exportação e importação de dados',
  'Compartilhamento com família ou parceiros',
  'Lembretes de contas e vencimentos',
  'Funciona no celular e computador',
];

const savingsPercent = Math.round((1 - 97 / (11.9 * 12)) * 100);

export function LandingPricing() {
  const navigate = useNavigate();

  return (
    <section id="precos" className="px-4 py-20">
      <div className="mx-auto max-w-4xl">
        <motion.div className="text-center mb-4" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
          <span className="text-sm font-semibold text-primary">Planos</span>
          <h2 className="mt-2 text-3xl font-bold md:text-4xl">Invista menos que um café por dia</h2>
          <p className="mt-2 text-muted-foreground">Escolha o plano ideal e comece agora mesmo.</p>
        </motion.div>

        {/* Urgency trigger */}
        <motion.div
          className="mb-10 flex items-center justify-center gap-2"
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0.5}
        >
          <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-3 py-1 text-xs font-bold text-destructive">
            <Zap className="h-3.5 w-3.5" /> Preço promocional — pode subir a qualquer momento
          </span>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 max-w-2xl mx-auto">
          {/* Monthly */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <Card className="h-full">
              <CardContent className="p-6 flex flex-col justify-between h-full gap-6">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Plano Mensal</p>
                  <div className="mt-2 flex items-baseline gap-1 whitespace-nowrap">
                    <span className="text-4xl font-extrabold text-foreground">R$ 11,90</span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">Menos de R$ 0,40/dia</p>
                  <ul className="mt-5 space-y-2">
                    {BENEFITS.map(f => (
                      <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="h-4 w-4 text-primary shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <Button variant="outline" className="w-full" onClick={() => navigate('/checkout?plan=mensal')}>
                  Assinar mensal
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Annual */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}>
            <Card className="h-full relative border-primary/40 ring-2 ring-primary/20">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-bold text-primary-foreground whitespace-nowrap">
                🔥 Mais escolhido
              </span>
              <CardContent className="p-6 flex flex-col justify-between h-full gap-6">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Plano Anual</p>
                  <div className="mt-2 flex items-baseline gap-1 whitespace-nowrap">
                    <span className="text-sm text-muted-foreground line-through">R$ 142</span>
                    <span className="text-4xl font-extrabold text-foreground">R$ 97,00</span>
                    <span className="text-muted-foreground">/ano</span>
                  </div>
                  <p className="mt-1 text-xs font-semibold text-primary">
                    Economize {savingsPercent}% — apenas R$ 8,08/mês
                  </p>
                  <ul className="mt-5 space-y-2">
                    {BENEFITS.map(f => (
                      <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="h-4 w-4 text-primary shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <Button className="w-full gap-2 shadow-lg shadow-primary/20" onClick={() => navigate('/checkout?plan=anual')}>
                  <Crown className="h-4 w-4" /> Assinar agora
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.p
          className="mt-8 text-center text-sm text-muted-foreground"
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={2}
        >
          ✅ 7 dias para testar. Não gostou? <strong className="text-foreground">Reembolso total garantido.</strong>
        </motion.p>
      </div>
    </section>
  );
}
