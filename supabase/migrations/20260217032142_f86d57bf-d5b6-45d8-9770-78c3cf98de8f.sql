
-- Add payment_method and card_id to transactions
ALTER TABLE public.transactions 
ADD COLUMN payment_method text DEFAULT NULL,
ADD COLUMN card_id uuid DEFAULT NULL REFERENCES public.cards(id) ON DELETE SET NULL;
