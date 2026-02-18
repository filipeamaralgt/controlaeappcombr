
-- Create marketing funnel metrics table
CREATE TABLE public.lp_funnel_metrics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date date NOT NULL DEFAULT CURRENT_DATE,
  visits integer NOT NULL DEFAULT 0,
  cta_clicks integer NOT NULL DEFAULT 0,
  leads integer NOT NULL DEFAULT 0,
  checkout_started integer NOT NULL DEFAULT 0,
  purchases integer NOT NULL DEFAULT 0,
  revenue numeric NOT NULL DEFAULT 0,
  traffic_source text NOT NULL DEFAULT 'direto',
  device_type text NOT NULL DEFAULT 'desktop',
  bounce_rate numeric DEFAULT 0,
  avg_time_on_page numeric DEFAULT 0,
  ad_spend numeric DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lp_funnel_metrics ENABLE ROW LEVEL SECURITY;

-- Only master admins can view
CREATE POLICY "Master admins can view funnel metrics"
ON public.lp_funnel_metrics
FOR SELECT
USING (
  (auth.jwt() ->> 'email'::text) = ANY (ARRAY['monicahartmann99@gmail.com'::text, 'filipeamaralgt@gmail.com'::text])
);

-- Only master admins can insert
CREATE POLICY "Master admins can insert funnel metrics"
ON public.lp_funnel_metrics
FOR INSERT
WITH CHECK (
  (auth.jwt() ->> 'email'::text) = ANY (ARRAY['monicahartmann99@gmail.com'::text, 'filipeamaralgt@gmail.com'::text])
);

-- Only master admins can update
CREATE POLICY "Master admins can update funnel metrics"
ON public.lp_funnel_metrics
FOR UPDATE
USING (
  (auth.jwt() ->> 'email'::text) = ANY (ARRAY['monicahartmann99@gmail.com'::text, 'filipeamaralgt@gmail.com'::text])
);

-- Only master admins can delete
CREATE POLICY "Master admins can delete funnel metrics"
ON public.lp_funnel_metrics
FOR DELETE
USING (
  (auth.jwt() ->> 'email'::text) = ANY (ARRAY['monicahartmann99@gmail.com'::text, 'filipeamaralgt@gmail.com'::text])
);

-- Index for date queries
CREATE INDEX idx_lp_funnel_metrics_date ON public.lp_funnel_metrics(date);
CREATE INDEX idx_lp_funnel_metrics_source ON public.lp_funnel_metrics(traffic_source);
