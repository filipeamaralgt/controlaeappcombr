
-- Create spending_profiles table
CREATE TABLE public.spending_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '😊',
  color TEXT NOT NULL DEFAULT '#6366f1',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.spending_profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own spending profiles"
ON public.spending_profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own spending profiles"
ON public.spending_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own spending profiles"
ON public.spending_profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own spending profiles"
ON public.spending_profiles FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_spending_profiles_updated_at
BEFORE UPDATE ON public.spending_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add profile_id to transactions (nullable for backwards compatibility)
ALTER TABLE public.transactions
ADD COLUMN profile_id UUID REFERENCES public.spending_profiles(id) ON DELETE SET NULL;
