
-- Add status and expense_type columns to transactions
ALTER TABLE public.transactions 
ADD COLUMN status text DEFAULT NULL,
ADD COLUMN expense_type text DEFAULT NULL;

-- Set sensible defaults for existing data
UPDATE public.transactions SET status = 'paid' WHERE type = 'expense';
UPDATE public.transactions SET status = 'received' WHERE type = 'income';
