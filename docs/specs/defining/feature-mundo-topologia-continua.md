# Topologia de mundo contínuo e variedade orgânica (padrão Dungeon Siege)

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Classe:** C
**Depende de:** ADR 0002, ADR 0003
**Estado vs código:** verificado em 2026-10-11 (leitura estática + `grep`): existe `src/game/systems/PathDrivenGenerator.ts` (random walk Sul->Norte, trilha de largura variável, clareiras, preenchimento do negativo, `injectCabin`/`injectLake`/`injectCaveEntrance`, `PathZone` `forest_trail|lake|ruins|cave_entrance`, `isWaterTileAt`) com `PathDrivenGenerator.test.ts`, instanciado em `DungeonGenerator.pathDrivenGenerator` (l.68); lentidão de 30% em água em `Player.ts` (~l.282) e `Enemy.ts` (~l.618); mapeamento habitat->monstro em `DungeonFlowController.ts` (~l.489-510); `hasLineOfSight` (`DungeonGenerator`, `GameScene.ts` l.958, usado no aggro). Falta: nada chama `PathDrivenGenerator.generate()` fora dos testes, então `lastZones` fica vazio, a lentidão em água nunca dispara e o mapeamento nunca escolhe outro monstro; `DungeonGenerator.generate()` usa `ProceduralForestGenerator` em `gloomy_woods` (l.82-85) e BSP/autômato nos demais biomas; sem `injectSetpiece(x, y, type)` genérico; sem queda de iluminação no covil (só um arco de paredes); sem fauna além dos monstros do mapeamento.

## Contexto
`DungeonGenerator.ts` gera cada andar como arena (BSP + autômato celular; `gloomy_woods` delega ao `ProceduralForestGenerator`). A proposta: o jogador nasce numa arena, limpa, acha o portal e segue, sem sensação de jornada (avaliação de design, não verificada). O alvo é um mundo contínuo no estilo Dungeon Siege: trilha semi-linear, micro-ambientes híbridos sem loading, fauna por habitat e obstáculos orgânicos (rios rasos, desníveis, passagens estreitas). O código já tem mundo contínuo por chunks (`ChunkStreamer` + limites dinâmicos em `DungeonFlowController`), tratado no [ADR 0003](../../decisions/0003-mundo-continuo-e-geradores-de-floresta.md). Os dois geradores concorrentes do mesmo bioma estão registrados em comentário no próprio `DungeonGenerator.ts` (l.8-14).

## Objetivo
Se aprovada, a floresta é gerada como trilha contínua com clareiras e setpieces, os inimigos nascem conforme o habitat e a visão é bloqueada por árvores e paredes.

## Decisões de que depende
| ADR | Assunto | Status |
|---|---|---|
| [0003](../../decisions/0003-mundo-continuo-e-geradores-de-floresta.md) | Mundo contínuo (ChunkStreamer) e escolha entre `ProceduralForestGenerator` e `PathDrivenGenerator` | Proposta |
| [0002](../../decisions/0002-geracao-de-terreno-e-piso.md) | Geração de terreno e piso | Proposta |

## Fatos técnicos verificados
| Afirmação | Fonte | Verificado em |
|---|---|---|
| `PathDrivenGenerator.generate()` só é chamado em testes; `lastZones` só é preenchido por ele | `grep -rn "pathDrivenGenerator\." src`; `PathDrivenGenerator.ts` l.60, 181 | 2026-10-11 |
| `gloomy_woods` usa `ProceduralForestGenerator`; `pathDrivenGenerator` é instanciado e não usado | `DungeonGenerator.ts` l.68, 82-85 | 2026-10-11 |
| Água reduz a velocidade em 30% (x0,70) | `Player.ts` ~l.282; `Enemy.ts` ~l.618 | 2026-10-11 |
| Cabana registra zona `ruins` (raio 100); covil registra `cave_entrance` (raio 140) | `PathDrivenGenerator.ts` l.243, 326 | 2026-10-11 |
| Mapeamento: `lake`, `ruins`, `cave_entrance`, padrão `scout_beast` | `DungeonFlowController.ts` ~l.489-510 | 2026-10-11 |
| `hasLineOfSight` usa raycast contra `wallsGroup` e é chamado no aggro | `GameScene.ts` l.958, 985, 1608 | 2026-10-11 |

## Decisões a confirmar
| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| 1 | Gerador de `gloomy_woods` e dos demais biomas | A) `PathDrivenGenerator` substitui o BSP/`ProceduralForestGenerator`; B) complementa (só floresta); C) manter o atual e remover o novo | B: ativa o que já existe e testa na floresta antes de substituir |
| 2 | Micro-ambientes e ecologia por habitat | A) fazer; B) adiar | A depois da decisão 1, pois dependem das zonas |
| 3 | Oclusão de visão dinâmica | A) só o raycast existente; B) FOV dinâmico | A: já cobre aggro; B é escopo novo |
| 4 | Relação com o mundo contínuo por `ChunkStreamer` | A) trilha dentro de cada chunk; B) substituir o streamer | A: o texto original cita decisão do responsável não registrada; confirmar |
| 5 | Lentidão na água: 15% (§3.B original) ou 30% (tarefa 2 e código) | A) 30%; B) 15% | A: é o valor do código |

