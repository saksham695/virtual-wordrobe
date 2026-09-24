# F07 — Build your own (S12)
**Depends on:** F04. 
## Backend
None new: saving an outfit is an insert into `outfits(source='manual')` under RLS (fingerprint
unique → "already saved" on conflict). `/track` gets `outfit_built_manually` event.
## Engine
Client-side: `pairScore` over local pairings cache for live score; slot picker sorting by mean
score against chosen items; `assembleOutfit` for "shuffle".
## App
`features/builder/BuilderScreen`: slot canvas is `OutfitComposition` with empty dashed slots;
picker is a `BottomSheet` `FlashList` of that category, sorted, "goes well" badges for top 3,
laundry last with tag. Draft persisted in MMKV (`builder.draft`). One-piece disables top/bottom.
## Edge cases → behaviour
no items for a slot → "Add shoes to your closet", save allowed incomplete · clashing → score shown,
save allowed · laundry chosen → tag · duplicate → link · app closed → draft restored.
## Tests
unit: one-piece slot logic; duplicate fingerprint detection. e2e: build, save, appears in S13.
## Analytics
`outfit_built_manually {slots_filled, final_score}`.
