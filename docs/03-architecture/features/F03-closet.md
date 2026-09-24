# F03 — Closet and item detail (S06, S07)
**Depends on:** F02. **Blocks:** F05 (needs ≥8 items to be meaningful).
## Backend
Direct selects under RLS: `items where user_id=auth.uid() and status<>'archived' order by created_at desc`.
`hidden-outfits` for the banner. Laundry/archive/delete are direct updates; the archive/delete trigger
marks outfits incomplete. Delete also removes storage objects (client calls `storage.remove`, then
deletes the row; a cron sweeps orphans weekly).
## Engine
`hiddenOutfits`, `whatGoesWith` (item detail strip).
## App
`features/closet/ClosetScreen`: `SectionList` by category (order from taxonomy `sectionOrder`),
`ItemTile` with `expo-image` thumbnails (signed URLs cached 1 h via TanStack Query), FAB.
Filters as a bottom sheet writing a `ClosetFilter` object; search debounced 200 ms over local
cache. `HiddenOutfitsBanner` reads `/hidden-outfits` (staleTime 5 min; invalidated on any item write).
`features/closet/ItemDetailScreen`: `whatgoeswith` strip; laundry toggle optimistic; archive sheet.
Realtime: subscribe to `items` changes for pop-in.
## Edge cases → behaviour
edited tags → job `process_item` re-runs pairing step only (payload `{item_id, step:'pair'}`) ·
delete in saved outfit → incomplete + replace · all laundry in category → copy state · 40+ laundry
→ "mark all clean" · laundry >14 d → nudge · <8 items → banner progress copy.
## Tests
unit: filter reducer; section ordering; NULL fields never excluded by filters. e2e: long-press
laundry, item disappears from feed on next page.
## Analytics
`laundry_toggled`, `item_archived`, `hidden_outfits_seen {surface:'closet'}`.
