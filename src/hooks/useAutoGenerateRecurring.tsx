import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Automatically triggers the generation of recurring transactions
 * once per session when the user is authenticated.
 * This ensures that active recurring payments generate their
 * monthly transactions without manual intervention.
 */
export function useAutoGenerateRecurring() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const hasRun = useRef(false);

  useEffect(() => {
    if (!user || hasRun.current) return;
    hasRun.current = true;

    const generate = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('generate-recurring-transactions');
        if (error) {
          console.error('[auto-generate] Error:', error);
          return;
        }
        if (data?.generated > 0) {
          console.log(`[auto-generate] Generated ${data.generated} transaction(s)`);
          queryClient.invalidateQueries({ queryKey: ['transactions'] });
          queryClient.invalidateQueries({ queryKey: ['recurring_payments'] });
        }
      } catch (err) {
        console.error('[auto-generate] Unexpected error:', err);
      }
    };

    generate();
  }, [user, queryClient]);
}
