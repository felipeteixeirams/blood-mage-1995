# 0002 — Geração de terreno, piso e autotiling

**Mestre:** [decisions](README.md)
**Status:** Proposta
**Proposta por:** Claude (Sonnet 5.5), 2026-10-10
**Aprovada por:**

## Contexto
Três escolhas técnicas de terreno existem no código sem decisão registrada:

1. **Ruído de elevação.** `HeightmapGenerator` (`src/game/systems/HeightmapGenerator.ts`, semente padrão 1995) usa *value noise*: hash por ponto de malha (`hashLattice`) interpolado bilinearmente com `smoothstep` (`pseudoNoise`). `getHeightAt` combina uma frequência macro (0,08, peso 0,7) e uma micro (0,25, peso 0,3) e quantiza em 0..4. O comentário da classe fala em "Simplex aproximado", o que não corresponde à implementação.
2. **Piso e elevação, com duas políticas diferentes:**
   - Floresta (`gloomy_woods`, `ProceduralForestGenerator.ts`): a textura `forest_grass` é um retângulo 64x32 **opaco** (`:185-200`), tiles em passo de meia largura/altura sobrepostos; o sprite do piso fica em `isoY` e a elevação **não** desloca o Y do piso (`renderY` só afeta falésias e props, `:499`).
   - Masmorras e Safe House (`DungeonGenerator.ts:182-190`): passo 48x24, o tile é posicionado em `renderY = y - zElevation*2`, ou seja, a elevação **desloca** o Y do piso; `tile_ground` é um losango 64x32 com cantos transparentes (`textureGenerator.ts:62-66`).
3. **Autotiling.** `DungeonGenerator.calculateBitmask` (`:586`) calcula máscara de 4 vizinhos cardinais (N=1, L=2, S=4, O=8, valores 0..15); `getGroundTextureKey` mapeia explicitamente 9 valores (3, 6, 7, 9, 11, 12, 13, 14, 15) para texturas `tile_ground_edge_*`/`corner_*`/variantes centrais; os outros 7 valores caem em `edge_n`. O termo "Wang" não aparece no código.

Existir no código não é decisão: nenhuma dessas políticas foi ratificada.

## Opções
| Opção | Prós | Contras |
|---|---|---|
| A. Manter como está e registrar as restrições (piso da floresta opaco, sem deslocar Y; masmorra com deslocamento) | Zero custo; o comentário da floresta documenta um defeito visual causado por sobreposição | Duas políticas de elevação para o mesmo conceito |
| B. Unificar a política do piso (mesma regra em floresta e masmorra) | Consistência; menos casos | Retrabalho visual em dois geradores; risco de reabrir os buracos entre tiles que o código diz ter corrigido |
| C. Trocar a máscara de 4 bits por autotile de 8 vizinhos (blob) | Cantos internos corretos; cobre os 7 valores hoje sem mapeamento | Mais texturas procedurais; mexe em `DungeonGenerator.ts` (arquivo crítico) |
| D. Trocar o value noise por Simplex/Perlin de biblioteca | Ruído de melhor qualidade | Nova dependência; muda o terreno determinístico de semente 1995 |

## Fatos técnicos verificados
| Afirmação | Fonte | Verificado em |
|---|---|---|
| `pseudoNoise` é value noise com interpolação bilinear e `smoothstep` | `HeightmapGenerator.ts:104-140` | 2026-10-10 |
| `getHeightAt` = 0,7*macro(0,08) + 0,3*micro(0,25), quantizado em 0..4 | `HeightmapGenerator.ts` (`getHeightAt`) | 2026-10-10 |
| `DungeonGenerator` instancia `HeightmapGenerator(1995)` | `DungeonGenerator.ts:68` | 2026-10-10 |
| `forest_grass` é 64x32 opaco; comentário diz que losango abre buracos na sobreposição | `ProceduralForestGenerator.ts:185-200` | 2026-10-10 |
| Piso da floresta em `isoY`; `renderY = isoY - z*2` usado só para falésias | `ProceduralForestGenerator.ts:487-502` | 2026-10-10 |
| Piso da masmorra usa `renderY = y - z*2` | `DungeonGenerator.ts:188-193` | 2026-10-10 |
| Máscara de 4 vizinhos e mapeamento de 9 valores | `DungeonGenerator.ts:586-651` | 2026-10-10 |

## Suposições (não verificadas)
- Que os buracos entre tiles descritos nos comentários realmente ocorrem com losango ou com deslocamento de Y (leitura estática; nenhuma execução).
- Que as 7 máscaras sem mapeamento ocorrem em mapas reais (mapas BSP+autômato podem não gerá-las).

## Recomendação
**Opção A.** É o que o código faz e o comentário registra a causa visual das restrições; só vale unificar (B/C) se houver queixa visual concreta, que não foi observada.

## Decisão
_Em branco até o responsável decidir._

## Consequências
- Se A: registrar a restrição em `docs/architecture/` (arquivo de geração de terreno) e corrigir o comentário "Simplex" no código.
- Se B/C/D: spec própria; `DungeonGenerator.ts` é arquivo crítico (ver `docs/critical/README.md`); testes `HeightmapGenerator.test.ts`, `DungeonGenerator.test.ts` e `TerrainTraversability.test.ts` precisam ser revistos.
