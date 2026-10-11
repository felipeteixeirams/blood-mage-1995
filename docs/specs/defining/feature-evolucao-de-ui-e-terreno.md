# Resolução adaptativa, UI mobile e terreno 2.5D

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Estado vs código:** verificado em 2026-10-11 (leitura estática): existem terreno por heightmap (`HeightmapGenerator.ts`: `isoToScreen`, `screenToIso`, `calculateIsometricDepth`, `isTraversable`, `samplePoissonDisk`) usado por `DungeonGenerator.ts`, `Enemy.ts` e `Projectile.ts`; zoom adaptativo `clamp(altura/300, 1.8, 3.0)` com fator 0,87 abaixo de proporção 1,5 e zoom-out de chefe a 0,85x com lerp 0,04 por frame (`GameScene.ts` ~l.1066-1078); classes `safe-area-*` em `src/index.css` usadas em `GameplayHUD.tsx` (topo, esquerda, direita e também no canto inferior, l.547/575); `virtualStickScale`, `leftHandedMode`, `floatingStick`, `virtualControlsOpacity` (`src/types/game.ts`); alvo automático com histerese e retículo (`Player.findBestTarget`, `renderTargetLockReticle`). Faltam tudo o que está em Escopo (`grep -rn "1920" src` só acha tamanho de mapa/chunk).

## Contexto
A câmera usa zoom por altura de tela, sem resolução lógica de UI. A escala dos monstros vem de `scale` em `src/data/monsters.json` (0,85 a 2,8), sem relação com percentagem de tela. `findBestTarget` usa histerese por alcance (1,2x) e cone frontal, sem pesos de HP ou ameaça. O gerador de terreno só usa regra de conectividade por |delta Z| (`HeightmapGenerator.isTraversable`). Controles e orientação: [ADR 0004](../../decisions/0004-controles-mobile-e-orientacao.md).

## Objetivo
Se aprovada, a UI e a câmera se adaptam por proporção e densidade de tela, o HUD é personalizável e o terreno 2.5D ganha estruturas, rampas e navegação com custo de elevação.

## Decisões de que depende
| ADR | Assunto | Status |
|---|---|---|
| [0002](../../decisions/0002-geracao-de-terreno-e-piso.md) | Geração de terreno, piso e autotiling | Proposta |
| [0004](../../decisions/0004-controles-mobile-e-orientacao.md) | Controles mobile e orientação | Proposta |

## Fatos técnicos verificados
| Afirmação | Fonte | Verificado em |
|---|---|---|
| Zoom base `clamp(altura/300, 1,8, 3,0)`, x0,87 se proporção < 1,5 | `GameScene.ts` ~l.1070-1072 | 2026-10-11 |
| Zoom de chefe 0,85x, lerp 0,04 por frame, sem easing nomeado | `GameScene.ts` ~l.1074-1077 | 2026-10-11 |
| `findBestTarget` retorna o alvo travado se dentro de 1,2x do alcance | `Player.ts` ~l.776-786 | 2026-10-11 |
| Safe area já aplicada ao canto inferior (cluster de ações e joystick) | `GameplayHUD.tsx` l.547, 575; `index.css` l.69-82 | 2026-10-11 |
| Margens atuais: 16 px vertical, 20 px horizontal | `src/index.css` l.69-79 | 2026-10-11 |
| Não há resolução lógica de UI 1920x1080 | `grep -rn "1920" src` | 2026-10-11 |

## Decisões a confirmar
| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| 1 | Resolução virtual e multiplicador de densidade | A) manter zoom por altura; B) 1920x1080 x `devicePixelRatio` | A até haver problema medido em aparelho real |
| 2 | FOV horizontal e telas 4:3 | A) manter x0,87; B) distância de câmera x1,15 | A; revisar com teste em tablet |
| 3 | Escala/opacidade/diâmetro/posição do HUD | A) tudo; B) só o que já existe | B; o resto depende de playtest mobile |
| 4 | Proporção de entidades e hitbox +30% | A) aplicar a tabela proposta; B) manter `monsters.json` | B até playtest |
| 5 | Pontuação de alvo (distância, HP, ameaça) | A) fórmula proposta; B) histerese atual | Propor pesos com o responsável |
| 6 | Terreno: carimbo de estruturas, rampas, A* 3D | A) fazer; B) adiar | B; o gerador atual só usa conectividade |
| 7 | Motor gráfico | A) Phaser 2D; B) Mesh/Three.js; C) Unity/Godot | A; B só com requisito visual concreto |

## Escopo
Tudo depende das decisões acima; valores abaixo vêm da proposta original.
- Resolução lógica 1920x1080, escala `clamp(largura/1920, 0,5, 2,5) x devicePixelRatio`; 4:3 com câmera x1,15.
- Margens `env(safe-area-inset-*)` de 16 px (vertical) e 24 px (horizontal); minimapa e status no canto superior esquerdo, habilidades no inferior direito, joystick no inferior esquerdo.
- HUD: escala global 80%-120%, opacidade 30%-100%, botões de 48 a 72 px, âncoras livres de joystick e feitiços.
- Câmera: inclinação 45 a 50 graus, FOV vertical 35 a 40 graus; zoom de chefe de 12%-15% em 1,2 s com `Cubic.Out`, com retorno suave ao derrotar.
- Ocupação vertical: props 2%-4%, minions 5%-7%, herói 8%-10%, elites 12%-15%, chefes 20%-35%.
- Hitbox +30%; pontuação `w1/distância + w2 x (1 - HP/HPmax) + w3 x ameaça` (chefe 3,0, elite 2,0, minion 1,0).
- Terreno: estruturas por carimbo 4x4 ou 6x6 em áreas planas dos níveis 1 e 2; variante gráfica de rampa com |delta Z| = 1; falésia intransitável com |delta Z| >= 2; A* com custo de elevação.

