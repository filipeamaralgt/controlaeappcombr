import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, MessageSquare, BarChart3, CreditCard, Target, Bell, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import chatMockup from '@/assets/landing-chat-mockup.png';
import chartsMockup from '@/assets/landing-charts-mockup.png';
import heroMockup from '@/assets/landing-hero-mockup.png';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const } },
};

const features = [
  {
    icon: MessageSquare,
    emoji: '🤖',
    title: 'Registre gastos conversando com a IA',
    desc: 'Diga "gastei 50 reais no mercado" e pronto. A IA entende, categoriza e registra automaticamente. Sem formulários chatos.',
    img: chatMockup,
    imgAlt: 'Chat com IA do Controlaê',
  },
  {
    icon: BarChart3,
    emoji: '📊',
    title: 'Veja pra onde vai cada centavo',
    desc: 'Gráficos intuitivos mostram seus gastos por categoria, período e tendências. Identifique onde economizar em segundos.',
    img: chartsMockup,
    imgAlt: 'Gráficos e relatórios do Controlaê',
  },
  {
    icon: CreditCard,
    emoji: '💳',
    title: 'Cartões, parcelas e dívidas sob controle',
    desc: 'Controle faturas, limites de crédito, parcelamentos e dívidas em um só lugar. Nunca mais perca o controle do cartão.',
    img: heroMockup,
    imgAlt: 'Controle de cartões do Controlaê',
  },
];

const miniFeatures = [
  { icon: Target, title: 'Metas financeiras', desc: 'Defina metas e acompanhe seu progresso em tempo real.' },
  { icon: Bell, title: 'Lembretes automáticos', desc: 'Nunca mais esqueça de pagar uma conta.' },
  { icon: Download, title: 'Exportar dados', desc: 'Exporte tudo em PDF ou planilha quando quiser.' },
];

export function FeatureShowcase() {
  const navigate = useNavigate();

  return (
    <section id="funcionalidades" className="px-4 py-20">
      <div className="mx-auto max-w-6xl">
        <motion.div className="text-center mb-16" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
          <span className="text-sm font-semibold text-primary">Funcionalidades</span>
          <h2 className="mt-2 text-3xl font-bold md:text-4xl">Tudo que você precisa em um só lugar</h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            Ferramentas poderosas e simples para transformar a forma como você lida com dinheiro.
          </p>
        </motion.div>

        {/* Big features with mockups */}
        <div className="space-y-20">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              className={`flex flex-col ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-10 md:gap-16`}
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            >
              {/* Image */}
              <div className="flex-1 flex justify-center">
                <img
                  src={f.img}
                  alt={f.imgAlt}
                  className="w-52 md:w-64 drop-shadow-xl"
                  loading="lazy"
                />
              </div>
              {/* Text */}
              <div className="flex-1 text-center md:text-left">
                <span className="text-3xl mb-3 block">{f.emoji}</span>
                <h3 className="text-2xl font-bold text-foreground">{f.title}</h3>
                <p className="mt-3 text-muted-foreground leading-relaxed max-w-md mx-auto md:mx-0">{f.desc}</p>
                <Button
                  variant="link" className="mt-4 gap-1 px-0 text-primary font-semibold"
                  onClick={() => navigate('/checkout?plan=anual')}
                >
                  Assinar agora <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Mini features grid */}
        <div className="mt-20 grid gap-4 sm:grid-cols-3">
          {miniFeatures.map((f, i) => (
            <motion.div
              key={f.title}
              className="rounded-2xl border border-border/40 bg-card/50 p-6 text-center"
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } },
              }}
            >
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 mb-3">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h4 className="font-bold text-foreground">{f.title}</h4>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
