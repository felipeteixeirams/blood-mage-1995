# Base documental: organização interna e novas validações do `docs:check`

**Mestre:** [in-progress](README.md)
**Estágio:** in-progress
**Aprovação do responsável:** aprovada por Felipe Teixeira em 2026-10-11, conforme conversa de 2026-10-11 (as 5 decisões, conforme a coluna Recomendação, e a regra de tamanho também para specs)
**Estado vs código:** verificado em 2026-10-11. Feito: pasta `ui/`, `critical/` dissolvida em `engineering/`, renomeações, prefixos de tipo e pastas das specs multi-parte (BV-1, BV-2, BV-8 a BV-11). Pendente: divisão dos 5 documentos (BV-12, BV-13), links entre categorias (BV-7) e regras novas do `docs:check` (BV-3 a BV-6).

## Contexto
Medições em `docs/` (117 `.md`, 10 categorias, todas com mestre):

| Achado | Medição |
|---|---|
| `specs/defining/` é uma pasta plana grande | 45 arquivos; 22 são partes de 3 specs divididas, misturadas com as demais. A tabela do mestre tem 45 linhas. |
| Títulos com resíduo de numeração antiga | 13 specs abrem com `# Spec NN` ou `# Fase N` no H1. |
| Quase nenhum link entre categorias | 30 satélites fora das specs só são linkados pelo mestre da pasta; gameplay, architecture, decisions e troubleshooting se citam em texto, sem link. 9 menções a `*.md` em crase, sem link. |
| Spec acima do tamanho-alvo | 1 spec com 167 linhas (alvo ~150). |
| Validação incompleta de frescor | Casos de `troubleshooting/` não têm `Status`; a categoria não entra em `refCats`, então o aviso de 30 dias só cobre as datas `AAAA-MM-DD` de `Verificado em`. Há 3 documentos "não verificado" (`—`). |
| ADRs 100% "Proposta" | 15 ADRs; nenhum aprovado, então nenhuma spec pode ir a `backlog/`. |

## Objetivo
Proposta: tornar a base fácil de navegar por agente (pastas pequenas, links entre categorias, regras que o script faz cumprir).

## Decisões aprovadas
Aprovadas em 2026-10-11; a coluna Recomendação é a decisão.

| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| 1 | Specs multi-parte | pasta por spec (`defining/<spec>/README.md` + partes), manter plano | Pasta por spec: o `specs/README.md` já admite "uma spec é uma pasta"; o script exige um `README.md` por pasta, que serve de índice. |
| 2 | Títulos `Spec NN`/`Fase N` | remover prefixo, manter | Remover: o número não existe mais na base. |
| 3 | Links entre categorias | linkar satélite a satélite, só mestres | Linkar satélite a satélite no cabeçalho ("Relacionados") dos documentos de gameplay e dos ADRs. |
| 4 | Tamanho máximo | aviso, erro | Aviso acima de 150 linhas e erro acima de 300, em documentos de referência e em specs. |
| 5 | Novas regras do `docs:check` | ver critérios | Implementar BV-3 a BV-6. |
| 6 | Pasta `ui/` | criar, manter telas em `gameplay/` | Criar `ui/` com HUD, modais e acessibilidade. |
| 7 | `critical/` | manter, dissolver | Dissolver: arquivos de risco, performance e segurança vão para `engineering/`; o `CLAUDE.md` aponta para `engineering/risky-files.md`. |
| 8 | Idioma e tipo dos nomes | ver Arquivos e contratos | Referência em inglês nomeada pelo assunto; ADRs, casos e specs em português; specs com prefixo `bug-`, `feature-` ou `discovery-`. |

## Escopo
Reorganizar `defining/` conforme a decisão 1, normalizar títulos, adicionar links cruzados e acrescentar regras ao `scripts/check-docs.mjs`.

## Fora de escopo
Mudar o conteúdo técnico dos documentos e qualquer código de `src/`.

## Arquivos e contratos
- Alterar: `scripts/check-docs.mjs`, `docs/specs/defining/**`, `docs/specs/README.md`, `docs/gameplay/*.md`, `docs/decisions/*.md`.
- Regras novas do script: (k) menção `` `nome.md` `` sem link a um arquivo existente em `docs/` vira aviso; (l) documento de referência ou spec acima de 150 linhas gera aviso e acima de 300 gera erro; (m) casos de `troubleshooting/` entram no aviso de 30 dias; (n) H1 de spec não pode começar com `Spec ` nem `Fase `.
- Não tocar: `src/`, `docs/decisions/` (conteúdo das decisões).

## Critérios de aceite
- **BV-1** Cada spec com mais de um arquivo deve ficar em uma pasta própria com `README.md` como índice.
- **BV-2** O H1 de uma spec não deve começar com `Spec ` seguido de número nem com `Fase `.
- **BV-3** Quando um documento menciona `nome.md` de um arquivo que existe em `docs/`, o `docs:check` deve avisar se não houver link.
- **BV-4** Se um documento de referência ou uma spec tem mais de 300 linhas, então o `docs:check` deve falhar.
- **BV-5** Se um documento de referência ou uma spec tem mais de 150 linhas, então o `docs:check` deve avisar.
- **BV-6** O `docs:check` deve avisar sobre casos de `troubleshooting/` com `Verificado em` com mais de 30 dias.
- **BV-7** Cada documento de `gameplay/` deve ter uma linha "Relacionados" com links para os satélites de `architecture/`, `critical/` ou `decisions/` que cita.

- **BV-8** A base documental deve ter a pasta `ui/` com `hud.md`, `modals-and-screens.md` e `accessibility.md`, e `gameplay/` não deve conter documentos de tela.
- **BV-9** A base documental não deve ter a pasta `critical/`; `engineering/` deve conter `risky-files.md`, `performance.md`, `performance-metrics.md` e `security.md`.
- **BV-10** O nome de cada documento de referência deve nomear o assunto, em inglês e em kebab-case.
- **BV-11** O nome de cada spec deve começar com `bug-`, `feature-` ou `discovery-`.
- **BV-12** Nenhum documento de referência deve passar de ~100 linhas nem tratar mais de um assunto (campanha e Safe House, combate e status, conquistas e códice, stack e estrutura e convenções).
- **BV-13** O `architecture.md` não deve conter regras de gameplay que já estão em `gameplay/`.

## Plano de verificação
| Critério | Como verificar |
|---|---|
| BV-1, BV-2 | `pnpm run docs:check` e `find docs/specs -maxdepth 2` revisado |
| BV-3 a BV-6 | teste de falha: criar arquivos temporários que violem cada regra, confirmar a saída e reverter |
| BV-7 | `grep -L "Relacionados" docs/gameplay/*.md` vazio |
| BV-8, BV-9 | `ls docs` e `ls docs/ui docs/engineering` |
| BV-10, BV-11 | `ls docs/*/ docs/specs/defining` revisado contra a regra |
| BV-12, BV-13 | `wc -l` dos documentos de referência e `grep` das seções duplicadas |

## Questões em aberto
Nenhuma. A regra de tamanho vale também para specs (aprovado em 2026-10-11).

## Referências
[Documento mestre das specs](../README.md); `scripts/check-docs.mjs`; `docs/README.md` (regras de manutenção).
