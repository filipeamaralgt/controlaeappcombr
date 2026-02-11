import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { addMonths, format, parseISO } from 'date-fns';

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
    icon: string;
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
        .select('*, categories(id, name, color, icon, type)')
        .eq('type', filters.type)
        .order('date', { ascending: false });

      if (filters.startDate) {
        query = query.gte('date', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('date', filters.endDate);
      }

      // Fetch all rows (Supabase default limit is 1000)
      // Use pagination to get everything
      const allData: any[] = [];
      const pageSize = 1000;
      let from = 0;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await query.range(from, from + pageSize - 1);
        if (error) throw error;
        allData.push(...(data || []));
        hasMore = (data?.length || 0) === pageSize;
        from += pageSize;
      }

      return allData as Transaction[];
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
  profile_id?: string | null;
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateTransactionInput) => {
      const { installments, profile_id, ...rest } = input;
      const installmentAmount = Number((input.amount / installments).toFixed(2));
      const groupId = installments > 1 ? crypto.randomUUID() : null;
      // parseISO('YYYY-MM-DD') keeps the date in local time (prevents -1 day issues)
      const baseDate = parseISO(input.date);

      const transactions = Array.from({ length: installments }, (_, i) => ({
        ...rest,
        user_id: user!.id,
        amount: i === installments - 1
          ? Number((input.amount - installmentAmount * (installments - 1)).toFixed(2))
          : installmentAmount,
        date: format(addMonths(baseDate, i), 'yyyy-MM-dd'),
        installment_number: i + 1,
        installment_total: installments,
        installment_group_id: groupId,
        profile_id: profile_id || null,
      }));

      const { data, error } = await supabase.from('transactions').insert(transactions).select();
      if (error) throw error;

      // Auto-create installment tracking entry when parcelado
      if (installments > 1) {
        const installmentValue = Number((input.amount / installments).toFixed(2));
        // Get category name for the installment label if description is empty
        let installmentName = input.description?.trim();
        if (!installmentName) {
          const { data: catData } = await supabase
            .from('categories')
            .select('name')
            .eq('id', input.category_id)
            .single();
          installmentName = catData?.name || 'Parcela';
        }
        await supabase
          .from('installments' as any)
          .insert({
            user_id: user!.id,
            name: installmentName,
            total_amount: input.amount,
            installment_count: installments,
            installment_paid: 0,
            installment_value: installmentValue,
            next_due_date: input.date,
            profile_id: profile_id || null,
          } as any);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['installments'] });
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
    mutationFn: async ({ id, installment_group_id }: { id: string; installment_group_id?: string | null }) => {
      if (installment_group_id) {
        // Delete all transactions in the installment group
        const { error } = await supabase.from('transactions').delete().eq('installment_group_id', installment_group_id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('transactions').delete().eq('id', id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['installments'] });
    },
  });
}

export function useDuplicateTransaction() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (transaction: Transaction) => {
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          user_id: user!.id,
          description: transaction.description,
          amount: transaction.amount,
          category_id: transaction.category_id,
          date: format(new Date(), 'yyyy-MM-dd'),
          type: transaction.type,
          notes: transaction.notes,
          installment_number: 1,
          installment_total: 1,
          installment_group_id: null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}
