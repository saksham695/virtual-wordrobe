# Component library — APIs, states, accessibility

The system, specified the way a function is specified: props in, behaviour out, everything else
internal. Tokens are in `knowledge/design/tokens.json` (primitive → semantic). Components consume
**semantic** tokens only. `apps/mobile/src/ui/` implements exactly this; the canvas
(**Design system** page) draws every state listed here.

Ladder: token → primitive (`Text`, `Pressable`, `Surface`, `Icon`) → composed component (below)
→ pattern (add flow, feed card lifecycle) → template (tab screen, modal stack screen).
Fix at the lowest level that works.

Conventions that apply to every component:
- **No open style props.** Only `style` for outer layout (margin, flex, width). Never colour, type or padding.
- **Touch target ≥ 44 pt** even when the visual is smaller (hit-slop).
- **Focus-visible** = 2 px `focus` ring, offset 2, on every interactive element (keyboard/switch users).
- **Reduced motion**: every animation becomes opacity-only.
- **Text scaling** to 130% without clipping; layouts wrap, never truncate labels on buttons.
- **Naming**: by role, not look (`danger`, not `red`).

---

## Button
**Purpose:** commit an action. **Anti-purpose:** navigation between tabs (use TabBar/links), toggles (use Chip/Switch).
**Props:** `variant: 'primary' | 'secondary' | 'ghost' | 'danger' | 'tape'` · `size: 'lg' | 'md'` (54 / 44) · `label: string` (≤ 24 chars; wraps to 2 lines at 130% text, never truncates) · `icon?: IconName` (leading only) · `loading?: boolean` · `disabled?: boolean` · `disabledReason?: string` (required when `disabled`; rendered as caption under the button) · `onPress`.
**Slots:** none. Label is a string so it can be measured; no children.
**States matrix:**
| state | primary | secondary | ghost | danger | tape |
|---|---|---|---|---|---|
| default | accent bg / onAccent | 1.5 accent border / accent text | transparent / accent text | danger bg / onAccent | highlight bg / onTape |
| pressed | accent.pressed | accent.soft bg | accent.soft bg | danger 90% | tape 90% |
| focus-visible | + focus ring on all |
| disabled | 40% opacity, `disabledReason` shown, still announced with reason |
| loading | spinner replaces icon, label stays, width locked, `aria-busy` |
**Content rules:** verb first ("Add 7 items"), sentence case, digits, no trailing punctuation, no exclamation.
**Responsive:** full-width in bottom action rows; intrinsic width inline; two buttons in a row split 1 : 1.4 (secondary : primary).
**A11y:** role button; name = label; `disabledReason` appended to the accessible name; `loading` announces "busy". Never a disabled primary without a reason.
**Composition:** may sit in ActionRow (≤ 3), sheet footer, EmptyState; never inside a Card that is itself pressable (nested pressables).

## Chip
**Purpose:** a selectable or informative token: filters, occasion picks, tags. **Anti-purpose:** primary actions, navigation.
**Props:** `label` (≤ 18 chars; longer wraps to 2 lines, chip grows) · `mode: 'select' | 'filter' | 'static'` · `selected?` · `uncertain?` (tag needs a human check) · `leading?: 'colorDot' | IconName` · `leadingColor?` · `trailing?: 'check' | 'count' | 'remove'` · `onPress` · `onRemove?`.
**States:** default (surface.raised, border.subtle) · selected (accent bg, onAccent) · uncertain (highlight.soft bg, 1.5 dashed attention border, onTape text, trailing "CHECK" in micro) · pressed (accent.soft) · disabled (40%) · focus-visible (ring).
**Content:** sentence case; a count uses mono ("Unworn 30d"); never a full sentence.
**Responsive:** wraps in a `ChipGroup` with 8 gap; in a horizontal `ChipRow` it scrolls with 18 gutter fade.
**A11y:** `mode=select` → role radio (single) / checkbox (multi), state announced; `filter` → role button + pressed; `uncertain` announces "needs check".
**Composition:** only inside ChipGroup / ChipRow / TagRow. Never alone as a button.

