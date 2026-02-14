import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const testimonials = [
  {
    name: 'Mariana S.',
    role: 'Dona de loja no Instagram',
    text: 'Descobri que gastava R$ 847 por mês só com delivery e assinaturas que nem usava. Em 2 meses cortei tudo e sobrou dinheiro pra investir no meu negócio.',
    stars: 5,
  },
  {
    name: 'Lucas R.',
    role: 'Dev frontend, 28 anos',
    text: 'O chat com IA é ridículo de prático. Falo "gastei 32 no almoço" e ele categoriza sozinho. Já tentei planilha, Mobills, Organizze... nenhum durou 1 semana. Esse já uso há 4 meses.',
    stars: 5,
  },
  {
    name: 'Ana Paula M.',
    role: 'Professora de ensino médio',
    text: 'Consegui quitar R$ 4.200 em dívidas em 8 meses. Os gráficos me mostraram que eu gastava muito mais em "pequenas coisas" do que imaginava.',
    stars: 5,
  },
  {
    name: 'Carlos H.',
    role: 'Designer freelancer',
    text: 'No começo achei que não ia usar, mas a IA facilitou demais. Hoje exporto os relatórios mensais e mando direto pro meu contador. Me economiza umas 3h por mês.',
    stars: 4,
  },
  {
    name: 'Fernanda L.',
    role: 'Estudante de medicina',
    text: 'Achei que R$ 11,90/mês era caro pra mim. Na primeira semana identifiquei R$ 230 em gastos que nem lembrava. Se pagou no primeiro dia, literalmente.',
    stars: 5,
  },
  {
    name: 'Roberto A.',
    role: 'Gerente comercial, casado',
    text: 'Minha esposa e eu usamos com os perfis separados. Pela primeira vez em 6 anos de casamento a gente tem clareza de quanto entra e sai. Zerou as brigas por dinheiro.',
    stars: 4,
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.12,
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  }),
};

export function Testimonials() {
  return (
    <section id="depoimentos" className="px-4 py-12 bg-primary text-primary-foreground">
      <div className="mx-auto max-w-6xl">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <span className="text-sm font-semibold text-primary-foreground/80">Depoimentos</span>
          <h2 className="mt-2 text-3xl font-bold md:text-4xl text-primary-foreground">Quem usa, recomenda</h2>
          <p className="mt-2 text-primary-foreground/70">Veja o que nossos usuários estão dizendo</p>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              className="rounded-2xl border border-background/20 bg-background p-5 flex flex-col gap-3 group hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={i}
              variants={cardVariants}
            >
              <div className="flex gap-0.5">
                {Array.from({ length: t.stars }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">"{t.text}"</p>
              <div className="mt-auto pt-2 border-t border-border/30">
                <p className="text-sm font-semibold text-foreground">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
