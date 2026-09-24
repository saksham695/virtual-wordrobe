# Components — inventory, props, states

All in `apps/mobile/src/ui/`. Props are TypeScript; every component has a story-like fixture in
`ui/__fixtures__/` used by tests and by the design canvas parity check.

| Component | Props | States / notes |
|---|---|---|
| `Button` | `variant: 'primary'|'secondary'|'ghost'|'danger'|'tape'`, `label`, `onPress`, `disabled`, `loading`, `icon?` | height 54 (primary) / 44; disabled 40% opacity; loading shows spinner, keeps width |
| `Chip` | `label`, `selected?`, `uncertain?`, `leading?: ReactNode (ColorDot)`, `trailing?: 'CHECK'`, `onPress` | 40 tall; selected = denim fill white text; uncertain = tapeSoft bg, khaki dashed border, tapeInk text |
| `ColorDot` | `hex`, `size=12` | 1 px `line` stroke when light |
| `FormalityScale` | `value: 1..5 | null`, `range?: [lo,hi]`, `onChange?`, `uncertain?` | 5 segments; null = all `line`; range fills khaki; labels Gym / Smart casual / Wedding |
| `GarmentSilhouette` | `kind: 'tee'|'shirt'|'kurta'|'jeans'|'trousers'|'shorts'|'dress'|'saree'|'jacket'|'dupatta'|'shoe'|'watch'|'bag'`, `fill`, `size` | mockups, empty states, builder empty slots (dashed) |
| `CutoutImage` | `path`, `quality?: 'ok'|'ragged'|'failed'`, `desaturate?` | signed URL via query layer; ragged → small badge "improve photo later"; laundry → desaturate 30% |
| `ItemTile` | `item`, `onPress`, `onLongPress`, `processing?` | 106×128, cutout on `card`, name caption; processing = shimmer + "tagging…"; laundry = wash icon corner |
| `ItemGridSection` | `title`, `count`, `items`, 3 columns | hidden when empty; "Everything's in the wash" variant |
| `DetectionBox` | `box {x,y,w,h}`, `index`, `selected`, `kind`, `onToggle`, `onAdjust?` | tape solid (selected) / grey dashed (unselected or not_clothing with label); handles on long-press |
| `TagRow` | `tags`, `confidence`, `onEdit(field)` | renders Chips; `< 0.7` → uncertain |
| `OutfitComposition` | `slots: {top?, bottom?, one_piece?, footwear?, layer?, accessories?}` (each an Item or null), `size: 'mini'|'card'|'detail'|'builder'|'share'`, `emptySlots?: boolean` | **D12 geometry** (`packages/shared/src/composition.ts`): canvas W×H; top at (0.08W, 0.06H) 0.56W wide rotated −4°; bottom at (0.34W, 0.30H) 0.52W wide rotated +3°, z under top's hem by 0.06H; footwear at (0.62W, 0.72H) 0.30W; layer behind top offset (−0.04W, +0.02H); accessories 0.14W in the top-right column; one_piece replaces top+bottom at (0.20W, 0.06H) 0.58W; ground ellipse shadow at 0.86H, 0.7W, 12% ink. Sizes: mini 150×140, card 354×330, detail 354×400, builder 354×360, share 1080×1200 |
| `OutfitCard` | `card: OutfitCard`, `onSave`, `onSkip`, `onWear`, `onShuffle`, `onShare`, `onOpen` | composition + badges + reason + action rail; double-tap = save with heart burst; saved state olive heart |
| `LookCard` | `look`, `onSave`, `onWear`, `onShuffle` | S11; composition 354×250 |
| `StatBar` | `value`, `max`, `label?` | 4 px, denim on `line`; used for owned/worn and item progress |
| `HiddenOutfitsBanner` | `owned`, `worn`, `itemsCount`, `onPress` | `<8 items` → progress copy variant |
| `QuotaPill` | `used`, `limit`, `exhausted?` | mono "12 of 30 left"; exhausted → alert colours |
| `OccasionChipGroup` | `group`, `occasions`, `selectedId`, `onSelect` | micro label + wrap of Chips |
| `NoteField` | `value`, `max=300`, `error?` | counter mono; error line under (off-topic) |
| `BottomSheet` | `open`, `onClose`, `title?`, children | 1 px line top border, no shadow, drag handle |
| `TabBar` | `active` | 5 tabs, icons + 11 px labels, 72 tall incl. safe area |
| `EmptyState` | `title`, `body?`, `actions: Button[]`, `illustration?: GarmentSilhouette` | centred, max 30ch |
| `Toast` | `text`, `action?: {label, onPress}` | bottom, 3 s, "Worn today · undo" |
| `ProgressDots` | `count`, `active` | onboarding |
| `StepBar` | `count`, `done` | S05 |
| `FeedbackSheet` | `onReason(reason)` | S08 ten-skips: too formal · wrong weather · don't like the colour · seen it |
| `DetectionAdvisory` | `kind` | warning icon + one-line copy from a table in `features/add/copy.ts` |

## Parity with the canvas
Each artboard on the canvas maps to a screen built from these; when a component's look changes,
change the artboard in the same PR (canvas edits are described in `docs/02-ux/screens.md` header).
