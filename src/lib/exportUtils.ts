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
  spending_profiles: any[];
}

export type DataTableKey = keyof UserData;

export interface ExportOptions {
  tables?: DataTableKey[];
  startDate?: string; // yyyy-MM-dd
  endDate?: string;   // yyyy-MM-dd
}

export async function fetchAllUserData(options?: ExportOptions): Promise<UserData> {
  const allTables: DataTableKey[] = ['transactions', 'categories', 'goals', 'debts', 'installments', 'budget_limits', 'recurring_payments', 'reminders', 'spending_profiles'];
  const selected = options?.tables?.length ? options.tables : allTables;

  const empty: UserData = { transactions: [], categories: [], goals: [], debts: [], installments: [], budget_limits: [], recurring_payments: [], reminders: [], spending_profiles: [] };

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
    { key: 'spending_profiles', table: 'spending_profiles' },
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

export type ExportBuiltFile = {
  blob: Blob;
  filename: string;
  mimeType: string;
};

export type DownloadBlobOptions = {
  /**
   * Tenta abrir em nova aba (útil quando o app está em iframe).
   * Dica: para evitar popup-blocker após `await`, pré-abra uma janela no clique e passe `preOpenedWindow`.
   */
  openInNewTab?: boolean;
  /** Janela pré-aberta de forma síncrona (no clique do usuário). */
  preOpenedWindow?: Window | null;
  /** Tempo (ms) até revogar o object URL. */
  revokeAfterMs?: number;
};

export function downloadBlob(blob: Blob, filename: string, options?: DownloadBlobOptions) {
  const url = URL.createObjectURL(blob);
  const revokeAfterMs = options?.revokeAfterMs ?? 60_000;

  const revoke = () => {
    try {
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  };

  const pre = options?.preOpenedWindow && !options.preOpenedWindow.closed ? options.preOpenedWindow : null;
  if (pre) {
    try {
      pre.location.href = url;
      setTimeout(revoke, revokeAfterMs);
      return;
    } catch {
      // fall through
    }
  }

  if (options?.openInNewTab) {
    const opened = window.open(url, '_blank');
    if (opened) {
      setTimeout(revoke, revokeAfterMs);
      return;
    }
  }

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.target = '_blank';
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  setTimeout(revoke, revokeAfterMs);
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

function buildSheet(wb: XLSX.WorkBook, title: string, sheetName: string, headers: string[], widths: number[], rows: any[][]) {
  // Title row + blank row + header row + data
  const aoa: any[][] = [[title], [], headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Merge title across all columns
  ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } }];
  ws['!cols'] = widths.map((w) => ({ wch: w }));

  // Style title (row 0)
  const titleAddr = XLSX.utils.encode_cell({ r: 0, c: 0 });
  if (ws[titleAddr]) {
    ws[titleAddr].s = { font: { bold: true, sz: 13 }, alignment: { horizontal: 'center' } };
  }

  // Style header row (row 2)
  for (let C = 0; C < headers.length; C++) {
    const addr = XLSX.utils.encode_cell({ r: 2, c: C });
    if (ws[addr]) {
      ws[addr].s = { font: { bold: true }, fill: { fgColor: { rgb: 'E8E8E8' } }, border: { bottom: { style: 'thin' } } };
    }
  }

  XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31));
}

