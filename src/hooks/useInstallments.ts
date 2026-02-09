import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface Installment {
  id: string;
  user_id: string;
  name: string;
  total_amount: number;
  installment_count: number;
  installment_paid: number;
  installment_value: number | null;
  manual_value: boolean;
  next_due_date: string;
  card_id: string | null;
  is_completed: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface InstallmentInsert {
  name: string;
  total_amount: number;
  installment_count: number;
  installment_paid?: number;
  installment_value?: number | null;
  manual_value?: boolean;
  next_due_date: string;
  card_id?: string | null;
  notes?: string;
}

export function useInstallments() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['installments', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('installments' as any)
        .select('*')
        .eq('user_id', user!.id)
        .order('next_due_date', { ascending: true });
      if (error) throw error;
      return (data as any[]) as Installment[];
    },
    enabled: !!user,
  });

  const create = useMutation({
    mutationFn: async (item: InstallmentInsert) => {
      const { error } = await supabase
        .from('installments' as any)
        .insert({ ...item, user_id: user!.id } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['installments'] });
      toast.success('Parcela cadastrada!');
    },
    onError: () => toast.error('Erro ao cadastrar parcela'),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Installment> & { id: string }) => {
      const { error } = await supabase
        .from('installments' as any)
        .update(updates as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['installments'] });
      toast.success('Parcela atualizada!');
    },
    onError: () => toast.error('Erro ao atualizar parcela'),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('installments' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['installments'] });
      toast.success('Parcela excluída!');
    },
    onError: () => toast.error('Erro ao excluir parcela'),
  });

  return {
    installments: query.data ?? [],
    isLoading: query.isLoading,
    create,
    update,
    remove,
  };
}
