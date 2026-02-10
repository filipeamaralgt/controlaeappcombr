import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Monthly limit in USD (≈ R$ 4,50 at ~5.20 BRL/USD)
const MONTHLY_LIMIT_USD = 0.87;
// Recharge amount in BRL and how much USD it unlocks
const RECHARGE_BRL = 5.00;
const RECHARGE_USD = 0.97; // ≈ R$ 5,00 at ~5.20

const CATEGORIES_MAP = {
  expense: [
    { name: "Alimentação", id: "1be21c44-4fb2-44af-a8ee-4ace5928e29d" },
    { name: "Transporte", id: "acb6dae2-7132-4df8-826f-caf2b89ec7f1" },
    { name: "Lazer", id: "0cc300a3-960c-4bb6-a8e3-002f58b80fbc" },
    { name: "Educação", id: "12d69128-1930-48e4-b604-d4bf9a07e38b" },
    { name: "Saúde", id: "01a0f760-f455-4a99-883c-f775175bfa26" },
    { name: "Casa", id: "c57693e3-fd6a-4cf8-abec-a28dbe6428f6" },
    { name: "Roupas", id: "a9598715-9fec-457f-9d1c-7bd5c100ce98" },
    { name: "Academia", id: "1735de14-104a-4cd5-8c5d-04e5d134ed3b" },
    { name: "Viagens", id: "a27f3a6d-bfa7-49c4-9109-b39643e1b2cc" },
    { name: "Produtos de beleza", id: "17ba730e-4039-44a4-ab3c-923624dfe69f" },
    { name: "Plano celular", id: "a7fa460f-f05e-41d0-a149-23b73273a8a6" },
    { name: "Curso", id: "e2b6df36-9e05-401c-b1e6-f426d544848d" },
    { name: "Meg", id: "403a836a-4957-48d8-8848-72b4e578908a" },
    { name: "Natação João", id: "4ae7371b-e232-4de3-b1b9-95d05a7f2a1c" },
    { name: "Outros", id: "256e405a-5112-4794-8776-2ddb45502921" },
  ],
  income: [
    { name: "Salário", id: "e4111d9c-0221-413f-b920-b0625a2d9f2f" },
    { name: "Freelance", id: "a19931a0-bb29-483a-bd15-c8cab71e56dc" },
    { name: "Investimentos", id: "ccb73d5a-ad86-4e99-8603-3e2ca633cfd0" },
    { name: "Presente", id: "8bbec2b4-4dc3-430b-80fd-bb19b8848449" },
    { name: "Juros", id: "bc544f09-0778-4efc-a18b-f71f370f6295" },
    { name: "Outros", id: "df154451-ce1d-4ef2-bc84-75868cdac6f2" },
  ],
};

