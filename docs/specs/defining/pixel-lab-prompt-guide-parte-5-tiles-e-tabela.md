# Guia Direto para Pixel Lab (Bloodmage 1995) (parte 5: Tiles de ambiente e tabela resumo)

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente

**Estado vs código:** verificado em 2026-10-10: parcial; é um guia de prompts para ferramenta externa, sem código a implementar. Existe: cliente da API (`scripts/pixellab_client.cjs`), montagem da spritesheet do jogador a partir de export PixelLab (`scripts/stitch_pixellab_bloodmage.cjs`, `scripts/build_bloodmage_spritesheet.cjs`) e `public/assets/sprites/player/bloodmage.png` (chave `spr_bloodmage`, células 68x68, `required: true` em `src/game/assets/assetManifest.json`), mais GIFs em `public/assets/sprites/player/animated/`. Baú: `public/assets/sprites/items/chest*` (8 direções, aberto/fechado) existe; origem não verificada (há também `scripts/generate_chest_assets.cjs`, procedural). Não existe: `spr_bloodmage_hoodless`; sprites de inimigos (`public/assets/sprites/enemies/` só tem `.gitkeep`; as chaves `spr_skeleton`, `spr_cultist`, `spr_hound`, `spr_golem`, `spr_specter`, `spr_boss`, `spr_zombie_shambler`, `spr_vampire_stalker`, `spr_werewolf_lycan`, `spr_bat_swarm`, `spr_gore_abomination` estão no manifesto com `required: false` e usam fallback procedural); NPCs; `spr_portal`, `spr_skeleton_remains`; tiles `tile_*` (`public/assets/tilesets/` só tem `.gitkeep`). Divergência de tamanho: o guia propõe 48px para o jogador e inimigos; o manifesto usa células 68x68 (jogador) e 32x40, 36x28, 48x56, 64x72 etc. para inimigos planejados.

Parte 5 de 5. Índice das partes: [parte 1](pixel-lab-prompt-guide-parte-1-config-e-jogador.md).

---

## 🏰 5. Categoria: Ambiente & Tiles de Cenário (Impacto Visual Máximo)

### 1. `tile_floor_stone` (Piso de Pedra Gótico das Catacumbas)
* **Character Type:** `Humanoid`
* **Generation Mode:** `Standard`
* **Camera View:** `Top-down (flat)`
* **Character Size:** `32px`
* **Detail:** `Highly detailed`
* **Outline:** `No outline`
* **Character Description:**
  ```text
  Seamless dark gothic stone floor tile, cracked flagstones with dried blood stains in the crevices, ancient dungeon texture, 16-bit dark fantasy ARPG background tile, tileable
  ```

---

### 2. `tile_wall_catacomb` (Parede de Pedra com Crânios)
* **Character Type:** `Humanoid`
* **Generation Mode:** `Standard`
* **Camera View:** `Top-down (low)`
* **Character Size:** `64px`
* **Detail:** `Highly detailed`
* **Outline:** `Selective outline`
* **Character Description:**
  ```text
  Dark gothic catacomb stone wall with embedded human skulls and bones carved into masonry, grim dark fantasy dungeon architecture, 16-bit top-down wall tile
  ```

---

### 3. `tile_blood_pool` (Poça de Sangue no Chão)
* **Character Type:** `Humanoid`
* **Generation Mode:** `Standard`
* **Camera View:** `Top-down (flat)`
* **Character Size:** `48px`
* **Detail:** `Highly detailed`
* **Outline:** `No outline`
* **Character Description:**
  ```text
  Fresh pool of dark crimson blood on grey stone floor, glossy wet specular highlights reflecting dim torchlight, gothic horror top-down floor decal, 16-bit pixel art
  ```

---

## 📋 Tabela Resumo com Todas as Opções do Pixel Lab

| Elemento | Character Type | Generation Mode | Camera View | Size | Detail | Outline |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Bloodmage (Player)** | `Humanoid` | `Pro` (8 rot.) | `Top-down (low)` | `48px` | `Highly detailed` | `Selective outline` |
| **Bloodmage (Hoodless)** | `Humanoid` | `Pro` (8 rot.) | `Top-down (low)` | `48px` | `Highly detailed` | `Selective outline` |
| **Skeleton Warrior** | `Humanoid` | `Pro` / `Standard` | `Top-down (low)` | `48px` | `Highly detailed` | `Selective outline` |
| **Cultist Acolyte** | `Humanoid` | `Pro` / `Standard` | `Top-down (low)` | `48px` | `Highly detailed` | `Selective outline` |
| **Hell Hound** | `Quadruped` | `Pro` (8 rot.) | `Top-down (low)` | `48px` | `Highly detailed` | `Default Black outline` |
| **Flesh Golem** | `Humanoid` | `Pro` / `Standard` | `Top-down (low)` | `64px` | `Highly detailed` | `Selective outline` |
| **Necro Lord (Boss)** | `Humanoid` | `Pro` (8 rot.) | `Top-down (low)` | `64px` | `Highly detailed` | `Default Black outline` |
| **Blood Specter** | `Humanoid` | `Standard` / `Pro` | `Top-down (low)` | `48px` | `Highly detailed` | `Selective outline` |
| **Zombie Shambler** | `Humanoid` | `Pro` / `Standard` | `Top-down (low)` | `48px` | `Highly detailed` | `Selective outline` |
| **Vampire Stalker** | `Humanoid` | `Pro` (8 rot.) | `Top-down (low)` | `48px` | `Highly detailed` | `Selective outline` |
| **Werewolf Lycan** | `Humanoid` | `Pro` (8 rot.) | `Top-down (low)` | `48px` / `64px` | `Highly detailed` | `Selective outline` |
| **Bat Swarm** | `Humanoid` / `Quad` | `Standard` | `Top-down (low)` | `24px` / `32px` | `Highly detailed` | `Default Black outline` |
| **Gore Abomination** | `Humanoid` | `Standard` / `Pro` | `Top-down (low)` | `64px` | `Highly detailed` | `Selective outline` |
| **NPCs (Clérigo, etc.)** | `Humanoid` | `Standard` | `Top-down (low)` | `48px` | `Highly detailed` | `Selective outline` |
| **Baú / Props** | `Humanoid` | `Standard` | `Top-down (low)` | `32px` / `48px` | `Highly detailed` | `Selective outline` |
