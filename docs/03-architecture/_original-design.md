# Digital wardrobe: end-to-end design

The complete technical design: screens, data model, image pipeline, pairing engine, AI stylist, APIs, security, and cost controls. Everything needed to start building with Claude Code today.

Stack: Expo React Native · Supabase (Postgres, Auth, Storage, Edge Functions) · cheap vision + text LLM APIs. Phase 0 scope, with Phase 1–2 hooks marked.

## 1. The system in one pass

One write path, two read paths:

  * **Write path (once per item):** photo → on-device cutout → upload → vision tagging → tags stored → pairing scores computed against the rest of the closet.
  * **Cheap read path (every day):** feed and "what goes with this?" are plain Postgres queries over precomputed pairings. Zero AI cost, instant.
  * **Paid read path (metered):** occasion stylist sends text tags to an LLM, which ranks rule-filtered outfits and explains them. This is the only per-use AI cost, so it's the only thing behind quotas.

**Design rule:** AI runs at write time (once) and at explicit "style me" moments (metered). It never runs per scroll, per screen, or per feed card.

## 2. User journey

**Onboard** 2 min: phone OTP, men/women/both, city, occasions

**Fill closet** 10 min: bulk photos, auto tags, quick fixes

**Scroll feed** Daily: outfit cards from own clothes

**Style me** Metered: occasion looks with reasons

**Track** Wore it, laundry, favourites

### Screens (Phase 0: 9 screens)

  1. **Onboarding** — OTP login, wardrobe type (men / women / both), city for weather, top 3 occasions.
  2. **Closet** — grid by category, laundry toggle on each item, search/filter, "+" entry to add flow.
  3. **Add items** — camera or multi-select gallery; shows cutout + tags per item; tap any wrong tag to fix; "Add 8 items" confirm.
  4. **Item detail** — big cutout, tags, wear history, "What goes with this?" grid, mark laundry/archive.
  5. **Feed** — vertical outfit cards; double-tap save, swipe skip; filter chips (occasion, colour, weather, unworn 30d, gym, ethnic).
  6. **Outfit detail** — items laid out flat-lay style, one-line reason, buttons: Wear today · Save · Share card · Shuffle one item.
  7. **Style me** — occasion picker + optional one-line note ("black jeans in wash"), returns 3 looks; shows remaining quota.
  8. **Favourites** — saved outfits, re-wear tracking.
  9. **Profile** — stats (items, most/least worn), settings, plan status, paywall entry (off in Phase 0).

## 3. Data model
    
    
    ```mermaid
    erDiagram
      PROFILES ||--o{ ITEMS : owns
      PROFILES ||--o{ OUTFITS : has
      ITEMS ||--o{ PAIRINGS : scored_in
      OUTFITS ||--o{ INTERACTIONS : receives
      PROFILES ||--|| USAGE : metered_by
      PROFILES {
        uuid id PK
        text handle
        text wardrobe_type
        text city
        text[] occasions
        text plan
      }
      ITEMS {
        uuid id PK
        uuid user_id FK
        text category
        text subcategory
        jsonb colors
        text pattern
        text fabric
        int formality
        text[] seasons
        bool is_set
        text layer_role
        text status
        timestamptz last_worn_at
        int wear_count
        text image_path
        bool tags_confirmed
        text brand
        text size_label
        text source_from
        numeric price
        date bought_on
        text notes
      }
      PAIRINGS {
        uuid item_a PK_FK
        uuid item_b PK_FK
        uuid user_id FK
        int score
        jsonb reasons
      }
      OUTFITS {
        uuid id PK
        uuid user_id FK
        uuid[] item_ids
        text occasion
        text source
        int score
        text explanation
      }
      INTERACTIONS {
        uuid id PK
        uuid user_id FK
        uuid outfit_id FK
        text action
        timestamptz created_at
      }
      USAGE {
        uuid user_id PK
        text month PK
        int ai_calls
        int items_added
      }
    
    ```

  * `items.status` ∈ `active | laundry | archived` — laundry items are excluded from every suggestion query. This one enum is the "it knows my life" feature.
  * `items.is_set` \+ `layer_role` ∈ `base | mid | outer | one_piece | accessory` — handles dresses, kurta sets and co-ords as one piece, and dupattas/jackets as layers. One schema serves men and women.
  * `pairings` stores only pairs above threshold (score ≥ 55), with `item_a < item_b` to avoid duplicates. 100 items ≈ a few thousand rows. Trivial.
  * `outfits.source` ∈ `feed | ai | manual | recreate` — `recreate` is the Phase 2 social hook, already in the enum.
  * `interactions.action` ∈ `save | skip | wear | share` — this is the taste-learning signal and the analytics table in one.
  * Phase 1–2 tables added later, nothing blocks them now: `product_checks` (buy help), `follows`, `public_outfits`, `affiliate_clicks`, `creator_payouts`.

