# Pixel Lab: global configuration

**Mestre:** [operations](README.md)
**Status:** não verificado (depende de ferramenta externa: a interface do Pixel Lab não foi conferida)
**Verificado em:** —

Reference for the settings used when generating Bloodmage 1995 art in Pixel Lab (external tool). The prompts per subject live in [pixel-lab-player-prompts.md](pixel-lab-player-prompts.md), [pixel-lab-bestiary-prompts.md](pixel-lab-bestiary-prompts.md), [pixel-lab-npc-and-prop-prompts.md](pixel-lab-npc-and-prop-prompts.md) and [pixel-lab-tile-prompts.md](pixel-lab-tile-prompts.md). Scripts that import the output: [asset-scripts.md](asset-scripts.md). Each prompt fills these fields: **Character Type**, **Generation Mode**, **Camera View**, **Character Size**, **Detail**, **Outline**, **Character Description**.

The sizes below are what the prompts ask for; the cell size in `src/game/assets/assetManifest.json` can differ (player cell 68x68, enemies 32x40, 36x28, 48x56, 64x72 and others). Check the manifest before assuming a size.

## Detail

| Value | Use |
|---|---|
| `Highly detailed` | Almost everything. Needed for the 16-bit look (Diablo 1 / Castlevania SOTN): cloth folds, bones, pustules, glowing gems, dithered shading |
| `Low detail` | Only for very small items (16px to 24px) that turn noisy |

## Outline

| Value | Effect | Use |
|---|---|---|
| `Selective outline` (sel-out) | Dark outline tinted to the material (dark red on cloak, dark brown on leather, dark grey on bone); studio-grade finish | Maximum artistic polish; NPCs, props |
| `Default Black outline` | Classic 100% black arcade outline | Maximum combat legibility: no enemy or projectile gets lost on the dark stone floor |
| `Lineless` | Avoid for characters and enemies: loses definition on the dark floor | Do not use |
| `No outline` | Floor tiles and decals | Tiles only |

## Other parameters

- **Camera View:** always `Top-down (low)` (or `Oblique` if available), the classic 45 degree tilt. Flat floor tiles use `Top-down (flat)`.
- **Character Size:**
  - `48px`: mage, regular enemies and NPCs.
  - `64px`: bosses and giants (Necro Lord, Flesh Golem, Abomination).
  - `32px` / `24px`: bats and small props.
- **Generation Mode:**
  - `Pro` (8 rotations): player (`spr_bloodmage`), Hellhound and bosses.
  - `Standard`: idle NPCs, secondary enemies and dungeon props.
- **Character Type:** `Humanoid` for almost everything; `Quadruped` for the hellhound (and optionally the bat).

## Consistency (Style Image / Style Character)

After the first Bloodmage sprite (`spr_bloodmage`) is generated and approved, save the image. In later generations put it in the **Style Image** field, or pick the mage in **Style Character**. This makes Pixel Lab keep the same lighting, palette and pixel density across the game.

## Summary of options per element

| Element | Type | Mode | Camera | Size | Detail | Outline |
|---|---|---|---|---|---|---|
| Bloodmage (player) | `Humanoid` | `Pro` (8 rot.) | `Top-down (low)` | `48px` | `Highly detailed` | `Selective outline` |
| Bloodmage (hoodless) | `Humanoid` | `Pro` (8 rot.) | `Top-down (low)` | `48px` | `Highly detailed` | `Selective outline` |
| Skeleton Warrior | `Humanoid` | `Pro` / `Standard` | `Top-down (low)` | `48px` | `Highly detailed` | `Selective outline` |
| Cultist Acolyte | `Humanoid` | `Pro` / `Standard` | `Top-down (low)` | `48px` | `Highly detailed` | `Selective outline` |
| Hell Hound | `Quadruped` | `Pro` (8 rot.) | `Top-down (low)` | `48px` | `Highly detailed` | `Default Black outline` |
| Flesh Golem | `Humanoid` | `Pro` / `Standard` | `Top-down (low)` | `64px` | `Highly detailed` | `Selective outline` |
| Necro Lord (boss) | `Humanoid` | `Pro` (8 rot.) | `Top-down (low)` | `64px` | `Highly detailed` | `Default Black outline` |
| Blood Specter | `Humanoid` | `Standard` / `Pro` | `Top-down (low)` | `48px` | `Highly detailed` | `Selective outline` |
| Zombie Shambler | `Humanoid` | `Pro` / `Standard` | `Top-down (low)` | `48px` | `Highly detailed` | `Selective outline` |
| Vampire Stalker | `Humanoid` | `Pro` (8 rot.) | `Top-down (low)` | `48px` | `Highly detailed` | `Selective outline` |
| Werewolf Lycan | `Humanoid` | `Pro` (8 rot.) | `Top-down (low)` | `48px` / `64px` | `Highly detailed` | `Selective outline` |
| Bat Swarm | `Humanoid` / `Quadruped` | `Standard` | `Top-down (low)` | `24px` / `32px` | `Highly detailed` | `Default Black outline` |
| Gore Abomination | `Humanoid` | `Standard` / `Pro` | `Top-down (low)` | `64px` | `Highly detailed` | `Selective outline` |
| NPCs (cleric, etc.) | `Humanoid` | `Standard` | `Top-down (low)` | `48px` | `Highly detailed` | `Selective outline` |
| Chest / props | `Humanoid` | `Standard` | `Top-down (low)` | `32px` / `48px` | `Highly detailed` | `Selective outline` |
| Floor tiles and decals | `Humanoid` | `Standard` | `Top-down (flat)` | `32px` / `48px` | `Highly detailed` | `No outline` |
| Wall tile | `Humanoid` | `Standard` | `Top-down (low)` | `64px` | `Highly detailed` | `Selective outline` |
