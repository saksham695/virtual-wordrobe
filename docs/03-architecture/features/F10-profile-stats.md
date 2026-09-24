# F10 — Profile and stats (S14)
**Depends on:** F03, F08.
## Backend
Direct selects: counts (`items` by status), never worn (`last_worn_at is null`), most/least worn
(`order by wear_count`), cost per wear (`price / greatest(wear_count,1)` where price not null),
`/hidden-outfits` for the hero. Settings write `profiles`. `/delete-account`.
## App
`features/profile/ProfileScreen`: hero from `/hidden-outfits`; tiles hidden when data absent
(no price → no CPW). Settings rows push sub-screens. Delete: confirm sheet → re-auth → call → sign out.
## Tests
e2e: delete account purges (second account cannot read anything; storage list empty).
## Analytics
`hidden_outfits_seen {surface:'profile'}`.
