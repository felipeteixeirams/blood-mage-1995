# Assets de arte, UI, áudio e sprites: visão e direção artística (parte 1)

**Mestre:** [discovery-assets-arte-ui-audio-e-sprites](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Origem:** consolidada de discovery-assets-externos-e-sprites e discovery-ui-e-assets-externos (2026-10-11)
**Estado vs código:** verificado em 2026-10-11 (leitura estática): parcial. Existe: texturas procedurais como fallback (`src/utils/textureGenerator.ts`); arte física só do jogador (`public/assets/sprites/player/bloodmage.png`, 68x68, 8 direções) e do baú; tint por raridade (`src/utils/equipmentPalette.ts`), glow de loot (`LightingPolish.addItemGlow`), tint de elite (`Enemy.ts`), cores de raridade em `InventoryModal.tsx`. Falta: camadas de armadura e arma no jogador, spritesheets de inimigos (`public/assets/sprites/enemies` vazio), retratos de NPC (`DialogueModal.tsx` usa ícones Lucide), tilesets externos (`public/assets/tilesets` vazio), ícones de skill e inventário em pixel art, sprites de loot, túmulo, VFX de magia em arte. Detalhes de carga, UI, áudio e licenças nas partes 2 a 5.

Parte 1 de 6. Índice: [README](README.md).

## Contexto
O jogo usa `textureGenerator.ts` (canvas) como fonte das texturas, com carga opcional de arquivos via `assetManifest.json`. Modelo híbrido proposto: arte física (PNG/WebP) e áudio físico (MP3/OGG) onde o ganho de imersão é maior, com os geradores procedurais como fallback **sob a mesma chave**. Estética: Diablo I e II e Dungeon Siege 1 (pixel art gótica dos anos 90), mobile-first, alto contraste e contorno legível em telas pequenas. O fallback procedural por chave já existe e é preservado.

Paleta Grimdark proposta (aprovação pendente):

| Cor | Hex | Uso |
|---|---|---|
| Deep Charcoal | `#171309` | Fundo de painéis e masmorras |
| Crimson Blood Red | `#990000` | Hemomancia, sangue, orbes vitais |
| Tarnished Gold | `#B8860B` | Bordas góticas, botões rúnicos ativos, itens raros |
| Bone White | `#E3DAC9` | Ossos, fontes rúnicas |
| Abyssal Void | `#000000` | Sombras absolutas e névoa |

## Objetivo
Se aprovada, arte externa entra por chave sem quebrar o fallback procedural, carrega por cena, reporta falhas, respeita orçamento e licenças e não perde FPS; o jogo troca gradualmente arte e som procedurais por assets góticos licenciados, mantendo a legibilidade em mobile.

## Decisões de que depende
| ADR | Assunto | Status |
|---|---|---|
| [0006](../../../decisions/0006-audio-e-conquistas.md) | Áudio só pelo `soundEngine` (parte 4) | Proposta |
| [0008](../../../decisions/0008-endpoint-api-log.md) | Endpoint `/api/log` usado pelo `logger` (telemetria existente) | Aprovada |
| [0010](../../../decisions/0010-canais-de-distribuicao.md) | Canais PWA, TWA e Steam (cache, formatos, licenças e créditos) | Proposta |
| [0013](../../../decisions/0013-metas-de-performance.md) | Metas de performance e bundle (orçamento, "sem queda de FPS") | Proposta |

## Fatos técnicos verificados
| Afirmação | Fonte | Verificado em |
|---|---|---|
| O jogador tem spritesheet física 68x68; inimigos, projéteis, itens e tiles são `required: false` sem arquivo | `src/game/assets/assetManifest.json`, `public/assets/` | 2026-10-11 |
| Equipamento tinge o personagem por raridade; não há camadas independentes | `src/utils/equipmentPalette.ts` | 2026-10-11 |
| `DialogueModal.tsx` usa ícones Lucide, não retratos | `src/components/hud/DialogueModal.tsx` (linha 2) | 2026-10-11 |
| Fontes locais existem (Cinzel, UnifrakturMaguntia, Press Start 2P, VT323) | `public/fonts/` | 2026-10-11 |
| `public/assets/sprites/enemies`, `projectiles` e `public/assets/tilesets` estão vazios | listagem de `public/assets` | 2026-10-11 |
| `bloodmage.png` mede 544x1156 e o manifesto declara `spr_bloodmage` com células 68x68, `required: true` | `public/assets/sprites/player/bloodmage.png` (IHDR), `assetManifest.json` | 2026-10-11 |
| `build_bloodmage_spritesheet.cjs` gera grade 8x17 de células 68x68; `stitch_pixellab_bloodmage.cjs` monta outra grade de frames 48x48 (8x9) | `scripts/build_bloodmage_spritesheet.cjs`, `scripts/stitch_pixellab_bloodmage.cjs` | 2026-10-11 |
| `spr_portal` e `spr_skeleton_remains` são usados pelo código e não constam no manifesto; `spr_npc_maelen` é usado e não consta no guia Pixel Lab | `src/game/systems/DungeonFlowController.ts` (linhas 419, 729), `DungeonGenerator.ts` (linha 244), `assetManifest.json` | 2026-10-11 |
| `chest.png` mede 48x48 e `generate_chest_assets.cjs` desenha baú procedural 48x48; a origem do PNG atual não foi verificada | `public/assets/sprites/items/chest.png`, `scripts/generate_chest_assets.cjs` | 2026-10-11 |
| Nenhum código referencia `spr_bloodmage_hoodless` nem há seletor de skin | `src/` (grep `hoodless\|skin`) | 2026-10-11 |

## Decisões a confirmar
| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| 1 | Direção artística e paleta (ex-UIA 1) | A) paleta proposta; B) outra | A, por coerência com o CSS atual (`#b8860b` já em uso) |
| 2 | Ordem de migração de arte (ex-UIA 2) | A) jogador, inimigos, tiles, UI; B) tiles primeiro | A: o jogador já tem arte e valida o pipeline |
| 3 | Equipamento visível (ex-UIA 3) | A) camadas de spritesheet; B) manter tint por raridade | B até haver arte; camadas multiplicam animações |
| 4 | Retratos de NPC (ex-UIA 4) | A) imagem estática; B) animados (piscada e fala) | A: menor custo de arte |
| 5 | Origem da arte (ex-UIA 5) | A) pacotes CC0/CC-BY; B) arte própria/IA ([pipeline de arte com IA](../discovery-assets-pipeline-de-arte-com-ia.md)) | A para prototipar; B depende de orçamento de arte (decisão de negócio) |
| 18 | Retomar a produção de sprites físicos (ex-guia PL 1) | A) retomar; B) manter procedural | A, quando o responsável decidir |
| 19 | Tamanho de geração frente à célula do manifesto (ex-guia PL 2) | A) ajustar o manifesto à arte; B) redimensionar na montagem; C) gerar no tamanho do manifesto | A para os 11 inimigos: todos `required: false`, sem custo de migração |
| 20 | Contorno por categoria (ex-guia PL 3) | A) preto em inimigos e chefes, seletivo em NPCs e props; B) um só | A: legibilidade de combate no chão escuro |
| 21 | Modo de geração `Pro` ou `Standard` (ex-guia PL 4) | A) `Pro` só para jogador, cão, chefes e inimigos de 8 direções; B) `Pro` em tudo | A: custo de créditos não verificado |
| 22 | Skin `spr_bloodmage_hoodless` (ex-guia PL 5) | A) fora até haver sistema de skins; B) gerar agora | A: nada no código a consome |
| 23 | Chaves e caminhos de NPCs, props e tiles (ex-guia PL 6) | A) `assets/sprites/npcs/*.png`, `props/*.png`, `assets/tilesets/*.png`, chave igual ao nome do guia; B) outro | A: segue o padrão de `enemies/` e `tilesets/` |
| 24 | Tiles do guia frente às chaves existentes (ex-guia PL 7) | A) mapear para `tile_ground`, `tile_wall_brick` etc.; B) chaves novas | A: evita tiles paralelos sem consumidor |
| 25 | Baú: substituir a arte atual (ex-guia PL 8) | A) fora; B) substituir | A: já tem arte e `required: true` |
| 26 | Identidade visual de cada personagem, inimigo, NPC, prop e tile (ex-guia PL 9) | A) aprovar; B) revisar | A, após ver uma geração de teste de um inimigo |
| 27 | Incluir `spr_npc_maelen` no guia (ex-guia PL 10) | A) incluir; B) fora | A: único NPC com uso real |

