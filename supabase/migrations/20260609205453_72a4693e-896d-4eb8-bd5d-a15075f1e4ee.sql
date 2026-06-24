CREATE TABLE public.market_hitch_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  company text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.market_hitch_waitlist TO anon, authenticated;
GRANT ALL ON public.market_hitch_waitlist TO service_role;
ALTER TABLE public.market_hitch_waitlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can join waitlist" ON public.market_hitch_waitlist FOR INSERT TO anon, authenticated WITH CHECK (true);