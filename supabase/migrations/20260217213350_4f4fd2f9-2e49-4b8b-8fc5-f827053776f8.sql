
ALTER TABLE public.leads
  ADD COLUMN whatsapp text,
  ADD COLUMN status text NOT NULL DEFAULT 'lead',
  ADD COLUMN subscription_type text,
  ADD COLUMN user_type text,
  ADD COLUMN payment_method text,
  ADD COLUMN payment_date timestamp with time zone,
  ADD COLUMN utm_source text,
  ADD COLUMN utm_medium text,
  ADD COLUMN utm_campaign text,
  ADD COLUMN utm_content text,
  ADD COLUMN utm_term text;
