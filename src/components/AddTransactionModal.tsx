import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { useCreateTransaction } from '@/hooks/useTransactions';
import { InlineCategoryCreate } from '@/components/InlineCategoryCreate';
import { CategoryIcon } from '@/components/CategoryIcon';
import { format } from 'date-fns';
import { ProfileSelector } from '@/components/ProfileSelector';
import { cn } from '@/lib/utils';

interface AddTransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'expense' | 'income';
}

export function AddTransactionModal({ open, onOpenChange, type }: AddTransactionModalProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [installments, setInstallments] = useState('1');
  const [notes, setNotes] = useState('');
  const [profileId, setProfileId] = useState<string | null>(null);
  const [createCategoryOpen, setCreateCategoryOpen] = useState(false);

  const { data: categories } = useCategories(type);
  const createTransaction = useCreateTransaction();

  const resetForm = () => {
    setDescription('');
    setAmount('');
    setCategoryId('');
    setDate(format(new Date(), 'yyyy-MM-dd'));
    setInstallments('1');
    setNotes('');
    setProfileId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !categoryId) return;

    await createTransaction.mutateAsync({
      description,
      amount: parseFloat(amount),
      category_id: categoryId,
      date,
      type,
      installments: parseInt(installments) || 1,
      notes: notes || undefined,
      profile_id: profileId,
    });

    resetForm();
    onOpenChange(false);
  };

  const handleCategoryCreated = (newCategoryId: string) => {
    setCategoryId(newCategoryId);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {type === 'expense' ? 'Nova Despesa' : 'Nova Receita'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                placeholder="Ex: Supermercado"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Valor (R$)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Categoria</Label>
              <div className="grid grid-cols-4 gap-2">
                {categories?.map((cat) => {
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
                <button
                  type="button"
                  onClick={() => setCreateCategoryOpen(true)}
                  className="flex flex-col items-center gap-1 rounded-xl p-2 transition-all hover:bg-muted/60"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-dashed border-primary/50">
                    <Plus className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-[10px] font-medium text-primary text-center leading-tight">
                    Criar nova
                  </span>
                </button>
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
              <div className="space-y-2">
                <Label htmlFor="installments">Parcelas</Label>
                <Select value={installments} onValueChange={setInstallments}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    {Array.from({ length: 12 }, (_, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>
                        {i + 1}x
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <ProfileSelector value={profileId} onChange={setProfileId} type={type} date={date} />

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
        onOpenChange={setCreateCategoryOpen}
        type={type}
        onCreated={handleCategoryCreated}
      />
    </>
  );
}
