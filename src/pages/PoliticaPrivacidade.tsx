import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { AppLogo } from '@/components/AppLogo';

export default function PoliticaPrivacidade() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-10 space-y-8">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar
          </button>
        </div>

        <div className="flex items-center gap-3">
          <AppLogo size="md" />
          <h1 className="text-2xl font-bold text-foreground">Política de Privacidade</h1>
        </div>

        <p className="text-xs text-muted-foreground">Última atualização: 17 de fevereiro de 2026</p>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-muted-foreground [&_h2]:text-foreground [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-8 [&_strong]:text-foreground">

          <p>
            O <strong>Controlaê</strong> ("nós", "nosso") valoriza a sua privacidade. Esta política descreve como coletamos, usamos e protegemos as informações pessoais dos nossos usuários, em conformidade com a <strong>Lei Geral de Proteção de Dados (LGPD – Lei nº 13.709/2018)</strong>.
          </p>

          <h2>1. Dados que coletamos</h2>
          <p>Coletamos apenas os dados estritamente necessários para a prestação do serviço:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Nome</strong> — para personalizar sua experiência.</li>
            <li><strong>E-mail</strong> — para autenticação, comunicação e recuperação de conta.</li>
            <li><strong>WhatsApp (opcional)</strong> — exclusivamente para suporte e recuperação de conta.</li>
            <li><strong>Dados financeiros inseridos por você</strong> — transações, categorias, metas, etc. Esses dados são armazenados de forma segura e nunca compartilhados com terceiros.</li>
          </ul>

          <h2>2. Como usamos seus dados</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Fornecer e melhorar o serviço Controlaê.</li>
            <li>Enviar comunicações relacionadas ao serviço (atualizações, suporte).</li>
            <li>Enviar comunicações de marketing, <strong>somente com seu consentimento explícito</strong>.</li>
            <li>Gerar insights financeiros personalizados usando inteligência artificial (os dados não saem do nosso ambiente seguro).</li>
          </ul>

          <h2>3. Compartilhamento de dados</h2>
          <p>
            <strong>Não vendemos, alugamos ou compartilhamos</strong> seus dados pessoais com terceiros, exceto:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Stripe</strong> — para processamento de pagamentos. O Stripe possui sua própria política de privacidade compatível com LGPD e GDPR.</li>
            <li><strong>Supabase</strong> — infraestrutura de banco de dados e autenticação, com criptografia em trânsito e em repouso.</li>
            <li><strong>Obrigações legais</strong> — quando exigido por lei ou ordem judicial.</li>
          </ul>

          <h2>4. Segurança dos dados</h2>
          <p>
            Utilizamos criptografia, políticas de acesso restrito (Row Level Security) e boas práticas de segurança da informação para proteger seus dados. Cada usuário só tem acesso aos seus próprios dados.
          </p>

          <h2>5. Seus direitos (LGPD)</h2>
          <p>Você tem direito a:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Acessar seus dados pessoais.</li>
            <li>Corrigir dados incompletos ou desatualizados.</li>
            <li>Solicitar a exclusão dos seus dados.</li>
            <li>Revogar o consentimento a qualquer momento.</li>
            <li>Solicitar a portabilidade dos seus dados.</li>
          </ul>
          <p>
            Para exercer qualquer direito, entre em contato pelo e-mail: <strong>contato@controlae.app</strong>
          </p>

          <h2>6. Cookies</h2>
          <p>
            Utilizamos cookies essenciais para autenticação e funcionamento do aplicativo. Não utilizamos cookies de rastreamento de terceiros.
          </p>

          <h2>7. Retenção de dados</h2>
          <p>
            Seus dados são mantidos enquanto sua conta estiver ativa. Após a exclusão da conta, seus dados serão removidos em até 30 dias, exceto quando a retenção for exigida por lei.
          </p>

          <h2>8. Alterações nesta política</h2>
          <p>
            Podemos atualizar esta política periodicamente. Alterações significativas serão comunicadas por e-mail ou dentro do aplicativo.
          </p>

          <h2>9. Contato</h2>
          <p>
            Em caso de dúvidas sobre esta política ou sobre o tratamento dos seus dados, entre em contato:
          </p>
          <p>
            <strong>E-mail:</strong> contato@controlae.app
          </p>
        </div>
      </div>
    </div>
  );
}
