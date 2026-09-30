---
agent_context: frontend
target_module: src/components/PrestigeModal.tsx
priority: medium
criticality: low
status: completed
last_updated: 2026-09-09
tags: [specs, prestige, ui, delivered]
---

# 🏅 Sistema de Prestígio (Blood Seal) — Modal de UI (Concluído)

> **Atualizado em 2026-09-09**: O componente `PrestigeModal.tsx` foi implementado e integrado ao `App.tsx` e `ActionButtons.tsx` com suporte a navegação por gamepad, hotkey 'P', visualização de bônus passivos acumulados, alocação de Selos de Sangue, seleção de dificuldades unlocked e confirmação de ritual de sacrifício.

## Escopo Entregue

- Componente React `src/components/PrestigeModal.tsx` e suíte de testes `src/components/PrestigeModal.test.tsx`.
- Interface no padrão gótico com `ModalBase`, `Framer Motion`, `useGamepadUINavigation`, `soundEngine` e `i18n`.
- Visualização das estatísticas de prestígio, pontos de selo disponíveis e bônus acumulados de `getPrestigeModifiers()`.
- Alocação interativa de pontos em selos (`carnage`, `dark_vitality`, `runic_flow`, `deep_vampirism`, `macabre_fortune`).
- Seleção de dificuldades (`normal`, `nightmare`, `inferno`).
- Confirmação explícita no Ritual de Sacrifício executando `performPrestige()` e sincronizando o reset da instância viva do caçador.

## Referências

- [[../delivered/18_PRESTIGE_SYSTEM_BLOOD_SEAL.md]] — spec completa da lógica e persistência
- [[../../product/ROADMAP.md]] — roadmap de produto
