-- Fix: Update the incorrect recurring payment to match the actual transaction data
UPDATE recurring_payments 
SET description = 'Aluguel', amount = 1000 
WHERE id = '7b644db9-63d0-4d1d-b4ba-4eb12779c661';