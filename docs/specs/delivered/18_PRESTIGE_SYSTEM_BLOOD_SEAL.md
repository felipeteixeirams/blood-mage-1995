---
agent_context: progression-engineer, backend-engineer
target_module: docs/specs/delivered
priority: high
status: completed
last_updated: 2026-08-27
tags: [specs, delivered, prestige, blood-seal, meta-progression, difficulty]
---

# 🏅 Spec 18: Sistema de Prestígio 'Blood Seal' (Prestige Progression)

## Objetivo
Prover um ciclo de progressão de fim de jogo (endgame) onde o jogador pode voluntariamente realizar o ritual de sacrifício para resetar o nível e atributos base da corrida em troca de Selos de Sangue permanentes e liberação de novas dificuldades.

---

## Status
🟢 **COMPLETO** (Lógica de Metajogo, Atributos & Persistência) / 🟡 **PARCIAL** (Modal de Interface React em Backlog)

---

## O que foi Entregue
- **Lógica e Ações de Prestígio no Store (`gameStore.ts`):**
  - Implementado o método `canPrestige()` (exige nível 20 e liberação dos critérios de avanço).
  - Implementado o método `performPrestige(sealToAllocate)` que eleva o nível de prestígio (até o teto de 10), concede pontos não gastos de Selo de Sangue e desbloqueia dificuldades superiores (*Pesadelo*, *Inferno*).
  - Implementada a função `getPrestigeModifiers()` que calcula os bônus acumulativos permanentes.
- **Modificadores Passivos em Combate (`Player.ts`):**
  - Aplicação dos multiplicadores de dano (`damageMult`), bônus de vida máxima (`bonusMaxHp`), redução de cooldown (`cdrBonus`) e vampirismo (`vampBonus`) diretamente nos getters do jogador.
- **Persistência Centralizada e Validada com Zod (`localStorage.ts`):**
  - Schema `PrestigeDataSchema` com sanitização e recuperações automáticas registradas sob a chave `bloodmage_1995_prestige`.
- **Efeitos Sonoros de Empoderamento Rúnico (`soundEngine.ts`):**
  - Efeitos `playPrestigeConfirmation()`, `playPrestigeNova()` e `playRunicEmpowerment()` sintetizados via Web Audio API.

---

## Referência no Código
- `src/store/gameStore.ts` — Ações `canPrestige`, `performPrestige`, `allocateBloodSeal`, `selectDifficulty` e `getPrestigeModifiers`.
- `src/utils/localStorage.ts` — Funções `loadPrestigeData` e `savePrestigeData` com validação Zod.
- `src/game/objects/Player.ts` — Leitura de `getPrestigeModifiers()` para aplicar multiplicadores nos atributos do caçador.
- `src/utils/soundEngine.ts` — Efeitos sonoros dedicados para prestígio e alocação rúnica.
- `src/types/game.ts` — Interfaces `PrestigeData`, `BloodSealType` e `GameDifficulty`.

---

## Validação
- Testes unitários do repositório aprovados (`pnpm test`).
- Tipagem TypeScript validada com 0 erros (`pnpm run typecheck`).
- Integração de persistência validada com chave `bloodmage_1995_prestige`.

---

## Notas & Divergência Encontrada
- **Status do Modal UI:** A camada de backend, persistência, regras de negócio e cálculo de atributos de combate do sistema de Prestígio estão 100% implementadas e operacionais no motor. Contudo, o modal React dedicado para acionar o prestígio visualmente na Safe Town (Room 0) ainda não foi construído na UI e permanece como item de backlog de interface.
