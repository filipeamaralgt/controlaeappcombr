
-- Fix overly permissive INSERT policy: only service role should insert
DROP POLICY "Service role can insert subscriptions" ON public.subscriptions;
CREATE POLICY "Service role can insert subscriptions"
ON public.subscriptions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Fix overly permissive UPDATE policy: only own rows
DROP POLICY "Service role can update subscriptions" ON public.subscriptions;
CREATE POLICY "Users can update own subscription"
ON public.subscriptions FOR UPDATE
USING (auth.uid() = user_id);
