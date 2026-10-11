# Guia Direto para Pixel Lab (Bloodmage 1995) (parte 1: Configuração global e personagem principal)

**Mestre:** [feature-guia-pixel-lab](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente

**Estado vs código:** verificado em 2026-10-10: parcial; é um guia de prompts para ferramenta externa, sem código a implementar. Existe: cliente da API (`scripts/pixellab_client.cjs`), montagem da spritesheet do jogador a partir de export PixelLab (`scripts/stitch_pixellab_bloodmage.cjs`, `scripts/build_bloodmage_spritesheet.cjs`) e `public/assets/sprites/player/bloodmage.png` (chave `spr_bloodmage`, células 68x68, `required: true` em `src/game/assets/assetManifest.json`), mais GIFs em `public/assets/sprites/player/animated/`. Baú: `public/assets/sprites/items/chest*` (8 direções, aberto/fechado) existe; origem não verificada (há também `scripts/generate_chest_assets.cjs`, procedural). Não existe: `spr_bloodmage_hoodless`; sprites de inimigos (`public/assets/sprites/enemies/` só tem `.gitkeep`; as chaves `spr_skeleton`, `spr_cultist`, `spr_hound`, `spr_golem`, `spr_specter`, `spr_boss`, `spr_zombie_shambler`, `spr_vampire_stalker`, `spr_werewolf_lycan`, `spr_bat_swarm`, `spr_gore_abomination` estão no manifesto com `required: false` e usam fallback procedural); NPCs; `spr_portal`, `spr_skeleton_remains`; tiles `tile_*` (`public/assets/tilesets/` só tem `.gitkeep`). Divergência de tamanho: o guia propõe 48px para o jogador e inimigos; o manifesto usa células 68x68 (jogador) e 32x40, 36x28, 48x56, 64x72 etc. para inimigos planejados.

## Partes desta spec

Spec dividida em partes menores; o conteúdo é o do documento original, sem alteração de significado.

| Parte | Assunto |
|---|---|
| [1](01-config-e-jogador.md) | Configuração global e personagem principal |
| [2](02-bestiario-1.md) | Bestiário, inimigos 1 a 6 |
| [3](03-bestiario-2.md) | Bestiário, inimigos 7 a 11 |
| [4](04-npcs-e-props.md) | NPCs do refúgio e props de cenário |
| [5](05-tiles-e-tabela.md) | Tiles de ambiente e tabela resumo |

## Decisões a confirmar

Comportamento e escopo abaixo são propostas sem aprovação registrada; nada aqui está decidido.

1. Ferramenta Pixel Lab e os parâmetros globais recomendados (dropdowns, tamanho, paleta).
2. Descrição visual de cada personagem, inimigo, NPC, prop e tile (identidade visual).
3. Condição para uso do guia: produção de sprites físicos retomada (ver [feature-mapeamento-de-sprites.md](../feature-mapeamento-de-sprites.md)).

---

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
