---
status: CONCLUIDO
phase: 3/4
priority: P2
start_date: 2026-08-10
completion_date: 2026-08-10
responsible: Jules (Google AI)
progress: 100% (Implementado e Validado)
agent_context: backend, frontend, game designer
target_module: artifacts/bloodmage/src/game
last_updated: 2026-08-10
tags: [specs, phase-3, status-conditions, survival, medicine]
---

# 🤢 Fase 3: Condições de Sobrevivência, Status Nocivos e Medicinas

> **Status:** Concluído | **Prioridade:** P2 (Média)

---

## 📋 Visão Geral

**Objetivo:** Introduzir condições de status nocivos (Sangramento, Veneno, Infecção) e itens consumíveis de cura (Bandagens, Antídotos, Antibióticos), elevando a camada de sobrevivência do jogo.

**Impacto:** Adiciona complexidade tática e gerenciamento de recursos além da barra primária de vida e mana/sangue.

---

## 📝 Requisitos Funcionais

### Must Have (MVP)

- [x] **Sangramento (Bleeding)**:
  - Causa dano físico contínuo por segundo e reduz velocidade de movimento em 20%.
  - Curado por **Bandagens**.
- [x] **Veneno (Poison)**:
  - Causa dano de natureza tóxica contínuo que ignora escudos de ossos.
  - Curado por **Antídotos**.
- [x] **Infecção (Infection)**:
  - Reduz em 50% a eficácia de todas as habilidades de cura e hemomancia.
  - Curada por **Antibióticos**.
- [x] **Cinto de Consumíveis**:
  - Slots dedicados na HUD para uso rápido de curativos e remédios.
- [x] **Venda de Medicamentos**:
  - Alquimista e vendedores na Room 0 disponibilizam remédios em troca de Cristais de Sangue.

### Nice to Have

- [x] VFX de overlay de tela para cada condição (bordas verdes para veneno, gotas vermelhas para sangramento).
- [ ] Indicador de tempo restante de cada debuff na HUD.
- [ ] Inimigos que aplicam debuffs específicos (ex: Cão Infernal aplica Sangramento; Aracnídeo aplica Veneno).

---

## 🏗️ Arquitetura e Estrutura Técnica

### Arquivos Envolvidos
- `src/game/systems/StatusConditionSystem.ts`: Gerenciamento de ticks de dano e remoção de debuffs.
- `src/game/items/Consumables.ts`: Definição de Bandagens, Antídotos e Antibióticos.
- `src/game/hud/StatusHUD.tsx`: Exibição de ícones de status ativos na interface do jogador.

---

## ✅ Critérios de Aceite

1. Aplicação dos debuffs altera os atributos e aplica dano ao longo do tempo conforme especificado.
2. Uso dos itens correspondentes remove a condição instantaneamente.
3. Cinto de consumíveis atalha o uso rápido via hotkeys ou toque.
