# HUD de Gameplay: referências Diablo II e Dungeon Siege 1

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Estado vs código:** verificado em 2026-10-11 (leitura estática): já existem barras horizontais de vida e mana com moldura, textura e rebites, pulso de HP crítico e cinturão de curativos Z/X/V (`src/components/hud/PlayerStatus.tsx`: `FORGED_METAL_TEXTURE`, `BarRivet`, `isCriticalHp`, `CURATIVE_SLOTS`); marcador "!" sobre NPCs (`GameScene.createNpcMarker`/`clearNpcMarkers`, chamados por `DungeonFlowController.ts`); minimapa por geometria de salas (`Minimap.tsx`, respeita `minimapVisible`/`minimapAlpha`); `TargetFrame.tsx`, `SkillsOverlay.tsx`, `ContractHUD.tsx`. Faltam o menu contextual de alvo com mouse (`grep -rn "ENGAGE" src` sem resultados) e arte pintada à mão para o HUD (Tier C).

## Contexto
O HUD é React por cima do canvas ([hud](../../ui/hud.md)). A proposta fixa Diablo II como referência estética e Dungeon Siege 1 como referência estrutural (barras horizontais, sem orbes), o que o HUD atual já segue. `Enemy.ts` ainda aplica esquiva por chance (`effectiveDodge`, afixo `spectral`, ~l.357), o que contradiz a diretriz de esquiva manual e espacial proposta para o jogador.

## Objetivo
O HUD mantém a identidade visual proposta (barras horizontais forjadas, sem orbes) e ganha, se aprovados, menu contextual de alvo para mouse e arte de HUD pintada à mão.

## Decisões de que depende
| ADR | Assunto | Status |
|---|---|---|
| [0001](../../decisions/0001-ponte-phaser-react-so-zustand.md) | UI só em React, ponte só por Zustand (vale para o menu de alvo e o marcador de NPC) | Proposta |

## Fatos técnicos verificados
| Afirmação | Fonte | Verificado em |
|---|---|---|
| Barras de vida/mana horizontais com pulso de HP crítico (HP <= 25%) | `src/components/hud/PlayerStatus.tsx` (`isCriticalHp`) | 2026-10-11 |
| Marcador "!" de NPC é criado na cena Phaser | `GameScene.ts` `createNpcMarker` (~l.876) | 2026-10-11 |
| Não há menu contextual de alvo | `grep -rn "ENGAGE" src` sem resultados | 2026-10-11 |
| Inimigo `spectral` tem esquiva por chance (cap 0,7) | `src/game/objects/Enemy.ts` ~l.357 | 2026-10-11 |
| Minimapa desenha salas por geometria, não grade 3x3 | `Minimap.tsx`, `minimapRooms` em `gameStore.ts` | 2026-10-11 |

## Decisões a confirmar
| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| 1 | Referências visuais do HUD | A) D2 estética + DS1 estrutura; B) outra | A: é o que o HUD faz hoje |
| 2 | Esquiva manual e espacial, sem "Dodge %" passivo | A) vale também para inimigos (remove esquiva `spectral`); B) só para o jogador | B: não altera balance de inimigos sem decisão; confirmar |
| 3 | Menu contextual de alvo (ENGAGE / ATACAR / MIRAR MAIS PRÓXIMO) para mouse | A) fazer; B) adiar | B: público é mobile-first |
| 4 | Tier C: molduras e ícones pintados, sprite de marcador de NPC | A) fazer agora; B) só com sprites de UI aprovados | B: depende de arte aprovada |
| 5 | Cor do glow do marcador de NPC | A) tint por NPC atual; B) cor única Grimdark | A: já em uso |

## Escopo
- Menu contextual de alvo para mouse, em React, com as três ações (se decisão 3 = A).
- Moldura pintada para as barras de HP/MP mantendo a forma de barra; ícones de item e poção desenhados; sprite de marcador de NPC (se decisão 4 = A).
- Remover esquiva por chance dos inimigos (se decisão 2 = A).

## Fora de escopo
- Orbes de vida/mana; reposicionar ou redesenhar o minimapa, o cinturão de curativos e os frames existentes; novo sistema de mira.

## Arquivos e contratos
- Alterar (conforme decisões): `src/components/hud/TargetFrame.tsx` ou novo componente em `src/components/hud/`, `src/components/hud/PlayerStatus.tsx`, `GameScene.ts` (`createNpcMarker`), `Enemy.ts` (decisão 2).
- Contrato do menu: aberto pela UI React; a ação chega à cena só por `gameStore` (ADR 0001). Semântica de cada ação: ver Questões em aberto.
- Atualizar no mesmo commit: [hud](../../ui/hud.md) e `Verificado em`.
- Não tocar: regras do jogo em `Player.ts` além do necessário.

## Critérios de aceite
Todos provisórios; dependem das decisões 2 a 4.
- **HR-1** Quando o jogador aciona um inimigo com o mouse, o HUD React deve exibir o menu de alvo com ENGAGE, ATACAR e MIRAR MAIS PRÓXIMO (provisório).
- **HR-2** Quando uma ação do menu é escolhida, o gameStore deve registrar a ação para a GameScene aplicá-la (provisório).
- **HR-3** Se o clique ocorre fora de qualquer inimigo, então o HUD React não deve abrir o menu de alvo (provisório).
- **HR-4** O HUD React deve exibir a vida e a mana como barras horizontais, sem orbes (provisório).
- **HR-5** Se o sprite de marcador de NPC não carregar, então a GameScene deve exibir o marcador procedural atual (provisório).
- **HR-6** Onde a decisão 2 = A, o Enemy não deve esquivar de ataques por chance (provisório).

## Plano de verificação
| Critério | Como verificar |
|---|---|
| HR-1 a HR-3 | teste de componente do menu e do `gameStore`; passo manual com mouse (não validado: precisa de playtest humano) |
| HR-4 | inspeção de `PlayerStatus.tsx` e captura de tela |
| HR-5 | teste com textura ausente; manual |
| HR-6 | teste unitário de `Enemy` com afixo `spectral` |
| Acabamento visual (barras, marcador, minimapa, cinturão) | não validado: precisa de playtest humano |

## Questões em aberto
- Semântica de ENGAGE, ATACAR e MIRAR MAIS PRÓXIMO (o texto original só traz os nomes).
- Quais sprites de UI aprovados liberam o Tier C, e em que formato.
- Se a decisão 2 vale para inimigos, o impacto de balance do afixo `spectral`.

## Pendências para promover a backlog
- Aprovação do responsável.
- Decisões 1 a 5 respondidas; ADR 0001 aprovado.
- Questões em aberto resolvidas; critérios sem a marca (provisório).
- Playtest humano do acabamento atual.

## Referências
[hud](../../ui/hud.md) · [modals-and-screens](../../ui/modals-and-screens.md) · [0001](../../decisions/0001-ponte-phaser-react-so-zustand.md)
