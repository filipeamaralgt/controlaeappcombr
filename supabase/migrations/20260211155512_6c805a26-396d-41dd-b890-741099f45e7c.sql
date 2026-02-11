
-- Add profile_id to goals
ALTER TABLE public.goals
ADD COLUMN profile_id uuid REFERENCES public.spending_profiles(id) ON DELETE SET NULL;

-- Add profile_id to installments
ALTER TABLE public.installments
ADD COLUMN profile_id uuid REFERENCES public.spending_profiles(id) ON DELETE SET NULL;
