# F02 — Add items: capture → detect → review → queue (S03, S04, S05)  ★
**Owns:** the ten-minute promise. **Depends on:** F01. **Blocks:** F03–F12 (they need items).
**Pre-gate (D06):** T02 in build-plan — 20 real photos through the chosen detector before S04 is built.

## Backend
- Storage upload from client to `closet/{uid}/photos/{photo_id}.webp` (signed upload URL from
  `supabase.storage.createSignedUploadUrl`).
- `detect-items` (api.md): vision call with a detection prompt returning boxes (06-ai/tagging.md §detect).
  Cap 20; `not_clothing` unselected; advisories.
- `enqueue-items`: crops each box server-side (sharp in Deno via `imagescript`) to
  `closet/{uid}/{item_id}/orig.webp`, inserts `items(processing='queued')`, inserts `jobs`.
- `process_item` job (jobs.md): cutout fallback → tag → pairings.
- Quotas: 30 uploads/day (`usage.uploads_today`), 100 active items.
## Engine
`pairScore` runs inside the job for the new item against all active items.
## App
- `features/add/CaptureScreen` (S03): `expo-camera`; resize with `expo-image-manipulator`
  (longest edge 1200, WebP q80); on-device cutout attempt happens **after** detection, per crop:
  `native/segmentation.ts` → `cut.webp` uploaded alongside; if it fails, `cutout_path` stays null
  and the job does the fallback.
- `features/add/DetectScreen` (S04): boxes as absolute-positioned `DetectionBox` over the image;
  gestures with `react-native-gesture-handler` (tap toggle, long-press → handles, drag corners);
  merge = union rect; split = divide along longer axis. Local state only until "Add N".
- `features/add/ReviewScreen` (S05): queue of items with any `tag_confidence[field] < 0.7`;
  polls `items` via realtime subscription (`supabase.channel('items:'+uid)`) so tags arrive as jobs finish.
- Offline: photo saved to `FileSystem.documentDirectory/pending/`, row in SQLite `pending_photos`;
  S06 shows "N photos waiting"; on reconnect, upload + detect in order.
## Edge cases → behaviour (all in PRD §5; the non-obvious ones)
zero detected → S04 zero state · >20 → cap + advisory · overlap → advisory + Split · dark → soft-crop
+ `cutout_quality='ragged'` badge "improve photo later" · face in photo → only crops stored for
display; original kept private (never surfaced) · vision down → item saved `unsorted`, job retries
×3, retry badge · duplicate after tagging → `nearDuplicates` on the new item vs closet → S05
prompt Keep both / Replace / Discard · cap reached → sheet, no silent failure · >12 MP → client
downsizes · storage denied → camera path only, explained once.
## Tests
unit: box merge/split geometry; resize keeps aspect; queue ordering. integration: enqueue creates
N items + N jobs; job idempotent on re-run. e2e: 30 items from 4 photos < 10 min (timed Maestro flow
on a real device with the fixture photos in `apps/mobile/e2e/fixtures/`).
## Analytics
`upload_started`, `upload_abandoned`, `detection_corrected`, `item_added`.
