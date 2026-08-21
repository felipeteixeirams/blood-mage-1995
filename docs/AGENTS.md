# Docs — Bootstrap para Agentes de IA

> **Leia isto primeiro.** Este arquivo é o ponto de entrada obrigatório da documentação do Bloodmage 1995. Antes de qualquer tarefa que envolva contexto do projeto, comece por aqui e siga o fluxo abaixo. Não explore arquivos soltos antes de ler o hub.

## Fluxo de navegação

1. **Este arquivo** (`docs/AGENTS.md`) — visão geral e regras de navegação.
2. **Documento mestre** — `docs/README.md` é o índice master do domínio (árvore de pastas, matriz de contexto por tarefa/role).
3. **Documentos satélite** — detalhe específico conforme a tarefa, via wiki-links `[[caminho/arquivo.md]]`.

Regra prática: **nunca** comece a explorar por arquivos soltos. Comece pelo hub de entrada.

## Estrutura de pastas

Todas as pastas em caixa baixa. Categorias definidas pela arquitetura do jogo (não de um projeto externo):

| Pasta | Conteúdo |
|-------|----------|
| `context/` | Contextos por role/agente (Frontend, Backend, Game Design, QA, Product) |
| `architecture/` | Decisões técnicas, stack, padrões Phaser, estado |
| `design/` | Filosofia visual, identidade, UI patterns, acessibilidade |
| `gameplay/` | Mecânicas do jogo (inconsciência, combate, skills, loot, records) |
| `features/` | Features em desenvolvimento (roadmap Dungeon Siege) |
| `critical/` | Anti-regressão, arquivos críticos, performance, testing gates |
| `integration/` | Third-party e tools (Lovable, Vercel, MCP, agentes) |
| `reference/` | Referência rápida, estrutura de arquivos, tipos, endpoints |
| `specs/` | Specs por ciclo de vida: `propostas/`, `andamento/`, `finalizadas/` |
| `reviews/` | Auditorias e validações (qualidade, validação de features) |
| `decisions/` | ADRs e decisões de arquitetura |
| `templates/` | Modelos padronizados de documento (incl. frontmatter) |
| `wip/` | Trabalho em progresso (não consolidado) |
| `legacy/` | Histórico e conteúdo descontinuado |

## Metadados padrão (frontmatter)

Todo documento deve abrir com frontmatter YAML. O padrão mínimo:

```yaml
---
agent_context: <para qual agente/role este doc serve>
target_module: <módulo/área do código afetada>
priority: <high | medium | low>
status: <draft | active | complete | obsolete>
last_updated: <AAAA-MM-DD>
tags: [<tag1>, <tag2>]
---
```

Recupere metadados com grep no início do arquivo antes de ler o documento inteiro — economiza tokens e permite indexação.

## Fluxo de trabalho spec-driven inteligente

> **Princípio Fundamental:** Nem toda interação exige especificação formal.  
> Nunca crie specs, documentos burocráticos ou planos de múltiplas fases para conversas simples, dúvidas ou brainstorms.

### Matriz de Seleção de Modo Operacional:
1. **Conversational Mode (Dúvidas, Brainstorm, Alinhamento):**
   - Perguntas conceituais, dúvidas rápidas, discussões de game feel ou opiniões técnicas.
   - **Ação:** Responda diretamente, de forma técnica e concisa. **NÃO** crie specs formais nem planos de implementação desnecessários.
2. **Architecture Mode (Tradeoffs & Decisões Estruturais):**
   - Desenho de módulos, avaliação de tecnologias, análise de performance.
   - **Ação:** Apresente prós/contras e fluxos. Gere mini-specs **apenas se solicitado**.
3. **Spec-Driven Mode (Implementações Relevantes & Refatorações Críticas):**
   - **APENAS** quando o usuário pedir implementação de feature relevante, refatoração de múltiplos módulos ou mudanças em persistência/arquitetura.
   - **Ação:** Siga as 3 fases: `Spec Phase` -> `Contract Phase` -> `Implementation Phase` (detalhado em `docs/architecture/05_SPEC_AND_CONTEXT_DRIVEN_ENGINEERING.md`).

## Atualizar documentação é parte do trabalho

Toda mudança relevante deve atualizar os documentos impactados. Ao fechar uma tarefa, registre: descobertas, decisões, riscos, mitigação e conteúdo obsoleto ajustado ou removido.

## Modelo de decisão (onde colocar conteúdo)

- Entendimento fundamental do projeto → `context/` ou `architecture/`
- Decisão formal → `decisions/`
- Tarefa/requisito em andamento → `specs/`
- Temporário → `wip/`
- Histórico → `legacy/`

## Ferramentas de qualidade

- Rodar typecheck do jogo: via WSL (`wsl -e bash -lc "node node_modules/typescript/bin/tsc -p artifacts/bloodmage/tsconfig.json --noEmit"`).
- Validar mudanças contra `critical/03_TESTING_GATES.md` e anti-regressão (`critical/00_ANTI_REGRESSION_GUIDE.md`).