function buildSystemPrompt(financialContext?: string): string {
  const today = new Date().toISOString().split("T")[0];

  return `Você é Maya, assistente financeiro inteligente e pessoal. O usuário vai digitar frases em linguagem natural para registrar gastos, receitas ou fazer perguntas sobre finanças. Ele também pode enviar imagens de recibos, notas fiscais ou PDFs com extratos.

Sua tarefa é interpretar a mensagem (texto e/ou imagem/PDF) e responder SEMPRE usando a tool "parse_transaction".

## REGRA DE PRIVACIDADE — ESTRITAMENTE PROIBIDO:
- Você NUNCA deve revelar, comentar, comparar ou fazer referência a dados financeiros de outros usuários.
- Você NÃO tem acesso a dados de outros usuários e NUNCA deve fingir ou inventar dados de terceiros.
- Se o usuário perguntar sobre gastos, saldos, hábitos ou qualquer informação de outra pessoa, responda: "Não tenho acesso a dados de outros usuários. Só posso ajudar com as suas finanças pessoais."
- Nunca mencione nomes, e-mails ou qualquer identificação de outros usuários do sistema.
- Trate todos os dados abaixo como exclusivamente do usuário atual.

## DADOS FINANCEIROS DO USUÁRIO (em tempo real):
${financialContext || "Não disponíveis no momento."}

## Regras de interpretação:

1. **Despesas** (palavras-chave: gastei, paguei, comprei, etc):
   - intent: "add_transaction"
   - type: "expense"
   
2. **Receitas** (palavras-chave: recebi, ganhei, entrou, etc):
   - intent: "add_transaction"  
   - type: "income"

3. **Parcelamento** (palavras-chave: em Nx, parcelado, X vezes, Xx):
   - Se o usuário mencionar parcelas (ex: "em 3x", "parcelado em 10x", "3 vezes"), extraia o número de parcelas no campo "installments"
   - Se não mencionar parcelas, installments = 1

4. **Imagens de recibos/notas fiscais**:
   - Analise a imagem e extraia: valor total, descrição do item/serviço, categoria
   - intent: "add_transaction"
   - type: "expense" (ou "income" se for comprovante de recebimento)

4. **PDFs ou imagens de extratos**:
   - Analise e extraia as transações visíveis
   - Se houver múltiplas transações, registre a principal ou pergunte qual registrar
   - intent: "add_transaction"

5. **Perguntas sobre finanças pessoais** (quanto gastei, onde gasto mais, posso economizar, etc):
   - intent: "query"
   - USE OS DADOS FINANCEIROS ACIMA para responder com números reais
   - Faça cálculos precisos (média diária, projeção mensal, comparações entre categorias)
   - Dê dicas práticas e personalizadas
   - Responda no campo "message"

6. **Planejamento financeiro** (criar meta, posso viajar, consigo economizar X, etc):
   - intent: "chat"
   - Analise os dados do usuário para dar respostas realistas
   - Calcule quanto sobra por mês, quanto precisa economizar por dia/semana
   - Sugira cortes em categorias específicas com base nos gastos reais
   - Responda no campo "message"

7. **Conversa geral** sobre finanças:
   - intent: "chat"
   - Responda de forma útil no campo "message"

8. **Correção de transação** (palavras-chave: corrija, na verdade era, errei o valor, era X e não Y, corrige pra):
   - intent: "correct_last_transaction"
   - IMPORTANTE: Quando o usuário pedir para corrigir um valor, use este intent para SUBSTITUIR a última transação
   - NÃO crie uma nova transação, apenas corrija a anterior
   - Preencha amount, type, category e description com os valores CORRETOS
   - Na message, confirme a correção (ex: "✅ Corrigi! O valor era R$50, não R$15.")

## Categorias disponíveis para despesas:
${CATEGORIES_MAP.expense.map((c) => `- ${c.name}`).join("\n")}

## Categorias disponíveis para receitas:
${CATEGORIES_MAP.income.map((c) => `- ${c.name}`).join("\n")}

## Regras de categoria:
- Escolha a categoria mais apropriada baseada no contexto
- "marmita", "comida", "restaurante", "lanche", "supermercado" → Alimentação
- "uber", "ônibus", "gasolina", "estacionamento" → Transporte
- "cinema", "bar", "festa", "jogo" → Lazer
- "remédio", "médico", "farmácia", "consulta" → Saúde
- "aluguel", "luz", "água", "internet" → Casa
- Se não souber a categoria, use "Outros"
- A data padrão é hoje: ${today}
- Se o usuário mencionar "ontem", "semana passada", etc., calcule a data corretamente
- Se a imagem/PDF tiver data visível, use essa data

## Sobre o campo "message":
- SEMPRE responda em português brasileiro, NUNCA use inglês
- Para transações: confirme o registro de forma curta e amigável em português (ex: "✅ Registrei R$50 em Alimentação!")
- Para correções: confirme a correção com o valor antigo e novo
- Para imagens: descreva o que encontrou na imagem e confirme o registro
- Para queries/planejamento: responda com análise detalhada usando os dados reais do usuário
  - Use emojis para tornar a resposta visual
  - Inclua números e porcentagens
  - Dê sugestões práticas e personalizadas
  - Seja encorajador mas realista

## REGRA CRÍTICA sobre amount:
- O campo "amount" DEVE SEMPRE ser um número positivo quando intent for "add_transaction" ou "correct_last_transaction"
- NUNCA retorne amount como null, undefined ou 0
- Se não conseguir identificar o valor, use intent "chat" e pergunte ao usuário
`;
}

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { messages, financial_context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY)
      throw new Error("LOVABLE_API_KEY is not configured");

    // --- Check monthly usage limit ---
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;

    if (authHeader?.startsWith("Bearer ")) {
      const supabaseAuth = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
      );
      const { data: { user } } = await supabaseAuth.auth.getUser();
      userId = user?.id || null;
    }

    if (userId) {
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      const now = new Date();
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01T00:00:00.000Z`;

      const { data: monthlyLogs } = await supabaseAdmin
        .from("ai_usage_logs")
        .select("estimated_cost")
        .eq("user_id", userId)
        .gte("created_at", monthStart);

      const monthlyCostUsd = (monthlyLogs || []).reduce(
        (sum: number, log: any) => sum + Number(log.estimated_cost || 0),
        0
      );
      const monthlyCallCount = (monthlyLogs || []).length;

      if (monthlyCostUsd >= MONTHLY_LIMIT_USD) {
        const costPerMsg = monthlyCallCount > 0 ? monthlyCostUsd / monthlyCallCount : 0.0001;
        const extraMsgs = Math.floor(RECHARGE_USD / costPerMsg);

        return new Response(
          JSON.stringify({
            error: "ai_limit_reached",
            monthly_calls: monthlyCallCount,
            monthly_cost_usd: monthlyCostUsd,
            limit_usd: MONTHLY_LIMIT_USD,
            extra_messages_with_recharge: extraMsgs,
            recharge_brl: RECHARGE_BRL,
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }
    // --- End usage limit check ---

    const systemPrompt = buildSystemPrompt(financial_context);

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "parse_transaction",
                description:
                  "Parse a natural language message or image into a structured transaction or response",
                parameters: {
                  type: "object",
                  properties: {
                    intent: {
                      type: "string",
                      enum: ["add_transaction", "correct_last_transaction", "query", "chat"],
                    },
                    type: {
                      type: "string",
                      enum: ["expense", "income"],
                      description: "Only for add_transaction intent",
                    },
                    amount: {
                      type: "number",
                      description: "Only for add_transaction intent",
                    },
                    description: {
                      type: "string",
                      description:
                        "Short description of the transaction or query",
                    },
                    category: {
                      type: "string",
                      description:
                        "Category name from the available list. Only for add_transaction intent",
                    },
                    date: {
                      type: "string",
                      description:
                        "Date in YYYY-MM-DD format. Only for add_transaction intent",
                    },
                    installments: {
                      type: "number",
                      description:
                        "Number of installments (parcelas). Default 1. Only for add_transaction intent. Extract from phrases like 'em 3x', 'parcelado em 10x', '3 vezes'.",
                    },
                    message: {
                      type: "string",
                      description:
                        "Friendly confirmation or answer message to show the user. For queries and planning, include detailed analysis with real numbers.",
                    },
                  },
                  required: ["intent", "message"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "parse_transaction" },
          },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições atingido. Tente novamente em alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Adicione créditos na sua conta Lovable." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "Erro ao processar mensagem" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      return new Response(
        JSON.stringify({ intent: "chat", message: "Desculpe, não consegui entender. Tente novamente." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const parsed = JSON.parse(toolCall.function.arguments);

    // Resolve category_id from name
    if ((parsed.intent === "add_transaction" || parsed.intent === "correct_last_transaction") && parsed.category) {
      const list = parsed.type === "income" ? CATEGORIES_MAP.income : CATEGORIES_MAP.expense;
      const found = list.find(
        (c) => c.name.toLowerCase() === parsed.category.toLowerCase()
      );
      parsed.category_id = found
        ? found.id
        : (parsed.type === "income"
            ? CATEGORIES_MAP.income.find((c) => c.name === "Outros")!.id
            : CATEGORIES_MAP.expense.find((c) => c.name === "Outros")!.id);
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
