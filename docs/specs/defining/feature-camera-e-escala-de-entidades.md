# Câmera, resolução lógica e escala de entidades

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Estado vs código:** verificado em 2026-10-11 (leitura estática): zoom adaptativo `clamp(altura/300, 1,8, 3,0)` com fator 0,87 abaixo de proporção 1,5 e zoom-out de chefe a 0,85x com lerp 0,04 por frame em `src/game/scenes/GameScene.ts` (~l.1066-1078); escala dos monstros vem de `scale` em `src/data/monsters.json` (0,85 a 2,8). Falta tudo o que está em Escopo (`grep -rn "1920" src` só acha tamanho de mapa/chunk).
**Origem:** dividida da spec feature-evolucao-de-ui-e-terreno (2026-10-11)

## Contexto
A câmera usa zoom por altura de tela, sem resolução lógica de UI. A escala dos monstros não tem relação com percentagem de tela. Esta spec cobre câmera e proporção visual das entidades. É independente das specs irmãs: [HUD](feature-hud-escala-e-personalizacao.md), [mira](feature-mira-e-alvo-inteligente.md) e [terreno](feature-terreno-rampas-e-estruturas.md). Orientação e controles: [ADR 0004](../../decisions/0004-controles-mobile-e-orientacao.md).

## Objetivo
Se aprovada, a câmera se adapta por proporção e densidade de tela, o zoom de chefe é suave e entidades ocupam uma fração definida da altura da tela.

## Decisões de que depende
| ADR | Assunto | Status |
|---|---|---|
| [0004](../../decisions/0004-controles-mobile-e-orientacao.md) | Controles mobile e orientação | Proposta |

## Fatos técnicos verificados
| Afirmação | Fonte | Verificado em |
|---|---|---|
| Zoom base `clamp(altura/300, 1,8, 3,0)`, x0,87 se proporção < 1,5 | `GameScene.ts` ~l.1070-1072 | 2026-10-11 |
| Zoom de chefe 0,85x, lerp 0,04 por frame, sem easing nomeado | `GameScene.ts` ~l.1074-1077 | 2026-10-11 |
| Não há resolução lógica de UI 1920x1080 | `grep -rn "1920" src` | 2026-10-11 |

## Decisões a confirmar
| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| 1 | Resolução virtual e multiplicador de densidade | A) manter zoom por altura; B) 1920x1080 x `devicePixelRatio` | A até haver problema medido em aparelho real |
| 2 | FOV horizontal e telas 4:3 | A) manter x0,87; B) distância de câmera x1,15 | A; revisar com teste em tablet |
| 4 | Proporção de entidades (a parte de hitbox +30% está na [spec de mira](feature-mira-e-alvo-inteligente.md)) | A) aplicar a tabela proposta; B) manter `monsters.json` | B até playtest |
| 7 | Motor gráfico | A) Phaser 2D; B) Mesh/Three.js; C) Unity/Godot | A; B só com requisito visual concreto |

## Escopo
Tudo depende das decisões acima; valores vêm da proposta original.
- Resolução lógica 1920x1080, escala `clamp(largura/1920, 0,5, 2,5) x devicePixelRatio`; 4:3 com câmera x1,15.
- Câmera: inclinação 45 a 50 graus, FOV vertical 35 a 40 graus.
- Zoom de chefe de 12%-15% em 1,2 s com `Cubic.Out`, com retorno suave ao derrotar.
- Ocupação vertical: props 2%-4%, minions 5%-7%, herói 8%-10%, elites 12%-15%, chefes 20%-35%.

## Fora de escopo
Migração de motor (decisão 7 = A); joystick flutuante e orientação (ADR 0004); HUD, mira e terreno (specs irmãs).

## Arquivos e contratos
- Alterar (conforme decisões): `src/game/scenes/GameScene.ts` (zoom; extrair função de zoom para `src/game/systems/`), `src/data/monsters.json` só com a decisão 4.
- Não tocar: `src/components/GameplayHUD.tsx`, `Player.ts`, geradores de terreno. Arquivos de alto risco só conforme `docs/engineering/risky-files.md`.
- Contratos e valores: os da seção Escopo.
- Atualizar no mesmo commit: [hud](../../ui/hud.md), [world-systems](../../architecture/world-systems.md) e `Verificado em`.

## Critérios de aceite
Todos provisórios; dependem das decisões 1, 2 e 7.
- **CE-1** Quando a tela é redimensionada, a GameScene deve recalcular o zoom da câmera a partir da resolução lógica (provisório).
- **CE-2** Enquanto a proporção da tela é menor que 1,5, a GameScene deve aplicar o ajuste de câmera de 4:3 (provisório).
- **CE-3** Quando um chefe fica ativo, a GameScene deve afastar a câmera de 12% a 15% em 1,2 s com `Cubic.Out` (provisório).
- **CE-4** Quando o chefe é derrotado, a GameScene deve devolver o zoom ao valor base de forma suave (provisório).

## Plano de verificação
| Critério | Como verificar |
|---|---|
| CE-1 a CE-4 | teste unitário da função de zoom extraída; manual em aparelho (não validado: precisa de playtest humano) |

## Questões em aberto
- Se o zoom de chefe de 12%-15% substitui o 15% atual (0,85x) ou o complementa.
- Se a tabela de ocupação vertical substitui o `scale` de `monsters.json`, e como migrá-lo; a ocupação não tem critério até a decisão 4.
- Requisito visual que justifique motor diferente do Phaser 2D (decisão 7).

## Pendências para promover a backlog
- Aprovação do responsável.
- Decisões 1, 2, 4 e 7 respondidas; ADR 0004 aprovado.
- Questões em aberto resolvidas; critérios sem a marca (provisório).

## Referências
[hud](../../ui/hud.md) · [world-systems](../../architecture/world-systems.md) · [0004](../../decisions/0004-controles-mobile-e-orientacao.md)