export function buildExcelFile(data: UserData): ExportBuiltFile {
  const wb = XLSX.utils.book_new();

  // Build lookups
  const catMap = new Map(data.categories.map((c: any) => [c.id, c.name]));
  const profileMap = new Map(data.spending_profiles.map((p: any) => [p.id, p.name]));

  const expenses = data.transactions.filter((t: any) => t.type === 'expense');
  const incomes = data.transactions.filter((t: any) => t.type === 'income');

  // ── Lista de despesas ──
  if (expenses.length) {
    const headers = ['Data', 'Categoria', 'Valor', 'Comentário'];
    const widths = [14, 22, 14, 30];
    const rows = expenses.map((t: any) => [
      fmtDate(t.date),
      catMap.get(t.category_id) || '',
      fmtCurrency(t.amount),
      t.notes || t.description || '',
    ]);
    buildSheet(wb, 'Lista de despesas', 'Lista de despesas', headers, widths, rows);
  }

  // ── Lista de renda ──
  if (incomes.length) {
    const headers = ['Data e hora', 'Categoria', 'Conta', 'Valor', 'Comentário'];
    const widths = [14, 16, 16, 14, 30];
    const rows = incomes.map((t: any) => [
      fmtDate(t.date),
      catMap.get(t.category_id) || '',
      profileMap.get(t.profile_id) || 'Principal',
      fmtCurrency(t.amount),
      t.notes || t.description || '',
    ]);
    buildSheet(wb, 'Lista de renda', 'Lista de renda', headers, widths, rows);
  }

  // ── Other data sheets (simple format) ──
  const otherSheets: { key: string; label: string; columns: { key: string; header: string; width: number }[] }[] = [
    {
      key: 'debts',
      label: 'Dívidas',
      columns: [
        { key: 'name', header: 'Nome', width: 24 },
        { key: 'total_amount', header: 'Valor Total', width: 16 },
        { key: 'paid_amount', header: 'Pago', width: 14 },
        { key: 'due_date', header: 'Vencimento', width: 14 },
        { key: 'priority', header: 'Prioridade', width: 12 },
      ],
    },
    {
      key: 'installments',
      label: 'Parcelamentos',
      columns: [
        { key: 'name', header: 'Nome', width: 24 },
        { key: 'total_amount', header: 'Valor Total', width: 16 },
        { key: 'installment_count', header: 'Parcelas', width: 12 },
        { key: 'installment_paid', header: 'Pagas', width: 10 },
        { key: 'next_due_date', header: 'Próx. Vencimento', width: 16 },
      ],
    },
    {
      key: 'goals',
      label: 'Metas',
      columns: [
        { key: 'name', header: 'Nome', width: 24 },
        { key: 'target_amount', header: 'Meta', width: 14 },
        { key: 'current_amount', header: 'Atual', width: 14 },
        { key: 'goal_type', header: 'Tipo', width: 14 },
      ],
    },
  ];

  for (const sheet of otherSheets) {
    const tableData = (data as any)[sheet.key] as any[];
    if (!tableData?.length) continue;
    const headers = sheet.columns.map((c) => c.header);
    const widths = sheet.columns.map((c) => c.width);
    const rows = tableData.map((row: any) =>
      sheet.columns.map((col) => {
        const val = row[col.key];
        if (val === null || val === undefined) return '';
        if (isDateField(col.key)) return fmtDate(val);
        if (isMoneyField(col.key)) return fmtCurrency(Number(val));
        if (typeof val === 'boolean') return val ? 'Sim' : 'Não';
        return String(val);
      })
    );
    buildSheet(wb, sheet.label, sheet.label, headers, widths, rows);
  }

  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array', cellStyles: true });
  const mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  const blob = new Blob([buf], { type: mimeType });

  return {
    blob,
    filename: `financas_${dateStamp()}.xlsx`,
    mimeType,
  };
}

export function exportExcel(data: UserData, downloadOptions?: DownloadBlobOptions) {
  const file = buildExcelFile(data);
  downloadBlob(file.blob, file.filename, downloadOptions);
}

// ─── JSON Backup ────────────────────────────────────
export function exportJSON(data: UserData) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  downloadBlob(blob, `backup_completo_${dateStamp()}.json`);
}

// ─── PDF (relatório visual) ─────────────────────────
export function buildPdfFile(data: UserData): ExportBuiltFile {
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
  data.transactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      const name = catMap.get(t.category_id) || 'Sem categoria';
      catTotals[name] = (catTotals[name] || 0) + Number(t.amount);
    });
  const topCats = Object.entries(catTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

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

  // ── Transactions table (all) ──
  if (data.transactions.length) {
    doc.addPage();
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text(`Todas as Transações (${data.transactions.length})`, 14, 20);

    autoTable(doc, {
      startY: 28,
      head: [['Data', 'Descrição', 'Tipo', 'Valor (R$)']],
      body: data.transactions.map((t) => [fmtDate(t.date), t.description, t.type === 'expense' ? 'Despesa' : 'Receita', fmt(Number(t.amount))]),
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
        const pct = Number(g.target_amount) > 0 ? Math.round((Number(g.current_amount) / Number(g.target_amount)) * 100) : 0;
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

  const blob = doc.output('blob') as Blob;
  return {
    blob,
    filename: `relatorio_${dateStamp()}.pdf`,
    mimeType: 'application/pdf',
  };
}

export function exportPDF(data: UserData, downloadOptions?: DownloadBlobOptions) {
  const file = buildPdfFile(data);
  downloadBlob(file.blob, file.filename, downloadOptions);
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
