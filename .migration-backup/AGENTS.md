---
node_type: Root
domain: Global Router & System Policy
token_weight: Low (~300 tokens)
masters:
  - /docs/AGENTS.md (Modos de Operação & Regras de IA)
  - /docs/ARCHITECTURE.md (Arquitetura Técnica React + Phaser 3)
  - /docs/BEST_PRACTICES.md (Boas Práticas de Engenharia e UX/Juice)
  - /docs/SPEC.md (Central de Especificações Spec-Driven)
---

# 🕸️ Graph Documental — Root Router (Bloodmage 1995)

Este arquivo é o **Nó Raiz (Root Node)** da arquitetura documental orientada a contexto para agentes de IA.

## 🧭 Roteador de Contexto (Navegação Eficiente por Token)

Para economizar tokens e evitar ler o codebase aleatoriamente, siga o grafo de dependências conforme o seu objetivo:

| Objetivo da Tarefa | Nó Mestre a Consultar | Satélites Relacionados (Se necessário) |
| :--- | :--- | :--- |
| **Dúvidas, Regras, Modos de Resposta** | `/docs/AGENTS.md` | - |
| **Entender Arquitetura, Estado, Phaser/React** | `/docs/ARCHITECTURE.md` | `/docs/satellites/SPEC_REFACTOR.md` |
| **Padrões de Código, UX/Juice, PWA, Deploy** | `/docs/BEST_PRACTICES.md` | `/docs/satellites/ROADMAP.md` |
| **Criar/Alterar Features ou Refatorar** | `/docs/SPEC.md` | `/docs/satellites/SPEC_LOOT.md`, `SPEC_REFACTOR.md` |
| **Lore, Estética, Texto e Conceito de Jogo** | `/docs/ARCHITECTURE.md` | `/docs/satellites/LORE_BLOODMAGE.md` |
| **Handover ou Integração Externa (Jules/Stitch)** | `/docs/AGENTS.md` | `/docs/satellites/JULES_HANDOVER.md` |

---

## ⚙️ Diretivas Principais do Sistema

1. **Context-Driven Engineering**: Nunca inspecione código aleatoriamente. Leia primeiro o Nó Mestre referente à sua tarefa.
2. **Spec-Driven Development**: Alterações médias/altas de complexidade exigem spec e contratos aprovados em `/docs/SPEC.md` antes da implementação.
3. **Preservação de Desempenho**: Arquitetura híbrida React + Phaser com estado sincronizado via Zustand (`src/store/gameStore.ts`).
