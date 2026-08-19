---
name: Phaser game migration
description: Key decisions and gotchas from porting the Bloodmage 1995 Phaser game to the Replit pnpm workspace
---

## What was ported

Bloodmage 1995 — an isometric RPG dungeon crawler using Phaser 4, React 19, Zustand 5, and Motion. Fully client-side; no backend or database used.

## Key decisions

**Why:** The copy script could not add `phaser`, `zustand`, and `motion` to the artifact's package.json automatically (they installed at workspace root). Manual `pnpm add -D phaser zustand motion` inside `artifacts/bloodmage/` was required.

**How to apply:** When porting any app with non-catalog dependencies, always verify `artifacts/<slug>/package.json` actually lists the deps after running the copy script. If they are missing, `cd artifacts/<slug> && pnpm add -D <dep>` to install them properly.

## Removed / changed

- `vite-plugin-pwa` dropped (not supported in workspace); `virtual:pwa-register` import removed from `main.tsx`; `/// <reference types="vite-plugin-pwa/client" />` removed from `vite-env.d.ts`
- Game state remains in localStorage (no DB needed)
- PWA manifest and service worker registration removed; icon-512.png retained in public/

## Packages not in workspace catalog (must stay in artifact devDeps)

- `phaser` ^4.2.1
- `zustand` ^5.0.14
- `motion` ^12.43.0
