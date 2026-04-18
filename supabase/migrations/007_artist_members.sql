-- Artist members: team access with roles
create table if not exists artist_members (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references artists(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  name text not null,
  role text not null check (role in ('admin','artist','agent')),
  created_at timestamptz not null default now(),
  unique (artist_id, email)
);

alter table artist_members enable row level security;

-- Security definer function: is caller a member of this artist?
create or replace function is_artist_member(p_artist_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from artist_members
    where artist_id = p_artist_id
      and (user_id = auth.uid() or email = (auth.jwt() ->> 'email'))
  )
$$;

-- Members can read all memberships for artists they belong to
create policy "members_select" on artist_members for select
  using (is_artist_member(artist_id));

-- Admins can insert/update/delete members
create policy "admins_mutate" on artist_members for all
  using (
    exists (
      select 1 from artist_members m
      where m.artist_id = artist_members.artist_id
        and m.role = 'admin'
        and (m.user_id = auth.uid() or m.email = (auth.jwt() ->> 'email'))
    )
  );

-- Auto-add manager to artist_members as admin when an artist is created
create or replace function add_manager_as_artist_admin()
returns trigger language plpgsql security definer as $$
declare
  v_email text;
  v_name  text;
begin
  select email, full_name into v_email, v_name from profiles where id = new.manager_id;
  if v_email is not null then
    insert into artist_members (artist_id, user_id, email, name, role)
    values (new.id, new.manager_id, v_email, coalesce(v_name, v_email), 'admin')
    on conflict (artist_id, email) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_artist_created_add_manager on artists;
create trigger on_artist_created_add_manager
  after insert on artists
  for each row execute procedure add_manager_as_artist_admin();

-- Seed DSR team
do $$ declare v_artist_id uuid; begin
  select id into v_artist_id from artists where stage_name = 'DirtySnatcha' limit 1;
  if v_artist_id is null then
    raise notice 'DirtySnatcha artist not found — skipping member seed';
    return;
  end if;
  insert into artist_members (artist_id, email, name, role) values
    (v_artist_id, 'thomas@dirtysnatcha.com',     'Thomas Nalian',       'admin'),
    (v_artist_id, 'contact@dirtysnatcha.com',    'Lee Bray',            'artist'),
    (v_artist_id, 'andrew@abtouring.com',         'Andrew (AB Touring)', 'agent'),
    (v_artist_id, 'colton@prysmtalentagency.com', 'Colton Anderson',     'agent'),
    (v_artist_id, 'booking@dirtysnatcha.com',     'Booking Team',        'agent')
  on conflict (artist_id, email) do nothing;
end $$;

-- Fix artists RLS: members can select their artist
drop policy if exists "Managers see own artists" on artists;
create policy "artists_member_select" on artists for select
  using (manager_id = auth.uid() or user_id = auth.uid() or is_artist_member(id));
create policy "artists_manager_write" on artists for all
  using (manager_id = auth.uid());

-- Fix deals RLS: any member of the deal's artist has full access
drop policy if exists "Managers see own deals" on deals;
create policy "deals_member_access" on deals for all
  using (is_artist_member(artist_id));

-- Fix catalog RLS (was wide-open to all authenticated users)
drop policy if exists "catalog_auth" on catalog;
create policy "catalog_member_access" on catalog for all
  using (is_artist_member(artist_id));

-- Fix tasks RLS (was wide-open to all authenticated users)
drop policy if exists "tasks_auth" on tasks;
create policy "tasks_member_access" on tasks for all
  using (
    artist_id is null or is_artist_member(artist_id)
  );
