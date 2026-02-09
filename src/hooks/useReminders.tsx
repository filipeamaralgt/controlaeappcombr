import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Reminder {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  due_day: number;
  remind_days_before: number;
  is_recurring: boolean;
  is_active: boolean;
  next_due_date: string;
  last_notified_date: string | null;
  notes: string | null;
  category_id: string | null;
  created_at: string;
  updated_at: string;
  categories?: {
    id: string;
    name: string;
    color: string;
    type: string;
  } | null;
}

export function useReminders() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['reminders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reminders')
        .select('*, categories(id, name, color, type)')
        .order('next_due_date');
      if (error) throw error;
      return data as unknown as Reminder[];
    },
    enabled: !!user,
  });
}

export function useCreateReminder() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (reminder: {
      name: string;
      amount: number;
      due_day: number;
      remind_days_before: number;
      is_recurring: boolean;
      next_due_date: string;
      notes?: string;
      category_id?: string;
    }) => {
      const { data, error } = await supabase
        .from('reminders')
        .insert({ ...reminder, user_id: user!.id } as any)
        .select('*, categories(id, name, color, type)')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    },
  });
}

export function useUpdateReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { data, error } = await supabase
        .from('reminders')
        .update(updates as any)
        .eq('id', id)
        .select('*, categories(id, name, color, type)')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    },
  });
}

export function useDeleteReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('reminders').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    },
  });
}

export interface PatternSuggestion {
  description: string;
  amount: number;
  day_of_month: number;
  occurrences: number;
  category_id: string;
  category_name: string;
  category_color: string;
}

export function useDetectPatterns() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['reminder-patterns'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('detect-recurring-patterns');
      if (error) throw error;
      return (data?.suggestions || []) as PatternSuggestion[];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 10, // 10 min
  });
}
