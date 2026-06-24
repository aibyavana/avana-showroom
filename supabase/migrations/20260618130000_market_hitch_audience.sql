ALTER TABLE public.market_hitch_waitlist
  ADD COLUMN IF NOT EXISTS audience text NOT NULL DEFAULT 'buyer'
    CHECK (audience IN ('buyer', 'brand'));

ALTER TABLE public.market_hitch_waitlist
  ALTER COLUMN audience DROP DEFAULT;
