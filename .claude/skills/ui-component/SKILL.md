---
name: ui-component
description: Build or change a component in apps/mobile/src/ui — specify the API first, then implement it with variants, every state, and the accessibility contract. Use for any component work, even a one-off.
---

# Build a UI component

Treat every component request as a system question. One button request is a question about every button.

## 1. Place it in the system before writing anything
1. **Does it already exist?** Name the component it should extend. A variant beats a new component; five buttons is a system, twenty-three is a museum.
2. **What class is it?** input · display · navigation · feedback · container · overlay. The class sets the conventions and the a11y requirements.
3. **What rung?** token → primitive → composed → pattern → template. Solve at the lowest rung that works, because fixes there propagate.
4. **What else changes?** List components sharing its tokens or behaviour.

If it is genuinely new, it needs a row in `docs/02-ux/component-library.md` and a reason it cannot be a variant. Write that reason in your reply.

## 2. Specify the API, then build
Copy the shape used in `component-library.md`: purpose · anti-purpose · props (closed value sets) · slots · **states matrix** · content rules · responsive behaviour · a11y contract · composition rules.

Rules that are non-negotiable here:
- **No open style props.** `style` is allowed for outer layout only (margin, flex, width). Never colour, type or padding — an open prop is future inconsistency.
- **Semantic tokens only** from `knowledge/design/tokens.json`. No raw hex or px in a component.
- **Every state or it isn't done:** default, pressed, focus-visible, disabled (+ `disabledReason`), loading, error, selected, read-only, empty. Missing states are the most common defect.
- **Content extremes:** longest realistic string (28-char item names, "Wedding: sangeet / reception"), zero items, thousands, missing image, 130% text size. Wrap, don't truncate, on anything the user must read.

## 3. React Native implementation patterns
- `forwardRef` on every interactive primitive; `React.memo` on list rows (`ItemTile`, `OutfitCard`).
- Variants as a lookup object keyed by the variant prop, resolved to `StyleSheet` entries — never conditional inline objects rebuilt per render.
- Compound components where content is the consumer's (`Sheet.Header` / `Sheet.Body` / `Sheet.Footer`), which is how `BottomSheet` is built.
- Loading: `Skeleton` for known layouts (closet tiles, feed cards), `Spinner` only for unknown duration.
- **No web idioms:** no portals (RN modals), no `className`, no `cn()`/tailwind-merge, no HTML elements. `Pressable` with `hitSlop` to reach 44 pt, not padding that moves the visual.
- Touchables get `accessibilityRole`, `accessibilityLabel`, `accessibilityState`, and `accessibilityHint` only when the action is not obvious from the label.

## 4. Done means
Row in `component-library.md` · every state drawn on the canvas Design-system page · a fixture in `ui/__fixtures__/` · RNTL test asserting the states matrix and the accessible name · used by at least one screen. Then run `review-feature`.
