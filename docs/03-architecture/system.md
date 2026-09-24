# System architecture

## One write path, two read paths (unchanged from the original design, now with names)
```mermaid
flowchart LR
  subgraph app [apps/mobile — Expo]
    Cam[Capture] --> Resize[resize 1200px WebP]
    Resize --> Up[upload closet/{uid}/{photo}.webp]
    Up --> Det[/detect-items/]
    Det --> Rev[S04 review] --> Enq[/enqueue-items/]
    Feed[S08 Feed] --> GF[/feed/]
    Style[S10] --> ST[/style/]
    Any[any action] --> Q[(SQLite outbox)] --> TR[/track/]
    Builder[S12] --> Eng1[[engine]]
  end
  subgraph sb [supabase]
    Enq --> Jobs[(jobs)]
    Jobs --> W[worker] --> Cut[cutout fallback] --> Tag[[AI tag]] --> Items[(items)] --> Pair[[engine.pairScore]] --> P[(pairings)]
    GF --> Eng2[[engine.generateFeedPage]] --> P
    ST --> Eng3[[engine.occasionCandidates]] --> P
    Eng3 --> LLM[[AI rank ≤3]] --> O[(outfits)]
    TR --> I[(interactions)] & WE[(wear_events)] & PL[(pair_labels)] & EV[(events)]
  end
```
- **Write path** (once per item): app → storage → `detect-items` → `enqueue-items` → `process_item` job → tags → pairings.
- **Cheap read path** (every day): `feed`, `whatgoeswith`, `hidden-outfits`, builder — engine over `pairings`. Zero AI.
- **Paid read path** (metered): `style` — engine candidates → LLM ranks ≤3 → stored. The only per-request AI.

## Packages and boundaries
```
packages/shared   types (Item, Outfit, Slots, Tags), zod schemas for every API and every AI JSON,
                  constants (quotas, thresholds), taxonomy loader. No runtime deps but zod.
packages/engine   pure functions (engine.md). Depends on shared only. 100% unit-tested; the bench
                  (06-ai/bench.md) runs against it. Built to ESM for Deno and to CJS for RN.
apps/mobile       Expo SDK 52+, expo-router, TanStack Query, expo-sqlite outbox, Zustand for UI
                  state, expo-image, expo-camera, on-device segmentation (expo-modules native module
                  wrapping VNGenerateForegroundInstanceMaskRequest on iOS / ML Kit Subject Segmentation on Android).
supabase/         migrations (schema.md), seed (taxonomy, occasions), functions (api.md), worker + crons (jobs.md).
knowledge/        occasions.json, taxonomy.json, styling-rules.md — read by engine (bundled at build) and by agents.
```
Rule: **nothing in `apps/` or `supabase/functions` computes a score.** They call `engine`.

## Environments
| | local | beta |
|---|---|---|
| Supabase | `supabase start` (Docker) | hosted project, region `ap-south-1` (Mumbai) |
| AI keys | `.env.local` (never committed) | Supabase secrets: `TAG_MODEL_KEY`, `STYLE_MODEL_KEY`, `MODEL_PROVIDER` |
| App | Expo Go / dev client | TestFlight + Play internal track |
| Analytics | events table only | events table + PostHog (optional, `POSTHOG_KEY`) |
| Cutout fallback | skipped (on-device only) | `rembg` container on Fly.io `bom`, `REMBG_URL` |

## Security (summary; detail in schema.md §RLS and F01)
RLS everywhere, JWT passed through to functions, service role only in worker/crons, signed URLs,
per-user storage folders, App Check / Play Integrity on functions (beta: warn-only, then enforce),
free text delimited in every prompt, no general chat endpoint, account deletion purges storage.

## Cost model (V1 beta, 40 users)
| item | unit | per user/month |
|---|---|---|
| tagging | ~₹0.2/item × ~50 items once | ₹10 first month, ~₹1 after |
| style calls | ~₹0.15 × ≤30 | ≤ ₹4.5 |
| buy-check parse | ~₹0.2 × ≤10 | ≤ ₹2 |
| storage | 50 items × 0.3 MB | negligible |
| **target** | | **< ₹25** (`cost_throttle` at ₹50) |

## Non-functional targets (from PRD §12)
Closet grid 60 fps at 200 items · detection result < 8 s on 4G mid-range · feed page 0 < 1.5 s ·
cold start < 3 s · zero AI calls while scrolling · ≥ 95% of session actions touch no AI.

## Observability
Every function logs `{fn, user_pseudo, ms, ok, code}` to Supabase logs; `events` table is the
product truth; a `dashboards.sql` file in `supabase/` holds the 4 goal queries (G1–G3 + hidden
outfits) so anyone can run them in the SQL editor.
