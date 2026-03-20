import { format } from 'date-fns';

// Category mapping with keywords for local matching
const CATEGORIES_MAP = {
  expense: [
    { name: 'Alimentação', id: '1be21c44-4fb2-44af-a8ee-4ace5928e29d', keywords: ['comida', 'marmita', 'almoço', 'almoco', 'jantar', 'café', 'cafe', 'lanche', 'restaurante', 'supermercado', 'mercado', 'padaria', 'pizza', 'hambúrguer', 'hamburguer', 'sushi', 'ifood', 'alimentação', 'alimentacao', 'comer', 'shake', 'milk shake', 'milkshake', 'açaí', 'acai', 'sorvete', 'doce', 'bolo', 'salgado', 'pastel', 'coxinha', 'esfiha', 'yakisoba', 'churrasco', 'fruta', 'verdura', 'feira', 'bolacha', 'biscoito', 'chocolate', 'pão', 'pao', 'leite', 'ovo', 'carne', 'frango', 'peixe', 'bebida', 'suco', 'refrigerante', 'cerveja', 'água de coco', 'chiclete', 'ciclete', 'bala', 'guloseima', 'pipoca', 'tapioca', 'crepe', 'waffle'] },
    { name: 'Transporte', id: 'acb6dae2-7132-4df8-826f-caf2b89ec7f1', keywords: ['uber', 'ônibus', 'onibus', 'metrô', 'metro', 'gasolina', 'combustível', 'combustivel', 'estacionamento', 'táxi', 'taxi', '99', 'transporte', 'pedágio', 'pedagio'] },
    { name: 'Lazer', id: '0cc300a3-960c-4bb6-a8e3-002f58b80fbc', keywords: ['cinema', 'bar', 'festa', 'jogo', 'teatro', 'show', 'lazer', 'diversão', 'diversao', 'netflix', 'spotify', 'streaming'] },
    { name: 'Educação', id: '12d69128-1930-48e4-b604-d4bf9a07e38b', keywords: ['livro', 'curso', 'escola', 'faculdade', 'educação', 'educacao', 'apostila', 'material escolar'] },
    { name: 'Saúde', id: '01a0f760-f455-4a99-883c-f775175bfa26', keywords: ['remédio', 'remedio', 'médico', 'medico', 'farmácia', 'farmacia', 'consulta', 'exame', 'hospital', 'dentista', 'saúde', 'saude'] },
    { name: 'Casa', id: 'c57693e3-fd6a-4cf8-abec-a28dbe6428f6', keywords: ['aluguel', 'luz', 'água', 'agua', 'internet', 'gás', 'gas', 'condomínio', 'condominio', 'casa', 'iptu'] },
    { name: 'Roupas', id: 'a9598715-9fec-457f-9d1c-7bd5c100ce98', keywords: ['roupa', 'roupas', 'camisa', 'calça', 'calca', 'tênis', 'tenis', 'sapato', 'vestido', 'blusa', 'loja'] },
    { name: 'Academia', id: '1735de14-104a-4cd5-8c5d-04e5d134ed3b', keywords: ['academia', 'musculação', 'musculacao', 'treino'] },
    { name: 'Viagens', id: 'a27f3a6d-bfa7-49c4-9109-b39643e1b2cc', keywords: ['viagem', 'viagens', 'hotel', 'passagem', 'aeroporto', 'voo'] },
    { name: 'Produtos de beleza', id: '17ba730e-4039-44a4-ab3c-923624dfe69f', keywords: ['maquiagem', 'beleza', 'cosmético', 'cosmetico', 'creme', 'perfume', 'shampoo', 'rimel', 'rímel', 'batom', 'base', 'delineador', 'esmalte', 'hidratante', 'protetor solar', 'condicionador', 'máscara capilar', 'blush', 'pó compacto', 'corretivo', 'sombra'] },
    { name: 'Plano celular', id: 'a7fa460f-f05e-41d0-a149-23b73273a8a6', keywords: ['celular', 'plano', 'telefone', 'chip'] },
    { name: 'Curso', id: 'e2b6df36-9e05-401c-b1e6-f426d544848d', keywords: ['curso'] },
    { name: 'Meg', id: '403a836a-4957-48d8-8848-72b4e578908a', keywords: ['meg'] },
    { name: 'Natação João', id: '4ae7371b-e232-4de3-b1b9-95d05a7f2a1c', keywords: ['natação', 'natacao', 'natação joão', 'natacao joao'] },
    { name: 'Outros', id: '256e405a-5112-4794-8776-2ddb45502921', keywords: [] },
  ],
  income: [
    { name: 'Salário', id: 'e4111d9c-0221-413f-b920-b0625a2d9f2f', keywords: ['salário', 'salario', 'holerite', 'pagamento'] },
    { name: 'Freelance', id: 'a19931a0-bb29-483a-bd15-c8cab71e56dc', keywords: ['freelance', 'freela', 'bico', 'extra'] },
    { name: 'Investimentos', id: 'ccb73d5a-ad86-4e99-8603-3e2ca633cfd0', keywords: ['investimento', 'rendimento', 'dividendo', 'ações', 'acoes'] },
    { name: 'Presente', id: '8bbec2b4-4dc3-430b-80fd-bb19b8848449', keywords: ['presente', 'gift'] },
    { name: 'Juros', id: 'bc544f09-0778-4efc-a18b-f71f370f6295', keywords: ['juros', 'rendimento'] },
    { name: 'Outros', id: 'df154451-ce1d-4ef2-bc84-75868cdac6f2', keywords: [] },
  ],
};

