import { format } from 'date-fns';

// Category mapping with keywords for local matching
const CATEGORIES_MAP = {
  expense: [
    { name: 'Alimentação', id: '1be21c44-4fb2-44af-a8ee-4ace5928e29d', keywords: ['comida', 'marmita', 'almoço', 'almoco', 'jantar', 'café', 'cafe', 'lanche', 'restaurante', 'supermercado', 'mercado', 'padaria', 'pizza', 'hambúrguer', 'hamburguer', 'sushi', 'ifood', 'alimentação', 'alimentacao', 'comer', 'shake', 'milk shake', 'milkshake', 'açaí', 'acai', 'sorvete', 'doce', 'bolo', 'salgado', 'pastel', 'coxinha', 'esfiha', 'yakisoba', 'churrasco', 'fruta', 'verdura', 'feira', 'bolacha', 'biscoito', 'chocolate', 'pão', 'pao', 'leite', 'ovo', 'carne', 'frango', 'peixe', 'bebida', 'suco', 'refrigerante', 'cerveja', 'água de coco'] },
    { name: 'Transporte', id: 'acb6dae2-7132-4df8-826f-caf2b89ec7f1', keywords: ['uber', 'ônibus', 'onibus', 'metrô', 'metro', 'gasolina', 'combustível', 'combustivel', 'estacionamento', 'táxi', 'taxi', '99', 'transporte', 'pedágio', 'pedagio'] },
    { name: 'Lazer', id: '0cc300a3-960c-4bb6-a8e3-002f58b80fbc', keywords: ['cinema', 'bar', 'festa', 'jogo', 'teatro', 'show', 'lazer', 'diversão', 'diversao', 'netflix', 'spotify', 'streaming'] },
    { name: 'Educação', id: '12d69128-1930-48e4-b604-d4bf9a07e38b', keywords: ['livro', 'curso', 'escola', 'faculdade', 'educação', 'educacao', 'apostila', 'material escolar'] },
    { name: 'Saúde', id: '01a0f760-f455-4a99-883c-f775175bfa26', keywords: ['remédio', 'remedio', 'médico', 'medico', 'farmácia', 'farmacia', 'consulta', 'exame', 'hospital', 'dentista', 'saúde', 'saude'] },
    { name: 'Casa', id: 'c57693e3-fd6a-4cf8-abec-a28dbe6428f6', keywords: ['aluguel', 'luz', 'água', 'agua', 'internet', 'gás', 'gas', 'condomínio', 'condominio', 'casa', 'iptu'] },
    { name: 'Roupas', id: 'a9598715-9fec-457f-9d1c-7bd5c100ce98', keywords: ['roupa', 'roupas', 'camisa', 'calça', 'calca', 'tênis', 'tenis', 'sapato', 'vestido', 'blusa', 'loja'] },
    { name: 'Academia', id: '1735de14-104a-4cd5-8c5d-04e5d134ed3b', keywords: ['academia', 'musculação', 'musculacao', 'treino'] },
    { name: 'Viagens', id: 'a27f3a6d-bfa7-49c4-9109-b39643e1b2cc', keywords: ['viagem', 'viagens', 'hotel', 'passagem', 'aeroporto', 'voo'] },
    { name: 'Produtos de beleza', id: '17ba730e-4039-44a4-ab3c-923624dfe69f', keywords: ['maquiagem', 'beleza', 'cosmético', 'cosmetico', 'creme', 'perfume', 'shampoo'] },
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
const EXPENSE_TRIGGERS = /\b(gastei|gastamos|paguei|pagamos|comprei|compramos|pagar|gastar|comprar|gasto|compra|despesa)\b/i;
// Income trigger words  
const INCOME_TRIGGERS = /\b(recebi|recebemos|ganhei|ganhamos|entrou|receber|ganhar|renda|receita|salário|salario)\b/i;
// Installment patterns
const INSTALLMENT_PATTERN = /\b(?:em\s+)?(\d+)\s*(?:x|vezes|parcelas?)\b|\bparcelad[oa]\s+(?:em\s+)?(\d+)/i;
// Amount patterns - handles "50", "50 reais", "R$ 50", "R$50", "50,00", "50.00"
const AMOUNT_PATTERN = /(?:R\$\s*)?(\d+(?:[.,]\d{1,2})?)\s*(mil|k)?\s*(?:reais|conto|pila)?/i;

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
  detectedProfileName?: string;
}

function matchCategory(text: string, type: 'expense' | 'income'): { name: string; id: string } {
  const lower = text.toLowerCase();
  const categories = type === 'expense' ? CATEGORIES_MAP.expense : CATEGORIES_MAP.income;

  for (const cat of categories) {
    for (const kw of cat.keywords) {
      if (lower.includes(kw)) {
        return { name: cat.name, id: cat.id };
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
export function tryParseLocally(text: string): LocalParseResult | null {
  const trimmed = text.trim();

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

  // Extract amount
  const amountMatch = trimmed.match(AMOUNT_PATTERN);
  if (!amountMatch) return null;
  const rawAmount = amountMatch[1].replace(',', '.');
  let amount = parseFloat(rawAmount);
  if (isNaN(amount) || amount <= 0) return null;
  // Handle "mil" / "k" multiplier (e.g., "2 mil" = 2000)
  if (amountMatch[2] && /^(mil|k)$/i.test(amountMatch[2])) {
    amount *= 1000;
  }
  if (isNaN(amount) || amount <= 0) return null;

  // Extract installments
  const installmentMatch = trimmed.match(INSTALLMENT_PATTERN);
  const installments = installmentMatch
    ? parseInt(installmentMatch[1] || installmentMatch[2], 10)
    : 1;

  // Match category
  const category = matchCategory(trimmed, type);

  // Extract description
  const description = extractDescription(trimmed);

  // Extract date - support "hoje", "ontem"
  let date = format(new Date(), 'yyyy-MM-dd');
  if (/\bontem\b/i.test(trimmed)) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    date = format(yesterday, 'yyyy-MM-dd');
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

  const typeLabel = type === 'expense' ? 'gasto' : 'receita';
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
    detectedProfileName,
  };
}
