---
name: build-feature
description: Build one task from docs/07-plan/build-plan.md end to end — read the contracts, implement DB → engine → API → UI → tests, verify, update the plan.
---

# Build a feature task

Use for any `T##` task. One task per run. Never start a task whose `Depends` are not `done`.

## 1. Load the contracts (read, don't skim)
1. `docs/07-plan/build-plan.md` — the task row: Depends, DoD, status. Set status `doing`.
2. The feature file `docs/03-architecture/features/F0X-*.md` for the task's feature.
3. The relevant sections of `docs/04-backend/schema.md`, `api.md`, `engine.md`, `jobs.md`,
   `docs/05-frontend/app.md`, `components.md`, `docs/02-ux/screens.md` (the screen IDs named).
4. `docs/01-product/decisions.md` — check no decision changes what you're about to do.
5. `knowledge/conventions.md`.

## 2. Plan in writing (5–15 lines, in your reply, before code)
Files to create/change · schemas to add to `packages/shared` · tests you will write first ·
edge cases from the feature file you will cover · anything the docs leave ambiguous (state your
assumption; do not stop to ask unless it changes the data model).

## 3. Build in this order
schema (migration via `db-migrate` skill) → `packages/shared` types/schemas → `packages/engine`
(tests first: add vectors to `engine.md` and the test file) → edge function (+ integration test)
→ app screen/components (+ RNTL test) → e2e flow if the task names one.

## 4. Verify (evidence, not assertion)
- `pnpm -r build && pnpm -r test` output pasted.
- For engine tasks: `pnpm check` (bench floor) output.
- For UI tasks: the screen renders every state listed in `screens.md` from fixtures (say which).
- Every edge case in the feature file: name it and the test that covers it, or say "not covered — because".

## 5. Close
Run `review-feature`. Fix findings. Set task status `done` (or `review` with what's left).
Commit `T##: <summary>`. Do not push unless asked. Report: what shipped, what was assumed, what's next.
