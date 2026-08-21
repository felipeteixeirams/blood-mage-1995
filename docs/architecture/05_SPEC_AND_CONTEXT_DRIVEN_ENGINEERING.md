---
agent_context: Engenheiros de Software, Arquitetos e Agentes IA
target_module: Metodologia de Desenvolvimento, Governança de Código e IA
priority: high
status: active
last_updated: 2026-08-19
tags: [spec-driven, context-driven, architecture, ai-guidelines, workflow]
---

# 📐 Spec-Driven & Context-Driven Engineering: Padrão Operacional

> **Princípio Fundamental:** Nem toda interação exige especificação formal.  
> O objetivo desta metodologia é unir a máxima velocidade e baixo atrito em conversas e alinhamentos diários com a robustez e blindagem formal para mudanças arquiteturais e código de produção.

---

## 🎯 1. Filosofia Operacional

Desenvolver com auxílio de IA (Vibe Coding disciplinado) exige **discernimento contextual**. O excesso de burocracia paralisa a iteração rápida de Game Design, enquanto a falta de contratos gera regressões e corrupção de estado.

A metodologia baseia-se em dois pilares integrados:

1. **Context-Driven Retrieval:** Ler a documentação canônica do projeto (`/docs`) e contratos existentes antes de inspecionar ou inferir código aleatoriamente.
2. **Dynamic Spec-Driven Delivery:** Escalonar o nível de rigor e especificação estritamente de acordo com a complexidade e o risco da demanda.

---

## 🚦 2. Matriz Dinâmica de Seleção de Modo (Mode Selection)

Antes de qualquer resposta ou ação, a IA/engenheiro deve classificar a solicitação em um dos 3 modos operacionais:

```
                  ┌─────────────────────────────────────┐
                  │ Classificação da Intenção do Usuário │
                  └──────────────────┬──────────────────┘
                                     │
           ┌─────────────────────────┼─────────────────────────┐
           ▼                         ▼                         ▼
  [Conversational Mode]     [Architecture Mode]       [Spec-Driven Mode]
  • Dúvidas conceituais      • Tradeoffs técnicos      • Novas features amplas
  • Brainstorm & ideias      • Desenho estrutural      • Refatorações globais
  • Alinhamentos rápidos     • Análise de riscos       • Mudança de persistência
           │                         │                         │
           ▼                         ▼                         ▼
   Resposta Direta,           Tradeoffs Cloros,        Spec ➔ Contratos ➔
  Concisa e Sem Specs         Mini-Spec Opcional       Implementação Segura
```

### Modo 1: Conversational Mode (Zero-Overhead / Baixo Atrito)
* **Quando ativar:**
  * Perguntas conceituais, dúvidas rápidas sobre o funcionamento do jogo.
  * Brainstorm de game feel, ideias de design, mecânicas ou história.
  * Pedidos de opinião técnica, recomendações ou comparações.
  * Alinhamentos de escopo antes de qualquer decisão de implementação.
* **Comportamento Mandatório:**
  * Responda de forma direta, técnica e concisa.
  * **PROIBIDO** gerar especificações formais, documentos em pastas de specs ou fases de projeto desnecessárias.
  * **PROIBIDO** gerar blocos maciços de código a menos que o usuário peça explicitamente um exemplo.
* **Objetivo:** Velocidade máxima, menor consumo de tokens e resposta fluida.

---

### Modo 2: Architecture Mode (Tradeoffs & Decisões)
* **Quando ativar:**
  * Discussões estruturais sobre divisão de responsabilidade (ex: React DOM vs Phaser Canvas).
  * Avaliação de tecnologias, bibliotecas ou APIs (ex: Web Audio vs sintetizador customizado).
  * Análise de gargalos de performance (VRAM, GC spikes, FPS drops no mobile).
  * Desenho de novos subsistemas antes do desenvolvimento.
* **Comportamento Mandatório:**
  * Apresente a arquitetura e fluxos de dados de forma visual e clara.
  * Compare vantagens, desvantagens e riscos de regressão de cada abordagem.
  * Proponha alternativas pragmáticas, evitando overengineering ou abstrações prematuras.
  * Gere uma mini-especificação técnica **apenas se o usuário solicitar** estruturar a decisão.
* **Objetivo:** Apoiar a tomada de decisão técnica de alto nível com fundamentação sólida.

---

### Modo 3: Spec-Driven Mode (Execução Controlada)
* **Quando ativar (E APENAS QUANDO):**
  * O usuário solicitar formalmente a implementação de uma feature relevante.
  * Houver refatoração significativa de múltiplos módulos.
  * Houver mudanças em persistência (`localStorage`, Zod schemas, salvamento de dados).
  * Houver impacto no pipeline de assets, áudio ou física do jogo.
* **Fluxo Obrigatório em 3 Fases:**

