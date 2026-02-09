
CREATE TABLE public.debts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  paid_amount NUMERIC NOT NULL DEFAULT 0,
  interest_rate NUMERIC DEFAULT 0,
  due_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_installment BOOLEAN NOT NULL DEFAULT false,
  installment_count INTEGER DEFAULT 1,
  installment_paid INTEGER DEFAULT 0,
  priority TEXT NOT NULL DEFAULT 'média',
  notes TEXT,
  is_paid BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own debts" ON public.debts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own debts" ON public.debts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own debts" ON public.debts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own debts" ON public.debts FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_debts_updated_at
BEFORE UPDATE ON public.debts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
