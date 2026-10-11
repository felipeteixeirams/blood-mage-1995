# Evolução de UI e assets externos góticos: visão e escopo visual (parte 1)

**Mestre:** [discovery-ui-e-assets-externos](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Estado vs código:** verificado em 2026-10-11 (leitura estática): parcial. Existe: texturas procedurais como fallback (`src/utils/textureGenerator.ts`), arte física só do jogador (`public/assets/sprites/player/bloodmage.png`, 68x68, 8 direções) e do baú, tint do personagem por raridade do equipamento (`src/utils/equipmentPalette.ts`), glow de loot por raridade (`LightingPolish.addItemGlow`), tint de elite (`Enemy.ts`), cores de raridade em `InventoryModal.tsx`. Falta: camadas de armadura e arma no sprite do jogador, spritesheets de inimigos (`public/assets/sprites/enemies` vazio), retratos de NPC (o `DialogueModal.tsx` usa ícones Lucide), tilesets externos (`public/assets/tilesets` vazio), ícones de skill e inventário em pixel art, sprites de loot no chão, túmulo do jogador, VFX de magia em arte.

Parte 1 de 6. Índice das partes: [README](README.md).

## Contexto
O jogo usa `textureGenerator.ts` (canvas) como fonte de todas as texturas, com carga opcional de arquivos via `assetManifest.json`. Esta discovery propõe um modelo híbrido: arte física (PNG/WebP) e áudio físico (MP3/OGG) onde o ganho de imersão é maior, com os geradores procedurais como fallback sob a mesma chave. Estética de referência: Diablo I e II e Dungeon Siege 1 (pixel art gótica de meados dos anos 90), mobile-first, com alto contraste e contorno legível em telas pequenas.

Divisão com [discovery-assets-externos-e-sprites](../discovery-assets-externos-e-sprites.md) (AES): esta spec define **o que** entra (direção artística, escopo visual, orçamento, UI, áudio, licenças); AES define **como carregar** (AssetLoader, lazy-loading, atlas, telemetria de `loaderror` de imagem, compressão). Nada de carregador é especificado aqui.

Paleta Grimdark proposta (aprovação pendente):

| Cor | Hex | Uso |
|---|---|---|
| Deep Charcoal | `#171309` | Fundo de painéis e masmorras |
| Crimson Blood Red | `#990000` | Hemomancia, sangue, orbes vitais |
| Tarnished Gold | `#B8860B` | Bordas góticas, botões rúnicos ativos, itens raros |
| Bone White | `#E3DAC9` | Ossos, fontes rúnicas |
| Abyssal Void | `#000000` | Sombras absolutas e névoa |

## Objetivo
Se aprovada, o jogo troca gradualmente arte e som procedurais por assets externos góticos licenciados, mantendo o fallback procedural e a legibilidade em mobile.

## Decisões de que depende
| ADR | Assunto | Status |
|---|---|---|
| [0006](../../../decisions/0006-audio-e-conquistas.md) | Áudio só pelo `soundEngine` (afeta o áudio físico, parte 3) | Proposta |
| [0013](../../../decisions/0013-metas-de-performance.md) | Metas de performance e bundle (orçamento, parte 4) | Proposta |
| [0010](../../../decisions/0010-canais-de-distribuicao.md) | Canais PWA, Play Store e Steam (licenças e créditos, parte 5) | Proposta |

## Fatos técnicos verificados
| Afirmação | Fonte | Verificado em |
|---|---|---|
| O jogador tem spritesheet física 68x68; inimigos, projéteis, itens e tiles são `required: false` sem arquivo | `src/game/assets/assetManifest.json`, `public/assets/` | 2026-10-11 |
| Equipamento tinge o personagem por raridade (palette swap); não há camadas independentes | `src/utils/equipmentPalette.ts` | 2026-10-11 |
| `DialogueModal.tsx` usa ícones Lucide, não retratos | `src/components/hud/DialogueModal.tsx` (linha 2) | 2026-10-11 |
| Fontes locais existem (Cinzel, UnifrakturMaguntia, Press Start 2P, VT323) | `public/fonts/` | 2026-10-11 |

## Decisões a confirmar
| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| 1 | Direção artística e paleta | A) paleta proposta; B) outra | A, por coerência com o CSS atual (`#b8860b` já em uso) |
| 2 | Ordem de migração de arte | A) jogador -> inimigos -> tiles -> UI; B) tiles primeiro | A: o jogador já tem arte e valida o pipeline |
| 3 | Equipamento visível | A) camadas de spritesheet; B) manter tint por raridade | B até haver arte; camadas multiplicam animações |
| 4 | Retratos de NPC com piscada e fala | A) imagem estática; B) animados | A: menor custo de arte |
| 5 | Origem da arte | A) pacotes CC0/CC-BY; B) arte própria/IA ([pipeline de arte com IA](../discovery-pipeline-de-arte-com-ia.md)) | A para prototipar; B depende de orçamento de arte (decisão de negócio) |
| 6 | Divisão de UI (parte 2) | A) modais e HUD em React com moldura 9-slice; B) parte no Phaser | A: `CLAUDE.md` exige UI só em React (o original dizia "HUD no Phaser") |
| 7 | Estratégia de áudio (parte 3) | A) BGM física e SFX críticos físicos, resto sintetizado; B) tudo físico; C) nada físico | A: o discovery de evolução gráfica recomenda manter SFX sintetizados |
| 8 | Como tocar a BGM física (parte 3) | A) `HTMLAudioElement` por streaming; B) mesmo `AudioContext` via `MediaElementSource` | B: preserva volume, mute e filtros do mixer atual; A foge do mixer |
| 9 | Orçamento e limites (parte 4) | A) limites do original; B) outros | A como ponto de partida, após medir o pacote atual |
| 10 | Licenças aceitas (parte 5) | A) CC0, CC-BY, OGA-BY; B) só CC0 | A, com crédito obrigatório para CC-BY e OGA-BY |
| 11 | Onde fica a tela de Créditos (parte 5) | A) Configurações; B) Menu Principal; C) ambos | A: um ponto de entrada só |

