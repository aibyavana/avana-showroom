CREATE TABLE public.consulting_intake (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name  text NOT NULL,
  last_name   text NOT NULL,
  whatsapp    text NOT NULL,
  email       text NOT NULL,
  brand_name  text NOT NULL,
  website     text,
  areas       text,
  message     text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.consulting_intake ENABLE ROW LEVEL SECURITY;

GRANT INSERT ON public.consulting_intake TO anon, authenticated;

CREATE POLICY "Anyone can submit consulting intake"
  ON public.consulting_intake
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    char_length(first_name) BETWEEN 1 AND 120
    AND char_length(last_name) BETWEEN 1 AND 120
    AND char_length(email) BETWEEN 3 AND 254
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND char_length(whatsapp) BETWEEN 7 AND 30
    AND char_length(brand_name) BETWEEN 1 AND 200
  );
