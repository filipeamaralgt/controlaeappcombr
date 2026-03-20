import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, Bell } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { useCreateReminder } from '@/hooks/useReminders';
import { useSpendingProfiles } from '@/hooks/useSpendingProfiles';
import { useCreateTransaction } from '@/hooks/useTransactions';
import { useCards } from '@/hooks/useCards';
import { InlineCategoryCreate } from '@/components/InlineCategoryCreate';
import { CategoryIcon } from '@/components/CategoryIcon';
import { format, addMonths } from 'date-fns';
import { ProfileSelector } from '@/components/ProfileSelector';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface AddTransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'expense' | 'income';
}

export function AddTransactionModal({ open, onOpenChange, type }: AddTransactionModalProps) {
  const navigate = useNavigate();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [installments, setInstallments] = useState('1');
  const [notes, setNotes] = useState('');
  const [profileId, setProfileId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');
  const [expenseType, setExpenseType] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [cardId, setCardId] = useState<string | null>(null);
  const [createCategoryOpen, setCreateCategoryOpen] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [createReminder, setCreateReminder] = useState(false);
  const createCategoryOpenRef = useRef(false);

  const { data: categories } = useCategories(type);
  const { data: profiles } = useSpendingProfiles();
  const createTransaction = useCreateTransaction();
  const { cards } = useCards();
  const createReminderMutation = useCreateReminder();

  const defaultProfileId = useMemo(() => {
    if (!profiles || profiles.length === 0) return null;
    const sorted = [...profiles].sort((a, b) => a.name.localeCompare(b.name));
    return sorted[0].id;
  }, [profiles]);

  useEffect(() => {
    if (open && defaultProfileId) {
      setProfileId(defaultProfileId);
    }
    if (open) {
      setStatus(type === 'income' ? 'received' : 'paid');
      setExpenseType(type === 'expense' ? 'variable' : '');
    }
    if (!open) {
      setShowAllCategories(false);
    }
  }, [open, defaultProfileId, type]);

  const resetForm = () => {
    setDescription('');
    setAmount('');
    setCategoryId('');
    setDate(format(new Date(), 'yyyy-MM-dd'));
    setInstallments('1');
    setNotes('');
    setProfileId(defaultProfileId);
    setStatus(type === 'income' ? 'received' : 'paid');
    setExpenseType(type === 'expense' ? 'variable' : '');
    setPaymentMethod('');
    setCardId(null);
    setShowAllCategories(false);
    setCreateReminder(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !categoryId) return;

    await createTransaction.mutateAsync({
      description,
      amount: parseFloat(amount),
      category_id: categoryId,
      date,
      type,
      installments: parseInt(installments) || 1,
      notes: notes || undefined,
      profile_id: profileId,
      status: status || null,
      expense_type: type === 'expense' ? (expenseType || null) : null,
      payment_method: paymentMethod || null,
      card_id: (paymentMethod === 'credit' || paymentMethod === 'debit') ? (cardId || null) : null,
    });

    const wasFixedExpense = type === 'expense' && expenseType === 'fixed';
    const shouldCreateReminder = wasFixedExpense && createReminder;
    const reminderData = shouldCreateReminder ? {
      name: description || categories?.find(c => c.id === categoryId)?.name || 'Despesa fixa',
      amount: parseFloat(amount),
      due_day: new Date(date).getDate(),
      remind_days_before: 3,
      is_recurring: true,
      next_due_date: format(addMonths(new Date(date), 1), 'yyyy-MM-dd'),
      category_id: categoryId,
      profile_id: profileId,
    } : null;

    resetForm();
    onOpenChange(false);

    if (reminderData) {
      try {
        await createReminderMutation.mutateAsync(reminderData);
        toast.success('Despesa fixa criada com lembrete!', {
          action: {
            label: 'Ver Lembretes',
            onClick: () => navigate('/lembretes'),
          },
          duration: 5000,
        });
      } catch {
        toast.success('Despesa fixa criada, mas houve erro ao criar o lembrete.');
      }
    } else if (wasFixedExpense) {
      toast.success('Despesa fixa criada e adicionada aos Pagamentos Regulares!', {
        action: {
          label: 'Ver Pagamentos',
          onClick: () => navigate('/pagamentos'),
        },
        duration: 5000,
      });
    }
  };

  const handleCategoryCreated = (newCategoryId: string) => {
    setCategoryId(newCategoryId);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => {
          if (!v && createCategoryOpenRef.current) return;
          onOpenChange(v);
        }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {type === 'expense' ? 'Nova Despesa' : 'Nova Receita'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Valor (R$)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="Digite o valor"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>

            <div className="space-y-2">
              <Label>Categoria</Label>
              <div className="grid grid-cols-4 gap-2">
                {(showAllCategories ? categories : categories?.slice(0, 7))?.map((cat) => {
                  const isSelected = categoryId === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategoryId(cat.id)}
                      className={cn(
                        'flex flex-col items-center gap-1 rounded-xl p-2 transition-all',
                        isSelected
                          ? 'ring-2 ring-primary ring-offset-2 ring-offset-background bg-muted'
                          : 'hover:bg-muted/60'
                      )}
                    >
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-full"
                        style={{ backgroundColor: cat.color }}
                      >
                        <CategoryIcon iconName={cat.icon} className="h-5 w-5 text-white" />
                      </div>
                      <span className="text-[10px] font-medium text-foreground text-center leading-tight line-clamp-2">
                        {cat.name}
                      </span>
                    </button>
                  );
                })}
                {!showAllCategories && categories && categories.length > 7 ? (
                  <button
                    type="button"
                    onClick={() => setShowAllCategories(true)}
                    className="flex flex-col items-center gap-1 rounded-xl p-2 transition-all hover:bg-muted/60"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted-foreground/20">
                      <Plus className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground text-center leading-tight">
                      Mais
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setCreateCategoryOpen(true); createCategoryOpenRef.current = true; }}
                    className="flex flex-col items-center gap-1 rounded-xl p-2 transition-all hover:bg-muted/60"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-dashed border-primary/50">
                      <Plus className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-[10px] font-medium text-primary text-center leading-tight">
                      Criar nova
                    </span>
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            {type === 'expense' && (
              <>
                {parseInt(installments) > 1 ? (
                  <div className="space-y-2">
                    <Label htmlFor="installments">Parcelas</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="h-9 w-9 shrink-0"
                        onClick={() => setInstallments(String(Math.max(1, (parseInt(installments) || 1) - 1)))}
                      >
                        −
                      </Button>
                      <Input
                        id="installments"
                        type="number"
                        min="1"
                        max="999"
                        value={installments}
                        onChange={(e) => setInstallments(e.target.value)}
                        placeholder="1"
                        className="w-20 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="h-9 w-9 shrink-0"
                        onClick={() => setInstallments(String((parseInt(installments) || 1) + 1))}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => setInstallments('2')}
                  >
                    Parcelar compra
                  </Button>
                )}
              </>
            )}


            <div className="space-y-2">
              <Label htmlFor="notes">Observação (opcional)</Label>
              <Textarea
                id="notes"
                placeholder="Alguma observação..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={createTransaction.isPending}
            >
              {createTransaction.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Salvar'
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <InlineCategoryCreate
        open={createCategoryOpen}
        onOpenChange={(v) => { setCreateCategoryOpen(v); createCategoryOpenRef.current = v; }}
        type={type}
        onCreated={handleCategoryCreated}
      />
    </>
  );
}
