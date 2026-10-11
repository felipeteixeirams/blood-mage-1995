# Guia para Pixel Lab (parte 4: NPCs do refúgio e props de cenário)

**Mestre:** [feature-guia-pixel-lab](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Estado vs código:** verificado em 2026-10-11 (leitura estática): parcial; é um guia de prompts para ferramenta externa e as entregas são arte. Existe: cliente da API (`scripts/pixellab_client.cjs`), montagem do jogador (`scripts/stitch_pixellab_bloodmage.cjs`, `scripts/build_bloodmage_spritesheet.cjs`) e `public/assets/sprites/player/bloodmage.png` (544x1156, chave `spr_bloodmage`, células 68x68, `required: true` em `src/game/assets/assetManifest.json`); baú `public/assets/sprites/items/chest.png` (48x48) e 8 direções aberto/fechado, `required: true` (origem do PNG não verificada; `scripts/generate_chest_assets.cjs` é procedural). Não existe: arte física de inimigos (`public/assets/sprites/enemies/` vazio; 11 chaves `spr_*` no manifesto com `required: false` e fallback procedural), `spr_bloodmage_hoodless`, os 4 NPCs do guia, `spr_portal` e `spr_skeleton_remains` no manifesto (o código usa os dois) e os tiles do guia (`public/assets/tilesets/` vazio; manifesto tem `tile_ground` e `tile_wall_brick`). Divergência de tamanho: o guia propõe 48px e 64px; o manifesto usa células 68x68 (jogador) e 32x40, 36x28, 48x56, 64x72 etc. para inimigos.

Parte 4 de 6. Índice: [README](README.md).

## Anexo: NPCs e props

Prompts e campos do Pixel Lab; as entregas e critérios estão na [parte 1](01-config-e-jogador.md) e na [parte 6](06-criterios-e-pendencias.md).

## Categoria 3: NPCs do Refúgio (Safe Zones)

### 1. `spr_npc_cleric` (Clérigo de Sangue)
* **Character Type:** `Humanoid`
* **Generation Mode:** `Standard` (ou `Pro`)
* **Camera View:** `Top-down (low)`
* **Character Size:** `48px`
* **Detail:** `Highly detailed`
* **Outline:** `Selective outline`
* **Character Description:**
  ```text
  Solemn blood priest NPC, white ceremonial monk robe stained with dried wine and blood at hem, cowl hood, holding a silver holy censer and a blood teardrop amulet, peaceful standing stance, 16-bit dark fantasy RPG, transparent background
  ```

---

### 2. `spr_npc_alchemist` (Alquimista Rubro)
* **Character Type:** `Humanoid`
* **Generation Mode:** `Standard`
* **Camera View:** `Top-down (low)`
* **Character Size:** `48px`
* **Detail:** `Highly detailed`
* **Outline:** `Selective outline`
* **Character Description:**
  ```text
  Eccentric blood alchemist NPC, heavy brown leather apron with glass potion vials strapped across chest, brass goggles pushed up on forehead, messy grey hair, holding a bubbling crimson flask, 16-bit ARPG pixel art, transparent background
  ```

---

### 3. `spr_npc_blacksmith` (Ferreiro de Ossos)
* **Character Type:** `Humanoid`
* **Generation Mode:** `Standard`
* **Camera View:** `Top-down (low)`
* **Character Size:** `48px`
* **Detail:** `Highly detailed`
* **Outline:** `Selective outline` (ou `Default Black outline`)
* **Character Description:**
  ```text
  Living skeleton blacksmith NPC, wearing a charred leather apron and bandana, holding a glowing hot iron hammer over an anvil, amber embers in eye sockets, 16-bit dark fantasy pixel art, transparent background
  ```

---

### 4. `spr_npc_elder` (Ancião do Refúgio)
* **Character Type:** `Humanoid`
* **Generation Mode:** `Standard`
* **Camera View:** `Top-down (low)`
* **Character Size:** `48px`
* **Detail:** `Highly detailed`
* **Outline:** `Selective outline`
* **Character Description:**
  ```text
  Hunched ancient wizard elder NPC, long snowy white beard down to waist, dark charcoal embroidered robes, leaning on a tall twisted wooden walking staff with a glowing rune, 16-bit RPG pixel art, transparent background
  ```

---

## Categoria 4: Props de Cenário & Baús

### 1. `spr_chest` (Baú Gótico)
* **Character Type:** `Humanoid`
* **Generation Mode:** `Standard`
* **Camera View:** `Top-down (low)`
* **Character Size:** `32px` ou `48px`
* **Detail:** `Highly detailed`
* **Outline:** `Selective outline` (ou `Default Black outline`)
* **Character Description:**
  ```text
  Ornate gothic treasure chest prop, dark reinforced oak wood, tarnished brass skull latch and iron reinforcement bands, top-down 45 degree angle, 16-bit ARPG dungeon prop, transparent background
  ```

---

### 2. `spr_portal` (Portal de Sangue)
* **Character Type:** `Humanoid`
* **Generation Mode:** `Standard`
* **Camera View:** `Top-down (low)`
* **Character Size:** `64px`
* **Detail:** `Highly detailed`
* **Outline:** `Selective outline`
* **Character Description:**
  ```text
  Occult blood portal prop, vertical swirling vortex of glowing liquid crimson energy enclosed by an ancient ring of floating dark rune stones, 16-bit dark fantasy dungeon exit portal, transparent background
  ```

---

### 3. `spr_skeleton_remains` (Ossada no Chão)
* **Character Type:** `Humanoid`
* **Generation Mode:** `Standard`
* **Camera View:** `Top-down (low)`
* **Character Size:** `32px`
* **Detail:** `Highly detailed`
* **Outline:** `Selective outline`
* **Character Description:**
  ```text
  Scattered adventurer skeleton bones lying flat on stone dungeon floor, cracked skull and ribcage with a rusted broken sword beside, top-down view, 16-bit RPG prop, transparent background
  ```
