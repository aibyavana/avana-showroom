CREATE TABLE public.retailer_ai_waitlist (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  email      text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.retailer_ai_waitlist ENABLE ROW LEVEL SECURITY;

GRANT INSERT ON public.retailer_ai_waitlist TO anon, authenticated;

CREATE POLICY "Anyone can join retailer AI waitlist"
  ON public.retailer_ai_waitlist
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    char_length(first_name) BETWEEN 1 AND 120
    AND char_length(email) BETWEEN 3 AND 254
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  );
