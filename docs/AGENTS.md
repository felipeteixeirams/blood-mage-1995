---
node_type: Master
parent_node: /AGENTS.md
domain: Operational Rules & AI Behavior
token_weight: Medium (~600 tokens)
satellites:
  - /docs/satellites/JULES_HANDOVER.md
---

# 🤖 Master: AI Agent Operating Rules & Directives

Este é o **Nó Mestre de Comportamento dos Agentes de IA**. Define as regras de engajamento, seleção de modo de operação e otimização de contexto para o projeto **Bloodmage 1995**.

---

## 🎛️ Seleção de Modo de Operação (Mode Selection)

Antes de responder ou executar ações, identifique o modo adequado:

### 1. Conversational Mode (Baixo Atrito)
- **Quando usar**: Perguntas conceituais, comparações técnicas, dúvidas rápidas, opiniões de arquitetura sem implementação.
- **Comportamento**: Responda de forma concisa, direta e útil. **NÃO** gere specs formais nem planos extensos.

### 2. Architecture Mode (Decisão Estrutural)
- **Quando usar**: Discussão de novos módulos, desenho de sistemas, tradeoffs entre React e Phaser, estratégias de estado.
- **Comportamento**: Apresente a estrutura, vantagens/desvantagens e proponha abordagens modulares com foco na manutenção.

### 3. Spec-Driven Mode (Implementação Disciplinada)
- **Quando usar**: Implementação de novas mecânicas, refatoração de arquivos monolíticos, alterações em persistência ou múltiplos módulos.
- **Comportamento**: Siga rigorosamente o fluxo: **Spec Phase** -> **Contract Phase** -> **Implementation Phase** conforme registrado em `/docs/SPEC.md`.

---

## 📊 Avaliação de Complexidade (Complexity Evaluation)

- **Baixa Complexidade** (Ajustes de layout pequenos, correções isoladas): Responder/corrigir diretamente.
- **Média Complexidade** (Nova magia, subcomponente do HUD, ajustes de física): Mini-spec simples e execução focada.
- **Alta Complexidade** (Refatoração de cena principal `GameScene.ts`, novo sistema de loot/inventário, persistência): Fluxo Spec-Driven completo.

---

## 🧭 Diretrizes de Resposta e Token Economy

1. **Economia de Contexto**: Não leia arquivos aleatórios sem necessidade. Utilize a hierarquia `Root -> Master -> Satélite`.
2. **Sem Regressão**: Alterações na Engine (`Phaser 3`) não devem quebrar os callbacks e pontes com a UI (`React`).
3. **Linter & Build Validation**: Toda alteração de código deve ser acompanhada de validação TypeScript / Linter.
