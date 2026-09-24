---
name: run-bench
description: Run the styling bench and tagging/detection evals against recorded floors before claiming any AI or engine change is an improvement.
---

# Run the bench

Read `docs/06-ai/bench.md` and `docs/06-ai/tagging.md` §eval.

1. `pnpm check` — engine tests, tagging eval (if `knowledge/eval/tagging` present), detection eval
   (if present), `bench:score` vs `bench/FLOOR.json`.
2. Paste the summary lines. A regression on any floor = the change does not ship; say so plainly.
3. If above floor on every metric and the user agrees the round earned it, raise `FLOOR.json`
   deliberately and add a row to `bench.md §log` (date, closet, engine, metrics, change, by).
4. Never lower a floor. Never edit ratings. New ratings require new PNGs and a new `ratings.csv`.
5. If fixtures are missing, say exactly which path is empty and what T-task creates it (T02, T04, T15).
