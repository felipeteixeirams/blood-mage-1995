# Bloodmage 1995

A browser-based isometric 16-bit action RPG dungeon crawler. Players battle waves of monsters, collect loot, cast spells, level up, and progress through procedurally-generated dungeons in a dark gothic fantasy world. Built with Phaser 4 + React + Zustand.

## Run & Operate

- Workflows manage dev servers — use the Replit UI or `WorkflowsRestart` tool
- `pnpm verify` — full typecheck + build de todos os artifacts (mesmo pipeline do Vercel)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite 7, Tailwind CSS v4, Zustand 5, Motion
- Game engine: Phaser 4 (arcade physics, procedural dungeon generation)
- UI: shadcn/ui components, Radix UI primitives
- API: Express 5 (scaffold, not heavily used — game state is client-side)
- DB: PostgreSQL + Drizzle ORM (scaffold, high scores stored in localStorage)
- Fonts: Press Start 2P, Cinzel, UnifrakturMaguntia, VT323 (Google Fonts)

## Where things live

- `artifacts/bloodmage/src/game/` — Phaser scenes, game objects, systems
- `artifacts/bloodmage/src/components/` — React UI overlays (HUD, modals, menus)
- `artifacts/bloodmage/src/store/gameStore.ts` — Zustand global state
- `artifacts/bloodmage/src/utils/` — sound engine, telemetry, localStorage helpers
- `artifacts/bloodmage/src/data/` — JSON data files (monsters, spells, talents, waves)
- `artifacts/bloodmage/index.html` — entry point with Google Fonts preloads

## Architecture decisions

- Game runs entirely client-side; high scores and settings persist via localStorage
- Phaser canvas is mounted as a React component (`PhaserGame.tsx`) with a `gameSceneRef` for cross-boundary calls
- PWA/service-worker removed (not supported in Replit workspace); `vite-plugin-pwa` dropped
- All game deps (`phaser`, `zustand`, `motion`) are in `devDependencies` per workspace convention for static artifacts

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Do not run `pnpm dev` at the workspace root — artifacts need env vars (`PORT`, `BASE_PATH`) injected by the managed workflow
- `phaser`, `zustand`, `motion` must remain in `artifacts/bloodmage/package.json` devDependencies — they are not in the workspace catalog
- The `virtual:pwa-register` import was removed from `main.tsx`; do not re-add it without also adding `vite-plugin-pwa`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
