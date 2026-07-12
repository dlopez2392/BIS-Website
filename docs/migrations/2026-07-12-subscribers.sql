-- Run in Neon SQL editor before the resource feature goes live.
create table if not exists subscribers (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  email text not null,
  name text,
  resource text not null,
  locale text not null,
  newsletter_consent boolean not null default false
);
