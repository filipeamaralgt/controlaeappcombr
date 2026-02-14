import { motion } from 'framer-motion';
import { Sparkles, Rocket, MessageSquare, BarChart3, Target, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';

const comparisons = [
  { name: 'Netflix', price: 'R$ 44,90', strikethrough: true },
  { name: 'iFood', price: '~R$ 150', strikethrough: true },
  { name: 'Controlaê', price: 'R$ 8,08', strikethrough: false },
];

export function HeroOfferCard() {

  return (
    <section className="px-4 py-10 -mt-4">
      <motion.div
        className="mx-auto max-w-md rounded-3xl border border-primary/20 bg-card p-8 text-center shadow-2xl shadow-primary/10"
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary uppercase tracking-wider mb-4">
          <Sparkles className="h-3.5 w-3.5" /> Oferta Especial
        </span>

        <h3 className="text-lg font-bold text-foreground">Comece hoje por apenas</h3>

        <div className="mt-3 flex items-baseline justify-center gap-1 whitespace-nowrap">
          <span className="text-5xl font-extrabold price-shimmer">R$ 8,08</span>
          <span className="text-lg text-muted-foreground">/mês</span>
        </div>

        <p className="mt-2 text-sm text-muted-foreground">
          Menos que um cafezinho por dia ☕
        </p>

        {/* Price comparison */}
        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
          {comparisons.map((c) => (
            <span key={c.name} className={c.strikethrough ? 'line-through opacity-60' : 'font-bold text-primary'}>
              {c.name}: {c.price}
            </span>
          ))}
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          Cobrança anual de R$ 97 • Cancele quando quiser
        </p>

        <div className="mt-6">
          <Button
            size="lg"
            className="cta-primary cta-glow w-full h-14 gap-2 text-base font-bold rounded-2xl border-0 text-white"
            onClick={() => document.getElementById('precos')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <Rocket className="h-5 w-5" /> Começar a economizar agora
          </Button>
          <p className="mt-3 text-xs text-muted-foreground">
            🔒 Pagamento seguro • Garantia de 7 dias
          </p>
        </div>
      </motion.div>

      {/* Feature pills */}
      <motion.div
        className="mx-auto mt-6 flex max-w-lg flex-wrap justify-center gap-2"
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        {[
          { icon: CreditCard, label: 'Controle financeiro' },
          { icon: MessageSquare, label: 'Chat com IA' },
          { icon: Target, label: 'Metas e hábitos' },
          { icon: BarChart3, label: 'Relatórios inteligentes' },
        ].map((pill) => (
          <span
            key={pill.label}
            className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground"
          >
            <pill.icon className="h-3.5 w-3.5 text-primary" />
            {pill.label}
          </span>
        ))}
      </motion.div>
    </section>
  );
}
