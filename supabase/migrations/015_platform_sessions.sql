-- Platform Sessions
-- Stores ingest conversation state for any messaging platform.
-- session_key format: "platform:platform_user_id"
-- e.g. "discord:123456789", "whatsapp:+12485551234", "slack:U01234567"

create table if not exists platform_sessions (
  id            uuid primary key default gen_random_uuid(),
  session_key   text unique not null,          -- "platform:user_id"
  platform      text not null,                 -- discord | whatsapp | sms | slack | messenger | web
  platform_user_id text not null,              -- raw platform user identifier
  history       jsonb not null default '[]',   -- Message[]
  state         jsonb not null default '{}',   -- IngestState
  artist_id     uuid references artists(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists platform_sessions_key_idx on platform_sessions(session_key);
create index if not exists platform_sessions_platform_idx on platform_sessions(platform);

-- RLS: service role only (webhooks run server-side with service key)
alter table platform_sessions enable row level security;

create policy "service role full access"
  on platform_sessions
  for all
  using (true)
  with check (true);

comment on table platform_sessions is
  'Ingest conversation state for Discord, WhatsApp, SMS, Slack, Messenger, and other platforms.';
