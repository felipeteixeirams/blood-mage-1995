# Guia para Pixel Lab (parte 2: bestiário, inimigos 1 a 6)

**Mestre:** [feature-guia-pixel-lab](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Estado vs código:** verificado em 2026-10-11 (leitura estática): parcial; é um guia de prompts para ferramenta externa e as entregas são arte. Existe: cliente da API (`scripts/pixellab_client.cjs`), montagem do jogador (`scripts/stitch_pixellab_bloodmage.cjs`, `scripts/build_bloodmage_spritesheet.cjs`) e `public/assets/sprites/player/bloodmage.png` (544x1156, chave `spr_bloodmage`, células 68x68, `required: true` em `src/game/assets/assetManifest.json`); baú `public/assets/sprites/items/chest.png` (48x48) e 8 direções aberto/fechado, `required: true` (origem do PNG não verificada; `scripts/generate_chest_assets.cjs` é procedural). Não existe: arte física de inimigos (`public/assets/sprites/enemies/` vazio; 11 chaves `spr_*` no manifesto com `required: false` e fallback procedural), `spr_bloodmage_hoodless`, os 4 NPCs do guia, `spr_portal` e `spr_skeleton_remains` no manifesto (o código usa os dois) e os tiles do guia (`public/assets/tilesets/` vazio; manifesto tem `tile_ground` e `tile_wall_brick`). Divergência de tamanho: o guia propõe 48px e 64px; o manifesto usa células 68x68 (jogador) e 32x40, 36x28, 48x56, 64x72 etc. para inimigos.

Parte 2 de 6. Índice: [README](README.md).

## Anexo: bestiário, inimigos 1 a 6

Prompts e campos do Pixel Lab; as entregas e critérios estão na [parte 1](01-config-e-jogador.md) e na [parte 6](06-criterios-e-pendencias.md).

## Categoria 2: Bestiário (Inimigos e Monstros)

### 1. `spr_skeleton` (Skeleton Warrior — Esqueleto com Espada)
* **Character Type:** `Humanoid`
* **Generation Mode:** `Pro` ou `Standard`
* **Camera View:** `Top-down (low)`
* **Character Size:** `48px`
* **Detail:** `Highly detailed`
* **Outline:** `Selective outline` (ou `Default Black outline`)
* **Character Description:**
  ```text
  Undead skeleton warrior, yellowed bone ribcage, glowing hollow eye sockets, rusted iron kettle helm, wielding a notched chipped broadsword and a battered dark wooden round shield, 16-bit retro dark fantasy pixel art, grimdark aesthetic, clean outline, transparent background
  ```

---

### 2. `spr_cultist` (Cultist Acolyte — Cultista Arcano)
* **Character Type:** `Humanoid`
* **Generation Mode:** `Pro` ou `Standard`
* **Camera View:** `Top-down (low)`
* **Character Size:** `48px`
* **Detail:** `Highly detailed`
* **Outline:** `Selective outline` (ou `Default Black outline`)
* **Character Description:**
  ```text
  Sinister dark occult cultist acolyte, deep purple tattered hooded robe with gold runic trim along hem, eerie glowing green eyes under dark hood, holding an open cursed grimoire with faint purple sparks, 16-bit gothic pixel art, clean outlines, transparent background
  ```

---

### 3. `spr_hound` (Hell Hound — Cão Infernal)
* **Character Type:** `Quadruped`  *(Importante selecionar quadrúpede)*
* **Generation Mode:** `Pro` (8 rotations)
* **Camera View:** `Top-down (low)`
* **Character Size:** `48px`
* **Detail:** `Highly detailed`
* **Outline:** `Default Black outline` (ou `Selective outline`)
* **Character Description:**
  ```text
  Demonic hellhound beast, muscular quadrupedal predator with exposed bloody sinew, black fur with bone ridge plates on back, glowing red ember eyes, ferocious snarling maw with dripping fangs, 16-bit retro ARPG pixel art, clean silhouette, transparent background
  ```

---

### 4. `spr_golem` (Flesh Golem — Golias de Carne)
* **Character Type:** `Humanoid`
* **Generation Mode:** `Pro` ou `Standard`
* **Camera View:** `Top-down (low)`
* **Character Size:** `64px` *(Tamanho Grande)*
* **Detail:** `Highly detailed`
* **Outline:** `Selective outline` (ou `Default Black outline`)
* **Character Description:**
  ```text
  Massive hulking flesh golem, bulky stitched muscular brute made of patchwork dead flesh, iron staples and neck bolts, single giant glowing red eye in center of forehead, hunched menacing silhouette, 16-bit grimdark ARPG pixel art, transparent background
  ```

---

### 5. `spr_specter` (Blood Specter — Espectro de Sangue)
* **Character Type:** `Humanoid`
* **Generation Mode:** `Standard` ou `Pro`
* **Camera View:** `Top-down (low)`
* **Character Size:** `48px`
* **Detail:** `Highly detailed`
* **Outline:** `Selective outline`
* **Character Description:**
  ```text
  Floating ethereal blood specter phantom, translucent spectral apparition draped in swirling crimson mist, shrieking open skull face, vaporous clawed hands, glowing red ghostly core, 16-bit dark fantasy pixel art, transparent background
  ```

---

### 6. `spr_boss` (Necro Lord — Chefe Soberano)
* **Character Type:** `Humanoid`
* **Generation Mode:** `Pro` (8 rotations)
* **Camera View:** `Top-down (low)`
* **Character Size:** `64px` *(Tamanho Máximo)*
* **Detail:** `Highly detailed`
* **Outline:** `Default Black outline` (ou `Selective outline`)
* **Character Description:**
  ```text
  Imposing Necro Lord boss, heavy spiked obsidian plate armor with tarnished gold filigree, horned iron skull helmet with fiery red eye slits, wielding a massive dark runic greatsword, tattered black cape, 16-bit 1995 gothic ARPG boss, transparent background
  ```
