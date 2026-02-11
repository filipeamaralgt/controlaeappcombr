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

export type DataTableKey = keyof UserData;

export interface ExportOptions {
  tables?: DataTableKey[];
  startDate?: string; // yyyy-MM-dd
  endDate?: string;   // yyyy-MM-dd
}

export async function fetchAllUserData(options?: ExportOptions): Promise<UserData> {
  const allTables: DataTableKey[] = ['transactions', 'categories', 'goals', 'debts', 'installments', 'budget_limits', 'recurring_payments', 'reminders'];
  const selected = options?.tables?.length ? options.tables : allTables;

  const empty: UserData = { transactions: [], categories: [], goals: [], debts: [], installments: [], budget_limits: [], recurring_payments: [], reminders: [] };

  const fetchers: Promise<void>[] = [];

  if (selected.includes('transactions')) {
    fetchers.push((async () => {
      let q = supabase.from('transactions').select('*').order('date', { ascending: false });
      if (options?.startDate) q = q.gte('date', options.startDate);
      if (options?.endDate) q = q.lte('date', options.endDate);
      const { data } = await q;
      empty.transactions = data || [];
    })());
  }

  const simpleTables: { key: DataTableKey; table: string }[] = [
    { key: 'categories', table: 'categories' },
    { key: 'goals', table: 'goals' },
    { key: 'debts', table: 'debts' },
    { key: 'installments', table: 'installments' },
    { key: 'budget_limits', table: 'budget_limits' },
    { key: 'recurring_payments', table: 'recurring_payments' },
    { key: 'reminders', table: 'reminders' },
  ];

  for (const st of simpleTables) {
    if (selected.includes(st.key)) {
      fetchers.push((async () => {
        const { data } = await supabase.from(st.table as any).select('*');
        (empty as any)[st.key] = data || [];
      })());
    }
  }

  await Promise.all(fetchers);
  return empty;
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

// ─── Helpers ────────────────────────────────────────
function fmtDate(val: any): string {
  if (!val) return '';
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    return format(d, 'dd/MM/yyyy');
  } catch {
    return String(val);
  }
}

function fmtCurrency(val: any): string {
  const n = Number(val);
  if (isNaN(n)) return '';
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function isDateField(key: string): boolean {
  return /date|created_at|updated_at|due_date|next_due_date|last_generated|last_notified/i.test(key);
}

function isMoneyField(key: string): boolean {
  return /amount|value|limit|bill|cost|paid|price|total|installment_value|max_amount|credit_limit|current_bill/i.test(key);
}

// ─── CSV (separador ; / UTF-8 BOM / datas dd/mm/yyyy) ──
function arrayToCSV(data: any[]): string {
  if (!data.length) return '';
  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers.map((h) => {
      const val = row[h];
      if (val === null || val === undefined) return '';
      if (isDateField(h)) return `"${fmtDate(val)}"`;
      if (isMoneyField(h)) return `"${fmtCurrency(val)}"`;
      const str = String(val);
      return `"${str.replace(/"/g, '""')}"`;
    }).join(';')
  );
  return [headers.join(';'), ...rows].join('\n');
}

export function exportCSV(data: UserData) {
  const sheets = Object.entries(data).filter(([, v]) => v.length > 0);
  sheets.forEach(([name, rows]) => {
    const csv = arrayToCSV(rows);
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, `${name}_${dateStamp()}.csv`);
  });
}

