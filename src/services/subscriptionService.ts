import { supabase } from '@/integrations/supabase/client';

export interface SubscriptionRecord {
  id: string;
  user_id: string;
  provider: string;
  status: string;
  plan: string;
  external_id: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export async function getUserSubscription(userId: string): Promise<{
  premium: boolean;
  expires_at: string | null;
  provider: string | null;
  subscription: SubscriptionRecord | null;
}> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['active', 'trial'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return { premium: false, expires_at: null, provider: null, subscription: null };
  }

  const record = data as unknown as SubscriptionRecord;
  const isPremium =
    (record.status === 'active' || record.status === 'trial') &&
    !!record.current_period_end &&
    new Date(record.current_period_end) > new Date();

  return {
    premium: isPremium,
    expires_at: record.current_period_end,
    provider: record.provider,
    subscription: record,
  };
}
