-- Conversation threads per deal (offer negotiation, marketing hand-off, etc.)
create table if not exists deal_threads (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references deals(id) on delete cascade,
  type text not null check (type in ('offer','marketing','advance','contract')),
  subject text,
  created_at timestamptz not null default now()
);

alter table deal_threads enable row level security;

create policy "thread_member_access" on deal_threads for all
  using (
    exists (
      select 1 from deals d
      where d.id = deal_threads.deal_id and is_artist_member(d.artist_id)
    )
  );

-- Messages within threads
create table if not exists deal_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references deal_threads(id) on delete cascade,
  sender_name text not null,
  sender_email text,
  direction text not null check (direction in ('inbound','outbound','internal')),
  body text not null,
  gmail_message_id text,
  created_at timestamptz not null default now()
);

alter table deal_messages enable row level security;

create policy "message_member_access" on deal_messages for all
  using (
    exists (
      select 1 from deal_threads t
      join deals d on d.id = t.deal_id
      where t.id = deal_messages.thread_id and is_artist_member(d.artist_id)
    )
  );

-- Attachments stored in Supabase Storage bucket 'show-attachments'
create table if not exists deal_attachments (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references deals(id) on delete cascade,
  thread_id uuid references deal_threads(id) on delete set null,
  filename text not null,
  mime_type text not null,
  storage_path text not null,
  parsed_data jsonb,
  uploaded_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

alter table deal_attachments enable row level security;

create policy "attachment_member_access" on deal_attachments for all
  using (
    exists (
      select 1 from deals d
      where d.id = deal_attachments.deal_id and is_artist_member(d.artist_id)
    )
  );

-- Extend venues with intel columns
alter table venues add column if not exists talent_buyer text;
alter table venues add column if not exists booking_email text;
alter table venues add column if not exists typical_genres text;
alter table venues add column if not exists sell_radius text;
alter table venues add column if not exists other_shows jsonb;
alter table venues add column if not exists intel jsonb;
