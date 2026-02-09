
-- Create recurring payments table
CREATE TABLE public.recurring_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category_id UUID NOT NULL REFERENCES public.categories(id),
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  day_of_month INTEGER NOT NULL DEFAULT 1,
  type public.transaction_type NOT NULL DEFAULT 'expense',
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  last_generated_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_day_of_month CHECK (day_of_month >= 1 AND day_of_month <= 31)
);

-- Enable RLS
ALTER TABLE public.recurring_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own recurring payments"
ON public.recurring_payments FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own recurring payments"
ON public.recurring_payments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recurring payments"
ON public.recurring_payments FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recurring payments"
ON public.recurring_payments FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_recurring_payments_updated_at
BEFORE UPDATE ON public.recurring_payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
