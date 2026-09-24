# Motion spec

Library: **Reanimated 3 + Moti** (`react-native-reanimated`, `moti`), gestures via
`react-native-gesture-handler`. Framer Motion is web-only and is not used; the patterns below are
its concepts ported. Implementation rules live in `.claude/skills/motion`.

| Where | What moves | Token | Notes |
|---|---|---|---|
| Any pressable | scale 1 → 0.97 | fast 120 | Moti pressable worklet |
| Chip select | bg + text colour | fast 120 | no movement |
| Closet tile pop-in | opacity 0→1, scale 0.96→1 | base 200 | `delay = index × 30`, total ≤ 240 ms |
| Feed save | heart 1 → 1.25 → 1 | 240 spring (12/300) | the only spring in the app |
| Feed skip | card translateY out + next up | screen 320 | gesture-driven, button equivalent exists |
| Bottom sheet | translateY + backdrop fade | base 200 | keyboard lifts content, footer stays visible |
| Screen push | translateX | screen 320 | expo-router default, retimed |
| Tile → item detail | cutout shared element | screen 320 | `sharedTransitionTag`, one per transition |
| Detection box toggle | border colour + label opacity | fast 120 | no scale — boxes must not appear to move |
| Skeleton | opacity 0.6 ↔ 1 loop | 900 linear | replaced by pop-in on completion |
| Toast | slide up 12 px + fade | base 200 | auto-dismiss 3 s / 6 s with action |

**Reduced motion:** every row above becomes opacity-only, duration 0 for movement. One hook,
`src/ui/motion/useTransition.ts`, is the only place durations are read.

**Performance:** transform and opacity only; worklets on the UI thread; no layout animation inside
`FlashList`; verified on the mid-range Android device, not the simulator.
