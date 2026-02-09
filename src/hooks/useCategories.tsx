import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

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

  // Supabase Realtime subscription for categories
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
          // Invalidate all category queries on any change
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
    onSuccess: (newCategory) => {
      // Immediately add to cache for instant UI update
      const type = (newCategory as Category).type;
      
      // Update typed query cache
      queryClient.setQueryData<Category[]>(['categories', type], (old) => {
        if (!old) return [newCategory as Category];
        return [...old, newCategory as Category].sort((a, b) => {
          if (a.is_default !== b.is_default) return a.is_default ? -1 : 1;
          return a.name.localeCompare(b.name);
        });
      });
      
      // Also update untyped query cache
      queryClient.setQueryData<Category[]>(['categories', undefined], (old) => {
        if (!old) return [newCategory as Category];
        return [...old, newCategory as Category].sort((a, b) => {
          if (a.is_default !== b.is_default) return a.is_default ? -1 : 1;
          return a.name.localeCompare(b.name);
        });
      });

      // Also invalidate to ensure fresh data
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
