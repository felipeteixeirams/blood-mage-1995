---
node_type: Master
parent_node: /AGENTS.md
domain: System Architecture & Technical Contracts
token_weight: Medium (~800 tokens)
satellites:
  - /docs/satellites/SPEC_REFACTOR.md
  - /docs/satellites/LORE_BLOODMAGE.md
---

# 🏛️ Master: System Architecture (Bloodmage 1995)

Este documento define a arquitetura técnica do projeto, servindo como fonte única da verdade sobre o funcionamento híbrido entre **React 18** e **Phaser 3**.

---

## 📐 Visão Geral da Arquitetura Híbrida

O jogo é estruturado em duas camadas principais que se comunicam através de eventos e um store global:

```
┌────────────────────────────────────────────────────────┐
│                   React 18 Layer                       │
│  - App.tsx (Controlador de Telas & Modais)            │
│  - GameplayHUD.tsx (Joystick, Vida, XP, Logs de Loot) │
│  - Modais (Bestiary, HighScores, Settings)             │
└───────────────────────────┬────────────────────────────┘
                            │ (Events & Zustand Sync)
┌───────────────────────────┴────────────────────────────┐
│                  Phaser 3 Canvas Layer                 │
│  - PhaserGame.tsx (Container de Inicialização)         │
│  - GameScene.ts (Loop Principal de Física & Render)    │
│  - Objects & Systems (Player, Enemy, Bullet, Loot)     │
└────────────────────────────────────────────────────────┘
```

---

## 🧠 Estado & Sincronização (`src/store/gameStore.ts`)

- **Zustand Store**: Mantém o estado global sincronizado entre UI (Menus, HUD) e Phaser.
- **Single Source of Truth**: Durante o loop de gameplay a 60 FPS, o estado de física e posição reside nos objetos nativos do Phaser. O Zustand é atualizado em marcos de mudança de estado (Level Up, Dano Sofrido, Morte de Inimigo, Coleta de Loot).

---

## 🤖 Padrões de Inteligência Artificial de Inimigos (`src/game/objects/Enemy.ts`)

A lógica de IA dos monstros é baseada em uma Máquina de Estados Finita (FSM) com atributos comportamentais:
- **Temperamentos:** `aggressive`, `tactical`, `timid`, `relentless`.
- **Estados de IA:** `idle`, `patrol`, `investigating`, `combat`, `flee`, `frenzy`.
- **Audição & Visão:** Sistema de ruído e Cone de Visão, estimulando transições comportamentais.

---

## 💾 Persistência & Recursos Procedurais

- **Persistência Local**: Pontuações e configurações (Som, Filtros CRT) usam `localStorage` via `src/utils/localStorage.ts`.
- **Proceduralidade Total**: Zero imagens estáticas externas. Texturas são geradas proceduralmente via HTML5 Canvas e convertidas para Base64. Áudio é sintetizado em tempo real via Web Audio API (`soundEngine.ts`).

---

## 🔗 Satélites Relacionados
- **Refatoração Estrutural (Fase 1.5)**: `/docs/satellites/SPEC_REFACTOR.md`
- **Manual de Lore & Conceito Visual**: `/docs/satellites/LORE_BLOODMAGE.md`
