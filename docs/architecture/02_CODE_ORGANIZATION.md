---
agent_context: all agents
target_module: root (monorepo pnpm)
priority: medium
status: active
last_updated: 2026-08-24
tags: [architecture, monorepo]
---
# 🗂️ Organização do Código

O projeto é estruturado como um monorepo PNPM composto pelos seguintes módulos principais:

## 📂 Estrutura de Diretórios
- `src/components/`: Componentes React (modais, menus, HUD Overlay).
- `src/game/`: Motor principal do jogo (Phaser 3/4).
  - `/objects/`: Entidades de jogo físico (Player, Enemy, Projectile).
  - `/scenes/`: Fluxos visuais do Phaser (BootScene, TitleScene, GameScene, SettingsScene, RecordsScene).
  - `/systems/`: Lógica de jogo desacoplada das cenas — dungeon/loot/combate,
    efeitos visuais (partículas, shake, pós-processamento, iluminação),
    infraestrutura (pooling, culling, input) e os módulos extraídos do
    `GameScene.ts` (ver padrão de extração/delegação em `03_PHASER_PATTERNS.md`
    e o histórico em `05_GAMESCENE_REFACTOR.md`).
- `src/store/`: Zustand global shareable store (`gameStore.ts`).
- `src/utils/`: Sintetizador procedural de áudio (`soundEngine.ts`), Logger global estruturado (`logger.ts`) e utilitários de localStorage (`localStorage.ts`).
- `lib/`: Módulos compartilhados reutilizáveis entre frontend e backend.
