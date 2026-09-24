# F12 — Offline and sync (cross-cutting)
**Depends on:** F02. Applies to every feature.
## App
- Read cache: TanStack Query persisted to MMKV (closet, saved, last feed page, hidden-outfits).
- Write outbox: `expo-sqlite` table `outbox(id, kind, payload, created_at, attempts)`; every
  mutation writes here first, applies optimistically, then a flusher (on app foreground + on
  `NetInfo` reconnect) posts in order to `/track` or direct Supabase writes.
- Pending photos: `pending_photos` table + files in `documentDirectory/pending/`.
- Conflict: last write wins per field (server `updated_at`); wear events additive (unique constraint
  makes duplicates harmless).
- UI: "Offline — we'll sync your saves" strip on S08; "N photos waiting" strip on S06.
## Backend
Nothing special: idempotent endpoints; `/track` tolerates duplicates by `(outfit_id, action,
occurred_at)` dedupe within 5 s.
## Tests
Airplane-mode e2e: save 3 cards offline, reconnect, all three in Saved; take 2 photos offline,
reconnect, both detected and queued in order.
