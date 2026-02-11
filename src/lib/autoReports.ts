import { supabase } from '@/integrations/supabase/client';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CategorySummary {
  name: string;
  total: number;
}

async function fetchTransactions(userId: string, from: string, to: string) {
  const { data } = await supabase
    .from('transactions')
    .select('amount, type, description, category_id, categories(name)')
    .eq('user_id', userId)
    .gte('date', from)
    .lte('date', to);
  return data || [];
}

function groupByCategory(transactions: any[], type: 'expense' | 'income'): CategorySummary[] {
  const map: Record<string, number> = {};
  transactions
    .filter((t: any) => t.type === type)
    .forEach((t: any) => {
      const name = (t.categories as any)?.name || 'Outros';
      map[name] = (map[name] || 0) + Number(t.amount);
    });
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .map(([name, total]) => ({ name, total }));
}

function formatCurrency(value: number): string {
  return `R$ ${value.toFixed(2).replace('.', ',')}`;
}

export async function generateWeeklyReport(userId: string): Promise<string> {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const prevWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
  const prevWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });

  const [current, previous] = await Promise.all([
    fetchTransactions(userId, format(weekStart, 'yyyy-MM-dd'), format(weekEnd, 'yyyy-MM-dd')),
    fetchTransactions(userId, format(prevWeekStart, 'yyyy-MM-dd'), format(prevWeekEnd, 'yyyy-MM-dd')),
  ]);

  const curExpense = current.filter((t: any) => t.type === 'expense').reduce((s: number, t: any) => s + Number(t.amount), 0);
  const curIncome = current.filter((t: any) => t.type === 'income').reduce((s: number, t: any) => s + Number(t.amount), 0);
  const prevExpense = previous.filter((t: any) => t.type === 'expense').reduce((s: number, t: any) => s + Number(t.amount), 0);
  const prevIncome = previous.filter((t: any) => t.type === 'income').reduce((s: number, t: any) => s + Number(t.amount), 0);

  const balance = curIncome - curExpense;
  const categories = groupByCategory(current, 'expense');
  const topCategories = categories.slice(0, 5);

  const expenseDiff = prevExpense > 0 ? ((curExpense - prevExpense) / prevExpense * 100).toFixed(0) : null;
  const expenseTrend = expenseDiff
    ? Number(expenseDiff) > 0
      ? `📈 Gastos aumentaram ${expenseDiff}% vs semana anterior`
      : `📉 Gastos reduziram ${Math.abs(Number(expenseDiff))}% vs semana anterior`
    : '';

  const periodLabel = `${format(weekStart, "dd/MM", { locale: ptBR })} a ${format(weekEnd, "dd/MM", { locale: ptBR })}`;

  return `📊 **Relatório Semanal** (${periodLabel})

💰 **Receitas:** ${formatCurrency(curIncome)}
💸 **Gastos:** ${formatCurrency(curExpense)}
⚖️ **Saldo:** ${formatCurrency(balance)}
📋 **Transações:** ${current.length}

🏷️ **Top categorias de gastos:**
${topCategories.length > 0
    ? topCategories.map((c, i) => `${i + 1}. ${c.name}: ${formatCurrency(c.total)}`).join('\n')
    : 'Nenhum gasto registrado.'}

${expenseTrend}

${balance >= 0
    ? '✅ Semana positiva! Continue assim! 💪'
    : '⚠️ Gastos superaram as receitas. Fique atento esta semana!'}`;
}

