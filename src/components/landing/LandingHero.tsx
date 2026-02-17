import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Rocket, Sparkles, ChevronRight, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LiveBadge } from '@/components/landing/LiveBadge';
import { PhoneFrame } from '@/components/landing/PhoneFrame';
import heroVideo from '@/assets/landing-hero-video.mov';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

export function LandingHero() {
  const navigate = useNavigate();

  return (
    <section className="relative px-4 pb-10 pt-12 md:pt-20 overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/8 via-primary/3 to-transparent" />
      {/* Floating emojis decorative */}
      <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
        {['💰', '📊', '🎯', '💳', '📈', '🔔'].map((emoji, i) => (
          <motion.span
            key={i}
            className="absolute text-2xl md:text-3xl select-none opacity-20"
            style={{
              top: `${15 + i * 13}%`,
              left: i % 2 === 0 ? `${5 + i * 3}%` : `${75 + i * 3}%`,
            }}
            animate={{ y: [0, -15, 0], rotate: [0, 10, -10, 0] }}
            transition={{ duration: 4 + i, repeat: Infinity, ease: 'easeInOut' }}
          >
            {emoji}
          </motion.span>
        ))}
      </div>

      <div className="mx-auto max-w-6xl grid md:grid-cols-2 gap-10 items-center">
        {/* Left text */}
        <div className="text-center md:text-left">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-5">
              <Sparkles className="h-3.5 w-3.5" /> +2.147 usuários controlando suas finanças
            </span>
          </motion.div>

          <motion.h1
            className="text-4xl font-extrabold tracking-tight md:text-5xl lg:text-6xl leading-[1.08]"
            initial="hidden" animate="visible" variants={fadeUp} custom={1}
          >
            Chega de perder dinheiro sem saber{' '}
            <span className="text-primary">para onde vai</span>
          </motion.h1>

          <motion.p
            className="mt-5 max-w-lg text-lg text-muted-foreground mx-auto md:mx-0"
            initial="hidden" animate="visible" variants={fadeUp} custom={2}
          >
            O Controlaê é o app que te ajuda a registrar gastos, acompanhar metas e 
            ter relatórios inteligentes — tudo com ajuda de IA. <strong className="text-foreground">Simples como mandar uma mensagem.</strong>
          </motion.p>

          {/* Social proof mini */}
          <motion.div
            className="mt-5 flex items-center gap-2 justify-center md:justify-start"
            initial="hidden" animate="visible" variants={fadeUp} custom={2.5}
          >
            {/* Stacked avatars */}
            <div className="flex -space-x-2">
              {['🧑‍💼', '👩‍🦰', '👨‍💻', '👩‍🎓'].map((emoji, i) => (
                <span key={i} className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-muted border-2 border-background text-xs">
                  {emoji}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-1">
              <div className="flex">
                {[1, 2, 3, 4, 5].map(i => (
                  <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">4.9/5 • +2.147 usuários</span>
            </div>
          </motion.div>

          <motion.div
            className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center md:justify-start"
            initial="hidden" animate="visible" variants={fadeUp} custom={3}
          >
            <Button
              size="lg"
              className="cta-primary cta-glow h-14 gap-2 px-10 text-base font-bold rounded-2xl border-0 text-white"
              onClick={() => document.getElementById('precos')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <Rocket className="h-5 w-5" /> Quero controlar meu dinheiro
            </Button>
            <button
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              onClick={() => document.getElementById('funcionalidades')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Como funciona? <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </motion.div>

          <motion.p
            className="mt-4 text-xs text-muted-foreground"
            initial="hidden" animate="visible" variants={fadeUp} custom={3.5}
          >
            ✅ Garantia de 7 dias • Cancele quando quiser • Sem dados bancários
          </motion.p>

          <motion.div
            className="mt-4"
            initial="hidden" animate="visible" variants={fadeUp} custom={4}
          >
            <LiveBadge />
          </motion.div>
        </div>

        {/* Right mockup */}
        <motion.div
          className="flex justify-center md:justify-end"
          initial={{ opacity: 0, scale: 0.9, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <PhoneFrame className="w-64 md:w-80">
            <video
              src={heroVideo}
              autoPlay
              loop
              muted
              playsInline
              className="w-full"
            />
          </PhoneFrame>
        </motion.div>
      </div>
    </section>
  );
}
