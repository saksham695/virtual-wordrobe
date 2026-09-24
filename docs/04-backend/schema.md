# Schema — the single source of names

Postgres 15 on Supabase. Everything below is the literal DDL for `supabase/migrations/0001_init.sql`
(split into numbered files per the migration skill). Every table has RLS. Every name used anywhere
else in the docs is defined here.

## Extensions
```sql
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;
create extension if not exists vector;      -- reserved for D08; unused in V1
create extension if not exists pg_cron;
```

## Enums
```sql
create type wardrobe_type as enum ('men','women','both');
create type item_category as enum ('top','bottom','one_piece','footwear','layer','accessory','gymwear','ethnic','unsorted');
create type layer_role    as enum ('base','mid','outer','one_piece','accessory');
create type item_status   as enum ('active','laundry','archived');
create type archive_reason as enum ('doesnt_fit','worn_out','gave_away','sold','other');
create type source_from   as enum ('local_tailor','market','online','gift','inherited','other');
create type pattern_kind  as enum ('solid','stripe','check','print','floral','embroidered','unknown');
create type fabric_kind   as enum ('cotton','linen','denim','silk','wool','synthetic','knit','unknown');
create type season_kind   as enum ('summer','monsoon','winter','all');
create type outfit_source as enum ('feed','ai','manual','recreate','buycheck');
create type interaction_action as enum ('seen','save','unsave','skip','wear','share','shuffle');
create type pair_label_kind as enum ('positive','negative','worn');
create type job_kind      as enum ('process_item','detect_items','share_card','buy_check_parse','feed_warm');
create type job_status    as enum ('queued','running','done','failed','dead');
create type buy_verdict   as enum ('buy','maybe','skip','none');
```
Subcategories, colour families and style tags are **not** enums: they are versioned rows in
`taxonomy` (below) so prompts can evolve without a migration. The engine validates against
`knowledge/domain/taxonomy.json`, which is the same data.

## Tables

### profiles — one per auth user
```sql
create table profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  pseudo_id       uuid not null default uuid_generate_v4(),   -- analytics only; never joined to phone
  wardrobe_type   wardrobe_type not null default 'both',
  city            text,                      -- city name only; no coordinates ever
  pincode         text,
  timezone        text not null default 'Asia/Kolkata',
  occasions       text[] not null default '{}',   -- occasion ids from occasions.json
  plan            text not null default 'beta',   -- beta | free | pro (pro unused in V1)
  onboarding_step smallint not null default 0,    -- 0 none,1 type,2 city/occasions,3 done
  ai_enabled      boolean not null default true,
  consent_analytics boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
```

### taxonomy — versioned closed lists
```sql
create table taxonomy (
  kind      text not null,          -- subcategory | color_family | style_tag
  id        text not null,          -- e.g. 'kurta', 'navy', 'minimal'
  version   int  not null default 1,
  parent    text,                   -- subcategory → item_category; color_family → hue range
  meta      jsonb not null default '{}',
  primary key (kind, id, version)
);
-- seeded from knowledge/domain/taxonomy.json by supabase/seed.sql; read-only to users
```

### items
```sql
create table items (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references profiles(id) on delete cascade,
  -- what it is (from tagging; every one may be null/unknown)
  category        item_category not null default 'unsorted',
  subcategory     text,                          -- taxonomy(kind='subcategory')
  colors          jsonb not null default '[]',   -- [{name,hex,family,dominance}] dominant first
  pattern         pattern_kind not null default 'unknown',
  fabric          fabric_kind  not null default 'unknown',
  formality       smallint check (formality between 1 and 5),
  seasons         season_kind[] not null default '{all}',
  is_set          boolean not null default false,
  layer_role      layer_role,
  style_tags      text[] not null default '{}',
  tag_confidence  jsonb not null default '{}',   -- {category:0.9, colors:0.8, fabric:0.55 ...}
  tags_confirmed  boolean not null default false,
  tagger_version  text,                          -- e.g. 'tag-v1.3'
  embedding       vector(512),                   -- D08 reserved; null in V1
  -- life
  status          item_status not null default 'active',
  archive_reason  archive_reason,
  wear_count      int not null default 0,
  last_worn_at    timestamptz,
  laundry_since   timestamptz,
  -- images
  image_path      text not null,                 -- storage: closet/{user_id}/{item_id}/orig.webp
  cutout_path     text,                          -- closet/{user_id}/{item_id}/cut.webp (null until processed)
  thumb_path      text,
  cutout_quality  text,                          -- ok | ragged | failed
  source_photo_id uuid,                          -- groups items from one detect call
  -- optional, all nullable, none feed the engine
  brand           text,
  size_label      text,
  source_from     source_from,
  price           numeric(10,2),
  currency        text default 'INR',
  bought_on       date,
  notes           text,
  -- bookkeeping
  processing      text not null default 'queued', -- queued | tagging | done | failed
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index items_user_status on items(user_id, status);
create index items_user_cat    on items(user_id, category) where status = 'active';
create index items_user_unworn on items(user_id, last_worn_at nulls first) where status = 'active';
```

