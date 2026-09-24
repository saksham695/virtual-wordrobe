# F09 — Share card
**Depends on:** F05. 
## Backend
`/share-card`: satori (JSX → SVG) + resvg-wasm in Deno; template `supabase/functions/_shared/share-template.tsx`
renders `OutfitComposition` layout (same geometry constants as the app, exported from
`packages/shared/src/composition.ts`) + "34 outfits from 74 clothes" + wordmark; 1080×1920 PNG to
`shares/{uid}/{outfit_id}.png`; signed URL 24 h. > 2 s → job + client polls.
## App
Share sheet on S09: preview `expo-image` + `expo-sharing`. `share_created {source}`.
## Tests
snapshot of the rendered PNG for a fixture outfit (pixel diff < 1%).
