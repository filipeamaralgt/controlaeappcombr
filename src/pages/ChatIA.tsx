import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Send, Sparkles, Loader2, User, ImagePlus, Eraser, Trash2, Mic, MicOff, Camera, Square, Undo2, Settings2, Volume2, VolumeX, BellRing, BellOff, FileBarChart } from 'lucide-react';
import mayaAvatarNeutral from '@/assets/maya-avatar-neutral.png';
import { AudioPlayerBubble } from '@/components/AudioPlayerBubble';
import { CameraCapture } from '@/components/CameraCapture';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format, startOfMonth, endOfMonth, addMonths } from 'date-fns';
import { tryParseLocally, tryDetectOverspending, tryDetectRecurringPayment, type PendingAmountResult, type PendingCategoryResult, type PendingInstallmentResult, type BudgetLimitResult, type RecurringPaymentLocalResult } from '@/lib/localTransactionParser';
import { ptBR } from 'date-fns/locale';
import { useSpendingProfiles } from '@/hooks/useSpendingProfiles';
import { checkAndGenerateReports, generateWeeklyPreview, generateMonthlyPreview, generateWeeklyReport, generateMonthlyReport } from '@/lib/autoReports';

interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  imagePreview?: string;
  audioUrl?: string;
  local?: boolean; // true = parsed locally, false/undefined = AI
  transaction?: {
    type: 'expense' | 'income';
    amount: number;
    description: string;
    category: string;
    ids?: string[];
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

/** Render inline markdown: **bold**, *italic*, and numbered lists */
function renderInline(text: string, keyPrefix: string = '') {
  return text.split(/(\*\*[^*]+\*\*)/).map((seg, i) => {
    if (seg.startsWith('**') && seg.endsWith('**')) {
      return <strong key={`${keyPrefix}b${i}`} className="font-semibold">{seg.slice(2, -2)}</strong>;
    }
    return seg.split(/(\*[^*]+\*)/).map((part, j) => {
      if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
        return <em key={`${keyPrefix}i${i}-${j}`}>{part.slice(1, -1)}</em>;
      }
      return <span key={`${keyPrefix}t${i}-${j}`}>{part}</span>;
    });
  });
}