## TextField
**Purpose:** free text and numbers. Variants cover every input in V1.
**Props:** `variant: 'text' | 'search' | 'phone' | 'otp' | 'note' | 'price'` · `label: string` (always visible; placeholder is an *example*, never the label) · `value` · `onChange` · `max?` (note: 300, shows `n/300` in mono) · `error?: string` · `help?: string` · `leading?: IconName` · `trailing?: 'clear' | 'count' | 'locate'` · `autoFocus?` · `keyboard` inferred from variant.
**otp:** 6 cells, 44×52, mono 22, auto-advance, paste fills all, resend link after 30 s, error shakes once (opacity-only under reduced motion).
**phone:** country code fixed `+91` prefix cell; formats `98765 43210`.
**States:** default · focus (accent border 1.5) · filled · error (danger border + `error` line + icon; the field keeps its value) · disabled · read-only (no border, value as text).
**Content:** labels ≤ 3 words; `help` one line; errors say what to do ("Enter the 6-digit code we sent to +91 98765 43210").
**A11y:** label associated; error announced on change (live region polite); otp cells grouped as one field with name "6-digit code, n of 6 entered".
**Composition:** inside a Form stack with 14 gap; one primary Button after.

## FormalityScale
**Purpose:** show or set formality 1–5. **Props:** `value: 1..5 | null` · `range?: [lo, hi]` · `editable?` · `uncertain?` · `onChange?`.
**States:** null (all segments border.subtle, label "Unknown") · value (segments ≤ value filled attention) · range (filled band) · uncertain (dashed outline + "Check this" chip) · editable (segments are 44-tall targets).
**A11y:** role slider, min 1 max 5, value text "Smart casual"; labels Gym / Smart casual / Wedding at 1 / 3 / 5.

## ItemTile
**Purpose:** one item in a grid. **Props:** `item` · `onPress` · `onLongPress` (laundry) · `processing?: 'queued' | 'tagging' | 'failed'` · `selected?`.
**States:** default (cutout on surface.raised, caption name ≤ 2 lines) · processing (shimmer + mono "tagging…") · failed (attention corner badge "retry") · laundry (cutout 30% desaturated + wash icon) · ragged (small "improve photo" badge) · selected (accent 2 border) · pressed (surface.sunken).
**Content:** name = "{colour} {subcategory}" generated, user-editable, ≤ 28 chars then 2-line wrap.
**A11y:** name announces "Brown kurta, never worn, in wash" (state suffixes); long-press has a visible alternative (item detail toggle).
**Composition:** 3-column grid, 8 gap, inside ItemGridSection.

## DetectionBox
**Purpose:** one detected item over a photo. **Props:** `box {x,y,w,h}` (0..1) · `index` · `selected` · `kind: 'garment' | 'accessory' | 'not_clothing'` · `active?` (handles shown) · `onToggle` · `onAdjust?`.
**States:** selected (2 highlight border, mono index tag) · unselected (2 dashed ink.300, tag ink.300) · not_clothing (unselected + centred label "not clothing?") · active (corner handles 10 px, 44 hit) · merging (both boxes highlight, dashed union preview).
**A11y:** role checkbox "Item 3, selected"; adjust via an "Adjust" sheet with ± steps for switch users (drag is not the only path).

## OutfitComposition
**Purpose:** render a set of slots as one outfit that reads as an outfit (D12). **Anti-purpose:** any grid of cutouts.
**Props:** `slots: { top?, bottom?, one_piece?, footwear?, layer?, accessories?: Item[] }` · `size: 'mini' | 'card' | 'detail' | 'builder' | 'share'` · `emptySlots?: boolean` (dashed silhouettes for missing) · `highlightSlot?: Slot` (shuffle target).
**Geometry** (fractions of W × H; from `packages/shared/src/composition.ts`): layer (−0.04W, +0.02H) behind top; top at (0.08W, 0.06H) 0.56W, rotate −4°; bottom (0.34W, 0.30H) 0.52W, rotate +3°, under top's hem; one_piece replaces both at (0.20W, 0.06H) 0.58W; footwear (0.62W, 0.72H) 0.30W; accessories 0.14W each, top-right column from (0.82W, 0.08H); ground ellipse at 0.86H, 0.7W, 12% ink, blur 6.
**Sizes:** mini 150×140 · card 354×330 · detail 354×400 · builder 354×360 · share 1080×1200.
**States:** complete · incomplete (missing slot dashed silhouette + "item removed" label when it was deleted) · in-wash item (30% desaturate + wash badge) · loading (silhouette skeletons).
**A11y:** one accessible node: "Outfit: teal jacket, white tee, beige chinos, white sneakers. Never worn together." Items are listed below in the parent, not inside.
**Composition:** inside OutfitCard, LookCard, ItemDetail strip, Builder, ShareCard. Never with a border; the ground shadow is its only elevation.

