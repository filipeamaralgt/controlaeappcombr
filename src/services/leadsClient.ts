import { supabase } from '@/integrations/supabase/client';

export type Lead = {
  id: string;
  name: string;
  email: string;
  consent: boolean;
  created_at: string;
};

export async function getLeads(): Promise<Lead[]> {
  const { data, error } = await supabase
    .from('leads')
    .select('id, name, email, consent, created_at')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as Lead[];
}
