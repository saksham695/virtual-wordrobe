# The styling bench — the quality gate (D04)

Outfit quality is the product. It gets a measured floor, before beta, like tagging does.

## Fixture closet
`knowledge/eval/closet-A/` — one real 40-item closet (your own), tagged and hand-corrected:
`items.json` (schema `ItemTags[]` + ids), cutouts (git-lfs). Later: `closet-B` (a women's closet,
ethnic-heavy). Both are private fixtures, never shipped in the app.

## Generating the 50
`pnpm bench:generate --closet A --seed 2026-09` → `bench/A/outfits.json`: 50 outfits =
30 from `generateFeedPage` (5 pages, no filter), 10 from `occasionCandidates` (office, casual,
festival, date, gym → top 2 each), 10 from `whatGoesWith` on 10 random items → flat-lay PNGs
via the share renderer (F09) into `bench/A/png/`.

## Rating
Five raters (mix of men/women, at least two who dress well by your own judgement), each rates all
50 on 1–5: "Would you wear this, as shown, to the occasion named?" plus a tick for "surprising in
a good way". Form: `bench/A/ratings.csv` (`outfit_id, rater, score, surprising`). Raters never see
the engine score.

## Metrics (`pnpm bench:score`)
- **mean** rating (floor to set after round 1; expected ≥ 3.4)
- **p(≥4)** share of outfits rated 4 or 5 (this is the analogue of the 60% save-rate goal; floor ≥ 0.55)
- **p(≤2)** share rated 1–2 (floor ≤ 0.12 — one clanger in eight is the trust killer)
- **surprise** share ticked surprising ∧ rated ≥ 4 (the D02 objective; report, no floor in round 1)
- **Spearman ρ** between engine score and mean rating (is the score *ordering* right? floor ≥ 0.35)
- per-signal breakdown: mean rating bucketed by each `reasons` signal

## Three engines, one bench (D04)
Same 50 outfits **re-ranked** three ways, raters see the top-10 of each (blind, shuffled):
1. `RULES_V1` (engine.md)
2. off-the-shelf image embedding (CLIP-class) cosine over cutouts, no training
3. a vision-LLM asked to rank the 50 with the stylist prompt
Choose by p(≥4) of each top-10; ship rules unless another wins by ≥ 0.1. Record in §log.

## Floors (`bench/FLOOR.json`) — raise deliberately, never lower
```json
{ "mean": null, "p_ge4": null, "p_le2": null, "rho": null, "note": "set after round 1" }
```
`pnpm check` (root) runs engine tests + tagging eval (if fixtures present) + `bench:score` against
FLOOR and fails on regression. No styling change ships without it.

## Log
| date | closet | engine | mean | p≥4 | p≤2 | surprise | ρ | change | by |
|---|---|---|---|---|---|---|---|---|---|
| — | — | — | — | — | — | — | — | first round pending | — |
