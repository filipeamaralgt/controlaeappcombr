
-- Create installments table
CREATE TABLE public.installments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  installment_count INTEGER NOT NULL DEFAULT 1,
  installment_paid INTEGER NOT NULL DEFAULT 0,
  installment_value NUMERIC,
  manual_value BOOLEAN NOT NULL DEFAULT false,
  next_due_date DATE NOT NULL DEFAULT CURRENT_DATE,
  card_id UUID REFERENCES public.cards(id) ON DELETE SET NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.installments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own installments" ON public.installments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own installments" ON public.installments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own installments" ON public.installments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own installments" ON public.installments FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_installments_updated_at
BEFORE UPDATE ON public.installments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
