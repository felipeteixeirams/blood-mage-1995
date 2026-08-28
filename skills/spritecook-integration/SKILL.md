---
name: spritecook-integration
description: Integrates SpriteCook.ai REST API for programmatic generation of pixel art sprites, tilesets, and game assets directly within the agent workflow.
---

# SpriteCook.ai Integration Skill

## Overview
This skill defines the workflow for generating pixel art game assets via the SpriteCook.ai REST API, downloading binary assets safely, integrating them into the project codebase, and pushing updates to the remote GitHub repository.

## Workflow Phases (Spec-Driven + Agent-Driven)

1. **Specification & Prompt Design**:
   - Align with the user on what sprite needs to be generated (e.g., enemy, item, player variant, spell effect, tileset).
   - Craft a precise dark-fantasy 16-bit / 32-bit pixel art prompt optimized for SpriteCook.ai.
   - Define target dimensions (e.g., 32x32, 48x48, 64x64) and output path (e.g., `public/assets/sprites/enemies/...`).

2. **API Request & Binary Download (Anti-Corruption Rule #6)**:
   - Run the helper script `scripts/fetch-spritecook-sprite.cjs` via `run_command`.
   - **CRITICAL**: Never use text-based tools (`edit_file`, `cat`, `echo`) on binary files (`.png`). The script must use native Node.js binary streams (`Buffer` / `fs.writeFileSync`) to write the `.png` file.
   - Verify asset integrity using `file <path>`.

3. **Codebase Integration**:
   - Register the asset in `src/game/assets/assetManifest.ts` if new.
   - Verify that the fallback procedural texture generator in `src/utils/textureGenerator.ts` supports graceful degradation.

4. **Testing & Verification**:
   - Run `pnpm test` and `pnpm run verify` (typecheck & build check).

5. **Git Commit & Push**:
   - Configure git credentials.
   - Commit changes with a descriptive message.
   - Push to `https://github.com/felipeteixeirams/blood-mage-1995.git` using `GITHUB_TOKEN_PERSONAL`.
