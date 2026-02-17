ALTER TABLE public.leads ADD COLUMN canceled_at timestamptz DEFAULT NULL;
ALTER TABLE public.leads ADD COLUMN subscription_end timestamptz DEFAULT NULL;