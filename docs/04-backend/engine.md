# Engine — pure TypeScript, zero AI

`packages/engine` is one package imported by the app (builder scoring, offline what-goes-with) and
the edge functions (feed, style candidates, hidden outfits). Same code, same tests, same numbers on
both sides. Every function here is pure: `(inputs, rulesConfig, seed?) → output`. No I/O.

Public API (`packages/engine/src/index.ts`):
```ts
export function pairScore(a: ItemTags, b: ItemTags, cfg: Rules): PairResult            // §1
export function assembleOutfit(anchor: Item, pool: Item[], pairs: PairIndex, cfg: Rules, opts?): Outfit | null  // §2
export function generateFeedPage(input: FeedInput): FeedPage                            // §3
export function whatGoesWith(item: Item, pool: Item[], pairs: PairIndex, cfg: Rules): WhatGoesWith  // §4
export function occasionCandidates(occ: OccasionConfig, pool: Item[], pairs: PairIndex, ctx: Ctx, cfg: Rules): Outfit[] // §5
export function rulesRankLooks(cands: Outfit[], occ: OccasionConfig, ctx: Ctx): Look[]  // §5
export function hiddenOutfits(pool: Item[], pairs: PairIndex, worn: WornTriples, cfg: Rules): HiddenCount // §6
export function nearDuplicates(x: ItemTags, pool: Item[]): { duplicates: Item[]; similar: Item[] } // §7
export function gapFinder(pool: Item[], pairs: PairIndex, cfg: Rules): Gap[]            // §8
export function buyVerdict(x: ItemTags, pool: Item[], pairs: PairIndex, cfg: Rules): BuyResult // §9
export const RULES_V1: Rules                                                            // knowledge/domain/styling-rules → code
```
Types come from `packages/shared`. `rules_version` is a string constant exported alongside
`RULES_V1` and written on every pairing/outfit row.

## 0. Inputs the engine sees
```ts
type ItemTags = { category, subcategory?, colors: {hex, family, dominance}[], pattern, fabric,
                  formality?: 1..5, seasons: Season[], is_set, layer_role?, style_tags: string[] }
type Item = ItemTags & { id, status, last_worn_at?, wear_count }
type PairIndex = Map<string /* a<b key */, { score: number, penalty: number, reasons }>
type Ctx = { today: string, weather?: { temp_c: number, condition: 'sunny'|'cloudy'|'rain' },
             savedColorFamilies: Record<string, number>, recentWorn: WornTriples, filter?: string }
```
`NULL`/unknown handling is a rule, not a special case: every signal below defines its score for
"unknown" and it is never the minimum.

## 1. pairScore — 0–100 for any two items
Total = colour 30 + formality 25 + style 20 + pattern 15 + season 10. Store when `score ≥ 55`.

### 1.1 Colour (0–30)
Let `A`, `B` = dominant colour of each (highest dominance). `NEUTRALS = {white, cream, black, grey,
navy, beige, denim, tan}` by family. `hue(x)` from hex; `sat(x)`, `light(x)` in HSL.
```
if A.family ∈ NEUTRALS or B.family ∈ NEUTRALS        → 30
if A.family = B.family                                → 26   (monochrome)
d = min(|hueA − hueB|, 360 − |hueA − hueB|)
if d ≤ 30                                             → 24   (analogous)
if 150 ≤ d ≤ 210                                      → 22   (complementary)
if satA > 0.55 and satB > 0.55 and 60 < d < 150       → 6    (clash: two brights, neither harmonious)
otherwise                                             → 16
unknown colours (empty array)                         → 20
secondary colour bonus: if any secondary of A shares family with B's dominant, +2 (cap 30)
```

### 1.2 Formality (0–25)
```
gap = |fA − fB|;  gap 0 → 25; 1 → 25; 2 → 12; ≥3 → 2
either unknown → 16
```

### 1.3 Style coherence (0–20)
```
S = style_tags overlap count
S ≥ 1 → 20
both empty (unknown) → 14
no overlap: if {ethnic} vs {streetwear|sporty} and no 'fusion' tag on either → 3
            else → 10
```

### 1.4 Pattern (0–15)
```
BOLD = {print, floral, embroidered}; SUBTLE = {stripe, check}
solid + anything → 15
unknown + anything → 12
subtle + subtle → 9
subtle + bold → 7
bold + bold → 2
```

### 1.5 Season (0–10)
```
either contains 'all' → 10
intersection non-empty → 10
disjoint → 0
```

### 1.6 Hard vetoes (score := 0 regardless)
- same slot and neither is a layer (`top`+`top` unless one has `layer_role ∈ {mid,outer}`)
- `gymwear` with `formality ≥ 4` item
- `one_piece` with `top` or `bottom`