## Escopo
- Chamar `PathDrivenGenerator.generate()` em produção, conforme decisão 1, de modo que `lastZones` seja preenchido.
- Trilha com espessura variável: corredor estreito de 2 tiles e clareira de 15x15 tiles; todo o negativo preenchido com obstáculos sólidos (já existe no gerador, falta ativar).
- `injectSetpiece(x, y, type)` genérico; setpieces: cabana (4 paredes, 1 porta, 1 baú), lago raso (lentidão da decisão 5) e entrada do covil com queda de iluminação sem trocar de cena.
- Ecologia: tabela habitat -> monstro (`forest_trail`: `scout_beast` e lobos futuros; `lake`: monstros tentaculares, slimes, sapos ou abominações da água; `ruins`: `skeleton_warrior`, `cultist_acolyte`), com o spawn varrendo as zonas do gerador. Lobos, aquáticos e `cultist_acolyte` em `ruins` dependem de decisão e arte.
- Árvores densas e paredes de setpieces registradas em `wallsGroup`; inimigo sem linha de visão não entra em aggro.

## Fora de escopo
- Mundo seamless completo estilo Dungeon Siege (decisão 4 = B); novos monstros e arte; porão e cripta ligados à cabana; rios como obstáculos de combate além da lentidão.

## Arquivos e contratos
- Alterar: `src/game/systems/DungeonGenerator.ts` (`generate()`), `src/game/systems/PathDrivenGenerator.ts` (`injectSetpiece`, iluminação do covil), `src/game/systems/DungeonFlowController.ts` (spawn por zona), `src/game/scenes/GameScene.ts` (só se a oclusão exigir).
- Contrato das zonas: `PathZone { x, y, radius, type: 'forest_trail' | 'lake' | 'ruins' | 'cave_entrance' }` em `lastZones`, em coordenadas de mundo.
- Testes: `PathDrivenGenerator.test.ts`, `DungeonGenerator.test.ts`, `DungeonFlowController.test.ts`.
- Atualizar no mesmo commit: [world-generation](../../gameplay/world-generation.md), [world-systems](../../architecture/world-systems.md), [campaign](../../gameplay/campaign.md) e `Verificado em`.
- Não tocar: `ChunkStreamer.ts` (decisão 4 = A); arquivos de alto risco só conforme `docs/engineering/risky-files.md`.

## Critérios de aceite
Todos provisórios; dependem das decisões 1 a 5.
- **TM-1** Quando um chunk de floresta é gerado, o DungeonGenerator deve invocar o `PathDrivenGenerator.generate()` (provisório).
- **TM-2** Quando `generate()` termina, o PathDrivenGenerator deve expor `lastZones` com ao menos uma zona (provisório).
- **TM-3** O PathDrivenGenerator deve gerar uma trilha contínua do Sul ao Norte sem tiles transitáveis desconectados dela (provisório).
- **TM-4** O PathDrivenGenerator deve preencher todo tile fora da trilha com obstáculo sólido (provisório).
- **TM-5** Quando uma zona `lake` é criada, o PathDrivenGenerator deve marcar seus tiles como água (provisório).
- **TM-6** Enquanto o Player ou o Enemy está sobre água, o sistema deve reduzir a velocidade de movimento em 30% (provisório).
- **TM-7** Quando o spawn ocorre dentro de uma zona, o DungeonFlowController deve escolher o monstro pelo tipo da zona (provisório).
- **TM-8** Se a posição de spawn não está em nenhuma zona, então o DungeonFlowController deve usar `scout_beast` (provisório).
- **TM-9** Se `lastZones` está vazio, então o DungeonFlowController deve fazer o spawn padrão sem lançar exceção (provisório).
- **TM-10** Quando `injectSetpiece(x, y, 'cabin')` é chamado, o PathDrivenGenerator deve criar 4 paredes, 1 porta e 1 baú (provisório).
- **TM-11** Quando o jogador entra na zona `cave_entrance`, a GameScene deve reduzir a iluminação sem trocar de cena (provisório).
- **TM-12** Se não há linha de visão entre o inimigo e o jogador, então o Enemy não deve entrar em aggro (provisório).

## Plano de verificação
| Critério | Como verificar |
|---|---|
| TM-1, TM-2, TM-5 | `DungeonGenerator.test.ts` e `PathDrivenGenerator.test.ts` com cena simulada |
| TM-3, TM-4 | teste de conectividade (flood fill) em `PathDrivenGenerator.test.ts` |
| TM-6 | teste unitário de velocidade em `Player`/`Enemy` com `isWaterTileAt` simulado |
| TM-7 a TM-9 | `DungeonFlowController.test.ts` com `lastZones` simulado, preenchido e vazio |
| TM-10 | teste do setpiece contando paredes, porta e baú |
| TM-11 | passo manual; sensação visual: não validado, precisa de playtest humano |
| TM-12 | teste com `hasLineOfSight` simulado; manual na cabana |

## Questões em aberto
- Nome exato e comportamento dos monstros de `lake` e `ruins` além dos já mapeados; chance de spawn por habitat.
- Quanto a iluminação cai no covil (valor); testar em mais de um bioma (regra do repositório).
- Como o gerador por trilha se encaixa no chunk de 1920x1440 e nas fronteiras do `ChunkStreamer`.
- Se `PathDrivenGenerator` cobre os demais biomas (hoje só a floresta é proposta).
- Fato a verificar: custo de desempenho da geração por trilha no mobile (ADR 0013).

## Pendências para promover a backlog
- Aprovação do responsável.
- Decisões 1 a 5 respondidas; ADRs 0002 e 0003 aprovados.
- Questões em aberto resolvidas; critérios sem a marca (provisório).
- Desempenho verificado.

## Referências
[world-generation](../../gameplay/world-generation.md) · [world-systems](../../architecture/world-systems.md) · [campaign](../../gameplay/campaign.md) · [0002](../../decisions/0002-geracao-de-terreno-e-piso.md) · [0003](../../decisions/0003-mundo-continuo-e-geradores-de-floresta.md) · [0013](../../decisions/0013-metas-de-performance.md)
