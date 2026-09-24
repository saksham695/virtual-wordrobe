---
name: state-patterns
description: Choose and implement state in apps/mobile — which kind of state goes where (TanStack Query, Zustand, local, SQLite outbox), selectors, and the offline-first write path. Use before adding any store, query or context.
---

# State

## The decision table — use it before writing a store
| Kind of state | Where it goes | Example here |
|---|---|---|
| Server data | **TanStack Query v5** | items, feed page, saved outfits, hidden-outfits count |
| Local UI state | `useState` in the component | detection box selection on S04, sheet open |
| Derived state | compute inline, `useMemo` only if measured | outfit score from slots, filtered closet list |
| Global UI state | **Zustand** | active feed filter, builder draft, offline banner |
| Form state | `useState` (our forms are 1–3 fields) | city, note, OTP |
| Navigation state | expo-router params | `item/[id]`, `style/results?occasion=` |
| Pending writes | **SQLite outbox** | saves, skips, wears, pending photos |
| Session | supabase-js client | JWT, refresh |

Context is for provider-level concerns only (theme, session). Never for data — it re-renders every consumer.

## TanStack Query rules for this app
- Keys are arrays, always user-scoped: `['items', uid]`, `['feed', uid, date, filter, page]`, `['whatgoeswith', itemId]`, `['hidden', uid]`.
- Every mutation lists its `invalidateQueries` in the feature file before you write it. Item writes invalidate `['items']` **and** `['hidden']` — the headline number is derived from the closet.
- Optimistic updates for save / skip / laundry / wear: `onMutate` snapshot → patch cache → `onError` rollback → `onSettled` invalidate.
- `staleTime`: closet 60 s, feed page 5 min (seeded by date anyway), hidden-outfits 5 min, taxonomy `Infinity`.
- Persist to MMKV so cold start renders the closet and last feed page offline.

## Zustand rules
- One store per concern, not one god store: `useUiStore`, `useBuilderStore`, `useOfflineStore`.
- **Select only what you need** — `useUiStore(s => s.filter)`, never `useUiStore()`. Whole-store selection re-renders on every unrelated change; this is the single most common performance bug in an app like this.
- Object selections use `useShallow`.
- Actions live in the store, not in components. Async work belongs in Query mutations, not in Zustand.
- Persist only what should survive a kill: builder draft, last filter. Never server data.

## The write path is offline-first (F12)
Every mutation: write to the SQLite outbox → apply optimistically → flush on foreground and on reconnect, in order → reconcile. A mutation that talks to the network directly is a bug; it loses the user's save when the lift has no signal.

## Done means
No component subscribes to a whole store · every mutation has its invalidations and a rollback · the screen renders from cache with the network off · no `useMemo`/`useCallback` added without a measured reason.