function renderMarkdown(content: string) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let olItems: React.ReactNode[] = [];
  let ulItems: React.ReactNode[] = [];

  const flushOl = () => {
    if (olItems.length > 0) {
      elements.push(
        <ol key={`ol-${elements.length}`} className="list-decimal list-inside space-y-0.5 my-1">{olItems}</ol>
      );
      olItems = [];
    }
  };
  const flushUl = () => {
    if (ulItems.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="list-disc list-inside space-y-0.5 my-1">{ulItems}</ul>
      );
      ulItems = [];
    }
  };

  lines.forEach((line, idx) => {
    const olMatch = line.match(/^(\d+)\.\s+(.*)/);
    const ulMatch = line.match(/^[-•]\s+(.*)/);
    if (olMatch) {
      flushUl();
      olItems.push(<li key={`oli-${idx}`} className="pl-1">{renderInline(olMatch[2], `oli${idx}`)}</li>);
    } else if (ulMatch) {
      flushOl();
      ulItems.push(<li key={`uli-${idx}`} className="pl-1">{renderInline(ulMatch[1], `uli${idx}`)}</li>);
    } else {
      flushOl();
      flushUl();
      elements.push(
        <span key={`ln-${idx}`}>{idx > 0 && '\n'}{renderInline(line, `ln${idx}`)}</span>
      );
    }
  });
  flushOl();
  flushUl();
  return elements;
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
  const [cameraOpen, setCameraOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pendingTransaction, setPendingTransaction] = useState<{ parsed: any; message: string; local?: boolean } | null>(null);
  const [pendingAmountData, setPendingAmountData] = useState<PendingAmountResult | null>(null);
  const [pendingInstallmentData, setPendingInstallmentData] = useState<PendingInstallmentResult | null>(null);
  const [pendingCategoryData, setPendingCategoryData] = useState<PendingCategoryResult | null>(null);
  const [reportPreview, setReportPreview] = useState<'weekly' | 'monthly' | null>(null);
  const [generatingReport, setGeneratingReport] = useState<'weekly' | 'monthly' | null>(null);
  const [pendingLimitSuggestion, setPendingLimitSuggestion] = useState<{ categories: { name: string; spent: number; category_id?: string }[] } | null>(null);
  const [pendingLimitAmounts, setPendingLimitAmounts] = useState<Record<string, string>>({});
  const [pendingRecurringPayment, setPendingRecurringPayment] = useState<RecurringPaymentLocalResult | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoSendAudioRef = useRef(false);
  const { user } = useAuth();
  const { avatarUrl, initials } = useProfile();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: profiles } = useSpendingProfiles();
  const chatSoundPlayed = useRef(false);
  const isMountedRef = useRef(true);

  // Track mount state for background notification
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  // Dora settings (persisted in localStorage)
  const [mayaSoundEnabled, setMayaSoundEnabled] = useState(() => {
    const stored = localStorage.getItem('maya-sound-enabled');
    return stored !== null ? stored === 'true' : true;
  });
  const [mayaNotificationsEnabled, setMayaNotificationsEnabled] = useState(() => {
    const stored = localStorage.getItem('maya-notifications-enabled');
    return stored !== null ? stored === 'true' : true;
  });
  const [weeklyReportEnabled, setWeeklyReportEnabled] = useState(() => {
    const stored = localStorage.getItem('maya-weekly-report');
    return stored !== null ? stored === 'true' : false;
  });
  const [monthlyReportEnabled, setMonthlyReportEnabled] = useState(() => {
    const stored = localStorage.getItem('maya-monthly-report');
    return stored !== null ? stored === 'true' : false;
  });

  const toggleSetting = (key: string, value: boolean, setter: (v: boolean) => void) => {
    localStorage.setItem(key, String(value));
    setter(value);
  };

  // Reusable notification sound function
  const playNotificationSound = useCallback(() => {
    if (!mayaSoundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const playTone = (freq: number, start: number, dur: number, vol: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(vol, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
        osc.connect(gain).connect(ctx.destination);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + dur);
      };
      playTone(880, 0, 0.12, 0.15);
      playTone(1100, 0.08, 0.15, 0.12);
    } catch {}
  }, [mayaSoundEnabled]);

  // Play chat notification sound on first mount
  // Sound is now played after history loads (only when empty)

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
            const isLocal = m.role === 'assistant' && /^✅ Registrei (seu gasto|sua receita) de R\$/.test(m.content);
            return {
              id: m.id,
              role: m.role as 'user' | 'assistant',
              content: m.content,
              imagePreview: (!isAudioData && m.image_url) ? m.image_url : undefined,
              audioUrl: isAudioData ? m.image_url : undefined,
              local: isLocal || undefined,
              transaction: m.transaction_data || undefined,
            };
          })
        );
        // Play sound only when no history
        if ((!data || data.length === 0) && !chatSoundPlayed.current) {
          chatSoundPlayed.current = true;
          playNotificationSound();
        }
      }
      setLoadingHistory(false);

      // Check for auto reports
      if (user) {
        const report = await checkAndGenerateReports(user.id);
        if (report) {
          const reportMsg: ChatMessage = { role: 'assistant', content: report.content };
          setMessages((prev) => [...prev, reportMsg]);
          // Persist the report as a chat message
          await supabase.from('chat_messages').insert({
            user_id: user.id,
            role: 'assistant',
            content: report.content,
          });
        }
      }
    };
    loadHistory();
  }, [user]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  // Auto-send after audio recording stops
  useEffect(() => {
    if (autoSendAudioRef.current && pendingFile?.type.startsWith('audio/')) {
      autoSendAudioRef.current = false;
      // Small delay to let input state settle (transcript)
      const t = setTimeout(() => sendMessage(), 100);
      return () => clearTimeout(t);
    }
  }, [pendingFile]);

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

  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearingHistory, setClearingHistory] = useState(false);

  const clearHistory = async () => {
    if (!user) return;
    setClearingHistory(true);
    setShowClearConfirm(false);

    // Fade out messages before deleting
    const messagesContainer = scrollRef.current;
    if (messagesContainer) {
      messagesContainer.style.transition = 'opacity 0.4s ease-out';
      messagesContainer.style.opacity = '0';
      await new Promise(resolve => setTimeout(resolve, 450));
    }

    const { error } = await supabase.from('chat_messages').delete().eq('user_id', user.id);
    if (!error) {
      setMessages([]);
      toast({ title: 'Histórico limpo' });
    }

    if (messagesContainer) {
      messagesContainer.style.opacity = '1';
    }
    setClearingHistory(false);
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

  const handleCameraPhoto = (file: File, preview: string) => {
    setPendingFile(file);
    setPendingPreview(preview);
    inputRef.current?.focus();
  };

  const speechRecognitionRef = useRef<any>(null);
  const transcriptRef = useRef<string>('');

  const getSupportedMimeType = () => {
    const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg', 'audio/wav'];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) return type;
    }
    return '';
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getSupportedMimeType();
      const mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      const actualMime = mediaRecorder.mimeType || mimeType || 'audio/webm';
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
        if (speechRecognitionRef.current) {
          speechRecognitionRef.current.stop();
          speechRecognitionRef.current = null;
        }
        const audioBlob = new Blob(audioChunksRef.current, { type: actualMime });
        const ext = actualMime.includes('mp4') ? 'mp4' : actualMime.includes('ogg') ? 'ogg' : 'webm';
        const audioBase64 = await fileToBase64(new File([audioBlob], `audio.${ext}`, { type: actualMime }));

        const transcript = transcriptRef.current.trim();
        const file = new File([audioBlob], `audio-${Date.now()}.${ext}`, { type: actualMime });
        if (transcript) {
          setInput(transcript);
        }
        setPendingFile(file);
        setPendingPreview(audioBase64);
        autoSendAudioRef.current = true;
        setRecordingTime(0);
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
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

  const saveTransaction = async (parsed: any, profileId?: string | null) => {
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
        profile_id: profileId || null,
        notes: parsed.notes || null,
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

  const fetchFinancialContext = useCallback(async (): Promise<{ context: string; userCategories: { id: string; name: string; type: string }[] }> => {
    if (!user) return { context: '', userCategories: [] };
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
      const categories = (catRes.data || []) as { id: string; name: string; type: string }[];
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

      const context = `📅 Mês: ${monthLabel}
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

      return { context, userCategories: categories };
    } catch (err) {
      console.error('Error fetching financial context:', err);
      return { context: 'Dados financeiros indisponíveis no momento.', userCategories: [] };
    }
  }, [user]);
  const handleProfileSelect = async (profileId: string | null) => {
    if (!pendingTransaction) return;
    const { parsed, message, local } = pendingTransaction;
    setPendingTransaction(null);

    const selectedProfile = profileId ? profiles?.find((p) => p.id === profileId) : null;
    const savedIds = await saveTransaction(parsed, profileId ?? undefined);
    const profileLabel = selectedProfile ? `${selectedProfile.icon} ${selectedProfile.name}` : 'Todos';
    const msg = savedIds
      ? `${message}\n\n✅ Registrado para ${profileLabel}`
      : `${message}\n\n⚠️ Não consegui salvar automaticamente.`;
    const assistantMsg: ChatMessage = {
      role: 'assistant',
      content: msg,
      local: local || undefined,
      transaction: savedIds
        ? { type: parsed.type, amount: parsed.amount, description: parsed.description, category: parsed.category, ids: savedIds }
        : undefined,
    };
    setMessages((prev) => [...prev, assistantMsg]);
    persistMessage(assistantMsg);
  };

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
      // Check if user is replying with amount for a pending recurring payment
      if (pendingRecurringPayment && text && !pendingFile) {
        const amountText = text.replace(/[rR]\$\s*/, '').replace(/\./g, '').replace(',', '.').trim();
        const amount = parseFloat(amountText);
        if (!isNaN(amount) && amount > 0 && user) {
          clearPendingFile();
          try {
            await supabase.from('recurring_payments').insert({
              user_id: user.id,
              description: pendingRecurringPayment.description,
              amount,
              category_id: pendingRecurringPayment.category_id,
              day_of_month: pendingRecurringPayment.day_of_month,
              type: pendingRecurringPayment.type,
              notes: '[Criado via chat]',
            });
            queryClient.invalidateQueries({ queryKey: ['recurring_payments'] });

            const msg = `✅ Pagamento recorrente criado!\n\n📋 ${pendingRecurringPayment.description} de R$ ${amount.toFixed(2)}\n📅 Todo dia ${pendingRecurringPayment.day_of_month} do mês\n📁 Categoria: ${pendingRecurringPayment.category}`;
            const assistantMsg: ChatMessage = { role: 'assistant', content: msg, local: true };
            setMessages((prev) => [...prev, assistantMsg]);
            persistMessage(assistantMsg);
          } catch (err) {
            console.error('Error creating recurring payment:', err);
            const errMsg: ChatMessage = { role: 'assistant', content: '❌ Erro ao criar pagamento recorrente.', local: true };
            setMessages((prev) => [...prev, errMsg]);
            persistMessage(errMsg);
          }
          setPendingRecurringPayment(null);
          setIsLoading(false);
          inputRef.current?.focus();
          return;
        }
      }

      // Check if user is replying with amount for a pending transaction
      if (pendingAmountData && text && !pendingFile) {
        const amountText = text.replace(/[rR]\$\s*/, '').replace(/\./g, '').replace(',', '.').trim();
        const amount = parseFloat(amountText);
        if (!isNaN(amount) && amount > 0) {
          clearPendingFile();
          const completed = {
            ...pendingAmountData,
            intent: 'add_transaction' as const,
            amount,
          };
          setPendingAmountData(null);

          const installmentText = completed.installments > 1 ? ` (${completed.installments}x de R$ ${(amount / completed.installments).toFixed(2)})` : '';
          const successMessage = `✅ Registrei ${completed.type === 'expense' ? 'seu gasto' : 'sua receita'} de R$ ${amount.toFixed(2)} em ${completed.category}!${installmentText}`;

          const hasProfiles = profiles && profiles.length > 0;
          let autoProfileId: string | null = null;
          if (completed.detectedProfileName && hasProfiles) {
            const match = profiles.find((p) => p.name.toLowerCase() === completed.detectedProfileName!.toLowerCase());
            if (match) autoProfileId = match.id;
          }

          if (autoProfileId) {
            const selectedProfile = profiles!.find((p) => p.id === autoProfileId);
            const savedIds = await saveTransaction(completed, autoProfileId);
            const profileLabel = selectedProfile ? `${selectedProfile.icon} ${selectedProfile.name}` : 'Todos';
            const msg = savedIds ? `${successMessage}\n\n✅ Registrado para ${profileLabel}` : `${successMessage}\n\n⚠️ Não consegui salvar automaticamente.`;
            const assistantMsg: ChatMessage = { role: 'assistant', content: msg, local: true, transaction: savedIds ? { type: completed.type, amount, description: completed.description, category: completed.category, ids: savedIds } : undefined };
            setMessages((prev) => [...prev, assistantMsg]);
            persistMessage(assistantMsg);
          } else if (hasProfiles) {
            const assistantMsg: ChatMessage = { role: 'assistant', content: `${successMessage}\n\n👤 Quem está registrando?`, local: true };
            setMessages((prev) => [...prev, assistantMsg]);
            persistMessage(assistantMsg);
            setPendingTransaction({ parsed: completed, message: successMessage, local: true });
          } else {
            const savedIds = await saveTransaction(completed);
            const msg = savedIds ? successMessage : `${successMessage}\n\n⚠️ Não consegui salvar automaticamente.`;
            const assistantMsg: ChatMessage = { role: 'assistant', content: msg, local: true, transaction: savedIds ? { type: completed.type, amount, description: completed.description, category: completed.category, ids: savedIds } : undefined };
            setMessages((prev) => [...prev, assistantMsg]);
            persistMessage(assistantMsg);
          }
          setIsLoading(false);
          return;
        }
      }

      // Check if user is replying with installment count for a pending transaction
      if (pendingInstallmentData && text && !pendingFile) {
        const lowerReply = text.toLowerCase().trim();
        const isNo = /^(n[aã]o|nao|não|1x?|à vista|a vista|avista)$/i.test(lowerReply);
        const installmentNum = isNo ? 1 : parseInt(lowerReply.replace(/x$/i, ''), 10);

        if (isNo || (!isNaN(installmentNum) && installmentNum >= 1)) {
          clearPendingFile();
          const finalInstallments = isNo ? 1 : installmentNum;
          const completed = {
            ...pendingInstallmentData,
            intent: 'add_transaction' as const,
            installments: finalInstallments,
          };
          setPendingInstallmentData(null);

          const installmentText = finalInstallments > 1 ? ` (${finalInstallments}x de R$ ${(completed.amount / finalInstallments).toFixed(2)})` : '';
          const successMessage = `✅ Registrei seu gasto de R$ ${completed.amount.toFixed(2)} em ${completed.category}!${installmentText}`;

          const hasProfiles = profiles && profiles.length > 0;
          let autoProfileId: string | null = null;
          if (completed.detectedProfileName && hasProfiles) {
            const match = profiles.find((p) => p.name.toLowerCase() === completed.detectedProfileName!.toLowerCase());
            if (match) autoProfileId = match.id;
          }

          if (autoProfileId) {
            const selectedProfile = profiles!.find((p) => p.id === autoProfileId);
            const savedIds = await saveTransaction(completed, autoProfileId);
            const profileLabel = selectedProfile ? `${selectedProfile.icon} ${selectedProfile.name}` : 'Todos';
            const msg = savedIds ? `${successMessage}\n\n✅ Registrado para ${profileLabel}` : `${successMessage}\n\n⚠️ Não consegui salvar automaticamente.`;
            const assistantMsg: ChatMessage = { role: 'assistant', content: msg, local: true, transaction: savedIds ? { type: completed.type, amount: completed.amount, description: completed.description, category: completed.category, ids: savedIds } : undefined };
            setMessages((prev) => [...prev, assistantMsg]);
            persistMessage(assistantMsg);
          } else if (hasProfiles) {
            const assistantMsg: ChatMessage = { role: 'assistant', content: `${successMessage}\n\n👤 Quem está registrando?`, local: true };
            setMessages((prev) => [...prev, assistantMsg]);
            persistMessage(assistantMsg);
            setPendingTransaction({ parsed: completed, message: successMessage, local: true });
          } else {
            const savedIds = await saveTransaction(completed);
            const msg = savedIds ? successMessage : `${successMessage}\n\n⚠️ Não consegui salvar automaticamente.`;
            const assistantMsg: ChatMessage = { role: 'assistant', content: msg, local: true, transaction: savedIds ? { type: completed.type, amount: completed.amount, description: completed.description, category: completed.category, ids: savedIds } : undefined };
            setMessages((prev) => [...prev, assistantMsg]);
            persistMessage(assistantMsg);
          }
          setIsLoading(false);
          return;
        }
      }

      // Try recurring payment detection first
      const recurringResult = (!pendingFile && text) ? tryDetectRecurringPayment(text) : null;
      if (recurringResult && user) {
        clearPendingFile();
        try {
          // Create the recurring payment (amount=0 if not provided = variable bill)
          const finalAmount = recurringResult.amount || 0;

          // Create recurring payment
          await supabase.from('recurring_payments').insert({
            user_id: user.id,
            description: recurringResult.description,
            amount: finalAmount,
            category_id: recurringResult.category_id,
            day_of_month: recurringResult.day_of_month,
            type: recurringResult.type,
            notes: finalAmount === 0 ? '[Valor variável - criado via chat]' : '[Criado via chat]',
          });

          // Also create a reminder for the same bill
          const now = new Date();
          const reminderDay = recurringResult.day_of_month;
          let nextDue = new Date(now.getFullYear(), now.getMonth(), reminderDay);
          if (nextDue <= now) nextDue = new Date(now.getFullYear(), now.getMonth() + 1, reminderDay);
          const nextDueStr = format(nextDue, 'yyyy-MM-dd');

          await supabase.from('reminders').insert({
            user_id: user.id,
            name: recurringResult.description,
            amount: finalAmount,
            due_day: reminderDay,
            remind_days_before: 3,
            is_recurring: true,
            next_due_date: nextDueStr,
            notes: finalAmount === 0 ? 'Valor variável' : null,
            category_id: recurringResult.category_id,
          } as any);

          queryClient.invalidateQueries({ queryKey: ['recurring_payments'] });
          queryClient.invalidateQueries({ queryKey: ['reminders'] });

          const amountText = finalAmount > 0 ? ` de R$ ${finalAmount.toFixed(2)}` : ' (valor variável)';
          const msg = `✅ Pagamento recorrente + lembrete criados!\n\n📋 ${recurringResult.description}${amountText}\n📅 Todo dia ${recurringResult.day_of_month} do mês\n🔔 Lembrete 3 dias antes\n📁 Categoria: ${recurringResult.category}`;
          const assistantMsg: ChatMessage = { role: 'assistant', content: msg, local: true };
          setMessages((prev) => [...prev, assistantMsg]);
          persistMessage(assistantMsg);
        } catch (err) {
          console.error('Error creating recurring payment:', err);
          const errMsg: ChatMessage = { role: 'assistant', content: '❌ Erro ao criar pagamento recorrente.', local: true };
          setMessages((prev) => [...prev, errMsg]);
          persistMessage(errMsg);
        }
        setIsLoading(false);
        inputRef.current?.focus();
        return;
      }

      // Try local parsing first for text-only messages (no files)
      const localResult = (!pendingFile && text) ? tryParseLocally(text) : null;

      if (localResult && localResult.intent === 'need_amount') {
        // Parser detected a transaction but needs the amount
        clearPendingFile();
        setPendingAmountData(localResult);
        const assistantMsg: ChatMessage = { role: 'assistant', content: localResult.message, local: true };
        setMessages((prev) => [...prev, assistantMsg]);
        persistMessage(assistantMsg);
      } else if (localResult && localResult.intent === 'need_installments') {
        // Parser detected expense with amount but needs installment info
        clearPendingFile();
        setPendingInstallmentData(localResult);
        const assistantMsg: ChatMessage = { role: 'assistant', content: localResult.message, local: true };
        setMessages((prev) => [...prev, assistantMsg]);
        persistMessage(assistantMsg);
      } else if (localResult && localResult.intent === 'create_budget_limit') {
        // Local budget limit creation — no AI needed
        clearPendingFile();
        const blResult = localResult as BudgetLimitResult;
        if (user) {
          try {
            const { data: existing } = await supabase
              .from('budget_limits')
              .select('id')
              .eq('user_id', user.id)
              .eq('category_id', blResult.category_id)
              .eq('is_active', true)
              .maybeSingle();

            if (existing) {
              await supabase.from('budget_limits').update({ max_amount: blResult.amount }).eq('id', existing.id);
            } else {
              await supabase.from('budget_limits').insert({
                user_id: user.id,
                category_id: blResult.category_id,
                max_amount: blResult.amount,
              });
            }
            queryClient.invalidateQueries({ queryKey: ['budget_limits'] });
            queryClient.invalidateQueries({ queryKey: ['budget_limits_with_spending'] });
          } catch (err) {
            console.error('Error creating budget limit:', err);
          }
        }
        const assistantMsg: ChatMessage = { role: 'assistant', content: blResult.message, local: true };
        setMessages((prev) => [...prev, assistantMsg]);
        persistMessage(assistantMsg);
      } else if (localResult && localResult.intent === 'add_transaction') {
        // Local parse succeeded — skip AI call entirely
        clearPendingFile();
        const hasProfiles = profiles && profiles.length > 0;

        // Auto-match profile if detected from text
        let autoProfileId: string | null = null;
        if (localResult.detectedProfileName && hasProfiles) {
          const match = profiles.find(
            (p) => p.name.toLowerCase() === localResult.detectedProfileName!.toLowerCase()
          );
          if (match) autoProfileId = match.id;
        }

        if (autoProfileId) {
          const selectedProfile = profiles!.find((p) => p.id === autoProfileId);
          const savedIds = await saveTransaction(localResult, autoProfileId);
          const profileLabel = selectedProfile ? `${selectedProfile.icon} ${selectedProfile.name}` : 'Todos';
          const msg = savedIds
            ? `${localResult.message}\n\n✅ Registrado para ${profileLabel}`
            : `${localResult.message}\n\n⚠️ Não consegui salvar automaticamente.`;
          const assistantMsg: ChatMessage = {
            role: 'assistant',
            content: msg,
            local: true,
            transaction: savedIds
              ? { type: localResult.type, amount: localResult.amount, description: localResult.description, category: localResult.category, ids: savedIds }
              : undefined,
          };
          setMessages((prev) => [...prev, assistantMsg]);
          persistMessage(assistantMsg);
        } else if (hasProfiles) {
          const assistantMsg: ChatMessage = {
            role: 'assistant',
            content: `${localResult.message}\n\n👤 Quem está registrando?`,
            local: true,
          };
          setMessages((prev) => [...prev, assistantMsg]);
          persistMessage(assistantMsg);
          setPendingTransaction({ parsed: localResult, message: localResult.message, local: true });
        } else {
          const savedIds = await saveTransaction(localResult);
          const msg = savedIds
            ? localResult.message
            : `${localResult.message}\n\n⚠️ Não consegui salvar automaticamente.`;
          const assistantMsg: ChatMessage = {
            role: 'assistant',
            content: msg,
            local: true,
            transaction: savedIds
              ? { type: localResult.type, amount: localResult.amount, description: localResult.description, category: localResult.category, ids: savedIds }
              : undefined,
          };
          setMessages((prev) => [...prev, assistantMsg]);
          persistMessage(assistantMsg);
        }
      } else {
        // Try local overspending detection before falling back to AI
        const overspendingResult = (!pendingFile && text) ? tryDetectOverspending(text) : null;
        if (overspendingResult && user) {
          clearPendingFile();
          // Fetch top spending categories for current month
          const now = new Date();
          const monthStart = format(startOfMonth(now), 'yyyy-MM-dd');
          const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd');
          const { data: txData } = await supabase
            .from('transactions')
            .select('category_id, amount, categories(name)')
            .eq('type', 'expense')
            .gte('date', monthStart)
            .lte('date', monthEnd);

          // Group by category
          const byCategory: Record<string, { name: string; spent: number; category_id: string }> = {};
          (txData || []).forEach((tx: any) => {
            const catName = (tx.categories as any)?.name || 'Outros';
            const catId = tx.category_id;
            if (!byCategory[catId]) byCategory[catId] = { name: catName, spent: 0, category_id: catId };
            byCategory[catId].spent += Number(tx.amount);
          });
          const topCats = Object.values(byCategory)
            .sort((a, b) => b.spent - a.spent)
            .slice(0, 5)
            .filter(c => c.spent > 0);

          if (topCats.length > 0) {
            const assistantMsg: ChatMessage = { role: 'assistant', content: overspendingResult.message, local: true };
            setMessages((prev) => [...prev, assistantMsg]);
            persistMessage(assistantMsg);
            setPendingLimitSuggestion({ categories: topCats });
            setPendingLimitAmounts({});
            setIsLoading(false);
            inputRef.current?.focus();
            return;
          }
        }

        // Fallback to AI for complex messages
        const isAudioWithTranscript = isAudio && !!text;
        const isAudioWithoutTranscript = isAudio && !text;

        // If audio without transcript, don't send to AI (it would hallucinate treating audio as image)
        if (isAudioWithoutTranscript) {
          clearPendingFile();
          const errMsg: ChatMessage = {
            role: 'assistant',
            content: '🎙️ Não consegui entender o áudio. Tente falar mais perto do microfone ou digite a mensagem.',
          };
          setMessages((prev) => [...prev, errMsg]);
          persistMessage(errMsg);
          setIsLoading(false);
          return;
        }

        const [{ context: financialContext, userCategories }, userContent] = await Promise.all([
          fetchFinancialContext(),
          (async (): Promise<AIMessageContent> => {
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
          body: { messages: historyForAI, financial_context: financialContext, user_categories: userCategories },
        });

        if (error) throw error;

        if (data.error) {
          let errContent: string;
          if (data.error === 'ai_limit_reached') {
            errContent = `🚫 **Limite mensal atingido!**\n\nVocê usou **${data.monthly_calls} mensagens** este mês.\n\n💡 Em breve você poderá recarregar com **R$ ${Number(data.recharge_brl).toFixed(2).replace('.', ',')}** e liberar aproximadamente **${data.extra_messages_with_recharge} mensagens extras**.\n\n_Aguarde o sistema de pagamento ser implementado._`;
          } else {
            errContent = `⚠️ ${data.error}`;
          }
          const errMsg: ChatMessage = { role: 'assistant', content: errContent };
          setMessages((prev) => [...prev, errMsg]);
          persistMessage(errMsg);
          return;
        }

        // AI usage is now logged server-side in the chat edge function

        let assistantMsg: ChatMessage;
        if (data.intent === 'create_budget_limit') {
          // Handle budget limit creation
          if (data.amount && data.category_id && user) {
            try {
              // Check if limit already exists for this category
              const { data: existing } = await supabase
                .from('budget_limits')
                .select('id')
                .eq('user_id', user.id)
                .eq('category_id', data.category_id)
                .eq('is_active', true)
                .maybeSingle();

              if (existing) {
                // Update existing limit
                await supabase
                  .from('budget_limits')
                  .update({ max_amount: data.amount })
                  .eq('id', existing.id);
              } else {
                // Create new limit
                await supabase
                  .from('budget_limits')
                  .insert({
                    user_id: user.id,
                    category_id: data.category_id,
                    max_amount: data.amount,
                  });
              }
              queryClient.invalidateQueries({ queryKey: ['budget-limits'] });
              assistantMsg = { role: 'assistant', content: data.message };
            } catch (err) {
              console.error('Error creating budget limit:', err);
              assistantMsg = { role: 'assistant', content: `${data.message}\n\n⚠️ Não consegui criar o limite automaticamente.` };
            }
          } else {
            assistantMsg = { role: 'assistant', content: data.message || '⚠️ Não consegui identificar a categoria ou valor do limite.' };
          }
        } else if (data.intent === 'suggest_budget_limit') {
          // AI is suggesting budget limits — show message + interactive category picker
          assistantMsg = { role: 'assistant', content: data.message };
          setMessages((prev) => [...prev, assistantMsg]);
          persistMessage(assistantMsg);

          // Resolve category IDs for suggested categories
          if (data.suggested_categories && Array.isArray(data.suggested_categories)) {
            const { data: userCats } = await supabase.from('categories').select('id, name, type').eq('type', 'expense');
            const resolvedCats = data.suggested_categories.map((sc: any) => {
              const match = (userCats || []).find((c: any) => c.name.toLowerCase() === sc.name.toLowerCase());
              return { name: sc.name, spent: sc.spent, category_id: match?.id };
            }).filter((c: any) => c.category_id);
            if (resolvedCats.length > 0) {
              setPendingLimitSuggestion({ categories: resolvedCats });
              setPendingLimitAmounts({});
            }
          }
          setIsLoading(false);
          inputRef.current?.focus();
          return;
        } else if (data.intent === 'add_transaction' || data.intent === 'correct_last_transaction') {
          // Fallback: extract amount from message if missing
          if (!data.amount && data.message) {
            const amtMatch = data.message.match(/R\$\s*([\d.,]+)/);
            if (amtMatch) {
              data.amount = parseFloat(amtMatch[1].replace(/\./g, '').replace(',', '.'));
            }
          }
          const hasProfiles = profiles && profiles.length > 0;
          if (hasProfiles) {
            assistantMsg = {
              role: 'assistant',
              content: `${data.message}\n\n👤 Quem está registrando?`,
            };
            setMessages((prev) => [...prev, assistantMsg]);
            persistMessage(assistantMsg);
            setPendingTransaction({ parsed: data, message: data.message });
            setIsLoading(false);
            inputRef.current?.focus();
            return;
          }
          const savedIds = await saveTransaction(data);
          const confirmMsg = savedIds
            ? (data.message || '').replace(/📝\s*Registrando/g, '✅ Registrado').replace(/📝\s*Corrigindo/g, '✅ Corrigido').replace(/📝\s*Criando/g, '✅ Criado')
            : data.amount
              ? `${data.message}\n\n⚠️ Não consegui salvar. Tente novamente ou adicione manualmente.`
              : `${data.message}\n\n⚠️ Não consegui identificar o valor. Tente novamente informando o valor (ex: "gastei 100 com meg").`;
          assistantMsg = {
            role: 'assistant',
            content: confirmMsg,
            transaction: savedIds
              ? { type: data.type, amount: data.amount, description: data.description, category: data.category, ids: savedIds }
              : undefined,
          };
        } else {
          assistantMsg = { role: 'assistant', content: data.message };
        }

        setMessages((prev) => [...prev, assistantMsg]);
        persistMessage(assistantMsg);
      }
    } catch (err) {
      console.error('Chat error:', err);
      clearPendingFile();
      const errMsg: ChatMessage = { role: 'assistant', content: '❌ Erro ao processar sua mensagem. Tente novamente.' };
      setMessages((prev) => [...prev, errMsg]);
      persistMessage(errMsg);
    } finally {
      setIsLoading(false);
      // Play notification if user left the chat page while Dora was typing
      if (!isMountedRef.current || document.hidden) {
        playNotificationSound();
        window.dispatchEvent(new Event('maya-new-message'));
      }
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
    <div className="relative flex h-[calc(100vh-8.5rem)] md:h-[calc(100vh-6rem)] flex-col mx-auto max-w-3xl px-2">
      {/* Gradient background for glassmorphism */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-3xl">
        <div className="absolute -top-1/4 -left-1/4 h-[60%] w-[60%] rounded-full bg-primary/[0.07] blur-3xl" />
        <div className="absolute -bottom-1/4 -right-1/4 h-[50%] w-[50%] rounded-full bg-secondary/[0.07] blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[40%] w-[40%] rounded-full bg-accent/[0.05] blur-3xl" />
      </div>
      {/* Header */}
      <div className="flex items-center gap-3 py-3 px-3 mb-1 rounded-2xl bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/5 border border-border/30">
        <div className="relative">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary shadow-md">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-background" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-bold text-foreground truncate">Dora — Sua Assistente Financeira</h1>
          <p className="text-[11px] text-muted-foreground truncate">Registre gastos, envie fotos, tire dúvidas 💬</p>
        </div>
        <div className="flex items-center gap-1">
          <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground transition-colors">
                <Settings2 className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[320px] sm:w-[360px]">
              <SheetHeader>
                 <SheetTitle className="flex items-center gap-2">
                  <Settings2 className="h-5 w-5" />
                   Configurações da Dora
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                {/* Sound */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {mayaSoundEnabled ? <Volume2 className="h-4 w-4 text-primary" /> : <VolumeX className="h-4 w-4 text-muted-foreground" />}
                    <Label htmlFor="maya-sound" className="text-sm font-medium cursor-pointer">Som da Dora</Label>
                  </div>
                  <Switch
                    id="maya-sound"
                    checked={mayaSoundEnabled}
                    onCheckedChange={(v) => toggleSetting('maya-sound-enabled', v, setMayaSoundEnabled)}
                  />
                </div>

                {/* Notifications */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {mayaNotificationsEnabled ? <BellRing className="h-4 w-4 text-primary" /> : <BellOff className="h-4 w-4 text-muted-foreground" />}
                    <Label htmlFor="maya-notif" className="text-sm font-medium cursor-pointer">Notificações da Dora</Label>
                  </div>
                  <Switch
                    id="maya-notif"
                    checked={mayaNotificationsEnabled}
                    onCheckedChange={(v) => toggleSetting('maya-notifications-enabled', v, setMayaNotificationsEnabled)}
                  />
                </div>

                <Separator />

                {/* Reports */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                    <FileBarChart className="h-3.5 w-3.5" />
                    Relatórios automáticos
                  </p>
                  <p className="text-[11px] text-muted-foreground mb-3">
                    Relatórios gerados automaticamente com seus dados reais, sem usar IA.
                  </p>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="maya-weekly" className="text-sm font-medium cursor-pointer">Relatório semanal</Label>
                          <p className="text-[11px] text-muted-foreground mt-0.5">Resumo todo domingo</p>
                        </div>
                        <Switch
                          id="maya-weekly"
                          checked={weeklyReportEnabled}
                          onCheckedChange={(v) => toggleSetting('maya-weekly-report', v, setWeeklyReportEnabled)}
                        />
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[11px] text-primary h-6 px-2"
                          onClick={() => setReportPreview(reportPreview === 'weekly' ? null : 'weekly')}
                        >
                          {reportPreview === 'weekly' ? 'Ocultar prévia' : '👁️ Ver prévia'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-[11px] h-6 px-2"
                          disabled={generatingReport === 'weekly'}
                          onClick={async () => {
                            if (!user) return;
                            setGeneratingReport('weekly');
                            try {
                              const content = await generateWeeklyReport(user.id);
                              const reportMsg: ChatMessage = { role: 'assistant', content };
                              setMessages((prev) => [...prev, reportMsg]);
                              await supabase.from('chat_messages').insert({
                                user_id: user.id,
                                role: 'assistant',
                                content,
                              });
                              setSettingsOpen(false);
                              toast({ title: '📊 Relatório semanal gerado!' });
                            } catch {
                              toast({ title: 'Erro ao gerar relatório', variant: 'destructive' });
                            } finally {
                              setGeneratingReport(null);
                            }
                          }}
                        >
                          {generatingReport === 'weekly' ? <Loader2 className="h-3 w-3 animate-spin" /> : '📊 Gerar agora'}
                        </Button>
                      </div>
                      {reportPreview === 'weekly' && (
                        <div className="mt-2 rounded-xl border border-border/50 bg-muted/30 p-3 text-xs whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                          {renderMarkdown(generateWeeklyPreview())}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="maya-monthly" className="text-sm font-medium cursor-pointer">Relatório mensal</Label>
                          <p className="text-[11px] text-muted-foreground mt-0.5">Resumo no 1º dia do mês</p>
                        </div>
                        <Switch
                          id="maya-monthly"
                          checked={monthlyReportEnabled}
                          onCheckedChange={(v) => toggleSetting('maya-monthly-report', v, setMonthlyReportEnabled)}
                        />
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[11px] text-primary h-6 px-2"
                          onClick={() => setReportPreview(reportPreview === 'monthly' ? null : 'monthly')}
                        >
                          {reportPreview === 'monthly' ? 'Ocultar prévia' : '👁️ Ver prévia'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-[11px] h-6 px-2"
                          disabled={generatingReport === 'monthly'}
                          onClick={async () => {
                            if (!user) return;
                            setGeneratingReport('monthly');
                            try {
                              const content = await generateMonthlyReport(user.id);
                              const reportMsg: ChatMessage = { role: 'assistant', content };
                              setMessages((prev) => [...prev, reportMsg]);
                              await supabase.from('chat_messages').insert({
                                user_id: user.id,
                                role: 'assistant',
                                content,
                              });
                              setSettingsOpen(false);
                              toast({ title: '📊 Relatório mensal gerado!' });
                            } catch {
                              toast({ title: 'Erro ao gerar relatório', variant: 'destructive' });
                            } finally {
                              setGeneratingReport(null);
                            }
                          }}
                        >
                          {generatingReport === 'monthly' ? <Loader2 className="h-3 w-3 animate-spin" /> : '📊 Gerar agora'}
                        </Button>
                      </div>
                      {reportPreview === 'monthly' && (
                        <div className="mt-2 rounded-xl border border-border/50 bg-muted/30 p-3 text-xs whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                          {renderMarkdown(generateMonthlyPreview())}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => {
                    playNotificationSound();
                    toast({ title: '🔔 Som de teste', description: mayaSoundEnabled ? 'Você ouviu o som!' : 'O som está desativado.' });
                  }}
                >
                  <Volume2 className="h-3.5 w-3.5 mr-2" />
                  Testar som de notificação
                </Button>

                <Separator />

                {/* Clear history */}
                {messages.length > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full text-xs"
                    disabled={clearingHistory}
                    onClick={() => {
                      setSettingsOpen(false);
                      setTimeout(() => setShowClearConfirm(true), 400);
                    }}
                  >
                    {clearingHistory ? (
                      <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                    ) : (
                      <Eraser className="h-3.5 w-3.5 mr-2" />
                    )}
                    {clearingHistory ? 'Limpando...' : 'Limpar histórico de conversa'}
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <DeleteConfirmDialog
        open={showClearConfirm}
        onOpenChange={setShowClearConfirm}
        onConfirm={clearHistory}
        title="Limpar histórico"
        description="Tem certeza que deseja limpar todo o histórico de conversa com a Dora? Essa ação não pode ser desfeita."
      />

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 px-2 pb-2 pt-4">
        {loadingHistory ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <motion.div
              className="relative"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="h-16 w-16 rounded-full overflow-hidden bg-secondary/10 relative">
                <img src={mayaAvatarNeutral} alt="Dora" className="h-full w-full object-cover" />
                {/* Blink overlay */}
                <motion.div
                  className="absolute inset-0 bg-secondary/10 rounded-full"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0, 0, 0.15, 0, 0, 0, 0, 0.15, 0] }}
                  transition={{ duration: 3, delay: 0.8, ease: 'easeInOut' }}
                />
              </div>
              {/* Online indicator */}
              <motion.div
                className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-emerald-500 border-2 border-background"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: 'spring', stiffness: 500, damping: 15 }}
              />
            </motion.div>
            <div>
              <motion.p
                className="text-sm font-medium text-foreground"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
              >
                Olá! Eu sou a Dora{' '}
                <motion.span
                  className="inline-block origin-bottom-right"
                  initial={{ rotate: 0 }}
                  animate={{ rotate: [0, 20, -10, 20, -5, 10, 0] }}
                  transition={{ duration: 1.2, delay: 0.6, ease: 'easeInOut' }}
                >
                  👋
                </motion.span>
              </motion.p>
              <motion.p
                className="text-xs text-muted-foreground mt-1"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.4 }}
              >
                Registre gastos, envie fotos de recibos ou pergunte sobre suas finanças
              </motion.p>
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
          <motion.div
            key={msg.id || i}
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              'flex gap-2 max-w-[85%]',
              msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
            )}
          >
            <div
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full overflow-hidden shadow-sm',
                msg.role === 'user'
                  ? 'bg-gradient-to-br from-primary to-primary/80'
                  : 'bg-gradient-to-br from-secondary/20 to-secondary/10 ring-1 ring-border/30'
              )}
            >
              {msg.role === 'user' ? (
                avatarUrl ? (
                  <img src={avatarUrl} alt="Você" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-4 w-4 text-primary-foreground" />
                )
              ) : (
                <img src={mayaAvatarNeutral} alt="Dora" className="h-full w-full object-cover" />
              )}
            </div>
            <div
              className={cn(
                'rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm',
                msg.role === 'user'
                  ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-tr-sm'
                  : 'bg-gradient-to-br from-muted to-muted/80 text-foreground rounded-tl-sm border border-border/20 dark:from-muted dark:to-muted/60'
              )}
            >
              {msg.audioUrl ? (
                <AudioPlayerBubble src={msg.audioUrl} isUser={msg.role === 'user'} />
              ) : (
                <>
                  {msg.imagePreview && (
                    <img src={msg.imagePreview} alt="Anexo" className="rounded-xl mb-2.5 max-h-44 object-cover shadow-sm" />
                  )}
                  <div className="whitespace-pre-wrap">
                    {renderMarkdown(msg.content)}
                  </div>
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-1 mt-2 pt-1.5 border-t border-foreground/5">
                      <span className="text-[10px] text-muted-foreground/50 font-medium">
                        {msg.content.startsWith('📊 **Relatório') ? '📊 Automático' : msg.local ? '⚡ Instantâneo' : '🤖 IA'}
                      </span>
                    </div>
                  )}
                </>
              )}
              {msg.transaction && (
                <div className={cn(
                  "mt-2.5 rounded-xl p-2.5 text-xs space-y-1",
                  msg.role === 'user' ? 'bg-primary-foreground/10' : 'bg-background/60 border border-border/20'
                )}>
                  {msg.transaction.undone ? (
                    <p className="text-muted-foreground italic">🔄 Transação desfeita</p>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tipo:</span>
                        <span className={msg.transaction.type === 'income' ? 'text-success font-medium' : 'text-destructive font-medium'}>
                          {msg.transaction.type === 'income' ? '↗ Receita' : '↘ Despesa'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Valor:</span>
                        <span className="font-semibold">R$ {msg.transaction.amount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Categoria:</span>
                        <span>{msg.transaction.category}</span>
                      </div>
                      {msg.transaction.ids && msg.transaction.ids.length > 0 && (
                        <button
                          onClick={() => setUndoConfirm({ msgIndex: i, ids: msg.transaction!.ids! })}
                          className="flex items-center gap-1 mt-1.5 pt-1.5 border-t border-border/20 text-muted-foreground hover:text-destructive transition-colors w-full"
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
          </motion.div>
        ))}

        {/* Profile picker for pending transaction */}
        {pendingTransaction && (
          <div className="flex gap-2 mr-auto max-w-[85%]">
            <div className="h-7 w-7 shrink-0 rounded-full overflow-hidden bg-secondary/20">
              <img src={mayaAvatarNeutral} alt="Dora" className="h-full w-full object-cover" />
            </div>
            <div className="rounded-2xl px-3.5 py-2.5 text-sm bg-muted text-foreground rounded-tl-md">
              <div className="flex flex-wrap gap-2">
                {(profiles || [])
                  .slice()
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleProfileSelect(p.id)}
                      className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border border-border hover:bg-primary/10 hover:border-primary transition-all"
                    >
                      <span>{p.icon}</span>
                      {p.name}
                    </button>
                  ))}
                <button
                  onClick={() => handleProfileSelect(null)}
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border border-border hover:bg-primary/10 hover:border-primary transition-all"
                >
                  👥 Todos
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Budget limit suggestion picker */}
        {pendingLimitSuggestion && (
          <div className="flex gap-2 mr-auto max-w-[85%]">
            <div className="h-7 w-7 shrink-0 rounded-full overflow-hidden bg-secondary/20">
              <img src={mayaAvatarNeutral} alt="Dora" className="h-full w-full object-cover" />
            </div>
            <div className="rounded-2xl px-3.5 py-3 text-sm bg-muted text-foreground rounded-tl-md border border-border/20 space-y-3">
              <p className="text-xs font-medium">📊 Selecione as categorias e defina o limite:</p>
              {pendingLimitSuggestion.categories.map((cat) => (
                <div key={cat.name} className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-xs flex-1">
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={pendingLimitAmounts[cat.name] !== undefined}
                      onChange={(e) => {
                        setPendingLimitAmounts((prev) => {
                          const next = { ...prev };
                          if (e.target.checked) {
                            next[cat.name] = String(Math.round(cat.spent * 0.9));
                          } else {
                            delete next[cat.name];
                          }
                          return next;
                        });
                      }}
                    />
                    <span className="font-medium">{cat.name}</span>
                    <span className="text-muted-foreground">(gasto: R$ {cat.spent.toFixed(0)})</span>
                  </label>
                  {pendingLimitAmounts[cat.name] !== undefined && (
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-muted-foreground">R$</span>
                      <input
                        type="number"
                        className="w-20 h-7 rounded-md border border-border bg-background px-2 text-xs"
                        value={pendingLimitAmounts[cat.name]}
                        onChange={(e) => setPendingLimitAmounts((prev) => ({ ...prev, [cat.name]: e.target.value }))}
                        min={1}
                      />
                    </div>
                  )}
                </div>
              ))}
              <div className="flex gap-2 pt-1">
                <Button
                  size="sm"
                  className="text-xs h-7"
                  disabled={Object.keys(pendingLimitAmounts).length === 0}
                  onClick={async () => {
                    if (!user) return;
                    const selected = Object.entries(pendingLimitAmounts);
                    let created = 0;
                    for (const [catName, amountStr] of selected) {
                      const amount = parseFloat(amountStr);
                      if (isNaN(amount) || amount <= 0) continue;
                      const cat = pendingLimitSuggestion.categories.find((c) => c.name === catName);
                      if (!cat?.category_id) continue;

                      const { data: existing } = await supabase
                        .from('budget_limits')
                        .select('id')
                        .eq('user_id', user.id)
                        .eq('category_id', cat.category_id)
                        .eq('is_active', true)
                        .maybeSingle();

                      if (existing) {
                        await supabase.from('budget_limits').update({ max_amount: amount }).eq('id', existing.id);
                      } else {
                        await supabase.from('budget_limits').insert({ user_id: user.id, category_id: cat.category_id, max_amount: amount });
                      }
                      created++;
                    }
                    queryClient.invalidateQueries({ queryKey: ['budget_limits'] });
                    queryClient.invalidateQueries({ queryKey: ['budget_limits_with_spending'] });
                    setPendingLimitSuggestion(null);
                    setPendingLimitAmounts({});
                    const confirmMsg: ChatMessage = { role: 'assistant', content: `✅ ${created} limite(s) criado(s) com sucesso!`, local: true };
                    setMessages((prev) => [...prev, confirmMsg]);
                    persistMessage(confirmMsg);
                  }}
                >
                  ✅ Criar limites
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => {
                    setPendingLimitSuggestion(null);
                    setPendingLimitAmounts({});
                    const declineMsg: ChatMessage = { role: 'assistant', content: 'Ok, sem problemas! Se precisar criar limites depois, é só me pedir. 😉', local: true };
                    setMessages((prev) => [...prev, declineMsg]);
                    persistMessage(declineMsg);
                  }}
                >
                  Agora não
                </Button>
              </div>
            </div>
          </div>
        )}


        {isLoading && (
          <div className="flex gap-2 mr-auto max-w-[85%]">
            <div className="h-7 w-7 shrink-0 rounded-full overflow-hidden bg-secondary/20">
              <img src={mayaAvatarNeutral} alt="Dora" className="h-full w-full object-cover" />
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
      <div className="px-2 py-2.5">
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
            className="flex items-center gap-2 rounded-2xl border border-border/30 bg-background/40 backdrop-blur-xl px-2 py-1.5 transition-all focus-within:border-primary/40 focus-within:bg-background/60 focus-within:shadow-[0_0_0_3px_hsl(var(--primary)/0.08)]"
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
            <div className="flex items-center gap-0.5 shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-primary/10 transition-colors"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
              >
                <ImagePlus className="h-4 w-4 text-muted-foreground" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-primary/10 transition-colors"
                onClick={() => setCameraOpen(true)}
                disabled={isLoading}
              >
                <Camera className="h-4 w-4 text-muted-foreground" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-primary/10 transition-colors"
                onClick={startRecording}
                disabled={isLoading}
              >
                <Mic className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={pendingFile ? 'Comentário...' : 'Ex: gastei 50 com marmita...'}
              className="flex-1 min-w-0 bg-transparent py-1.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              className={cn(
                "h-9 w-9 rounded-full shrink-0 transition-all duration-200",
                (input.trim() || pendingFile) && !isLoading
                  ? "bg-primary hover:bg-primary/90 shadow-md shadow-primary/25 scale-100"
                  : "bg-muted text-muted-foreground scale-95"
              )}
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

      <CameraCapture
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={handleCameraPhoto}
      />
    </div>
  );
}
