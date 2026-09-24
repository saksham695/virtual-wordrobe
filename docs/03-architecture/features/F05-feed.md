# F05 — Feed (S08, S09)  ★ habit surface
**Depends on:** F04. **Blocks:** F08 (save), F09 (share).
## Backend
`/feed` → `generateFeedPage` over the user's `pairings` + `items` + last-30-day `interactions` +
`pair_labels(worn)` + weather (Open-Meteo, cached per city per hour in an unlogged table) → cards.
`/track` receives `seen/save/skip/wear/shuffle` batches; writes `interactions`, `pair_labels`,
`wear_events`, `pairings.penalty`.
`feed_warm` job precomputes page 0 daily for active users.
## Engine
`generateFeedPage` (D03 anchor mix, boosts, diversity, seed), `assembleOutfit` for shuffle-one
(client-side over local pairings; new fingerprint → upsert outfit on next track).
## App
`features/feed/FeedScreen`: `FlashList` vertical paging; `OutfitCard` with `OutfitComposition`
(components.md); double-tap via gesture-handler; actions optimistic with outbox. Prefetch page n+1
at card 6. Filter chips → new query key. Ten skips → `FeedbackSheet`. Offline → last page from
TanStack persist (MMKV) + outbox.
`features/feed/OutfitDetailScreen` (S09): signal bars from `pairings.reasons` of each pair.
## Edge cases → behaviour
<8 items → `closet_too_small` → EmptyState · missing category → cards w/o slot + `hint` ·
exhausted → `seen_before` · weather fail → no boosts silently · deleted item → drop on refresh.
## Tests
engine F1/F2; API: page 0 < 1.5 s on a 100-item fixture closet; e2e: save reflects in page 1
of same session; zero network calls to AI hosts while scrolling (assert in a network-mock test).
## Analytics
`card_seen` (batched every 5 s / 10 cards), `card_saved`, `card_skipped`, `wear_marked`, `share_created`.
