# Mobile app — structure, navigation, state, offline, images

Expo SDK 52+ (managed + dev client for the native segmentation module), TypeScript strict,
`expo-router` v4, TanStack Query v5 (+ persist to MMKV), Zustand (UI-only state), `expo-sqlite`
(outbox), `expo-image`, `expo-camera`, `expo-image-manipulator`, `react-native-gesture-handler`,
`react-native-reanimated`, `@shopify/flash-list`, `zod` (from `packages/shared`). No Redux, no
styled-components: a tiny `ui/` layer over `StyleSheet` reading `theme/tokens.ts`.

## Folder layout
```
apps/mobile/
  app/                         expo-router routes only (thin; they render features)
    _layout.tsx                providers: QueryClient, Supabase session, theme, gesture root
    (auth)/sign-in.tsx
    (onboarding)/type.tsx      S01
    (onboarding)/city.tsx      S02
    (tabs)/_layout.tsx         TabBar
    (tabs)/feed.tsx            S08
    (tabs)/closet.tsx          S06
    (tabs)/style.tsx           S10
    (tabs)/saved.tsx           S13
    (tabs)/profile.tsx         S14
    add/capture.tsx            S03  (modal stack)
    add/detect.tsx             S04
    add/review.tsx             S05
    item/[id].tsx              S07
    outfit/[id].tsx            S09
    style/results.tsx          S11
    builder.tsx                S12
    buy-check/index.tsx        S15
  src/
    api/                       typed client per function (zod-validated), + supabase.ts
    features/<feature>/        screen components + hooks + local state (one folder per F0X)
    engine/                    thin adapters: local pairings cache → engine calls
    native/segmentation.ts     expo-module wrapper (iOS subject lift / Android ML Kit)
    offline/outbox.ts, pending.ts, flusher.ts
    ui/                        components.md primitives + icons/
    theme/tokens.ts, typography.ts
    legal/consent.md, privacy.md
    analytics/track.ts         batches events → /track
  e2e/ (Maestro flows + fixtures/)
```

## Navigation rules
- Tabs persist state. `add/*` is a modal stack over tabs; closing returns to Closet.
- Deep links: `wardrobe://item/:id`, `wardrobe://outfit/:id`, `wardrobe://style/:occasion`.
- Back from S04 → S03 (retake). Back from S05 → S04 only for the first item; later items → S06.
- Onboarding gate in `_layout`: `profiles.onboarding_step < 3` → `(onboarding)`.

## State
| kind | where | example |
|---|---|---|
| server data | TanStack Query, keys `['items', uid]`, `['feed', uid, date, filter, page]`, `['hidden', uid]`, `['outfits', uid, 'saved']`, `['whatgoeswith', itemId]` | invalidations listed per feature file |
| UI state | Zustand `useUi()` | active filter chips, builder draft (persisted MMKV), sheet open |
| detection working state | component state in S04 | boxes, selection — never global |
| outbox | SQLite | F12 |
| session | Supabase client + `useSession()` | JWT refresh handled by supabase-js |

## Data access
All server calls go through `src/api/*.ts`, each `async (input: z.infer<Req>) => z.parse(Res)`;
schemas from `packages/shared`. Direct table access uses `supabase.from()` wrapped in the same
files so components never import supabase-js.

## Image pipeline (client)
1. capture / pick → `ImageManipulator.manipulateAsync(uri, [{resize:{width:1200}}], {compress:.8, format:'webp'})`
2. signed upload URL → `fetch(PUT)`; on failure → pending queue
3. `/detect-items` → S04
4. on "Add N": for each box, crop client-side too (for the on-device cutout attempt) →
   `segmentation.cutout(cropUri)` → success: upload `cut.webp` to `closet/{uid}/{item_id}/cut.webp`
   and pass `cutout_path` in `/enqueue-items` (extend request with optional `cutout_path` per box)
5. subscribe realtime; tiles pop in.
Thumbnails: `expo-image` with `contentFit="contain"`, `cachePolicy="memory-disk"`, signed URL
refreshed by the query layer before expiry.

## Performance budget
Closet 200 items 60 fps (`FlashList`, `estimatedItemSize=128`, thumbnails ≤ 40 KB) · cold start
< 3 s (fonts bundled, no blocking network in `_layout`) · feed page render < 1.5 s (prefetch +
persisted cache) · no image > 1200 px ever leaves the device.

## Accessibility
Every touchable ≥ 44 pt; `accessibilityLabel` on icon-only buttons; `accessibilityRole`; dynamic
type up to 130% without clipping (test S04, S08); colour never the only signal (badges have text).

## Testing
- Unit: vitest for `src/engine`, `offline`, reducers.
- Component: RN Testing Library for `OutfitComposition`, `DetectionBox`, `Chip`.
- e2e: Maestro flows `onboarding.yaml`, `add-30-items.yaml` (timed), `feed-save-skip.yaml`,
  `style-me.yaml`, `offline.yaml`. Run on one mid-range Android + one iPhone before beta.
