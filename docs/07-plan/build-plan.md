# Build plan — epics, tasks, order, definition of done

Ordered so the two differentiators are proven in week 1 (D14). Each task is sized for one
agent session. `Depends` must be done. `DoD` is checked by `.claude/skills/review-feature`.
Status: `todo | doing | review | done`. Update this file when status changes.

## E0 — Foundations
| ID | Task | Depends | DoD | Status |
|---|---|---|---|---|
| T01 | Monorepo tooling: pnpm workspaces, TS project refs, `packages/shared` (types, zod, taxonomy loader), `packages/engine` skeleton with vitest, root `pnpm check` | — | `pnpm -r build && pnpm -r test` green; shared exports `Item`, `Outfit`, `Slots`, every api.md schema | todo |
| T02 | **D06 pre-gate:** put 20 real flat-lay photos in `knowledge/eval/detection/` with hand `boxes.json`; script `pnpm eval:detect` calling the chosen model with `detect-v1`; record result in bench log | T01, Q01 | number recorded; if < 60% → open decision D15 on the add-path change | todo |
| T03 | Supabase project + migrations `0001_enums … 0009_events` exactly from schema.md; RLS; storage buckets + policies; seed taxonomy + occasions | T01 | `supabase db reset` clean; RLS test: second user reads nothing; `psql` shows every table | todo |
| T04 | Tagging eval set (100 cutouts + labels) and `pnpm eval:tagging`; run `tag-v1`; record | T01, Q01 | floors in tagging.md met or a prompt revision logged | todo |

## E1 — Engine (F04)
| ID | Task | Depends | DoD | Status |
|---|---|---|---|---|
| T10 | `pairScore` + `RULES_V1` parsed from styling-rules.md; vectors V1–V10; symmetry + unknown properties | T01 | all vectors pass | todo |
| T11 | `assembleOutfit`, `whatGoesWith` | T10 | unit tests on fixture closet A | todo |
| T12 | `generateFeedPage` (D03 mix, boosts, diversity, seed); vectors F1/F2 | T11 | deterministic; ≤10; diversity property | todo |
| T13 | `occasionCandidates`, `rulesRankLooks`; O1/O2; 19 occasions each produce ≥3 on closet A or a documented gap | T11 | table of counts committed in bench log | todo |
| T14 | `hiddenOutfits` (H1/H2), `nearDuplicates` (D1/D2), `gapFinder`, `buyVerdict` | T11 | vectors pass | todo |
| T15 | Bench round 1: fixture closet A, 50 outfits, PNGs, ratings, `bench:score`, set FLOOR | T12,T13, F09 renderer | FLOOR.json set; log row | todo |

## E2 — Add items (F02) ★
| ID | Task | Depends | DoD | Status |
|---|---|---|---|---|
| T20 | Expo app scaffold: router, providers, theme tokens, fonts, `ui/` primitives (Button, Chip, TabBar, EmptyState, Toast) | T01 | runs on iOS sim + Android emu; tokens match design-system.md | todo |
| T21 | F01 auth + onboarding S01/S02 | T20, T03 | e2e onboarding.yaml | todo |
| T22 | `detect-items` + `enqueue-items` functions; `process_item` job + worker + pg_cron | T03, T10 | integration: 8 boxes → 8 items → 8 jobs → tags + pairings; idempotent | todo |
| T23 | S03 capture + resize + upload + pending queue | T20 | photo lands in storage; offline → pending | todo |
| T24 | S04 detection review (boxes, toggle, merge, split, adjust, advisories) | T22, T23, T02 | every S04 state renders from fixtures; gestures tested | todo |
| T25 | On-device cutout native module (iOS subject lift; Android ML Kit) + fallback path | T22 | cutout for ≥ 90% of fixture crops on iOS; Android falls back cleanly | todo |
| T26 | S05 review queue + tag_corrections + realtime pop-in | T24 | corrections persisted; uncertain chips only | todo |
| T27 | **Timed e2e:** 30 items from 4 photos < 10 min on a mid-range Android | T24–T26 | time recorded in bench log | todo |

## E3 — Closet (F03)
| ID | Task | Depends | DoD | Status |
|---|---|---|---|---|
| T30 | S06 closet grid, sections, search, filters, laundry, FAB, hidden-outfits banner, `/hidden-outfits` fn | T26, T14 | NULL-field filter property; 200 items 60 fps | todo |
| T31 | S07 item detail, what-goes-with strip, archive sheet, delete + incomplete trigger | T30 | trigger test | todo |

## E4 — Feed (F05) ★
| ID | Task | Depends | DoD | Status |
|---|---|---|---|---|
| T40 | `/feed` fn + weather cache + `feed_warm` | T12, T03 | p95 < 1.5 s on 100-item closet | todo |
| T41 | `OutfitComposition` (D12 geometry in shared) + `OutfitCard` | T20 | RNTL snapshots for every size; mini/card/detail | todo |
| T42 | S08 feed screen: paging, gestures, filters, feedback sheet, offline strip | T40, T41 | e2e feed-save-skip.yaml; zero AI hosts in network log | todo |
| T43 | `/track` fn + outbox + pair_labels + penalties | T03 | concurrency + dedupe tests | todo |
| T44 | S09 outfit detail + signal bars + shuffle-one | T42 | — | todo |

## E5 — Stylist (F06)
| ID | Task | Depends | DoD | Status |
|---|---|---|---|---|
| T50 | `/style` fn: candidates, cache, topic check, quota txn, AI rank + validation, fallback | T13, T03 | 10-parallel quota test; validator test; fallback test | todo |
| T51 | S10 + S11 screens incl. every state | T50 | — | todo |

## E6 — Builder, favourites, share, profile (F07–F10)
| ID | Task | Depends | DoD | Status |
|---|---|---|---|---|
| T60 | S12 builder + draft | T11, T41 | — | todo |
| T61 | S13 saved + wear history + wear actions everywhere | T43 | trigger once-per-day test | todo |
| T62 | `/share-card` renderer (needed by T15 too — do early) | T41 | PNG snapshot | todo |
| T63 | S14 profile + settings + delete account | T30, T61 | purge e2e | todo |

## E7 — Beta readiness
| ID | Task | Depends | DoD | Status |
|---|---|---|---|---|
| T70 | Analytics: every event in schema.md §events fires; `dashboards.sql` | all | funnel visible for G1–G3 + hidden outfits | todo |
| T71 | Quota abuse script (200 rapid requests), cost throttle test, App Check warn mode | T50 | rejected cleanly | todo |
| T72 | Privacy policy, consent screen, store listings, TestFlight + Play internal | T63 | builds uploaded | todo |
| T73 | Beta cohort 30–40 (half women) + feedback channel; watch 3+3 uploads in person | Q03 | notes in `docs/07-plan/beta-notes.md` | todo |

## E8 — V1-B (only if E2–E7 done)
| ID | Task | Depends | DoD | Status |
|---|---|---|---|---|
| T80 | `/buy-check` + S15 | T14, T31 | verdict table on closet A | todo |

## Critical path
T01 → T02/T04 (parallel, week 1) → T03 → T10–T12 → T22 → T24 → T27 (the ten-minute proof)
→ T40–T42 → T15 (the quality proof) → everything else.
If T02 fails (<60%) or T15 is below a sensible floor, **stop and re-plan** rather than build E3–E7.
