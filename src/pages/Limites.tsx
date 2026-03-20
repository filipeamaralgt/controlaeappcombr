import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Plus, Trash2, Pencil, Gauge, TrendingUp, AlertTriangle, ShieldAlert, ShieldCheck, Clock } from 'lucide-react';
import { GreenPageHeader } from '@/components/GreenPageHeader';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type StatusLevel = 'safe' | 'caution' | 'warning' | 'exceeded';

function getStatusLevel(percentage: number): StatusLevel {
  if (percentage >= 100) return 'exceeded';
  if (percentage >= 90) return 'warning';
  if (percentage >= 70) return 'caution';
  return 'safe';
}

function getStatusConfig(level: StatusLevel) {
  switch (level) {
    case 'safe':
      return {
        barColor: 'bg-emerald-500',
        textColor: 'text-emerald-600 dark:text-emerald-400',
        bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
        borderColor: 'border-emerald-200 dark:border-emerald-800/50',
        icon: ShieldCheck,
        message: 'Dentro do limite. Continue assim!',
      };
    case 'caution':
      return {
        barColor: 'bg-amber-500',
        textColor: 'text-amber-600 dark:text-amber-400',
        bgColor: 'bg-amber-50 dark:bg-amber-950/30',
        borderColor: 'border-amber-200 dark:border-amber-800/50',
        icon: TrendingUp,
        message: 'Atenção: se aproximando do limite.',
      };
    case 'warning':
      return {
        barColor: 'bg-red-500',
        textColor: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-50 dark:bg-red-950/30',
        borderColor: 'border-red-200 dark:border-red-800/50',
        icon: AlertTriangle,
        message: 'Cuidado! Você está muito perto do limite.',
      };
    case 'exceeded':
      return {
        barColor: 'bg-red-600',
        textColor: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-50 dark:bg-red-950/30',
        borderColor: 'border-red-300 dark:border-red-800/50',
        icon: ShieldAlert,
        message: 'Limite excedido!',
      };
  }
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function BudgetCard({
  limit,
  onEdit,
  onDelete,
}: {
  limit: BudgetLimitWithSpending;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const level = getStatusLevel(limit.percentage);
  const config = getStatusConfig(level);
  const StatusIcon = config.icon;
  const daysRemaining = limit.days_in_month - limit.day_of_month;

  return (
    <Card className={cn('border transition-all', config.borderColor)}>
      <CardContent className="p-4 space-y-3">
        {/* Top row: icon, name, actions */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: limit.category_color + '20' }}
            >
              <CategoryIcon iconName={limit.category_icon} className="w-5 h-5" style={{ color: limit.category_color }} />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm leading-tight">{limit.category_name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatCurrency(limit.spent)} de {formatCurrency(limit.max_amount)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={onEdit}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={onDelete}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className={cn('font-bold tabular-nums', config.textColor)}>
              {limit.percentage}%
            </span>
            <span className="text-muted-foreground tabular-nums">
              {limit.remaining > 0
                ? `Restam ${formatCurrency(limit.remaining)}`
                : `Excedeu ${formatCurrency(limit.spent - limit.max_amount)}`}
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-muted/60 overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-500', config.barColor)}
              style={{ width: `${Math.min(limit.percentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Smart insights */}
        <div className={cn('rounded-lg px-3 py-2 flex items-start gap-2', config.bgColor)}>
          <StatusIcon className={cn('w-4 h-4 shrink-0 mt-0.5', config.textColor)} />
          <div className="space-y-0.5">
            <p className={cn('text-xs font-medium', config.textColor)}>
              {config.message}
            </p>
            {/* Prediction */}
            {level !== 'exceeded' && limit.days_until_exceeded !== null && limit.days_until_exceeded <= daysRemaining && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Previsão: pode estourar em {limit.days_until_exceeded} {limit.days_until_exceeded === 1 ? 'dia' : 'dias'}
              </p>
            )}
            {level !== 'exceeded' && limit.daily_rate > 0 && (
              <p className="text-xs text-muted-foreground">
                Média diária: {formatCurrency(limit.daily_rate)}/dia
              </p>
            )}
            {level === 'exceeded' && (
              <p className="text-xs text-muted-foreground">
                Excedeu em {formatCurrency(limit.spent - limit.max_amount)}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
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

  // Summary stats
  const totalBudget = (limits || []).reduce((a, l) => a + l.max_amount, 0);
  const totalSpent = (limits || []).reduce((a, l) => a + l.spent, 0);
  const overallPct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
  const overallLevel = getStatusLevel(overallPct);
  const overallConfig = getStatusConfig(overallLevel);

  return (
    <div className="min-h-screen pb-24">
      <GreenPageHeader title="Limites Mensais" subtitle="Controle seus gastos por categoria" />

      <div className="px-4 pt-6 max-w-3xl mx-auto space-y-4">
        {/* Overall summary */}
        {limits && limits.length > 0 && (
          <Card className="border-0 bg-gradient-to-br from-card to-muted/30 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">Uso geral do mês</p>
                <span className={cn('text-sm font-bold tabular-nums', overallConfig.textColor)}>
                  {overallPct}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted/60 overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all duration-500', overallConfig.barColor)}
                  style={{ width: `${Math.min(overallPct, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2 tabular-nums">
                {formatCurrency(totalSpent)} gasto de {formatCurrency(totalBudget)} planejado
              </p>
            </CardContent>
          </Card>
        )}

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
                <CardContent className="p-5 h-28" />
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
            {limits.map(limit => (
              <BudgetCard
                key={limit.id}
                limit={limit}
                onEdit={() => openEdit(limit)}
                onDelete={() => setDeleteId(limit.id)}
              />
            ))}
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
