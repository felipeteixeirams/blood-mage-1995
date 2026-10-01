---
agent_context: lead-architect, project-manager
target_module: docs/specs/delivered
priority: high
status: completed
last_updated: 2026-08-27
tags: [specs, master-index, expansion, replayability, satellite-index]
---

# 🗺️ Spec 12: ÍNDICE MESTRE — Expansion & Replayability Fronts

## Objetivo Geral
Estruturar o plano de expansão do *Blood Mage 1995*, coordenando a evolução de mecânicas de combate, navegação, metajogo, UX e áudio através de uma arquitetura modular de especificações satélites.

---

## 📚 Mapeamento das Frentes de Expansão (Satélites)

Todas as 5 frentes de expansão foram concluídas e dissecadas em especificações satélites detalhadas:

| ID | Especificação Satélite | Frente de Expansão | Status |
|---|---|---|---|
| **12.01** | [[12_01_EXPANSION_TRAPS_INTERACTIONS.md]] | Interações de Ambiente e Armadilhas | 🟢 COMPLETO |
| **12.02** | [[12_02_EXPANSION_AI_ELITE_MOBS.md]] | Inteligência Artificial e Modificadores de Elite | 🟢 COMPLETO |
| **12.03** | [[12_03_EXPANSION_META_PROGRESSION.md]] | Meta-Progressão e Economia de Cristais | 🟢 COMPLETO |
| **12.04** | [[12_04_EXPANSION_UX_POLISH.md]] | Interface, UX e Polimento Sombrio | 🟢 COMPLETO |
| **12.05** | [[12_05_EXPANSION_AUDIO_SOUNDTRACK.md]] | Trilha Sonora Procedural 16-Bit FM | 🟢 COMPLETO |

---

## 📈 Resumo do Histórico de Entregas & Auditoria

- **Frente 1 (Armadilhas):** Entregue com `SpikeTrap` e `ExplosiveBarrel` em `src/game/objects/Traps.ts`.
- **Frente 2 (IA Elite):** Entregue com afixos `teleporter` e `reflective` em `src/game/objects/Enemy.ts`.
- **Frente 3 (Meta-Progressão):** Entregue com persistência Zod e árvore de talentos em `src/store/gameStore.ts`.
- **Frente 4 (UX Polish):** Entregue com `InventoryModal.tsx`, `Minimap.tsx` e remoção do overlay duplicado antigo em `GameplayHUD.tsx`.
- **Frente 5 (Trilha 16-Bit):** Entregue com sintetizador FM puro em `src/utils/bgmSynthesizer.ts`.

---

## Validação & Qualidade
- Todos os contratos de código e testes foram verificados e validados (`pnpm test` e `pnpm run typecheck`).
- Todas as especificações satélites contêm caminhos de código reais e verificados no repositório.
