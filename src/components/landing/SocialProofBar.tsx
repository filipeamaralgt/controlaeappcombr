import { motion } from 'framer-motion';
import { Users, Receipt, TrendingUp, Shield } from 'lucide-react';

const stats = [
  { icon: Users, value: '2.000+', label: 'Usuários ativos' },
  { icon: Receipt, value: '150 mil+', label: 'Transações registradas' },
  { icon: TrendingUp, value: 'R$ 5M+', label: 'Já controlados' },
  { icon: Shield, value: '100%', label: 'Dados protegidos' },
];

export function SocialProofBar() {
  return (
    <section className="py-8 px-4 bg-primary text-primary-foreground">
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
            <span className="text-2xl font-extrabold text-primary-foreground">{s.value}</span>
            <span className="text-xs text-primary-foreground/70">{s.label}</span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