// Expense trigger words
const EXPENSE_TRIGGERS = /\b(gastei|gastou|gastamos|gastaram|paguei|pagou|pagamos|pagaram|comprei|comprou|compramos|compraram|pagar|gastar|comprar|gasto|compra|despesa)\b/i;
// Income trigger words  
const INCOME_TRIGGERS = /\b(recebi|recebeu|recebemos|receberam|ganhei|ganhou|ganhamos|ganharam|entrou|receber|ganhar|renda|receita|salário|salario)\b/i;
// Installment patterns
const INSTALLMENT_PATTERN = /\b(?:em\s+)?(\d+)\s*(?:x|vezes|parcelas?)\b|\bparcelad[oa]\s+(?:em\s+)?(\d+)/i;
// Date-like patterns to strip before amount extraction (e.g. "dia 1", "dia 15", "no dia 20")
const DATE_NUMBER_PATTERN = /\b(?:no\s+)?dia\s+\d{1,2}\b/gi;
// Amount patterns - handles "50", "50 reais", "R$ 50", "R$50", "50,00", "50.00", "2.000", "1.500,50"
const AMOUNT_PATTERN = /(?:R\$\s*)?(\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d+(?:,\d{1,2})?)\s*(mil|k)?\s*(?:reais|conto|pila)?/i;

interface LocalParseResult {
  intent: 'add_transaction';
  type: 'expense' | 'income';
  amount: number;
  description: string;
  category: string;
  category_id: string;
  date: string;
  installments: number;
  message: string;
  notes?: string;
  detectedProfileName?: string;
}

export interface PendingAmountResult {
  intent: 'need_amount';
  type: 'expense' | 'income';
  description: string;
  category: string;
  category_id: string;
  date: string;
  installments: number;
  message: string;
  notes?: string;
  detectedProfileName?: string;
}

export interface PendingCategoryResult {
  intent: 'need_category';
  type: 'expense' | 'income';
  amount: number;
  description: string;
  date: string;
  installments: number;
  message: string;
  notes?: string;
  detectedProfileName?: string;
}

export interface PendingInstallmentResult {
  intent: 'need_installments';
  type: 'expense';
  amount: number;
  description: string;
  category: string;
  category_id: string;
  date: string;
  message: string;
  notes?: string;
  detectedProfileName?: string;
}

function matchCategory(text: string, type: 'expense' | 'income'): { name: string; id: string; matchedKeyword?: string } {
  const lower = text.toLowerCase();
  const categories = type === 'expense' ? CATEGORIES_MAP.expense : CATEGORIES_MAP.income;

  for (const cat of categories) {
    for (const kw of cat.keywords) {
      if (lower.includes(kw)) {
        return { name: cat.name, id: cat.id, matchedKeyword: kw };
      }
    }
  }

  // Default to "Outros"
  const outros = categories.find((c) => c.name === 'Outros')!;
  return { name: outros.name, id: outros.id };
}

