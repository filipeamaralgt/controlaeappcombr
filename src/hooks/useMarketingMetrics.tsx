import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { subDays, format } from 'date-fns';

export interface FunnelMetric {
  id: string;
  date: string;
  visits: number;
  cta_clicks: number;
  leads: number;
  checkout_started: number;
  purchases: number;
  revenue: number;
  traffic_source: string;
  device_type: string;
  bounce_rate: number;
  avg_time_on_page: number;
  ad_spend: number;
  created_at: string;
}

export type MarketingPeriod = '7d' | '30d' | '90d' | 'custom';

export function useMarketingMetrics(period: MarketingPeriod, customRange?: { from?: Date; to?: Date }) {
  const { user } = useAuth();

  const dateRange = (() => {
    const now = new Date();
    switch (period) {
      case '7d': return { start: format(subDays(now, 7), 'yyyy-MM-dd'), end: format(now, 'yyyy-MM-dd') };
      case '30d': return { start: format(subDays(now, 30), 'yyyy-MM-dd'), end: format(now, 'yyyy-MM-dd') };
      case '90d': return { start: format(subDays(now, 90), 'yyyy-MM-dd'), end: format(now, 'yyyy-MM-dd') };
      case 'custom':
        return {
          start: customRange?.from ? format(customRange.from, 'yyyy-MM-dd') : format(subDays(now, 30), 'yyyy-MM-dd'),
          end: customRange?.to ? format(customRange.to, 'yyyy-MM-dd') : format(now, 'yyyy-MM-dd'),
        };
    }
  })();

  return useQuery({
    queryKey: ['marketing-metrics', period, dateRange.start, dateRange.end],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lp_funnel_metrics' as any)
        .select('*')
        .gte('date', dateRange.start)
        .lte('date', dateRange.end)
        .order('date', { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as FunnelMetric[];
    },
    enabled: !!user,
  });
}
