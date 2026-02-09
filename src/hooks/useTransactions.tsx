import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { addMonths, format } from 'date-fns';

export interface Transaction {
  id: string;
  user_id: string;
  category_id: string;
  description: string;
  amount: number;
  date: string;
  type: 'expense' | 'income';
  installment_number: number;
  installment_total: number;
  installment_group_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  categories?: {
    id: string;
    name: string;
    color: string;
    type: string;
  };
}

interface TransactionFilters {
  type: 'expense' | 'income';
  startDate?: string;
  endDate?: string;
}

export function useTransactions(filters: TransactionFilters) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['transactions', filters],
    queryFn: async () => {
      let query = supabase
        .from('transactions')
        .select('*, categories(id, name, color, type)')
        .eq('type', filters.type)
        .order('date', { ascending: false });

      if (filters.startDate) {
        query = query.gte('date', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('date', filters.endDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Transaction[];
    },
    enabled: !!user,
  });
}

interface CreateTransactionInput {
  description: string;
  amount: number;
  category_id: string;
  date: string;
  type: 'expense' | 'income';
  installments: number;
  notes?: string;
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateTransactionInput) => {
      const { installments, ...rest } = input;
      const installmentAmount = Number((input.amount / installments).toFixed(2));
      const groupId = installments > 1 ? crypto.randomUUID() : null;

      const transactions = Array.from({ length: installments }, (_, i) => ({
        ...rest,
        user_id: user!.id,
        amount: i === installments - 1
          ? Number((input.amount - installmentAmount * (installments - 1)).toFixed(2))
          : installmentAmount,
        date: format(addMonths(new Date(input.date), i), 'yyyy-MM-dd'),
        installment_number: i + 1,
        installment_total: installments,
        installment_group_id: groupId,
      }));

      const { data, error } = await supabase.from('transactions').insert(transactions).select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; description?: string; amount?: number; category_id?: string; date?: string; notes?: string }) => {
      const { data, error } = await supabase.from('transactions').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}
