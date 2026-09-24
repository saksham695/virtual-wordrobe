# Jobs, queue, crons, cost control

## The queue
`jobs` table (schema.md). Worker: edge function `worker` invoked by `pg_cron` every 15 s with the
service role (`select net.http_post(...)`). It claims up to 10 rows with
`update jobs set status='running', attempts=attempts+1 where id in (select id from jobs where
status in ('queued','failed') and run_after <= now() and attempts < 4 order by created_at limit 10
for update skip locked) returning *`.

| kind | payload | does | retry |
|---|---|---|---|
| `process_item` | `{item_id}` | 1. if `cutout_path` null → try server cutout (rembg container; `cutout_quality` ok/ragged/failed; failed → soft-crop of orig) 2. tag via `06-ai/tagging.md` → write tags + `tag_confidence` + `tagger_version` 3. `pairScore` vs every active item of the user; upsert `pairings` ≥55 4. `processing='done'`; bump `profiles.updated_at` | ×3, backoff 30 s · 2 min · 10 min; then `dead` + item stays `unsorted` with retry badge |
| `share_card` | `{outfit_id}` | render → `shares/{user}/{outfit}.png` | ×2 |
| `buy_check_parse` | `{check_id}` | URL fetch / vision parse → `pseudo_item` | ×1 then `fallback='screenshot'` |
| `feed_warm` | `{user_id, date}` | precompute page 0 into an unlogged `feed_cache` | ×1 |

Idempotency: every job is safe to re-run; `process_item` skips steps already reflected on the row.
The closet never loses a photo: `items.image_path` is written before the job exists.

## Crons (`pg_cron`, service role)
| schedule | job | does |
|---|---|---|
| `* * * * *` (every min, 4×) | worker | above |
| `0 3 * * *` | `cost_throttle` | sum `usage.ai_spend_paise` per user for the month; > 5000 (₹50) → `throttled=true`, alert (email via Resend or a Slack webhook); throttled users get `quota_exhausted` on `/style` |
| `0 4 * * *` | `penalty_decay` | `pairings.penalty = greatest(0, penalty − 4)` where updated > 7 d ago |
| `0 5 * * *` | `laundry_nudge` | items `status='laundry'` and `laundry_since < now() − 14 d` → push "Still in the wash?" once |
| `30 5 * * *` | `forgotten_nudge` | per user ≤1/week: an active item `last_worn_at < now() − 120 d` with ≥3 outfits ≥65 → push "Unworn for 4 months — 3 ways to wear it" |
| `0 6 * * *` | `feed_warm` enqueue | for users active in the last 7 days |
| `0 2 * * *` | `events_rollup` | `closet_facts` aggregates with k ≥ 50 (design.md §14); V1: table exists, job runs, nothing reads it |

## Cost ledger
Every AI call (tag, style, buy parse) writes `ai_spend_paise` on `usage` from the provider's token
usage × a price table in `supabase/functions/_shared/prices.ts`. Target: < ₹25 per active user per
month (PRD counter-metric). `/style` also checks `throttled`.

## Rate limiting
`_shared/ratelimit.ts`: unlogged table `rate_hits(user_id, window_start, hits)`, 60 s windows,
limit 10; `detect-items` additionally 30/day via `usage.uploads_today`.

## Local dev
`supabase start` → run migrations → `supabase functions serve`. The worker can be invoked
manually: `curl -X POST localhost:54321/functions/v1/worker -H "Authorization: Bearer $SERVICE_ROLE"`.
`packages/engine` tests run with `pnpm -F engine test` and need no Supabase.
