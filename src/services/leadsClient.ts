import { supabase } from '@/integrations/supabase/client';

export type Lead = {
  id: string;
  name: string;
  email: string;
  whatsapp: string | null;
  consent: boolean;
  status: string;
  subscription_type: string | null;
  user_type: string | null;
  payment_method: string | null;
  payment_date: string | null;
  canceled_at: string | null;
  subscription_end: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  created_at: string;
};

export async function getLeads(): Promise<Lead[]> {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as Lead[];
}
