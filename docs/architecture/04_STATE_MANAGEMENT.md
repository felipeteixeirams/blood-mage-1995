---
agent_context: frontend, backend
target_module: src/store
priority: high
status: active
last_updated: 2026-08-25
tags: [architecture, zustand, zod, state]
---
# 📊 Gerenciamento de Estado (Zustand + Zod)

O fluxo de dados unificado do jogo entre o loop do Phaser e os componentes de UI do React é mediado pelo Zustand e validado com esquemas estritos do Zod.

## 🔗 Fluxo de Estado Unificado
- **Zustand (`useGameStore.ts`)**: Armazena as estatísticas em tempo real do jogador (HP, Mana, Level, XP, Kills, Wave), inventário de itens de loot equipados, status de árvore de talentos de hemomancia, configurações do minimapa e volume de som.
- **Sincronização**: Quando uma alteração física relevante ocorre no Phaser (ex: o jogador toma dano), ele executa `useGameStore.getState().setPlayerStats(...)` para sincronizar os dados. Os componentes React inscritos no store sofrem re-render imediato e transparente.
- **Zod Schemas**: Previnem a injeção ou salvamento de dados corrompidos (Prototype Pollution, etc.) no `localStorage` definindo tipos estritos com valores de fallback seguros.

## 🌉 Ponte Phaser↔React: 100% Zustand (desde 25/08/2026)

Toda a comunicação entre o HUD React e o `GameScene` do Phaser passa pelo Zustand — não existe mais nenhum `window.dispatchEvent`/`CustomEvent` de gameplay no código. Dois padrões cobrem os casos de uso:

- **Comando + reset** (React → Phaser, baixa frequência): um campo guarda a intenção (`activeSkillTrigger`, `activeCurativeTrigger`, `respawnRequested`, `dragAim`), um `useEffect` em `PhaserGame.tsx` processa e reseta o campo (`null`/`false`) depois de chamar o método correspondente na cena.
- **Valor + versão** (qualquer direção, incluindo alta frequência): um campo guarda o estado atual (`touchMoveInput`, `touchAimInput`, `dragAim` durante o gesto, `lastLootPickup`), e o `useEffect` reage a toda mudança de valor — inclusive quando o "valor" é só um contador sem payload real (`cosmeticTintVersion`).

Essa migração (histórico completo, motivação e decisões de cada ponte) está documentada em [[06_PHASER_REACT_BRIDGE_MIGRATION.md]].
