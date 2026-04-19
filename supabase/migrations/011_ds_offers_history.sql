-- Migration 011: DS Offers folder — complete offer history
-- Source: DS Offers folder on Google Drive (parsed 2026-04-18)
-- Adds: 2025 standalone shows, 2026 post-TMTYL shows, current/upcoming offers, declined offers
-- Does NOT duplicate the 17 TMTYL shows already in migration 003

do $$
declare
  v_manager_id uuid;
  v_ds_id      uuid;
  v_venue_id   uuid;
  v_promoter_id uuid;
begin
  select id into v_manager_id from profiles limit 1;
  select id into v_ds_id from artists where stage_name = 'DirtySnatcha' limit 1;

  if v_ds_id is null then
    raise exception 'DirtySnatcha artist not found. Run 002_seed_data.sql first.';
  end if;

  -- ==================================================================
  -- 2025 STANDALONE SHOWS (pre-TMTYL tour)
  -- ==================================================================

  -- Reno, NV — The Alpine — Jul 12, 2025
  insert into venues (name, city, state, capacity)
    values ('The Alpine', 'Reno', 'NV', 500) returning id into v_venue_id;
  insert into promoters (name, company, email)
    values ('Luca Genasci', 'Lake Tahoe Aleworx', 'luca@laketahoealeworx.com') returning id into v_promoter_id;
  insert into deals (title, artist_id, venue_id, promoter_id, show_date, offer_amount, status, created_by, notes)
    select 'The Alpine — Reno, NV', v_ds_id, v_venue_id, v_promoter_id,
      '2025-07-12', 4000, 'completed', v_manager_id,
      'Co-headliner with Subfiltroniks. $4,000 + HGR. $250 bonus at 250 and 500 tickets sold. 18+, cap 500. 1st hold at offer time.';

  -- Houston, TX — Ground Z3RO — Aug 8, 2025
  insert into venues (name, city, state, capacity)
    values ('Ground Z3RO', 'Houston', 'TX', 550) returning id into v_venue_id;
  insert into promoters (name, company, email, phone)
    values ('Taylor Clay Christian', '7th Circle', 'Taylor.christian@gmail.com', '346-224-6496') returning id into v_promoter_id;
  insert into deals (title, artist_id, venue_id, promoter_id, show_date, offer_amount, status, created_by, notes)
    select 'Ground Z3RO — Houston, TX', v_ds_id, v_venue_id, v_promoter_id,
      '2025-08-08', 2000, 'completed', v_manager_id,
      'Headline. $2,000 + HGR. 18+, cap 550. Production contact: Anthony HTX 713-962-4962.';

  -- Brooklyn, NY — 3 Dollar Bill — Sep 5, 2025
  insert into venues (name, city, state, capacity)
    values ('3 Dollar Bill', 'Brooklyn', 'NY', 550) returning id into v_venue_id;
  insert into promoters (name, company, email, phone)
    values ('Greg Leano', 'Tempted Music Group', 'Greg@temptedmusicgroup.com', '732-314-8390') returning id into v_promoter_id;
  insert into deals (title, artist_id, venue_id, promoter_id, show_date, offer_amount, status, created_by, notes)
    select '3 Dollar Bill — Brooklyn, NY', v_ds_id, v_venue_id, v_promoter_id,
      '2025-09-05', 4000, 'completed', v_manager_id,
      'Headline. $4,000 + $750 bonus at 400 tickets ($5,500 walkout). Subfiltronik direct support (12:30–1:30am). Set 1:30–3:00am. 21+, cap 550. Hotel: Hilton Long Island City.';

  -- ==================================================================
  -- 2026 PAST SHOWS — post-TMTYL (all before today 2026-04-18)
  -- ==================================================================

  -- Albuquerque, NM — Effex Nightclub — Mar 6, 2026
  -- Conflicted with TMTYL Atlanta 3/6 — declined in favor of TMTYL route
  insert into venues (name, city, state, capacity)
    values ('Effex Nightclub', 'Albuquerque', 'NM', 500) returning id into v_venue_id;
  insert into promoters (name, company, email, phone)
    values ('Jonathan Markus', 'Black Sheep Presents', 'blacksheeppresents@gmail.com', '720-665-2433') returning id into v_promoter_id;
  insert into deals (title, artist_id, venue_id, promoter_id, show_date, offer_amount, status, created_by, notes)
    select 'Effex Nightclub — Albuquerque, NM', v_ds_id, v_venue_id, v_promoter_id,
      '2026-03-06', 3000, 'cancelled', v_manager_id,
      'DirtySnatcha + Mport package. $3,000 all-in + backend (HGR reimbursed after 250 sold). 21+, cap 500. Declined — conflicted with TMTYL Atlanta 3/6.';

  -- Tampa, FL — Mar 13, 2026
  -- Conflicted with TMTYL NYC (Avant Gardner) 3/13 — declined
  insert into venues (name, city, state, capacity)
    values ('TBD', 'Tampa', 'FL', null) returning id into v_venue_id;
  insert into promoters (name, company)
    values ('Unknown Promoter', 'Unknown') returning id into v_promoter_id;
  insert into deals (title, artist_id, venue_id, promoter_id, show_date, offer_amount, status, created_by, notes)
    select 'Tampa, FL — Mar 13, 2026', v_ds_id, v_venue_id, v_promoter_id,
      '2026-03-13', null, 'cancelled', v_manager_id,
      'Offer received Dec 2025. No offer sheet details available. Declined — conflicted with TMTYL NYC show 3/13.';

  -- Las Vegas, NV — Apr 3, 2026
  -- Reuse Dylan Phillips / RaveHouse if already in DB (inserted for Detroit in migration 003)
  select id into v_promoter_id from promoters where email = 'ravehousetalent@gmail.com' limit 1;
  if v_promoter_id is null then
    insert into promoters (name, company, email)
      values ('Dylan Phillips', 'RaveHouse Entertainment', 'ravehousetalent@gmail.com') returning id into v_promoter_id;
  end if;
  insert into venues (name, city, state, capacity)
    values ('TBD', 'Las Vegas', 'NV', null) returning id into v_venue_id;
  insert into deals (title, artist_id, venue_id, promoter_id, show_date, offer_amount, status, created_by, notes)
    select 'Las Vegas, NV — Apr 3, 2026', v_ds_id, v_venue_id, v_promoter_id,
      '2026-04-03', 2000, 'completed', v_manager_id,
      'Special guest headliner. $2,000 flat, no HGR. RaveHouse Entertainment / Dylan Phillips. 3-month radius clause (EDC events excluded).';

  -- Rochester, NY — Photo City Music Hall — Apr 11, 2026
  insert into venues (name, city, state, capacity)
    values ('Photo City Music Hall', 'Rochester', 'NY', 350) returning id into v_venue_id;
  select id into v_promoter_id from promoters where email = 'blacksheeppresents@gmail.com' limit 1;
  insert into deals (title, artist_id, venue_id, promoter_id, show_date, offer_amount, status, created_by, notes)
    select 'Photo City Music Hall — Rochester, NY', v_ds_id, v_venue_id, v_promoter_id,
      '2026-04-11', 2000, 'completed', v_manager_id,
      'Headline. $2,000 all-in + backend (HGR reimbursed after 175 sold). With Marc. 18+, cap 350. Black Sheep Presents.';

  -- Dallas-Ft Worth, TX — Insomnia Nightclub — Apr 17, 2026
  insert into venues (name, city, state, capacity)
    values ('Insomnia Nightclub', 'Fort Worth', 'TX', 500) returning id into v_venue_id;
  select id into v_promoter_id from promoters where email = 'blacksheeppresents@gmail.com' limit 1;
  insert into deals (title, artist_id, venue_id, promoter_id, show_date, offer_amount, status, created_by, notes)
    select 'Insomnia Nightclub — Dallas-Ft Worth, TX', v_ds_id, v_venue_id, v_promoter_id,
      '2026-04-17', 2000, 'completed', v_manager_id,
      'Headline. $2,000 + backend ($750 per 125 tix, $5,000 at sellout). Revised from flat vs deal. 18+, cap 500. Black Sheep Presents.';

  -- ==================================================================
  -- CURRENT SHOW — today 2026-04-18
  -- ==================================================================

  -- Tucson, AZ — The Rock — Apr 18, 2026
  insert into venues (name, city, state, capacity, contact_email)
    values ('The Rock', 'Tucson', 'AZ', 300, 'tyler@hiatusmusicentertainment.com') returning id into v_venue_id;
  insert into promoters (name, company, email, phone)
    values ('Tyler Hampton', 'Hiatus Music Entertainment', 'tyler@hiatusmusicentertainment.com', '248-978-4951') returning id into v_promoter_id;
  insert into deals (title, artist_id, venue_id, promoter_id, show_date, offer_amount, status, created_by, notes)
    select 'The Rock — Tucson, AZ', v_ds_id, v_venue_id, v_promoter_id,
      '2026-04-18', 1600, 'confirmed', v_manager_id,
      'Headline. $1,600 + bonuses: $100 at 150 tix, $125 at 250 tix, $175 at sellout (300) = $2,000 walkout. Hotel + ground covered. 18+, cap 300. Set 12:45–2:00am. Hiatus Music Entertainment.';

  -- ==================================================================
  -- UPCOMING SHOWS (confirmed or in-offer)
  -- ==================================================================

  -- Oklahoma City, OK — Bamboo Lounge — May 15, 2026
  insert into venues (name, city, state, capacity)
    values ('Bamboo Lounge', 'Oklahoma City', 'OK', 225) returning id into v_venue_id;
  select id into v_promoter_id from promoters where email = 'blacksheeppresents@gmail.com' limit 1;
  insert into deals (title, artist_id, venue_id, promoter_id, show_date, offer_amount, status, created_by, notes)
    select 'Bamboo Lounge — Oklahoma City, OK', v_ds_id, v_venue_id, v_promoter_id,
      '2026-05-15', 2000, 'confirmed', v_manager_id,
      'Headline. $2,000 + HR. 21+, cap 225. Black Sheep Presents / Circuit 360. Production: Brandon Lee 817-470-9760.';

  -- Austin, TX — The Courtyard ATX — Jul 18, 2026
  insert into venues (name, city, state, capacity)
    values ('The Courtyard ATX', 'Austin', 'TX', 550) returning id into v_venue_id;
  insert into promoters (name, company, email, phone)
    values ('Marco Chavez', 'Full Grind Entertainment', 'FullGrindEnt@gmail.com', '682-552-0003') returning id into v_promoter_id;
  insert into deals (title, artist_id, venue_id, promoter_id, show_date, offer_amount, status, created_by, notes)
    select 'The Courtyard ATX — Austin, TX', v_ds_id, v_venue_id, v_promoter_id,
      '2026-07-18', 2000, 'confirmed', v_manager_id,
      'Headline. $2,000 + $500 bonus at 350/450/500/550 tix ($4,000 walkout). $150 hotel buyout. 18+, cap 550. With Mport + more. Full Grind Entertainment.';

  -- DC/Baltimore area — Aug 22, 2026 — Package show
  insert into venues (name, city, state, capacity)
    values ('TBD', 'Edgewater', 'MD', null) returning id into v_venue_id;
  insert into promoters (name, company, email, phone)
    values ('Michael Wolfe', 'Purnima Music', 'purnimarecordlabel@gmail.com', '410-991-7937') returning id into v_promoter_id;
  insert into deals (title, artist_id, venue_id, promoter_id, show_date, offer_amount, status, created_by, notes)
    select 'DC/Baltimore area — Aug 22, 2026', v_ds_id, v_venue_id, v_promoter_id,
      '2026-08-22', 4500, 'offer', v_manager_id,
      'Package: DirtySnatcha + Ozztin + Mport. $4,500 guarantee + $1,500 sellout bonus ($500 at 800 tix, $1,000 at 950). $100 food/drink per artist in lieu of rider. 90/10 soft merch, 100% hard. 120mi/30-day radius. Purnima Music, 405 Penwood Dr, Edgewater MD.';

  -- Louisville, KY — Galaxie — TBD date
  insert into venues (name, city, state, capacity)
    values ('Galaxie', 'Louisville', 'KY', 200) returning id into v_venue_id;
  insert into promoters (name, company, email, phone)
    values ('Justin Fields', 'Kentucky EDM Family', 'Justin@KyEdm.org', '606-821-6058') returning id into v_promoter_id;
  insert into deals (title, artist_id, venue_id, promoter_id, show_date, offer_amount, status, created_by, notes)
    select 'Galaxie — Louisville, KY', v_ds_id, v_venue_id, v_promoter_id,
      null, 1000, 'offer', v_manager_id,
      'Headline. $1,000 + $250 sellout bonus (200 sold) + HGR. 21+, cap 200. $15 presale / $20 DOS. Date TBD. Kentucky EDM Family / Justin Fields. Signatory: Bradley Hammond.';

  -- Covington, KY — Galaxie — TBD date
  insert into venues (name, city, state, capacity)
    values ('Galaxie', 'Covington', 'KY', 225) returning id into v_venue_id;
  select id into v_promoter_id from promoters where email = 'Justin@KyEdm.org' limit 1;
  insert into deals (title, artist_id, venue_id, promoter_id, show_date, offer_amount, status, created_by, notes)
    select 'Galaxie — Covington, KY', v_ds_id, v_venue_id, v_promoter_id,
      null, 1000, 'offer', v_manager_id,
      'Headline. $1,000 + $250 sellout (200 sold) + 70% after 200 sold + HGR. Walkout $1,600. 21+, cap 225. $15 presale / $20 DOS. Date TBD. Kentucky EDM Family.';

  -- Lincoln, NE — The Royal Grove — TBD date
  insert into venues (name, city, state, capacity)
    values ('The Royal Grove', 'Lincoln', 'NE', 1000) returning id into v_venue_id;
  insert into promoters (name, company, email, phone)
    values ('Alexandru Grigorscu', 'GrigMusic Management', 'management@grigmusic.com', '213-332-6452') returning id into v_promoter_id;
  insert into deals (title, artist_id, venue_id, promoter_id, show_date, offer_amount, status, created_by, notes)
    select 'The Royal Grove — Lincoln, NE', v_ds_id, v_venue_id, v_promoter_id,
      null, 2000, 'offer', v_manager_id,
      'Headline. $2,000 guarantee. Capacity ~1,000. 50% deposit 30 days out. 200mi/60-day radius. All Ages GA / VIP 21+. Agent: Colton Anderson (PRYSM).';

  -- ==================================================================
  -- DECLINED / STALLED OFFERS
  -- ==================================================================

  -- Atlanta, GA — Dayglow ATL — TBD date (March/April 2026 Fridays)
  insert into venues (name, city, state, capacity)
    values ('Dayglow ATL Warehouse', 'Atlanta', 'GA', 1100) returning id into v_venue_id;
  insert into promoters (name, company, email)
    values ('Alexus Lindley', 'Dayglow ATL', 'dayglowatl@gmail.com') returning id into v_promoter_id;
  insert into deals (title, artist_id, venue_id, promoter_id, show_date, offer_amount, status, created_by, notes)
    select 'Dayglow ATL Warehouse — Atlanta, GA', v_ds_id, v_venue_id, v_promoter_id,
      null, 3000, 'offer', v_manager_id,
      'DJ set, 90-minute slot (12am–1:30am or 3:30–5am). $3,000 + travel/lodging/transport. Cap 1,100. Recurring Friday nights 10pm–6am. Agent named: Colton Anderson. Date TBD.';

  -- Pittsburgh, PA — SideQuest on 44th — TBD March 2026 (window now passed)
  insert into venues (name, city, state, capacity)
    values ('SideQuest on 44th', 'Pittsburgh', 'PA', 300) returning id into v_venue_id;
  insert into promoters (name, company, email, phone)
    values ('Brandon Hooven', 'SideQuest on 44th', 'Brandon.hooven@sidequestpgh.com', '717-979-5059') returning id into v_promoter_id;
  insert into deals (title, artist_id, venue_id, promoter_id, show_date, offer_amount, status, created_by, notes)
    select 'SideQuest on 44th — Pittsburgh, PA', v_ds_id, v_venue_id, v_promoter_id,
      null, 2500, 'cancelled', v_manager_id,
      'Headline. $2,500 + HGR ($50 hotel, $150 ground, $100 rider buyouts). 21+, cap 300. 100% merch to artist. 1st hold at offer time. Offer was for March 2026 — window passed. Agent: Colton/PRYSM.';

  -- Columbus, OH — Otherworld — TBD (offer via Amin Mohabbat/Disco Presents)
  insert into venues (name, city, state, capacity)
    values ('Otherworld', 'Columbus', 'OH', null) returning id into v_venue_id;
  insert into promoters (name, company, email)
    values ('Amin Mohabbat', 'Disco Presents', 'amin@discopresents.com') returning id into v_promoter_id;
  insert into deals (title, artist_id, venue_id, promoter_id, show_date, offer_amount, status, created_by, notes)
    select 'Otherworld — Columbus, OH', v_ds_id, v_venue_id, v_promoter_id,
      null, null, 'inquiry', v_manager_id,
      'Package: Badklat + Subfiltronik + DirtySnatcha. Offer forwarded to Colton Anderson (PRYSM) Apr 23, 2025. No offer sheet — PDF attachment not accessible. Date and guarantee unknown.';

end $$;
