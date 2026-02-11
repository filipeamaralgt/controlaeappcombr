import { useState, useMemo } from 'react';
import { Plus, Bell, Trash2, Loader2, Pencil, Calendar, AlertTriangle, Sparkles, Check } from 'lucide-react';
import { PageBackHeader } from '@/components/PageBackHeader';
import { toast } from 'sonner';
import { format, parseISO, differenceInDays, isBefore, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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

  if (daysUntil < 0) return { label: 'Vencido', color: 'text-destructive', bg: 'bg-destructive/15', urgent: true };
  if (isToday(due)) return { label: 'Vence hoje', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/15', urgent: true };
  if (daysUntil <= remindDaysBefore) return { label: `Vence em ${daysUntil} dia(s)`, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/15', urgent: true };
  return { label: `Vence em ${daysUntil} dias`, color: 'text-muted-foreground', bg: 'bg-muted/50', urgent: false };
}

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function Lembretes() {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Reminder | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Reminder | null>(null);
  const [dismissedPatterns, setDismissedPatterns] = useState<Set<string>>(new Set());

  const { data: reminders, isLoading } = useReminders();
  const { data: categories } = useCategories();
  const { data: patterns } = useDetectPatterns();
  const createReminder = useCreateReminder();
  const updateReminder = useUpdateReminder();
  const deleteReminder = useDeleteReminder();

  const filteredPatterns = useMemo(() => {
    if (!patterns) return [];
    return patterns.filter((p) => !dismissedPatterns.has(`${p.description}|${p.amount}`));
  }, [patterns, dismissedPatterns]);

  const sortedReminders = useMemo(() => {
    if (!reminders) return [];
    return [...reminders].sort((a, b) => {
      if (a.is_active !== b.is_active) return a.is_active ? -1 : 1;
      return a.next_due_date.localeCompare(b.next_due_date);
    });
  }, [reminders]);

  const handleOpenCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleEdit = (r: Reminder) => {
    setEditing(r);
    setFormOpen(true);
  };

  const handleFormSubmit = async (data: any) => {
    try {
      if (editing) {
        await updateReminder.mutateAsync({ id: editing.id, ...data });
        toast.success('Lembrete atualizado!');
      } else {
        await createReminder.mutateAsync(data);
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
    try {
      await deleteReminder.mutateAsync(id);
      toast.success('Lembrete excluído!');
    } catch {
      toast.error('Erro ao excluir');
    }
  };

  const handleMarkPaid = async (reminder: Reminder) => {
    try {
      if (reminder.is_recurring) {
        // Advance to next month
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
      toast.success('Marcado como pago!');
    } catch {
      toast.error('Erro ao atualizar');
    }
  };

  const handleAcceptPattern = async (pattern: PatternSuggestion) => {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const candidate = new Date(year, month, pattern.day_of_month);
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
    } catch {
      toast.error('Erro ao criar lembrete');
    }
  };

  const handleDismissPattern = (pattern: PatternSuggestion) => {
    setDismissedPatterns((prev) => new Set(prev).add(`${pattern.description}|${pattern.amount}`));
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
      <PageBackHeader title="Lembretes" />

      {/* Pattern Suggestions */}
      {filteredPatterns.length > 0 && (
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
            {filteredPatterns.map((pattern) => (
              <div
                key={`${pattern.description}|${pattern.amount}`}
                className="flex items-center gap-3 rounded-lg border border-border/50 bg-card p-3"
              >
                <div
                  className="h-8 w-8 shrink-0 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${pattern.category_color}20` }}
                >
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: pattern.category_color }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{pattern.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(pattern.amount)} • Dia {pattern.day_of_month} • {pattern.occurrences}x nos últimos meses
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button size="sm" variant="default" className="h-7 text-xs" onClick={() => handleAcceptPattern(pattern)}>
                    <Plus className="mr-1 h-3 w-3" /> Criar
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => handleDismissPattern(pattern)}>
                    Ignorar
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Add Button */}
      <Button className="w-full" onClick={handleOpenCreate}>
        <Plus className="mr-2 h-4 w-4" />
        Novo Lembrete
      </Button>

      {/* Reminders List */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : sortedReminders.length === 0 ? (
        <Card className="border-border/50 bg-card">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Bell className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Nenhum lembrete</h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Adicione lembretes para não esquecer de pagar suas contas.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {sortedReminders.map((reminder) => {
            const status = getDueStatus(reminder.next_due_date, reminder.remind_days_before);
            return (
              <Card
                key={reminder.id}
                className={`border-border/50 transition-opacity ${!reminder.is_active ? 'opacity-50' : ''}`}
              >
                <CardContent className="flex items-center gap-3 p-4">
                  <div
                    className="h-10 w-10 shrink-0 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: reminder.categories ? `${reminder.categories.color}20` : 'hsl(var(--primary) / 0.1)' }}
                  >
                    {status.urgent ? (
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                    ) : (
                      <Bell className="h-5 w-5 text-primary" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-foreground">{reminder.name}</p>
                      <p className="shrink-0 text-sm font-bold text-foreground">
                        {formatCurrency(Number(reminder.amount))}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                      <Calendar className="h-3 w-3 shrink-0" />
                      <span>Dia {reminder.due_day}</span>
                      {reminder.categories && (
                        <>
                          <span>•</span>
                          <span className="truncate">{reminder.categories.name}</span>
                        </>
                      )}
                      {reminder.is_recurring && <span>• Mensal</span>}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      {reminder.is_active && (
                        <span className={`inline-flex items-center gap-1 rounded-full ${status.bg} px-2 py-0.5 text-[10px] font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      )}
                      {!reminder.is_active && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                          Pago
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    {reminder.is_active && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-success hover:text-success/80"
                        onClick={() => handleMarkPaid(reminder)}
                        title="Marcar como pago"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => handleEdit(reminder)}
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => setConfirmDelete(reminder)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Form Dialog */}
      <ReminderFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
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
              onClick={() => {
                if (confirmDelete) {
                  handleDelete(confirmDelete.id);
                  setConfirmDelete(null);
                }
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
