---
agent_context: backend, frontend
target_module: artifacts/bloodmage/src/game
priority: high
status: complete
last_updated: 2026-08-10
source_of_truth: docs/specs/finalizadas/01_FASE1_INCONSCIENCIA.md
tags: [features, phase-1, unconsciousness]
---
# 🩸 Fase 1: Mecânica de Inconsciência

Detalhamento técnico da implementação do estado de inconsciência / nocaute temporário.

## ⚙️ Detalhes de Implementação
- **Detecção**: No script `Player.ts`, o método `takeDamage` monitora se o HP cai abaixo de 0.
- **Tratamento**:
  - Se `knockoutCount < 2`: Ativa `isUnconscious = true`, incrementa o contador, zera a velocidade física e muda a sprite para animação de repouso no chão.
  - O loop de física do Phaser desabilita colisões nocivas temporárias.
  - A FSM do `Enemy.ts` detecta o estado inconsciente do player e limpa a referência de alvo, transitando para comportamentos de patrulha errática ou afastamento.
- **Recuperação**: O jogador regenera **1 HP por segundo**. Ao atingir **5% do HP máximo**, ele recobra a consciência.

> ⚠️ Fonte da verdade e detalhes completos de implementação: [01_FASE1_INCONSCIENCIA.md](../specs/finalizadas/01_FASE1_INCONSCIENCIA.md)
