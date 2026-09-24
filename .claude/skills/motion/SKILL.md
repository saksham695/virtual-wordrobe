---
name: motion
description: Animate anything in apps/mobile with Reanimated 3 + Moti — durations, easing, the state/gesture/exit/layout patterns, and the reduced-motion contract. Use for any transition, micro-interaction or gesture.
---

# Motion

**Framer Motion does not run in React Native.** We use **Reanimated 3** (UI-thread worklets) with **Moti**
on top, which gives the same declarative API — `from` / `animate` / `exit`, variants, `AnimatePresence`.
Gestures come from `react-native-gesture-handler`. The concepts below are the Framer Motion patterns
ported; the imports differ, the thinking does not.

## The contract (from `knowledge/design/tokens.json` → `motion`)
| Token | ms | Used for |
|---|---|---|
| `fast` | 120 | state change: press, chip select, heart fill |
| `base` | 200 | sheet, chip, tile pop-in, badge |
| `screen` | 320 | route transition, card advance |
Easing `cubic-bezier(0.2, 0.8, 0.2, 1)` (`Easing.bezier(0.2, 0.8, 0.2, 1)`). Nothing in the UI is
slower than 320 ms. Motion explains a relationship — where a thing came from, what it became — it
never decorates.

## Reduced motion is not optional
```tsx
const reduce = useReducedMotion();            // moti / react-native-reanimated
const t = reduce ? { type: 'timing', duration: 0 } : { type: 'timing', duration: 200 };
```
Wrap it once in `src/ui/motion/useTransition.ts` and use that everywhere. With reduced motion every
animation in this app becomes **opacity-only** — no translate, no scale, no rotation.

## Patterns we actually use
**1. State change (press, select).** Scale/colour on a shared value, `fast`.
```tsx
<MotiPressable animate={({ pressed }) => { 'worklet'; return { scale: pressed ? 0.97 : 1 } }} transition={t} />
```

**2. Enter (tile pop-in when tagging finishes).** `from={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}`, `base`, with `delay: index * 30` capped at 240 ms total. Stagger is the variant-propagation idea: orchestrate at the parent, not per child.

**3. Exit (card skipped, sheet closed).** `<AnimatePresence>` + `exit`, and **a stable `key`** — a missing key is why exit animations silently don't run.

**4. Layout (closet regrid, filter change).** Moti's `LayoutAnimation` / Reanimated `Layout.duration(200)`. Use sparingly: many simultaneously laid-out rows is the classic jank source. Prefer opacity on long lists.

**5. Gesture (feed).** `Gesture.Pan()` for swipe-to-skip, `Gesture.Tap().numberOfTaps(2)` for save, driven on the UI thread. Every gesture has a button equivalent — a gesture is never the only path to an action.

**6. Shared element (tile → item detail).** `sharedTransitionTag` on the cutout. One per transition; it tracks globally and is easy to overuse.

**7. Heart burst on save.** 1 → 1.25 → 1 over 240 ms with a spring (`damping: 12, stiffness: 300`). This is the only springy thing in the app; everything else is timing-based, because the product's stance is calm.

## Performance
- Animate **transform and opacity only** (`translateX/Y`, `scale`, `rotate`). Animating `width`, `height`, `top` or `left` triggers layout every frame.
- Everything runs in a worklet on the UI thread. If an animation depends on JS state, drive it with `useDerivedValue`, don't `setState` per frame.
- `FlashList` rows: no layout animations, no per-row `AnimatePresence`.
- Test on the mid-range Android device, not the simulator.

## Anti-patterns to reject
Decorative motion with no relationship to explain · anything over 320 ms in the UI · spring physics used everywhere "because it feels alive" · a gesture with no button equivalent · exit animation without `AnimatePresence` + key · animating a non-transform property · motion that survives `useReducedMotion`.
