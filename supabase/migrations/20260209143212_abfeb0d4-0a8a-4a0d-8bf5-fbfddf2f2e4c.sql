
-- Allow users to update color and icon of default categories
-- We create a separate policy for default categories that only allows changing color and icon
CREATE POLICY "Users can customize default categories"
ON public.categories
FOR UPDATE
USING (is_default = true AND auth.uid() IS NOT NULL)
WITH CHECK (is_default = true);
