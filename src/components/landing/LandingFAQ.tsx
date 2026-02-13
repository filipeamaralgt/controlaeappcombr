import { motion } from 'framer-motion';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const FAQ_ITEMS = [
  { q: 'Como funciona o pagamento?', a: 'Você escolhe o plano, insere seu email e realiza o pagamento seguro via Stripe. Depois, é só criar sua conta com o mesmo email e começar a usar.' },
  { q: 'Como funciona o cancelamento?', a: 'Você pode cancelar nos primeiros 7 dias e receber reembolso total. Após esse período, cancele a qualquer momento — seu acesso continua até o fim do período pago.' },
  { q: 'Meus dados estão seguros?', a: 'Sim. Utilizamos criptografia de ponta a ponta e servidores seguros para proteger todas as suas informações financeiras. Não temos acesso aos seus dados bancários.' },
  { q: 'Funciona no celular?', a: 'Sim! O Controlaê funciona perfeitamente em qualquer dispositivo — celular, tablet ou computador. Acesse de onde quiser.' },
  { q: 'Preciso colocar dados do banco?', a: 'Não. Você registra seus gastos manualmente ou por chat com IA. Não pedimos acesso à sua conta bancária em momento algum.' },
  { q: 'Posso compartilhar com minha família?', a: 'Sim! Você pode criar perfis de gastos separados e compartilhar com parceiro, família ou sócios. Cada um controla seus gastos e todos têm visibilidade total.' },
  { q: 'O chat com IA realmente funciona?', a: 'Sim! Nossa IA entende linguagem natural. Basta digitar algo como "gastei 50 no mercado" ou "recebi 3000 de salário" e ela registra automaticamente com categoria, valor e data.' },
];

export function LandingFAQ() {
  return (
    <section id="faq" className="px-4 py-20">
      <div className="mx-auto max-w-2xl">
        <motion.div className="text-center mb-10" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
          <span className="text-sm font-semibold text-primary">FAQ</span>
          <h2 className="mt-2 text-3xl font-bold md:text-4xl">Perguntas frequentes</h2>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
          <Accordion type="single" collapsible className="w-full">
            {FAQ_ITEMS.map((item, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-left">{item.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
