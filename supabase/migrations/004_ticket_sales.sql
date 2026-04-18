-- Add ticket sales tracking to deals
alter table deals
  add column if not exists tickets_sold integer,
  add column if not exists ticket_price numeric(10,2),
  add column if not exists door_count integer,
  add column if not exists ticket_link text,
  add column if not exists originating_platform text; -- gigwell, direct, abtouring, email, etc.
