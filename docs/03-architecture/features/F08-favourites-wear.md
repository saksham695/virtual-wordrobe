# F08 — Favourites and wear tracking (S13, plus actions on S08/S09/S11)
**Depends on:** F05. **Blocks:** F10 (stats need wear data).
## Backend
`outfits.saved` toggled directly; `/track` `wears[]` → `wear_events` (unique per item per day) →
trigger updates `items.wear_count/last_worn_at` → `pair_labels(worn)` for every pair (D07).
Wear history select: `wear_events where user_id=… order by worn_on desc` grouped client-side.
Edit one day back: delete + insert under RLS (`worn_on >= current_date - 1` check in policy).
## Engine
`hiddenOutfits.worn` reads these.
## App
`features/saved/SavedScreen`: segmented Outfits / Worn; "Wear again" → track wears for all items;
"already worn today · undo" when a wear exists for all items on today's date.
## Edge cases → behaviour
worn twice same day → once + undo · outfit incomplete → disabled + replace · unsave keeps history ·
tag edit → score recomputed lazily on open.
## Tests
DB: unique constraint; trigger increments once. e2e: wear from feed shows in Worn tab and item's
"last worn".
## Analytics
`wear_marked {source}`, `card_saved`.