// ─── Excel (.xlsx) com formatação ───────────────────
const sheetConfig: Record<string, { label: string; columns: { key: string; header: string; width: number; type?: 'date' | 'money' | 'number' }[] }> = {
  transactions: {
    label: 'Transações',
    columns: [
      { key: 'date', header: 'Data', width: 14, type: 'date' },
      { key: 'description', header: 'Descrição', width: 30 },
      { key: 'type', header: 'Tipo', width: 10 },
      { key: 'amount', header: 'Valor (R$)', width: 16, type: 'money' },
      { key: 'installment_number', header: 'Parcela', width: 10, type: 'number' },
      { key: 'installment_total', header: 'Total Parcelas', width: 14, type: 'number' },
      { key: 'notes', header: 'Observações', width: 30 },
      { key: 'created_at', header: 'Criado em', width: 14, type: 'date' },
    ],
  },
  categories: {
    label: 'Categorias',
    columns: [
      { key: 'name', header: 'Nome', width: 20 },
      { key: 'type', header: 'Tipo', width: 12 },
      { key: 'color', header: 'Cor', width: 10 },
      { key: 'icon', header: 'Ícone', width: 10 },
      { key: 'is_default', header: 'Padrão', width: 10 },
    ],
  },
  budget_limits: {
    label: 'Limites',
    columns: [
      { key: 'category_id', header: 'ID Categoria', width: 36 },
      { key: 'max_amount', header: 'Limite (R$)', width: 16, type: 'money' },
      { key: 'is_active', header: 'Ativo', width: 10 },
      { key: 'created_at', header: 'Criado em', width: 14, type: 'date' },
    ],
  },
  debts: {
    label: 'Dívidas',
    columns: [
      { key: 'name', header: 'Nome', width: 24 },
      { key: 'total_amount', header: 'Valor Total (R$)', width: 18, type: 'money' },
      { key: 'paid_amount', header: 'Pago (R$)', width: 16, type: 'money' },
      { key: 'due_date', header: 'Vencimento', width: 14, type: 'date' },
      { key: 'interest_rate', header: 'Juros (%)', width: 12, type: 'number' },
      { key: 'priority', header: 'Prioridade', width: 12 },
      { key: 'is_paid', header: 'Pago', width: 8 },
      { key: 'notes', header: 'Observações', width: 30 },
    ],
  },
  installments: {
    label: 'Parcelamentos',
    columns: [
      { key: 'name', header: 'Nome', width: 24 },
      { key: 'total_amount', header: 'Valor Total (R$)', width: 18, type: 'money' },
      { key: 'installment_count', header: 'Parcelas', width: 12, type: 'number' },
      { key: 'installment_paid', header: 'Pagas', width: 10, type: 'number' },
      { key: 'installment_value', header: 'Valor Parcela (R$)', width: 18, type: 'money' },
      { key: 'next_due_date', header: 'Próximo Vencimento', width: 18, type: 'date' },
      { key: 'is_completed', header: 'Concluído', width: 12 },
      { key: 'notes', header: 'Observações', width: 30 },
    ],
  },
  goals: {
    label: 'Metas',
    columns: [
      { key: 'name', header: 'Nome', width: 24 },
      { key: 'target_amount', header: 'Meta (R$)', width: 16, type: 'money' },
      { key: 'current_amount', header: 'Atual (R$)', width: 16, type: 'money' },
      { key: 'category', header: 'Categoria', width: 16 },
      { key: 'goal_type', header: 'Tipo', width: 16 },
      { key: 'is_completed', header: 'Concluída', width: 12 },
    ],
  },
  recurring_payments: {
    label: 'Pagamentos Recorrentes',
    columns: [
      { key: 'description', header: 'Descrição', width: 24 },
      { key: 'amount', header: 'Valor (R$)', width: 16, type: 'money' },
      { key: 'type', header: 'Tipo', width: 10 },
      { key: 'day_of_month', header: 'Dia do Mês', width: 14, type: 'number' },
      { key: 'is_active', header: 'Ativo', width: 10 },
    ],
  },
  reminders: {
    label: 'Lembretes',
    columns: [
      { key: 'name', header: 'Nome', width: 24 },
      { key: 'amount', header: 'Valor (R$)', width: 16, type: 'money' },
      { key: 'next_due_date', header: 'Próximo Vencimento', width: 18, type: 'date' },
      { key: 'remind_days_before', header: 'Lembrar (dias)', width: 14, type: 'number' },
      { key: 'is_active', header: 'Ativo', width: 10 },
      { key: 'is_recurring', header: 'Recorrente', width: 12 },
    ],
  },
};

