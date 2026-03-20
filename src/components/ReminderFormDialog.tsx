import { useState, useEffect, useMemo } from 'react';
import { Loader2, Pencil, Check, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Reminder } from '@/hooks/useReminders';

interface Category {
  id: string;
  name: string;
  color: string;
  type: string;
}

interface ReminderFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[] | undefined;
  editingReminder: Reminder | null;
  isPending: boolean;
  onSubmit: (data: {
    name: string;
    amount: number;
    due_day: number;
    remind_days_before: number;
    is_recurring: boolean;
    next_due_date: string;
    notes?: string;
    category_id?: string;
  }) => Promise<void>;
}

function calculateNextDueDate(day: number): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const candidate = new Date(year, month, day);
  if (candidate <= now) candidate.setMonth(candidate.getMonth() + 1);
  const y = candidate.getFullYear();
  const m = String(candidate.getMonth() + 1).padStart(2, '0');
  const d = String(Math.min(day, new Date(y, candidate.getMonth() + 1, 0).getDate())).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const REMIND_OPTIONS = [
  { value: 1, label: '1 dia' },
  { value: 2, label: '2 dias' },
  { value: 3, label: '3 dias' },
  { value: 5, label: '5 dias' },
  { value: 7, label: '7 dias' },
];

export function ReminderFormDialog({
  open,
  onOpenChange,
  categories,
  editingReminder,
  isPending,
  onSubmit,
}: ReminderFormDialogProps) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDay, setDueDay] = useState(1);
  const [remindDaysBefore, setRemindDaysBefore] = useState(3);
  const [isRecurring, setIsRecurring] = useState(true);
  const [notes, setNotes] = useState('');

  const isEditing = !!editingReminder;

  useEffect(() => {
    if (editingReminder) {
      setName(editingReminder.name);
      setAmount(String(editingReminder.amount));
      setDueDay(editingReminder.due_day);
      setRemindDaysBefore(editingReminder.remind_days_before);
      setIsRecurring(editingReminder.is_recurring);
      setNotes(editingReminder.notes || '');
    } else {
      setName('');
      setAmount('');
      setDueDay(1);
      setRemindDaysBefore(3);
      setIsRecurring(true);
      setNotes('');
    }
  }, [editingReminder, open]);

  const handleSubmit = async () => {
    if (!name.trim() || !amount) return;
    await onSubmit({
      name: name.trim(),
      amount: parseFloat(amount),
      due_day: dueDay,
      remind_days_before: remindDaysBefore,
      is_recurring: isRecurring,
      next_due_date: editingReminder ? editingReminder.next_due_date : calculateNextDueDate(dueDay),
      notes: notes.trim() || undefined,
    });
  };

  const adjustDay = (delta: number) => {
    setDueDay((prev) => Math.min(31, Math.max(1, prev + delta)));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">
            {isEditing ? 'Editar lembrete' : 'Novo lembrete'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-1">
          {/* Amount */}
          <div className="space-y-1">
            <Label className="text-center block text-xs text-muted-foreground">Valor (R$)</Label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-center text-2xl font-bold h-14 border-2 border-primary/30 focus:border-primary bg-muted/30 rounded-2xl [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <Label>Nome da conta</Label>
            <Input
              placeholder="Ex: Aluguel, Netflix, Conta de luz..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl"
            />
          </div>

          {/* Day stepper */}
          <div className="space-y-1.5">
            <Label>Dia do vencimento</Label>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-10 w-10 shrink-0 rounded-xl text-lg font-medium"
                onClick={() => adjustDay(-1)}
                disabled={dueDay <= 1}
              >
                −
              </Button>
              <div className="flex-1 text-center">
                <span className="text-2xl font-bold tabular-nums text-foreground">{dueDay}</span>
                <p className="text-[10px] text-muted-foreground mt-0.5">de cada mês</p>
              </div>
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-10 w-10 shrink-0 rounded-xl text-lg font-medium"
                onClick={() => adjustDay(1)}
                disabled={dueDay >= 31}
              >
                +
              </Button>
            </div>
          </div>

          {/* Remind days before - chip selector */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <Bell className="h-3.5 w-3.5 text-muted-foreground" />
              Avisar com antecedência
            </Label>
            <div className="flex flex-wrap gap-2">
              {REMIND_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRemindDaysBefore(opt.value)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 active:scale-95',
                    remindDaysBefore === opt.value
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Recurring toggle */}
          <div className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/30 p-3.5">
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-foreground">Repetir todo mês</p>
              <p className="text-xs text-muted-foreground">Renova automaticamente após pagar</p>
            </div>
            <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label>Observações <span className="text-muted-foreground font-normal">(opcional)</span></Label>
            <Input
              placeholder="Alguma anotação..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="rounded-xl"
            />
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={isPending || !name.trim() || !amount}
            className="w-full h-12 rounded-xl text-sm font-medium"
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : isEditing ? (
              <Pencil className="mr-2 h-4 w-4" />
            ) : (
              <Check className="mr-2 h-4 w-4" />
            )}
            {isEditing ? 'Salvar alterações' : 'Salvar lembrete'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