## Fora de escopo
Migração de motor (decisão 7 = A); alterar o joystick flutuante e a orientação (ADR 0004); gerador de mundo contínuo ([topologia](feature-topologia-de-mundo-continuo.md)).

## Arquivos e contratos
- Alterar (conforme decisões): `src/game/scenes/GameScene.ts` (zoom), `src/components/GameplayHUD.tsx`, `src/index.css`, `src/types/game.ts` e `src/utils/localStorage.ts` (novas configurações, com schema Zod), `src/game/objects/Player.ts` (`findBestTarget`), `src/game/systems/HeightmapGenerator.ts` e `DungeonGenerator.ts` (rampas, carimbo, A*).
- Não tocar: `src/data/monsters.json` sem a decisão 4; arquivos de alto risco só conforme `docs/engineering/risky-files.md`.
- Contratos e valores: os da seção Escopo; pesos `w1`, `w2`, `w3` em Questões em aberto.
- Atualizar no mesmo commit: [hud](../../ui/hud.md), [world-generation](../../gameplay/world-generation.md), [world-systems](../../architecture/world-systems.md) e `Verificado em`.

## Critérios de aceite
Todos provisórios; dependem das decisões 1 a 6.
- **UT-1** Quando a tela é redimensionada, a GameScene deve recalcular o zoom da câmera a partir da resolução lógica (provisório).
- **UT-2** Enquanto a proporção da tela é menor que 1,5, a GameScene deve aplicar o ajuste de câmera de 4:3 (provisório).
- **UT-3** Quando um chefe fica ativo, a GameScene deve afastar a câmera de 12% a 15% em 1,2 s com `Cubic.Out` (provisório).
- **UT-4** Quando o chefe é derrotado, a GameScene deve devolver o zoom ao valor base de forma suave (provisório).
- **UT-5** O HUD React deve manter os elementos fora das áreas de safe area com as margens de 16 px e 24 px (provisório).
- **UT-6** Quando o jogador altera a escala do HUD, o HUD React deve aplicá-la entre 80% e 120% e persisti-la pelo `localStorage.ts` (provisório).
- **UT-7** Se o valor de escala salvo estiver fora de 80%-120%, então o localStorage deve usar o padrão (provisório).
- **UT-8** Quando o jogador usa toque, o Player deve aplicar hitbox de alvo +30% (provisório).
- **UT-9** Quando há vários alvos, o Player deve escolher o de maior pontuação `w1/distância + w2 x (1 - HP/HPmax) + w3 x ameaça` (provisório).
- **UT-10** Quando |delta Z| = 1 entre tiles vizinhos, o HeightmapGenerator deve marcar a rampa como transitável com variante gráfica (provisório).
- **UT-11** Se |delta Z| >= 2 entre tiles vizinhos, então o HeightmapGenerator deve marcar a falésia como intransitável (provisório).
- **UT-12** O DungeonGenerator deve carimbar estruturas 4x4 ou 6x6 somente em áreas planas dos níveis 1 e 2 (provisório).

## Plano de verificação
| Critério | Como verificar |
|---|---|
| UT-1 a UT-4 | teste unitário da função de zoom extraída; manual em aparelho (não validado: precisa de playtest humano) |
| UT-5 | inspeção de `GameplayHUD.tsx`; manual em aparelho com notch |
| UT-6, UT-7 | teste de schema em `localStorage.ts` |
| UT-8, UT-9 | teste unitário de `Player.findBestTarget`; sensação de mira: não validado, precisa de playtest humano |
| UT-10, UT-11 | teste em `HeightmapGenerator.test.ts` |
| UT-12 | teste em `DungeonGenerator.test.ts` |

## Questões em aberto
- Pesos `w1`, `w2`, `w3` da pontuação de alvo.
- Margem de safe area: a proposta traz 24 px horizontal; o código usa 20 px.
- Se a tabela de ocupação vertical substitui o `scale` de `monsters.json`, e como migrá-lo.
- Se o zoom de chefe de 12%-15% substitui o 15% atual (0,85x) ou o complementa.
- Fórmula e custo do A* com elevação; tamanho final das estruturas e o que contêm.
- Requisito visual que justifique motor diferente do Phaser 2D (decisão 7).

## Pendências para promover a backlog
- Aprovação do responsável.
- Decisões 1 a 7 respondidas; ADRs 0002 e 0004 aprovados.
- Questões em aberto resolvidas; critérios sem a marca (provisório).
- Dividir em specs menores (câmera/HUD, mira, terreno): hoje é um épico.

## Referências
[hud](../../ui/hud.md) · [modals-and-screens](../../ui/modals-and-screens.md) · [world-generation](../../gameplay/world-generation.md) · [world-systems](../../architecture/world-systems.md) · [0002](../../decisions/0002-geracao-de-terreno-e-piso.md) · [0004](../../decisions/0004-controles-mobile-e-orientacao.md)