## OutfitCard
**Purpose:** one feed card. **Props:** `card` · `onSave` · `onSkip` · `onWear` · `onShuffle` · `onShare` · `onOpen` · `saved`.
**Slots:** composition (fixed) · badges (0–2 `Badge`) · reason (1–2 lines) · ActionRow.
**States:** default · saved (heart filled positive, "Saved") · worn today (Wear today → "Worn · undo" for 3 s) · seen-before (badge) · stale ("This outfit changed" overlay when an item was deleted after generation).
**Gestures:** double-tap = save; swipe up = skip; both have button equivalents.
**A11y:** card is one group; actions are real buttons with names; double-tap and swipe are never the only path.

## LookCard
Same as OutfitCard with `composition size=mini-wide (132×128)` left, reason right, actions Save / Wear today; `index` in mono "LOOK 2"; `novelty` badge inline.

## Badge
`tone: 'highlight' | 'attention' | 'positive' | 'neutral'`, `label` ≤ 24 chars uppercase micro. Never the only signal (text carries the meaning).

## QuotaPill
`used`, `limit`, `exhausted?`. Mono "12 OF 30 LEFT"; exhausted → danger.soft bg, danger text, label "0 LEFT · BETA BONUS". Announces remaining count.

## StatBar
`value`, `max`, `label?`. 4–6 px, accent on border.subtle. Announces "6 of 34 worn".

## HiddenOutfitsBanner
`owned`, `worn`, `itemsCount`, `onPress`. Under 8 items → "6 of 8 items — nearly there" + StatBar to 8. Pressable → Profile. One per screen, top of Closet only.

## BottomSheet
**Purpose:** a short decision or picker without leaving the screen. **Anti-purpose:** anything with more than one screenful of content (use a page).
**Props:** `open` · `onClose` · `title?` · `detent: 'auto' | 'half' | 'full'` · `dismissible=true` · children.
**States:** closed · opening (200 ms) · open · dragging · keyboard-open (content lifts, footer stays reachable).
**A11y:** role dialog, focus trapped, title as name, Escape/back closes, background inert.

## EmptyState
`kind: 'first-use' | 'cleared' | 'no-results' | 'error' | 'offline'` · `title` · `body?` · `actions: [Button, Button?]` · `illustration?: GarmentSilhouette`. Three empties are three messages: first-use invites, cleared confirms, no-results suggests loosening. Error names one recovery. Offline says what still works.

## Toast
`text` (≤ 40 chars) · `action?: { label, onPress }` · 3 s (6 s with action) · bottom, above TabBar · polite live region · stacks max 1 (new replaces).

## Advisory
`kind: 'over_detection' | 'overlap' | 'person' | 'dark' | 'offline' | 'duplicate'` → copy from `features/add/copy.ts`; warning icon + bold lead + secondary sentence; on camera surfaces uses camera tokens.

## TabBar
5 fixed tabs, `active`; icons 20 + labels 11; 72 tall incl. inset; active accent + 800 weight; role tablist; badge on Closet when photos pending.

## ProgressDots / StepBar
Onboarding (3 dots) and review queue (n segments). Decorative; progress announced by the screen title ("Step 2 of 3").

---

## Patterns (composed from the above)
- **ActionRow:** ≤ 3 buttons; primary rightmost or full-width when alone; 8 gap; 18 gutter; sits above TabBar with 10 bottom padding.
- **Form:** TextFields 14 apart, one primary Button, errors inline, submit disabled only with reason.
- **Card list:** OutfitCards 14 apart, next card peeks 46 px.
- **Grid section:** micro title + mono count, 8 gap grid, hidden when empty.

## Contribution path
A new component needs: a row in this file, states drawn on the canvas Design system page, a fixture in `ui/__fixtures__/`, and a reason it cannot be a variant of an existing one. Otherwise it is a variant.
