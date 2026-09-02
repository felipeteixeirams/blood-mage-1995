---
agent_context: item-designer, combat-engineer
target_module: docs/specs/delivered
priority: high
status: completed
last_updated: 2026-08-27
tags: [specs, delivered, relics, artifacts, items, equipment, passives]
---

# 💍 Spec 19: Sistema de Relíquias e Artefatos Passivos (Relics & Artifacts System)

## Objetivo
Fornecer um sistema robusto de relíquias e artefatos passivos equipáveis que alteram dinamicamente os parâmetros de combate do jogador, concedendo efeitos passivos como sangramento, vampirismo, redução de cooldown e multiplicadores de Cristais de Sangue.

---

## Status
🟢 **COMPLETO**

---

## O que foi Entregue
- **Catálogo de 8 Relíquias Góticas (`src/data/relics.json`):**
  1. *Selo Hemorrágico (Épico):* 30% chance de aplicar sangramento +10% dano.
  2. *Cálice Amaldiçoado (Épico):* +50% Cristais de Sangue, -0.5/s regeneração HP.
  3. *Olho de Carmim (Raro):* +20 velocidade de movimento, +5% lifesteal.
  4. *Coração Abissal (Lendário):* +40 Max HP, -15% cooldown de habilidades.
  5. *Amuleto do Mártir (Raro):* -20% custo de magia, -10 velocidade.
  6. *Anel do Pacto Sanguíneo (Comum):* +15% dano hemomântico total.
  7. *Fragmento Abissal (Lendário):* +75% Cristais de Sangue, +20% dano total.
  8. *Manta Vampírica (Comum):* +8% vampirismo/lifesteal.
- **Gerenciamento de Estado & Persistência (`gameStore.ts` & `localStorage.ts`):**
  - Armazenamento centralizado de relíquias desbloqueadas e equipadas com validação Zod sob as chaves `bloodmage_1995_unlocked_relics` e `bloodmage_1995_equipped_relics`.
  - Método `getRelicModifiers()` para agregação em tempo real dos efeitos passivos.
- **Interface e Comparativo Visual (`InventoryModal.tsx`):**
  - Card comparativo com estatísticas, badges de raridade e filtros (*Todas*, *Desbloqueadas*, *Equipadas*).
- **Aplicação nos Atributos do Jogador (`Player.ts` & `GameScene.ts`):**
  - Modificação em tempo real dos getters de dano, vida máxima, velocidade, lifesteal e redução de cooldown no caçador.

---

## Referência no Código
- `src/data/relics.json` — Definições JSON dos atributos, descrições e raridades das 8 relíquias.
- `src/game/systems/RelicSystem.test.ts` — Testes unitários das regras de negócio de relíquias.
- `src/store/gameStore.ts` — Ações `equipRelic`, `unequipRelic`, `unlockRelic` e `getRelicModifiers`.
- `src/utils/localStorage.ts` — Schemas Zod de persistência das relíquias.
- `src/components/InventoryModal.tsx` — Interface visual para gerenciamento e equipamento de relíquias.
- `src/game/objects/Player.ts` — Consumo de `getRelicModifiers()` nos cálculos de estatísticas de combate.

---

## Validação
- Testes unitários em `RelicSystem.test.ts` 100% aprovados.
- Verificação do TypeScript sem erros (`pnpm run typecheck`).
- Efeitos passivos e mutações de atributos validados em simulação de combate.

---

## Notas
- Relíquias equipadas combinam seus modificadores aditivamente com os bônus da Árvore de Talentos e do Sistema de Prestígio.
