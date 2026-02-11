import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface BudgetLimit {
  id: string;
  user_id: string;
  category_id: string;
  max_amount: number;
  is_active: boolean;
  profile_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface BudgetLimitWithSpending extends BudgetLimit {
  spent: number;
  percentage: number;
  category_name: string;
  category_icon: string;
  category_color: string;
}

export function useBudgetLimits() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['budget_limits'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budget_limits')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as BudgetLimit[];
    },
    enabled: !!user,
  });
}

export function useBudgetLimitsWithSpending() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['budget_limits_with_spending'],
    queryFn: async () => {
      // Get limits
      const { data: limits, error: limitsError } = await supabase
        .from('budget_limits')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (limitsError) throw limitsError;

      if (!limits || limits.length === 0) return [];

      // Get categories for these limits
      const categoryIds = (limits as any[]).map((l: any) => l.category_id);
      const { data: categories, error: catError } = await supabase
        .from('categories')
        .select('*')
        .in('id', categoryIds);
      if (catError) throw catError;

      // Get current month transactions
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      const { data: transactions, error: txError } = await supabase
        .from('transactions')
        .select('category_id, amount')
        .eq('type', 'expense')
        .gte('date', startOfMonth)
        .lte('date', endOfMonth)
        .in('category_id', categoryIds);
      if (txError) throw txError;

      // Sum spending per category
      const spendingMap: Record<string, number> = {};
      (transactions as any[] || []).forEach((tx: any) => {
        spendingMap[tx.category_id] = (spendingMap[tx.category_id] || 0) + Number(tx.amount);
      });

      const catMap: Record<string, any> = {};
      (categories as any[] || []).forEach((c: any) => {
        catMap[c.id] = c;
      });

      return (limits as any[]).map((limit: any) => {
        const cat = catMap[limit.category_id];
        const spent = spendingMap[limit.category_id] || 0;
        const percentage = limit.max_amount > 0 ? Math.round((spent / limit.max_amount) * 100) : 0;
        return {
          ...limit,
          spent,
          percentage,
          category_name: cat?.name || 'Categoria',
          category_icon: cat?.icon || 'circle',
          category_color: cat?.color || '#6366f1',
        } as BudgetLimitWithSpending;
      });
    },
    enabled: !!user,
  });
}

export function useCreateBudgetLimit() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: { category_id: string; max_amount: number }) => {
      const { data: result, error } = await supabase
        .from('budget_limits')
        .insert({ ...data, user_id: user!.id } as any)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget_limits'] });
      queryClient.invalidateQueries({ queryKey: ['budget_limits_with_spending'] });
    },
  });
}

export function useUpdateBudgetLimit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; max_amount?: number; is_active?: boolean }) => {
      const { data, error } = await supabase
        .from('budget_limits')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget_limits'] });
      queryClient.invalidateQueries({ queryKey: ['budget_limits_with_spending'] });
    },
  });
}

export function useDeleteBudgetLimit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('budget_limits').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget_limits'] });
      queryClient.invalidateQueries({ queryKey: ['budget_limits_with_spending'] });
    },
  });
}