### Optional item fields — every one nullable

Indian wardrobes are full of local-tailor kurtas, market buys and hand-me-downs with no label at all. These columns are `NULL` by default, never required, and the app must be fully usable if all of them stay empty forever. None of them feeds the pairing engine.

Field| Input| Why it exists  
---|---|---  
`brand`| Free text + autocomplete of brands the user already typed| Resale listings, size guidance later. Free text so "local tailor" or "gift" is a valid answer; never a fixed dropdown.  
`size_label`| Free text| "M", "40", "custom stitched" all valid. Sizes aren't standard across brands, so no enum.  
`source_from`| Chips: local tailor · market · online · gift · inherited · other| Easier to answer than brand, and more informative for ethnic wear. Tap-only, one second.  
`price`| Number| Powers cost-per-wear stats, which is a strong retention hook. Purely opt-in.  
`bought_on`| Date| Age of wardrobe, "you've had this 3 years and worn it twice".  
`notes`| Free text| "Needs altering", "gift from mom", "only fits after gym". Also feeds Phase 3 tailoring demand.  
  
  * **Label OCR as the shortcut:** an optional second photo of the care/size label fills `brand`, `size_label` and fabric from printed text, which is accurate, unlike guessing brand from the garment photo. Offered, never required.
  * **UI rule:** optional fields live behind an "Add details" chip on the item screen, never as a step in the upload flow. No completion bars, no "finish your item" nags — an untagged item must never feel second-class.
  * **Query rule:** every filter and suggestion treats `NULL` as "unknown", never as a mismatch, so unlabelled items appear in the feed exactly as often as labelled ones.

## 4. Item tagging spec

