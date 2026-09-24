# F06 — Occasion stylist (S10, S11)
**Depends on:** F04. **Blocks:** nothing.
## Backend
`/style` per api.md order of operations. `_shared/topic.ts` allow/deny lists (from
`knowledge/domain/styling-rules.md §topic`). Cache key `(user, occasion_id, closet_version, date)`.
Quota in transaction: `update usage set ai_calls = ai_calls+1 where user_id=$1 and month=$2 and
ai_calls < 30 + bonus_calls returning ai_calls` — no row returned → exhausted.
## Engine
`occasionCandidates`, `rulesRankLooks`; `OccasionConfig` from `knowledge/domain/occasions.json`
(19 rows shipped; adding one is a data change).
## AI
`06-ai/stylist.md`: prompt, JSON schema, validation (every look must match a candidate fingerprint),
timeouts, fallback. Reasons ≤ 90 chars; tip ≤ 120 chars.
## App
`features/style/StyleMeScreen` (S10): chips grouped from config, ordered by profile occasions then
usage counts (local); `NoteField` with counter; `QuotaPill` from `meta.quota`.
`features/style/ResultsScreen` (S11): 3 `LookCard`s; `ranked_by='rules'` shows "Ranked by rules today".
## Edge cases → behaviour
exhausted → beta bonus 10 once, `quota_hit` · <3 candidates → return what exists + gap sentence ·
0 → no call · off-topic → inline reject, no call · injection → note passed as delimited data ·
hallucinated item → rules fallback, quota refunded · timeout/5xx → same · "something else" → nearest
formality profile or one clarifying question.
## Tests
unit: topic checker (fixtures: 30 on-topic, 30 off-topic incl. injection strings); candidate count for
each of 19 occasions on the fixture closet (O1/O2 vectors); validator rejects a look with an unknown
item. integration: quota transaction under concurrency (10 parallel calls → exactly 30 succeed).
## Analytics
`style_me_used {occasion, candidates_count, fallback_used}`, `quota_hit`.
