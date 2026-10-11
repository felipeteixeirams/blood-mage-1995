# 0003 — Mundo contínuo (ChunkStreamer) e geradores da floresta

**Mestre:** [decisions](README.md)
**Status:** Proposta
**Proposta por:** Claude (Sonnet 5.5), 2026-10-10
**Aprovada por:**
**Specs afetadas:** [feature-mundo-topologia-continua](../specs/defining/feature-mundo-topologia-continua.md)

## Contexto
**Streaming de chunks.** `ChunkStreamer` (`src/game/systems/ChunkStreamer.ts`) é uma janela deslizante de chunks ordenados. `DungeonFlowController` o instancia com 5 chunks de 1920x1440 (`safe_house`, `gloomy_woods`, `fosso_chagas`, `catacumbas_martires`, `santuario_sangue`). O que o código faz hoje **contradiz os próprios comentários**:

- Comentários dizem "prova de conceito isolada" (`ChunkStreamer.ts:6`) e "`onLoad`/`onUnload` são no-ops nesta fase" (`DungeonFlowController.ts:55-63`).
- O código: `onLoad` chama `loadChunkBiome`, que gera conteúdo real (`dungeonGenerator.generate(...)`, troca bioma de luz/pós-processamento) e `onUnload` destrói paredes/baús/props do chunk (`DungeonFlowController.ts:66-77`, `:144-190`); `GameScene.update()` chama `updateChunkStream(player.x)` todo frame (`GameScene.ts:1504`), que também ajusta os limites do mundo (`syncWorldBoundsWithStreamer`, `:131`) e mistura iluminação/pós-processamento nas fronteiras (`updateBoundaryTransitions`, "Fase C", `:88`).
- A spec citada nos comentários (`docs/specs/in-progress/25_MUNDO_CONTINUO_CHUNK_STREAMING.md`) não existe; `docs/specs/in-progress/` não tem spec. O gatilho de avanço de zona na campanha continua sendo o portal (`getNextCampaignZone`, `:221`).

**Dois geradores para `gloomy_woods`.** `DungeonGenerator.generate()` delega esse bioma a `ProceduralForestGenerator` (`DungeonGenerator.ts:83-86`). `PathDrivenGenerator` (topologia por caminhos, lago, ruínas) é instanciado no construtor (`:69`) mas `generate()` dele nunca é chamado fora de testes. Consequências em runtime: `waterTiles` e `lastZones` ficam vazios, logo a penalidade de 30% de velocidade na água (`Player.ts:282`, `Enemy.ts:618`) nunca se aplica e o mapeamento de ecologia por zonas (`DungeonFlowController.ts:492`) usa lista vazia. Um comentário no código (`DungeonGenerator.ts:8-12`, `:79-82`) chama isso de "decisão pendente" e remete a `docs/reviews/03_AUDITORIA_BASE_DOCUMENTAL_2026_09.md`, que não existe.

Existir no código não é decisão.

## Opções
| Opção | Prós | Contras |
|---|---|---|
| A. Streaming: manter a integração atual, corrigir os comentários/docs e escrever a spec que falta | Reflete o que roda | Comportamento em runtime não validado; `GameScene.ts` e `DungeonFlowController.ts` são sensíveis |
| B. Streaming: reverter para um bioma por vez (sem janela de chunks) | Menos superfície | Remove código que já roda; contradiz a direção "mundo contínuo" |
| C. Floresta: manter `ProceduralForestGenerator` e remover `PathDrivenGenerator` (e a penalidade de água) | Elimina código morto e comportamento nunca ativo | Perde a ideia de lagos/zonas; remove testes |
| D. Floresta: migrar `gloomy_woods` para `PathDrivenGenerator` | Ativa água, zonas e ecologia | Reescreve o bioma validado; risco visual e de balanceamento |
| E. Floresta: manter os dois como estão | Nenhum trabalho | Código e regras (água) que nunca executam |

## Fatos técnicos verificados
| Afirmação | Fonte | Verificado em |
|---|---|---|
| `updateChunkStream` é chamado todo frame | `GameScene.ts:1504` | 2026-10-10 |
| `onLoad`/`onUnload` geram e destroem conteúdo | `DungeonFlowController.ts:66-77`, `:144-190` | 2026-10-10 |
| Comentários descrevem `onLoad`/`onUnload` como no-ops | `DungeonFlowController.ts:55-63`; `ChunkStreamer.ts:6` | 2026-10-10 |
| Chunks de 1920x1440, 5 biomas | `DungeonFlowController.ts:28-37` | 2026-10-10 |
| `PathDrivenGenerator` só é construído; `generate()` não é chamado em produção | `DungeonGenerator.ts:69`; `grep pathDrivenGenerator\.` sem outra chamada | 2026-10-10 |
| `waterTiles` só é preenchido dentro de `PathDrivenGenerator.generate` | `PathDrivenGenerator.ts:303` | 2026-10-10 |
| A spec 25 e `docs/reviews/` não existem | `ls docs/specs/in-progress`, `ls docs/reviews` | 2026-10-10 |

## Suposições (não verificadas)
- Que a janela de chunks funciona em runtime sem vazamento de objetos ao descarregar (nada foi executado).
- Que a floresta contínua se comporta bem com o streaming ligado (os comentários afirmam "validado ao vivo"; sem evidência no repositório).

## Recomendação
**A para o streaming e C para a floresta.** O streaming já roda e remover seria regressão; `PathDrivenGenerator` não influencia o jogo hoje, então removê-lo (ou decidir ativá-lo com spec) tira ambiguidade; o responsável deve decidir C ou D porque é escolha de design do bioma.

## Decisão
_Em branco até o responsável decidir._

## Consequências
- Se A: spec do mundo contínuo em `docs/specs/` (fases, critérios), correção dos comentários, teste de runtime com `phaser-4-playtest-harness`.
- Se C: remover `PathDrivenGenerator*`, `isWaterTileAt` em `Player.ts`/`Enemy.ts` (arquivos críticos) e o uso de `lastZones`.
- Se D: spec própria; reescrita do bioma.
- A spec `defining/arpg-continuous-world-topology.md` trata do tema e não é aprovada.
