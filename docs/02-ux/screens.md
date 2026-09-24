# Screens — every screen, every state

**Canvas (Figma-style, tappable prototype):** https://claude.ai/artifact/HbX1p6ZEv4apdhw31YVisN
Artboards are named by screen ID below. Phone frame 390×844. Play mode follows the links.

Screen IDs are stable. Each screen lists: purpose · entry · regions (top→bottom) · components ·
states · interactions · copy · analytics · exits. States marked **[canvas]** are drawn; others are
specified here and built from the same components.

Tab bar (`TabBar`) appears on S06, S08, S10, S13, S14 only: **Feed · Closet · Style · Saved · Profile**.

---

## S01 Onboarding — wardrobe type
**Purpose:** the promise in one line, then the single question that changes the taxonomy.
**Entry:** first launch, after OTP/Google sign-in (auth screens are the provider's; not designed).
**Regions:** wordmark + `ProgressDots(3, active 1)` · `display` headline · body · `micro` label ·
three option cards (`h3` + caption + garment glyph + radio) · spacer · primary `Button` · caption.
**Components:** ProgressDots, Button, GarmentSilhouette.
**States:** default (nothing selected → Continue disabled, 40% opacity) · one selected **[canvas: Menswear]**.
**Interactions:** tap card → selects (denim 2 px border, filled check) · Continue → S02.
**Copy:** "You own more outfits than you think." / "Most people wear a fifth of what they hang up.
Photograph your clothes once — we'll find the rest." / WHAT'S IN YOUR CUPBOARD / Menswear —
"Shirts, trousers, kurtas, shoes" / Womenswear — "Kurta sets, sarees, dresses, dupattas" / Both —
"A shared cupboard, or you wear both" / Continue / "City and occasions come next — both skippable."
**Analytics:** `signup_completed` fires at the end of S02, carrying `wardrobe_type`.
**Exits:** → S02.

## S02 Onboarding — city and occasions
**Purpose:** two skippable inputs that make the feed better on day one.
**Regions:** ProgressDots(3, active 2) · `h1` "Where are you, and where do you go?" · city field with
autocomplete + "Use my location" ghost button · `micro` USUAL OCCASIONS · `OccasionChipGroup`
(multi-select, 0–8, ordered by the catalog's `onboardingOrder`) · spacer · primary "Start adding
clothes" · ghost "Skip for now".
**States:** empty · city typed · location denied (field stays empty, no toast, no re-ask) ·
≥1 occasion selected.
**Rules:** Both inputs optional. Location permission asked only on tap. Denial never blocks.
**Analytics:** `signup_completed {wardrobe_type, city_set, occasions_count}`.
**Exits:** → S03 with a one-time coach mark "Spread 8–10 items on a bed and take one photo."

## S03 Capture — camera
**Purpose:** the ten-minute promise starts here: one photo, many items.
**Entry:** S02; Closet "+" (S06); Item detail "Re-shoot".
**Regions:** close (→ S06) · `mono` "PHOTO 1 OF 4" · flash · viewfinder (dashed tape guide,
corner brackets, hint pill) · bottom bar: gallery (→ S04 via Path B), shutter (→ S04), mode label.
**Components:** none beyond icons; ground is `camera` colour.
**States:** default **[canvas]** · mode = single item (mode label reads ONE ITEM; guide frame
becomes a centred 60% square) · permission denied (full-screen `EmptyState`: "Camera is off for
this app" + "Open settings" + "Choose from gallery instead") · low light (hint pill becomes
"Looks dark — try near a window", detected from exposure) · capturing (shutter fills tape, 120 ms).
**Interactions:** shutter → captures, client resizes longest edge to 1200 px WebP ~200 KB, → S04
with "Finding items…" card · gallery → multi-select up to 20 → S04 grouped by source photo · mode
label toggles MANY ITEMS / ONE ITEM.
**Copy:** "Lay 8–10 items flat, no overlap" · "Looks dark — try near a window".
**Analytics:** `upload_started {path: A|B|C}`.
**Exits:** → S04; close → S06.

## S04 Detect — detection review  ★ the screen the promise depends on
**Purpose:** confirm what the model found, fix what it got wrong, in under 20 seconds per photo.
**Regions:** back (retake) · `h1` "8 items found" + caption "Tap a box to deselect · drag corners
to adjust" · photo with `DetectionBox` overlays (numbered tape boxes; corner handle on the
selected one) · advisory row (`warning` icon + one line) · tool row: Merge · Split · Deselect ·
spacer · primary tape `Button` "Add N items to closet" · caption.
**Components:** DetectionBox, Button.
**States:**
- detecting: photo dimmed 40%, centred card "Finding items…" with a tape progress bar; no boxes.
- default **[canvas]**: 8 boxes, one auto-deselected (dashed grey, label "not clothing?").
- zero found: photo + `EmptyState` over it: "We couldn't spot any clothes." / "Try better light, or
  a plain background." buttons: "Retake" · "Add this photo as one item".
- over-detection (>20): cap at 20 largest by area; advisory: "Busy photo — showing the 20 biggest.
  Split the pile for the rest."
- overlapping garments: advisory: "Box 3 might be two things (dupatta on kurta). Tap Split."
- person in photo: advisory: "We'll keep only the clothes. The original stays private."
- offline / API down: photo saved; advisory: "No connection — we'll find the items when you're
  back online." primary becomes "Save photo for later"; → S06 with a "3 photos waiting" strip.
**Interactions:** tap box → toggles selected (solid tape ↔ dashed grey; count in title and CTA
updates) · long-press box → corner handles appear; drag adjusts · Merge: select two → one box ·
Split: select one → box divides along its longer axis into two, each re-tagged · Deselect: clears
selection · primary → enqueues N items, → S05 for the first low-confidence item, else → S06.
**Copy:** "8 items found" · "Box 8 looks like a bag, not clothing. We've unticked it — tap to
keep." · "Add 7 items to closet" · "They'll tag in the background — you can keep shooting."
**Analytics:** `detection_corrected {action: deselect|merge|split|adjust}` per action;
`item_added` fires per item as it finishes processing (from the queue, not this screen).
**Exits:** → S05 or S06; back → S03.

## S05 ItemReview — tag review queue
**Purpose:** glance-and-fix. Confident tags are quiet; uncertain ones are loud. Never a form.
**Entry:** after S04 (only items with any field `confidence < 0.7`); Item detail "Edit tags".
**Regions:** back · `mono` "ITEM 3 OF 7" · "Skip all, they look fine" link · `StepBar` · cutout card
with re-shoot button · `h2` name + caption "tops · kurta" · `TagRow` (colour chip with `ColorDot`,
pattern, fabric, style, season) · FORMALITY `FormalityScale` · "Add brand, size, price — optional"
ghost row · spacer · "Fix a tag" secondary + "Looks right" primary.
**Components:** StepBar, CutoutImage, TagRow, Chip (uncertain variant), FormalityScale, Button.
**States:** default with two uncertain fields **[canvas]** · all confident (no uncertain chips;
this item is skipped in the queue automatically) · editing a chip (bottom sheet with the closed
enum for that field; single tap selects and closes) · optional details expanded (brand free text
with autocomplete of brands this user typed before; size free text; source chips; price; bought on;
notes) · processing failed (`category = unsorted`; banner "We couldn't tag this one. Pick a
category to start." with category sheet open).
**Rules:** every field except the photo may stay empty; "Looks right" is always enabled.
Corrections write `tag_corrections {before, after}`.
**Copy:** "Cotton?" + CHECK · "Check this" · "Add brand, size, price — optional" · "Fix a tag" ·
"Looks right" · "Skip all, they look fine".
**Analytics:** `item_added {category, confidence, corrected, optional_fields_filled}` on Looks
right / Fix; `detection_corrected {action: retag}` per changed field.
**Exits:** next item, or → S06 when the queue is empty.

## S06 Closet
**Purpose:** everything you own, counted; the entry to Add.
**Regions:** `h1` "Closet" + `mono` "74 ITEMS" · `HiddenOutfitsBanner` ("You own 34 outfits ·
worn 6" + thin `StatBar`, tap → S14) · search + filter row · "In wash (6)" collapsed strip ·
`ItemGridSection` per category (3 columns, `ItemTile` 106×128, newest first) · FAB "+" (→ S03) ·
TabBar (Closet active).
**Components:** HiddenOutfitsBanner, StatBar, ItemGridSection, ItemTile, TabBar.
**States:** default **[canvas]** · empty: `EmptyState` "Start with 8 items on your bed." big "+"
(→ S03) · <8 items: banner reads "6 of 8 items — nearly there" instead of outfits count ·
processing: tiles with shimmer + "tagging…" caption pop in as done · pending offline: strip "3
photos waiting to process" · everything in wash: category shows "Everything's in the wash" ·
filter active: chip row under search shows active filters with clear · search results: flat
grid, no sections · free cap reached (100): "+" opens sheet "Closet is full (100 items). Archive
some to add more." · laundry >14 d: soft banner "Still in the wash? · Mark clean".
**Filters:** colour family · formality · season · status · "not worn in 30/60/90 days" · "never
worn". **Search:** subcategory, colour name, brand, notes.
**Interactions:** tap tile → S07 · long-press tile → laundry toggle with `wash` icon flash · tap
banner → S14 · "+" → S03.
**Analytics:** `laundry_toggled {items_count}` on long-press.
**Exits:** → S03, S07, S14, tabs.

## S07 ItemDetail
**Regions:** back · actions (edit, share) · large `CutoutImage` on card · `h2` name + tags row
(read-only chips; tap → S05 edit mode) · wear stats block (`mono` "WORN 4× · LAST 12 AUG" or
"NEVER WORN · added 3 months ago") · optional details (only shown when any is filled) · `micro`
WHAT GOES WITH THIS? · horizontal strip of 4 `OutfitComposition` minis with score pill (→ S09) ·
action row: "In wash" toggle · "Archive" · "Re-shoot".
**States:** default · never worn (wear block in `khaki`, and a one-line nudge "3 ways to wear it
below") · in wash (toggle on, cutout desaturated 30%, strip hidden with "Back from the wash to see
matches") · archived (banner "Archived · doesn't fit" + "Restore") · no matches yet (<8 items or
no pairings ≥55: "Add a few more items to see matches") · processing (tags shimmer, strip hidden).
**Archive sheet:** reason chips: doesn't fit · worn out · gave away · sold · other. Optional.
**Delete:** in edit → "Delete item" danger with confirm; outfits containing it become incomplete.
**Analytics:** `laundry_toggled`, `item_archived {reason}`.
**Exits:** → S05 (edit), S09 (a match), S03 (re-shoot), back.

## S08 Feed  ★ the habit surface
**Purpose:** outfits from your own clothes, one at a time, some of which you've never worn together.
**Regions:** `h1` "Today" + weather chip ("31° sunny, Gurgaon") · filter chips row (horizontal:
All · Office · Casual · Ethnic · Gym · Unworn 30d · a colour) · `OutfitCard` (full-width;
`OutfitComposition` 354×330; badges row — "never worn together" in tape, "not worn in 4 months" in
khaki; one-line reason; action rail: save (heart), skip, wear today, shuffle one, share) · peek of
next card (top 56 px) · TabBar (Feed active).
**Components:** OutfitCard, OutfitComposition, Chip, TabBar.
**States:** default **[canvas — interactive: heart toggles]** · loading first page (two skeleton
cards) · <8 items (`EmptyState` with `StatBar` "6 of 8 items — nearly there" + "Add items") ·
missing category (cards without that slot + one-line hint "No shoes in your closet yet — outfits
skip that slot") · 10 skips in a row (inline sheet "Not feeling these? Tell us why" chips: too
formal · wrong weather · don't like the colour · seen it; adjusts boosts immediately) ·
combinations exhausted (cards repeat, badge "seen before") · offline (cached page; actions queue;
small strip "Offline — we'll sync your saves") · weather failed (no chip, no boosts, no error) ·
item deleted after generation (card dropped on refresh; if on screen, tap → "This outfit changed").
**Interactions:** double-tap card or heart → save (`olive` heart, scale animation; `card_saved`) ·
swipe up or skip → next (`card_skipped`) · wear today → marks all items worn, toast "Worn today ·
undo" (`wear_marked {source: feed}`) · shuffle one → replaces the lowest-scoring slot with the
next-best pairing, badge updates · share → S09's share sheet · tap card → S09 · filter chip →
regenerates page with boost.
**Rules:** zero AI calls; page of 10, seeded by (user, date); no item in >2 of any 10 cards; 30%
of anchors are never-worn-together pairs (D03).
**Copy:** reason examples: "Earthy and relaxed, good for 31°" · "Your navy kurta, never with these
chinos" · "Two things you haven't touched since June".
**Analytics:** `card_seen {outfit_id, score, novelty, anchor_unworn_days}`, `card_saved`,
`card_skipped`, `wear_marked`, `share_created {source: feed}`.
**Exits:** → S09, tabs.

## S09 OutfitDetail
**Regions:** back · share · large `OutfitComposition` (354×400) · badges · `h2` one-line reason ·
item list (each row: mini cutout, name, `mono` score contribution, chevron → S07) · `micro` WHY IT
WORKS: per-signal bars from `pairings.reasons` (colour · formality · style · pattern · season) ·
action row: "Wear today" primary · "Save" · "Shuffle one" · "Share".
**States:** default · saved (heart filled, "Saved" label) · incomplete (an item archived/deleted:
row shows "item removed" + "Replace" → picks next-best for that slot) · from AI (`source=ai`: shows
the stylist's reason and tip instead of signal bars) · in-wash item present (row tagged "in wash",
Wear today still allowed).
**Share sheet:** preview of the share card (see F09) + native share.
**Analytics:** `wear_marked {source}`, `card_saved`, `share_created`.

## S10 StyleMe — occasion picker
**Regions:** `h1` "Get styled" + `QuotaPill` "12 of 30 left" · `micro` groups (EVERYDAY · SOCIAL ·
WORK SOCIAL · FESTIVE & ETHNIC · TRAVEL & OTHER) each an `OccasionChipGroup` from
`knowledge/domain/occasions.json`, ordered by onboarding picks then usage · "Something else" as
the last chip (opens a one-line field) · `NoteField` (optional, 300 chars, counter) · primary
"Show me 3 looks" · caption "Rules pick the candidates; AI only ranks and explains" · TabBar
(Style active) · secondary link "Build your own" → S12.
**States:** default **[canvas — interactive: chip select]** · quota exhausted (`QuotaPill` in
`alert`, primary reads "Get 10 bonus looks" in beta — grants and logs `quota_hit`) · zero
candidates for the chosen occasion (before any call: inline "Nothing festive in the closet yet —
a kurta or a saree would unlock this") · off-topic note (inline under field: "Keep it about
clothes — try 'rooftop, black jeans in wash'") · offline (primary disabled, caption "Needs a
connection").
**Interactions:** chip → single select · primary → S11 with loading state.
**Analytics:** `style_me_used {occasion, candidates_count, fallback_used}` (fires on result).
**Exits:** → S11, S12, tabs.

## S11 StyleResults
**Regions:** back · `h1` "Office party" + caption "31° · evening" · three `LookCard`s (each:
`OutfitComposition` 354×250, one-line reason, actions: Save · Wear today · Shuffle) · `micro` TIP
+ one line · `QuotaPill` "11 of 30 left" · "Try another occasion".
**States:** loading (three skeleton cards; caption "Picking from 11 candidates…") · default ·
fewer than 3 ("Only 2 work for a formal event — dark shoes would open this up") · rules fallback
(AI down / rejected / disabled: same 3 cards, reasons are the engine's short phrases e.g. "neutral
palette, right formality"; caption "Ranked by rules today"; quota not consumed) · cached (reopened
same day: no call, no quota change).
**Analytics:** `style_me_used {…, fallback_used}` · `card_saved {source: ai}` · `wear_marked`.

## S12 Builder — build your own  (not on canvas; built from S09's components)
**Regions:** `h1` "Build your own" · slot canvas (top · bottom / one-piece · footwear · +layer ·
+3 accessories) rendered as an `OutfitComposition` with empty slots dashed · live `mono` score +
one line ("colours work, formality is a stretch") · "Save outfit" primary · name + occasion sheet.
**Slot picker (bottom sheet):** that category's items sorted by pairing score against chosen
items; top 3 badged "goes well"; laundry items shown last with `wash` tag.
**States:** empty · partial · one-piece chosen (top/bottom slots disabled) · slot has no items
("Add shoes to your closet") · deliberately clashing (low score shown as info only; save allowed)
· duplicate of a saved outfit ("You've already saved this one" + link) · draft restored on return.
**Analytics:** `outfit_built_manually {slots_filled, final_score}`.

## S13 Saved
**Regions:** `h1` "Saved" · segmented: Outfits · Worn · grid of saved `OutfitComposition` minis
with source tag (feed / styled / built) and "Wear again" · Worn tab: date-grouped list of what was
worn, editable one day back · TabBar (Saved active).
**States:** default **[canvas]** · empty ("Save outfits you like and they'll live here.") ·
incomplete outfit (tile marked, "Wear again" disabled, "Replace" offered) · worn twice same day
("Already worn today · undo").
**Analytics:** `wear_marked {source: saved}`.

## S14 Profile
**Regions:** hero: `monoBig` "34" + `display`-weight "outfits in your closet." / "You've worn 6."
+ `StatBar` · stats grid (items · never worn · most worn · cost per wear if any price) · "Is this
worth buying?" row (→ S15, V1-B) · settings list (wardrobe type · city · occasions · notifications
· plan (Beta) · privacy & data · delete account) · sign out · TabBar (Profile active).
**States:** default **[canvas]** · <8 items (hero reads "6 of 8 items — nearly there") · no price
entered (cost-per-wear tile hidden) · delete account (confirm sheet; purges rows + photos; ≤3 taps).
**Analytics:** `quota_hit` surfaces here as plan status.

## S15 BuyCheck (V1-B, not on canvas)
Input: URL / screenshot / photo / manual (category + colour + formality) + optional price →
confirm card (tags editable) → result: verdict (Buy · Maybe · Skip), "You already own" thumbnails,
"Similar style", "Works with N things you own" + 3 `OutfitComposition` previews, colour balance,
cost per wear (only with price), better gap (advice only — D01). Actions: "Add to closet" · "Save
for later" · discard. Verdict suppressed under 15 items. Never moralise; "Buy anyway" always one tap.

---

## Navigation map
```
Auth (provider) → S01 → S02 → S03 → S04 → (S05)* → S06
Tabs: S08 Feed | S06 Closet | S10 Style | S13 Saved | S14 Profile
S06 → S03 (+), S07 (tile), S14 (banner)
S07 → S05 (edit), S09 (match), S03 (re-shoot)
S08 → S09 (card)
S10 → S11 (looks), S12 (build)
S11 → S09-equivalent detail per look
S14 → S15 (buy-check), settings sub-screens
```
Deep links (V1): `wardrobe://item/:id`, `wardrobe://outfit/:id`, `wardrobe://style/:occasion`.
