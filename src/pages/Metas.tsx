import { useState } from 'react';
import { useGoals, GoalInsert } from '@/hooks/useGoals';
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
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Trash2, Pencil, Target } from 'lucide-react';
import { GreenPageHeader } from '@/components/GreenPageHeader';
import { useProfileFilter } from '@/hooks/useProfileFilter';
import { useSpendingProfiles } from '@/hooks/useSpendingProfiles';


import { cn } from '@/lib/utils';

const ICONS = ['✈️', '🚘', '🏡', '🎓', '💵', '💍', '🎯', '⭐', '🩺', '🏅', '🎉'];
const CATEGORIES = ['Viagem', 'Moradia', 'Educação', 'Investimento', 'Saúde', 'Lazer', 'Outro'];
const GOAL_TYPES = ['Curto prazo', 'Médio prazo', 'Longo prazo'];

const defaultForm: GoalInsert = {
  name: '',
  icon: '🎯',
  category: 'Outro',
  goal_type: 'Médio prazo',
  current_amount: 0,
  target_amount: 0,
  profile_id: null,
};

export default function Metas() {
  const { goals, isLoading, createGoal, updateGoal, deleteGoal } = useGoals();
  const { profileFilter } = useProfileFilter();
  const { data: profiles } = useSpendingProfiles();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<GoalInsert>(defaultForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filteredGoals = profileFilter
    ? goals.filter((g) => g.profile_id === profileFilter)
    : goals;

  const handleOpen = () => {
    const autoProfile = profiles?.length === 1 ? profiles[0].id : profileFilter;
    setForm({ ...defaultForm, profile_id: autoProfile || null });
    setEditingId(null);
    setOpen(true);
  };

  const handleEdit = (goal: any) => {
    setForm({
      name: goal.name,
      icon: goal.icon,
      category: goal.category,
      goal_type: goal.goal_type,
      current_amount: goal.current_amount,
      target_amount: goal.target_amount,
      profile_id: goal.profile_id || null,
    });
    setEditingId(goal.id);
    setOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    if (editingId) {
      updateGoal.mutate({ id: editingId, ...form }, { onSuccess: () => setOpen(false) });
    } else {
      createGoal.mutate(form, { onSuccess: () => setOpen(false) });
    }
  };

  const handleConfirmDelete = () => {
    if (deleteId) {
      deleteGoal.mutate(deleteId);
      setDeleteId(null);
    }
  };

  const getProgress = (current: number, target: number) => {
    if (target <= 0) return 0;
    return Math.min(100, Math.round((current / target) * 100));
  };

  const formatCurrency = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });


  return (
    <div className="min-h-screen pb-24">
      <GreenPageHeader title="Metas" subtitle="Suas conquistas financeiras" />

      <div className="px-4 pt-6 max-w-2xl mx-auto space-y-4">
        {/* Add button */}
        <Button
          onClick={handleOpen}
          className="w-full gap-2 rounded-xl bg-primary/15 text-primary hover:bg-primary/25 border border-primary/20"
          variant="ghost"
        >
          <Plus className="h-5 w-5" />
          Adicionar nova meta
        </Button>

        {/* Goals list */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : filteredGoals.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="flex flex-col items-center gap-3 py-12">
              <Target className="h-12 w-12 text-muted-foreground/40" />
              <p className="text-muted-foreground">Nenhuma meta criada ainda</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredGoals.map((goal) => {
              const progress = getProgress(goal.current_amount, goal.target_amount);
              return (
                <Card key={goal.id} className="border-border/50 bg-card overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-3xl">{goal.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-foreground truncate">{goal.name}</h3>
                          <div className="flex items-center gap-1 shrink-0 ml-2">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => handleEdit(goal)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(goal.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-1">
                          <span className="text-xs rounded-full bg-muted px-2 py-0.5 text-muted-foreground">{goal.category}</span>
                          <span className="text-xs rounded-full bg-muted px-2 py-0.5 text-muted-foreground">{goal.goal_type}</span>
                        </div>
                        <div className="mt-3">
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>{formatCurrency(goal.current_amount)}</span>
                            <span>{formatCurrency(goal.target_amount)}</span>
                          </div>
                          <Progress value={progress} className="h-2" gradient />
                          <p className="text-xs text-primary font-medium mt-1">{progress}% concluído</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar Meta' : 'Nova Meta'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome da meta</Label>
                <Input
                  placeholder="Ex: Viagem, Carro, Casa, Estudos, Reserva de emergência"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Categoria</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tipo de meta</Label>
                  <Select value={form.goal_type} onValueChange={(v) => setForm({ ...form, goal_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {GOAL_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Ícone</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setForm({ ...form, icon })}
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-full border-2 text-xl transition-all',
                        form.icon === icon
                          ? 'border-primary bg-primary/10 scale-110'
                          : 'border-border bg-secondary/50 hover:border-primary/50'
                      )}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Valor atual</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                    <Input type="number" min={0} step={0.01} className="pl-10" value={form.current_amount || ''} onChange={(e) => setForm({ ...form, current_amount: Number(e.target.value) })} />
                  </div>
                </div>
                <div>
                  <Label>Valor da meta</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                    <Input type="number" min={0} step={0.01} className="pl-10" value={form.target_amount || ''} onChange={(e) => setForm({ ...form, target_amount: Number(e.target.value) })} />
                  </div>
                </div>
              </div>
              {profiles && profiles.length > 0 && (
                <div>
                  <Label>Membro</Label>
                  <Select
                    value={form.profile_id || 'none'}
                    onValueChange={(v) => setForm({ ...form, profile_id: v === 'none' ? null : v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem perfil</SelectItem>
                      {profiles.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.icon} {p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button onClick={handleSubmit} disabled={createGoal.isPending || updateGoal.isPending || !form.name.trim()} className="w-full">
                {editingId ? 'Salvar alterações' : 'Criar meta'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete confirmation */}
        <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir meta?</AlertDialogTitle>
              <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground">
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
