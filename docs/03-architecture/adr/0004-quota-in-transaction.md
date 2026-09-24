# ADR-0004 Quota decrement is a conditional UPDATE … RETURNING
`update usage set ai_calls = ai_calls + 1 where … and ai_calls < limit returning ai_calls` is
atomic under concurrency without advisory locks. Refund on AI failure is a compensating `−1` in
the same function's catch block. Decided 2026-09-24.
