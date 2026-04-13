-- Make user_id NOT NULL with default
ALTER TABLE public.links ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.links ALTER COLUMN user_id SET DEFAULT auth.uid();

-- Drop old permissive policies
DROP POLICY IF EXISTS "Anyone can insert links" ON public.links;
DROP POLICY IF EXISTS "Anyone can read links" ON public.links;

-- Authenticated users can insert their own links
CREATE POLICY "Authenticated users can insert own links"
ON public.links
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Authenticated users can read their own links (dashboard)
CREATE POLICY "Users can read own links"
ON public.links
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Anonymous users can read any link by short_code (for redirection)
CREATE POLICY "Anyone can read links for redirect"
ON public.links
FOR SELECT
TO anon
USING (true);