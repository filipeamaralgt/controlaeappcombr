
CREATE TABLE public.budget_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  max_amount NUMERIC NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, category_id)
);

ALTER TABLE public.budget_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own budget limits"
ON public.budget_limits FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own budget limits"
ON public.budget_limits FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budget limits"
ON public.budget_limits FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own budget limits"
ON public.budget_limits FOR DELETE
USING (auth.uid() = user_id);

CREATE TRIGGER update_budget_limits_updated_at
BEFORE UPDATE ON public.budget_limits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
