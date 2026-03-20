import { useState } from 'react';
import { useGoals, GoalInsert, Goal } from '@/hooks/useGoals';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Plus, Target } from 'lucide-react';
import { GreenPageHeader } from '@/components/GreenPageHeader';
import { useProfileFilter } from '@/hooks/useProfileFilter';
import { useSpendingProfiles } from '@/hooks/useSpendingProfiles';
import { AnimatePresence } from 'framer-motion';
import GoalCard from '@/components/GoalCard';
import GoalFormDialog from '@/components/GoalFormDialog';

const defaultForm: GoalInsert = {
  name: '',
  icon: '🎯',
  category: 'Outro',
  goal_type: 'Médio prazo',
  current_amount: 0,
  target_amount: 0,
  profile_id: null,
  deadline: null,
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
    : goals.filter((g) => !g.profile_id);

  const handleOpen = () => {
    const autoProfile = profiles?.length === 1 ? profiles[0].id : profileFilter;
    setForm({ ...defaultForm, profile_id: autoProfile || null });
    setEditingId(null);
    setOpen(true);
  };

  const handleEdit = (goal: Goal) => {
    setForm({
      name: goal.name,
      icon: goal.icon,
      category: goal.category,
      goal_type: goal.goal_type,
      current_amount: goal.current_amount,
      target_amount: goal.target_amount,
      profile_id: goal.profile_id || null,
      deadline: goal.deadline || null,
    });
    setEditingId(goal.id);
    setOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name.trim() || form.target_amount <= 0) return;
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

  // Summary stats
  const totalSaved = filteredGoals.reduce((s, g) => s + g.current_amount, 0);
  const totalTarget = filteredGoals.reduce((s, g) => s + g.target_amount, 0);
  const formatCurrency = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="min-h-screen pb-24">
      <GreenPageHeader title="Metas" subtitle="Suas conquistas financeiras" />

      <div className="px-4 pt-6 max-w-3xl mx-auto space-y-5">
        {/* Summary when there are goals */}
        {filteredGoals.length > 0 && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total guardado</p>
                <p className="text-lg font-bold text-foreground tabular-nums">{formatCurrency(totalSaved)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Objetivo total</p>
                <p className="text-lg font-bold text-primary tabular-nums">{formatCurrency(totalTarget)}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add button */}
        <Button
          onClick={handleOpen}
          className="w-full gap-2 rounded-xl h-12 text-base font-semibold shadow-md"
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
            <CardContent className="flex flex-col items-center gap-3 py-14">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Target className="h-8 w-8 text-primary/50" />
              </div>
              <p className="text-muted-foreground text-center">
                Nenhuma meta criada ainda.<br />
                <span className="text-sm">Comece definindo seu primeiro objetivo!</span>
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredGoals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onEdit={handleEdit}
                  onDelete={(id) => setDeleteId(id)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Create/Edit Dialog */}
        <GoalFormDialog
          open={open}
          onOpenChange={setOpen}
          editingId={editingId}
          form={form}
          setForm={setForm}
          onSubmit={handleSubmit}
          isPending={createGoal.isPending || updateGoal.isPending}
          profiles={profiles}
        />

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
