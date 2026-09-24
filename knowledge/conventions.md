# Conventions for agents and humans

- **Names come from `docs/04-backend/schema.md`.** Do not invent a table, column, event or enum
  value anywhere else; add it there first.
- **Engine is pure.** No Date.now(), no random without a seed argument, no I/O, no env reads.
- **Every API has a zod schema in `packages/shared`** used on both sides.
- **NULL is unknown.** Any filter or score that treats NULL as a mismatch is a bug.
- **Copy is literal** in the app (no i18n framework in V1; English + Hindi words as used in the
  PRD). Strings live in `features/<f>/copy.ts` so QA can grep them.
- **Commits:** `F0X: imperative summary` or `T##: …`; one task per commit; no push without asking.
- **Bench before claims.** A styling change is an improvement only if `pnpm check` says so.
- **No fake data in the app.** Empty states are designed; fixtures are for tests and the canvas only.
- **Never send an original photo anywhere but storage.** Detection and tagging use crops/cutouts.
