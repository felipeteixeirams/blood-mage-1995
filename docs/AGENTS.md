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
| `architecture/` | Decisões técnicas, stack, padrões Phaser, estado e refatoração de cenas |
| `critical/` | Anti-regressão, arquivos críticos, performance, troubleshooting e testing gates |
| `experiments/` | Experimentos de laboratório mobile (câmera, ergonomia touch, combate) |
| `product/` | Bíblia de sucesso mobile, roadmap, estratégia de release e salvamento |
| `reviews/` | Auditorias e relatórios de qualidade de código e documentação |
| `specs/` | Specs por ciclo de vida: `in-progress/`, `delivered/`, `backlog/`, `discovery/`, `rejected/` |
| `archive/` | Histórico arquivado e documentação legada (`context/`, `design/`, `gameplay/`, `features/`, `integration/`, `reference/`, `templates/`, `reviews/`, `deployment/`, `legacy/`) |

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

## Fluxo de trabalho spec-driven

1. Antes de implementar algo relevante, verifique se já existe spec em `docs/specs/` (veja `specs/README.md` para status).
2. Se não existir, crie uma spec incremental em `specs/backlog/` ou `specs/in-progress/`.
3. Spec define o **o que e por quê**; `context/` e `architecture/` definem o **como e o estado atual**. Implemente seguindo ambos.

## Atualizar documentação é parte do trabalho

Toda mudança relevante deve atualizar os documentos impactados. Ao fechar uma tarefa, registre: descobertas, decisões, riscos, mitigação e conteúdo obsoleto ajustado ou removido.

## Modelo de decisão (onde colocar conteúdo)

- Entendimento fundamental do projeto / arquitetura → `architecture/`
- Guardrails e troubleshooting críticos → `critical/`
- Regras de produto e visão mobile → `product/`
- Tarefa/requisito em andamento ou especificado → `specs/`
- Experimentos e hipóteses de game feel → `experiments/`
- Auditorias e revisões → `reviews/`
- Histórico obsoleto → `archive/`

## Ferramentas de qualidade

- Rodar typecheck do jogo: `pnpm run typecheck` ou `pnpm run verify`.
- Validar mudanças contra `critical/03_TESTING_GATES.md` e anti-regressão (`critical/00_ANTI_REGRESSION_GUIDE.md`).
