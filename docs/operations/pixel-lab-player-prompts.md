# Pixel Lab: player prompts

**Mestre:** [operations](README.md)
**Status:** não verificado
**Verificado em:** —
**Método:** não verificado
**Fonte:** —

Nota de verificação: depende de ferramenta externa: a interface do Pixel Lab não foi conferida.

Prompts and field values for the player character in Pixel Lab. Global settings and the consistency rule (Style Image): [pixel-lab-config.md](pixel-lab-config.md). The player spritesheet is assembled by `scripts/build_bloodmage_spritesheet.cjs` (see [asset-scripts.md](asset-scripts.md)); never overwrite `public/assets/sprites/player/bloodmage.png` by hand.

## `spr_bloodmage` (Blood Mage, player base)

* **Character Type:** `Humanoid`
* **Generation Mode:** `Pro` (8 rotations)
* **Camera View:** `Top-down (low)` (or `Oblique`)
* **Character Size:** `48px` (or `64px`)
* **Detail:** `Highly detailed`
* **Outline:** `Selective outline` (or `Default Black outline`)
* **Character Description:**
  ```text
  Sinister male blood mage, dark crimson red hooded cloak with ragged hem, holding a petrified dark wood staff tipped with a glowing ruby blood gem, pale gaunt face in deep shadow with two piercing glowing red eyes, tarnished gold belt buckle, 16-bit 1995 dark fantasy ARPG pixel art, clean dark outlines, subtle dithering, isolated on transparent background
  ```

## `spr_bloodmage_hoodless` (alternate skin: mage without hood)

* **Character Type:** `Humanoid`
* **Generation Mode:** `Pro` (8 rotations)
* **Camera View:** `Top-down (low)`
* **Character Size:** `48px`
* **Detail:** `Highly detailed`
* **Outline:** `Selective outline`
* **Character Description:**
  ```text
  Aristocratic male blood mage without hood, long slicked-back pale white hair, sharp gaunt features, glowing red eyes with faint blood tears, high-collared burgundy velvet tunic with tarnished gold embroidery, 16-bit gothic dark fantasy pixel art, clean outlines, transparent background
  ```