### tag_corrections — before/after, the training corpus
```sql
create table tag_corrections (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references profiles(id) on delete cascade,
  item_id     uuid not null references items(id) on delete cascade,
  field       text not null,          -- category | subcategory | colors | pattern | fabric | formality | seasons | style_tags
  before      jsonb,
  after       jsonb,
  tagger_version text,
  created_at  timestamptz not null default now()
);
create index tag_corr_user on tag_corrections(user_id, created_at);
```

### pairings — precomputed, symmetric, thresholded
```sql
create table pairings (
  user_id   uuid not null references profiles(id) on delete cascade,
  item_a    uuid not null references items(id) on delete cascade,
  item_b    uuid not null references items(id) on delete cascade,
  score     smallint not null check (score between 0 and 100),
  reasons   jsonb not null,          -- {color:28,formality:25,style:14,pattern:15,season:10,notes:['neutral + anything']}
  rules_version text not null,       -- 'rules-v1'
  penalty   smallint not null default 0,   -- skip-learned, decays; see engine.md
  updated_at timestamptz not null default now(),
  primary key (item_a, item_b),
  check (item_a < item_b)
);
create index pairings_user_a on pairings(user_id, item_a, score desc);
create index pairings_user_b on pairings(user_id, item_b, score desc);
```

### outfits
```sql
create table outfits (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references profiles(id) on delete cascade,
  slots         jsonb not null,      -- {top:uuid, bottom:uuid, one_piece:uuid, footwear:uuid, layer:uuid, accessories:[uuid]}
  item_ids      uuid[] not null,     -- denormalised for containment queries
  fingerprint   text not null,       -- sha1 of sorted item_ids; dedupe
  source        outfit_source not null,
  occasion      text,                -- occasion id when relevant
  score         smallint,
  novelty       boolean not null default false,   -- D03: no pair inside has a worn label
  reason        text,                -- one line (engine phrase or AI)
  ai_tip        text,
  saved         boolean not null default false,
  name          text,
  incomplete    boolean not null default false,   -- an item was archived/deleted
  rules_version text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (user_id, fingerprint)
);
create index outfits_user_saved on outfits(user_id, saved, updated_at desc);
create index outfits_items_gin  on outfits using gin(item_ids);
```

### interactions — every touch on an outfit
```sql
create table interactions (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references profiles(id) on delete cascade,
  outfit_id  uuid not null references outfits(id) on delete cascade,
  action     interaction_action not null,
  context    jsonb not null default '{}',   -- {surface:'feed'|'saved'|'ai'|'builder', filter:'office', reason:'too_formal'}
  occurred_at timestamptz not null default now()
);
create index interactions_user_time on interactions(user_id, occurred_at desc);
create index interactions_outfit    on interactions(outfit_id, action);
```

### wear_events — additive, never overwritten
```sql
create table wear_events (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references profiles(id) on delete cascade,
  item_id     uuid not null references items(id) on delete cascade,
  outfit_id   uuid references outfits(id) on delete set null,
  worn_on     date not null,
  occasion    text,
  weather     jsonb,                 -- snapshot {temp_c, condition}
  created_at  timestamptz not null default now(),
  unique (user_id, item_id, worn_on)   -- "worn twice same day counts once"
);
create index wear_user_day on wear_events(user_id, worn_on desc);
```

### pair_labels — D07, the dataset
```sql
create table pair_labels (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references profiles(id) on delete cascade,
  item_a      uuid not null references items(id) on delete cascade,
  item_b      uuid not null references items(id) on delete cascade,
  label       pair_label_kind not null,
  source      text not null,         -- feed_save | feed_skip | wear | builder_save | ai_save
  outfit_id   uuid references outfits(id) on delete set null,
  occurred_at timestamptz not null default now(),
  check (item_a < item_b)
);
create index pair_labels_user on pair_labels(user_id, occurred_at desc);
create index pair_labels_pair on pair_labels(item_a, item_b);
```

