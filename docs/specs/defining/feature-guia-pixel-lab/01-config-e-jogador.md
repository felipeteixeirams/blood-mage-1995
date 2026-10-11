# Guia para Pixel Lab (parte 1: contexto, decisões, escopo e configuração global)

**Mestre:** [feature-guia-pixel-lab](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Estado vs código:** verificado em 2026-10-11 (leitura estática): parcial; é um guia de prompts para ferramenta externa e as entregas são arte. Existe: cliente da API (`scripts/pixellab_client.cjs`), montagem do jogador (`scripts/stitch_pixellab_bloodmage.cjs`, `scripts/build_bloodmage_spritesheet.cjs`) e `public/assets/sprites/player/bloodmage.png` (544x1156, chave `spr_bloodmage`, células 68x68, `required: true` em `src/game/assets/assetManifest.json`); baú `public/assets/sprites/items/chest.png` (48x48) e 8 direções aberto/fechado, `required: true` (origem do PNG não verificada; `scripts/generate_chest_assets.cjs` é procedural). Não existe: arte física de inimigos (`public/assets/sprites/enemies/` vazio; 11 chaves `spr_*` no manifesto com `required: false` e fallback procedural), `spr_bloodmage_hoodless`, os 4 NPCs do guia, `spr_portal` e `spr_skeleton_remains` no manifesto (o código usa os dois) e os tiles do guia (`public/assets/tilesets/` vazio; manifesto tem `tile_ground` e `tile_wall_brick`). Divergência de tamanho: o guia propõe 48px e 64px; o manifesto usa células 68x68 (jogador) e 32x40, 36x28, 48x56, 64x72 etc. para inimigos.

Parte 1 de 6. Índice: [README](README.md).

## Contexto
O jogo tem pipeline de assets com fallback procedural (`src/game/assets/assetManifest.json`, `scripts/verify-assets.cjs`), mas só jogador, baú e UI têm arte física (ver [feature-mapeamento-de-sprites.md](../feature-mapeamento-de-sprites.md)). Este guia reúne os campos e prompts do Pixel Lab (ferramenta externa) para gerar a arte que falta; as entregas são PNGs que o jogo carrega pelo manifesto.

## Objetivo
Ter prompts e configurações aprovados do Pixel Lab que, quando a produção de arte for retomada, gerem sprites e tiles consistentes entre si e entregues como PNGs válidos, com chave no `assetManifest.json` e aprovados pelo `verify-assets`.

## Decisões de que depende
Nenhuma. Depende da spec [feature-mapeamento-de-sprites.md](../feature-mapeamento-de-sprites.md) (retomada da produção de sprites físicos), ainda em `defining/`.

## Fatos técnicos verificados
| Afirmação | Fonte | Verificado em |
|---|---|---|
| `bloodmage.png` mede 544x1156 e o manifesto declara `spr_bloodmage` com células 68x68, `required: true` | `public/assets/sprites/player/bloodmage.png` (IHDR), `src/game/assets/assetManifest.json` | 2026-10-11 |
| `build_bloodmage_spritesheet.cjs` gera grade de 8 colunas x 17 linhas de células 68x68; `stitch_pixellab_bloodmage.cjs` monta outra grade de frames 48x48 (8x9) | `scripts/build_bloodmage_spritesheet.cjs`, `scripts/stitch_pixellab_bloodmage.cjs` | 2026-10-11 |
| `public/assets/sprites/enemies/` e `public/assets/tilesets/` estão vazios; 11 inimigos e `tile_ground`/`tile_wall_brick` estão no manifesto com `required: false` | diretórios, `assetManifest.json` | 2026-10-11 |
| `spr_portal` e `spr_skeleton_remains` são usados pelo código e não constam no manifesto; `spr_npc_maelen` é usado e não consta no guia | `src/game/systems/DungeonFlowController.ts` (linhas 419, 729), `src/game/systems/DungeonGenerator.ts` (linha 244), `assetManifest.json` | 2026-10-11 |
| `chest.png` mede 48x48 e `generate_chest_assets.cjs` desenha baú procedural 48x48; a origem do PNG atual não foi verificada | `public/assets/sprites/items/chest.png`, `scripts/generate_chest_assets.cjs` | 2026-10-11 |
| O `verify-assets` valida assinatura, tamanho e dimensões IHDR dos PNGs e, para spritesheet `required`, a grade contra `frameWidth`/`frameHeight`; grade errada em spritesheet não `required` gera só aviso | `scripts/verify-assets.cjs` | 2026-10-11 |
| Nenhum código referencia `spr_bloodmage_hoodless` nem há seletor de skin (grep de `hoodless\|skin` só acerta `textureGenerator.ts`) | `src/` | 2026-10-11 |

## Decisões a confirmar
| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| 1 | Condição para usar o guia: retomada da produção de sprites físicos | A) retomar; B) manter procedural | A, quando o responsável decidir; até lá o guia fica em `defining/` |
| 2 | Tamanho de geração frente à célula do manifesto (48/64px do guia x 32x40, 48x56 etc.) | A) ajustar o manifesto à arte gerada; B) redimensionar na montagem; C) gerar no tamanho do manifesto | A para os 11 inimigos: todos estão `required: false`, sem custo de migração |
| 3 | Contorno por categoria (`Selective outline` ou `Default Black outline`) | A) preto para inimigos e chefes, seletivo para NPCs e props; B) um só para tudo | A: legibilidade de combate no chão escuro; acabamento nos demais |
| 4 | Modo de geração (`Pro` 8 rotações ou `Standard`) por elemento | A) `Pro` só para jogador, cão, chefes e inimigos de 8 direções; B) `Pro` em tudo | A: custo de créditos não verificado (`pixellab_client.cjs balance`) |
| 5 | Skin `spr_bloodmage_hoodless` | A) fora até haver sistema de skins; B) gerar agora | A: nada no código a consome |
| 6 | Chaves e caminhos de NPCs, props e tiles (hoje fora do manifesto) | A) `assets/sprites/npcs/*.png`, `assets/sprites/props/*.png`, `assets/tilesets/*.png` com chave igual ao nome do guia; B) outro padrão | A: segue o padrão de `enemies/` e `tilesets/` |
| 7 | Tiles do guia (`tile_floor_stone`, `tile_wall_catacomb`, `tile_blood_pool`) frente às chaves existentes (`tile_ground`, `tile_wall_brick`, `tile_wood_*`, `tile_door`) | A) mapear para as chaves existentes; B) criar chaves novas | A: evita tiles paralelos sem consumidor |
| 8 | Baú: substituir a arte atual (8 direções) pelo prompt do guia | A) fora; B) substituir | A: o baú já tem arte e `required: true` |
| 9 | Descrição visual de cada personagem, inimigo, NPC, prop e tile (identidade visual) | A) aprovar; B) revisar | A, após ver uma geração de teste de um inimigo |
| 10 | Incluir `spr_npc_maelen` (usado no código) no guia | A) incluir prompt; B) manter fora | A: é o único NPC com uso real |

