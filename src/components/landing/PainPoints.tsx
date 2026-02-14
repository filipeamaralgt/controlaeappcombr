import { motion } from 'framer-motion';

const pains = [
  {
    emoji: '😰',
    title: 'Sem controle financeiro',
    desc: 'Gastando mais do que ganha e sem saber pra onde vai o dinheiro.',
  },
  {
    emoji: '😱',
    title: 'Contas acumulando',
    desc: 'Parcelas, faturas e dívidas que só crescem todo mês.',
  },
  {
    emoji: '😔',
    title: 'Metas distantes',
    desc: 'Sonhos que nunca saem do papel por falta de organização.',
  },
];

export function PainPoints() {
  return (
    <section className="px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl font-bold md:text-3xl">
            Você se identifica com algum desses? 🤔
          </h2>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-3">
          {pains.map((p, i) => (
            <motion.div
              key={p.title}
              className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              <span className="text-4xl block mb-3">{p.emoji}</span>
              <h3 className="font-bold text-foreground">{p.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>
            </motion.div>
          ))}
        </div>

        <motion.p
          className="mt-8 text-center text-lg font-semibold text-foreground"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          ✅ O Controlaê resolve tudo isso pra você 👇
        </motion.p>
      </div>
    </section>
  );
}