As decisões 6 a 11 estão nas partes 3 a 5; 12 a 17, na parte 2.

## Escopo
Se aprovado, arte externa (sob o fallback procedural) para:
- **Personagem principal:** ataque de foice, conjuração, hit e morte além das 8 direções; camadas de manto e arma conforme decisão 3.
- **Inimigos:** cães infernais (corrida e mordida com windup), cultistas (conjuração e morte), mortos-vivos (rastejar e erguer); elites seguem com `setTint()`.
- **NPCs:** retratos do Clérigo, Alquimista e Ferreiro no diálogo; sprites estáticos ou de respiração nas Safe Zones.
- **Cenário e props:** tilesets góticos (pedra úmida, grades, rachaduras, poças de sangue); baús, altares rúnicos, recipientes de cinzas e corpos vasculháveis (fechado e aberto); portões que abrem após mini-chefes.
- **Ícones e inventário:** molduras rúnicas nos slots de skill; ícones de foice, explosão e círculo; runas com glow; grade do inventário em ferro cinzelado; miniaturas com cores de raridade (comum cinza, raro azul, épico roxo, lendário dourado).
- **Loot e túmulo:** poções vermelhas e azuis, sacos de couro, pergaminhos; túmulo ou corpo do jogador com fumaça ou facho vermelho.
- **VFX:** corte carmim com rastro, feixe de sangue, explosões necromânticas; bolas de fogo sombrio, garras de sombra e projéteis venenosos verdes legíveis.
- **Entrega de arte (guia Pixel Lab):** 11 inimigos, 4 NPCs, `spr_portal`, `spr_skeleton_remains` e tiles, com PNG no caminho do manifesto, grade compatível e canal alpha (critérios `AAS-24` a `AAS-37`).

## Fora de escopo
- Orçamento, carregador e licenças são das partes 2 e 5; produção da arte e escolha de pacotes (decisões 1 e 5); prompts do guia Pixel Lab.
- Mudar mecânica de combate, telégrafos ou balance; aura de inimigo (decisão 16); mudar a chave de texturas existentes.

## Arquivos e contratos
- Esta parte não altera arquivos. Chaves seguem `src/game/assets/assetManifest.json`; asset novo usa a mesma chave do gerador procedural.
- Entrega de arte: PNG no `path` do manifesto, `required: false` até o arquivo estar commitado e `pnpm run verify` passar; spritesheet do jogador só por `scripts/build_bloodmage_spritesheet.cjs` (544x1156, 8x17 de 68x68); binários nunca por ferramentas de texto.

## Referências
- [Mapeamento de sprites](../feature-assets-mapeamento-de-sprites.md), [pipeline de arte com IA](../discovery-assets-pipeline-de-arte-com-ia.md), [evolução gráfica](../discovery-grafico-evolucao-pendente.md)
- [asset-scripts](../../../operations/asset-scripts.md), [lighting-and-effects](../../../gameplay/lighting-and-effects.md), [bestiário](../../../gameplay/enemies-and-bestiary.md)
