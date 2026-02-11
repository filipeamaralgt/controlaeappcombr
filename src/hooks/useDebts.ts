import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface Debt {
  id: string;
  user_id: string;
  name: string;
  total_amount: number;
  paid_amount: number;
  interest_rate: number;
  due_date: string;
  is_installment: boolean;
  installment_count: number;
  installment_paid: number;
  priority: string;
  notes: string | null;
  is_paid: boolean;
  profile_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface DebtInsert {
  name: string;
  total_amount: number;
  paid_amount?: number;
  interest_rate?: number;
  due_date: string;
  is_installment?: boolean;
  installment_count?: number;
  installment_paid?: number;
  priority?: string;
  notes?: string;
  profile_id?: string | null;
}

export function useDebts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const debtsQuery = useQuery({
    queryKey: ['debts', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('debts' as any)
        .select('*')
        .eq('user_id', user!.id)
        .order('due_date', { ascending: true });
      if (error) throw error;
      return (data as any[]) as Debt[];
    },
    enabled: !!user,
  });

  const createDebt = useMutation({
    mutationFn: async (debt: DebtInsert) => {
      const { error } = await supabase
        .from('debts' as any)
        .insert({ ...debt, user_id: user!.id } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      toast.success('Dívida cadastrada!');
    },
    onError: () => toast.error('Erro ao cadastrar dívida'),
  });

  const updateDebt = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Debt> & { id: string }) => {
      const { error } = await supabase
        .from('debts' as any)
        .update(updates as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      toast.success('Dívida atualizada!');
    },
    onError: () => toast.error('Erro ao atualizar dívida'),
  });

  const deleteDebt = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('debts' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      toast.success('Dívida excluída!');
    },
    onError: () => toast.error('Erro ao excluir dívida'),
  });

  return {
    debts: debtsQuery.data ?? [],
    isLoading: debtsQuery.isLoading,
    createDebt,
    updateDebt,
    deleteDebt,
  };
}
