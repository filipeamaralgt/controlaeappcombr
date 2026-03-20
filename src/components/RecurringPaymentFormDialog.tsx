import { useState, useEffect } from 'react';
import { Loader2, Pencil, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { CategoryIcon } from '@/components/CategoryIcon';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { RecurringPayment } from '@/hooks/useRecurringPayments';

interface Category {
  id: string;
  name: string;
  color: string;
  type: string;
  icon?: string | null;
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
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [notes, setNotes] = useState('');
  const [isRecurring, setIsRecurring] = useState(true);

  const isEditing = !!editingPayment;

  useEffect(() => {
    if (editingPayment) {
      setDescription(editingPayment.description);
      setAmount(String(editingPayment.amount));
      setCategoryId(editingPayment.category_id);
      setDayOfMonth(editingPayment.day_of_month);
      setNotes(editingPayment.notes || '');
      setIsRecurring(editingPayment.is_active);
    } else {
      setDescription('');
      setAmount('');
      setCategoryId('');
      setDayOfMonth(1);
      setNotes('');
      setIsRecurring(true);
    }
  }, [editingPayment, open]);

  const handleSubmit = async () => {
    if (!description.trim() || !amount || !categoryId) return;

    await onSubmit({
      description: description.trim(),
      amount: parseFloat(amount),
      category_id: categoryId,
      day_of_month: dayOfMonth,
      notes: notes.trim() || undefined,
    });
  };

  const adjustDay = (delta: number) => {
    setDayOfMonth((prev) => Math.min(31, Math.max(1, prev + delta)));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">
            {isEditing ? 'Editar pagamento' : 'Novo pagamento'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-1">
          {/* Amount - hero field */}
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

          {/* Description */}
          <div className="space-y-1.5">
            <Label>Descrição</Label>
            <Input
              placeholder="Ex: Aluguel, Netflix, Conta de luz..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-xl"
            />
          </div>

          {/* Category visual picker */}
          <div className="space-y-1.5">
            <Label>Categoria</Label>
            <div className="grid grid-cols-5 gap-1.5">
              {categories?.map((cat) => {
                const isSelected = categoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className={cn(
                      'flex flex-col items-center gap-1 rounded-xl p-2 transition-all duration-150 active:scale-90 min-h-[60px]',
                      isSelected
                        ? 'bg-primary/10 ring-[1.5px] ring-primary ring-offset-1 ring-offset-background'
                        : 'hover:bg-muted/50'
                    )}
                  >
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    >
                      <CategoryIcon iconName={cat.icon} className="h-4 w-4 text-white" />
                    </div>
                    <span className={cn(
                      'text-[9px] leading-tight text-center line-clamp-1 w-full',
                      isSelected ? 'text-primary font-semibold' : 'text-muted-foreground font-medium'
                    )}>
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Day of month - stepper */}
          <div className="space-y-1.5">
            <Label>Dia do vencimento</Label>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-10 w-10 shrink-0 rounded-xl text-lg font-medium"
                onClick={() => adjustDay(-1)}
                disabled={dayOfMonth <= 1}
              >
                −
              </Button>
              <div className="flex-1 text-center">
                <span className="text-2xl font-bold tabular-nums text-foreground">{dayOfMonth}</span>
                <p className="text-[10px] text-muted-foreground mt-0.5">de cada mês</p>
              </div>
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-10 w-10 shrink-0 rounded-xl text-lg font-medium"
                onClick={() => adjustDay(1)}
                disabled={dayOfMonth >= 31}
              >
                +
              </Button>
            </div>
          </div>

          {/* Repeat toggle */}
          <div className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/30 p-3.5">
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-foreground">Repetir todo mês</p>
              <p className="text-xs text-muted-foreground">Gera automaticamente a cada mês</p>
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
            disabled={isPending || !description.trim() || !amount || !categoryId}
            className="w-full h-12 rounded-xl text-sm font-medium"
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : isEditing ? (
              <Pencil className="mr-2 h-4 w-4" />
            ) : (
              <Check className="mr-2 h-4 w-4" />
            )}
            {isEditing ? 'Salvar alterações' : 'Salvar pagamento'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
