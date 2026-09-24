# Cost — Phase 0 runs at zero

**Rule: if a thing costs money per user, it does not ship in Phase 0 unless nothing free can do
its job.** Every line below is either free or has a free path, and each one names what we give up.

## The principle that does the work: derive, don't ask

The original tagging design asked a vision model to return the whole item record. Most of that
record is not a vision question at all:

| Field | Phase 0 source | Cost | Why it's also *better* |
|---|---|---|---|
| `colors` (name, hex, family, dominance) | k-means over the cutout's non-transparent pixels, mapped to `taxonomy.colorFamilies` | ₹0 | Deterministic. Models guess hex codes badly; pixels don't guess. |
| `formality` | `taxonomy.json` → subcategory default | ₹0 | A kurta *is* 4, a gym tee *is* 1. It's a table, not a judgement. |
| `seasons`, `layer_role`, `is_set`, `style_tags` | same lookup | ₹0 | Same. Editable by the user per item. |
| `pattern` | edge/frequency analysis on the cutout (solid vs patterned), model only to refine | ₹0 | Solid-vs-not is the only distinction the engine weights heavily. |
| `subcategory` | **the one real model call** — ~60-way classification | ₹0 on a free tier or a local model | Not open-ended vision. A small model does this well. |

So the model's job shrinks from "describe this garment as JSON" to "which of these 60 things is
it", which is what makes a free or local model sufficient.

## Per-capability cost

| Capability | Phase 0 choice | Cost | Trade-off accepted |
|---|---|---|---|
| Multi-item detection | **OpenCV**: background subtraction → contours → area filter → boxes. Our own S03 copy already demands the condition it needs (flat, plain surface, no overlap). | ₹0 | Fails on overlapping garments and busy backgrounds → lands in the S04 zero-state we already designed. A model is an upgrade, not a dependency. |
| Cutout | on-device: iOS subject lift / Android ML Kit Subject Segmentation | ₹0 | Android quality is weaker; ragged cutouts already have a designed badge. |
| Cutout fallback | **dropped in Phase 0** (was a hosted `rembg` container) | ₹0 saved | A failed cutout soft-crops the original instead. Re-add only if the ragged rate is bad. |
| Colour / formality / season / layer / style | derive + lookup (above) | ₹0 | Defaults can be wrong; every field is one tap to fix, and corrections are logged as training data. |
| Subcategory | local `moondream2` / `qwen2-vl-2b` via Ollama, **or** a cloud free tier — chosen by measured accuracy in T04 | ₹0 | Local is weaker on sarees, lehengas, juttis. T04 measures exactly that before we commit. |
| Pairing, feed, "what goes with this", hidden-outfit count, builder, duplicates, gap finder | `packages/engine`, pure TypeScript | ₹0 | None. This was always free and is 95% of the app. |
| Occasion stylist | **rules engine only in Phase 0.** `rulesRankLooks` already exists as a first-class path with its own UI state ("Ranked by rules today"). | ₹0 | No written explanations, just engine phrases. The LLM ranking layer becomes a Phase 1 upgrade behind the same interface. |
| Weather | Open-Meteo | ₹0 | No key required. Already chosen. |
| Database + auth + storage + functions | Supabase free tier | ₹0 | 500 MB DB / 1 GB storage / 2 GB egress — see the storage budget below. |
| Analytics | `events` table in Postgres; PostHog optional | ₹0 | Our own SQL in `dashboards.sql` answers G1–G3. |
| Fonts | bundled with the app | ₹0 | No CDN, and it fixes cold start too. |
| Push (laundry / forgotten-item nudges) | Expo push | ₹0 | — |

## Storage budget — the only free tier we can actually blow

Supabase free storage is 1 GB. 40 beta users × ~50 items:

| What | Per item | 2,000 items | Decision |
|---|---|---|---|
| source photo (1200 px WebP) | ~200 KB | 400 MB | **Deleted once detection succeeds.** Crops are what we keep. |
| crop | ~60 KB | 120 MB | keep |
| cutout | ~50 KB | 100 MB | keep |
| thumbnail | ~12 KB | 24 MB | keep |

Keeping everything ≈ 640 MB and climbs past the tier by ~60 users. Deleting the source photo after
a successful detection brings it to **~245 MB** and also removes the only stored image that can
contain a face — a privacy win and a cost win from one decision.

## What Phase 0 actually costs

| Item | Cost |
|---|---|
| Everything above | **₹0 / month** |
| Google Play developer account | $25, one-time |
| Apple developer account | **deferred** — $99/yr, and there is no Xcode on this machine. Android-only beta; iPhone testing via Expo Go. |
| **Total to ship the beta** | **~₹2,200 one-time** |

## The upgrade path (Phase 1, only once retention is proven)
Swap in a cloud vision model for detection and tagging behind the existing interfaces, and switch
the stylist's ranking layer on. Both are already isolated: `detect-items`, `process_item` and
`/style` keep their contracts, so it is a provider swap, not a rewrite. That is the whole reason
the interfaces were specified before the implementations.
