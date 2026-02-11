import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface Card {
  id: string;
  user_id: string;
  name: string;
  institution: string;
  closing_day: number;
  due_day: number;
  credit_limit: number;
  current_bill: number;
  profile_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CardInsert {
  name: string;
  institution: string;
  closing_day: number;
  due_day: number;
  credit_limit?: number;
  current_bill?: number;
  profile_id?: string | null;
}

export function useCards() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const cardsQuery = useQuery({
    queryKey: ['cards', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cards' as any)
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as any[]) as Card[];
    },
    enabled: !!user,
  });

  const createCard = useMutation({
    mutationFn: async (card: CardInsert) => {
      const { error } = await supabase
        .from('cards' as any)
        .insert({ ...card, user_id: user!.id } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      toast.success('Cartão cadastrado!');
    },
    onError: () => toast.error('Erro ao cadastrar cartão'),
  });

  const updateCard = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Card> & { id: string }) => {
      const { error } = await supabase
        .from('cards' as any)
        .update(updates as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      toast.success('Cartão atualizado!');
    },
    onError: () => toast.error('Erro ao atualizar cartão'),
  });

  const deleteCard = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('cards' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      toast.success('Cartão excluído!');
    },
    onError: () => toast.error('Erro ao excluir cartão'),
  });

  return {
    cards: cardsQuery.data ?? [],
    isLoading: cardsQuery.isLoading,
    createCard,
    updateCard,
    deleteCard,
  };
}
