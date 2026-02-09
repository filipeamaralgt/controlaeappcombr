import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { useUpdateTransaction, Transaction } from '@/hooks/useTransactions';
import { InlineCategoryCreate } from '@/components/InlineCategoryCreate';

interface EditTransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction | null;
}

export function EditTransactionModal({ open, onOpenChange, transaction }: EditTransactionModalProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [createCategoryOpen, setCreateCategoryOpen] = useState(false);

  const { data: categories } = useCategories(transaction?.type || 'expense');
  const updateTransaction = useUpdateTransaction();

  useEffect(() => {
    if (transaction) {
      setDescription(transaction.description);
      setAmount(String(transaction.amount));
      setCategoryId(transaction.category_id);
      setDate(transaction.date);
      setNotes(transaction.notes || '');
    }
  }, [transaction]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transaction || !description || !amount || !categoryId) return;

    await updateTransaction.mutateAsync({
      id: transaction.id,
      description,
      amount: parseFloat(amount),
      category_id: categoryId,
      date,
      notes: notes || undefined,
    });

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
            <DialogTitle>Editar Transação</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-description">Descrição</Label>
              <Input
                id="edit-description"
                placeholder="Ex: Supermercado"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-amount">Valor (R$)</Label>
              <Input
                id="edit-amount"
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
              <Select value={categoryId} onValueChange={setCategoryId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                        {cat.name}
                      </div>
                    </SelectItem>
                  ))}
                  {/* Create new category option */}
                  <div
                    className="relative flex w-full cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                    onClick={() => {
                      setCreateCategoryOpen(true);
                    }}
                  >
                    <Plus className="h-3.5 w-3.5 text-primary" />
                    <span className="text-primary font-medium">Criar nova categoria</span>
                  </div>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-date">Data</Label>
              <Input
                id="edit-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-notes">Observação (opcional)</Label>
              <Textarea
                id="edit-notes"
                placeholder="Alguma observação..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={updateTransaction.isPending}
            >
              {updateTransaction.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Salvar Alterações'
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <InlineCategoryCreate
        open={createCategoryOpen}
        onOpenChange={setCreateCategoryOpen}
        type={transaction?.type || 'expense'}
        onCreated={handleCategoryCreated}
      />
    </>
  );
}
