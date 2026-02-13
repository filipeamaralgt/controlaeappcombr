
-- Create subscriptions table
CREATE TABLE public.subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  provider text NOT NULL DEFAULT 'stripe',
  status text NOT NULL DEFAULT 'trial',
  plan text NOT NULL DEFAULT 'mensal',
  external_id text,
  current_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscription
CREATE POLICY "Users can view own subscription"
ON public.subscriptions FOR SELECT
USING (auth.uid() = user_id);

-- Service role can manage (edge functions)
CREATE POLICY "Service role can insert subscriptions"
ON public.subscriptions FOR INSERT
WITH CHECK (true);

CREATE POLICY "Service role can update subscriptions"
ON public.subscriptions FOR UPDATE
USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index for fast lookups
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE UNIQUE INDEX idx_subscriptions_external_id ON public.subscriptions(external_id) WHERE external_id IS NOT NULL;
