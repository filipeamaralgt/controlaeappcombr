
-- Add profile_id to cards
ALTER TABLE public.cards
ADD COLUMN profile_id uuid REFERENCES public.spending_profiles(id) ON DELETE SET NULL;

-- Add profile_id to debts
ALTER TABLE public.debts
ADD COLUMN profile_id uuid REFERENCES public.spending_profiles(id) ON DELETE SET NULL;

-- Add profile_id to budget_limits
ALTER TABLE public.budget_limits
ADD COLUMN profile_id uuid REFERENCES public.spending_profiles(id) ON DELETE SET NULL;

-- Add profile_id to recurring_payments
ALTER TABLE public.recurring_payments
ADD COLUMN profile_id uuid REFERENCES public.spending_profiles(id) ON DELETE SET NULL;