export function exportExcel(data: UserData) {
  const wb = XLSX.utils.book_new();

  const orderedKeys = ['transactions', 'categories', 'budget_limits', 'debts', 'installments', 'goals', 'recurring_payments', 'reminders'];

  for (const key of orderedKeys) {
    const rows = (data as any)[key] as any[];
    const config = sheetConfig[key];
    if (!config) continue;

    // Build AOA (array of arrays) for precise control
    const headers = config.columns.map((c) => c.header);
    const aoa: any[][] = [headers];

    for (const row of rows) {
      const r: any[] = config.columns.map((col) => {
        const val = row[col.key];
        if (val === null || val === undefined) return '';
        if (col.type === 'date') {
          try {
            const d = new Date(val);
            if (!isNaN(d.getTime())) return d;
          } catch { /* fallback */ }
          return String(val);
        }
        if (col.type === 'money' || col.type === 'number') {
          const n = Number(val);
          return isNaN(n) ? val : n;
        }
        if (typeof val === 'boolean') return val ? 'Sim' : 'Não';
        return String(val);
      });
      aoa.push(r);
    }

    const ws = XLSX.utils.aoa_to_sheet(aoa);

    // Column widths
    ws['!cols'] = config.columns.map((c) => ({ wch: c.width }));

    // Apply cell formats
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let C = range.s.c; C <= range.e.c; C++) {
      const col = config.columns[C];
      if (!col) continue;

      // Bold header
      const headerAddr = XLSX.utils.encode_cell({ r: 0, c: C });
      if (ws[headerAddr]) {
        if (!ws[headerAddr].s) ws[headerAddr].s = {};
        ws[headerAddr].s = { font: { bold: true }, fill: { fgColor: { rgb: 'E8E8E8' } } };
      }

      // Data cells
      for (let R = 1; R <= range.e.r; R++) {
        const addr = XLSX.utils.encode_cell({ r: R, c: C });
        const cell = ws[addr];
        if (!cell) continue;

        if (col.type === 'date' && cell.v instanceof Date) {
          cell.t = 'd';
          cell.z = 'DD/MM/YYYY';
        } else if (col.type === 'money' && typeof cell.v === 'number') {
          cell.t = 'n';
          cell.z = '#.##0,00';
        } else if (col.type === 'number' && typeof cell.v === 'number') {
          cell.t = 'n';
        }
      }
    }

    XLSX.utils.book_append_sheet(wb, ws, config.label.substring(0, 31));
  }

  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array', cellStyles: true, cellDates: true });
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  downloadBlob(blob, `financas_${dateStamp()}.xlsx`);
}

// ─── JSON Backup ────────────────────────────────────
export function exportJSON(data: UserData) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  downloadBlob(blob, `backup_completo_${dateStamp()}.json`);
}

