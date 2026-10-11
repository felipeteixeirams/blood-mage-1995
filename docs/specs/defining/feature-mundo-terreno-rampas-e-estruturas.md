# Terreno 2.5D: rampas, falésias, estruturas e A* com elevação

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Estado vs código:** verificado em 2026-10-11 (leitura estática): terreno por heightmap em `src/game/systems/HeightmapGenerator.ts` (`isoToScreen`, `screenToIso`, `calculateIsometricDepth`, `isTraversable` por |delta Z|, `samplePoissonDisk`) usado por `DungeonGenerator.ts`, `Enemy.ts` e `Projectile.ts`. Faltam variante gráfica de rampa, carimbo de estruturas e A* com custo de elevação.
**Origem:** dividida da spec feature-evolucao-de-ui-e-terreno (2026-10-11)

## Contexto
O gerador só usa regra de conectividade por |delta Z| (`HeightmapGenerator.isTraversable`). Independente das specs de [câmera](feature-grafico-camera-e-escala-de-entidades.md), [HUD](feature-ui-hud-escala-e-personalizacao.md) e [mira](feature-controles-mira-e-alvo-inteligente.md). Relaciona-se com o [mundo contínuo](feature-mundo-topologia-continua.md).

## Objetivo
Se aprovada, o terreno 2.5D ganha rampas, falésias, estruturas por carimbo e navegação com custo de elevação.

## Decisões de que depende
| ADR | Assunto | Status |
|---|---|---|
| [0002](../../decisions/0002-geracao-de-terreno-e-piso.md) | Geração de terreno, piso e autotiling | Proposta |

## Fatos técnicos verificados
| Afirmação | Fonte | Verificado em |
|---|---|---|
| Conectividade só por |delta Z| em `isTraversable` | `HeightmapGenerator.ts` | 2026-10-11 |

## Decisões a confirmar
| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| 6 | Terreno: carimbo de estruturas, rampas, A* 3D | A) fazer; B) adiar | B; o gerador atual só usa conectividade |

## Escopo
Depende da decisão 6; valores vêm da proposta original.
- Estruturas por carimbo 4x4 ou 6x6 em áreas planas dos níveis 1 e 2.
- Variante gráfica de rampa com |delta Z| = 1; falésia intransitável com |delta Z| >= 2.
- A* com custo de elevação.

## Fora de escopo
Gerador de mundo contínuo ([topologia](feature-mundo-topologia-continua.md)); câmera, HUD e mira (specs irmãs).

## Arquivos e contratos
- Alterar (conforme decisão 6): `src/game/systems/HeightmapGenerator.ts` e `DungeonGenerator.ts` (rampas, carimbo, A*), com testes em `HeightmapGenerator.test.ts` e `DungeonGenerator.test.ts`.
- Não tocar: `GameplayHUD.tsx`, `Player.ts`; arquivos de alto risco só conforme `docs/engineering/risky-files.md`.
- Contratos e valores: os da seção Escopo.
- Atualizar no mesmo commit: [world-generation](../../gameplay/world-generation.md), [world-systems](../../architecture/world-systems.md) e `Verificado em`.

## Critérios de aceite
Todos provisórios; dependem da decisão 6 e do ADR 0002.
- **TR-1** Quando |delta Z| = 1 entre tiles vizinhos, o HeightmapGenerator deve marcar a rampa como transitável com variante gráfica (provisório).
- **TR-2** Se |delta Z| >= 2 entre tiles vizinhos, então o HeightmapGenerator deve marcar a falésia como intransitável (provisório).
- **TR-3** O DungeonGenerator deve carimbar estruturas 4x4 ou 6x6 somente em áreas planas dos níveis 1 e 2 (provisório).

## Plano de verificação
| Critério | Como verificar |
|---|---|
| TR-1, TR-2 | teste em `HeightmapGenerator.test.ts` |
| TR-3 | teste em `DungeonGenerator.test.ts` |

## Questões em aberto
- Fórmula e custo do A* com elevação; sem critério até a definição.
- Tamanho final das estruturas (4x4 ou 6x6) e o que contêm.
- Se rampa/falésia e carimbo devem ser entregues separados (corte possível, a confirmar).

## Pendências para promover a backlog
- Aprovação do responsável.
- Decisão 6 respondida; ADR 0002 aprovado.
- Questões em aberto resolvidas (A*, estruturas); critérios sem a marca (provisório).

## Referências
[world-generation](../../gameplay/world-generation.md) · [world-systems](../../architecture/world-systems.md) · [0002](../../decisions/0002-geracao-de-terreno-e-piso.md)
