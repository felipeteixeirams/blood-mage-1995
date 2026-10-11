# Guia para Pixel Lab (parte 3: bestiário, inimigos 7 a 11)

**Mestre:** [feature-guia-pixel-lab](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Estado vs código:** verificado em 2026-10-11 (leitura estática): parcial; é um guia de prompts para ferramenta externa e as entregas são arte. Existe: cliente da API (`scripts/pixellab_client.cjs`), montagem do jogador (`scripts/stitch_pixellab_bloodmage.cjs`, `scripts/build_bloodmage_spritesheet.cjs`) e `public/assets/sprites/player/bloodmage.png` (544x1156, chave `spr_bloodmage`, células 68x68, `required: true` em `src/game/assets/assetManifest.json`); baú `public/assets/sprites/items/chest.png` (48x48) e 8 direções aberto/fechado, `required: true` (origem do PNG não verificada; `scripts/generate_chest_assets.cjs` é procedural). Não existe: arte física de inimigos (`public/assets/sprites/enemies/` vazio; 11 chaves `spr_*` no manifesto com `required: false` e fallback procedural), `spr_bloodmage_hoodless`, os 4 NPCs do guia, `spr_portal` e `spr_skeleton_remains` no manifesto (o código usa os dois) e os tiles do guia (`public/assets/tilesets/` vazio; manifesto tem `tile_ground` e `tile_wall_brick`). Divergência de tamanho: o guia propõe 48px e 64px; o manifesto usa células 68x68 (jogador) e 32x40, 36x28, 48x56, 64x72 etc. para inimigos.

Parte 3 de 6. Índice: [README](README.md).

## Anexo: bestiário, inimigos 7 a 11

Prompts e campos do Pixel Lab; as entregas e critérios estão na [parte 1](01-config-e-jogador.md) e na [parte 6](06-criterios-e-pendencias.md).

### 7. `spr_zombie_shambler` (Zumbi em Decomposição)
* **Character Type:** `Humanoid`
* **Generation Mode:** `Pro` ou `Standard`
* **Camera View:** `Top-down (low)`
* **Character Size:** `48px`
* **Detail:** `Highly detailed`
* **Outline:** `Selective outline`
* **Character Description:**
  ```text
  Rotting zombie shambler, decayed grey-green skin, exposed bone ribcage, torn peasant brown rags, dragging one foot, outstretched decayed hands, dead milky eyes, 16-bit dark fantasy pixel art, clean outlines, transparent background
  ```

---

### 8. `spr_vampire_stalker` (Vampiro Espreitador)
* **Character Type:** `Humanoid`
* **Generation Mode:** `Pro` (8 rotations)
* **Camera View:** `Top-down (low)`
* **Character Size:** `48px`
* **Detail:** `Highly detailed`
* **Outline:** `Selective outline`
* **Character Description:**
  ```text
  Agile vampire assassin stalker, black gothic frock coat with high stiff scarlet collar, pale skin, sharp white fangs, dual wielding curved blood daggers, low combat crouch, 16-bit Castlevania style pixel art, transparent background
  ```

---

### 9. `spr_werewolf_lycan` (Lobisomem)
* **Character Type:** `Humanoid`
* **Generation Mode:** `Pro` (8 rotations)
* **Camera View:** `Top-down (low)`
* **Character Size:** `48px` ou `64px`
* **Detail:** `Highly detailed`
* **Outline:** `Selective outline` (ou `Default Black outline`)
* **Character Description:**
  ```text
  Ferocious dark brown furred werewolf, muscular digitigrade beast standing on hind legs, razor-sharp claws, snarling open wolf snout dripping saliva, glowing yellow feral eyes, 16-bit retro gothic pixel art, transparent background
  ```

---

### 10. `spr_bat_swarm` (Morcego Vampírico)
* **Character Type:** `Humanoid` (ou `Quadruped`)
* **Generation Mode:** `Standard`
* **Camera View:** `Top-down (low)`
* **Character Size:** `24px` ou `32px`
* **Detail:** `Highly detailed` (ou `Low detail` se 24px)
* **Outline:** `Default Black outline`
* **Character Description:**
  ```text
  Giant demonic vampire bat flying, spread dark purple leathery wings, sharp fangs, glowing red eyes, 16-bit retro arcade pixel art, clean pixel cluster, transparent background
  ```

---

### 11. `spr_gore_abomination` (Abominação de Carne e Pústulas)
* **Character Type:** `Humanoid`
* **Generation Mode:** `Standard` ou `Pro`
* **Camera View:** `Top-down (low)`
* **Character Size:** `64px` *(Máximo)*
* **Detail:** `Highly detailed`
* **Outline:** `Selective outline`
* **Character Description:**
  ```text
  Grotesque pulsating gore abomination, massive blob of mutated flesh with multiple gnashing bloody mouths, leaking green bile pustules, writhing tentacles, 16-bit Lovecraftian grimdark pixel art, transparent background
  ```
