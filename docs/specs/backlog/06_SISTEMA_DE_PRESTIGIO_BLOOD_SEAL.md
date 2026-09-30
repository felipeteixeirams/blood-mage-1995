---
agent_context: frontend
target_module: src/components
priority: medium
criticality: low
status: backlog
last_updated: 2026-09-06
tags: [specs, prestige, ui, backlog-real]
---

# 🏅 Sistema de Prestígio (Blood Seal) — Gap Real: Modal de UI

> **Reduzido nesta forma em 2026-09-06** (ver auditoria em
> `docs/reviews/03_AUDITORIA_BASE_DOCUMENTAL_2026_09.md`). Este arquivo
> era uma proposta completa de "0% de código" para um sistema de
> Prestígio ("Selo de Sangue") — mas o sistema **já existe, ~90%
> implementado**, em
> [`delivered/18_PRESTIGE_SYSTEM_BLOOD_SEAL.md`](../delivered/18_PRESTIGE_SYSTEM_BLOOD_SEAL.md).
> Confirmado no código: `canPrestige()`, `performPrestige()`,
> `allocateBloodSeal()`, `getPrestigeModifiers()` em `src/store/gameStore.ts`,
> multiplicadores aplicados em `Player.ts`, persistência Zod e SFX
> dedicados. Manter a proposta antiga como "0% código, aguardando início"
> teria risco real de retrabalho — um agente pegando este arquivo
> literalmente reimplementaria do zero um sistema que já funciona,
> possivelmente divergindo do design já em produção.

## O que falta de verdade

Só uma coisa, confirmada por `delivered/18` (seção "Status do Modal UI"):
o **modal React** que aciona o prestígio visualmente na Safe House ainda
não existe. Backend, persistência, regras de negócio e cálculo de
atributos estão 100% implementados e operacionais.

**Escopo desta frente, se/quando for retomada:**
- Um componente React (padrão dos outros modais do jogo — ver
  `AchievementsModal.tsx`/`InventoryModal.tsx` como referência de
  estilo/estrutura) que:
  - Mostra o estado atual (nível, progresso pro próximo Selo de Sangue).
  - Chama `canPrestige()`/`performPrestige()`/`allocateBloodSeal()` já
    existentes em `gameStore.ts` — **não reimplemente essa lógica**.
  - Confirmação explícita antes do reset (é uma ação destrutiva de
    progresso de nível).
- Onde ele é acionado (NPC dedicado na Safe House? item de menu?) é uma
  decisão de produto que falta tomar — ver `docs/product/ROADMAP.md`
  antes de começar.

## Referências

- [[../delivered/18_PRESTIGE_SYSTEM_BLOOD_SEAL.md]] — spec completa do que já está implementado
- [[../../product/ROADMAP.md]] — onde essa frente se encaixa no roadmap de produto
