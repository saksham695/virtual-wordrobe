---
name: design-review
description: Critique a screen, flow or component against the system — three expert lenses, findings ranked by severity, ending in concrete actions. Use before marking any UI task done, and when a screen "feels off".
---

# Design review

Review from three lenses in order, then merge into one ranked list. Do not praise; name what is wrong
and why it matters. Each finding gets a one-line reason — "16px because it's the grouping distance
used in the card list, so the eye reads them as one family" teaches; "use 16px" does not.

## Lens 1 — UX / research
The job of this screen in one sentence; is the primary action the most prominent thing? Reach: is it
reachable one-handed, standing at a cupboard? Are the three empties (first-use, cleared, no-results)
distinct? Does any copy blame the user? Is there a dead end with no next step?

## Lens 2 — Craft / visual
Hierarchy through type and spacing before borders or colour. Is the accent used once, or scattered?
Optical alignment, consistent radii, the ground shadow only under an outfit. Does it look like this
product or like a default template (gradients, even-weight cards in a grid, shadows on everything,
icons repeating their labels)?

## Lens 3 — Frontend / system
Does it use existing components and semantic tokens, or fork them? Any raw hex/px? Any open style
prop? Are all states implemented or only the happy path? Re-render cost on a 200-item list?
Does it read from cache offline? Are gestures duplicated as buttons?

## Accessibility floor — check explicitly, every time
WCAG 2.2 AA: 4.5:1 body / 3:1 large and UI boundaries · visible focus · 44 pt targets · full keyboard
and switch operation · no meaning by colour alone · reduced motion honoured · 130% text without loss
of function · icon-only controls have names · nothing required conveyed only in a tooltip.

## Output
```
## What's working
## Issues, by severity
  Blocking — broken accessibility, undesigned states, data loss risk
  Serious — inconsistency with the system, unclear hierarchy, poor targets
  Polish — spacing, alignment, wording
## Systemic observations
  (what this reveals about the system, not just this screen)
## What I'd do next
  (3–5 concrete actions, ordered)
```
End with the verdict: `ship` / `fix first (list)` / `re-think (why)`.

## Judgement calls to hold
Consistency beats local optimisation — break it only with a stated reason. Fewer components, more
variants. Name things for what they do (`danger`, not `red`). Push back once, plainly, on a request
that creates debt, then help with whatever they chose. Mobile is not a smaller desktop: reach,
thumb zones, insets, keyboard occlusion and interruption are different problems.
