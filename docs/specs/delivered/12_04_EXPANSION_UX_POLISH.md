---
agent_context: ui-engineer, ux-designer
target_module: docs/specs/delivered
priority: medium
status: completed
last_updated: 2026-08-27
tags: [specs, delivered, ux, ui, inventory, minimap, status-bar, game-feel]
---

# 👁️ Spec 12.04: Interface/UX e Polimento Sombrio (Game Feel)

## Objetivo
Elevar a clareza de dados visuais, feedback tático de equipamentos e consciência espacial do jogador através de um comparativo visual dinâmico no inventário, minimapa com suporte a perigo e barra de status em tempo real.

---

## Status
🟢 **COMPLETO**

---

## O que foi Entregue
- **Comparativo Visual no Inventário:**
  - Card de comparação dinâmica de atributos ao inspecionar relíquias e itens.
  - Exibição de ganhos/perdas com badges visuais e setas indicadoras verdes e vermelhas.
  - Filtros por categoria (*Todas*, *Desbloqueadas*, *Equipadas*).
- **Minimapa Aprimorado:**
  - Cabeçalho de piso com ícone de bússola e indicador de escala 3x3.
  - Destaque visual com contorno em chamas/perigo para a sala do chefe e orbe pulsante para o jogador.
- **Feedback Visual de Buffs e Maldições:**
  - Barra de status dedicada em `PlayerStatus.tsx` para exibição instantânea de afecções: Sangramento, Veneno, Infecção e Fúria Crítica (<25% HP).

---

## Referência no Código
- `src/components/InventoryModal.tsx` — Modal React único de inventário com comparativo de atributos.
- `src/components/hud/Minimap.tsx` — Componente de minimapa procedimental com marcadores de salas e orbe de posição.
- `src/components/hud/PlayerStatus.tsx` — Barra de buffs, debuffs e status de fúria crítica.
- `src/store/gameStore.ts` — Estado centralizado de seleção e inspeção de relíquias.

---

## Validação
- Auditoria de código (27/08) identificou e eliminou o overlay duplicado de inventário que existia em `GameplayHUD.tsx`, consolidando a UI no `InventoryModal.tsx`.
- Suíte de testes e verificação visual do Playwright E2E 100% funcionais.
- Zero erros no TypeScript (`pnpm run typecheck`).

---

## Notas
- O inventário antigo hardcoded foi completamente removido, eliminando sobreposições visuais e garantindo sincronia total com o estado do jogador.
