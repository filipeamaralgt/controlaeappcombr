import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

export interface UserData {
  transactions: any[];
  categories: any[];
  goals: any[];
  debts: any[];
  installments: any[];
  budget_limits: any[];
  recurring_payments: any[];
  reminders: any[];
}

export async function fetchAllUserData(): Promise<UserData> {
  const [transactions, categories, goals, debts, installments, budgetLimits, recurringPayments, reminders] =
    await Promise.all([
      supabase.from('transactions').select('*').order('date', { ascending: false }),
      supabase.from('categories').select('*'),
      supabase.from('goals').select('*'),
      supabase.from('debts').select('*'),
      supabase.from('installments').select('*'),
      supabase.from('budget_limits').select('*'),
      supabase.from('recurring_payments').select('*'),
      supabase.from('reminders').select('*'),
    ]);

  return {
    transactions: transactions.data || [],
    categories: categories.data || [],
    goals: goals.data || [],
    debts: debts.data || [],
    installments: installments.data || [],
    budget_limits: budgetLimits.data || [],
    recurring_payments: recurringPayments.data || [],
    reminders: reminders.data || [],
  };
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const dateStamp = () => format(new Date(), 'yyyy-MM-dd');

// ─── CSV ────────────────────────────────────────────
function arrayToCSV(data: any[]): string {
  if (!data.length) return '';
  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers.map((h) => {
      const val = row[h];
      const str = val === null || val === undefined ? '' : String(val);
      return `"${str.replace(/"/g, '""')}"`;
    }).join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}

export function exportCSV(data: UserData) {
  const sheets = Object.entries(data).filter(([, v]) => v.length > 0);
  sheets.forEach(([name, rows]) => {
    const csv = arrayToCSV(rows);
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, `${name}_${dateStamp()}.csv`);
  });
}

// ─── Excel ──────────────────────────────────────────
export function exportExcel(data: UserData) {
  const wb = XLSX.utils.book_new();
  const nameMap: Record<string, string> = {
    transactions: 'Transações',
    categories: 'Categorias',
    goals: 'Metas',
    debts: 'Dívidas',
    installments: 'Parcelas',
    budget_limits: 'Limites',
    recurring_payments: 'Pagamentos Recorrentes',
    reminders: 'Lembretes',
  };

  Object.entries(data).forEach(([key, rows]) => {
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, nameMap[key] || key);
  });

  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  downloadBlob(blob, `financas_${dateStamp()}.xlsx`);
}

// ─── JSON Backup ────────────────────────────────────
export function exportJSON(data: UserData) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  downloadBlob(blob, `backup_completo_${dateStamp()}.json`);
}

// ─── PDF ────────────────────────────────────────────
export function exportPDF(data: UserData) {
  const doc = new jsPDF();
  const now = format(new Date(), 'dd/MM/yyyy HH:mm');

  doc.setFontSize(18);
  doc.text('Relatório Financeiro', 14, 20);
  doc.setFontSize(10);
  doc.text(`Gerado em: ${now}`, 14, 28);

  let y = 36;

  // Summary
  const totalExpenses = data.transactions
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + Number(t.amount), 0);
  const totalIncome = data.transactions
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + Number(t.amount), 0);
  const totalDebts = data.debts.reduce((s, d) => s + Number(d.total_amount) - Number(d.paid_amount), 0);
  const totalGoals = data.goals.reduce((s, g) => s + Number(g.target_amount) - Number(g.current_amount), 0);

  doc.setFontSize(12);
  doc.text('Resumo Geral', 14, y);
  y += 8;

  const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  autoTable(doc, {
    startY: y,
    head: [['Indicador', 'Valor']],
    body: [
      ['Total de Transações', String(data.transactions.length)],
      ['Receitas Totais', fmt(totalIncome)],
      ['Despesas Totais', fmt(totalExpenses)],
      ['Saldo', fmt(totalIncome - totalExpenses)],
      ['Dívidas Restantes', fmt(totalDebts)],
      ['Metas em andamento', String(data.goals.filter((g) => !g.is_completed).length)],
      ['Falta para metas', fmt(totalGoals)],
      ['Categorias', String(data.categories.length)],
      ['Parcelas Ativas', String(data.installments.filter((i) => !i.is_completed).length)],
    ],
    theme: 'grid',
    headStyles: { fillColor: [99, 102, 241] },
  });

  // Transactions table (last 50)
  const txSlice = data.transactions.slice(0, 50);
  if (txSlice.length) {
    const finalY = (doc as any).lastAutoTable?.finalY || y + 40;
    doc.addPage();
    doc.setFontSize(12);
    doc.text('Últimas 50 Transações', 14, 20);

    autoTable(doc, {
      startY: 28,
      head: [['Data', 'Descrição', 'Tipo', 'Valor']],
      body: txSlice.map((t) => [
        format(new Date(t.date), 'dd/MM/yyyy'),
        t.description,
        t.type === 'expense' ? 'Despesa' : 'Receita',
        fmt(Number(t.amount)),
      ]),
      theme: 'striped',
      headStyles: { fillColor: [99, 102, 241] },
    });
  }

  doc.save(`relatorio_${dateStamp()}.pdf`);
}

// ─── Import helpers ─────────────────────────────────
export interface ImportRow {
  date: string;
  description: string;
  amount: number;
  type: 'expense' | 'income';
  category: string;
}

export function parseImportFile(file: File): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const firstSheet = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<Record<string, string>>(firstSheet, { raw: false });
        resolve(json);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

export function detectColumnMapping(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  const lower = headers.map((h) => h.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim());

  const datePatterns = ['data', 'date', 'dt', 'dia', 'fecha', 'created', 'created_at', 'transaction_date', 'trans_date', 'payment_date', 'posting_date', 'book_date', 'datum'];
  const descPatterns = ['descricao', 'descricão', 'descrição', 'description', 'desc', 'nome', 'titulo', 'title', 'name', 'memo', 'note', 'notes', 'detail', 'details', 'payee', 'merchant', 'label', 'narration', 'particular', 'remark', 'remarks', 'transaction', 'reference'];
  const amountPatterns = ['valor', 'amount', 'value', 'quantia', 'preco', 'preço', 'price', 'total', 'sum', 'money', 'cost', 'debit', 'credit', 'balance', 'importe', 'monto', 'betrag', 'montant'];
  const typePatterns = ['tipo', 'type', 'categoria_tipo', 'transaction_type', 'kind', 'movement', 'direction', 'income_expense', 'income/expense', 'receita_despesa'];
  const catPatterns = ['categoria', 'category', 'cat', 'category_name', 'group', 'tag', 'tags', 'classification', 'class', 'budget', 'account', 'conta', 'subcategory', 'sub_category'];

  const find = (patterns: string[]) => {
    const idx = lower.findIndex((h) => patterns.some((p) => h === p || h.includes(p)));
    return idx >= 0 ? headers[idx] : '';
  };

  mapping.date = find(datePatterns);
  mapping.description = find(descPatterns);
  mapping.amount = find(amountPatterns);
  mapping.type = find(typePatterns);
  mapping.category = find(catPatterns);

  return mapping;
}
