---
name: review-feature
description: Hostile review of a finished task against its DoD, the PRD edge cases, the hard rules in CLAUDE.md, and the design system — before it is marked done.
---

# Review a feature

Input: a `T##` task (or a diff). Output: findings ranked by severity, each with file:line and a
concrete failure scenario. No praise. Empty list only if genuinely nothing.

Check, in order:
1. **Hard rules** (CLAUDE.md): any score computed outside `packages/engine`? any AI call outside the
   three allowed? any required optional field? NULL treated as mismatch? free text concatenated
   into a prompt? service-role key reachable? quota checked outside a transaction?
2. **DoD** in `build-plan.md` for the task — each clause, evidence or fail.
3. **Edge cases** in the feature file and `prd.md §14` for its flows — each has a test or a stated gap.
4. **Contracts**: API response validated by the shared zod schema; migration matches `schema.md`;
   event names match `schema.md §events`.
5. **UI**: every state in `screens.md` for the screen renders; touch targets ≥ 44; tokens from
   `design-system.md`, no ad-hoc hex; copy matches `screens.md` or `copy.ts`.
6. **Offline**: mutation goes through the outbox; read has a cached path.
7. **Perf** budget from `app.md` where measurable.
8. **Tests actually run**: the output is in the transcript, green, and not skipped.

Verdict: `ship` / `fix first (list)` / `re-plan (why)`.