The vision model returns exactly this JSON per photo; it maps 1:1 to the `items` row. Enums are closed lists so the pairing engine never meets a surprise value.
    
    
    {
      "category": "top | bottom | one_piece | footwear | layer | accessory | gymwear | ethnic",
      "subcategory": "shirt | tshirt | polo | kurta | jeans | chinos | saree | lehenga_set | ...",
      "colors": [{ "name": "navy", "hex": "#1F3A5F", "dominance": 0.7 }],
      "pattern": "solid | stripe | check | print | floral | embroidered",
      "fabric": "cotton | linen | denim | silk | wool | synthetic | knit",
      "formality": 1-5,          // 1 gym, 2 casual, 3 smart-casual, 4 formal, 5 occasion/festive
      "seasons": ["summer", "monsoon", "winter", "all"],
      "is_set": false,
      "layer_role": "base | mid | outer | one_piece | accessory",
      "style_tags": ["minimal", "streetwear", "ethnic", "classic"],
      "confidence": 0.92
    }
    ```

  * `confidence < 0.7` → the add flow highlights that item for a quick human check. Users fixing tags is training data for your prompt, so log corrections.
  * Test the prompt on a 100-photo set (50 men's, 50 women's, heavy on Indian ethnic wear) before beta. This prompt is your most valuable file; version it in git.
  * **The model never guesses brand or size.** Both are absent from this schema on purpose: garments look alike across brands and a photo carries no scale reference, so a guess is wrong often enough to erode trust. They come from the user or from label OCR, or they stay `NULL`.

## 5. Image pipeline

  1. **Capture:** camera or gallery multi-select, client resizes longest edge to 1200px, ~200 KB WebP.
  2. **Cutout on device:** iOS subject lift / Android ML Kit segmentation. Free, instant, offline.
  3. **Fallback cutout:** if on-device fails (confidence low or unsupported device), edge function calls a self-hosted `rembg` container. Budget path only.
  4. **Upload:** original + cutout to Supabase Storage at `closet/{user_id}/{item_id}/`; signed URLs, never public buckets.
  5. **Tag:** edge function sends the cutout (smaller, cleaner than the original) to the vision model → JSON above → insert row.
  6. **Pair:** same function computes pairing scores of the new item against all active items and bulk-inserts. 100 existing items = 100 cheap pure-TS computations, no AI.

Queue note: do steps 5–6 in a background job per item (Supabase queues or a simple `jobs` table) so a 30-photo bulk upload returns to the UI immediately and items "pop in" as they finish tagging.

## 6. Pairing engine pure code, no AI

A deterministic score 0–100 for any two items. Runs at upload time, stored in `pairings`.

Signal| Weight| Rule  
---|---|---  
Colour harmony| 30| Neutral (white, black, grey, navy, beige, denim) with anything = full marks. Same-family monochrome = high. Complementary/analogous via hue distance = medium-high. Clash pairs (e.g. two saturated non-complementary brights) = heavy penalty.  
Formality gap| 25| |f_a − f_b| of 0–1 = full; gap 2 = half; gap ≥ 3 = near zero (blazer + track pants dies here).  
Style coherence| 20| Overlapping `style_tags` = full; ethnic + streetwear etc. penalised unless a tag whitelists fusion.  
Pattern rule| 15| Solid + anything = full. Two patterns = allowed only if one is subtle (thin stripe/small check); two bold prints = near zero.  
Season overlap| 10| Shared season or either is "all" = full; disjoint (wool + linen) = zero.  
  
  * Score ≥ 55 → stored as a pairing. `reasons` jsonb keeps per-signal scores so the UI can say "colours work, formality stretch".
  * Slot rules on top of scores: an outfit = 1 base top + 1 bottom (or 1 one_piece) + footwear, optional mid/outer layer, 0–3 accessories. Sets occupy their slots atomically.
  * Ship v1 rules, then tune weekly against beta save/skip data. This table is where "designer knowledge" lives; expect 5–10 tuning passes.

## 7. Feed and outfit assembly pure code, no AI

  1. Pick an anchor item, biased: 40% least-recently-worn actives, 30% favourites' neighbours, 30% random. This is how the back of the cupboard resurfaces.
  2. Fill slots greedily from the anchor's top pairings, checking pairwise scores across all chosen items (average pairwise score = outfit score).
  3. Boosts: matches today's weather (+), occasion filter match (+), contains an item unworn 30+ days (+), colour the user saves often (+, learned from `interactions`).
  4. Diversity guard: no item appears in more than 2 of any 10 consecutive cards; skip-heavy combos decay via a simple per-pair penalty.
  5. Generate 10 cards per page server-side in the `get-feed` edge function; seeded by date so the day's feed is stable and cacheable.

## 8. AI stylist metered

The only per-request LLM call. The rules engine builds 8–12 candidate outfits for the occasion; the LLM never invents combinations, it ranks and explains.
    
    
    system: You are a men's and women's stylist. Only discuss the user's
    clothes. Answer in JSON: {picks: [{items, one_line_reason}], tip}.
    Never suggest items not in the list. Max 3 picks.
    
    user: Occasion: day mehendi. Weather: 31°C sunny. Note: "black jeans in wash".
    Style: likes minimal, earthy. Candidates:
    1. [navy cotton kurta f5, beige chinos f3, tan loafers f3] pair_avg 78
    2. ...
    ```

  * Input: text tags only, ~1–2k tokens. Output capped at ~300 tokens. Cost well under ₹0.2 per call.
  * The free-text note is capped at 300 chars and passes a cheap topic check; off-topic → fixed refusal string, no LLM call wasted.
  * Result stored in `outfits (source='ai')` so re-opening it is free.

