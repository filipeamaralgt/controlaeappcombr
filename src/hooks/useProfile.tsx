import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export function useProfile() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user!.id)
        .single();
      if (error) throw error;
      return data as Profile;
    },
    enabled: !!user,
  });

  const email = user?.email || '';
  const displayName = query.data?.display_name || email.split('@')[0] || '';
  const initials = displayName.slice(0, 2).toUpperCase();
  const avatarUrl = query.data?.avatar_url || undefined;

  return {
    ...query,
    profile: query.data,
    displayName,
    initials,
    avatarUrl,
    email,
  };
}