export async function generateMonthlyReport(userId: string): Promise<string> {
  const now = new Date();
  const prevMonth = subMonths(now, 1);
  const mStart = format(startOfMonth(prevMonth), 'yyyy-MM-dd');
  const mEnd = format(endOfMonth(prevMonth), 'yyyy-MM-dd');
  const prevPrevMonth = subMonths(now, 2);
  const ppStart = format(startOfMonth(prevPrevMonth), 'yyyy-MM-dd');
  const ppEnd = format(endOfMonth(prevPrevMonth), 'yyyy-MM-dd');

  const [current, previous] = await Promise.all([
    fetchTransactions(userId, mStart, mEnd),
    fetchTransactions(userId, ppStart, ppEnd),
  ]);

  const curExpense = current.filter((t: any) => t.type === 'expense').reduce((s: number, t: any) => s + Number(t.amount), 0);
  const curIncome = current.filter((t: any) => t.type === 'income').reduce((s: number, t: any) => s + Number(t.amount), 0);
  const prevExpense = previous.filter((t: any) => t.type === 'expense').reduce((s: number, t: any) => s + Number(t.amount), 0);

  const balance = curIncome - curExpense;
  const savingsRate = curIncome > 0 ? ((balance / curIncome) * 100).toFixed(0) : '0';
  const categories = groupByCategory(current, 'expense');
  const incomeCategories = groupByCategory(current, 'income');

  const expenseDiff = prevExpense > 0 ? ((curExpense - prevExpense) / prevExpense * 100).toFixed(0) : null;
  const expenseTrend = expenseDiff
    ? Number(expenseDiff) > 0
      ? `📈 Gastos aumentaram ${expenseDiff}% vs mês anterior`
      : `📉 Gastos reduziram ${Math.abs(Number(expenseDiff))}% vs mês anterior`
    : '';

  const monthLabel = format(prevMonth, "MMMM 'de' yyyy", { locale: ptBR });

  return `📊 **Relatório Mensal** — ${monthLabel}

💰 **Receitas totais:** ${formatCurrency(curIncome)}
${incomeCategories.map(c => `  • ${c.name}: ${formatCurrency(c.total)}`).join('\n')}

💸 **Gastos totais:** ${formatCurrency(curExpense)}
${categories.map((c, i) => `  ${i + 1}. ${c.name}: ${formatCurrency(c.total)} (${curExpense > 0 ? ((c.total / curExpense) * 100).toFixed(0) : 0}%)`).join('\n')}

⚖️ **Saldo do mês:** ${formatCurrency(balance)}
💹 **Taxa de poupança:** ${savingsRate}%
📋 **Total de transações:** ${current.length}

${expenseTrend}

${Number(savingsRate) >= 20
    ? '🌟 Excelente! Você poupou mais de 20% da renda!'
    : Number(savingsRate) >= 10
      ? '👍 Bom trabalho! Tente aumentar a poupança para 20%.'
      : Number(savingsRate) > 0
        ? '💡 Tente economizar pelo menos 10% da renda mensal.'
        : '⚠️ Mês negativo. Revise seus gastos para o próximo mês.'}`;
}

export function generateWeeklyPreview(): string {
  return `📊 **Relatório Semanal** (exemplo)

💰 **Receitas:** R$ 2.500,00
💸 **Gastos:** R$ 1.200,00
⚖️ **Saldo:** R$ 1.300,00
📋 **Transações:** 15

🏷️ **Top categorias de gastos:**
1. Alimentação: R$ 450,00
2. Transporte: R$ 280,00
3. Casa: R$ 200,00
4. Lazer: R$ 170,00
5. Saúde: R$ 100,00

📉 Gastos reduziram 12% vs semana anterior

✅ Semana positiva! Continue assim! 💪`;
}

export function generateMonthlyPreview(): string {
  return `📊 **Relatório Mensal** — janeiro de 2026

💰 **Receitas totais:** R$ 5.000,00
  • Salário: R$ 4.000,00
  • Freelance: R$ 1.000,00

💸 **Gastos totais:** R$ 3.200,00
  1. Alimentação: R$ 800,00 (25%)
  2. Casa: R$ 700,00 (22%)
  3. Transporte: R$ 500,00 (16%)
  4. Lazer: R$ 400,00 (13%)
  5. Saúde: R$ 300,00 (9%)
  6. Roupas: R$ 250,00 (8%)
  7. Outros: R$ 250,00 (8%)

⚖️ **Saldo do mês:** R$ 1.800,00
💹 **Taxa de poupança:** 36%
📋 **Total de transações:** 42

📉 Gastos reduziram 8% vs mês anterior

🌟 Excelente! Você poupou mais de 20% da renda!`;
}

/**
 * Check if auto reports should be generated and return the report content.
 * Uses localStorage to avoid duplicate reports.
 */
export async function checkAndGenerateReports(userId: string): Promise<{ type: 'weekly' | 'monthly'; content: string } | null> {
  const now = new Date();
  const today = format(now, 'yyyy-MM-dd');

  // Check monthly first (day 1)
  if (now.getDate() === 1) {
    const monthlyEnabled = localStorage.getItem('maya-monthly-report') === 'true';
    const lastMonthlyKey = 'maya-monthly-report-last';
    const lastMonthly = localStorage.getItem(lastMonthlyKey);

    if (monthlyEnabled && lastMonthly !== today) {
      localStorage.setItem(lastMonthlyKey, today);
      const content = await generateMonthlyReport(userId);
      return { type: 'monthly', content };
    }
  }

  // Check weekly (Sunday = 0)
  if (now.getDay() === 0) {
    const weeklyEnabled = localStorage.getItem('maya-weekly-report') === 'true';
    const lastWeeklyKey = 'maya-weekly-report-last';
    const lastWeekly = localStorage.getItem(lastWeeklyKey);

    if (weeklyEnabled && lastWeekly !== today) {
      localStorage.setItem(lastWeeklyKey, today);
      const content = await generateWeeklyReport(userId);
      return { type: 'weekly', content };
    }
  }

  return null;
}
