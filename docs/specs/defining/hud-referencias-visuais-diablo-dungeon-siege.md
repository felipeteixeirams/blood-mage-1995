# HUD de Gameplay: Referências Diablo II e Dungeon Siege 1

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente

**Estado vs código:** parcial (verificado em 2026-10-10, leitura estática). Existem: barras horizontais de vida e mana no topo-esquerdo com moldura, textura e rebites e pulso de HP crítico (`src/components/hud/PlayerStatus.tsx`, `FORGED_METAL_TEXTURE`, `BarRivet`, `isCriticalHp`); curativos em slots com atalhos Z/X/V (`CURATIVE_SLOTS` no mesmo arquivo); marcador "!" sobre NPCs (`GameScene.createNpcMarker`/`clearNpcMarkers`, chamados em `DungeonFlowController.ts`); minimapa por salas (`src/components/hud/Minimap.tsx`, `minimapRooms` em `gameStore.ts`, `initMinimap`/`pushMinimapSnapshot` em `GameScene.ts`, respeita `minimapVisible`/`minimapAlpha`); `TargetFrame.tsx`, `SkillsOverlay.tsx` e `ContractHUD.tsx`. Falta: menu contextual de alvo com mouse (`grep -rn "ENGAGE" src` sem resultados) e qualquer arte pintada à mão para HUD (Tier C). O minimapa real desenha as salas por geometria, não a grade 3x3 descrita na versão anterior.

## Decisões a confirmar

Comportamento e escopo abaixo são propostas sem aprovação registrada; nada aqui está decidido.

| # | Decisão | Recomendação |
|---|---|---|
| 1 | Referências visuais do HUD: Diablo II para estética e Dungeon Siege 1 para estrutura (barras horizontais, sem orbes) | Aprovar; é o que o HUD faz hoje |
| 2 | Esquiva manual e espacial, sem "Dodge %" passivo, como diretriz de combate | Confirmar; `Enemy.ts` ainda tem esquiva por chance para afixo `spectral` (`effectiveDodge`), o que contradiz a diretriz para inimigos |
| 3 | Menu contextual de alvo (ENGAGE / ATACAR / MIRAR MAIS PRÓXIMO) para mouse | Adiar; público é mobile-first |
| 4 | Tier C: molduras e ícones pintados à mão, sprite de marcador de NPC | Só quando houver sprites de UI aprovados |
| 5 | Cor do glow do marcador de NPC compatível com a paleta Grimdark | Manter o tint por NPC já usado no sprite |

## Pendente

- Menu contextual de alvo (decisão 3).
- Tier C (decisão 4): moldura pintada da barra de HP/MP mantendo a forma de barra, ícones de item e poção desenhados, sprite de marcador de NPC.
- Validação manual em jogo do acabamento das barras, do marcador, do minimapa e do cinturão de curativos: não validado, precisa de playtest humano.

## Critérios de aceite

A definir (spec ainda sem EARS).
