---
agent_context: combat-designer, ai-engineer
target_module: docs/specs/delivered
priority: high
status: completed
last_updated: 2026-08-27
tags: [specs, delivered, ai, elite, affixes, combat, telegraph]
---

# ⚔️ Spec 12.02: Inteligência Artificial e Modificadores de Elite (Combat Challenge)

## Objetivo
Elevar o desafio tático dos combates contra monstros elites introduzindo novos afixos de inteligência artificial, telegrafia visual ostensiva de zonas de perigo (AoE) e mecânicas reativas de esquiva e contra-ataque.

---

## Status
🟢 **COMPLETO**

---

## O que foi Entregue
- **Afixo Teleporte (`teleporter`):**
  - Reposicionamento tático dinâmico (blink) acionado ao sofrer dano grave.
  - Emite partículas de vácuo sombrio e quebra instantaneamente a linha de visão para re-engajar por ângulos imprevisíveis.
- **Afixo Reflexão (`reflective`):**
  - Mitigação de 35% de dano contra projéteis frontais.
  - Dispara contra-centelha azulada (`spawnReflectedSpark`) refletida na direção da origem do disparo do jogador.
- **Telegrafia de Ataques e Halos Visuais:**
  - Sistema de halos de elite no `EnemyTelegraphSystem`: cor púrpura (`0x9333ea`) para Teleporter e azul elétrico (`0x0284c7`) para Reflective.
  - Indicadores em área (AoE danger zones) que sinalizam ataques iminentes e incentivam o uso do *dash*.
- **Distribuição Procedural Escalonada:**
  - Inserção de elites com afixos avançados a partir do Piso 2 via `DungeonFlowController.ts`.

---

## Referência no Código
- `src/game/objects/Enemy.ts` — Enum `EliteAffix` e executores de comportamento de teleporte/reflexão.
- `src/game/systems/EnemyTelegraphSystem.ts` — Renderização de halos visuais e zonas de perigo telegrafadas.
- `src/game/scenes/GameScene.ts` — Método `spawnReflectedSpark` para projéteis de contra-ataque refletidos.
- `src/game/systems/DungeonFlowController.ts` — Probabilidade e atribuição procedural de afixos a partir do Piso 2.
- `src/types/game.ts` — Definições de enums e tipos para afixos de elite.

---

## Validação
- 245 testes unitários aprovados com 100% de sucesso.
- Verificação do TypeScript sem nenhum erro ou aviso (`pnpm run typecheck`).
- Comportamentos de esquiva reativa e reflexão de projéteis verificados sem perda de taxa de quadros (60 FPS).

---

## Notas
- O projétil refletido pelo afixo `reflective` possui telegrafia própria (brilho azul) para garantir janela justa de esquiva via dash.
