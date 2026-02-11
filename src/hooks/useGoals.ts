import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface Goal {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  category: string;
  goal_type: string;
  current_amount: number;
  target_amount: number;
  is_completed: boolean;
  profile_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface GoalInsert {
  name: string;
  icon: string;
  category: string;
  goal_type: string;
  current_amount: number;
  target_amount: number;
  profile_id?: string | null;
}

export function useGoals() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const goalsQuery = useQuery({
    queryKey: ['goals', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('goals' as any)
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as any[]) as Goal[];
    },
    enabled: !!user,
  });

  const createGoal = useMutation({
    mutationFn: async (goal: GoalInsert) => {
      const { error } = await supabase
        .from('goals' as any)
        .insert({ ...goal, user_id: user!.id } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      toast.success('Meta criada!');
    },
    onError: () => toast.error('Erro ao criar meta'),
  });

  const updateGoal = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Goal> & { id: string }) => {
      const { error } = await supabase
        .from('goals' as any)
        .update(updates as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      toast.success('Meta atualizada!');
    },
    onError: () => toast.error('Erro ao atualizar meta'),
  });

  const deleteGoal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('goals' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      toast.success('Meta excluída!');
    },
    onError: () => toast.error('Erro ao excluir meta'),
  });

  return {
    goals: goalsQuery.data ?? [],
    isLoading: goalsQuery.isLoading,
    createGoal,
    updateGoal,
    deleteGoal,
  };
}
