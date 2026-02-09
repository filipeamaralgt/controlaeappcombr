import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2, Bot, User, ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface ChatMessage {
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
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

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
      const url = URL.createObjectURL(file);
      setPendingPreview(url);
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

    try {
      // Build AI message content
      let userContent: AIMessageContent;

      if (pendingFile) {
        const base64 = await fileToBase64(pendingFile);
        const parts: Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }> = [];
        if (text) parts.push({ type: 'text', text });
        else parts.push({ type: 'text', text: 'Analise este arquivo e extraia as transações.' });
        parts.push({ type: 'image_url', image_url: { url: base64 } });
        userContent = parts;
      } else {
        userContent = text;
      }

      clearPendingFile();

      // Build history (only text for past messages, multimodal for current)
      const historyForAI: AIMessage[] = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      historyForAI.push({ role: 'user', content: userContent });

      const { data, error } = await supabase.functions.invoke('chat', {
        body: { messages: historyForAI },
      });

      if (error) throw error;

      if (data.error) {
        setMessages((prev) => [...prev, { role: 'assistant', content: `⚠️ ${data.error}` }]);
        return;
      }

      if (data.intent === 'add_transaction') {
        const saved = await saveTransaction(data);
        const msg = saved
          ? data.message
          : `${data.message}\n\n⚠️ Não consegui salvar automaticamente. Tente registrar manualmente.`;
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: msg,
            transaction: saved
              ? { type: data.type, amount: data.amount, description: data.description, category: data.category }
              : undefined,
          },
        ]);
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.message }]);
      }
    } catch (err) {
      console.error('Chat error:', err);
      clearPendingFile();
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '❌ Erro ao processar sua mensagem. Tente novamente.' },
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const suggestions = [
    'Gastei 50 com marmita',
    'Paguei 30 no uber',
    'Recebi 1500 de salário',
    '📸 Envie uma foto do recibo',
  ];

  return (
    <div className="flex h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)] flex-col mx-auto max-w-2xl px-2">
      {/* Header */}
      <div className="flex items-center gap-2 py-3 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary/20">
          <Sparkles className="h-5 w-5 text-secondary" />
        </div>
        <div>
          <h1 className="text-base font-bold text-foreground">Assistente Financeiro</h1>
          <p className="text-xs text-muted-foreground">Registre gastos por texto, foto ou PDF</p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 px-2 pb-2">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary/10">
              <Bot className="h-8 w-8 text-secondary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Como posso ajudar?</p>
              <p className="text-xs text-muted-foreground mt-1">
                Digite uma frase, envie uma foto de recibo ou PDF de extrato
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 w-full max-w-sm mt-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    if (s.startsWith('📸')) {
                      fileInputRef.current?.click();
                    } else {
                      setInput(s);
                      inputRef.current?.focus();
                    }
                  }}
                  className="rounded-xl border border-border/50 bg-card px-3 py-2 text-xs text-muted-foreground hover:bg-muted/50 transition-colors text-left"
                >
                  "{s}"
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
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
                <img
                  src={msg.imagePreview}
                  alt="Anexo"
                  className="rounded-lg mb-2 max-h-40 object-cover"
                />
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
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