// ─── PDF (relatório visual) ─────────────────────────
export function exportPDF(data: UserData) {
  const doc = new jsPDF();
  const now = format(new Date(), 'dd/MM/yyyy HH:mm');
  const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  const primaryColor: [number, number, number] = [99, 102, 241];

  // ── Page 1: Cover + Summary ──
  doc.setFontSize(22);
  doc.setTextColor(...primaryColor);
  doc.text('Relatório Financeiro', 14, 28);
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Gerado em: ${now}`, 14, 36);

  // Divider
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  doc.line(14, 40, 196, 40);

  // Summary calculations
  const totalExpenses = data.transactions
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + Number(t.amount), 0);
  const totalIncome = data.transactions
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + Number(t.amount), 0);
  const balance = totalIncome - totalExpenses;
  const totalDebts = data.debts.reduce((s, d) => s + Number(d.total_amount) - Number(d.paid_amount), 0);
  const activeGoals = data.goals.filter((g) => !g.is_completed);
  const totalGoals = activeGoals.reduce((s, g) => s + Number(g.target_amount) - Number(g.current_amount), 0);
  const activeInstallments = data.installments.filter((i) => !i.is_completed);

  doc.setFontSize(14);
  doc.setTextColor(40, 40, 40);
  doc.text('Resumo Geral', 14, 50);

  autoTable(doc, {
    startY: 56,
    head: [['Indicador', 'Valor']],
    body: [
      ['Total de Transações', String(data.transactions.length)],
      ['Receitas Totais', fmt(totalIncome)],
      ['Despesas Totais', fmt(totalExpenses)],
      ['Saldo', fmt(balance)],
      ['Dívidas Restantes', fmt(totalDebts)],
      ['Metas em Andamento', String(activeGoals.length)],
      ['Falta para Metas', fmt(totalGoals)],
      ['Categorias', String(data.categories.length)],
      ['Parcelas Ativas', String(activeInstallments.length)],
      ['Pagamentos Recorrentes', String(data.recurring_payments.filter((p) => p.is_active).length)],
      ['Lembretes Ativos', String(data.reminders.filter((r) => r.is_active).length)],
    ],
    theme: 'grid',
    headStyles: { fillColor: primaryColor, fontStyle: 'bold', fontSize: 11 },
    bodyStyles: { fontSize: 10 },
    alternateRowStyles: { fillColor: [245, 245, 250] },
    columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
  });

  // ── Mini bar chart: top 5 expense categories ──
  const catMap = new Map(data.categories.map((c: any) => [c.id, c.name]));
  const catTotals: Record<string, number> = {};
  data.transactions.filter((t) => t.type === 'expense').forEach((t) => {
    const name = catMap.get(t.category_id) || 'Sem categoria';
    catTotals[name] = (catTotals[name] || 0) + Number(t.amount);
  });
  const topCats = Object.entries(catTotals).sort((a, b) => b[1] - a[1]).slice(0, 5);

  if (topCats.length > 0) {
    const tableEndY = (doc as any).lastAutoTable?.finalY || 140;
    let y = tableEndY + 14;

    if (y > 240) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text('Top 5 Categorias de Despesa', 14, y);
    y += 8;

    const maxVal = topCats[0][1];
    const barMaxW = 120;

    topCats.forEach(([name, val], i) => {
      const barW = Math.max(4, (val / maxVal) * barMaxW);
      doc.setFillColor(...primaryColor);
      doc.rect(60, y + i * 12, barW, 8, 'F');
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      doc.text(name.substring(0, 18), 14, y + i * 12 + 6);
      doc.setTextColor(40, 40, 40);
      doc.text(fmt(val), 62 + barW, y + i * 12 + 6);
    });
  }

  // ── Page 2: Transactions table (last 50) ──
  const txSlice = data.transactions.slice(0, 50);
  if (txSlice.length) {
    doc.addPage();
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text('Últimas 50 Transações', 14, 20);

    autoTable(doc, {
      startY: 28,
      head: [['Data', 'Descrição', 'Tipo', 'Valor (R$)']],
      body: txSlice.map((t) => [
        fmtDate(t.date),
        t.description,
        t.type === 'expense' ? 'Despesa' : 'Receita',
        fmt(Number(t.amount)),
      ]),
      theme: 'striped',
      headStyles: { fillColor: primaryColor, fontStyle: 'bold', fontSize: 10 },
      bodyStyles: { fontSize: 9 },
      columnStyles: { 3: { halign: 'right' } },
    });
  }

  // ── Page 3: Debts ──
  if (data.debts.length) {
    doc.addPage();
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text('Dívidas', 14, 20);

    autoTable(doc, {
      startY: 28,
      head: [['Nome', 'Total (R$)', 'Pago (R$)', 'Restante (R$)', 'Vencimento', 'Prioridade']],
      body: data.debts.map((d) => [
        d.name,
        fmt(Number(d.total_amount)),
        fmt(Number(d.paid_amount)),
        fmt(Number(d.total_amount) - Number(d.paid_amount)),
        fmtDate(d.due_date),
        d.priority,
      ]),
      theme: 'striped',
      headStyles: { fillColor: primaryColor, fontStyle: 'bold', fontSize: 10 },
      bodyStyles: { fontSize: 9 },
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
    });
  }

  // ── Page 4: Goals ──
  if (data.goals.length) {
    doc.addPage();
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text('Metas', 14, 20);

    autoTable(doc, {
      startY: 28,
      head: [['Nome', 'Meta (R$)', 'Atual (R$)', 'Progresso', 'Tipo', 'Status']],
      body: data.goals.map((g) => {
        const pct = Number(g.target_amount) > 0
          ? Math.round((Number(g.current_amount) / Number(g.target_amount)) * 100)
          : 0;
        return [
          g.name,
          fmt(Number(g.target_amount)),
          fmt(Number(g.current_amount)),
          `${pct}%`,
          g.goal_type,
          g.is_completed ? 'Concluída' : 'Em andamento',
        ];
      }),
      theme: 'striped',
      headStyles: { fillColor: primaryColor, fontStyle: 'bold', fontSize: 10 },
      bodyStyles: { fontSize: 9 },
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'center' } },
    });
  }

  // Footer on all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Página ${i} de ${pageCount}`, 105, 290, { align: 'center' });
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

