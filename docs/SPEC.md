---
node_type: Master
parent_node: /AGENTS.md
domain: Specification Hub & Feature Contracts
token_weight: Medium (~500 tokens)
active_satellites:
  - /docs/satellites/SPEC_LOOT.md
  - /docs/satellites/SPEC_REFACTOR.md
  - /docs/satellites/SPEC_BOSS_FIGHTS.md
---

# 📋 Master: Specifications Index (Spec Hub)

Este é o **Nó Mestre da Metodologia Spec-Driven Development**. Qualquer nova funcionalidade, refatoração de código ou mudança arquitetural de média/alta complexidade deve ser documentada aqui ou registrada como um documento Satélite.

---

## 🚀 Especificações Ativas

| Especificação | Status | Domínio | Arquivo Satélite |
| :--- | :--- | :--- | :--- |
| **Sistema de Loot & Atributos** | 🟢 Concluído | Mecânica de Jogo / Inventário | `/docs/satellites/SPEC_LOOT.md` |
| **Refatoração Estrutural Fase 1.5** | 🟡 Em Progresso | Modularização de `GameScene` e `HUD` | `/docs/satellites/SPEC_REFACTOR.md` |
| **Boss Encounters & Bullet Hell** | 🟡 Prontos p/ Jules | Boss Fights & Padrões de Ataque | `/docs/satellites/SPEC_BOSS_FIGHTS.md` |

---

## 📝 Modelo Padrão de Especificação (Spec Template)

Ao criar uma nova especificação, utilize a estrutura abaixo:

```markdown
# Spec: [Nome da Funcionalidade]

## 1. Objetivo Geral
Descrição em alto nível do que será feito e o impacto esperado.

## 2. Escopo & Fora do Escopo
- **Entra**: O que faz parte da entrega.
- **Não Entra**: Limitações explícitas para evitar inflação de escopo.

## 3. Arquitetura & Módulos Impactados
Quais classes do Phaser, componentes React ou stores serão modificados.

## 4. Contratos & Tipos (TypeScript)
Definição de interfaces, enums ou eventos ANTES da implementação.

## 5. Fluxo de Execução
Etapas sequenciais para a implementação.

## 6. Riscos & Critérios de Aceite
Como validar a funcionalidade e prevenir regressões.
```
