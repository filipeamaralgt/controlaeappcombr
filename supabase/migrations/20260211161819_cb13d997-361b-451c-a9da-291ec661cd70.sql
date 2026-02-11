
ALTER TABLE public.reminders
ADD COLUMN profile_id uuid REFERENCES public.spending_profiles(id) ON DELETE SET NULL;
