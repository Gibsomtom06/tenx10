-- TMTYL 2026 Tour Deals — DirtySnatcha
-- Run after 002_seed_data.sql
-- Source: DSR_Tour_Status_Recalibrated / CLAUDE.md (~$38,600 total, 17 shows)

do $$
declare
  v_manager_id uuid;
  v_ds_id uuid;
  v_venue_id uuid;
  v_promoter_id uuid;
begin
  select id into v_manager_id from profiles limit 1;
  select id into v_ds_id from artists where stage_name = 'DirtySnatcha' limit 1;

  if v_ds_id is null then
    raise exception 'DirtySnatcha artist not found. Run 002_seed_data.sql first.';
  end if;

  -- ============================================================
  -- Helper: insert venue + return id
  -- ============================================================

  -- Show 1: Detroit, MI
  insert into venues (name, city, state, capacity) values ('El Club', 'Detroit', 'MI', 400) returning id into v_venue_id;
  insert into promoters (name, company, email) values ('Dylan Phillips', 'RaveHouse Entertainment', 'ravehousetalent@gmail.com') returning id into v_promoter_id;
  insert into deals (title, artist_id, venue_id, promoter_id, show_date, offer_amount, status, created_by, notes)
    select 'El Club — Detroit, MI', v_ds_id, v_venue_id, v_promoter_id, '2026-01-16', 2000, 'confirmed', v_manager_id, 'Home market show. RaveHouse. Deposit received.';

  -- Show 2: Chicago, IL
  insert into venues (name, city, state, capacity) values ('Concord Music Hall', 'Chicago', 'IL', 1500) returning id into v_venue_id;
  insert into promoters (name, company) values ('TimeFly Music', 'TimeFly Music') returning id into v_promoter_id;
  insert into deals (title, artist_id, venue_id, promoter_id, show_date, offer_amount, status, created_by)
    select 'Concord Music Hall — Chicago, IL', v_ds_id, v_venue_id, v_promoter_id, '2026-01-23', 2500, 'confirmed', v_manager_id;

  -- Show 3: Minneapolis, MN
  insert into venues (name, city, state, capacity) values ('Skyway Theatre', 'Minneapolis', 'MN', 900) returning id into v_venue_id;
  insert into promoters (name, company) values ('Skyway Presents', 'Skyway Presents') returning id into v_promoter_id;
  insert into deals (title, artist_id, venue_id, promoter_id, show_date, offer_amount, status, created_by)
    select 'Skyway Theatre — Minneapolis, MN', v_ds_id, v_venue_id, v_promoter_id, '2026-01-24', 2000, 'confirmed', v_manager_id;

  -- Show 4: Denver, CO
  insert into venues (name, city, state, capacity) values ('Cervantes Masterpiece Ballroom', 'Denver', 'CO', 1100) returning id into v_venue_id;
  insert into promoters (name, company) values ('Global Dance', 'Global Dance') returning id into v_promoter_id;
  insert into deals (title, artist_id, venue_id, promoter_id, show_date, offer_amount, status, created_by)
    select 'Cervantes Masterpiece Ballroom — Denver, CO', v_ds_id, v_venue_id, v_promoter_id, '2026-01-30', 2500, 'confirmed', v_manager_id;

  -- Show 5: Salt Lake City, UT
  insert into venues (name, city, state, capacity) values ('The Complex', 'Salt Lake City', 'UT', 800) returning id into v_venue_id;
  insert into promoters (name, company) values ('Wasted My Youth', 'Wasted My Youth') returning id into v_promoter_id;
  insert into deals (title, artist_id, venue_id, promoter_id, show_date, offer_amount, status, created_by)
    select 'The Complex — Salt Lake City, UT', v_ds_id, v_venue_id, v_promoter_id, '2026-01-31', 1800, 'confirmed', v_manager_id;

  -- Show 6: Seattle, WA
  insert into venues (name, city, state, capacity) values ('Neumos', 'Seattle', 'WA', 650) returning id into v_venue_id;
  insert into promoters (name, company) values ('Root Society', 'Root Society') returning id into v_promoter_id;
  insert into deals (title, artist_id, venue_id, promoter_id, show_date, offer_amount, status, created_by)
    select 'Neumos — Seattle, WA', v_ds_id, v_venue_id, v_promoter_id, '2026-02-06', 2200, 'confirmed', v_manager_id;

  -- Show 7: Portland, OR
  insert into venues (name, city, state, capacity) values ('Star Theater', 'Portland', 'OR', 500) returning id into v_venue_id;
  insert into promoters (name, company) values ('Harlequin Productions', 'Harlequin Productions') returning id into v_promoter_id;
  insert into deals (title, artist_id, venue_id, promoter_id, show_date, offer_amount, status, created_by)
    select 'Star Theater — Portland, OR', v_ds_id, v_venue_id, v_promoter_id, '2026-02-07', 2000, 'confirmed', v_manager_id;

  -- Show 8: San Francisco, CA
  insert into venues (name, city, state, capacity) values ('The Regency Ballroom', 'San Francisco', 'CA', 1500) returning id into v_venue_id;
  insert into promoters (name, company) values ('Another Planet Entertainment', 'Another Planet Entertainment') returning id into v_promoter_id;
  insert into deals (title, artist_id, venue_id, promoter_id, show_date, offer_amount, status, created_by)
    select 'The Regency Ballroom — San Francisco, CA', v_ds_id, v_venue_id, v_promoter_id, '2026-02-13', 2500, 'confirmed', v_manager_id;

  -- Show 9: Los Angeles, CA
  insert into venues (name, city, state, capacity) values ('Exchange LA', 'Los Angeles', 'CA', 1000) returning id into v_venue_id;
  insert into promoters (name, company) values ('Bassrush / Insomniac', 'Insomniac Events') returning id into v_promoter_id;
  insert into deals (title, artist_id, venue_id, promoter_id, show_date, offer_amount, status, created_by)
    select 'Exchange LA — Los Angeles, CA', v_ds_id, v_venue_id, v_promoter_id, '2026-02-14', 3000, 'confirmed', v_manager_id;

  -- Show 10: Phoenix, AZ
  insert into venues (name, city, state, capacity) values ('Monarch Theatre', 'Phoenix', 'AZ', 700) returning id into v_venue_id;
  insert into promoters (name, company) values ('Relentless Beats', 'Relentless Beats') returning id into v_promoter_id;
  insert into deals (title, artist_id, venue_id, promoter_id, show_date, offer_amount, status, created_by)
    select 'Monarch Theatre — Phoenix, AZ', v_ds_id, v_venue_id, v_promoter_id, '2026-02-21', 2000, 'confirmed', v_manager_id;

  -- Show 11: Dallas, TX
  insert into venues (name, city, state, capacity) values ('Lizard Lounge', 'Dallas', 'TX', 600) returning id into v_venue_id;
  insert into promoters (name, company) values ('Disco Donnie Presents', 'Disco Donnie Presents') returning id into v_promoter_id;
  insert into deals (title, artist_id, venue_id, promoter_id, show_date, offer_amount, status, created_by)
    select 'Lizard Lounge — Dallas, TX', v_ds_id, v_venue_id, v_promoter_id, '2026-02-27', 2000, 'confirmed', v_manager_id;

  -- Show 12: Austin, TX
  insert into venues (name, city, state, capacity) values ('Concourse Project', 'Austin', 'TX', 1500) returning id into v_venue_id;
  insert into promoters (name, company) values ('Concourse Project', 'Concourse Project') returning id into v_promoter_id;
  insert into deals (title, artist_id, venue_id, promoter_id, show_date, offer_amount, status, created_by)
    select 'Concourse Project — Austin, TX', v_ds_id, v_venue_id, v_promoter_id, '2026-02-28', 2500, 'confirmed', v_manager_id;

  -- Show 13: Atlanta, GA
  insert into venues (name, city, state, capacity) values ('Believe Music Hall', 'Atlanta', 'GA', 1500) returning id into v_venue_id;
  insert into promoters (name, company) values ('React Presents', 'React Presents') returning id into v_promoter_id;
  insert into deals (title, artist_id, venue_id, promoter_id, show_date, offer_amount, status, created_by)
    select 'Believe Music Hall — Atlanta, GA', v_ds_id, v_venue_id, v_promoter_id, '2026-03-06', 2200, 'confirmed', v_manager_id;

  -- Show 14: Orlando, FL
  insert into venues (name, city, state, capacity) values ('SoundBar Orlando', 'Orlando', 'FL', 400) returning id into v_venue_id;
  insert into promoters (name, company) values ('SoundBar', 'SoundBar Events') returning id into v_promoter_id;
  insert into deals (title, artist_id, venue_id, promoter_id, show_date, offer_amount, status, created_by)
    select 'SoundBar — Orlando, FL', v_ds_id, v_venue_id, v_promoter_id, '2026-03-07', 1800, 'confirmed', v_manager_id;

  -- Show 15: New York, NY
  insert into venues (name, city, state, capacity) values ('Avant Gardner', 'New York', 'NY', 2500) returning id into v_venue_id;
  insert into promoters (name, company) values ('Avant Gardner Events', 'Avant Gardner') returning id into v_promoter_id;
  insert into deals (title, artist_id, venue_id, promoter_id, show_date, offer_amount, status, created_by)
    select 'Avant Gardner — New York, NY', v_ds_id, v_venue_id, v_promoter_id, '2026-03-13', 3000, 'confirmed', v_manager_id;

  -- Show 16: Boston, MA
  insert into venues (name, city, state, capacity) values ('Middle East Club', 'Boston', 'MA', 500) returning id into v_venue_id;
  insert into promoters (name, company) values ('Middle East Presents', 'Middle East Club') returning id into v_promoter_id;
  insert into deals (title, artist_id, venue_id, promoter_id, show_date, offer_amount, status, created_by)
    select 'Middle East Club — Boston, MA', v_ds_id, v_venue_id, v_promoter_id, '2026-03-14', 2000, 'confirmed', v_manager_id;

  -- Show 17: Columbus, OH (return route home)
  insert into venues (name, city, state, capacity) values ('A&R Music Bar', 'Columbus', 'OH', 600) returning id into v_venue_id;
  insert into promoters (name, company) values ('Breakaway Events', 'Breakaway Events') returning id into v_promoter_id;
  insert into deals (title, artist_id, venue_id, promoter_id, show_date, offer_amount, status, created_by)
    select 'A&R Music Bar — Columbus, OH', v_ds_id, v_venue_id, v_promoter_id, '2026-03-20', 1800, 'confirmed', v_manager_id;

end $$;
