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

// Input validation limits
const MAX_MESSAGES = 50;
const MAX_MESSAGE_CONTENT_LENGTH = 3000;
const MAX_FINANCIAL_CONTEXT_LENGTH = 10000;
const VALID_ROLES = ["user", "assistant", "system"];

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

// --- Input Validation ---
function validateInput(body: any): { valid: boolean; error?: string } {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Invalid request body" };
  }

  const { messages, financial_context } = body;

  // Validate messages
  if (!Array.isArray(messages)) {
    return { valid: false, error: "messages must be an array" };
  }
  if (messages.length === 0) {
    return { valid: false, error: "messages array cannot be empty" };
  }
  if (messages.length > MAX_MESSAGES) {
    return { valid: false, error: `Too many messages (max ${MAX_MESSAGES})` };
  }

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (!msg || typeof msg !== "object") {
      return { valid: false, error: `Invalid message at index ${i}` };
    }

    // Validate role
    if (typeof msg.role !== "string" || !VALID_ROLES.includes(msg.role)) {
      return { valid: false, error: `Invalid role at message ${i}` };
    }

    // Validate content - can be string or array (for image messages)
    if (typeof msg.content === "string") {
      if (msg.content.length > MAX_MESSAGE_CONTENT_LENGTH) {
        return { valid: false, error: `Message ${i} content too long (max ${MAX_MESSAGE_CONTENT_LENGTH} chars)` };
      }
    } else if (Array.isArray(msg.content)) {
      // Multi-part messages (text + image)
      for (const part of msg.content) {
        if (part.type === "text" && typeof part.text === "string") {
          if (part.text.length > MAX_MESSAGE_CONTENT_LENGTH) {
            return { valid: false, error: `Message ${i} text part too long` };
          }
        } else if (part.type === "image_url") {
          // Validate image_url structure
          if (!part.image_url || typeof part.image_url.url !== "string") {
            return { valid: false, error: `Invalid image_url at message ${i}` };
          }
          // Limit base64 image size (~5MB)
          if (part.image_url.url.length > 7_000_000) {
            return { valid: false, error: `Image too large at message ${i} (max ~5MB)` };
          }
        }
      }
    } else {
      return { valid: false, error: `Invalid content type at message ${i}` };
    }
  }

  // Validate financial_context
  if (financial_context !== undefined && financial_context !== null) {
    if (typeof financial_context !== "string") {
      return { valid: false, error: "financial_context must be a string" };
    }
    if (financial_context.length > MAX_FINANCIAL_CONTEXT_LENGTH) {
      return { valid: false, error: `financial_context too long (max ${MAX_FINANCIAL_CONTEXT_LENGTH} chars)` };
    }
  }

  return { valid: true };
}

