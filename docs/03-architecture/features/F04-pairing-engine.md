# F04 — Pairing engine
**Depends on:** F02 (items exist). **Blocks:** F05, F06, F07, F10, F11.
This is `packages/engine` §1–§2 of engine.md plus the job step and the `pairings` table.
## Backend
`process_item` step 3: `for each active item b of user: r = pairScore(a,b); if r.score ≥ 55 upsert
pairings(min(a,b), max(a,b), score, reasons, rules_version)`. On tag edit: delete pairings for that
item, recompute. `penalty_decay` cron.
## Engine
`pairScore`, `assembleOutfit`, `RULES_V1` from `knowledge/domain/styling-rules.md` (weights,
neutral set, veto list, phrase table). Rules live in a JSON block inside that markdown and are
parsed at build time so agents and code read one file.
## App
Imports engine for the builder's live score and for offline "what goes with" over the local
pairings cache (`pairings` synced to SQLite for the user's closet; ≤ 5k rows).
## Tests
Every vector in engine.md §test-vectors; property test: symmetry `pairScore(a,b) == pairScore(b,a)`;
unknown-never-minimum property: for any pair, replacing a known field with unknown never lowers
that signal below its "unknown" value.
## Tuning loop
Weekly during beta: `pnpm bench` (06-ai/bench.md) + save/skip rates by signal from `interactions`
joined to `pairings.reasons`. Change weights only with a bench delta recorded in `bench.md §log`.
