-- ============================================================
-- 020: Add mlc_work_id + import 54 DSR Records Publishing MLC works
-- Source: mlc_work_report_2026-04-25-05-40-30.csv
-- Publisher: DirtySnatcha Records Publishing (ASCAP IPI 01238282844)
-- ============================================================

ALTER TABLE publishing_registrations
  ADD COLUMN IF NOT EXISTS mlc_work_id text;

COMMENT ON COLUMN publishing_registrations.mlc_work_id IS 'MLC Song Code assigned by The MLC (e.g. RO2HAU)';

-- Import 54 MLC-registered DSR catalog works
-- artist_id = DSR entity (7d8723b2-c919-4645-9b99-95dd379f631f)
INSERT INTO publishing_registrations
  (artist_id, title, isrc, bmi_registered, mlc_registered, mlc_work_id, soundexchange_registered, cmrra_registered, notes)
VALUES
('7d8723b2-c919-4645-9b99-95dd379f631f','RIDDIM WHISTLE',NULL,false,true,'RO2HAU',false,false,'Performer: Dennett (Denny Kourie) | DSR Publishing 50% | MLC registered'),
('7d8723b2-c919-4645-9b99-95dd379f631f','WASTING TIME WITH YOU',NULL,false,true,'W39ZMY',false,false,'Performer: Ennaut (Jason Moss IPI 01264388236) | ISWC T3284380496 | DSR Publishing 50%'),
('7d8723b2-c919-4645-9b99-95dd379f631f','FATE',NULL,false,true,'FA4WYF',false,false,'Performer: Twisted | Chutez & Ladderz | R3Mark (Chad Page, Drew White, Jacob Kramer) | DSR Publishing 100%'),
('7d8723b2-c919-4645-9b99-95dd379f631f','CLAPPED',NULL,false,true,'CI8V4G',false,false,'Performer: Skinz (Blake Skinner) | DSR Publishing 100%'),
('7d8723b2-c919-4645-9b99-95dd379f631f','HALF LIFE',NULL,false,true,'HP864M',false,false,'Performer: R3Mark | Twisted | Chutez & Ladderz (Chad Page, Drew White, Jacob Kramer) | DSR Publishing 100%'),
('7d8723b2-c919-4645-9b99-95dd379f631f','MOVIN',NULL,false,true,'MW0A5Z',false,false,'Performer: Rest N Piecez (Chad Smith) | DSR Publishing 50%'),
('7d8723b2-c919-4645-9b99-95dd379f631f','RIDDIMPTION',NULL,false,true,'RO2ODO',false,false,'Performer: Nothing X Hurts (Marti Bara) | DSR Publishing 50%'),
('7d8723b2-c919-4645-9b99-95dd379f631f','DEVIATE',NULL,false,true,'DQ3F5W',false,false,'Performer: SQISHI (Trey Brackenridge IPI 01122102831) | ISWC T3251816209 | DSR Publishing 100%'),
('7d8723b2-c919-4645-9b99-95dd379f631f','MAYKU',NULL,false,true,'MW0A9K',false,false,'Performer: Shockz | BANXY (Jordan Ainger, Tanner Swithenbank) | DSR Publishing 100%'),
('7d8723b2-c919-4645-9b99-95dd379f631f','RADIANCE',NULL,false,true,'RO2OFC',false,false,'Performer: Bou$hy (Max Bouchard) | DSR Publishing 50%'),
('7d8723b2-c919-4645-9b99-95dd379f631f','SUFFER',NULL,false,true,'S492AA',false,false,'Performer: Phobos & Deimos (Brady Estevanott, Sebastian Estevanott) | DSR Publishing 100%'),
('7d8723b2-c919-4645-9b99-95dd379f631f','FLASHBACK',NULL,false,true,'FA4W16',false,false,'Performer: Rest N Piecez (Chad Smith) | DSR Publishing 50%'),
('7d8723b2-c919-4645-9b99-95dd379f631f','APPARITION',NULL,false,true,'AW4X2T',false,false,'Performer: CVLVALRI (Leo Dalipe) | DSR Publishing 100%'),
('7d8723b2-c919-4645-9b99-95dd379f631f','DO IT',NULL,false,true,'DQ3GAT',false,false,'Performer: Champagne Poppers (Alex Mikulec, Carson Johnson) | DSR Publishing 50%'),
('7d8723b2-c919-4645-9b99-95dd379f631f','RAT PATROL',NULL,false,true,'RO2OHX',false,false,'Performer: Tonzology | Big City (Anthony West, Michael Moreno, Zachary Moreno) | DSR Publishing 100%'),
('7d8723b2-c919-4645-9b99-95dd379f631f','WEED SPOT',NULL,false,true,'W396QC',false,false,'Performer: Big City (Michael Moreno, Zachary Moreno) | DSR Publishing 100%'),
('7d8723b2-c919-4645-9b99-95dd379f631f','SPECTRE SEASON',NULL,false,true,'S499IJ',false,false,'Performer: Artifact (Jake Davies) | DSR Publishing 50%'),
('7d8723b2-c919-4645-9b99-95dd379f631f','ROUND 2',NULL,false,true,'RO2OJL',false,false,'Performer: Nekz | Meechie Murda (Demetrius Luster, Nahuel Cata) | DSR Publishing 100%'),
('7d8723b2-c919-4645-9b99-95dd379f631f','MANIAC',NULL,false,true,'MW0G2P',false,false,'Performer: Sinatra (Timothy Moon) | DSR Publishing 50%'),
('7d8723b2-c919-4645-9b99-95dd379f631f','FLATLINE',NULL,false,true,'FA4W51',false,false,'Performer: Gomperz (Tyler Twyford) | DSR Publishing 50%'),
('7d8723b2-c919-4645-9b99-95dd379f631f','TORTURE',NULL,false,true,'TX1DIA',false,false,'Performer: Chutez & Ladderz | Twisted | R3Mark (Chad Page, Drew White, Jacob Kramer) | DSR Publishing 100%'),
('7d8723b2-c919-4645-9b99-95dd379f631f','HEARTBREAKER',NULL,false,true,'HP9EBO',false,false,'Performer: Kryture (Guillaume Boyer) | DSR Publishing 50%'),
('7d8723b2-c919-4645-9b99-95dd379f631f','BRAINWASH',NULL,false,true,'BE7XVL',false,false,'Performer: Dark Matter (Isaac Tullos IPI 01262457258, Joseph Kalina IPI 01262457454) | ISWC T3282062373 | DSR Publishing 100%'),
('7d8723b2-c919-4645-9b99-95dd379f631f','HYPER DRIVE',NULL,false,true,'HP9ECE',false,false,'Performer: Contakt (Aidan Lynch IPI 01094974805) | ISWC T3251815999 | DSR Publishing 50%'),
('7d8723b2-c919-4645-9b99-95dd379f631f','BLOODTHIRSTY',NULL,false,true,'BE7XVY',false,false,'Performer: Howker (Brandon Campbell) | DSR Publishing 100%'),
('7d8723b2-c919-4645-9b99-95dd379f631f','TURN IT UP',NULL,false,true,'TX1KNY',false,false,'Performer: Yunit. (David Chapman) | DSR Publishing 50%'),
('7d8723b2-c919-4645-9b99-95dd379f631f','TIGER KUNG FU',NULL,false,true,'TX1KOK',false,false,'Performer: Neon Tiger (Royal Thomas) | DSR Publishing 50%'),
('7d8723b2-c919-4645-9b99-95dd379f631f','BACK IN THE JEANSTALK',NULL,false,true,'BE7XWT',false,false,'Performer: Fixxer (Emille Haghbedeh IPI 00385197814) | ISWC T3251815819 | DSR Publishing 100%'),
('7d8723b2-c919-4645-9b99-95dd379f631f','THE DEVIL',NULL,false,true,'TX1KPI',false,false,'Performer: Hostyle (Riley Young) | DSR Publishing 50%'),
('7d8723b2-c919-4645-9b99-95dd379f631f','FOG HORN',NULL,false,true,'FA44CA',false,false,'Performer: Dennett (Denny Kourie) | DSR Publishing 50%'),
('7d8723b2-c919-4645-9b99-95dd379f631f','TERROR',NULL,false,true,'TX1KTT',false,false,'Performer: Ennaut (Jason Moss IPI 01264388236) | ISWC T3284380963 | DSR Publishing 50%'),
('7d8723b2-c919-4645-9b99-95dd379f631f','OPERATOR ERROR',NULL,false,true,'OM6YLJ',false,false,'Performer: Big City (Michael Moreno, Zachary Moreno) | DSR Publishing 100%'),
('7d8723b2-c919-4645-9b99-95dd379f631f','PTSD',NULL,false,true,'PN2W1Q',false,false,'Performer: Shockz (Jordon Ainger) | DSR Publishing 50%'),
('7d8723b2-c919-4645-9b99-95dd379f631f','CHIN CHECK',NULL,false,true,'CI5Y3L',false,false,'Performer: Spirtual Gangsters (Derek Glowacki, Vanessa Lee) | DSR Publishing 100%'),
('7d8723b2-c919-4645-9b99-95dd379f631f','POWER TRANSIENT',NULL,false,true,'PN235H',false,false,'Performer: Hexadrone (Ruben Quispe) | DSR Publishing 50%'),
('7d8723b2-c919-4645-9b99-95dd379f631f','ALWAYS GOT ME',NULL,false,true,'AW45UP',false,false,'Performer: Ennaut (Jason Moss IPI 01264388236) | ISWC T3284381079 | DSR Publishing 100%'),
('7d8723b2-c919-4645-9b99-95dd379f631f','DEATH MATCH',NULL,false,true,'DQ3NVD',false,false,'Performer: Joogornot (William Wilson) | DSR Publishing 100%'),
('7d8723b2-c919-4645-9b99-95dd379f631f','ICEPICK',NULL,false,true,'I29ZHH',false,false,'Performer: Barooka (Michael Thomas, Mike Silva) | DSR Publishing 100%'),
('7d8723b2-c919-4645-9b99-95dd379f631f','DROP',NULL,false,true,'DQ3UY1',false,false,'Performer: Ennaut (Jason Moss IPI 01264388236) | ISWC T3284380656 | DSR Publishing 50%'),
('7d8723b2-c919-4645-9b99-95dd379f631f','SPEAKERBOX',NULL,false,true,'S50O59',false,false,'Performer: Barooka (Ryan O''Donnell IPI 00375462637) | ISWC T3281918110 | DSR Publishing 50%'),
('7d8723b2-c919-4645-9b99-95dd379f631f','NO TRACES',NULL,false,true,'N790R0',false,false,'Performer: Trenches | Virg (Kirby Bright, Virdell Robinson IPI 01050123133) | DSR Publishing 25%'),
('7d8723b2-c919-4645-9b99-95dd379f631f','BOSS',NULL,false,true,'BE75B3',false,false,'Performer: Entravert (Branden Bush) | DSR Publishing 100%'),
('7d8723b2-c919-4645-9b99-95dd379f631f','ASSERTION',NULL,false,true,'AW5C61',false,false,'Performer: Aalioura (Huda Batanjeh IPI 01160443588) | Member Song ID DSR76 | DSR Publishing 100%'),
('7d8723b2-c919-4645-9b99-95dd379f631f','KINDA SUS',NULL,false,true,'KC54OI',false,false,'Performer: Akronym (Joseph Torres) | DSR Publishing 50%'),
('7d8723b2-c919-4645-9b99-95dd379f631f','IDISTORT',NULL,false,true,'I296OI',false,false,'Performer: Barooka (Michael Thomas, Mike Silva) | DSR Publishing 100%'),
('7d8723b2-c919-4645-9b99-95dd379f631f','WAKE UP',NULL,false,true,'W40D7W',false,false,'Performer: LUC (Lucas Powers) | DSR Publishing 100%'),
('7d8723b2-c919-4645-9b99-95dd379f631f','RUDEBOY',NULL,false,true,'RO2V26',false,false,'Performer: Barooka (Guillaume Boyer, Peter Karzis) | DSR Publishing 100%'),
('7d8723b2-c919-4645-9b99-95dd379f631f','BREAK BEAT',NULL,false,true,'BE75GQ',false,false,'Performer: KRXNIK (Michele Failla IPI 01241468663) | ISWC T3286282375 | co-pub MIKAYLI (IPI 01241468565) | DSR Publishing 50%'),
('7d8723b2-c919-4645-9b99-95dd379f631f','NO PROBLEMS',NULL,false,true,'N797X8',false,false,'Performer: Barooka | Tonzology (Anthony West, Michael Moreno, Zachary Moreno) | DSR Publishing 100%'),
('7d8723b2-c919-4645-9b99-95dd379f631f','FLU',NULL,false,true,'FA5BV2',false,false,'Performer: Chutez & Ladderz | Twisted | R3Mark (Chad Page, Drew White, Jacob Kramer) | DSR Publishing 100%'),
('7d8723b2-c919-4645-9b99-95dd379f631f','WHOA',NULL,false,true,'W40EBK',false,false,'Performer: Kirbybright | Devious (Kirby Bright, Sean Bannard) | DSR Publishing 100%'),
('7d8723b2-c919-4645-9b99-95dd379f631f','SCREECHBOI',NULL,false,true,'S503X8',false,false,'Performer: Barooka (Michael Thomas, Mike Silva) | DSR Publishing 100%'),
('7d8723b2-c919-4645-9b99-95dd379f631f','KILLAS',NULL,false,true,'KC54QN',false,false,'Performer: TMBRWLF | Bandido (Aaron Lopez, Andrew Potter) | DSR Publishing 100%'),
('7d8723b2-c919-4645-9b99-95dd379f631f','PRESSURE',NULL,false,true,'PN3BO0',false,false,'Performer: Barooka (Mike Silva) | DSR Publishing 25%');
