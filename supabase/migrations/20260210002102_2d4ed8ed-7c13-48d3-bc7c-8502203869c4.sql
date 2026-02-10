
-- Table to track each AI call for usage/cost monitoring
CREATE TABLE public.ai_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  model text NOT NULL DEFAULT 'google/gemini-3-flash-preview',
  tokens_input int DEFAULT 0,
  tokens_output int DEFAULT 0,
  estimated_cost numeric DEFAULT 0,
  intent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- Users can insert their own logs
CREATE POLICY "Users can insert own ai_usage_logs"
ON public.ai_usage_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own logs
CREATE POLICY "Users can view own ai_usage_logs"
ON public.ai_usage_logs
FOR SELECT
USING (auth.uid() = user_id);

-- Index for admin queries
CREATE INDEX idx_ai_usage_logs_user_id ON public.ai_usage_logs (user_id);
CREATE INDEX idx_ai_usage_logs_created_at ON public.ai_usage_logs (created_at);
