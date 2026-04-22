create table if not exists dad_waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text,
  use_case text,
  created_at timestamptz default now()
);

alter table dad_waitlist enable row level security;

-- Public insert only (anyone can sign up)
create policy "Anyone can join waitlist"
  on dad_waitlist for insert
  with check (true);

-- Only service role can read (for admin exports)
create policy "Service role reads waitlist"
  on dad_waitlist for select
  using (auth.role() = 'service_role');
