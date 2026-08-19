---
agent_context: frontend, backend
target_module: src/store
priority: high
status: active
last_updated: 2026-08-09
tags: [architecture, zustand, zod, state]
---
# 📊 Gerenciamento de Estado (Zustand + Zod)

O fluxo de dados unificado do jogo entre o loop do Phaser e os componentes de UI do React é mediado pelo Zustand e validado com esquemas estritos do Zod.

## 🔗 Fluxo de Estado Unificado
- **Zustand (`useGameStore.ts`)**: Armazena as estatísticas em tempo real do jogador (HP, Mana, Level, XP, Kills, Wave), inventário de itens de loot equipados, status de árvore de talentos de hemomancia, configurações do minimapa e volume de som.
- **Sincronização**: Quando uma alteração física relevante ocorre no Phaser (ex: o jogador toma dano), ele executa `useGameStore.getState().setPlayerStats(...)` para sincronizar os dados. Os componentes React inscritos no store sofrem re-render imediato e transparente.
- **Zod Schemas**: Previnem a injeção ou salvamento de dados corrompidos (Prototype Pollution, etc.) no `localStorage` definindo tipos estritos com valores de fallback seguros.
