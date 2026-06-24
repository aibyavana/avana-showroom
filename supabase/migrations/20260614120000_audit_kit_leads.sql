create table if not exists audit_kit_leads (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  email text not null,
  created_at timestamptz not null default now(),
  constraint audit_kit_leads_email_key unique (email),
  constraint audit_kit_leads_first_name_check check (char_length(first_name) >= 1 and char_length(first_name) <= 120),
  constraint audit_kit_leads_email_check check (char_length(email) >= 5 and char_length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);

alter table audit_kit_leads enable row level security;

create policy "insert_audit_kit_lead" on audit_kit_leads
  for insert to anon with check (
    char_length(first_name) >= 1 and
    char_length(first_name) <= 120 and
    char_length(email) >= 5 and
    char_length(email) <= 254
  );