## Escopo
Entregas de arte, só o que falta, quando a decisão 1 liberar:
- 11 PNGs de inimigos nos caminhos do manifesto (tabela abaixo), mais a decisão de tamanho (decisão 2).
- 4 NPCs do refúgio (`spr_npc_cleric`, `spr_npc_alchemist`, `spr_npc_blacksmith`, `spr_npc_elder`), com chave e caminho a registrar (decisão 6).
- Props `spr_portal` e `spr_skeleton_remains`, a registrar no manifesto.
- 3 tiles do guia, conforme o mapeamento da decisão 7.
- Opcionais conforme decisões 5, 8 e 10: `spr_bloodmage_hoodless`, substituição do baú, `spr_npc_maelen`.
- Parâmetros globais do Pixel Lab e prompts aprovados (anexo das partes 1 a 5).

## Fora de escopo
- Texto dos prompts como requisito testável (a verificação é da entrega de arte).
- Regerar o jogador (`spr_bloodmage` já existe).
- Animações, balance, stats e comportamento dos inimigos; código de jogo.
- Editar PNG com ferramenta de texto (regra do projeto: binários só por `Buffer`/`curl --output`).

## Arquivos e contratos
**Criar:** PNGs em `public/assets/sprites/enemies/`, `npcs/`, `props/` e `public/assets/tilesets/` (pastas de NPCs e props conforme decisão 6).
**Alterar:** `src/game/assets/assetManifest.json` (chaves novas e `required`), `docs/operations/asset-scripts.md` se um script novo de montagem for criado, `docs/specs/defining/feature-mapeamento-de-sprites.md` (checklist).
**Não tocar:** `scripts/generate_bloodmage_spritesheet.cjs` (procedural, só emergência), `public/assets/sprites/player/bloodmage.png`, código de gameplay.

