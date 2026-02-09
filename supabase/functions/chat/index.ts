import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

const SYSTEM_PROMPT = `Você é um assistente financeiro inteligente. O usuário vai digitar frases em linguagem natural para registrar gastos, receitas ou fazer perguntas sobre finanças.

Sua tarefa é interpretar a mensagem e responder SEMPRE usando a tool "parse_transaction".

## Regras de interpretação:

1. **Despesas** (palavras-chave: gastei, paguei, comprei, etc):
   - intent: "add_transaction"
   - type: "expense"
   
2. **Receitas** (palavras-chave: recebi, ganhei, entrou, etc):
   - intent: "add_transaction"  
   - type: "income"

3. **Perguntas** (palavras-chave: quanto, qual, como, etc):
   - intent: "query"
   - Responda a pergunta de forma útil no campo "message"

4. **Conversa geral** sobre finanças:
   - intent: "chat"
   - Responda de forma útil no campo "message"

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
- A data padrão é hoje: ${new Date().toISOString().split("T")[0]}
- Se o usuário mencionar "ontem", "semana passada", etc., calcule a data corretamente

## Sobre o campo "message":
- Para transações: confirme o registro de forma curta e amigável (ex: "✅ Registrei R$50 em Alimentação!")
- Para queries/chat: responda a pergunta de forma útil e concisa
`;

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY)
      throw new Error("LOVABLE_API_KEY is not configured");

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
            { role: "system", content: SYSTEM_PROMPT },
            ...messages,
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "parse_transaction",
                description:
                  "Parse a natural language message into a structured transaction or response",
                parameters: {
                  type: "object",
                  properties: {
                    intent: {
                      type: "string",
                      enum: ["add_transaction", "query", "chat"],
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
                    message: {
                      type: "string",
                      description:
                        "Friendly confirmation or answer message to show the user",
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
    if (parsed.intent === "add_transaction" && parsed.category) {
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
