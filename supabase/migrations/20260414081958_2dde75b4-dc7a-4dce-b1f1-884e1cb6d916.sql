CREATE POLICY "Users can delete own links"
ON public.links
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);