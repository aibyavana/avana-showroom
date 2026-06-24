CREATE TABLE public.insider_subscribers (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email      text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT insider_subscribers_email_key UNIQUE (email)
);

ALTER TABLE public.insider_subscribers ENABLE ROW LEVEL SECURITY;

GRANT INSERT ON public.insider_subscribers TO anon, authenticated;

CREATE POLICY "Anyone can subscribe as insider" ON public.insider_subscribers
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    char_length(email) BETWEEN 3 AND 254
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  );
