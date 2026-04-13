
-- Function to atomically increment clicks
CREATE OR REPLACE FUNCTION public.increment_clicks(p_short_code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.links
  SET clicks_count = clicks_count + 1
  WHERE short_code = p_short_code;
END;
$$;