### 1.7 Penalty
`effective = max(0, score − penalty)`. `penalty` += 8 per skip of an outfit containing the pair
(cap 40), −4 per week of no skips (decay job), reset to 0 on `wear` of that pair.

## 2. assembleOutfit — slots
Slots: `top`, `bottom` | `one_piece`, `footwear`, optional `layer` (mid/outer), `accessories[0..3]`.
Sets (`is_set`) fill `one_piece`.
```
given anchor:
  place anchor in its slot
  for each remaining required slot in order [top, bottom|one_piece, footwear]:
     candidates = pool items of that slot, status=active, not vetoed with any chosen item
     rank by mean effective pair score against ALL chosen items (each pair must be ≥ 55)
     pick top (ties → least recently worn)
     none → slot left empty; outfit.incomplete_slots += slot
  optional layer: add only if mean score with chosen ≥ 65 and (weather.temp_c < 24 or occasion asks)
  accessories: up to N (occasion config) where mean ≥ 60
outfit.score = round(mean of all pairwise effective scores among chosen items)
outfit.novelty = no pair among chosen has a 'worn' pair_label
```
Return `null` if fewer than 2 required slots filled.

## 3. generateFeedPage
```
input: { pool, pairs, ctx, savedNeighbors: Item[], page, seed }
rng = mulberry32(hash(seed + page))
anchors (10): draw by weight until 10 distinct:
   30% never-worn-together pairs → pick a stored pairing (score ≥ 65) with no 'worn' label, anchor = item_a   (D03)
   30% least-recently-worn active items (never worn first, then oldest last_worn_at)
   20% neighbours of saved outfits (items sharing ≥1 pairing ≥ 70 with an item in a saved outfit)
   20% uniform random active
for each anchor: outfit = assembleOutfit(...) ; drop nulls
boosts (added to card.rank, not to outfit.score):
   +8 weather match (all items' seasons include current season)
   +10 active filter match (occasion config formality range and style tags)
   +6 contains an item unworn ≥30 days; +10 if ≥90
   +4 dominant colour family ∈ top-3 ctx.savedColorFamilies
   +12 novelty
diversity: walk cards in rank order; reject a card if any of its items already appears in 2 of the
   last 10 accepted; backfill with next anchor; stop at 10 or when anchors exhausted (exhausted=true)
badges: novelty → 'never_worn_together'; unworn ≥30/90 → 'unworn_30'/'unworn_90'; weather → 'weather'
reason: one phrase from reasons.notes of the weakest and strongest signal, e.g. "Earthy and relaxed, good for 31°"
        (phrase table in knowledge/domain/styling-rules.md §phrases; never free-form)
```
Exhausted small closets: re-serve accepted cards from earlier pages with badge `seen_before`.

## 4. whatGoesWith
For `item`: `by_slot[slot]` = top 6 active items of that slot by effective pair score ≥ 55;
`outfits` = up to 4 via `assembleOutfit(item, …)` with different `bottom`/`top` picks (take the
top 4 distinct second-slot candidates as forced picks).

## 5. occasionCandidates + rulesRankLooks
`OccasionConfig` (from `knowledge/domain/occasions.json`):
```ts
{ id, group, label, formality: [min,max], allowed_categories?: string[], banned_categories: string[],
  style_pref: string[], accessory_slots: 0..3, palette_bias?: 'dark'|'light'|'bright'|'muted',
  weather_sensitive: boolean, repeat_window: number /* last N events of this occasion */ ,
  onboardingOrder: number }
```
```
pool' = active items, not banned category, formality within [min−0, max+0] (unknown formality allowed)
anchors = pool' tops + one_pieces (ethnic first if style_pref has 'ethnic'), sorted by:
    style_pref hits desc, then unworn-at-this-occasion first (repeat-avoidance: exclude items worn in the
    last `repeat_window` wear_events with this occasion), then least recently worn
build up to 12 outfits via assembleOutfit with accessory count = accessory_slots
filter: complete required slots; footwear must not be banned (gym→sports, office→covered)
palette_bias: +6 rank if dominant lightness matches (dark <0.35, light >0.65, bright sat>0.5, muted sat<0.35)
return 8–12 by rank; fewer if the closet can't
```
`rulesRankLooks` = top 3 by rank with `reason` from the phrase table and `tip` = the occasion's
`tip` field. This is the AI fallback and the AI's candidate list.

