import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Sparkles, Loader2, Bot, User, ImagePlus, Trash2, Mic, MicOff, Camera, Square, Undo2 } from 'lucide-react';
import { AudioPlayerBubble } from '@/components/AudioPlayerBubble';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format, startOfMonth, endOfMonth, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  imagePreview?: string;
  audioUrl?: string;
  transaction?: {
    type: 'expense' | 'income';
    amount: number;
    description: string;
    category: string;
    ids?: string[]; // transaction IDs for undo
    undone?: boolean;
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
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [undoConfirm, setUndoConfirm] = useState<{ msgIndex: number; ids: string[] } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
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
          data.map((m: any) => {
            const isAudioData = m.image_url?.startsWith('data:audio/');
            return {
              id: m.id,
              role: m.role as 'user' | 'assistant',
              content: m.content,
              imagePreview: (!isAudioData && m.image_url) ? m.image_url : undefined,
              audioUrl: isAudioData ? m.image_url : undefined,
              transaction: m.transaction_data || undefined,
            };
          })
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
          image_url: msg.audioUrl || msg.imagePreview || null,
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
    if (pendingPreview && pendingPreview.startsWith('blob:')) URL.revokeObjectURL(pendingPreview);
    setPendingFile(null);
    setPendingPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleCameraCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setPendingPreview(URL.createObjectURL(file));
    inputRef.current?.focus();
  };

  const speechRecognitionRef = useRef<any>(null);
  const transcriptRef = useRef<string>('');

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      transcriptRef.current = '';

      // Start Web Speech API recognition in parallel
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = 'pt-BR';
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.onresult = (event: any) => {
          let transcript = '';
          for (let i = 0; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              transcript += event.results[i][0].transcript;
            }
          }
          transcriptRef.current = transcript;
        };
        recognition.onerror = (e: any) => console.warn('Speech recognition error:', e.error);
        recognition.start();
        speechRecognitionRef.current = recognition;
      }

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        // Stop speech recognition
        if (speechRecognitionRef.current) {
          speechRecognitionRef.current.stop();
          speechRecognitionRef.current = null;
        }
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioBase64 = await fileToBase64(new File([audioBlob], 'audio.webm', { type: 'audio/webm' }));

        // If we got a transcript, use it as text input instead of sending audio as file
        const transcript = transcriptRef.current.trim();
        if (transcript) {
          // Set transcript as text input and audio as preview only (for playback)
          setInput(transcript);
          // Still store audio for playback
          const file = new File([audioBlob], `audio-${Date.now()}.webm`, { type: 'audio/webm' });
          setPendingFile(file);
          setPendingPreview(audioBase64);
        } else {
          // Fallback: send audio as file if speech recognition failed
          const file = new File([audioBlob], `audio-${Date.now()}.webm`, { type: 'audio/webm' });
          setPendingFile(file);
          setPendingPreview(audioBase64);
        }
        setRecordingTime(0);
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
        inputRef.current?.focus();
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000);
    } catch {
      toast({ title: 'Microfone não disponível', description: 'Permita o acesso ao microfone.', variant: 'destructive' });
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
  };

  const formatRecordingTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const saveTransaction = async (parsed: any) => {
    if (!user || (parsed.intent !== 'add_transaction' && parsed.intent !== 'correct_last_transaction')) return false;
    if (!parsed.amount || !parsed.category_id || !parsed.type) {
      console.warn('Missing required fields for transaction:', { amount: parsed.amount, category_id: parsed.category_id, type: parsed.type });
      return false;
    }
    try {
      // If correcting, delete the most recent transaction first
      if (parsed.intent === 'correct_last_transaction') {
        const { data: lastTx } = await supabase
          .from('transactions')
          .select('id')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        if (lastTx) {
          await supabase.from('transactions').delete().eq('id', lastTx.id);
        }
      }

      const installments = parsed.installments || 1;
      const installmentAmount = Number((parsed.amount / installments).toFixed(2));
      const groupId = installments > 1 ? crypto.randomUUID() : null;
      const baseDate = parsed.date || format(new Date(), 'yyyy-MM-dd');

      const transactions = Array.from({ length: installments }, (_, i) => ({
        user_id: user.id,
        description: parsed.description,
        amount: i === installments - 1
          ? Number((parsed.amount - installmentAmount * (installments - 1)).toFixed(2))
          : installmentAmount,
        category_id: parsed.category_id,
        date: installments > 1 ? format(addMonths(new Date(baseDate), i), 'yyyy-MM-dd') : baseDate,
        type: parsed.type,
        installment_number: i + 1,
        installment_total: installments,
        installment_group_id: groupId,
      }));

      const { data: inserted, error } = await supabase.from('transactions').insert(transactions).select('id');
      if (error) throw error;
      const insertedIds = inserted?.map((t: any) => t.id) || [];

      // Auto-create installment tracking entry when parcelado
      if (installments > 1) {
        await supabase
          .from('installments' as any)
          .insert({
            user_id: user.id,
            name: parsed.description,
            total_amount: parsed.amount,
            installment_count: installments,
            installment_paid: 0,
            next_due_date: baseDate,
          } as any);
      }

      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['installments'] });
      return insertedIds;
    } catch (err) {
      console.error('Error saving transaction:', err);
      return null;
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

    const isAudio = pendingFile?.type.startsWith('audio/');
    const displayText = text || (pendingFile ? (isAudio ? '🎙️ Áudio' : `📎 ${pendingFile.name}`) : '');
    const userMsg: ChatMessage = {
      role: 'user',
      content: displayText,
      imagePreview: (!isAudio && pendingPreview) ? pendingPreview : undefined,
      audioUrl: isAudio && pendingPreview ? pendingPreview : undefined,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Persist user message
    persistMessage(userMsg);

    try {
      // Fetch financial data in parallel with file processing
      const isAudioWithTranscript = isAudio && !!text;
      const [financialContext, userContent] = await Promise.all([
        fetchFinancialContext(),
        (async (): Promise<AIMessageContent> => {
          // If audio was transcribed, send only the text (no file to AI)
          if (isAudioWithTranscript) {
            return text;
          }
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
      if (data.intent === 'add_transaction' || data.intent === 'correct_last_transaction') {
        const savedIds = await saveTransaction(data);
        const msg = savedIds
          ? data.message
          : data.amount
            ? `${data.message}\n\n⚠️ Não consegui salvar automaticamente.`
            : `${data.message}\n\n⚠️ Não consegui identificar o valor. Tente novamente informando o valor (ex: "gastei 100 com meg").`;
        assistantMsg = {
          role: 'assistant',
          content: msg,
          transaction: savedIds
            ? { type: data.type, amount: data.amount, description: data.description, category: data.category, ids: savedIds }
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
    <div className="flex h-[calc(100vh-8.5rem)] md:h-[calc(100vh-6rem)] flex-col mx-auto max-w-2xl px-2">
      {/* Header */}
      <div className="flex items-center gap-2 py-2 px-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/20">
          <Sparkles className="h-4 w-4 text-secondary" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-bold text-foreground truncate">Maya — Sua Assistente Financeira</h1>
          <p className="text-[10px] text-muted-foreground truncate">Registre gastos, envie fotos, tire dúvidas</p>
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
              {msg.audioUrl ? (
                <AudioPlayerBubble src={msg.audioUrl} isUser={msg.role === 'user'} />
              ) : (
                <>
                  {msg.imagePreview && (
                    <img src={msg.imagePreview} alt="Anexo" className="rounded-lg mb-2 max-h-40 object-cover" />
                  )}
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </>
              )}
              {msg.transaction && (
                <div className="mt-2 rounded-lg bg-background/50 p-2 text-xs space-y-0.5">
                  {msg.transaction.undone ? (
                    <p className="text-muted-foreground italic">🔄 Transação desfeita</p>
                  ) : (
                    <>
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
                      {msg.transaction.ids && msg.transaction.ids.length > 0 && (
                        <button
                          onClick={() => setUndoConfirm({ msgIndex: i, ids: msg.transaction!.ids! })}
                          className="flex items-center gap-1 mt-1.5 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Undo2 className="h-3 w-3" />
                          <span>Desfazer</span>
                        </button>
                      )}
                    </>
                  )}
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
            {pendingFile.type.startsWith('audio/') && pendingPreview ? (
              <div className="flex-1">
                <AudioPlayerBubble src={pendingPreview} />
              </div>
            ) : pendingPreview && !pendingFile.type.startsWith('audio/') ? (
              <img src={pendingPreview} alt="Preview" className="h-10 w-10 rounded object-cover" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded bg-muted text-muted-foreground text-[10px] font-medium">
                PDF
              </div>
            )}
            {!pendingFile.type.startsWith('audio/') && (
              <span className="flex-1 truncate text-muted-foreground">{pendingFile.name}</span>
            )}
            <button onClick={clearPendingFile} className="text-muted-foreground hover:text-foreground text-lg leading-none">
              ×
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border/50 bg-background px-2 py-2">
        {isRecording ? (
          <div className="flex items-center gap-3 px-2 py-1">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-9 w-9 shrink-0 rounded-full text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => {
                mediaRecorderRef.current?.stop();
                if (speechRecognitionRef.current) {
                  speechRecognitionRef.current.stop();
                  speechRecognitionRef.current = null;
                }
                setIsRecording(false);
                setRecordingTime(0);
                if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
                audioChunksRef.current = [];
                transcriptRef.current = '';
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2 flex-1 rounded-full bg-muted/50 px-4 py-2">
              <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
              <span className="text-sm font-medium text-destructive">{formatRecordingTime(recordingTime)}</span>
              <div className="flex-1 flex items-center justify-center gap-[2px]">
                {Array.from({ length: 24 }).map((_, i) => (
                  <span
                    key={i}
                    className="w-[2.5px] rounded-full bg-muted-foreground/40"
                    style={{
                      height: `${Math.random() * 14 + 6}px`,
                      animation: 'pulse 1.5s ease-in-out infinite',
                      animationDelay: `${i * 0.06}s`,
                    }}
                  />
                ))}
              </div>
            </div>
            <Button
              type="button"
              size="icon"
              className="h-10 w-10 rounded-full shrink-0 bg-primary hover:bg-primary/90"
              onClick={stopRecording}
            >
              <Square className="h-4 w-4 fill-primary-foreground text-primary-foreground" />
            </Button>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex items-center gap-1.5"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
              className="hidden"
              onChange={handleFileSelect}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleCameraCapture}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 rounded-full"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
            >
              <ImagePlus className="h-4 w-4 text-muted-foreground" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 rounded-full"
              onClick={() => cameraInputRef.current?.click()}
              disabled={isLoading}
            >
              <Camera className="h-4 w-4 text-muted-foreground" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 rounded-full"
              onClick={startRecording}
              disabled={isLoading}
            >
              <Mic className="h-4 w-4 text-muted-foreground" />
            </Button>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={pendingFile ? 'Comentário...' : 'Ex: gastei 50 com marmita...'}
              className="flex-1 min-w-0 rounded-full border border-input bg-muted/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              className="h-9 w-9 rounded-full shrink-0"
              disabled={(!input.trim() && !pendingFile) || isLoading}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        )}
      </div>

      <DeleteConfirmDialog
        open={!!undoConfirm}
        onOpenChange={(open) => !open && setUndoConfirm(null)}
        title="Desfazer transação"
        description="Tem certeza que deseja desfazer esta transação? Ela será removida permanentemente."
        onConfirm={async () => {
          if (!undoConfirm) return;
          for (const id of undoConfirm.ids) {
            await supabase.from('transactions').delete().eq('id', id);
          }
          queryClient.invalidateQueries({ queryKey: ['transactions'] });
          setMessages((prev) =>
            prev.map((m, idx) =>
              idx === undoConfirm.msgIndex
                ? { ...m, transaction: { ...m.transaction!, undone: true, ids: [] } }
                : m
            )
          );
          toast({ title: 'Transação desfeita com sucesso' });
          setUndoConfirm(null);
        }}
      />
    </div>
  );
}
