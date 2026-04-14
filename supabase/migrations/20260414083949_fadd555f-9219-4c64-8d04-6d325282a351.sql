-- Make user_id nullable for anonymous links
ALTER TABLE public.links ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.links ALTER COLUMN user_id SET DEFAULT auth.uid();

-- Allow anonymous inserts
CREATE POLICY "Anyone can insert links"
ON public.links
FOR INSERT
TO anon
WITH CHECK (true);
