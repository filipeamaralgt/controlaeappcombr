-- Add icon column to categories table
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS icon text DEFAULT 'circle';

-- Update default categories with appropriate icons
UPDATE public.categories SET icon = 'utensils' WHERE name ILIKE '%alimentação%' OR name ILIKE '%comida%' OR name ILIKE '%restaurante%';
UPDATE public.categories SET icon = 'car' WHERE name ILIKE '%transporte%' OR name ILIKE '%uber%' OR name ILIKE '%combustível%';
UPDATE public.categories SET icon = 'home' WHERE name ILIKE '%moradia%' OR name ILIKE '%aluguel%' OR name ILIKE '%casa%';
UPDATE public.categories SET icon = 'heart' WHERE name ILIKE '%saúde%' OR name ILIKE '%médico%' OR name ILIKE '%farmácia%';
UPDATE public.categories SET icon = 'book-open' WHERE name ILIKE '%educação%' OR name ILIKE '%curso%' OR name ILIKE '%escola%';
UPDATE public.categories SET icon = 'gamepad-2' WHERE name ILIKE '%lazer%' OR name ILIKE '%entretenimento%';
UPDATE public.categories SET icon = 'shopping-bag' WHERE name ILIKE '%compras%' OR name ILIKE '%shopping%';
UPDATE public.categories SET icon = 'briefcase' WHERE name ILIKE '%salário%' OR name ILIKE '%trabalho%';
UPDATE public.categories SET icon = 'wallet' WHERE name ILIKE '%investimento%' OR name ILIKE '%renda%';
UPDATE public.categories SET icon = 'more-horizontal' WHERE name ILIKE '%outros%' OR name ILIKE '%outro%';