## 9. API surface (edge functions)

Function| Auth| Does  
---|---|---  
`process-item`| user| Fallback cutout → vision tag → insert item → compute pairings. Called per item by the upload queue.  
`get-feed`| user| Paginated outfit cards from pairing table + boosts. Pure SQL/TS.  
`style-occasion`| user| Quota check → candidate assembly → LLM rank/explain → store + return. Increments `usage.ai_calls` atomically.  
`track`| user| Writes `interactions`; updates `last_worn_at`/`wear_count` on "wear".  
`share-card`| user| Composes the flat-lay share image (satori/canvas) with logo; returns a URL.  
`buy-check` Phase 1| user| Parse product link/screenshot → pseudo-item tags → pairing count + duplicates + affiliate link.  
  
Direct Supabase reads (no function needed): closet grid, item detail, favourites, profile stats — all plain selects under RLS.

## 10. Security and privacy

  * **RLS on every table:** `user_id = auth.uid()` for select/insert/update/delete. No service-role key ever ships in the app.
  * **Storage:** per-user folder policy mirrors RLS; images served via short-lived signed URLs.
  * **Private by default:** nothing is visible to anyone else in Phase 0. Phase 2 publicness is per-outfit opt-in via a separate `public_outfits` table, never a flag that flips the whole closet.
  * **LLM hygiene:** user free-text is data, not instructions — it's wrapped in a delimited block, and the system prompt ignores instructions inside it.
  * **Deletion:** account delete = rows + storage folder purge; required for store listing anyway.

## 11. Guardrails and cost control

Risk| Control  
---|---  
Prompt spam| `usage.ai_calls` checked in-transaction: 30/month basic, 5 lifetime free trial calls. Hard stop with upgrade prompt.  
Upload spam| Free plan: 100 active items, 30 uploads/day. Each upload is a vision call, so this caps the write-path cost too.  
Scripted abuse| Per-user sliding-window rate limit (10 req/min) in the edge functions; Play Integrity / App Check so only real app builds reach the API.  
ChatGPT-through-the-side-door| Topic check + 300-char cap + 300-token output cap + fixed occasion enum. There is no general chat endpoint at all.  
Runaway bill| Daily cron sums per-user AI spend; > ₹50/month auto-throttles and alerts you. Provider-side monthly budget alarm as the backstop.  
  
## 12. Analytics events

PostHog, one table of truth for the three Phase 0 goals:

  * `upload_started`, `item_added`, `upload_abandoned` → goal 1 (30+ items in 10 min).
  * `card_seen`, `card_saved`, `card_skipped` → goal 2 (≥ 60% positive).
  * `app_open` (daily), `wear_marked` → goal 3 (3+ days/week retention).
  * `share_created`, `style_me_used`, `quota_hit` → monetisation signal for Phase 1.

## 13. Build order with Claude Code

  1. **Weekend 1:** Supabase schema + RLS + Expo scaffold + auth + closet grid + add-items flow with on-device cutout. (End state: your own clothes in the app.)
  2. **Weekend 2:** `process-item` with vision tagging + pairing engine + "what goes with this?" screen. (End state: real matches from your closet.)
  3. **Week 3 evenings:** feed + boosts + favourites + laundry + `style-occasion` with quotas + share card.
  4. **Week 4:** analytics, polish, TestFlight/Play internal, 30–40 beta users, watch uploads in person.

**Honest complexity check:** ~6 tables, ~5 edge functions, 9 screens, two stateless AI calls. No realtime, no payments, no social graph yet. For a senior frontend engineer with Claude Code, the code is 2 weekends + evenings; the real month goes into cutout quality and pairing-rule tuning against real closets.

## 14. Data foundations for later use

Decisions to take now, because retrofitting them costs a migration and lost history. The goal: wardrobe data that can later answer "what do people in this city actually own and wear?" without ever exposing an individual.

