import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Sparkles, Loader2, Bot, User, ImagePlus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  imagePreview?: string;
  transaction?: {
    type: 'expense' | 'income';
    amount: number;
    description: string;
    category: string;
  };
}

type AIMessageContent =
  | string
  | Array<
      | { type: 'text'; text: string }
      | { type: 'image_url'; image_url: { url: string } }
    >;

interface AIMessage {
  role: 'user' | 'assistant';
  content: AIMessageContent;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ChatIA() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Load chat history
  useEffect(() => {
    if (!user) return;
    const loadHistory = async () => {
      setLoadingHistory(true);
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setMessages(
          data.map((m: any) => ({
            id: m.id,
            role: m.role as 'user' | 'assistant',
            content: m.content,
            imagePreview: m.image_url || undefined,
            transaction: m.transaction_data || undefined,
          }))
        );
      }
      setLoadingHistory(false);
    };
    loadHistory();
  }, [user]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  // Paste image support
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (!file) return;
          setPendingFile(file);
          setPendingPreview(URL.createObjectURL(file));
          inputRef.current?.focus();
          return;
        }
      }
    };
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, []);

  const persistMessage = useCallback(
    async (msg: ChatMessage): Promise<string | undefined> => {
      if (!user) return;
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          user_id: user.id,
          role: msg.role,
          content: msg.content,
          image_url: msg.imagePreview || null,
          transaction_data: msg.transaction || null,
        })
        .select('id')
        .single();
      if (error) console.error('Error persisting message:', error);
      return data?.id;
    },
    [user]
  );

  const clearHistory = async () => {
    if (!user) return;
    const { error } = await supabase.from('chat_messages').delete().eq('user_id', user.id);
    if (!error) {
      setMessages([]);
      toast({ title: 'Histórico limpo' });
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast({ title: 'Formato não suportado', description: 'Envie imagens (JPG, PNG, WebP) ou PDFs.', variant: 'destructive' });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'Arquivo muito grande', description: 'Máximo 10MB.', variant: 'destructive' });
      return;
    }
    setPendingFile(file);
    if (file.type.startsWith('image/')) {
      setPendingPreview(URL.createObjectURL(file));
    } else {
      setPendingPreview(null);
    }
    inputRef.current?.focus();
  };

  const clearPendingFile = () => {
    if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    setPendingFile(null);
    setPendingPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const saveTransaction = async (parsed: any) => {
    if (!user || parsed.intent !== 'add_transaction') return false;
    try {
      const { error } = await supabase.from('transactions').insert({
        user_id: user.id,
        description: parsed.description,
        amount: parsed.amount,
        category_id: parsed.category_id,
        date: parsed.date || format(new Date(), 'yyyy-MM-dd'),
        type: parsed.type,
        installment_number: 1,
        installment_total: 1,
      });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      return true;
    } catch (err) {
      console.error('Error saving transaction:', err);
      return false;
    }
  };

  const fetchFinancialContext = useCallback(async (): Promise<string> => {
    if (!user) return '';
    const now = new Date();
    const monthStart = format(startOfMonth(now), 'yyyy-MM-dd');
    const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd');
    const monthLabel = format(now, 'MMMM yyyy', { locale: ptBR });

    try {
      const [txRes, catRes, remRes] = await Promise.all([
        supabase.from('transactions').select('amount, type, date, description, category_id, categories(name)').gte('date', monthStart).lte('date', monthEnd),
        supabase.from('categories').select('id, name, type'),
        supabase.from('reminders').select('name, amount, next_due_date, is_active').eq('is_active', true),
      ]);

      const transactions = txRes.data || [];
      const reminders = remRes.data || [];

      const totalExpense = transactions.filter((t: any) => t.type === 'expense').reduce((s: number, t: any) => s + Number(t.amount), 0);
      const totalIncome = transactions.filter((t: any) => t.type === 'income').reduce((s: number, t: any) => s + Number(t.amount), 0);
      const balance = totalIncome - totalExpense;

      // Group expenses by category
      const byCategory: Record<string, number> = {};
      transactions.filter((t: any) => t.type === 'expense').forEach((t: any) => {
        const catName = (t.categories as any)?.name || 'Outros';
        byCategory[catName] = (byCategory[catName] || 0) + Number(t.amount);
      });
      const categoryBreakdown = Object.entries(byCategory)
        .sort((a, b) => b[1] - a[1])
        .map(([name, val]) => `  - ${name}: R$ ${val.toFixed(2)}`)
        .join('\n');

      const daysInMonth = endOfMonth(now).getDate();
      const dayOfMonth = now.getDate();
      const daysLeft = daysInMonth - dayOfMonth;
      const avgDailyExpense = dayOfMonth > 0 ? totalExpense / dayOfMonth : 0;

      const reminderList = reminders.map((r: any) => `  - ${r.name}: R$ ${Number(r.amount).toFixed(2)} (vence ${r.next_due_date})`).join('\n');

      return `📅 Mês: ${monthLabel}
💰 Renda total do mês: R$ ${totalIncome.toFixed(2)}
💸 Gastos totais do mês: R$ ${totalExpense.toFixed(2)}
📊 Saldo do mês (renda - gastos): R$ ${balance.toFixed(2)}
📆 Dia ${dayOfMonth} de ${daysInMonth} (${daysLeft} dias restantes)
📈 Média diária de gastos: R$ ${avgDailyExpense.toFixed(2)}
💵 Se mantiver esse ritmo, gastará ~R$ ${(avgDailyExpense * daysInMonth).toFixed(2)} no mês

🏷️ Gastos por categoria (${monthLabel}):
${categoryBreakdown || '  Nenhum gasto registrado ainda.'}

⏰ Lembretes ativos:
${reminderList || '  Nenhum lembrete ativo.'}

📋 Total de transações no mês: ${transactions.length}`;
    } catch (err) {
      console.error('Error fetching financial context:', err);
      return 'Dados financeiros indisponíveis no momento.';
    }
  }, [user]);

  const sendMessage = async () => {
    const text = input.trim();
    if ((!text && !pendingFile) || isLoading) return;

    const displayText = text || (pendingFile ? `📎 ${pendingFile.name}` : '');
    const userMsg: ChatMessage = {
      role: 'user',
      content: displayText,
      imagePreview: pendingPreview || undefined,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Persist user message
    persistMessage(userMsg);

    try {
      // Fetch financial data in parallel with file processing
      const [financialContext, userContent] = await Promise.all([
        fetchFinancialContext(),
        (async (): Promise<AIMessageContent> => {
          if (pendingFile) {
            const base64 = await fileToBase64(pendingFile);
            const parts: Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }> = [];
            parts.push({ type: 'text', text: text || 'Analise este arquivo e extraia as transações.' });
            parts.push({ type: 'image_url', image_url: { url: base64 } });
            return parts;
          }
          return text;
        })(),
      ]);
      clearPendingFile();

      const historyForAI: AIMessage[] = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      historyForAI.push({ role: 'user', content: userContent });

      const { data, error } = await supabase.functions.invoke('chat', {
        body: { messages: historyForAI, financial_context: financialContext },
      });

      if (error) throw error;

      if (data.error) {
        const errMsg: ChatMessage = { role: 'assistant', content: `⚠️ ${data.error}` };
        setMessages((prev) => [...prev, errMsg]);
        persistMessage(errMsg);
        return;
      }

      let assistantMsg: ChatMessage;
      if (data.intent === 'add_transaction') {
        const saved = await saveTransaction(data);
        const msg = saved
          ? data.message
          : `${data.message}\n\n⚠️ Não consegui salvar automaticamente.`;
        assistantMsg = {
          role: 'assistant',
          content: msg,
          transaction: saved
            ? { type: data.type, amount: data.amount, description: data.description, category: data.category }
            : undefined,
        };
      } else {
        assistantMsg = { role: 'assistant', content: data.message };
      }

      setMessages((prev) => [...prev, assistantMsg]);
      persistMessage(assistantMsg);
    } catch (err) {
      console.error('Chat error:', err);
      clearPendingFile();
      const errMsg: ChatMessage = { role: 'assistant', content: '❌ Erro ao processar sua mensagem. Tente novamente.' };
      setMessages((prev) => [...prev, errMsg]);
      persistMessage(errMsg);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const suggestions = [
    'Quanto gastei esse mês?',
    'Onde estou gastando mais?',
    'Posso pedir delivery hoje?',
    'Gastei 50 com marmita',
    'Recebi 1500 de salário',
    'Consigo economizar 500 por mês?',
  ];

  return (
    <div className="flex h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)] flex-col mx-auto max-w-2xl px-2">
      {/* Header */}
      <div className="flex items-center gap-2 py-3 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary/20">
          <Sparkles className="h-5 w-5 text-secondary" />
        </div>
        <div className="flex-1">
          <h1 className="text-base font-bold text-foreground">Maya — Sua Assistente Financeira</h1>
          <p className="text-xs text-muted-foreground">Registre gastos, envie fotos, tire dúvidas e planeje suas finanças</p>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={clearHistory}>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 px-2 pb-2">
        {loadingHistory ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary/10">
              <Bot className="h-8 w-8 text-secondary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Olá! Eu sou a Maya 👋</p>
              <p className="text-xs text-muted-foreground mt-1">
                Registre gastos, envie fotos de recibos, pergunte sobre suas finanças ou peça dicas de economia
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 w-full max-w-sm mt-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setInput(s);
                    inputRef.current?.focus();
                  }}
                  className="rounded-xl border border-border/50 bg-card px-3 py-2 text-xs text-muted-foreground hover:bg-muted/50 transition-colors text-left"
                >
                  "{s}"
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {messages.map((msg, i) => (
          <div
            key={msg.id || i}
            className={cn(
              'flex gap-2 max-w-[85%]',
              msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
            )}
          >
            <div
              className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                msg.role === 'user' ? 'bg-primary' : 'bg-secondary/20'
              )}
            >
              {msg.role === 'user' ? (
                <User className="h-3.5 w-3.5 text-primary-foreground" />
              ) : (
                <Bot className="h-3.5 w-3.5 text-secondary" />
              )}
            </div>
            <div
              className={cn(
                'rounded-2xl px-3.5 py-2.5 text-sm',
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-tr-md'
                  : 'bg-muted text-foreground rounded-tl-md'
              )}
            >
              {msg.imagePreview && (
                <img src={msg.imagePreview} alt="Anexo" className="rounded-lg mb-2 max-h-40 object-cover" />
              )}
              <p className="whitespace-pre-wrap">{msg.content}</p>
              {msg.transaction && (
                <div className="mt-2 rounded-lg bg-background/50 p-2 text-xs space-y-0.5">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tipo:</span>
                    <span className={msg.transaction.type === 'income' ? 'text-emerald-500' : 'text-red-400'}>
                      {msg.transaction.type === 'income' ? 'Receita' : 'Despesa'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valor:</span>
                    <span>R$ {msg.transaction.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Categoria:</span>
                    <span>{msg.transaction.category}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-2 mr-auto max-w-[85%]">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary/20">
              <Bot className="h-3.5 w-3.5 text-secondary" />
            </div>
            <div className="rounded-2xl rounded-tl-md bg-muted px-4 py-3">
              <div className="flex gap-1">
                <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0ms]" />
                <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:150ms]" />
                <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pending file preview */}
      {pendingFile && (
        <div className="px-2 pb-1">
          <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-xs">
            {pendingPreview ? (
              <img src={pendingPreview} alt="Preview" className="h-10 w-10 rounded object-cover" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded bg-muted text-muted-foreground text-[10px] font-medium">
                PDF
              </div>
            )}
            <span className="flex-1 truncate text-muted-foreground">{pendingFile.name}</span>
            <button onClick={clearPendingFile} className="text-muted-foreground hover:text-foreground text-lg leading-none">
              ×
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border/50 bg-background px-2 py-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
            className="hidden"
            onChange={handleFileSelect}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-10 w-10 shrink-0 rounded-full"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
          >
            <ImagePlus className="h-5 w-5 text-muted-foreground" />
          </Button>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={pendingFile ? 'Adicione um comentário (opcional)...' : 'Ex: gastei 50 com marmita...'}
            className="flex-1 rounded-full border border-input bg-muted/30 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="icon"
            className="h-10 w-10 rounded-full shrink-0"
            disabled={(!input.trim() && !pendingFile) || isLoading}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
}