export interface ParsedSheet {
  name: string;
  rows: Record<string, string>[];
  headers: string[];
}

export function parseImportFile(file: File): Promise<ParsedSheet[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        
        const sheets: ParsedSheet[] = wb.SheetNames.map((sheetName) => {
          const sheet = wb.Sheets[sheetName];
          
          let json = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { raw: false });
          let headers = json.length ? Object.keys(json[0]) : [];
          
          const hasEmptyHeaders = headers.filter(h => h.startsWith('__EMPTY')).length > headers.length / 2;
          const hasSingleRealHeader = headers.filter(h => !h.startsWith('__EMPTY')).length <= 1;
          
          if ((hasEmptyHeaders || hasSingleRealHeader) && json.length > 0) {
            const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
            for (let startRow = 1; startRow <= Math.min(5, range.e.r); startRow++) {
              const testJson = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { 
                raw: false, 
                range: startRow 
              });
              if (!testJson.length) continue;
              const testHeaders = Object.keys(testJson[0]);
              const emptyCount = testHeaders.filter(h => h.startsWith('__EMPTY')).length;
              
              if (emptyCount < testHeaders.length / 2) {
                json = testJson;
                headers = testHeaders;
                break;
              }
            }
          }
          
          return { name: sheetName, rows: json, headers };
        }).filter(s => s.rows.length > 0);
        
        resolve(sheets);
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

  const datePatterns = ['data', 'date', 'dt', 'dia', 'fecha', 'created', 'created_at', 'transaction_date', 'trans_date', 'payment_date', 'posting_date', 'book_date', 'datum', 'data e hora'];
  const descPatterns = ['descricao', 'descricão', 'descrição', 'description', 'desc', 'nome', 'titulo', 'title', 'name', 'memo', 'note', 'notes', 'detail', 'details', 'payee', 'merchant', 'label', 'narration', 'particular', 'remark', 'remarks', 'transaction', 'reference', 'comentario', 'comment', 'comments', 'observacao', 'obs', 'etiqueta', 'etiquetas', 'tag', 'tags'];
  const amountPatterns = ['valor', 'amount', 'value', 'quantia', 'preco', 'preço', 'price', 'total', 'sum', 'money', 'cost', 'debit', 'credit', 'balance', 'importe', 'monto', 'betrag', 'montant', 'valor na moeda padrao', 'valor na moeda da conta'];
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
