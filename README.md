# Wardrobe — a digital wardrobe that finds the outfits you already own

Monorepo for the whole product: product docs, UX, architecture, backend, mobile app, AI, and the
knowledge that lets an agent work here unattended.

```
docs/            every document, numbered in reading order — start at docs/00-README.md
knowledge/       domain data and rules the code and the agents both read (occasion catalog, taxonomy, styling rules)
apps/mobile/     Expo (React Native) app
packages/engine/ pure TypeScript pairing / feed / occasion engine — shared by app and edge functions, zero AI
packages/shared/ types, zod schemas, constants — the contract between app and backend
supabase/        migrations, RLS, edge functions, seed
.claude/skills/  how an agent builds a feature, runs the bench, migrates the DB, reviews work
```

Nothing under `apps/`, `packages/` or `supabase/` is written yet. The docs are complete enough to
write all of it without asking a question; `docs/07-plan/build-plan.md` says in what order.
