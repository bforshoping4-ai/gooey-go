CREATE POLICY "Authenticated can read links for redirect"
ON public.links
FOR SELECT
TO authenticated
USING (true);