### Capture shape

  * **Append-only event log.** One `events` table: `(event_id, user_pseudo_id, event_type, entity_id, payload jsonb, occurred_at, app_version, schema_version)`. Never update or delete rows; state tables are derived. You can recompute any metric you didn't think of yet, which is the whole point.
  * **Pseudonymous IDs everywhere in analytics.** `user_pseudo_id` is a random UUID mapped to the real account in one small table only. Analytics queries and exports never join to phone numbers, names or photos.
  * **Stable taxonomy IDs, not free strings.** `subcategory_id = 42` with a versioned lookup table beats the text "polo", which will drift as prompts change. Same for colours: store both the raw hex and a fixed colour-family ID.
  * **Version every derived field.** Tag rows carry `tagger_version`; pairing rows carry `rules_version`. When you retune weights, old data stays interpretable instead of silently mixing two definitions.
  * **Record corrections, not just results.** When a user fixes a tag, store the before and after. That corpus is the most valuable thing you'll own for improving the model, and nobody else can buy it.

### Geography and time

  * Store **city and pincode-level** location only, entered or coarsely derived, never precise coordinates or location history. City granularity answers every brand question and avoids building a tracking database.
  * Store timestamps in UTC with the user's timezone alongside, so "what people wear on Sunday evenings" stays answerable.
  * Tag wear events with the occasion and the weather snapshot at the time. Weather is re-fetchable in theory, historically expensive in practice — snapshot it.

### Aggregation layer, built early

  * A nightly job rolls events into `closet_facts`: per city, per gender segment, per subcategory — counts owned, wear rates, colour distribution, formality mix, seasonal shifts. Brand-facing output is only ever read from this layer.
  * **k-anonymity threshold:** suppress any cell covering fewer than 50 users. A city with 12 users produces no row at all.
  * No free-text fields (notes, brand strings typed by users) ever reach the aggregate layer — they leak identity.
  * Keep the raw layer and the aggregate layer physically separate, with different access. The aggregate layer is what an analyst, a partner or a future dashboard touches.

### Consent and what can actually be sold

  * India's DPDP Act works on **purpose-limited consent** : a notice at signup must state each purpose plainly, and analytics or brand insights is a separate purpose from running the app — with its own toggle, defaulted off or explicitly opted into, and withdrawable.
  * **App store rules matter as much as the law.** Google Play's User Data policy prohibits selling personal and sensitive user data outright; Apple requires disclosed, consented data use. So the sellable product is **aggregate insight** ("38% of Delhi men aged 25–34 own more than 4 blue shirts"), never rows about people, and never identifiable photos.
  * Photos are the hardest asset: treat them as strictly private, never part of any dataset, and never used for model training without separate explicit consent.
  * Deletion must cascade: account delete purges raw events and photos, and the aggregate layer is rebuilt without that user. Design it now; bolting it on later is painful.
  * Keep a written data map (what is collected, why, where it lives, how long). You will need it for the privacy policy, for store review, and for any brand conversation.

**Honest framing:** the brand-insights business needs scale that V1 won't have — tens of thousands of active wardrobes before a single cell clears the anonymity threshold in more than a couple of cities. Build the capture shape now because it's nearly free; treat the revenue as a Phase 3+ possibility, not a plan.

## 15. Later sections, hooks only

  * **Follow wardrobes (Phase 2):** already hooked via `outfits.source='recreate'`. Adds `follows`, `public_outfits` (per-outfit opt-in, never a closet-wide flag), and a moderation queue. Public outfits carry no optional free-text fields.
  * **Accessories (Phase 3):** empty accessory slots in the pairing engine are the trigger; needs `affiliate_clicks` and a partner catalogue table.
  * **Tailoring (much later, separate section):** needs a tailor-onboarding side — `tailors`, service areas, price lists, job status — which is a different product with its own operations. The only thing V1 owes it is the archive reason and notes fields, which already exist.

Phase 0 design v1 · pairs with the launch plan artifact · revise after beta data.
