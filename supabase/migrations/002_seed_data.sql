-- TENx10 Seed Data — DSR Roster + Promoter Contacts
-- Run AFTER 001_initial_schema.sql
-- Replace YOUR_USER_ID with your actual Supabase auth user ID

-- ============================================================
-- HOW TO GET YOUR USER ID:
-- Run this query first: select id from auth.users limit 5;
-- Copy your ID and replace 'YOUR_USER_ID_HERE' below
-- ============================================================

do $$
declare
  v_manager_id uuid;
  v_ds_id uuid;
  v_ozztin_id uuid;
  v_mavic_id uuid;
  v_priyanx_id uuid;
  v_whoisee_id uuid;
begin
  -- Get the manager (first user in the system)
  select id into v_manager_id from profiles limit 1;

  if v_manager_id is null then
    raise exception 'No user found. Make sure you have logged in at least once before running seed data.';
  end if;

  -- ============================================================
  -- DSR ROSTER
  -- ============================================================
  insert into artists (id, name, stage_name, email, phone, genre, manager_id, status, bio)
  values
    (gen_random_uuid(), 'Lee Bray', 'DirtySnatcha', 'contact@dirtysnatcha.com', '586-277-2537',
     'Dubstep, Riddim, Bass Music, Trap', v_manager_id, 'active',
     'DirtySnatcha is a Detroit-based dubstep and riddim producer known for heavy bass drops and high-energy live sets. Currently on the Take Me To Your Leader 2026 tour.'),
    (gen_random_uuid(), 'OZZTIN', 'OZZTIN', null, null,
     'Bass Music, Dubstep', v_manager_id, 'active', null),
    (gen_random_uuid(), 'MAVIC', 'MAVIC', null, null,
     'Bass Music, Electronic', v_manager_id, 'active', null),
    (gen_random_uuid(), 'PRIYANX', 'PRIYANX', null, null,
     'Bass Music, Riddim', v_manager_id, 'active', null),
    (gen_random_uuid(), 'WHOiSEE', 'WHOiSEE', null, null,
     'Bass Music, Electronic', v_manager_id, 'active', null)
  on conflict do nothing;

  -- Get DirtySnatcha ID for deals
  select id into v_ds_id from artists where stage_name = 'DirtySnatcha' limit 1;

  -- ============================================================
  -- PROMOTER CONTACTS (from DSR knowledge base)
  -- ============================================================
  insert into contacts (name, company, email, city, state, region, market_type, pitch_status, notes)
  values
    -- Existing relationships (warm)
    ('Dylan Phillips', 'RaveHouse Entertainment', 'ravehousetalent@gmail.com', null, null, 'National', 'agency', 'not_contacted',
     'Existing relationship. Has booked DirtySnatcha before. Open to other DSR artists.'),

    -- West Coast
    ('Booking Team', 'Bassrush / Insomniac', null, 'Los Angeles', 'CA', 'West Coast', 'festival', 'not_contacted',
     'Major bass music promoter. LA/SoCal market. Runs Bassrush events.'),
    ('Events Team', 'Another Planet Entertainment', null, 'San Francisco', 'CA', 'West Coast', 'venue', 'not_contacted',
     'Major Bay Area promoter. Runs numerous venues in SF.'),
    ('Bookings', 'Harlequin Productions', null, 'Portland', 'OR', 'West Coast', 'club', 'not_contacted',
     'Portland bass music promoter.'),
    ('Bookings', 'Root Society', null, 'Seattle', 'WA', 'West Coast', 'festival', 'not_contacted',
     'Seattle electronic/bass music collective. Runs Root Society events.'),

    -- Mountain / Southwest
    ('Global Dance Team', 'Global Dance', null, 'Denver', 'CO', 'Mountain', 'festival', 'not_contacted',
     'Major Denver/Colorado bass music promoter. Runs Global Dance Festival.'),
    ('Bookings', 'Cervantes Masterpiece Ballroom', null, 'Denver', 'CO', 'Mountain', 'venue', 'not_contacted',
     'Premier Denver venue for electronic/bass music.'),
    ('Events Team', 'Relentless Beats', null, 'Phoenix', 'AZ', 'Southwest', 'club', 'not_contacted',
     'Top Phoenix/Arizona EDM promoter.'),
    ('Bookings', 'Wasted My Youth', null, 'Salt Lake City', 'UT', 'Mountain', 'club', 'not_contacted',
     'SLC bass music promoter.'),

    -- Southeast / Texas
    ('Concourse Project Team', 'Concourse Project', null, 'Austin', 'TX', 'Southeast', 'club', 'not_contacted',
     'Austin premier electronic venue and promoter.'),
    ('Disco Donnie Team', 'Disco Donnie Presents', null, 'Dallas', 'TX', 'Southeast', 'festival', 'not_contacted',
     'Major Southeast/Texas promoter. National reach. Runs Freaknight, Ubbi Dubbi.'),
    ('Bookings', 'Space City Events', null, 'Houston', 'TX', 'Southeast', 'club', 'not_contacted',
     'Houston bass music promoter.'),
    ('Bookings', 'React Presents', null, 'Atlanta', 'GA', 'Southeast', 'festival', 'not_contacted',
     'Atlanta major electronic promoter.'),
    ('Bookings', 'SoundBar Orlando', null, 'Orlando', 'FL', 'Southeast', 'club', 'not_contacted',
     'Central Florida electronic venue.'),
    ('Bookings', 'III Points', null, 'Miami', 'FL', 'Southeast', 'festival', 'not_contacted',
     'Miami arts and music festival with strong electronic programming.'),

    -- Northeast
    ('The Untz Team', 'The Untz', null, 'New York', 'NY', 'Northeast', 'festival', 'not_contacted',
     'Major bass music blog and promoter. NY/National reach.'),
    ('Bookings', 'Avant Gardner', null, 'New York', 'NY', 'Northeast', 'venue', 'not_contacted',
     'NYC premier electronic venue. Brooklyn.'),
    ('Bookings', 'Providence Sound', null, 'Providence', 'RI', 'Northeast', 'club', 'not_contacted',
     'New England electronic promoter.'),
    ('Bookings', 'Middle East Club', null, 'Boston', 'MA', 'Northeast', 'club', 'not_contacted',
     'Boston venue with strong electronic programming.'),

    -- Midwest
    ('TimeFly Music Team', 'TimeFly Music', null, 'Chicago', 'IL', 'Midwest', 'club', 'not_contacted',
     'Chicago bass music promoter.'),
    ('Bookings', 'Elevation', null, 'Minneapolis', 'MN', 'Midwest', 'club', 'not_contacted',
     'Minneapolis electronic venue and promoter.'),
    ('Bookings', 'Somewhere Loud', null, 'Detroit', 'MI', 'Midwest', 'club', 'not_contacted',
     'Detroit electronic promoter. Home market for DirtySnatcha.'),
    ('Bookings', 'Majestic Theatre', null, 'Detroit', 'MI', 'Midwest', 'venue', 'not_contacted',
     'Detroit home market venue.'),
    ('Bookings', 'Skully''s Music Diner', null, 'Columbus', 'OH', 'Midwest', 'club', 'not_contacted',
     'Columbus OH electronic venue.'),
    ('Bookings', 'PRYSM Nightclub', null, 'Chicago', 'IL', 'Midwest', 'club', 'not_contacted',
     'Chicago major electronic nightclub. Colton Anderson (legacy agent) connection.'),

    -- Canada
    ('Bookings', 'Shambhala Music Festival', null, 'Salmo', 'BC', 'Canada', 'festival', 'not_contacted',
     'Premier Canadian bass music festival. Very strong dubstep/riddim programming.'),
    ('Bookings', 'Celebrities Nightclub', null, 'Vancouver', 'BC', 'Canada', 'club', 'not_contacted',
     'Vancouver electronic nightclub.'),
    ('Bookings', 'Coda', null, 'Toronto', 'ON', 'Canada', 'club', 'not_contacted',
     'Toronto premier electronic club.'),

    -- Agencies / Buyers
    ('Andrew', 'AB Touring', 'andrew@abtouring.com', null, null, 'National', 'agency', 'not_contacted',
     'Primary booking agent for DirtySnatcha. Already working with DS.'),
    ('Colton Anderson', 'PRYSM Talent Agency', 'colton@prysmtalentagency.com', null, null, 'National', 'agency', 'not_contacted',
     'Legacy booking agent. 734-904-0224.')

  on conflict do nothing;

end $$;
