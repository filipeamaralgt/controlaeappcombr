import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface RecurringPayment {
  id: string;
  user_id: string;
  category_id: string;
  description: string;
  amount: number;
  day_of_month: number;
  type: 'expense' | 'income';
  is_active: boolean;
  notes: string | null;
  last_generated_date: string | null;
  created_at: string;
  updated_at: string;
  categories?: {
    id: string;
    name: string;
    color: string;
    type: string;
  };
}

export function useRecurringPayments(type?: 'expense' | 'income') {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['recurring_payments', type],
    queryFn: async () => {
      let query = supabase
        .from('recurring_payments')
        .select('*, categories(id, name, color, type)')
        .order('day_of_month');

      if (type) query = query.eq('type', type);

      const { data, error } = await query;
      if (error) throw error;
      return data as RecurringPayment[];
    },
    enabled: !!user,
  });
}

export function useCreateRecurringPayment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (payment: {
      description: string;
      amount: number;
      category_id: string;
      day_of_month: number;
      type: 'expense' | 'income';
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('recurring_payments')
        .insert({
          ...payment,
          user_id: user!.id,
        })
        .select('*, categories(id, name, color, type)')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring_payments'] });
    },
  });
}

export function useUpdateRecurringPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string;
      description?: string;
      amount?: number;
      category_id?: string;
      day_of_month?: number;
      is_active?: boolean;
      notes?: string | null;
    }) => {
      const { data, error } = await supabase
        .from('recurring_payments')
        .update(updates)
        .eq('id', id)
        .select('*, categories(id, name, color, type)')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring_payments'] });
    },
  });
}

export function useDeleteRecurringPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('recurring_payments')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring_payments'] });
    },
  });
}

export function useGenerateRecurringTransactions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('generate-recurring-transactions');
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['recurring_payments'] });
    },
  });
}
