# ADR-0001 Supabase over Firebase
Postgres gives RLS, real SQL for the engine's aggregate queries, `pg_cron`, `vector` for D08, and
an append-only events table with real indexes. Firebase would push the engine into client code or
Cloud Functions with no relational joins. Region `ap-south-1` exists. Decided 2026-09-24.
