import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Zap, Clock, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

// useEffect already imported above

function useCountdown() {
  const getTarget = () => {
    const key = 'controlae_promo_end';
    const stored = localStorage.getItem(key);
    if (stored) {
      const d = new Date(stored);
      if (d.getTime() > Date.now()) return d;
    }
    const target = new Date(Date.now() + 24 * 60 * 60 * 1000);
    localStorage.setItem(key, target.toISOString());
    return target;
  };

  const [target] = useState(getTarget);
  const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0 });

  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, target.getTime() - Date.now());
      setTimeLeft({
        h: Math.floor(diff / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  return timeLeft;
}

function CountdownTimer() {
  const { h, m, s } = useCountdown();
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
      <Clock className="h-4 w-4 text-destructive" />
      <span className="text-muted-foreground">Oferta expira em:</span>
      <div className="flex gap-1">
        {[
          { val: pad(h), label: 'h' },
          { val: pad(m), label: 'm' },
          { val: pad(s), label: 's' },
        ].map(({ val, label }) => (
          <span key={label} className="inline-flex items-baseline gap-0.5">
            <span className="rounded bg-destructive/10 px-1.5 py-0.5 font-mono text-base font-bold text-destructive tabular-nums">{val}</span>
            <span className="text-xs text-muted-foreground">{label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

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

const ROTATING_HEADLINES = [
  { title: 'Invista menos que um café por dia', subtitle: 'Escolha o plano ideal e comece agora mesmo.' },
  { title: 'Pequenas mudanças, grandes resultados', subtitle: 'Seu futuro começa nas escolhas de hoje.' },
  { title: 'Escolha o plano ideal para sua nova fase', subtitle: 'Um pequeno valor por mês, um grande impacto na sua vida.' },
  { title: 'Você no comando da sua vida financeira', subtitle: 'Escolha o plano ideal e comece agora mesmo.' },
];

const savingsPercent = Math.round((1 - 97 / (11.9 * 12)) * 100);

function PlanCard({ plan, highlighted, navigate }: { plan: 'anual' | 'mensal'; highlighted: boolean; navigate: (path: string) => void }) {
  const isAnual = plan === 'anual';
  return (
    <Card className={`h-full relative ${highlighted ? 'border-primary/30 ring-4 ring-primary/15 shadow-[0_0_30px_rgba(var(--primary-rgb,34,197,94),0.2)]' : ''}`}>
      {highlighted && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-bold text-primary-foreground whitespace-nowrap">
          🔥 Mais escolhido
        </span>
      )}
      <CardContent className="p-6 flex flex-col justify-between h-full gap-6">
        <div>
          <p className="text-sm font-semibold text-muted-foreground">{isAnual ? 'Plano Anual' : 'Plano Mensal'}</p>
          <div className="mt-2 flex items-baseline gap-1 whitespace-nowrap">
            {isAnual && <span className="text-sm text-muted-foreground line-through">R$ 142</span>}
            <span className={`text-4xl font-extrabold ${isAnual ? 'price-shimmer' : 'text-foreground'}`}>
              {isAnual ? 'R$ 97,00' : 'R$ 11,90'}
            </span>
            <span className="text-muted-foreground">{isAnual ? '/ano' : '/mês'}</span>
          </div>
          <p className="mt-1 text-xs font-semibold text-primary">
            {isAnual ? `Economize ${savingsPercent}% — apenas R$ 8,08/mês` : 'Menos de R$ 0,40/dia'}
          </p>
          <ul className="mt-5 space-y-2">
            {BENEFITS.map(f => (
              <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="h-4 w-4 text-primary shrink-0" /> {f}
              </li>
            ))}
          </ul>
        </div>
        <Button
          className={`w-full h-12 rounded-xl gap-2 font-bold ${highlighted ? 'cta-primary cta-glow border-0 text-white' : ''}`}
          variant={highlighted ? 'default' : 'outline'}
          onClick={() => navigate(`/checkout?plan=${plan}`)}
        >
          {isAnual ? (
            <><Rocket className="h-4 w-4" /> Economizar {savingsPercent}% — R$ 97/ano</>
          ) : (
            'Começar por R$ 11,90/mês'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

export function LandingPricing() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isAnual, setIsAnual] = useState(true);
  const [headlineIdx, setHeadlineIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setHeadlineIdx((i) => (i + 1) % ROTATING_HEADLINES.length);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const headline = ROTATING_HEADLINES[headlineIdx];

  return (
    <section id="precos" className="px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <div className="text-center mb-4">
          <span className="text-sm font-semibold text-primary">Planos</span>
          <AnimatePresence mode="wait">
            <motion.div
              key={headlineIdx}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <h2 className="mt-2 text-3xl font-bold md:text-4xl">{headline.title}</h2>
              <p className="mt-2 text-muted-foreground">{headline.subtitle}</p>
            </motion.div>
          </AnimatePresence>
        </div>


        {/* Price comparison */}
        <motion.div
          className="mb-10 flex flex-wrap justify-center gap-2 sm:gap-3"
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0.5}
        >
          {[
            { name: 'Netflix', price: 'R$ 44,90', emoji: '🎬' },
            { name: 'iFood', price: '~R$ 150', emoji: '🍔' },
            { name: 'Controlaê', price: 'R$ 8,08', emoji: '💰', highlight: true },
          ].map((item) => (
            <span
              key={item.name}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] sm:text-xs font-semibold ${
                item.highlight
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {item.emoji} {item.name}: {item.price}/mês
            </span>
          ))}
        </motion.div>

        {/* ---- MOBILE: toggle + single card ---- */}
        {isMobile ? (
          <>
            <motion.div
              className="mb-6 flex flex-col items-center gap-2"
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0.7}
            >
              <div className="flex items-center gap-3">
                <span className={`text-sm font-semibold transition-colors ${!isAnual ? 'text-foreground' : 'text-muted-foreground'}`}>Mensal</span>
                <button
                  onClick={() => setIsAnual(!isAnual)}
                  className={`relative h-7 w-12 rounded-full transition-colors ${isAnual ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                  aria-label="Alternar entre plano mensal e anual"
                >
                  <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-md transition-all duration-300 ${isAnual ? 'left-[22px]' : 'left-[2px]'}`} />
                </button>
                <span className={`text-sm font-semibold transition-colors ${isAnual ? 'text-foreground' : 'text-muted-foreground'}`}>Anual</span>
              </div>
              {isAnual && <span className="text-xs font-semibold text-primary">Economize {savingsPercent}%</span>}
            </motion.div>

            <div className="max-w-md mx-auto">
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}>
                <PlanCard plan={isAnual ? 'anual' : 'mensal'} highlighted={isAnual} navigate={navigate} />
              </motion.div>
            </div>
          </>
        ) : (
          /* ---- DESKTOP: two cards side by side ---- */
          <motion.div
            className="grid grid-cols-2 gap-6 max-w-3xl mx-auto"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0.7}
          >
            <PlanCard plan="mensal" highlighted={false} navigate={navigate} />
            <PlanCard plan="anual" highlighted={true} navigate={navigate} />
          </motion.div>
        )}

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
