import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface SpendingProfile {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export function useSpendingProfiles() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['spending_profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('spending_profiles' as any)
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as unknown as SpendingProfile[];
    },
    enabled: !!user,
  });
}

interface CreateProfileInput {
  name: string;
  icon: string;
  color: string;
}

export function useCreateSpendingProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateProfileInput) => {
      const { data, error } = await supabase
        .from('spending_profiles' as any)
        .insert({ ...input, user_id: user!.id } as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as SpendingProfile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spending_profiles'] });
    },
  });
}

export function useUpdateSpendingProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; icon?: string; color?: string }) => {
      const { data, error } = await supabase
        .from('spending_profiles' as any)
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as SpendingProfile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spending_profiles'] });
    },
  });
}

export function useDeleteSpendingProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('spending_profiles' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spending_profiles'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}
