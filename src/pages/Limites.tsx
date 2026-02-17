import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { useBudgetLimitsWithSpending, useCreateBudgetLimit, useDeleteBudgetLimit, useUpdateBudgetLimit, BudgetLimitWithSpending } from '@/hooks/useBudgetLimits';
import { useCategories } from '@/hooks/useCategories';
import { useProfileFilter } from '@/hooks/useProfileFilter';

import { CategoryIcon } from '@/components/CategoryIcon';
import { Plus, Trash2, Pencil, Gauge, AlertTriangle, XCircle, CheckCircle2 } from 'lucide-react';
import { GreenPageHeader } from '@/components/GreenPageHeader';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

function getStatusInfo(percentage: number) {
  if (percentage >= 100) return { label: 'Estourou', emoji: '🔴', colorClass: 'text-destructive', barClass: 'bg-destructive', bgClass: 'bg-destructive/10' };
  if (percentage >= 85) return { label: 'Alerta', emoji: '⚠️', colorClass: 'text-yellow-500', barClass: 'bg-yellow-500', bgClass: 'bg-yellow-500/10' };
  return { label: 'Ok', emoji: '✅', colorClass: 'text-primary', barClass: 'bg-primary', bgClass: 'bg-primary/10' };
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function Limites() {
  const { data: allLimits, isLoading } = useBudgetLimitsWithSpending();
  const { data: categories } = useCategories('expense');
  const { profileFilter } = useProfileFilter();
  const createLimit = useCreateBudgetLimit();
  const updateLimit = useUpdateBudgetLimit();
  const deleteLimit = useDeleteBudgetLimit();

  const limits = profileFilter
    ? allLimits?.filter((l) => l.profile_id === profileFilter)
    : allLimits?.filter((l) => !l.profile_id);

  const [open, setOpen] = useState(false);
  const [editingLimit, setEditingLimit] = useState<BudgetLimitWithSpending | null>(null);
  const [categoryId, setCategoryId] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Categories already with a limit
  const usedCategoryIds = new Set((limits || []).map(l => l.category_id));
  const availableCategories = (categories || []).filter(c => !usedCategoryIds.has(c.id));

  const handleSave = async () => {
    const amount = parseFloat(maxAmount);
    if (!amount || amount <= 0) {
      toast.error('Informe um valor válido');
      return;
    }

    try {
      if (editingLimit) {
        await updateLimit.mutateAsync({ id: editingLimit.id, max_amount: amount });
        toast.success('Limite atualizado!');
      } else {
        if (!categoryId) {
          toast.error('Selecione uma categoria');
          return;
        }
        await createLimit.mutateAsync({ category_id: categoryId, max_amount: amount });
        toast.success('Limite criado!');
      }
      resetForm();
    } catch {
      toast.error('Erro ao salvar limite');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteLimit.mutateAsync(deleteId);
      toast.success('Limite removido');
      setDeleteId(null);
    } catch {
      toast.error('Erro ao remover limite');
    }
  };

  const resetForm = () => {
    setOpen(false);
    setEditingLimit(null);
    setCategoryId('');
    setMaxAmount('');
  };

  const openEdit = (limit: BudgetLimitWithSpending) => {
    setEditingLimit(limit);
    setCategoryId(limit.category_id);
    setMaxAmount(String(limit.max_amount));
    setOpen(true);
  };


  return (
    <div className="min-h-screen pb-24">
      <GreenPageHeader title="Limites Mensais" subtitle="Controle seus gastos por categoria" />

      <div className="px-4 pt-6 max-w-5xl mx-auto space-y-4">
        {/* Add button */}
        <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); else setOpen(true); }}>
          <DialogTrigger asChild>
            <Button className="w-full gap-2" size="lg">
              <Plus className="w-5 h-5" />
              Novo limite
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingLimit ? 'Editar Limite' : 'Novo Limite'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              {!editingLimit && (
                <div>
                  <Label>Categoria</Label>
                  {availableCategories.length === 0 ? (
                    <p className="text-sm text-muted-foreground mt-2">Todas as categorias já têm limite</p>
                  ) : (
                    <div className="grid grid-cols-4 gap-2 mt-2 max-h-[280px] overflow-y-auto scrollbar-hide">
                      {[...availableCategories].sort((a, b) => a.name.localeCompare(b.name)).map(cat => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setCategoryId(cat.id)}
                          className={cn(
                            'flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all',
                            categoryId === cat.id
                              ? 'bg-primary/15 ring-2 ring-primary'
                              : 'hover:bg-muted'
                          )}
                        >
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: cat.color }}
                          >
                            <CategoryIcon iconName={cat.icon} className="w-5 h-5 text-white" />
                          </div>
                          <span className="text-[10px] leading-tight text-center text-foreground line-clamp-2">{cat.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div>
                <Label>Valor máximo (R$)</Label>
                <Input
                  type="number"
                  placeholder="Ex: 500"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                  min={0}
                  step={10}
                />
              </div>
              <Button onClick={handleSave} className="w-full" disabled={createLimit.isPending || updateLimit.isPending}>
                {editingLimit ? 'Salvar alteração' : 'Criar limite'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-5 h-24" />
              </Card>
            ))}
          </div>
        ) : !limits || limits.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Gauge className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-muted-foreground font-medium">Nenhum limite definido</p>
              <p className="text-sm text-muted-foreground mt-1">Crie seu primeiro limite para acompanhar seus gastos!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {limits.map(limit => {
              const status = getStatusInfo(limit.percentage);
              return (
                <Card key={limit.id} className={cn('transition-all', status.bgClass)}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-lg"
                          style={{ backgroundColor: limit.category_color + '22' }}
                        >
                          <CategoryIcon iconName={limit.category_icon} className="w-5 h-5" style={{ color: limit.category_color }} />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground text-sm">{limit.category_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(limit.spent)} / {formatCurrency(limit.max_amount)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={cn('text-sm font-bold', status.colorClass)}>
                          {limit.percentage}% {status.emoji}
                        </span>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(limit)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(limit.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="relative">
                      <Progress value={Math.min(limit.percentage, 100)} className="h-2.5" gradient />
                      {limit.percentage > 100 && (
                        <div
                          className="absolute top-0 left-0 h-2.5 rounded-full progress-gradient"
                          style={{ width: '100%' }}
                        />
                      )}
                    </div>
                    {limit.percentage >= 85 && limit.percentage < 100 && (
                      <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Atenção! Você está perto do limite.
                      </p>
                    )}
                    {limit.percentage >= 100 && (
                      <p className="text-xs text-destructive mt-2 flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" />
                        Limite excedido em {formatCurrency(limit.spent - limit.max_amount)}!
                      </p>
                    )}
                    {limit.percentage < 60 && (
                      <p className="text-xs text-primary mt-2 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Dentro do limite. Continue assim!
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <DeleteConfirmDialog
          open={!!deleteId}
          onOpenChange={(v) => { if (!v) setDeleteId(null); }}
          onConfirm={handleDelete}
          title="Remover Limite"
          description="Tem certeza que deseja remover este limite? Essa ação não pode ser desfeita."
        />
      </div>
    </div>
  );
}
