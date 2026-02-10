import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, Copy, Trash2 } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { useUpdateTransaction, useDuplicateTransaction, useDeleteTransaction, Transaction } from '@/hooks/useTransactions';
import { InlineCategoryCreate } from '@/components/InlineCategoryCreate';
import { CategoryIcon } from '@/components/CategoryIcon';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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
  const [installments, setInstallments] = useState('1');
  const [createCategoryOpen, setCreateCategoryOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const { data: categories } = useCategories(transaction?.type || 'expense');
  const updateTransaction = useUpdateTransaction();
  const duplicateTransaction = useDuplicateTransaction();
  const deleteTransaction = useDeleteTransaction();

  useEffect(() => {
    if (transaction) {
      setDescription(transaction.description);
      setAmount(String(transaction.amount));
      setCategoryId(transaction.category_id);
      setDate(transaction.date);
      setNotes(transaction.notes || '');
      setInstallments(String(transaction.installment_total || 1));
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

  const handleDuplicate = async () => {
    if (!transaction) return;
    await duplicateTransaction.mutateAsync(transaction);
    toast.success('Transação duplicada com a data de hoje');
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!transaction) return;
    await deleteTransaction.mutateAsync({ id: transaction.id, installment_group_id: transaction.installment_group_id });
    toast.success('Transação excluída');
    setDeleteConfirmOpen(false);
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
              <Label htmlFor="edit-installments">Parcelas</Label>
              <Select value={installments} onValueChange={setInstallments}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 48 }, (_, i) => i + 1).map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n === 1 ? 'À vista' : `${n}x`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

            <div className="flex flex-col gap-2">
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

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={handleDuplicate}
                  disabled={duplicateTransaction.isPending}
                >
                  {duplicateTransaction.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Duplicar
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 gap-2 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => setDeleteConfirmOpen(true)}
                >
                  <Trash2 className="h-4 w-4" />
                  Excluir
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={handleDelete}
      />

      <InlineCategoryCreate
        open={createCategoryOpen}
        onOpenChange={setCreateCategoryOpen}
        type={transaction?.type || 'expense'}
        onCreated={handleCategoryCreated}
      />
    </>
  );
}
