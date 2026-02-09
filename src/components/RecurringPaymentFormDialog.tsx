import { useState, useEffect } from 'react';
import { Plus, Loader2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import type { RecurringPayment } from '@/hooks/useRecurringPayments';

interface Category {
  id: string;
  name: string;
  color: string;
  type: string;
}

interface RecurringPaymentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[] | undefined;
  editingPayment: RecurringPayment | null;
  isPending: boolean;
  onSubmit: (data: {
    description: string;
    amount: number;
    category_id: string;
    day_of_month: number;
    notes?: string;
  }) => Promise<void>;
}

export function RecurringPaymentFormDialog({
  open,
  onOpenChange,
  categories,
  editingPayment,
  isPending,
  onSubmit,
}: RecurringPaymentFormDialogProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [dayOfMonth, setDayOfMonth] = useState('1');
  const [notes, setNotes] = useState('');

  const isEditing = !!editingPayment;

  useEffect(() => {
    if (editingPayment) {
      setDescription(editingPayment.description);
      setAmount(String(editingPayment.amount));
      setCategoryId(editingPayment.category_id);
      setDayOfMonth(String(editingPayment.day_of_month));
      setNotes(editingPayment.notes || '');
    } else {
      setDescription('');
      setAmount('');
      setCategoryId('');
      setDayOfMonth('1');
      setNotes('');
    }
  }, [editingPayment, open]);

  const handleSubmit = async () => {
    if (!description.trim() || !amount || !categoryId) return;

    await onSubmit({
      description: description.trim(),
      amount: parseFloat(amount),
      category_id: categoryId,
      day_of_month: parseInt(dayOfMonth),
      notes: notes.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Pagamento Recorrente' : 'Novo Pagamento Recorrente'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Descrição *</Label>
            <Input
              placeholder="Ex: Aluguel, Netflix, Salário..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
            <Label>Categoria *</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
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
            <Label>Dia do Mês</Label>
            <Input
              type="number"
              min="1"
              max="31"
              value={dayOfMonth}
              onChange={(e) => setDayOfMonth(e.target.value)}
            />
          </div>
          <div>
            <Label>Observações</Label>
            <Input
              placeholder="Opcional"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <Button onClick={handleSubmit} disabled={isPending || !description.trim() || !amount || !categoryId} className="w-full">
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : isEditing ? (
              <Pencil className="mr-2 h-4 w-4" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            {isEditing ? 'Salvar Alterações' : 'Criar Pagamento'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
