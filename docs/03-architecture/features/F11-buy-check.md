# F11 — Should I buy this? (S15) — V1-B, build last, cut first
**Depends on:** F04, F03 (≥15 items). D01: advice only, no links.
## Backend
`/buy-check`: URL → server fetch (og:image, og:title, price meta; allow-list of hosts myntra, ajio,
amazon.in, flipkart, nykaa; others → screenshot fallback) → vision tag of the product image
(`tagging.md` same prompt, `pseudo_item`) → engine → `product_checks` row. Screenshot/photo →
vision tag directly. Multi-product screenshot → `detect-items` then ask which. Image deleted after
session unless "Add to closet" (converts to an item + job). 20/day.
## Engine
`nearDuplicates`, `buyVerdict`, `gapFinder`, `hiddenOutfits` delta.
## App
Entry: Profile row, closet empty-state button, Android share-sheet intent (`expo-intent-launcher`
receive; iOS share extension deferred). Confirm card with editable tags; result screen blocks
per PRD §11 table; "Buy anyway, add to closet" always one tap; override logged and loosens threshold.
## Tests
unit D1/D2; verdict table on fixture closet; URL parser fixtures for 5 hosts + 1 login wall → fallback.
## Analytics
`buy_check_started`, `buy_check_result`, `buy_check_overridden`.
