import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { Users, Receipt, TrendingUp, Shield } from 'lucide-react';

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 2000;
    const step = target / (duration / 16);
    const id = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(id);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(id);
  }, [inView, target]);

  const formatted = count >= 1000 ? `${(count / 1000).toFixed(count >= target ? 0 : 0)}` : `${count}`;
  
  return (
    <span ref={ref} className="text-2xl font-extrabold text-primary-foreground tabular-nums">
      {target >= 1000000
        ? `R$ ${(count / 1000000).toFixed(count >= target ? 0 : 1)}M`
        : target >= 1000
        ? `${(count / 1000).toFixed(count >= target ? 0 : 1)} mil`
        : count}
      {suffix}
    </span>
  );
}

const stats = [
  { icon: Users, target: 2147, suffix: '+', label: 'Usuários ativos', display: 'counter' },
  { icon: Receipt, target: 150000, suffix: '+', label: 'Transações registradas', display: 'counter' },
  { icon: TrendingUp, target: 5000000, suffix: '+', label: 'Já controlados', display: 'money' },
  { icon: Shield, target: 100, suffix: '%', label: 'Dados protegidos', display: 'percent' },
];

export function SocialProofBar() {
  return (
    <section className="py-8 px-4 bg-primary text-primary-foreground overflow-hidden">
      <div className="mx-auto max-w-5xl grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            className="flex flex-col items-center text-center gap-1"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
          >
            <s.icon className="h-5 w-5 text-primary-foreground/80 mb-1" />
            <AnimatedCounter target={s.target} suffix={s.suffix} />
            <span className="text-xs text-primary-foreground/70">{s.label}</span>
          </motion.div>
        ))}
      </div>

      {/* Marquee ticker */}
      <div className="mt-6 relative overflow-hidden">
        <div className="animate-marquee flex gap-8 whitespace-nowrap">
          {[...Array(2)].map((_, rep) => (
            <div key={rep} className="flex gap-8 items-center">
              {[
                '✅ "Economizei R$ 500 no primeiro mês"',
                '⭐ "Melhor app de finanças que já usei"',
                '🔥 "O chat com IA é incrível"',
                '💰 "Quitei minhas dívidas em 8 meses"',
                '📊 "Finalmente sei pra onde vai meu dinheiro"',
                '🎯 "Atingi minha meta de emergência!"',
              ].map((quote) => (
                <span key={`${rep}-${quote}`} className="text-xs text-primary-foreground/60 font-medium">
                  {quote}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
