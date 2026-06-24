DROP POLICY "Anyone can join waitlist" ON public.market_hitch_waitlist;
CREATE POLICY "Anyone can join waitlist" ON public.market_hitch_waitlist
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    char_length(name) BETWEEN 1 AND 120
    AND char_length(company) BETWEEN 1 AND 160
    AND char_length(email) BETWEEN 3 AND 254
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  );