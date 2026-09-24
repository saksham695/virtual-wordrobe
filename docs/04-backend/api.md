# API — edge functions

Supabase Edge Functions (Deno, TypeScript). All take the user's JWT (`Authorization: Bearer`) and run
under that user's RLS. Shared code lives in `supabase/functions/_shared/` and imports
`packages/engine` and `packages/shared` (built to ESM). Direct Supabase reads/writes cover everything
not listed here (closet grid, item detail, saved outfits, profile) — no function for plain selects.

## Envelope
```ts
// success
{ ok: true, data: T, meta?: { quota?: {used:number, limit:number}, cached?: boolean } }
// failure
{ ok: false, error: { code: string, message: string, retryable: boolean, details?: unknown } }
```
Error codes: `unauthenticated · rate_limited · quota_exhausted · closet_too_small · invalid_input
· off_topic · not_found · upstream_failed · offline_only · payload_too_large`.
Every function: 10 req/min/user sliding window (`_shared/ratelimit.ts`, backed by a `usage`-adjacent
unlogged table); over → `rate_limited`, `Retry-After`.

---

## POST /detect-items
Multi-item detection on one photo. Synchronous (target p95 < 6 s).
```ts
Request  { photo_path: string /* storage path already uploaded by client */, mode: 'many'|'one' }
Response { photo_id: uuid, boxes: Array<{ id: string, x: number, y: number, w: number, h: number /* 0..1 */,
           kind: 'garment'|'accessory'|'not_clothing', confidence: number, selected: boolean }>,
           advisories: Array<'over_detection'|'overlap'|'person'|'dark'> }
```
Rules: cap 20 boxes (largest by area); `kind='not_clothing'` → `selected=false`; `mode='one'` returns
one full-frame box. Counts toward `uploads_today`. Errors: `invalid_input` (no photo), `upstream_failed`.

## POST /enqueue-items
Turns confirmed boxes into items and jobs. Returns immediately.
```ts
Request  { photo_id: uuid, boxes: Array<{ id: string, x,y,w,h: number, merged_from?: string[] }> }
Response { items: Array<{ item_id: uuid, box_id: string }> }
```
Creates `items` rows (`processing='queued'`, `image_path` = crop of the photo written by the function),
one `jobs(process_item)` each. Enforces 100 active items (`closet_full` via `quota_exhausted`
with `details.type='items'`) and 30 uploads/day.

## (job) process_item — see jobs.md
Cutout (fallback only) → tag → pairings → `processing='done'`. Not an HTTP endpoint.

## GET /feed?page=0&filter=office&color=navy
```ts
Response { cards: OutfitCard[], page: number, seed: string, exhausted: boolean, hint?: string }
OutfitCard = { outfit_id: uuid, slots: Slots, items: ItemLite[], score: number, novelty: boolean,
               badges: Array<'never_worn_together'|'unworn_30'|'unworn_90'|'weather'|'seen_before'>,
               reason: string }
ItemLite = { id, category, subcategory, cutout_url /*signed*/, colors, formality }
```
Pure engine. Seed = sha1(user_id + date + filter). Page size 10. Writes nothing (the client posts
`card_seen` via /track in batches). `hint` for the missing-category case. Closet < 8 active →
`closet_too_small` with `details.count`.

## GET /whatgoeswith?item_id=…
```ts
Response { outfits: OutfitCard[] /* ≤4 */, by_slot: Record<Slot, ItemLite[] /* ≤6, score desc */> }
```

## POST /style
The only per-request AI call.
```ts
Request  { occasion_id: string, note?: string /* ≤300 */, free_text_occasion?: string }
Response { looks: Array<{ outfit_id: uuid, slots: Slots, items: ItemLite[], reason: string, score: number }>,
           tip?: string, ranked_by: 'ai'|'rules', candidates_count: number, gap_hint?: string }
meta.quota = { used, limit }
```
Order of operations (all in one function, quota decrement is transactional):
1. resolve occasion (config row; `free_text_occasion` → nearest by formality/style, else `invalid_input` with a clarifying `details.question`)
2. candidates = engine.occasionCandidates(...) → 0 → `data.looks=[]`, `gap_hint`, **no call, no quota**
3. cache: `outfits where source='ai' and occasion=… and created_at::date=today and closet_version=…` → return, `meta.cached=true`
4. `note` topic check (`_shared/topic.ts`: allow-list of clothing vocabulary + occasion words; deny if < 1 hit or any of `email|essay|code|write me|translate`) → `off_topic`
5. quota check in transaction: `ai_calls + 1 <= 30 + bonus_calls` else `quota_exhausted` (beta: grant 10 bonus once, log `quota_hit`)
6. AI enabled + key present → LLM rank (stylist.md). Validate: every returned outfit must be one of the candidates by fingerprint; else discard and use rules. Timeout 8 s.
7. store `outfits(source='ai')`, decrement quota **only on AI success**; return.

## POST /track
Batched client events and interactions.
```ts
Request  { interactions?: Array<{ outfit_id, action, context?, occurred_at }>,
           wears?: Array<{ outfit_id?, item_ids: uuid[], worn_on: 'YYYY-MM-DD', occasion? }>,
           events?: Array<{ event_type, entity_id?, payload?, occurred_at }> }
Response { accepted: number, rejected: Array<{ index: number, reason: string }> }
```
Side effects: `save`/`skip`/`wear` write `pair_labels` for every pair in the outfit
(`positive`/`negative`/`worn`); `skip` bumps `pairings.penalty` (+8, cap 40); `wear` inserts
`wear_events` (unique per item per day). `events` are written with `pseudo_id`, never `user_id`.

## POST /share-card
```ts
Request  { outfit_id: uuid }
Response { url: string /* signed, 24 h */, width: 1080, height: 1920 }
```
Renders `OutfitComposition` server-side (satori → resvg) with the hidden-outfits line
("34 outfits from 74 clothes") and the wordmark. Enqueued as `share_card` job if > 2 s.

## POST /buy-check  (V1-B)
```ts
Request  { input_type: 'url'|'screenshot'|'photo'|'manual', url?: string, image_path?: string,
           manual?: { category, subcategory?, colors, formality }, price?: number }
Response { check_id: uuid, pseudo_item: Tags, verdict: 'buy'|'maybe'|'skip'|'none',
           evidence: { duplicates: ItemLite[], similar: ItemLite[], pairs: number, previews: OutfitCard[],
                       color_share: number, cost_per_wear?: number, better_gap?: { subcategory, adds: number } } }
```
`verdict='none'` when active items < 15. Max 20/day. URL parse failure → `upstream_failed`
with `details.fallback='screenshot'`. Non-clothing → `invalid_input` `details.reason='not_clothing'`.

## POST /delete-account
Purges rows (cascade) and both storage folders; returns `{ ok: true }`. Requires re-auth in the app.

## GET /hidden-outfits
```ts
Response { owned: number, worn: number, by_category_gap?: { subcategory: string, adds: number } }
```
engine.hiddenOutfits; cached per closet version (any items/pairings write bumps
`profiles.updated_at`, which is the version key).

## Client-side contracts (packages/shared)
All request/response types above are exported as zod schemas from `packages/shared/src/api.ts`
and used by both the app client (`apps/mobile/src/api/`) and the functions. A function that
returns something the schema rejects is a bug, not a client concern.
