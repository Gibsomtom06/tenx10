-- TENx10 Initial Schema — safe to re-run

-- Enums (create before tables that reference them)
do $$ begin
  create type user_role as enum ('admin', 'manager', 'viewer', 'artist', 'agent');
exception when duplicate_object then null; end $$;

do $$ begin
  create type artist_status as enum ('active', 'inactive', 'pending');
exception when duplicate_object then null; end $$;

do $$ begin
  create type deal_status as enum ('inquiry', 'offer', 'negotiating', 'confirmed', 'completed', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type contract_status as enum ('draft', 'sent', 'signed', 'voided');
exception when duplicate_object then null; end $$;

do $$ begin
  create type market_type as enum ('club', 'festival', 'bar', 'venue', 'agency', 'other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type pitch_status as enum ('not_contacted', 'drafted', 'sent', 'responded', 'booked');
exception when duplicate_object then null; end $$;

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  role user_role not null default 'manager',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table profiles enable row level security;
drop policy if exists "Users can view own profile" on profiles;
drop policy if exists "Users can update own profile" on profiles;
drop policy if exists "Users can insert own profile" on profiles;
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);

create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, email, role)
  values (new.id, new.email, 'manager')
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

create table if not exists artists (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  stage_name text,
  email text,
  phone text,
  genre text,
  spotify_artist_id text,
  spotify_access_token text,
  spotify_refresh_token text,
  spotify_token_expires_at timestamptz,
  manager_id uuid not null references profiles(id) on delete cascade,
  status artist_status not null default 'active',
  bio text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table artists enable row level security;
drop policy if exists "Managers see own artists" on artists;
create policy "Managers see own artists" on artists for all using (manager_id = auth.uid());

create table if not exists venues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text,
  state text,
  country text not null default 'US',
  capacity integer,
  contact_name text,
  contact_email text,
  website text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table venues enable row level security;
drop policy if exists "Authenticated users can manage venues" on venues;
create policy "Authenticated users can manage venues" on venues for all using (auth.uid() is not null);

create table if not exists promoters (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company text,
  email text,
  phone text,
  city text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table promoters enable row level security;
drop policy if exists "Authenticated users can manage promoters" on promoters;
create policy "Authenticated users can manage promoters" on promoters for all using (auth.uid() is not null);

create table if not exists deals (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references artists(id) on delete cascade,
  venue_id uuid references venues(id),
  promoter_id uuid references promoters(id),
  title text not null,
  show_date date,
  offer_amount numeric(10,2),
  deal_points jsonb,
  status deal_status not null default 'inquiry',
  source_email_id text,
  gmail_draft_id text,
  notes text,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table deals enable row level security;
drop policy if exists "Managers see own deals" on deals;
create policy "Managers see own deals" on deals for all using (created_by = auth.uid());

create table if not exists contracts (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references deals(id) on delete cascade,
  artist_id uuid not null references artists(id),
  title text not null,
  status contract_status not null default 'draft',
  content text,
  signed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table contracts enable row level security;
drop policy if exists "Authenticated users can manage contracts" on contracts;
create policy "Deal owners can manage contracts" on contracts for all
  using ((select created_by from deals where id = contracts.deal_id) = auth.uid());

create table if not exists gmail_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  email text not null,
  access_token text not null,
  refresh_token text,
  token_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);
alter table gmail_connections enable row level security;
drop policy if exists "Users manage own gmail connection" on gmail_connections;
create policy "Users manage own gmail connection" on gmail_connections for all using (user_id = auth.uid());

create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company text,
  email text,
  phone text,
  city text,
  state text,
  region text,
  market_type market_type,
  pitch_status pitch_status default 'not_contacted',
  notes text,
  last_pitched_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table contacts enable row level security;
drop policy if exists "Authenticated users can manage contacts" on contacts;
create policy "Authenticated users can manage contacts" on contacts for all using (auth.uid() is not null);

create table if not exists agent_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  artist_id uuid references artists(id),
  messages jsonb not null default '[]',
  context jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table agent_conversations enable row level security;
drop policy if exists "Users see own conversations" on agent_conversations;
create policy "Users see own conversations" on agent_conversations for all using (user_id = auth.uid());

create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$ begin create trigger set_updated_at before update on profiles for each row execute procedure update_updated_at(); exception when duplicate_object then null; end $$;
do $$ begin create trigger set_updated_at before update on artists for each row execute procedure update_updated_at(); exception when duplicate_object then null; end $$;
do $$ begin create trigger set_updated_at before update on deals for each row execute procedure update_updated_at(); exception when duplicate_object then null; end $$;
do $$ begin create trigger set_updated_at before update on venues for each row execute procedure update_updated_at(); exception when duplicate_object then null; end $$;
do $$ begin create trigger set_updated_at before update on promoters for each row execute procedure update_updated_at(); exception when duplicate_object then null; end $$;
do $$ begin create trigger set_updated_at before update on gmail_connections for each row execute procedure update_updated_at(); exception when duplicate_object then null; end $$;
do $$ begin create trigger set_updated_at before update on contacts for each row execute procedure update_updated_at(); exception when duplicate_object then null; end $$;
do $$ begin create trigger set_updated_at before update on contracts for each row execute procedure update_updated_at(); exception when duplicate_object then null; end $$;
do $$ begin create trigger set_updated_at before update on agent_conversations for each row execute procedure update_updated_at(); exception when duplicate_object then null; end $$;
