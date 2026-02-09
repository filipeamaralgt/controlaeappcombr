import { useState, useEffect } from 'react';
import { Plus, Loader2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  if (candidate <= now) {
    candidate.setMonth(candidate.getMonth() + 1);
  }
  const y = candidate.getFullYear();
  const m = String(candidate.getMonth() + 1).padStart(2, '0');
  const d = String(Math.min(day, new Date(y, candidate.getMonth() + 1, 0).getDate())).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

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
  const [dueDay, setDueDay] = useState('1');
  const [remindDaysBefore, setRemindDaysBefore] = useState('3');
  const [isRecurring, setIsRecurring] = useState(true);
  const [notes, setNotes] = useState('');
  const [categoryId, setCategoryId] = useState('');

  const isEditing = !!editingReminder;

  useEffect(() => {
    if (editingReminder) {
      setName(editingReminder.name);
      setAmount(String(editingReminder.amount));
      setDueDay(String(editingReminder.due_day));
      setRemindDaysBefore(String(editingReminder.remind_days_before));
      setIsRecurring(editingReminder.is_recurring);
      setNotes(editingReminder.notes || '');
      setCategoryId(editingReminder.category_id || '');
    } else {
      setName('');
      setAmount('');
      setDueDay('1');
      setRemindDaysBefore('3');
      setIsRecurring(true);
      setNotes('');
      setCategoryId('');
    }
  }, [editingReminder, open]);

  const handleSubmit = async () => {
    if (!name.trim() || !amount) return;
    const day = parseInt(dueDay) || 1;
    await onSubmit({
      name: name.trim(),
      amount: parseFloat(amount),
      due_day: day,
      remind_days_before: parseInt(remindDaysBefore) || 3,
      is_recurring: isRecurring,
      next_due_date: editingReminder ? editingReminder.next_due_date : calculateNextDueDate(day),
      notes: notes.trim() || undefined,
      category_id: categoryId || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Lembrete' : 'Novo Lembrete'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Nome da conta *</Label>
            <Input
              placeholder="Ex: Aluguel, Netflix, Academia..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <Label>Valor *</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div>
            <Label>Categoria</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Opcional" />
              </SelectTrigger>
              <SelectContent>
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.color }} />
                      {cat.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Dia do vencimento</Label>
            <Input
              type="number"
              min="1"
              max="31"
              value={dueDay}
              onChange={(e) => setDueDay(e.target.value)}
            />
          </div>
          <div>
            <Label>Avisar quantos dias antes</Label>
            <Input
              type="number"
              min="0"
              max="30"
              value={remindDaysBefore}
              onChange={(e) => setRemindDaysBefore(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Repetir mensal</Label>
            <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
          </div>
          <div>
            <Label>Observações</Label>
            <Input
              placeholder="Opcional"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !name.trim() || !amount}
            className="w-full"
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : isEditing ? (
              <Pencil className="mr-2 h-4 w-4" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            {isEditing ? 'Salvar Alterações' : 'Criar Lembrete'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
