# AI — item tagging and detection

Two prompts, both returning JSON validated by zod schemas in `packages/shared/src/ai.ts`. Model is
configured by `MODEL_PROVIDER` + `TAG_MODEL` secrets; prompts are model-agnostic and versioned as
`tagger_version` strings written on every item. **Never guesses brand or size** (not in schema).

## Candidates (Q01) — pick by what keys exist
Any vision-capable model that returns JSON reliably at ≤ ₹0.3/image: the cheapest tier of a major
provider is enough. The prompt uses closed enums so a small model does well. Record the choice in
`decisions.md` when made.

## Detection prompt `detect-v1`
```
System: You find clothing and accessories in a photo. Return only JSON.
User: Image attached. Return {"boxes":[{"x":0..1,"y":0..1,"w":0..1,"h":0..1,"kind":"garment|accessory|not_clothing","confidence":0..1}],
"advisories":["over_detection"|"overlap"|"person"|"dark"]}. One box per physical item; a dupatta lying on a kurta is TWO
boxes; a folded item is one box; hangers, cushions, bags-of-clothes, furniture are "not_clothing". Max 20 boxes,
largest first. Add "person" if any person is visible, "dark" if the photo is underexposed, "overlap" if any two garments
touch, "over_detection" if more than 20 items exist.
```
Schema: `DetectResponse` (api.md). Post-processing: clamp, cap 20 by area, `not_clothing → selected=false`.

## Tagging prompt `tag-v1`
```
System: You are a wardrobe cataloguer for Indian men's and women's clothing. Return only JSON matching the schema.
Never output brand or size. If unsure, use "unknown" or lower the confidence — never invent.
User: Cutout image attached. Wardrobe type: {men|women|both}.
Schema:
{"category":"top|bottom|one_piece|footwear|layer|accessory|gymwear|ethnic",
 "subcategory": one of {subcategories for this category from taxonomy.json},
 "colors":[{"name":string,"hex":"#RRGGBB","family":one of {colorFamilies},"dominance":0..1}] (1–3, dominant first, sum ≤ 1),
 "pattern":"solid|stripe|check|print|floral|embroidered|unknown",
 "fabric":"cotton|linen|denim|silk|wool|synthetic|knit|unknown",
 "formality":1|2|3|4|5|null,   // 1 gym, 2 casual, 3 smart-casual, 4 formal, 5 occasion/festive
 "seasons":["summer"|"monsoon"|"winter"|"all"],
 "is_set":boolean, "layer_role":"base|mid|outer|one_piece|accessory|null",
 "style_tags":[subset of {styleTags}] (0–3),
 "confidence":{"category":0..1,"subcategory":0..1,"colors":0..1,"pattern":0..1,"fabric":0..1,"formality":0..1,"seasons":0..1}}
Rules: a kurta set, co-ord or dress is one_piece with is_set=true. A dupatta, jacket, blazer, Nehru jacket, shrug is layer.
Sarees are ethnic/saree, one_piece. Juttis, kolhapuris, mojaris are footwear/ethnic_footwear.
```
Schema: `TagResponse`. Post: unknown enums → `'unknown'`; missing confidence → 0.5; `formality`
null allowed. Any field `confidence < 0.7` → item enters S05 queue.

## Test set and eval (before beta; T04 in build plan)
`knowledge/eval/tagging/` (git-lfs): 100 cutouts — 50 men's, 50 women's, ≥ 30 ethnic (sarees,
lehengas, kurta sets, dupattas, sherwanis, juttis) — with a `labels.json` written by hand.
`pnpm eval:tagging` → per-field accuracy; **floor: category ≥ 95%, subcategory ≥ 80%, dominant
colour family ≥ 85%, formality within ±1 ≥ 85%**. Record every run in `06-ai/bench.md §log`.
Detection: `knowledge/eval/detection/` 20 flat-lay photos + `boxes.json`; **floor: ≥ 80% of items
found with IoU ≥ 0.5, ≤ 1 false positive per photo** (D06 pre-gate uses the same set at ≥ 60%).

## Safety
Cutout only is sent (never the original with a face). Provider data-retention set to none where
available. Images never used for training by us; consent copy says so.
