
CREATE TABLE public.clicks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  link_id uuid NOT NULL REFERENCES public.links(id) ON DELETE CASCADE,
  clicked_at timestamptz NOT NULL DEFAULT now(),
  ip_country text,
  ip_city text,
  device_type text,
  browser text,
  os text,
  referrer text,
  user_agent text
);

CREATE INDEX idx_clicks_link_id ON public.clicks(link_id);
CREATE INDEX idx_clicks_link_time ON public.clicks(link_id, clicked_at DESC);

ALTER TABLE public.clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert clicks"
  ON public.clicks FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Owners can read clicks of their links"
  ON public.clicks FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.links l
    WHERE l.id = clicks.link_id AND l.user_id = auth.uid()
  ));
