import { HelpCircle, Mail, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { PageBackHeader } from '@/components/PageBackHeader';

const faqs = [
  {
    question: 'Como adicionar uma transação?',
    answer: 'Clique no botão + flutuante na tela inicial, preencha os dados da transação e toque em salvar.',
  },
  {
    question: 'Como criar categorias personalizadas?',
    answer: 'Acesse o menu Categorias, escolha entre Despesas ou Receitas, digite o nome e selecione a cor desejada.',
  },
  {
    question: 'Como funcionam as parcelas?',
    answer: 'Ao adicionar uma transação, ative a opção de parcelamento e defina o número de parcelas. O sistema distribuirá automaticamente nos meses seguintes.',
  },
  {
    question: 'Posso mudar o tema do app?',
    answer: 'Sim! Acesse Configurações e alterne entre o tema claro e escuro.',
  },
  {
    question: 'Meus dados estão seguros?',
    answer: 'Sim. Usamos criptografia e autenticação segura. Cada usuário só acessa seus próprios dados.',
  },
];

export default function Suporte() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
      <PageBackHeader title="Suporte" />

      {/* FAQ */}
      <Card className="border-border/50 bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <HelpCircle className="h-5 w-5 text-primary" />
            Perguntas Frequentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left text-sm">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Contact */}
      <Card className="border-border/50 bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="h-5 w-5 text-primary" />
            Contato
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Dúvidas ou sugestões? Entre em contato.
          </p>
          <Button variant="outline" className="w-full justify-start">
            <Mail className="mr-2 h-4 w-4" />
            suporte@controlae.com.br
          </Button>
          <p className="text-sm text-muted-foreground">
            Responderemos em até 24 horas úteis.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
