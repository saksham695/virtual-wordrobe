---
name: db-migrate
description: Add or change database schema safely — new numbered migration, RLS, indexes, seed, matching docs update, local reset test.
---

# Database migration

1. Read `docs/04-backend/schema.md` first. If the change is not there, **add it to the doc first**
   in the same PR — the doc is the source of names.
2. Create `supabase/migrations/NNNN_<snake_summary>.sql` (next number). Never edit an applied migration.
3. Every new table: `enable row level security` + owner policy (schema.md §RLS) + `updated_at`
   trigger if it has that column + indexes for the queries named in the feature file.
4. Enum changes: `alter type … add value` (append only; never remove in V1).
5. Seed changes (taxonomy, occasions): update `knowledge/domain/*.json` **and** `supabase/seed.sql`
   from it via `pnpm seed:gen` (script in T03).
6. Test: `supabase db reset` (clean apply) → run `supabase/tests/rls.test.sql` (two users; second
   reads nothing) → `pnpm -F shared test` (zod ↔ DDL parity test).
7. Report the migration file, the doc diff, and the reset output.
