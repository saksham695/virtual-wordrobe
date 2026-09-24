# Test plan — QA matrix

Every row needs an automated test (unit / integration / e2e) or a manual script in `e2e/manual/`.
Source: PRD §14 edge-case index + feature files. `T` = task that owns it.

| Area | Case | Expected | Kind | T |
|---|---|---|---|---|
| Add | zero items detected | zero state; retake / add as one | e2e fixture | T24 |
| Add | >20 boxes | capped at 20 + advisory | unit | T24 |
| Add | overlap (dupatta on kurta) | advisory; split creates two items re-tagged | integration | T24 |
| Add | dark photo | soft-crop, `ragged`, badge; add not blocked | integration | T25 |
| Add | face in photo | only crops surfaced; original never returned by any API | integration | T22 |
| Add | vision API down | item `unsorted`, retry badge, 3 retries, no photo lost | integration | T22 |
| Add | app killed mid-queue | queue resumes; "N waiting" | e2e offline.yaml | T23 |
| Add | duplicate item | keep both / replace / discard | unit + e2e | T26 |
| Add | cap 100 | sheet, no silent failure | unit | T22 |
| Add | >12 MP | client downsizes to 1200 | unit | T23 |
| Closet | everything in wash | copy state + mark all clean | component | T30 |
| Closet | delete item in saved outfit | incomplete + replace | DB trigger test | T31 |
| Closet | NULL optional fields | filters never exclude | property | T30 |
| Feed | <8 items | progress state | component | T42 |
| Feed | exhausted | seen-before repeats, never blank | engine | T12 |
| Feed | offline | cached page; actions sync in order | e2e | T43 |
| Feed | 10 skips | feedback sheet; boosts change next page | e2e | T42 |
| Feed | no AI calls | network log has no model host | e2e | T42 |
| Style | zero candidates | no call; gap message | unit | T50 |
| Style | hallucinated item | rejected; rules fallback; quota refunded | unit | T50 |
| Style | off-topic / injection | blocked pre-call | unit fixtures | T50 |
| Style | quota concurrency | exactly 30 succeed of 40 parallel | integration | T50 |
| Style | cache | same day, no call, no quota | integration | T50 |
| Build | one-piece | top/bottom disabled | unit | T60 |
| Build | low score | allowed, saved, info only | e2e | T60 |
| Wear | twice same day | once; undo | DB | T61 |
| Buy | URL unparseable | screenshot fallback | unit fixtures | T80 |
| Buy | <15 items | no verdict | unit | T80 |
| Buy | non-clothing | polite stop, no AI | unit | T80 |
| Account | delete | rows + storage purged | e2e | T63 |
| Security | cross-user read | RLS denies every table + storage | integration | T03 |
| Security | rate limit | 200 rapid → rejected cleanly | script | T71 |
| Perf | closet 200 items | 60 fps | manual profile | T30 |
| Perf | feed p0 | < 1.5 s | integration timer | T40 |
| Perf | detect | < 8 s on 4G | manual | T24 |
| Perf | cold start | < 3 s | manual | T20 |
| Goal | 30 items / 4 photos | < 10 min | timed e2e | T27 |
| Goal | bench | above FLOOR | `pnpm check` | T15 |