## Escopo
Se aprovado, arte externa (sob o fallback procedural) para:

### Personagem principal
- Spritesheet com ataque de foice, conjuração, hit e morte, além das 8 direções que já existem.
- Camadas independentes de manto (armadura) e foice/cajado (arma), conforme decisão 3.

### Inimigos
- Spritesheets de cães infernais (corrida e mordida com windup), cultistas (conjuração e morte) e mortos-vivos (rastejar e erguer).
- Elites continuam diferenciados por `setTint()` (sem arquivo novo).

### NPCs
- Retratos em pixel art do Clérigo, Alquimista e Ferreiro no diálogo; sprites estáticos ou de respiração nas Safe Zones.

### Cenário e props
- Tilesets góticos (pedra úmida, grades, rachaduras, poças de sangue); baús, altares rúnicos, recipientes de cinzas e corpos vasculháveis com estado fechado e aberto; portões góticos que abrem após mini-chefes.

### Ícones, runas e inventário
- Molduras rúnicas circulares nos slots de skill; ícones de foice, explosão e círculo; runas em pedra com glow de ativação; grade do inventário em ferro cinzelado; miniaturas de itens com cores de raridade (comum cinza, raro azul, épico roxo, lendário dourado).

### Loot e túmulo
- Loot no chão como objetos (poções vermelhas e azuis, sacos de couro, pergaminhos); túmulo ou corpo do jogador com fumaça ou facho vermelho.

### VFX
- Corte carmim com rastro, feixe de sangue, explosões necromânticas; ataques inimigos com bolas de fogo sombrio, garras de sombra e projéteis venenosos verdes com rastro legível.

## Fora de escopo
- Carregador, atlas, lazy-loading e compressão (AES).
- Produção da arte e escolha de pacotes específicos (decisões 1 e 5).
- Mudar a mecânica de combate, telégrafos ou balance.

## Arquivos e contratos
- Esta parte não altera arquivos: define o que a arte cobre. Chaves de textura seguem `src/game/assets/assetManifest.json`; asset novo usa a mesma chave do gerador procedural (contrato de AES).
- Tamanhos máximos por frame: ver parte 4.

Critérios, verificação e pendências: [parte 6](06-criterios-e-pendencias.md).

## Referências
- [Assets externos e sprites](../discovery-assets-externos-e-sprites.md), [Mapeamento de sprites](../feature-mapeamento-de-sprites.md)
- [lighting-and-effects](../../../gameplay/lighting-and-effects.md), [asset-scripts](../../../operations/asset-scripts.md)
