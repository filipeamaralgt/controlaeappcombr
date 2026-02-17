import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, MessageSquare, BarChart3, CreditCard, Target, Bell, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import chatDemo1 from '@/assets/landing-chat-demo-1.jpeg';
import chatDemo2 from '@/assets/landing-chat-demo-2.jpeg';
import chartsDemo from '@/assets/landing-charts-demo.jpeg';
import parcelasDemo from '@/assets/landing-parcelas-demo.png';
import metasDemo from '@/assets/landing-metas-demo.png';
import { PhoneFrame } from '@/components/landing/PhoneFrame';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const } },
};

const features = [
  {
    icon: MessageSquare,
    emoji: '🤖',
    title: 'Nunca foi tão fácil registrar um gasto.',
    desc: 'Fale, escreva, tire foto ou registre manualmente. A IA entende e organiza tudo na hora.',
    imgs: [chatDemo2, chatDemo1],
    imgAlt: 'Chat com IA do Controlaê',
  },
  {
    icon: BarChart3,
    emoji: '📊',
    title: 'Veja para onde vai cada centavo',
    desc: 'Gráficos intuitivos mostram seus gastos por categoria, período e tendências. Identifique onde economizar em segundos.',
    imgs: [chartsDemo],
    imgAlt: 'Gráficos e relatórios do Controlaê',
  },
  {
    icon: CreditCard,
    emoji: '💳',
    title: 'Acompanhe suas Parcelas',
    desc: 'Visualize todas as suas compras parceladas em um único lugar e saiba exatamente o que ainda falta pagar.',
    imgs: [parcelasDemo],
    imgAlt: 'Controle de parcelas do Controlaê',
  },
  {
    icon: Target,
    emoji: '🎯',
    title: 'Planeje seus sonhos',
    desc: 'Organize suas metas e veja, mês a mês, suas conquistas ganharem forma.',
    imgs: [metasDemo],
    imgAlt: 'Metas financeiras do Controlaê',
  },
];

const miniFeatures = [
  { icon: Target, emoji: '🎨', title: 'Categorias do seu jeito', desc: 'Escolha nome, cor e ícone para organizar seus gastos da forma que combina com você.' },
  { icon: Bell, emoji: '🔔', title: 'Lembretes automáticos', desc: 'Nunca mais esqueça de pagar uma conta.' },
  { icon: Download, emoji: '📥', title: 'Exportar dados', desc: 'Exporte tudo em PDF ou planilha quando quiser.' },
];

export function FeatureShowcase() {
  const navigate = useNavigate();

  return (
    <section id="funcionalidades" className="px-4 py-12">
      <div className="mx-auto max-w-6xl">
        <motion.div className="text-center mb-10" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
          <span className="text-sm font-semibold text-primary">Funcionalidades</span>
          <h2 className="mt-2 text-3xl font-bold md:text-4xl">Tudo que você precisa em um só lugar</h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            Ferramentas poderosas e simples para transformar a forma como você lida com dinheiro.
          </p>
        </motion.div>

        {/* Big features with mockups */}
        <div className="space-y-14">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              className={`flex flex-col-reverse ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-10 md:gap-16 ${i % 2 !== 0 ? 'bg-muted/50 rounded-3xl p-8 md:p-12' : ''}`}
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            >
              <motion.div
                className="flex-1 flex justify-center gap-3"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4 + i * 0.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                {f.imgs.map((img, j) => (
                  <PhoneFrame
                    key={j}
                    className={f.imgs.length > 1 ? 'w-40 md:w-52' : 'w-52 md:w-64'}
                  >
                    <img
                      src={img}
                      alt={f.imgAlt}
                      className="w-full"
                      loading="lazy"
                    />
                  </PhoneFrame>
                ))}
              </motion.div>
              <div className="flex-1 text-center md:text-left">
                <span className="text-3xl mb-3 block">{f.emoji}</span>
                <h3 className="text-2xl font-bold text-foreground">{f.title}</h3>
                <p className="mt-3 text-muted-foreground leading-relaxed max-w-md mx-auto md:mx-0">{f.desc}</p>
                <Button
                  variant="link" className="mt-4 gap-1 px-0 text-primary font-semibold"
                  onClick={() => document.getElementById('precos')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Quero isso pra mim <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Mini features grid */}
        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {miniFeatures.map((f, i) => (
            <motion.div
              key={f.title}
              className="rounded-2xl border border-border/40 bg-card/50 p-6 text-center card-3d"
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } },
              }}
            >
              <span className="text-3xl block mb-3">{f.emoji}</span>
              <h4 className="font-bold text-foreground">{f.title}</h4>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