```
 1. SPEC PHASE           2. CONTRACT PHASE         3. IMPLEMENTATION PHASE
 ┌────────────────┐      ┌──────────────────┐      ┌─────────────────────────┐
 │ • Problema     │      │ • Schemas Zod    │      │ • Código Cirúrgico (<400)│
 │ • Escopo In/Out│ ───► │ • Interfaces TS  │ ───► │ • Testes Unitários/E2E  │
 │ • Riscos       │      │ • Event Payloads │      │ • Zero Regressão        │
 │ • Critérios    │      │ • Test Cases     │      │ • Verificação Integrada │
 └────────────────┘      └──────────────────┘      └─────────────────────────┘
```

#### Fase 1: Spec Phase
Define o **o que** e o **porquê**:
1. **Objetivo Geral:** O que será construído e qual o benefício.
2. **Escopo (In-Scope):** O que entra exatamente na entrega.
3. **Fora de Escopo (Out-of-Scope):** O que **NÃO** entra para prevenir scope creep.
4. **Módulos Impactados:** Arquivos e componentes afetados.
5. **Corner Cases & Riscos:** Falhas possíveis, desconexões, salvamento corrompido, fallback.
6. **Critérios de Aceite:** Condições determinísticas para considerar o trabalho concluído.

#### Fase 2: Contract Phase
Define o **como** antes do código:
1. **Tipos e Interfaces TypeScript:** Declaração estrita (sem `any`).
2. **Schemas de Validação:** Zod schemas com safe-parse e migração para persistência.
3. **Contratos de Eventos:** Nomes e payloads de eventos entre Phaser e React.
4. **Cenários de Teste:** Casos de teste unitários/integrados mapeados.

#### Fase 3: Implementation Phase
Executa a construção com cirurgia de precisão:
1. Código limpo, desacoplado e aderente aos contratos.
2. Arquivos grandes (>400 linhas) alterados com diffs cirúrgicos.
3. Execução dos testes (`npm test`), typecheck (`npm run typecheck`) e integridade de assets (`node scripts/verify-assets.cjs`).

---

## 📊 3. Matriz de Avaliação de Complexidade (Complexity Triage)

| Nível de Complexidade | Exemplos Típicos | Modo de Ação Requerido | Nível de Documentação |
|---|---|---|---|
| **BAIXA (Low)** | Correção de bug visual simples, ajuste de valor numérico/balanceamento, dúvida rápida, correção de typo. | Ação Direta | Resposta direta / Commit cirúrgico sem spec formal. |
| **MÉDIA (Medium)** | Nova magia/habilidade isolada, novo componente de UI overlay, refatoração de uma função de utilitário. | Mini-Spec Objetiva | Resumo de contratos no chat ou mini-spec de 1 página. |
| **ALTA (High)** | Novo sistema de inventário/loot, alteração do pipeline híbrido de assets, suporte a save cloud, novo chefe com FSM complexo. | Spec-Driven Completo | Spec formal em `docs/specs/`, Contratos Zod/TS, Testes unitários e aprovação. |

---

## 🔍 4. Protocolo de Recuperação Contextual (Context-Driven Protocol)

Para evitar alucinações, desperdício de tokens e regressões:

1. **Document-First Retrieval:**
   * Inicie sempre por `docs/AGENTS.md` e `docs/README.md`.
   * Consulte o documento do domínio específico (ex: `docs/architecture/03_PHASER_PATTERNS.md` para lógicas no canvas, `docs/critical/05_TROUBLESHOOTING_KNOWN_ISSUES.md` para erros recorrentes).
2. **Proibição de Leitura Cega de Código:**
   * Nunca faça dump de múltiplos arquivos de código-fonte completos na memória de contexto.
   * Utilize buscas cirúrgicas (`grep`, visualização de linhas específicas via ferramentas de arquivo).
3. **Respeito aos Guardrails do Jogo:**
   * UI estritamente em React DOM sobreposto (`src/components/`).
   * Phaser Canvas reservado exclusivamente para renderização de jogo e mundo.
   * Proibição de "touch damage" passivo em inimigos (ataques sempre em FSM telegrafado).
   * Persistência estritamente intermediada por Zod em `src/utils/localStorage.ts`.
   * Manipulação de assets binários sempre como streams nativos (`Buffer`), nunca via editores de texto UTF-8.

---

## ✅ 5. Quality & Safety Gates (Critérios de Conclusão)

Toda tarefa concluída deve passar pelo checklist:

- [ ] **Validação de Assets Binários:** `node scripts/verify-assets.cjs` retornando 100% íntegro.
- [ ] **TypeScript Strict:** `npm run typecheck` com 0 erros.
- [ ] **Testes Unitários:** `npm test` executado e todos os testes passando.
- [ ] **Build de Produção:** `npm run build` bem-sucedido.
- [ ] **Registro de Troubleshooting:** Qualquer bug ou comportamento inesperado resolvido deve ser documentado em `docs/critical/05_TROUBLESHOOTING_KNOWN_ISSUES.md`.
