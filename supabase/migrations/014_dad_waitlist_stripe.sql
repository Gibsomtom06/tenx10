alter table dad_waitlist
  add column if not exists stripe_customer_id text,
  add column if not exists paid boolean default false,
  add column if not exists paid_at timestamptz;