## 6. hiddenOutfits — D02, the headline number
```
owned = count of triples (top, bottom, footwear) ∪ (one_piece, footwear) where every pairwise
        effective score ≥ 55 and mean ≥ 65, all items active. Enumerate tops×bottoms×footwear
        (≤ 100 items → ≤ ~25k triples, trivial); cap display at 999.
worn  = count of distinct such triples that co-occur in wear_events on the same worn_on
        (group wear_events by (user, worn_on); each day's item set contributes its triples that are valid)
by_category_gap = the subcategory whose addition (a hypothetical neutral, formality 3, solid item)
        would raise `owned` the most — reuse §8
```
Displayed as "You own {owned} outfits · worn {worn}". Cached per closet version.

## 7. nearDuplicates
```
duplicate: same subcategory AND hue distance(dominant) < 20° AND same formality band
           (bands: 1–2, 3, 4–5) AND same pattern class (solid vs non-solid)
similar:   same subcategory AND style_tags overlap ≥ 1 AND not duplicate
```

## 8. gapFinder
For each subcategory in taxonomy with `gap_candidate: true` (white sneakers, black formal shoes,
navy chinos, white shirt, black kurta, beige dupatta …): synthesize a hypothetical item from its
`gap_prototype` tags; compute `owned` delta via §6 with it added. Return top 3 by delta. Advice
only (D01): no links, no prices.

## 9. buyVerdict (V1-B)
```
pool.active < 15 → 'none'
pairs = count of active items with effective pairScore(x, item) ≥ 55
outfitsUnlocked = §6 owned delta with x added
dups = §7.duplicates.length
if outfitsUnlocked ≥ 6 and dups = 0 → 'buy'
if outfitsUnlocked ≥ 3 or dups = 1   → 'maybe'
else                                 → 'skip'
cost_per_wear = price / max(1, mean wear_count of same-subcategory items over their age in months × 12)  (only with price)
overrides loosen: after 3 'buy anyway' on skips, duplicate hue threshold 20° → 12° for that user
```

## Test vectors (must exist in `packages/engine/test/*.test.ts` before any rule change ships)
| # | A | B | expected | why |
|---|---|---|---|---|
| V1 | navy solid cotton shirt f3 summer, tags {classic} | beige solid chino f3 all, tags {classic} | **100** | neutral 30 + gap0 25 + overlap 20 + solid 15 + all 10 |
| V2 | red print silk kurta f5 winter | green floral cotton bottom f2 summer | 0 after veto? no veto → colour clash 6 + formality 2 + style 10 + pattern 2 + season 0 = **20** | not stored |
| V3 | white tee f2 | black jeans f2 | 100 | the canonical neutral pair |
| V4 | mustard (hue 45, sat .7) solid f3 | teal (hue 180, sat .6) solid f3 | colour: d=135 → clash 6; total 6+25+10+15+10 = **66** | stored, low |
| V5 | olive (hue 80 sat .4) f3 | rust (hue 20 sat .6) f3 | d=60 → otherwise 16; total 16+25+10+15+10 = **76** | |
| V6 | any `one_piece` | any `top` | **0** | veto |
| V7 | gymwear f1 | blazer f4 | **0** | veto |
| V8 | unknown colours, unknown formality, no tags, unknown pattern, seasons {all} ×2 | 20+16+14+12+10 = **72** | unknown is never a mismatch |
| V9 | stripe shirt f3 | check trouser f3, both navy | 26+25+10+9+10 = **80** | subtle+subtle allowed |
| V10 | floral kurta f4 ethnic | printed dupatta (layer) f4 ethnic | 20? colours vary; pattern **2**; style 20 | bold+bold penalised even in ethnic |
| F1 | feed page for closet of 8 items | 10 cards? | ≤ 10, no item in >2 of 10, exhausted=true likely | diversity |
| F2 | same seed twice | identical cards | determinism |
| H1 | 3 tops, 2 bottoms, 1 shoe, all neutral f3 | owned = 6, worn = 0 | §6 |
| H2 | H1 + one wear_event day with (top1, bottom1, shoe1) | worn = 1 | |
| O1 | occasion `gym` on a closet with no gymwear | candidates = [] | no call |
| O2 | occasion `client_meeting` | no sneakers in footwear slot | banned category |
| D1 | two navy polos f3 solid | duplicate | §7 |
| D2 | navy polo vs navy printed shirt | not duplicate (pattern class) | |

## V2 path (D08) — not built in V1
`items.embedding vector(512)` from a type-aware model computed in `process_item` next to tagging;
`pairScore` becomes `0.6 × rules + 0.4 × (100 × cosine in type-pair subspace)` once the bench
(`06-ai/bench.md`) shows rules alone below floor. `pair_labels` is the training set.
