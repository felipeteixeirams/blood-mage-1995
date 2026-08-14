---
agent_context: game-designer, pixel-artist, developer
target_module: artifacts/bloodmage/src/assets, src/game
priority: alta
status: ativo
last_updated: 2026-08-14
tags: [pixel-art, pixel-lab, prompts, prompt-engineering, sprites, assets, grimdark, ui-mapping]
---

# 🎨 Guia Direto para Pixel Lab (Bloodmage 1995)

> **Manual de Configuração e Prompts Mapeados Diretamente para os Campos do Pixel Lab**
> Todos os elementos abaixo estão formatados rigorosamente com os campos e dropdowns da interface do Pixel Lab:
> • **Character Type** • **Generation Mode** • **Camera View** • **Character Size** • **Detail** • **Outline** • **Character Description**

---

## 🧭 Configuração Global Recomendada para o Bloodmage 1995

Para garantir que todos os sprites fiquem harmônicos com a jogabilidade ARPG 2.5D e a estética gótica:

### 1. Recomendações dos Novos Dropdowns:
* **Detail:**
  * **`Highly detailed`** *(Recomendado para quase tudo)*: Essencial para atingir o visual 16-bit retro (Diablo 1 / Castlevania SOTN), com dobras de roupas, ossos, pústulas, gemas brilhantes e sombreamento com dithering.
  * **`Low detail`**: Use apenas se gerar itens muito pequenos (16px a 24px) caso fiquem poluídos com ruído.
* **Outline (Contorno):**
  * **Opção A — `Selective outline` (Sel-out)** *(Recomendado para máxima sofisticação artística)*: Colore os contornos com tons escuros que combinam com o material (ex: vermelho escuro na capa, marrom escuro no couro, cinza escuro no osso). Dá um acabamento profissional de estúdio.
  * **Opção B — `Default Black outline`** *(Recomendado para máxima legibilidade de combate)*: Contorno 100% preto clássico de arcade dos anos 90. Garante que nenhum inimigo ou projétil se perca contra o chão escuro de pedra da masmorra.
  * ⚠️ *Evite `Lineless` para personagens e inimigos (fica sem definição no chão escuro).*

### 2. Demais Parâmetros:
* **Camera View:** Escolha sempre **`Top-down (low)`** (ou **`Oblique`** se disponível) — visão inclinada clássica de 45°.
* **Character Size no Plano Gratuito/Padrão:**
  * **`48px`**: Para o Mago, Inimigos normais e NPCs.
  * **`64px`**: Para Chefes e Golias (Necro Lord, Flesh Golem, Abomination).
  * **`32px` / `24px`**: Para morcegos e props menores.
* **Generation Mode:**
  * **`Pro`** (8 rotações): Para o **Player** (`spr_bloodmage`), **Hellhound** e **Chefes**.
  * **`Standard`**: Para NPCs parados, inimigos secundários e props de masmorra.
* **💡 O "Segredo da Consistência" (Style Image / Style Character):**
  * Assim que você gerar e aprovar o primeiro sprite do **Bloodmage** (`spr_bloodmage`), salve a imagem gerada.
  * Nas gerações seguintes, use essa imagem no campo **`Style Image`** ou selecione o mago em **`Style Character`**. Isso forçará o Pixel Lab a manter a mesma iluminação, paleta de cores e densidade de pixels em todo o jogo!

---

## 🧙‍♂️ Categoria 1: Personagem Principal (Bloodmage)

### 1. `spr_bloodmage` (Mago de Sangue — Base do Jogador)
* **Character Type:** `Humanoid`
* **Generation Mode:** `Pro` (8 rotations)
* **Camera View:** `Top-down (low)` (ou `Oblique`)
* **Character Size:** `48px` (ou `64px`)
* **Detail:** `Highly detailed`
* **Outline:** `Selective outline` (ou `Default Black outline`)
* **Character Description:**
  ```text
  Sinister male blood mage, dark crimson red hooded cloak with ragged hem, holding a petrified dark wood staff tipped with a glowing ruby blood gem, pale gaunt face in deep shadow with two piercing glowing red eyes, tarnished gold belt buckle, 16-bit 1995 dark fantasy ARPG pixel art, clean dark outlines, subtle dithering, isolated on transparent background
  ```

---

### 2. `spr_bloodmage_hoodless` (Skin Alternativa: Mago sem Capuz)
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

---

## 👹 Categoria 2: Bestiário (Inimigos e Monstros)

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
* **Character Type:** `Quadruped` ⚠️ *(Importante selecionar quadrúpede)*
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

---

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

---

## 🏛️ Categoria 3: NPCs do Refúgio (Safe Zones)

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

## 🏰 Categoria 4: Props de Cenário & Baús

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
