# Docs index and precedence

Read top to bottom the first time. After that, go straight to the feature file for your task.

| # | Document | Answers | Status |
|---|---|---|---|
| 01 | `01-product/prd.md` | What V1 is: goals, flows, edge cases, acceptance | authoritative for **scope** |
| 01 | `01-product/decisions.md` | Every decision taken after the PRD was written, with the reason | authoritative where it **amends** the PRD |
| 01 | `01-product/features.md` | Every feature ever considered, by phase | reference |
| 01 | `01-product/launch-plan.md` | The 30-day plan as first written | superseded by `07-plan/build-plan.md` |
| 02 | `02-ux/screens.md` | Every screen, state, component, copy; nav map; canvas link | authoritative for **UI** |
| 02 | `02-ux/design-system.md` | Tokens, type, colour, spacing, components | authoritative for **look** |
| 02 | `02-ux/flows.md` | Flow diagrams between screens, including failure paths | reference |
| 03 | `03-architecture/system.md` | The system: paths, boundaries, packages, envs, security, cost | authoritative for **shape** |
| 03 | `03-architecture/features/F01…F12.md` | Per-feature fullstack architecture: DB ↔ engine ↔ API ↔ UI ↔ tests | authoritative per **feature** |
| 03 | `03-architecture/adr/*.md` | Why each non-obvious technical choice was made | reference |
| 04 | `04-backend/schema.md` | Full DDL, enums, indexes, RLS policies, events | authoritative for **data** |
| 04 | `04-backend/api.md` | Every edge function: auth, request, response, errors, limits | authoritative for **API** |
| 04 | `04-backend/engine.md` | Pairing, outfit assembly, feed, occasion, hidden-outfit count — with test vectors | authoritative for **engine** |
| 04 | `04-backend/jobs.md` | Queue, retries, crons, cost throttle | authoritative for **jobs** |
| 05 | `05-frontend/app.md` | Expo app: structure, navigation, state, offline, image pipeline | authoritative for **app** |
| 05 | `05-frontend/components.md` | Component inventory with props and states | authoritative for **components** |
| 06 | `06-ai/tagging.md` | Vision tagging prompt v1, JSON schema, test set, eval | authoritative for **tagging** |
| 06 | `06-ai/stylist.md` | Ranking prompt, guards, fallbacks | authoritative for **stylist** |
| 06 | `06-ai/bench.md` | The styling bench — how outfit quality is measured before beta | authoritative for **quality gate** |
| 07 | `07-plan/build-plan.md` | Epics → tasks, dependency order, DoD per task | authoritative for **what next** |
| 07 | `07-plan/test-plan.md` | QA matrix per flow and edge case | authoritative for **QA** |

## Precedence when two documents disagree
1. `decisions.md` (newest decision wins)
2. `prd.md` for scope; `screens.md` for UI; `schema.md` / `api.md` / `engine.md` for contracts
3. `F*.md` feature files
4. Everything else

`03-architecture/_original-design.md` is the design document the rest was derived from. It is kept
for history; where it disagrees with anything above, it loses.

## Conventions
- Feature IDs `F01…F12` are stable and used in commits, tasks, tests and file names.
- Screen IDs `S01…S14` are stable and match artboard names on the canvas.
- Every table, function, event and enum value is named exactly once, in `04-backend/schema.md`;
  every other document refers to that name.
