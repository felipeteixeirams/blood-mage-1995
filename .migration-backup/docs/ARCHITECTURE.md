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
│  - App.tsx (Controlador de Telas, Hotkeys [I]/[T])    │
│  - GameplayHUD.tsx (Joystick, status, Biomas, Cristais)│
│  - Modais (InventoryModal, TalentsModal, Bestiary)     │
└───────────────────────────┬────────────────────────────┘
                            │ (Events & Zustand Sync)
┌───────────────────────────┴────────────────────────────┐
│                  Phaser 3 Canvas Layer                 │
│  - PhaserGame.tsx (Container de Inicialização)         │
│  - GameScene.ts (Loop Principal, Biomas, Baús & Loot)  │
│  - DungeonGenerator.ts (3x3 Grid, Tints, Decais, Boss) │
│  - Objects & Systems (Player, Enemy, LootSystem)       │
└────────────────────────────────────────────────────────┘
```

---

## 🧠 Estado & Sincronização (`src/store/gameStore.ts`)

- **Zustand Store**: Mantém o estado global sincronizado entre UI (Menus, HUD) e Phaser.
- **Metagame & Equipamentos**: Gerencia saldo de Cristais de Sangue (💎), níveis da Árvore de Talentos do Hemomante, Slots de Equipamentos e Bioma Ativo (`fosso_chagas`, `catacumbas_martires`, `santuario_sangue`).
- **Single Source of Truth**: Durante o loop de gameplay a 60 FPS, o estado de física e posição reside nos objetos nativos do Phaser. O Zustand é atualizado em marcos de mudança de estado (Level Up, Dano Sofrido, Morte de Inimigo, Coleta de Loot).

---

## 🤖 Padrões de Inteligência Artificial de Inimigos (`src/game/objects/Enemy.ts`)

A lógica de IA dos monstros é baseada em uma Máquina de Estados Finita (FSM) com atributos comportamentais:
- **Temperamentos:** `aggressive`, `tactical`, `timid`, `relentless`.
- **Estados de IA:** `idle`, `patrol`, `investigating`, `combat`, `flee`, `frenzy`.
- **Audição & Visão:** Sistema de ruído e Cone de Visão, estimulando transições comportamentais.

---

## 🏰 Biomas & Masmorras Procedurais (`src/game/systems/DungeonGenerator.ts`)

O gerador de masmorras cria layouts interconectados de salas 3x3 com:
- **Biomas Temáticos:** Tinting de chão e paredes dinâmicos para Fosso das Chagas, Catacumbas dos Mártires e Santuário de Sangue.
- **Salas Especiais:** Salas de spawn seguras, câmaras normais, salas de tesouro secreto (garantia de múltiplos baús) e o Santuário do Boss com decais de pentagrama profano.

---

## 💾 Persistência & Recursos Procedurais

- **Persistência Local**: Configurações, High Scores, saldo de Cristais de Sangue e Níveis de Talentos usam `localStorage` via `src/utils/localStorage.ts`.
- **Proceduralidade Total**: Zero imagens estáticas externas. Texturas são geradas proceduralmente via HTML5 Canvas e convertidas para Base64. Áudio é sintetizado em tempo real via Web Audio API (`soundEngine.ts`).

---

## 🔗 Satélites Relacionados
- **Refatoração Estrutural (Fase 1.5)**: `/docs/satellites/SPEC_REFACTOR.md`
- **Manual de Lore & Conceito Visual**: `/docs/satellites/LORE_BLOODMAGE.md`
