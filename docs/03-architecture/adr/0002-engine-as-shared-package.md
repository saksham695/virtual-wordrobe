# ADR-0002 One engine package for app and functions
The manual builder's live score and the feed's score must be the same number. A single
`packages/engine` built to ESM (Deno) and CJS (RN) with one test suite guarantees it. Cost: a build
step and no Node-only APIs in the engine. Decided 2026-09-24 (D13).
