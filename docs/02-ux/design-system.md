# Design system

The visual and interaction language of the app. Everything here is a token in
`apps/mobile/src/theme/tokens.ts` (to be written from this file, one export per table). Mockups on
the canvas use exactly these values.

## Principles
1. **Garment-tag, not app-store.** Paper ground, ink text, one workwear accent. Reads like a care
   label, not a SaaS dashboard.
2. **The clothes are the colour.** UI chrome is neutral so cutouts and silhouettes carry the palette.
   Accent is used for one action per screen.
3. **Numbers are the hook.** Counts (outfits owned / worn, items found, quota left) are set in mono,
   large, and never hidden in body copy.
4. **Never block, never nag.** Every optional field is behind a chip; every failure has a next step;
   no completion bars.
5. **44 pt or nothing.** Every tap target ≥ 44×44. Chips are 40 tall with 4 pt of dead margin.

## Colour

| Token | Light | Role | Contrast notes |
|---|---|---|---|
| `paper` | `#F4F2ED` | app background | — |
| `card` | `#FFFFFF` | surfaces, cards, sheets | — |
| `ink` | `#16202C` | primary text, icons | 15.6:1 on paper |
| `muted` | `#5A6573` | secondary text, captions | 5.1:1 on paper — never lighter |
| `line` | `#DDD8CE` | hairlines, dividers, inactive dots | decorative only |
| `denim` | `#23406A` | primary action, selection, links | white on denim 10.4:1 |
| `khaki` | `#9C7B45` | large numerals, section accents, "check this" | text only ≥ 20 px bold; borders/fills anywhere |
| `olive` | `#4A5A28` | positive: saved, worn, good score | white on olive 7.9:1 |
| `tape` | `#E7C766` | highlight, detection boxes, camera CTA | with `tapeInk` text only |
| `tapeInk` | `#3B3016` | text on tape | 9.8:1 on tape |
| `tapeSoft` | `#FFF8E0` | low-confidence field background | with `tapeInk` text + khaki dashed border |
| `alert` | `#8C3A2B` | destructive, quota exhausted, error | white on alert 7.3:1 |
| `camera` | `#10151C` | camera / detection screens ground | paper text on it 15:1 |
| `cameraCard` | `#1B222C` | camera-screen surfaces | — |
| `cameraLine` | `#3C4757` | camera-screen borders | — |
| `cameraMuted` | `#9AA6B5` | camera-screen secondary text | 7.6:1 on camera |

Garment silhouette fills (mockups and empty states only; real items use their cutout):
`navy #2E4568 · cream #E8E4DA (+1 px line stroke) · olive #6B7345 · rust #A85A3C · grey #8A8F96 ·
black #2A2E33 · tan #C3A06B · maroon #7D3B4E · teal #37605C · brown #5A4B3F`.

Colour-family IDs used by the engine (`knowledge/domain/taxonomy.json` → `colorFamilies`) are
separate from UI tokens and never restyled.

No dark mode in V1. The camera and detection screens are dark by design, not by theme.

## Type

Faces: **Archivo** (variable: `wdth` 62–125, `wght` 400–900) for everything; **JetBrains Mono**
400/600 for counts, quotas, step labels and IDs. Fallbacks: `system-ui, -apple-system, Roboto`.
Load via `expo-font` from bundled files (`assets/fonts/`), never at runtime from the network.

| Token | Size / line | Weight / stretch | Use |
|---|---|---|---|
| `display` | 38 / 1.0 | 850 / 112% | onboarding headline, profile hero number |
| `h1` | 22 / 1.1 | 850 / 108% | screen titles |
| `h2` | 20 / 1.15 | 850 / 108% | section titles, item names |
| `h3` | 17 / 1.25 | 800 / 100% | card titles, option labels |
| `body` | 15 / 1.5 | 500 | body copy |
| `bodyStrong` | 15 / 1.5 | 800 | inline emphasis |
| `small` | 13 / 1.4 | 600 | chips, secondary lines |
| `caption` | 12.5 / 1.35 | 500, colour `muted` | helper text |
| `micro` | 11 / 1.2 | 800, letter-spacing 0.1em, uppercase | section labels |
| `mono` | 12 / 1.2 | mono 600, letter-spacing 0.1em | counters, step labels |
| `monoBig` | 44 / 1.0 | mono 600 | hero numbers |

Letter-spacing on `display`/`h1`/`h2`: −0.02em. Max line length for body: 30ch on phone.

## Spacing, radii, elevation
- Base unit 4. Page gutter **18**. Card padding **16**. Stack gaps: 6 / 10 / 14 / 18 / 34.
- Radii: cards and buttons **4** (square-ish, like a label); chips **999**; cutout tiles **6**;
  avatars **50%**. Never 12–16 px "app" rounding.
- Elevation: none. Depth is done with `line` hairlines and the paper/card contrast. Bottom sheets
  get a 1 px `line` top border. The only shadow in the app is under an `OutfitComposition` ground.
- Bottom tab bar: 72 tall including safe area; 5 tabs; active tab in `denim`, others `muted`.

## Iconography
Inline stroke SVG (stroke 1.8–2.2, round caps), 20×20 in tab bar, 16–19 elsewhere. Never emoji.
Set (all in `apps/mobile/src/ui/icons/`): `back, close, flash, gallery, shutter, check, plus,
merge, split, deselect, warning, camera, heart, heartFilled, skip, shuffle, share, hanger, wash,
archive, edit, search, filter, feed, closet, style, saved, profile, chevron, sun, cloud, quota`.

## Motion
- Durations: 120 ms (state), 200 ms (sheet, chip), 320 ms (screen). Easing `cubic-bezier(.2,.8,.2,1)`.
- Items "pop in" to the closet grid with a 200 ms scale 0.96→1 + fade when processing completes.
- Feed save: heart scales 1→1.25→1 over 240 ms; card slides up 320 ms on skip.
- Reduced-motion: all of the above become opacity-only.

## Components (inventory; props in `05-frontend/components.md`)
`Button (primary | secondary | ghost | danger)`, `Chip (default | selected | uncertain)`,
`FormalityScale`, `ColorDot`, `GarmentSilhouette`, `CutoutImage`, `ItemTile`, `ItemGridSection`,
`DetectionBox`, `TagRow`, `OutfitComposition`, `OutfitCard`, `LookCard`, `StatBar`,
`HiddenOutfitsBanner`, `QuotaPill`, `OccasionChipGroup`, `NoteField`, `BottomSheet`,
`TabBar`, `EmptyState`, `Toast`, `ProgressDots`, `StepBar`.

## Copy rules
- Sentence case everywhere except `micro` labels. No exclamation marks.
- Numbers as digits ("8 items found", never "eight").
- Verbs on buttons: "Add 7 items", "Looks right", "Wear today", "Get styled". Never "Submit", "OK".
- Failures name the next step: "We couldn't spot any clothes. Try better light, or add one item by hand."
- Never moralise on buy-check: no "you don't need this".
