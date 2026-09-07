---
agent_context: frontend, ui-ux, gamepad, game-engine, accessibility
target_module: src/components, src/components/hud, src/hooks
priority: high
status: completed
implementation_status: done
last_updated: 2026-09-06
tags:
  - specs
  - ui
  - ux
  - modals
  - gamepad
  - accessibility
  - gothic-theme
  - pointer-isolation
---

# Spec 28 — Padronização de Modais Secundários, Navegação Gamepad & Retratos Rúnicos

> **Status:** Spec em andamento; execução dividida em 3 fases sequenciais.  
> **Data:** 6 de setembro de 2026  
> **Domínio:** Interface de usuário React, acessibilidade por controle/gamepad, blindagem de eventos de canvas e harmonia visual gótica.  
> **Princípio:** Coerência estética total, zero vazamento de toques para o Phaser e navegabilidade completa sem mouse/touch.

---

## 1. Resumo Executivo & Justificativa

Com as interfaces principais do gameplay (`GameplayHUD`, `DialogueModal`, `InventoryModal`, `LevelUpModal`, `GameOverModal`) já refatoradas e calibradas com cantoneiras forjadas douradas (`#b8860b`), paleta gótica profunda e blindagem rigorosa de eventos (`stopPropagation` + `stopImmediatePropagation`), os modais secundários de apoio (`BestiaryModal`, `CodexModal`, `AchievementsModal`, `TalentsModal`, `HighScoresModal`) ainda mantêm resquícios do visual antigo com bordas simples e ausência de blindagem de ponteiro.

Além disso, a acessibilidade por gamepad já presente no `LevelUpModal` e `GameOverModal` via hook `useGamepadUINavigation` deve ser estendida para o fluxo de diálogo (`DialogueModal`) e navegação do inventário (`InventoryModal`), proporcionando paridade de controle entre teclado, touch e gamepad físico/virtual.

---

## 2. Divisão em Fases de Execução

### Fase 1: Padronização Visual & Blindagem de Ponteiro nos Modais Secundários
- **Alvos**:
  - `src/components/BestiaryModal.tsx`
  - `src/components/CodexModal.tsx`
  - `src/components/AchievementsModal.tsx`
  - `src/components/TalentsModal.tsx`
  - `src/components/HighScoresModal.tsx`
- **Diretrizes**:
  1. Cantoneiras forjadas douradas (`#b8860b`) nos 4 cantos do contêiner modal.
  2. Paleta gótica de fundo (`bg-[#0f0b09]/98` ou `bg-[#120a0e]/98`) com bordas `border-[#b8860b]/70` ou `border-red-900/60`.
  3. Blindagem de ponteiro: `onPointerDown` e `onClick` com `e.stopPropagation()` e `e.nativeEvent?.stopImmediatePropagation?.()` no overlay backdrop, no corpo modal e em todos os botões/itens clicáveis.
  4. Ergonomia mobile: `max-h-[92vh] overflow-y-auto` e alvos de toque mínimos de 40-44px.

### Fase 2: Navegação Gamepad / D-Pad nos Modais Interativos
- **Alvos**:
  - `src/components/hud/DialogueModal.tsx`
  - `src/components/InventoryModal.tsx`
- **Diretrizes**:
  1. Integrar `useGamepadUINavigation` no `DialogueModal` para alternar entre respostas com D-Pad Up/Down e confirmar com Botão A / Enter.
  2. Integrar `useGamepadUINavigation` no `InventoryModal` para navegar entre as abas de filtro e cards de relíquia, com suporte a Botão B / Start para fechar o modal (`onClose`).
  3. Adicionar estilos de foco nítidos (`focus:border-[#e8c76a] focus:ring-1 focus:ring-[#b8860b]`).

### Fase 3: Retratos Rúnicos & Molduras Vivas no Diálogo
- **Alvos**:
  - `src/components/hud/DialogueModal.tsx`
- **Diretrizes**:
  1. Enriquecer o contêiner de retrato com ornamentos góticos forjados e relevo.
  2. Retratos dinâmicos procedurais aprimorados com brasões de facção e paleta condizente com a personalidade do interlocutor (Maelen: Carmesim/Sangue; Elder/Sábio: Roxo Arcano; Sentinela: Aço/Ferro; Mercador: Ouro/Bronze).
  3. Efeito sutil de respiração de luz/halo místico no retrato ativo.

---

## 3. Critérios de Aceite & Gates de Verificação

1. **Compilação**: `lint_applet` e `compile_applet` sem nenhum erro de tipo TypeScript.
2. **Suíte de Testes**: `pnpm test` com 405+ testes aprovados (zero regressão).
3. **Isolamento de Eventos**: Nenhum clique ou toque nos modais dispara disparos de projétil ou comandos de movimentação no canvas do Phaser.
4. **Gamepad**: Foco visual e seleção funcional sem erros de console.