function extractDescription(text: string): string {
  // Remove trigger words and amount to get description
  let desc = text
    .replace(EXPENSE_TRIGGERS, '')
    .replace(INCOME_TRIGGERS, '')
    .replace(/R\$\s*\d+(?:[.,]\d{1,2})?\s*(?:mil|k)?/gi, '')
    .replace(/\d+(?:[.,]\d{1,2})?\s*(?:mil|k)?\s*(?:reais|conto|pila)?/gi, '')
    .replace(INSTALLMENT_PATTERN, '')
    .replace(/\b(?:hoje|ontem)\b/gi, '')
    .replace(/\b(?:monica|mônica|filipe|felipe)\b/gi, '')
    .replace(/\b(?:aqui)\b/gi, '')
    .replace(/\b(?:com|em|no|na|de|do|da|pra|para|pro)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Capitalize first letter
  if (desc) {
    desc = desc.charAt(0).toUpperCase() + desc.slice(1);
  }
  return desc || 'Transação';
}

/**
 * Try to parse a simple transaction message locally without calling AI.
 * Returns null if the message is too complex / ambiguous.
 */
export interface BudgetLimitResult {
  intent: 'create_budget_limit';
  category: string;
  category_id: string;
  amount: number;
  message: string;
}

const BUDGET_LIMIT_TRIGGER = /\b(limite|teto|orçamento|orcamento|budget)\b/i;
const BUDGET_LIMIT_PATTERN = /\b(?:limite|teto|orçamento|orcamento|budget)\s+(?:de\s+)?(?:R\$\s*)?(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?|\d+(?:,\d{1,2})?)\s*(?:mil|k)?\s*(?:reais|conto|pila)?\s*(?:para|pra|pro|em|na|no|da|do|de)\s+(.+)/i;
const BUDGET_LIMIT_PATTERN2 = /\b(?:cri(?:e|ar)|defin(?:ir|a)|coloc(?:ar|a))\s+(?:um\s+)?(?:limite|teto|orçamento|orcamento)\s+(?:de\s+)?(?:R\$\s*)?(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?|\d+(?:,\d{1,2})?)\s*(?:mil|k)?\s*(?:reais|conto|pila)?\s*(?:para|pra|pro|em|na|no|da|do|de)\s+(.+)/i;

function tryParseBudgetLimit(text: string): BudgetLimitResult | null {
  if (!BUDGET_LIMIT_TRIGGER.test(text) && !/\b(cri(?:e|ar)|defin(?:ir|a)|coloc(?:ar|a))\s+(?:um\s+)?(?:limite|teto)/i.test(text)) return null;

  const match = text.match(BUDGET_LIMIT_PATTERN2) || text.match(BUDGET_LIMIT_PATTERN);
  if (!match) return null;

  let rawAmount = match[1].replace(/\./g, '').replace(',', '.');
  const amount = parseFloat(rawAmount);
  if (isNaN(amount) || amount <= 0) return null;

  const categoryText = match[2].trim().replace(/[.!?]+$/, '');
  const category = matchCategory(categoryText, 'expense');

  return {
    intent: 'create_budget_limit',
    category: category.name,
    category_id: category.id,
    amount,
    message: `✅ Limite de R$ ${amount.toFixed(2)} definido para ${category.name}!`,
  };
}

export interface SuggestBudgetLimitResult {
  intent: 'suggest_budget_limit';
  message: string;
}

const OVERSPENDING_TRIGGER = /\b(gastei\s+(demais|muito|pra\s+caramba|d\+)|gast[oa]ndo\s+(demais|muito|d\+)|exagerei|gastando\s+à\s+toa|torrando|torrei|esbanjei|esbanjando|tô\s+gastand|estou\s+gastand|to\s+gastand|gasto\s+(tá|ta|está|esta)\s+(alto|demais|muito)|preciso\s+controlar|descontrol|sem\s+controle|besteira|compulsiv)/i;

export function tryDetectOverspending(text: string): SuggestBudgetLimitResult | null {
  if (!OVERSPENDING_TRIGGER.test(text)) return null;
  // Skip if it's a question — let the AI handle it
  if (text.includes('?') || /\b(onde|quanto|como|qual|quando|por\s*que|porque)\b/i.test(text)) return null;
  return {
    intent: 'suggest_budget_limit',
    message: '😮 Entendo! Gastar demais acontece, mas a boa notícia é que dá pra ajustar. Aqui vão algumas dicas rápidas:\n\n💡 **Dicas para economizar:**\n1. Revise assinaturas e cancele o que não usa\n2. Planeje suas refeições da semana para evitar delivery\n3. Espere 24h antes de compras por impulso\n4. Use a regra 50/30/20 (necessidades/desejos/poupança)\n5. Defina um limite diário de gastos\n\n📊 Também analisei suas despesas deste mês e encontrei as categorias onde você mais gastou.\n\n🎯 Quer criar limites mensais para controlar melhor? Selecione as categorias abaixo:',
  };
}

// --- Recurring payment detection ---
export interface RecurringPaymentLocalResult {
  intent: 'create_recurring_payment';
  description: string;
  category: string;
  category_id: string;
  day_of_month: number;
  amount: number | null;
  type: 'expense' | 'income';
  message: string;
}

// Patterns like "lembrar de pagar luz todo mês dia 2", "quero pagar aluguel todo dia 5", "adicionar conta de internet recorrente dia 10"
const RECURRING_TRIGGER = /\b(lembr(?:ar|e)|pagar\s+.+\s+todo|todo\s+m[eê]s|mensal(?:mente)?|recorrente|conta\s+(?:de\s+)?(?:luz|água|agua|internet|gás|gas|aluguel|telefone|celular|netflix|spotify|claro|vivo|tim|oi)|assinatura)\b/i;
const RECURRING_DAY_PATTERN = /\b(?:(?:no\s+)?dia|todo\s+(?:dia|m[eê]s\s+(?:no\s+)?dia))\s+(\d{1,2})\b/i;

export function tryDetectRecurringPayment(text: string): RecurringPaymentLocalResult | null {
  const lower = text.toLowerCase();
  
  // Must have a recurring trigger
  if (!RECURRING_TRIGGER.test(lower)) return null;
  
  // Must NOT be a simple expense trigger (like "paguei 50 de luz") — those are one-time transactions
  // We look for "todo mês", "mensal", "recorrente", "lembrar de pagar", or bill-like words with day patterns
  const hasRecurringIntent = /\b(todo\s+m[eê]s|todo\s+dia|mensal|recorrente|lembr(?:ar|e)\s+(?:de\s+)?pagar|sempre\s+(?:no\s+)?dia)\b/i.test(lower);
  const hasBillWord = /\b(conta\s+(?:de\s+)?(?:luz|água|agua|internet|gás|gas|telefone|celular)|aluguel|assinatura|netflix|spotify|claro|vivo|tim|oi|plano)\b/i.test(lower);
  const hasDayPattern = RECURRING_DAY_PATTERN.test(lower);
  
  if (!hasRecurringIntent && !(hasBillWord && hasDayPattern)) return null;
  
  // Extract day of month
  const dayMatch = lower.match(RECURRING_DAY_PATTERN);
  const dayOfMonth = dayMatch ? parseInt(dayMatch[1], 10) : 1;
  if (dayOfMonth < 1 || dayOfMonth > 31) return null;
  
  // Extract amount (optional — user may not provide it)
  const textForAmount = lower.replace(DATE_NUMBER_PATTERN, ' ');
  const amountMatch = textForAmount.match(AMOUNT_PATTERN);
  let amount: number | null = null;
  if (amountMatch) {
    let rawAmount = amountMatch[1].replace(/\./g, '').replace(',', '.');
    const parsed = parseFloat(rawAmount);
    if (!isNaN(parsed) && parsed > 0) {
      amount = parsed;
      if (amountMatch[2] && /^(mil|k)$/i.test(amountMatch[2]) && parsed < 1000) amount *= 1000;
    }
  }
  
  // Determine type (default expense for bills)
  const isIncome = /\b(salário|salario|receita|receber|renda)\b/i.test(lower);
  const type: 'expense' | 'income' = isIncome ? 'income' : 'expense';
  
  // Match category
  const category = matchCategory(lower, type);
  
  // Extract description — clean up the text
  // First try to find specific bill keywords as the description
  const billKeywordMatch = lower.match(/\b(luz|água|agua|internet|gás|gas|aluguel|telefone|celular|netflix|spotify|claro|vivo|tim|oi|plano|assinatura)\b/i);
  let description = '';
  if (billKeywordMatch) {
    description = billKeywordMatch[1].charAt(0).toUpperCase() + billKeywordMatch[1].slice(1);
  } else {
    description = lower
      .replace(/\b(me\s+ajud(?:e|ar?)\s+a?\s*|lembr(?:ar|e)\s+(?:de\s+)?|quero\s+|preciso\s+|adicionar?\s+|criar?\s+|todo\s+m[eê]s\s*|mensal(?:mente)?\s*|recorrente\s*|pagar\s+|conta\s+(?:de\s+)?)/gi, '')
      .replace(RECURRING_DAY_PATTERN, '')
      .replace(/R\$\s*\d+(?:[.,]\d{1,2})?\s*(?:mil|k)?/gi, '')
      .replace(/\d+(?:[.,]\d{1,2})?\s*(?:mil|k)?\s*(?:reais|conto|pila)?/gi, '')
      .replace(/\b(no|na|de|do|da|pra|para|pro|em|todo|dia|com|que)\b/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (description) {
      description = description.charAt(0).toUpperCase() + description.slice(1);
    } else {
      description = category.name;
    }
  }
  
  const amountText = amount ? ` de R$ ${amount.toFixed(2)}` : '';
  const message = `✅ Pagamento recorrente criado!\n\n📋 ${description}${amountText}\n📅 Todo dia ${dayOfMonth} do mês\n📁 Categoria: ${category.name}`;
  
  return {
    intent: 'create_recurring_payment',
    description,
    category: category.name,
    category_id: category.id,
    day_of_month: dayOfMonth,
    amount,
    type,
    message,
  };
}

export function tryParseLocally(text: string): LocalParseResult | PendingAmountResult | PendingInstallmentResult | BudgetLimitResult | null {
  const trimmed = text.trim();

  // Try budget limit parsing first
  const budgetResult = tryParseBudgetLimit(trimmed);
  if (budgetResult) return budgetResult;

  // Skip if message is a question
  if (trimmed.includes('?')) return null;
  // Skip if too long (likely complex)
  if (trimmed.length > 120) return null;
  // Skip correction intents
  if (/\b(corrij|errei|na verdade|corrige)\b/i.test(trimmed)) return null;
  // Skip query-like messages
  if (/\b(quanto|onde|como|qual|quando|posso|consigo|analise|resumo|dica)\b/i.test(trimmed)) return null;

  const isExpense = EXPENSE_TRIGGERS.test(trimmed);
  const isIncome = INCOME_TRIGGERS.test(trimmed);

  // Must be clearly one or the other
  if (!isExpense && !isIncome) return null;
  if (isExpense && isIncome) return null;

  const type = isExpense ? 'expense' : 'income';

  // Remove date-number patterns (e.g. "dia 1") and installment patterns before extracting amount
  const textForAmount = trimmed.replace(DATE_NUMBER_PATTERN, ' ').replace(INSTALLMENT_PATTERN, ' ');
  // Extract amount
  const amountMatch = textForAmount.match(AMOUNT_PATTERN);
  // Extract installments (before amount check so we can include in pending result)
  const installmentMatch = trimmed.match(INSTALLMENT_PATTERN);
  const installments = installmentMatch
    ? parseInt(installmentMatch[1] || installmentMatch[2], 10)
    : 1;

  // If no amount found, return a pending result asking for the value
  if (!amountMatch) {
    const category = matchCategory(trimmed, type);
    const description = extractDescription(trimmed);
    let date = format(new Date(), 'yyyy-MM-dd');
    if (/\bontem\b/i.test(trimmed)) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      date = format(yesterday, 'yyyy-MM-dd');
    } else {
      const dayMatch = trimmed.match(/\b(?:no\s+)?dia\s+(\d{1,2})\b/i);
      if (dayMatch) {
        const day = parseInt(dayMatch[1], 10);
        if (day >= 1 && day <= 31) {
          const d = new Date();
          d.setDate(day);
          if (d > new Date()) d.setMonth(d.getMonth() - 1);
          date = format(d, 'yyyy-MM-dd');
        }
      }
    }
    const installmentText = installments > 1 ? ` em ${installments}x` : '';
    const notes = category.matchedKeyword
      ? category.matchedKeyword.charAt(0).toUpperCase() + category.matchedKeyword.slice(1)
      : undefined;

    // Detect profile
    const PROFILE_NAMES_P: Record<string, string> = { 'monica': 'Mônica', 'mônica': 'Mônica', 'filipe': 'Filipe', 'felipe': 'Filipe' };
    let detectedProfileName: string | undefined;
    const lowerP = trimmed.toLowerCase();
    for (const [key, canonical] of Object.entries(PROFILE_NAMES_P)) {
      if (lowerP.includes(key)) { detectedProfileName = canonical; break; }
    }

    return {
      intent: 'need_amount',
      type,
      description,
      category: category.name,
      category_id: category.id,
      date,
      installments,
      message: `💰 Qual o valor ${type === 'expense' ? 'da compra' : 'da receita'}${installmentText}?`,
      notes,
      detectedProfileName,
    };
  }
  let rawAmount = amountMatch[1];
  // Brazilian format: dots are thousand separators, comma is decimal
  // e.g. "2.000" -> 2000, "1.500,50" -> 1500.50
  rawAmount = rawAmount.replace(/\./g, ''); // remove thousand separators
  rawAmount = rawAmount.replace(',', '.'); // convert decimal separator
  let amount = parseFloat(rawAmount);
  if (isNaN(amount) || amount <= 0) return null;
  // Handle "mil" / "k" multiplier (e.g., "2 mil" = 2000)
  // But if number is already >= 1000 (e.g. "3000 mil"), user likely meant just "3000" — skip multiplier
  if (amountMatch[2] && /^(mil|k)$/i.test(amountMatch[2]) && amount < 1000) {
    amount *= 1000;
  }
  if (isNaN(amount) || amount <= 0) return null;

  // installments already extracted above

  // Match category
  const category = matchCategory(trimmed, type);

  // Extract description
  const description = extractDescription(trimmed);

  // Extract date - support "hoje", "ontem", "dia X"
  let date = format(new Date(), 'yyyy-MM-dd');
  if (/\bontem\b/i.test(trimmed)) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    date = format(yesterday, 'yyyy-MM-dd');
  } else {
    const dayMatch = trimmed.match(/\b(?:no\s+)?dia\s+(\d{1,2})\b/i);
    if (dayMatch) {
      const day = parseInt(dayMatch[1], 10);
      if (day >= 1 && day <= 31) {
        const d = new Date();
        d.setDate(day);
        // If the day is in the future this month, use last month
        if (d > new Date()) {
          d.setMonth(d.getMonth() - 1);
        }
        date = format(d, 'yyyy-MM-dd');
      }
    }
  }

  // Detect profile name from text (e.g. "monica aqui", "filipe aqui", or just the name)
  const PROFILE_NAMES: Record<string, string> = {
    'monica': 'Mônica',
    'mônica': 'Mônica',
    'filipe': 'Filipe',
    'felipe': 'Filipe',
  };
  let detectedProfileName: string | undefined;
  const lower = trimmed.toLowerCase();
  for (const [key, canonical] of Object.entries(PROFILE_NAMES)) {
    if (lower.includes(key)) {
      detectedProfileName = canonical;
      break;
    }
  }


  // Build notes from matched keyword (capitalize first letter)
  const notes = category.matchedKeyword
    ? category.matchedKeyword.charAt(0).toUpperCase() + category.matchedKeyword.slice(1)
    : undefined;

  // No longer ask about installments — only parse if user explicitly mentions (e.g. "em 3x")

  const installmentText = installments > 1 ? ` (${installments}x de R$ ${(amount / installments).toFixed(2)})` : '';
  const message = `✅ Registrei ${type === 'expense' ? 'seu gasto' : 'sua receita'} de R$ ${amount.toFixed(2)} em ${category.name}!${installmentText}`;

  return {
    intent: 'add_transaction',
    type,
    amount,
    description,
    category: category.name,
    category_id: category.id,
    date,
    installments,
    message,
    notes,
    detectedProfileName,
  };
}