### usage — quotas, one row per user per month
```sql
create table usage (
  user_id     uuid not null references profiles(id) on delete cascade,
  month       text not null,          -- 'YYYY-MM' in user's timezone
  ai_calls    int not null default 0,
  bonus_calls int not null default 0,
  buy_checks_today int not null default 0,
  buy_checks_day   date,
  uploads_today    int not null default 0,
  uploads_day      date,
  ai_spend_paise   int not null default 0,
  throttled        boolean not null default false,
  primary key (user_id, month)
);
```

### jobs — the queue
```sql
create table jobs (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references profiles(id) on delete cascade,
  kind        job_kind not null,
  payload     jsonb not null,
  status      job_status not null default 'queued',
  attempts    smallint not null default 0,
  run_after   timestamptz not null default now(),
  last_error  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index jobs_ready on jobs(status, run_after) where status in ('queued','failed');
```

### events — append-only analytics (pseudonymous)
```sql
create table events (
  id            bigint generated always as identity primary key,
  pseudo_id     uuid not null,        -- profiles.pseudo_id; NEVER user_id
  event_type    text not null,        -- see §Events
  entity_id     uuid,
  payload       jsonb not null default '{}',
  app_version   text,
  schema_version smallint not null default 1,
  occurred_at   timestamptz not null default now(),
  tz            text
);
create index events_type_time on events(event_type, occurred_at);
-- no update/delete grants to anyone but the service role
```

### product_checks — V1-B
```sql
create table product_checks (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references profiles(id) on delete cascade,
  input_type    text not null,        -- url | screenshot | photo | manual
  input_ref     text,                 -- url, or storage path (deleted after session unless added)
  pseudo_item   jsonb not null,       -- same shape as item tags
  price         numeric(10,2),
  verdict       buy_verdict not null,
  evidence      jsonb not null,       -- {duplicates:[ids], similar:[ids], pairs:int, previews:[outfit slots], color_share:0.41, cpw:120, better_gap:{...}}
  overridden    boolean not null default false,
  added_item_id uuid references items(id) on delete set null,
  created_at    timestamptz not null default now()
);
```

## Row-level security
Enable on every table; policies are identical in shape:
```sql
alter table items enable row level security;
create policy items_owner on items for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
```
Repeat for `profiles` (`id = auth.uid()`), `tag_corrections`, `pairings`, `outfits`, `interactions`,
`wear_events`, `pair_labels`, `usage`, `jobs`, `product_checks`.
`taxonomy`: `select` to authenticated, no writes. `events`: **insert only** for authenticated with
`pseudo_id = (select pseudo_id from profiles where id = auth.uid())`; no select for users.
Edge functions run as the calling user (pass the JWT through); the service role is used only by
the job worker and crons, never reachable from the app.

## Storage
Buckets: `closet` (private), `shares` (private). Path policy on `closet`:
`(storage.foldername(name))[1] = auth.uid()::text`. All reads via signed URLs, TTL 1 h for cutouts,
10 min for originals. Originals of photos containing a face are never surfaced in the UI after
detection; only cutouts are.

## Triggers
- `items.updated_at`, `outfits.updated_at`, `jobs.updated_at`: `set updated_at = now()`.
- `after insert on wear_events`: `update items set wear_count = wear_count + 1, last_worn_at =
  greatest(last_worn_at, worn_on)`; `update outfits set … ` no-op (outfit wear is derived).
- `after update of status on items` (→ archived) or `after delete on items`: mark every outfit
  in `outfits where item_ids @> array[item_id]` as `incomplete = true`.
- `after insert on tag_corrections`: nothing — kept raw.

## Events (`events.event_type` and payload keys)
| event_type | payload | Goal |
|---|---|---|
| `signup_completed` | wardrobe_type, city_set, occasions_count | onboarding |
| `upload_started` | path | G1 |
| `upload_abandoned` | path, items_detected | G1 |
| `detection_corrected` | action (deselect/merge/split/adjust/retag) | tagging |
| `item_added` | category, confidence, corrected, optional_fields_filled | G1 |
| `hidden_outfits_seen` | owned, worn, surface (closet/profile/share) | D02 |
| `card_seen` | outfit_id, score, novelty, anchor_unworn_days | G2 |
| `card_saved` / `card_skipped` | outfit_id, novelty, reason? | G2 |
| `outfit_built_manually` | slots_filled, final_score | trust |
| `style_me_used` | occasion, candidates_count, fallback_used | AI value |
| `wear_marked` | source, item_count | G3 |
| `laundry_toggled` | items_count | adoption |
| `item_archived` | reason | tailoring signal |
| `share_created` | source | growth |
| `quota_hit` | type | pricing |
| `buy_check_started` / `buy_check_result` | input_type, verdict, outfits_unlocked, duplicates_found | V1-B |
| `buy_check_overridden` | verdict, action | V1-B |
| `app_open` | — | G3 |
