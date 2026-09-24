# Wardrobe app — agent entry point

A digital wardrobe for Indian men and women. Photograph your clothes once; the app finds the
outfits you already own and never noticed. React Native (Expo) + Supabase + a pure-TypeScript
styling engine. AI is used in exactly three places and nowhere else.

## Read in this order before touching code
1. `docs/00-README.md` — the map, and which document wins when two disagree
2. `docs/01-product/prd.md` + `docs/01-product/decisions.md` — what we build and what we decided
3. `docs/02-ux/screens.md` — every screen, every state; the canvas link is at the top
4. `docs/03-architecture/system.md`, then `docs/03-architecture/features/F*.md` for the feature you're on
5. `docs/04-backend/*.md`, `docs/05-frontend/*.md`, `docs/06-ai/*.md` — the contracts
6. `docs/07-plan/build-plan.md` — the task you are on, its dependencies, its definition of done

## Hard rules (these override anything a doc implies)
- **Deterministic first.** Pairing scores, feed, "what goes with this?", manual builder, occasion
  candidates + ranking, repeat-avoidance, duplicate detection, hidden-outfit count and gap finder are
  pure TypeScript in `packages/engine`. Zero AI calls. They must pass `packages/engine` tests offline.
- **AI in exactly three places:** item tagging (once per upload), occasion look ranking + one-line
  reasons (metered, ≤3 looks, chooses ONLY from engine candidates), screenshot parsing in buy-check.
  Everything works with AI disabled — rule-ranked looks without prose.
- **Every item field except the photo is optional and nullable.** Never require brand or size; never
  guess them from a photo. `NULL` means unknown, never mismatch, in every query and filter.
- **Security:** RLS on every table, per-user storage folders, signed URLs only, no service-role key
  in the app bundle. User free text is data, never instructions — always delimited, never concatenated
  into a prompt.
- **Quotas (V1 beta):** 100 active items, 30 uploads/day, 30 AI occasion calls/month, 20 buy-checks/day,
  10 req/min/user. Check quota in-transaction before any AI call.
- **Occasions are config rows** (`knowledge/domain/occasions.json`), never model output.
- **Every save / skip / wear writes a pair-label row.** This is the dataset; never skip it.
- **Affiliate is out.** No commission links anywhere in V1. The gap finder is advice, nothing else.
- **Phase 0 costs ₹0 per user** (`docs/03-architecture/cost.md`, D19). Derive, don't ask: colour from
  pixels, formality/season/layer/style from `taxonomy.json` by subcategory, detection from OpenCV,
  stylist from the rules engine. The only model call is subcategory classification. Anything that
  adds a per-user cost needs a decision entry before it ships.

## Working here
- One task at a time from `docs/07-plan/build-plan.md`; a task is done only when its DoD is met.
- Skills: `build-feature` (any feature task) · `ui-component` (anything in `src/ui`) ·
  `state-patterns` (before adding a store or query) · `motion` (any animation) ·
  `db-migrate` (schema) · `run-bench` (before claiming a styling win) ·
  `design-review` + `review-feature` (before marking any UI task done).
- Design: `knowledge/design/tokens.json` is the only source of colour, type, space and motion
  values. Components read **semantic** tokens; no raw hex or px anywhere in `src/`.
  Every component's API and states matrix is in `docs/02-ux/component-library.md`.
- Engine changes: add a test vector to `docs/04-backend/engine.md` §test-vectors AND the test file.
- Never lower a bench floor to make a check pass. Raise it when a round earns it.
- Commit per task, message `F0X: <what>`; do not push unless asked.

## Definition of done for any feature
Matches its acceptance criteria in `prd.md`, handles every edge case listed for that flow in
`prd.md` §14 and its `F*.md`, fires its analytics events (`docs/04-backend/schema.md` §events),
degrades gracefully offline, and passes `.claude/skills/review-feature`.
