# External references — what we took, and what we deliberately didn't

Each entry says what actually transferred to this codebase. Where something didn't transfer, the
reason is recorded so nobody re-litigates it in three months.

| Source | Verdict | What we took |
|---|---|---|
| **UX systems designer** (skill, supplied) | **Adopted wholesale** | The working method: context before pixels · component API before appearance · states matrix as the unit of completeness · two-tier tokens · boring states designed first · a11y as a requirement not a pass · adoption is design work. Became `docs/02-ux/component-library.md`, `knowledge/design/tokens.json` and `.claude/skills/ui-component`. |
| **craft-coder `frontend-react/references/state.md`** | **Adopted, already our stack** | The decision table (useState / useMemo / TanStack Query / Zustand / RHF / URL), selector discipline ("select only what you need"), Zustand slices, Context only for providers. Became `.claude/skills/state-patterns`. Its `useSearchParams` row maps to expo-router params here. |
| **craft-coder `frontend-react/references/components.md`** | **Partly adopted** | Kept: variant/size props, `forwardRef`, compound components (our `BottomSheet`), Spinner-vs-Skeleton split, consistent focus ring. **Dropped:** Tailwind, `cn()`/clsx/tailwind-merge, React portals, HTML input wrappers — all web-only. We're React Native with `StyleSheet` and semantic tokens. |
| **`motion-framer` skill** | **Ported, not adopted** | Framer Motion does not run in React Native. The *concepts* transferred to Reanimated 3 + Moti: variants, `AnimatePresence` + stable keys for exit, layout animation used sparingly, gesture props, transform/opacity only, `useReducedMotion`, spring presets. Became `.claude/skills/motion` and `docs/05-frontend/motion.md`. Framer-specific API (`whileHover`, `layoutId`, `useAnimate`) has RN equivalents noted there; `whileHover` is dropped — there is no hover on a phone. |
| **"Design with Claude Code" gist** (NicholasSpisak) | **One idea taken** | Its stack (Next.js App Router, Server Components, shadcn/ui, Tailwind) is web and does not apply. The transferable part is the three-lens review — UX / craft / frontend — which became `.claude/skills/design-review`, with severity buckets and an explicit a11y floor added. |
| **github.com/topics/ui-ux-design** | **Nothing taken** | A topic listing, not a specification. Two agent-skill repos on it package Material Design 3 and a 107-style pack; we have our own stated stance (calm, countable, garment-tag) and a rule against adopting another brand's design system. Importing either would fork the system on day one. |
| **hendurhance/ui-ux** | **Reference only** | A CC0 three-tier UI/UX learning curriculum (beginner → expert) with tool and pattern links. Good background reading; nothing to import — it teaches the discipline, it doesn't specify this product. Linked here so it isn't re-evaluated. |
| **`bodies-like-yours` research** (own, D09) | **One section** | `B-couture.md` §3 (proportion and drape) informs the reserved `fit_balance` rule. The rest is single-garment fit realism, not multi-item compatibility. |

## The rule this table encodes
Take methods, not systems. A method (specify the API, design the states, token everything) makes
our system stronger. Another team's *system* — their palette, their components, their idioms —
forks ours the day it lands and nobody can say which one is authoritative.
