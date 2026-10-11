# Base documental: documentos fora de `docs/` e duplicatas (organização)

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Estado vs código:** verificado em 2026-10-11 (inventário por `git ls-files '*.md'` e `diff`): achados confirmados. Nada foi alterado.

## Contexto
O padrão da base documental diz que o conhecimento vive em `docs/`, com `docs/README.md` como entrada, e que não há relatórios nem histórico. O repositório ainda tem documentos fora dela, alguns desatualizados ou duplicados:

| Achado | Onde | Evidência |
|---|---|---|
| Skills do Phaser **triplicadas** | `skills/`, `.claude/skills/`, `.agents/skills/` | `diff` dos 5 `SKILL.md` comuns: idênticos nas 3 cópias. `phaser-4-procedural-generation` só existe em `.claude/skills/`; `spritecook-integration` só em `skills/`. |
| Relatório de auditoria no repositório | `.aistudio/artifacts/brain/<id>/implementation_plan.md` (93 linhas) | É um relatório de auditoria de instruções, não descreve o projeto de hoje. |
| Documentação do agente desatualizada | `.claude/README.md` (164), `.claude/token-optimization.md` (308) | Descrevem uma organização anterior de `docs/` e estratégia de tokens; `claude.json` ainda ignora `docs/specs/rejected/**`, `archived/**` e `discovery/**`, pastas que não existem mais. |
| Memória de agente com link quebrado | `.agents/memory/MEMORY.md` | Aponta para `docs/SPECS_EVOLUCAO.md` e diz que a base foi "recriada em Agosto/2026"; o arquivo não existe. |
| Diários de agente | `.jules/bolt.md`, `.jules/sentinel.md` | Diários de aprendizado de outras ferramentas, fora da estrutura. |
| Docs de operação na raiz | `DEPLOYMENT.md` (223), `replit.md` (50) | Duplicam `docs/operations/`; `replit.md` afirma que o PWA foi removido e que o código está em `artifacts/bloodmage/`, o que o código contradiz. |
| `AGENTS.md` | raiz | Ponteiro para `CLAUDE.md` mais a seção de autenticação do GitHub (PAT para o Google AI Studio), mantida por decisão do responsável. |

## Objetivo
Proposta: uma única fonte para cada conhecimento, tudo que descreve o projeto em `docs/`, e o que é configuração de ferramenta (skills, memória) sem cópias divergentes.

## Decisões
Aprovadas em 2026-10-11 pelo responsável: 1, 3, 4 e 5, conforme a coluna Recomendação, e a 2 (manter `.jules/` e `.agents/` por ora). Pendência: ver Questões em aberto.

| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| 1 | Qual cópia das skills fica | `.claude/skills/` (Claude Code), `skills/`, ambas | `.claude/skills/` como fonte única: é a que o `CLAUDE.md` cita; mover `spritecook-integration` para lá. |
| 2 | `.agents/` e `.jules/` | manter, apagar | Informado pelo responsável em 2026-10-11: o Google AI Studio é usado e o Jules só eventualmente. Recomendo manter `.jules/` e `.agents/` por ora e só apagar depois de confirmar o que o AI Studio lê. |
| 3 | `.aistudio/.../implementation_plan.md` | apagar, mover para o Git history | Apagar: é relatório; o histórico fica no Git. |
| 4 | `.claude/README.md` e `token-optimization.md` | reescrever curtos, apagar | Apagar o `token-optimization.md` e reduzir o README a um ponteiro para `docs/README.md`. |
| 5 | `DEPLOYMENT.md` e `replit.md` | apagar, reduzir a ponteiro | Informado pelo responsável em 2026-10-11: o Replit não é usado. Recomendo apagar `replit.md` e reduzir `DEPLOYMENT.md` a ponteiro para `docs/operations/`. |

## Escopo
Remover ou mover os itens da tabela conforme as decisões, corrigir `.claude/claude.json` e referências, e registrar em `docs/engineering/` quais pastas de ferramenta existem e o que cada uma é.

## Fora de escopo
Alterar o conteúdo das skills, o procedimento do PAT em `AGENTS.md` e qualquer código de `src/`.

## Arquivos e contratos
- Remover/mover: os caminhos da tabela, conforme as decisões 1 a 5.
- Alterar: `.claude/claude.json` (remover padrões de pastas inexistentes), `CLAUDE.md` se o caminho das skills mudar.
- Não tocar: `AGENTS.md` (seção do PAT), `src/`, `docs/specs/` (fora desta spec).

## Critérios de aceite
- **BD-1** O repositório deve conter uma única cópia de cada `SKILL.md`, no caminho decidido.
- **BD-2** Se existir um `.md` fora de `docs/`, então ele deve ser apenas configuração de ferramenta (`CLAUDE.md`, `AGENTS.md`, skills) ou ponteiro para `docs/README.md`.
- **BD-3** O `.claude/claude.json` não deve listar caminhos que não existem.
- **BD-4** O `docs:check` deve passar (`pnpm run docs:check`) após as remoções.
- **BD-5** Se o `CLAUDE.md` citar um caminho de skill, então esse caminho deve existir.

## Plano de verificação
| Critério | Como verificar |
|---|---|
| BD-1 | `find . -name SKILL.md -not -path './node_modules/*'` sem nomes repetidos |
| BD-2 | `git ls-files '*.md'` revisado contra a lista permitida |
| BD-3 | script/`test -e` sobre cada caminho do JSON |
| BD-4 | `pnpm run docs:check` |
| BD-5 | `test -e` sobre os caminhos citados no `CLAUDE.md` |

## Questões em aberto
Contradição entre decisões aprovadas: a 1 pede uma única cópia das skills em `.claude/skills/` (BD-1), e a 2 mantém `.agents/`, que contém uma cópia (`.agents/skills/`). Falta o responsável confirmar o que o Google AI Studio lê: remover só `.agents/skills/` e manter `.agents/memory/` (recomendo) ou manter `.agents/skills/` e ajustar BD-1.

## Referências
[Documento mestre das specs](README.md); `docs/engineering/stack-and-conventions.md` (estrutura do repositório); ADR 0015 em `docs/decisions/`.
