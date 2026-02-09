import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useEffect } from 'react';

export interface Category {
  id: string;
  user_id: string | null;
  name: string;
  color: string;
  icon: string;
  type: 'expense' | 'income';
  is_default: boolean;
  created_at: string;
}

export function useCategories(type?: 'expense' | 'income') {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Realtime subscription for automatic updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('categories-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'categories',
        },
        () => {
          // Invalidate all category queries when any change happens
          queryClient.invalidateQueries({ queryKey: ['categories'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return useQuery({
    queryKey: ['categories', type],
    queryFn: async () => {
      let query = supabase.from('categories').select('*');
      if (type) query = query.eq('type', type);
      query = query.order('is_default', { ascending: false }).order('name');
      const { data, error } = await query;
      if (error) throw error;
      return (data as unknown as Category[]);
    },
    enabled: !!user,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (category: { name: string; color: string; icon: string; type: 'expense' | 'income' }) => {
      const { data, error } = await supabase.from('categories').insert({
        ...category,
        user_id: user!.id,
        is_default: false,
      } as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; color?: string; icon?: string }) => {
      const { data, error } = await supabase.from('categories').update(updates as any).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}