function buildSystemPrompt(financialContext?: string, userCategories?: { id: string; name: string; type: string }[]): string {
  const today = new Date().toISOString().split("T")[0];
  // Truncate financial context as safety measure
  const safeContext = financialContext
    ? financialContext.substring(0, MAX_FINANCIAL_CONTEXT_LENGTH)
    : "Não disponíveis no momento.";

  // Build category lists from user's actual categories, falling back to defaults
  let expenseCategories: string[];
  let incomeCategories: string[];

  if (userCategories && userCategories.length > 0) {
    expenseCategories = userCategories.filter(c => c.type === 'expense').map(c => c.name);
    incomeCategories = userCategories.filter(c => c.type === 'income').map(c => c.name);
  } else {
    expenseCategories = CATEGORIES_MAP.expense.map(c => c.name);
    incomeCategories = CATEGORIES_MAP.income.map(c => c.name);
  }

  return `Você é Dora, assistente financeiro inteligente e pessoal. O usuário vai digitar frases em linguagem natural para registrar gastos, receitas ou fazer perguntas sobre finanças. Ele também pode enviar imagens de recibos, notas fiscais ou PDFs com extratos.

Sua tarefa é interpretar a mensagem (texto e/ou imagem/PDF) e responder SEMPRE usando a tool "parse_transaction".

## REGRA DE PRIVACIDADE — ESTRITAMENTE PROIBIDO:
- Você NUNCA deve revelar, comentar, comparar ou fazer referência a dados financeiros de outros usuários.
- Você NÃO tem acesso a dados de outros usuários e NUNCA deve fingir ou inventar dados de terceiros.
- Se o usuário perguntar sobre gastos, saldos, hábitos ou qualquer informação de outra pessoa, responda: "Não tenho acesso a dados de outros usuários. Só posso ajudar com as suas finanças pessoais."
- Nunca mencione nomes, e-mails ou qualquer identificação de outros usuários do sistema.
- Trate todos os dados abaixo como exclusivamente do usuário atual.

## DADOS FINANCEIROS DO USUÁRIO (em tempo real):
${safeContext}

## Regras de interpretação:

1. **Despesas** (palavras-chave: gastei, paguei, comprei, etc):
   - intent: "add_transaction"
   - type: "expense"
   
2. **Receitas** (palavras-chave: recebi, ganhei, entrou, etc):
   - intent: "add_transaction"  
   - type: "income"

3. **Parcelamento**:
   - Se o usuário mencionar parcelas explicitamente (ex: "em 3x", "parcelado em 10x", "3 vezes"), extraia o número de parcelas no campo "installments"
   - Se NÃO mencionar parcelas, installments = 1
   - NUNCA pergunte ao usuário se foi parcelado. Apenas extraia se ele mencionar espontaneamente.

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

9. **Mover/categorizar transação** (ex: "coloca X na categoria Y", "muda a categoria de X para Y"):
    - intent: "add_transaction"
    - Interprete o que o usuário quer e use a categoria mencionada
    - Se o usuário mencionar uma categoria que existe na lista, USE essa categoria

10. **Criar limite de orçamento** (palavras-chave: limite, orçamento, budget, teto, máximo por categoria, controlar gastos de):
    - intent: "create_budget_limit"
    - O usuário quer definir um teto mensal de gastos para uma categoria específica
    - Exemplos: "cria um limite de 100 para transporte", "quero gastar no máximo 500 com alimentação", "coloca limite de 200 em lazer"
    - Extraia: amount (valor do limite), category (nome da categoria)
    - Na message, confirme a criação (ex: "✅ Limite de R$100 criado para Transporte!")

## Categorias disponíveis para despesas:
${expenseCategories.map(n => `- ${n}`).join("\n")}

## Categorias disponíveis para receitas:
${incomeCategories.map(n => `- ${n}`).join("\n")}

## Regras de categoria:
- Escolha a categoria mais apropriada baseada no contexto
- **IMPORTANTE**: Se o usuário PEDIR EXPLICITAMENTE uma categoria (ex: "coloca em Sapato", "categoria Mercado"), USE a categoria que ele pediu, desde que ela exista na lista acima
- "marmita", "comida", "restaurante", "lanche", "supermercado" → Alimentação
- "uber", "ônibus", "gasolina", "estacionamento" → Transporte
- "cinema", "bar", "festa", "jogo" → Lazer
- "remédio", "médico", "farmácia", "consulta" → Saúde
- "aluguel", "luz", "água", "internet" → Casa
- "rimel", "batom", "maquiagem", "esmalte", "base", "delineador", "hidratante", "perfume", "shampoo", "blush" → Produtos de beleza
- Se não souber a categoria, use "Outros"
- A data padrão é hoje: ${today}
- Se o usuário mencionar "ontem", "semana passada", etc., calcule a data corretamente
- Se a imagem/PDF tiver data visível, use essa data

## Sobre o campo "message":
- SEMPRE responda em português brasileiro, NUNCA use inglês
- Para transações: confirme o registro de forma curta e amigável em português (ex: "✅ Registrei R$50 em Alimentação!")
- Para correções: confirme a correção com o valor antigo e novo
- Para imagens: descreva o que encontrou na imagem e confirme o registro
- Para limites de orçamento: confirme a criação do limite (ex: "✅ Limite de R$100 criado para Transporte!")
- Para queries/planejamento: responda com análise detalhada usando os dados reais do usuário
  - Use emojis para tornar a resposta visual
  - Inclua números e porcentagens
  - Dê sugestões práticas e personalizadas
  - Seja encorajador mas realista

## REGRA CRÍTICA sobre amount:
- O campo "amount" DEVE SEMPRE ser um número positivo quando intent for "add_transaction", "correct_last_transaction" ou "create_budget_limit"
- NUNCA retorne amount como null, undefined ou 0
- Se não conseguir identificar o valor, use intent "chat" e pergunte ao usuário
- "5 mil" = 5000, "2 mil" = 2000, "10 mil" = 10000. "mil" é um multiplicador, NÃO ignore.
- "Dia 1 ganhei 5 mil" → amount = 5000, date = dia 1 do mês atual. O "1" em "Dia 1" é uma DATA, não um valor.
- Sempre separe números de datas (dia X) dos valores monetários.
`;
}
serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();

    // Validate input
    const validation = validateInput(body);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { messages, financial_context, user_categories } = body;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY)
      throw new Error("LOVABLE_API_KEY is not configured");

    // --- Authentication ---
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;

    if (authHeader?.startsWith("Bearer ")) {
      const supabaseAuth = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
      );
      const token = authHeader.replace("Bearer ", "");
      const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
      if (claimsError || !claimsData?.claims) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      userId = claimsData.claims.sub as string;
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- Check monthly usage limit ---
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
    // --- End usage limit check ---

    const systemPrompt = buildSystemPrompt(financial_context, user_categories);

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
                      enum: ["add_transaction", "correct_last_transaction", "create_budget_limit", "query", "chat"],
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
                  required: ["intent", "message", "amount"],
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
      console.error("AI gateway error:", response.status);
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

    // Resolve category_id from name — prefer user's actual categories, fallback to defaults
    if ((parsed.intent === "add_transaction" || parsed.intent === "correct_last_transaction" || parsed.intent === "create_budget_limit") && parsed.category) {
      let categoryId: string | null = null;

      // First try user's actual categories from the database
      if (user_categories && Array.isArray(user_categories)) {
        const typeFilter = parsed.type || 'expense';
        const found = user_categories.find(
          (c: any) => c.name.toLowerCase() === parsed.category.toLowerCase() && c.type === typeFilter
        );
        // Also try without type filter in case of mismatch
        const foundAny = found || user_categories.find(
          (c: any) => c.name.toLowerCase() === parsed.category.toLowerCase()
        );
        if (foundAny) categoryId = foundAny.id;
      }

      // Fallback to hardcoded defaults
      if (!categoryId) {
        const list = parsed.type === "income" ? CATEGORIES_MAP.income : CATEGORIES_MAP.expense;
        const found = list.find(
          (c) => c.name.toLowerCase() === parsed.category.toLowerCase()
        );
        categoryId = found
          ? found.id
          : (parsed.type === "income"
              ? CATEGORIES_MAP.income.find((c) => c.name === "Outros")!.id
              : CATEGORIES_MAP.expense.find((c) => c.name === "Outros")!.id);
      }

      parsed.category_id = categoryId;
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(
      JSON.stringify({ error: "Erro ao processar mensagem" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