**Contrato dos inimigos (manifesto atual; tamanho do guia entre parênteses, decisão 2):**
| Chave | Caminho | Célula no manifesto | Tamanho do guia |
|---|---|---|---|
| `spr_skeleton` | `assets/sprites/enemies/skeleton.png` | 32x40 | 48px |
| `spr_cultist` | `assets/sprites/enemies/cultist.png` | 32x40 | 48px |
| `spr_hound` | `assets/sprites/enemies/hound.png` | 36x28 | 48px |
| `spr_golem` | `assets/sprites/enemies/golem.png` | 48x56 | 64px |
| `spr_specter` | `assets/sprites/enemies/specter.png` | 32x40 | 48px |
| `spr_boss` | `assets/sprites/enemies/boss.png` | 64x72 | 64px |
| `spr_zombie_shambler` | `assets/sprites/enemies/zombie_shambler.png` | 32x40 | 48px |
| `spr_vampire_stalker` | `assets/sprites/enemies/vampire_stalker.png` | 32x44 | 48px |
| `spr_werewolf_lycan` | `assets/sprites/enemies/werewolf_lycan.png` | 38x44 | 48px ou 64px |
| `spr_bat_swarm` | `assets/sprites/enemies/bat_swarm.png` | 20x20 | 24px ou 32px |
| `spr_gore_abomination` | `assets/sprites/enemies/gore_abomination.png` | 52x60 | 64px |

**Regras de entrega:** PNG com assinatura válida e canal alpha; `required: true` só com o arquivo commitado e `pnpm run verify` passando; `spr_bloodmage` só pelo script `build_bloodmage_spritesheet.cjs`.

## Anexo: configuração global e personagem principal

> **Manual de Configuração e Prompts Mapeados Diretamente para os Campos do Pixel Lab**
> Todos os elementos abaixo estão formatados rigorosamente com os campos e dropdowns da interface do Pixel Lab:
> • **Character Type** • **Generation Mode** • **Camera View** • **Character Size** • **Detail** • **Outline** • **Character Description**

---

## Configuração Global Recomendada para o Bloodmage 1995

Para garantir que todos os sprites fiquem harmônicos com a jogabilidade ARPG 2.5D e a estética gótica:

### 1. Recomendações dos Novos Dropdowns:
* **Detail:**
  * **`Highly detailed`** *(Recomendado para quase tudo)*: Essencial para atingir o visual 16-bit retro (Diablo 1 / Castlevania SOTN), com dobras de roupas, ossos, pústulas, gemas brilhantes e sombreamento com dithering.
  * **`Low detail`**: Use apenas se gerar itens muito pequenos (16px a 24px) caso fiquem poluídos com ruído.
* **Outline (Contorno):**
  * **Opção A — `Selective outline` (Sel-out)** *(Recomendado para máxima sofisticação artística)*: Colore os contornos com tons escuros que combinam com o material (ex: vermelho escuro na capa, marrom escuro no couro, cinza escuro no osso). Dá um acabamento profissional de estúdio.
  * **Opção B — `Default Black outline`** *(Recomendado para máxima legibilidade de combate)*: Contorno 100% preto clássico de arcade dos anos 90. Garante que nenhum inimigo ou projétil se perca contra o chão escuro de pedra da masmorra.
  *  *Evite `Lineless` para personagens e inimigos (fica sem definição no chão escuro).*

### 2. Demais Parâmetros:
* **Camera View:** Escolha sempre **`Top-down (low)`** (ou **`Oblique`** se disponível) — visão inclinada clássica de 45°.
* **Character Size no Plano Gratuito/Padrão:**
  * **`48px`**: Para o Mago, Inimigos normais e NPCs.
  * **`64px`**: Para Chefes e Golias (Necro Lord, Flesh Golem, Abomination).
  * **`32px` / `24px`**: Para morcegos e props menores.
* **Generation Mode:**
  * **`Pro`** (8 rotações): Para o **Player** (`spr_bloodmage`), **Hellhound** e **Chefes**.
  * **`Standard`**: Para NPCs parados, inimigos secundários e props de masmorra.
* ** O "Segredo da Consistência" (Style Image / Style Character):**
  * Assim que você gerar e aprovar o primeiro sprite do **Bloodmage** (`spr_bloodmage`), salve a imagem gerada.
  * Nas gerações seguintes, use essa imagem no campo **`Style Image`** ou selecione o mago em **`Style Character`**. Isso forçará o Pixel Lab a manter a mesma iluminação, paleta de cores e densidade de pixels em todo o jogo!

---

## Categoria 1: Personagem Principal (Bloodmage)

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
