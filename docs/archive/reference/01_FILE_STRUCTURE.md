---
agent_context: all devs
target_module: root
priority: medium
status: active
last_updated: 2026-08-09
tags: [reference, files]
---
# 📂 Estrutura Física Detalhada de Arquivos

Guia rápido dos arquivos mais importantes do projeto:

```
src/
├── components/          # Componentes visuais HUD (React)
│   ├── GameplayHUD.tsx  # Componente raiz do HUD do jogo
│   ├── MainMenu.tsx     # Menu principal da run
│   └── ui/              # Componentes genéricos shadcn/ui
├── game/                # Motor de jogo (Phaser)
│   ├── objects/         # Entidades físicas (Player, Enemy, Projectile)
│   ├── scenes/          # BootScene, TitleScene, GameScene, etc.
│   └── systems/         # DungeonGenerator, LootSystem
├── store/               # Zustand state shareable storage
│   └── gameStore.ts     # useGameStore hook
└── utils/               # Utilitários (soundEngine, logger, localStorage)
```
