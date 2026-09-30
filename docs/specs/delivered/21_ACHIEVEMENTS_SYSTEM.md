---
agent_context: system-designer, ui-engineer
target_module: docs/specs/delivered
priority: medium
status: completed
last_updated: 2026-08-27
tags: [specs, delivered, achievements, codex, notifications, ui, persistence]
---

# 🏆 Spec 21: Sistema de Conquistas (Achievements System)

## Objetivo
Fornecer um sistema completo de conquistas góticas com rastreamento em tempo real de estatísticas globais, persistência estrita via Zod, notificações toast animadas na HUD e modal dedicado no React.

---

## Status
🟢 **COMPLETO**

---

## O que foi Entregue
- **Catálogo de Conquistas Góticas (`src/data/achievements.json`):**
  - Conquistas de eliminação: *Primeira Sangria*, *Exterminador de Bestas*, *Matador de Esqueletos*.
  - Conquistas de sobrevivência e maestria: *Mestre da Esquiva*, *Mestre do Sangue*, *Inviolável*, *Sobrevivente*.
  - Conquistas de progressão e riqueza: *Colecionador de Relíquias*, *Acumulador de Cristais*.
- **Rastreamento de Progresso em Tempo Real (`AchievementSystem.ts`):**
  - Monitoramento de eventos de jogo em sincronia com `gameStore.ts` (inimigos derrotados, dano causado, Cristais de Sangue coletados, dashes executados).
  - Emissão de notificações imediatas ao atingir os requisitos de uma conquista.
- **Notificações Toast & Interface Gótica (`AchievementToast.tsx` & `AchievementsModal.tsx`):**
  - Toast de notificação flutuante na HUD com estilo metálico/dourado gótico.
  - Modal completo de visualização com progresso em porcentagem e ícones.
- **Persistência Zod Integrada (`localStorage.ts`):**
  - Armazenamento sob as chaves `bloodmage_1995_achievements` e `bloodmage_1995_global_stats`.

---

## Referência no Código
- `src/data/achievements.json` — Definições JSON de IDs, títulos, descrições e metas.
- `src/game/systems/AchievementSystem.ts` — Lógica de verificação de critérios e progresso.
- `src/game/systems/AchievementNotification.ts` — Fila de notificações de conquistas desbloqueadas.
- `src/components/AchievementsModal.tsx` — Modal React UI de visualização de conquistas.
- `src/components/hud/AchievementToast.tsx` — Componente Toast para a HUD.
- `src/utils/localStorage.ts` — Sanitização e persistência das conquistas com Zod.

---

## Validação
- Testes unitários executados com sucesso (`pnpm test`).
- Tipagem TypeScript 100% estrita sem o uso de `any` (`pnpm run typecheck`).
- Funcionamento do Toast verificado sem sobreposição com outros elementos da HUD.

---

## Notas
- Conquistas desbloqueadas persistem globalmente entre diferentes sessões e corridas do jogador.
