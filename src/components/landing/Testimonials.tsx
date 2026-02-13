import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const testimonials = [
  {
    name: 'Mariana S.',
    role: 'Empreendedora',
    text: 'Antes eu não sabia pra onde ia meu dinheiro. Com o Controlaê, descobri que gastava quase R$ 800/mês só com delivery! Consegui cortar e economizar muito.',
    stars: 5,
  },
  {
    name: 'Lucas R.',
    role: 'Desenvolvedor',
    text: 'O chat com IA é absurdamente prático. Eu só falo "gastei 30 no almoço" e ele já registra tudo. Nunca vi nada tão fácil de usar.',
    stars: 5,
  },
  {
    name: 'Ana Paula M.',
    role: 'Professora',
    text: 'Consegui quitar minhas dívidas em 8 meses usando o Controlaê. Os gráficos me mostraram exatamente onde eu estava errando. Recomendo demais!',
    stars: 5,
  },
  {
    name: 'Carlos H.',
    role: 'Autônomo',
    text: 'Como freelancer, preciso controlar entradas e saídas todo dia. O Controlaê me salvou — exporto os relatórios e mando pro meu contador.',
    stars: 5,
  },
  {
    name: 'Fernanda L.',
    role: 'Estudante',
    text: 'Achei que R$ 11,90/mês era caro, mas em 1 semana já identifiquei R$ 200 em gastos desnecessários. Se pagou em 1 dia!',
    stars: 5,
  },
  {
    name: 'Roberto A.',
    role: 'Empresário',
    text: 'Minha esposa e eu usamos juntos com os perfis compartilhados. Finalmente temos visão clara das finanças da casa. Mudou nosso casamento!',
    stars: 5,
  },
];

export function Testimonials() {
  return (
    <section id="depoimentos" className="px-4 py-20 bg-muted/30">
      <div className="mx-auto max-w-6xl">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <span className="text-sm font-semibold text-primary">Depoimentos</span>
          <h2 className="mt-2 text-3xl font-bold md:text-4xl">Quem usa, recomenda</h2>
          <p className="mt-2 text-muted-foreground">Veja o que nossos usuários estão dizendo</p>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              className="rounded-2xl border border-border/40 bg-card/80 p-5 flex flex-col gap-3"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
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
