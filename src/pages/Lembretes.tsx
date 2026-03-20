import { useState, useMemo } from 'react';
import { Plus, Bell, Loader2, Pencil, Calendar, Sparkles, Check, MoreVertical, Trash2, CircleCheck } from 'lucide-react';
import { GreenPageHeader } from '@/components/GreenPageHeader';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO, differenceInDays, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  useReminders,
  useCreateReminder,
  useUpdateReminder,
  useDeleteReminder,
  useDetectPatterns,
  type Reminder,
  type PatternSuggestion,
} from '@/hooks/useReminders';
import { useCategories } from '@/hooks/useCategories';
import { useProfileFilter } from '@/hooks/useProfileFilter';
import { useSpendingProfiles } from '@/hooks/useSpendingProfiles';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ReminderFormDialog } from '@/components/ReminderFormDialog';

function getDueStatus(nextDueDate: string, remindDaysBefore: number) {
  const due = parseISO(nextDueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysUntil = differenceInDays(due, today);

  if (daysUntil < 0) return { label: 'Vencido', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10', dot: 'bg-red-500', urgent: true };
  if (isToday(due)) return { label: 'Vence hoje', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10', dot: 'bg-red-500', urgent: true };
  if (daysUntil <= 2) return { label: `Vence em ${daysUntil} dia${daysUntil > 1 ? 's' : ''}`, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10', dot: 'bg-amber-500', urgent: true };
  if (daysUntil <= remindDaysBefore) return { label: `Vence em ${daysUntil} dias`, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10', dot: 'bg-amber-500', urgent: true };
  return { label: `Vence em ${daysUntil} dias`, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-500/10', dot: 'bg-green-500', urgent: false };
}

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const normalizePatternText = (text: string) =>
  text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

const getPatternKey = (pattern: PatternSuggestion) =>
  `${normalizePatternText(pattern.description)}|${pattern.day_of_month}`;

export default function Lembretes() {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Reminder | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Reminder | null>(null);
  const [dismissCounts, setDismissCounts] = useState<Record<string, number>>(() => {
    try {
      const stored = localStorage.getItem('fluxy_dismissed_patterns');
      return stored ? JSON.parse(stored) : {};
    } catch { return {}; }
  });

  const { data: reminders, isLoading } = useReminders();
  const { data: categories } = useCategories();
  const { data: patterns } = useDetectPatterns();
  const { profileFilter } = useProfileFilter();
  const { data: profiles } = useSpendingProfiles();
  const createReminder = useCreateReminder();
  const updateReminder = useUpdateReminder();
  const deleteReminder = useDeleteReminder();

  const filteredPatterns = useMemo(() => {
    if (!patterns) return [];
    return patterns.filter((p) => {
      const key = getPatternKey(p);
      if (dismissCounts[key]) return false;
      const normalizedDesc = normalizePatternText(p.description);
      const day = String(p.day_of_month);
      const dismissedByLegacyKey = Object.keys(dismissCounts).some((storedKey) => {
        const parts = storedKey.split('|');
        if (parts.length < 2) return false;
        return normalizePatternText(parts[0] || '') === normalizedDesc && parts[parts.length - 1] === day;
      });
      return !dismissedByLegacyKey;
    });
  }, [patterns, dismissCounts]);

  const sortedReminders = useMemo(() => {
    if (!reminders) return [];
    const filtered = profileFilter
      ? reminders.filter((r) => r.profile_id === profileFilter)
      : reminders.filter((r) => !r.profile_id);
    return [...filtered].sort((a, b) => {
      if (a.is_active !== b.is_active) return a.is_active ? -1 : 1;
      return a.next_due_date.localeCompare(b.next_due_date);
    });
  }, [reminders, profileFilter]);

  const handleOpenCreate = () => { setEditing(null); setFormOpen(true); };
  const handleEdit = (r: Reminder) => { setEditing(r); setFormOpen(true); };

  const handleFormSubmit = async (data: any) => {
    try {
      if (editing) {
        await updateReminder.mutateAsync({ id: editing.id, ...data });
        toast.success('Lembrete atualizado!');
      } else {
        await createReminder.mutateAsync({ ...data, profile_id: profileFilter });
        toast.success('Lembrete criado!');
      }
    } catch {
      toast.error('Erro ao salvar lembrete');
      return;
    }
    setEditing(null);
    setFormOpen(false);
  };

  const handleDelete = async (id: string) => {
    try { await deleteReminder.mutateAsync(id); toast.success('Lembrete excluído!'); }
    catch { toast.error('Erro ao excluir'); }
  };

  const handleMarkPaid = async (reminder: Reminder) => {
    try {
      if (reminder.is_recurring) {
        const currentDue = parseISO(reminder.next_due_date);
        const nextMonth = new Date(currentDue);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        const y = nextMonth.getFullYear();
        const m = String(nextMonth.getMonth() + 1).padStart(2, '0');
        const daysInMonth = new Date(y, nextMonth.getMonth() + 1, 0).getDate();
        const d = String(Math.min(reminder.due_day, daysInMonth)).padStart(2, '0');
        await updateReminder.mutateAsync({
          id: reminder.id,
          next_due_date: `${y}-${m}-${d}`,
          last_notified_date: new Date().toISOString().substring(0, 10),
        });
      } else {
        await updateReminder.mutateAsync({ id: reminder.id, is_active: false });
      }
      toast.success('Marcado como pago! ✓', { duration: 2000 });
    } catch {
      toast.error('Erro ao atualizar');
    }
  };

  const handleAcceptPattern = async (pattern: PatternSuggestion) => {
    try {
      const now = new Date();
      const candidate = new Date(now.getFullYear(), now.getMonth(), pattern.day_of_month);
      if (candidate <= now) candidate.setMonth(candidate.getMonth() + 1);
      const y = candidate.getFullYear();
      const m = String(candidate.getMonth() + 1).padStart(2, '0');
      const daysInMonth = new Date(y, candidate.getMonth() + 1, 0).getDate();
      const d = String(Math.min(pattern.day_of_month, daysInMonth)).padStart(2, '0');
      await createReminder.mutateAsync({
        name: pattern.description,
        amount: pattern.amount,
        due_day: pattern.day_of_month,
        remind_days_before: 3,
        is_recurring: true,
        next_due_date: `${y}-${m}-${d}`,
        category_id: pattern.category_id,
      });
      toast.success(`Lembrete "${pattern.description}" criado!`);
    } catch { toast.error('Erro ao criar lembrete'); }
  };

  const handleDismissPattern = (pattern: PatternSuggestion) => {
    const key = getPatternKey(pattern);
    setDismissCounts((prev) => {
      const updated = { ...prev, [key]: 1 };
      localStorage.setItem('fluxy_dismissed_patterns', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <div className="min-h-screen pb-24">
      <GreenPageHeader title="Lembretes" subtitle="Não esqueça de pagar suas contas" />

      <div className="px-4 pt-6 max-w-5xl mx-auto space-y-5">
        {/* Pattern Suggestions */}
        {filteredPatterns.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  Sugestões Inteligentes
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Detectamos gastos que se repetem todo mês. Quer transformar em lembrete?
                </p>
              </CardHeader>
              <CardContent className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {filteredPatterns.map((pattern) => (
                    <motion.div
                      key={getPatternKey(pattern)}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, x: -100, transition: { duration: 0.25 } }}
                      transition={{ duration: 0.3 }}
                      className="rounded-lg border border-border/50 bg-card p-3 space-y-2"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="h-8 w-8 shrink-0 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${pattern.category_color}20` }}
                        >
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: pattern.category_color }} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground">{pattern.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(pattern.amount)} · Dia {pattern.day_of_month} · {pattern.occurrences}x nos últimos meses
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => handleDismissPattern(pattern)}>
                          Ignorar
                        </Button>
                        <Button size="sm" variant="default" className="h-7 text-xs" onClick={() => handleAcceptPattern(pattern)}>
                          <Plus className="mr-1 h-3 w-3" /> Criar
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Add Button */}
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
          <Button className="w-full h-12 text-sm font-medium rounded-xl" onClick={handleOpenCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Novo lembrete
          </Button>
        </motion.div>

        {/* Reminders List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : sortedReminders.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
            <Card className="border-border/40 bg-card">
              <CardContent className="flex flex-col items-center justify-center py-14 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                  <Bell className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-base font-semibold text-foreground">Nenhum lembrete</h3>
                <p className="mt-1.5 max-w-[260px] text-sm text-muted-foreground leading-relaxed">
                  Adicione lembretes para não esquecer de pagar suas contas.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {sortedReminders.map((reminder, index) => {
                const status = getDueStatus(reminder.next_due_date, reminder.remind_days_before);
                const dueDate = parseISO(reminder.next_due_date);

                return (
                  <motion.div
                    key={reminder.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <Card className={cn('border-border/40 transition-all duration-300', !reminder.is_active && 'opacity-50')}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          {/* Urgency dot indicator */}
                          <div className="relative h-11 w-11 shrink-0 rounded-xl flex items-center justify-center bg-muted/50">
                            <Bell className="h-5 w-5 text-muted-foreground" />
                            {reminder.is_active && (
                              <span className={cn('absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-card', status.dot)} />
                            )}
                          </div>

                          {/* Content */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="truncate text-sm font-semibold text-foreground">{reminder.name}</p>
                              <p className="shrink-0 text-sm font-bold tabular-nums text-foreground">
                                {formatCurrency(Number(reminder.amount))}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                              <Calendar className="h-3 w-3 shrink-0" />
                              <span>Dia {reminder.due_day}</span>
                              {reminder.is_recurring && (
                                <>
                                  <span>·</span>
                                  <span>Mensal</span>
                                </>
                              )}
                              {reminder.categories && (
                                <>
                                  <span>·</span>
                                  <span className="truncate">{reminder.categories.name}</span>
                                </>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1.5">
                              {reminder.is_active ? (
                                <>
                                  <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium', status.bg, status.color)}>
                                    {status.label}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground">
                                    {format(dueDate, "dd 'de' MMM", { locale: ptBR })}
                                  </span>
                                </>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-600 dark:text-green-400">
                                  <CircleCheck className="h-2.5 w-2.5" />
                                  Pago
                                </span>
                              )}
                              {reminder.is_active && reminder.remind_days_before > 0 && (
                                <span className="text-[10px] text-muted-foreground">
                                  · Aviso {reminder.remind_days_before}d antes
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-0.5 shrink-0">
                            {reminder.is_active && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 text-green-600 hover:text-green-700 hover:bg-green-500/10 active:scale-90 transition-all"
                                onClick={() => handleMarkPaid(reminder)}
                                title="Marcar como pago"
                              >
                                <Check className="h-5 w-5" />
                              </Button>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuItem onClick={() => handleEdit(reminder)}>
                                  <Pencil className="mr-2 h-3.5 w-3.5" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => setConfirmDelete(reminder)}
                                >
                                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Form Dialog */}
        <ReminderFormDialog
          open={formOpen}
          onOpenChange={(open) => { setFormOpen(open); if (!open) setEditing(null); }}
          categories={categories}
          editingReminder={editing}
          isPending={createReminder.isPending || updateReminder.isPending}
          onSubmit={handleFormSubmit}
        />

        {/* Confirm Delete */}
        <AlertDialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir lembrete?</AlertDialogTitle>
              <AlertDialogDescription>
                "{confirmDelete?.name}" será removido permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => { if (confirmDelete) { handleDelete(confirmDelete.id); setConfirmDelete(null); } }}
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
