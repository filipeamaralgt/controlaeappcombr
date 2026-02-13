import { supabase } from '@/integrations/supabase/client';

export async function checkPremiumStatus(): Promise<boolean> {
  const { data, error } = await supabase.rpc('get_my_subscription_status');
  if (error) {
    console.error('[subscriptionService] RPC error:', error.message);
    return false;
  }
  return data === true;
}
