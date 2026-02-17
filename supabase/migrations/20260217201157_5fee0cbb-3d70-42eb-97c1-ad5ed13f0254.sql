
-- Create leads table
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  consent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Only master admin users can read leads
CREATE POLICY "Master admins can view leads"
ON public.leads
FOR SELECT
TO authenticated
USING (
  auth.jwt()->>'email' IN ('monicahartmann99@gmail.com', 'filipeamaralgt@gmail.com')
);

-- Anyone can insert (for landing page form submissions)
CREATE POLICY "Anyone can submit leads"
ON public.leads
FOR INSERT
TO anon, authenticated
WITH CHECK (consent = true);

-- Index for ordering by date
CREATE INDEX idx_leads_created_at ON public.leads (created_at DESC);
