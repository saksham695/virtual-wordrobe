# Styling rules — the designer knowledge, as data

This file is parsed at build time into `RULES_V1` (`packages/engine/src/rules.ts` reads the JSON
block below). Prose explains; the JSON is the contract. Change weights only with a bench delta.

## Weights and thresholds
```json
{
  "version": "rules-v1",
  "weights": { "color": 30, "formality": 25, "style": 20, "pattern": 15, "season": 10 },
  "store_threshold": 55,
  "outfit_min_mean": 65,
  "layer_min_mean": 65,
  "accessory_min_mean": 60,
  "color": { "neutral_any": 30, "monochrome": 26, "analogous": 24, "analogous_deg": 30,
             "complementary": 22, "complementary_range": [150, 210], "clash": 6, "clash_sat": 0.55,
             "clash_range": [60, 150], "other": 16, "unknown": 20, "secondary_bonus": 2 },
  "formality": { "gap0": 25, "gap1": 25, "gap2": 12, "gap3plus": 2, "unknown": 16 },
  "style": { "overlap": 20, "unknown": 14, "conflict": 3, "no_overlap": 10,
             "conflicts": [["ethnic","streetwear"],["ethnic","sporty"]], "fusion_tag": "fusion" },
  "pattern": { "solid_any": 15, "unknown_any": 12, "subtle_subtle": 9, "subtle_bold": 7, "bold_bold": 2,
               "subtle": ["stripe","check"], "bold": ["print","floral","embroidered"] },
  "season": { "overlap": 10, "disjoint": 0 },
  "vetoes": [ "same_slot_non_layer", "gymwear_with_formality_ge4", "one_piece_with_top_or_bottom" ],
  "penalty": { "per_skip": 8, "cap": 40, "weekly_decay": 4 },
  "feed": { "mix": { "novel_pair": 0.30, "least_worn": 0.30, "saved_neighbors": 0.20, "random": 0.20 },
            "boosts": { "weather": 8, "filter": 10, "unworn30": 6, "unworn90": 10, "saved_color": 4, "novelty": 12 },
            "diversity_max_per_10": 2, "page_size": 10 },
  "hidden": { "pair_min": 55, "mean_min": 65, "display_cap": 999 },
  "duplicate": { "hue_deg": 20, "hue_deg_loosened": 12, "formality_bands": [[1,2],[3,3],[4,5]] },
  "buy": { "min_closet": 15, "buy_unlocks": 6, "maybe_unlocks": 3 }
}
```

## Why these rules (for the agent tuning them)
- **Neutrals carry Indian wardrobes.** White, cream, black, grey, navy, beige, denim, tan pair with
  everything; this single rule produces most trustworthy outfits and is why `neutral_any` = full.
- **Formality is the loudest mistake.** A blazer with track pants is instantly wrong to anyone; a
  gap of 3 is near-zero. Kurta (5) with jeans (2) is a real, accepted look → gap 3 still gets 2, not
  a veto; the `fusion` style tag lifts style coherence for it.
- **Two bold patterns fail even in ethnic wear.** Printed kurta + printed dupatta is the classic
  clanger; embroidery counts as bold.
- **Unknown is never a mismatch** (schema rule). Unknown scores sit at ~65% of max so unlabelled
  items appear as often as labelled ones.
- **Ethnic ↔ streetwear/sporty conflict** unless `fusion` is tagged (sneakers with kurta is a
  deliberate look; tag it, don't fight it).
- **Proportion (from bodies-like-yours B-couture §3, D09):** fitted top + relaxed bottom or the
  reverse reads better than both loose. V1 has no fit data, so this is not scored; reserved as
  `fit_balance` for when `size_label`/fit tags exist.

## Phrase table (feed / fallback reasons; pick by strongest + weakest signal)
```json
{
  "color.neutral_any": "easy neutrals", "color.monochrome": "one colour, two tones",
  "color.analogous": "colours sit next to each other", "color.complementary": "a clean contrast",
  "formality.gap0": "same dress code", "formality.gap2": "formality is a stretch",
  "style.overlap": "same mood", "pattern.solid_any": "one plain piece keeps it calm",
  "pattern.subtle_subtle": "two quiet patterns", "season.overlap": "right for the weather",
  "novelty": "never worn together", "unworn30": "not worn in a month", "unworn90": "not worn in months",
  "weather": "good for {temp}°"
}
```
Compose: `"{strongest}, {weakest-if-<60%}"` capitalised, ≤ 60 chars; weather phrase appended when boosted.

## Topic check lists
```json
{
  "allow": ["shirt","tee","t-shirt","kurta","jeans","trouser","chino","dress","saree","lehenga","dupatta","jacket","blazer","shoe","sneaker","loafer","jutti","heel","sandal","watch","belt","bag","wash","laundry","ironed","iron","wear","outfit","look","colour","color","black","white","navy","blue","red","green","beige","office","party","date","wedding","festival","gym","travel","hot","cold","rain","sunny","rooftop","dinner","lunch","brunch","meeting","interview","casual","formal","ethnic"],
  "deny": ["email","essay","code","write me","translate","story","poem","ignore previous","system prompt","assistant","jailbreak","password","recipe","homework"]
}
```
