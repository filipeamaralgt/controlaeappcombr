import { useNavigate } from 'react-router-dom';
import {
  HelpCircle, Mail, MessageSquare, PlusCircle, Tags, CreditCard,
  Palette, ShieldCheck, Sparkles, ArrowRight, Search
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { PageBackHeader } from '@/components/PageBackHeader';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const faqs = [
  {
    icon: PlusCircle,
    question: 'Como adicionar uma transação?',
    answer: 'Clique no botão + flutuante na tela inicial, preencha os dados da transação e toque em salvar.',
  },
  {
    icon: Tags,
    question: 'Como criar categorias personalizadas?',
    answer: 'Acesse o menu Categorias, escolha entre Despesas ou Receitas, digite o nome e selecione a cor desejada.',
  },
  {
    icon: CreditCard,
    question: 'Como funcionam as parcelas?',
    answer: 'Ao adicionar uma transação, ative a opção de parcelamento e defina o número de parcelas. O sistema distribuirá automaticamente nos meses seguintes.',
  },
  {
    icon: Palette,
    question: 'Posso mudar o tema do app?',
    answer: 'Sim! Acesse Configurações e alterne entre o tema claro e escuro.',
  },
  {
    icon: ShieldCheck,
    question: 'Meus dados estão seguros?',
    answer: 'Sim. Usamos criptografia e autenticação segura. Cada usuário só acessa seus próprios dados.',
  },
];

const quickQuestions = [
  'Como exportar meus dados?',
  'Como definir limites de gasto?',
  'Como usar a Dora?',
  'Como adicionar cartões?',
];

export default function Suporte() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-6 pb-28">
      <PageBackHeader title="Central de Ajuda" />

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="text-center space-y-2 pt-2"
      >
        <div className="mx-auto w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
          <HelpCircle className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Como podemos te ajudar?
        </h1>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          Encontre respostas rápidas ou converse com a Dora para tirar suas dúvidas.
        </p>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
        className="relative"
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar nas perguntas frequentes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-xl border border-border/60 bg-card pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
        />
      </motion.div>

      {/* Ask Dora CTA */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}
      >
        <button
          onClick={() => navigate('/chat-ia')}
          className="w-full flex items-center gap-4 rounded-2xl bg-primary/10 dark:bg-primary/15 p-4 text-left transition-colors hover:bg-primary/15 dark:hover:bg-primary/20 active:scale-[0.98]"
        >
          <div className="shrink-0 w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">Perguntar para a Dora</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Sua assistente pode responder qualquer dúvida sobre o app
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
        </button>
      </motion.div>

      {/* Quick questions */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="space-y-3"
      >
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">
          Perguntas rápidas
        </p>
        <div className="flex flex-wrap gap-2">
          {quickQuestions.map((q) => (
            <button
              key={q}
              onClick={() => navigate('/chat-ia')}
              className="rounded-full border border-border/60 bg-card px-3.5 py-1.5 text-xs text-foreground transition-colors hover:bg-accent hover:text-accent-foreground active:scale-[0.97]"
            >
              {q}
            </button>
          ))}
        </div>
      </motion.div>

      {/* FAQ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.26, ease: [0.16, 1, 0.3, 1] }}
      >
        <Card className="border-border/50 bg-card overflow-hidden">
          <CardContent className="p-0">
            <div className="px-5 pt-5 pb-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Perguntas Frequentes
              </p>
            </div>
            <Accordion type="single" collapsible className="w-full">
              <AnimatePresence initial={false}>
                {filteredFaqs.length > 0 ? (
                  filteredFaqs.map((faq, index) => {
                    const Icon = faq.icon;
                    return (
                      <AccordionItem
                        key={faq.question}
                        value={`item-${index}`}
                        className="border-border/40 last:border-b-0 px-5"
                      >
                        <AccordionTrigger className="text-left text-sm gap-3 py-4 hover:no-underline">
                          <span className="flex items-center gap-3">
                            <Icon className="h-4 w-4 text-primary/70 shrink-0" />
                            <span>{faq.question}</span>
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground text-[13px] leading-relaxed pl-7 pb-5">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })
                ) : (
                  <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                    Nenhuma pergunta encontrada. Tente perguntar para a Dora!
                  </div>
                )}
              </AnimatePresence>
            </Accordion>
          </CardContent>
        </Card>
      </motion.div>

      {/* Contact */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.32, ease: [0.16, 1, 0.3, 1] }}
      >
        <Card className="border-border/50 bg-card">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <MessageSquare className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Fale conosco</p>
                <p className="text-xs text-muted-foreground">Resposta em até 24h úteis</p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full justify-start rounded-xl h-11"
              onClick={() => window.open('mailto:contato@controlaeapp.com.br')}
            >
              <Mail className="mr-2 h-4 w-4 text-primary" />
              contato@controlaeapp.com.br
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
