# Base documental: organização interna e novas validações do `docs:check`

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Estado vs código:** verificado em 2026-10-11 (script de inventário sobre `docs/`): achados confirmados. Nada foi alterado.

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

## Decisões a confirmar
| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| 1 | Specs multi-parte | pasta por spec (`defining/<spec>/README.md` + partes), manter plano | Pasta por spec: o `specs/README.md` já admite "uma spec é uma pasta"; o script exige um `README.md` por pasta, que serve de índice. |
| 2 | Títulos `Spec NN`/`Fase N` | remover prefixo, manter | Remover: o número não existe mais na base. |
| 3 | Links entre categorias | linkar satélite a satélite, só mestres | Linkar satélite a satélite no cabeçalho ("Relacionados") dos documentos de gameplay e dos ADRs. |
| 4 | Tamanho máximo | aviso, erro | Aviso acima de 150 linhas e erro acima de 300, só em documentos de referência. |
| 5 | Novas regras do `docs:check` | ver critérios | Implementar BV-3 a BV-6. |

## Escopo
Reorganizar `defining/` conforme a decisão 1, normalizar títulos, adicionar links cruzados e acrescentar regras ao `scripts/check-docs.mjs`.

## Fora de escopo
Mudar o conteúdo técnico dos documentos e qualquer código de `src/`.

## Arquivos e contratos
- Alterar: `scripts/check-docs.mjs`, `docs/specs/defining/**`, `docs/specs/README.md`, `docs/gameplay/*.md`, `docs/decisions/*.md`.
- Regras novas do script: (k) menção `` `nome.md` `` sem link a um arquivo existente em `docs/` vira aviso; (l) documento de referência acima de 150 linhas gera aviso e acima de 300 gera erro; (m) casos de `troubleshooting/` entram no aviso de 30 dias; (n) H1 de spec não pode começar com `Spec ` nem `Fase `.
- Não tocar: `src/`, `docs/decisions/` (conteúdo das decisões).

## Critérios de aceite
- **BV-1** Cada spec com mais de um arquivo deve ficar em uma pasta própria com `README.md` como índice.
- **BV-2** O H1 de uma spec não deve começar com `Spec ` seguido de número nem com `Fase `.
- **BV-3** Quando um documento menciona `nome.md` de um arquivo que existe em `docs/`, o `docs:check` deve avisar se não houver link.
- **BV-4** Se um documento de referência tem mais de 300 linhas, então o `docs:check` deve falhar.
- **BV-5** Se um documento de referência tem mais de 150 linhas, então o `docs:check` deve avisar.
- **BV-6** O `docs:check` deve avisar sobre casos de `troubleshooting/` com `Verificado em` com mais de 30 dias.
- **BV-7** Cada documento de `gameplay/` deve ter uma linha "Relacionados" com links para os satélites de `architecture/`, `critical/` ou `decisions/` que cita.

## Plano de verificação
| Critério | Como verificar |
|---|---|
| BV-1, BV-2 | `pnpm run docs:check` e `find docs/specs -maxdepth 2` revisado |
| BV-3 a BV-6 | teste de falha: criar arquivos temporários que violem cada regra, confirmar a saída e reverter |
| BV-7 | `grep -L "Relacionados" docs/gameplay/*.md` vazio |

## Questões em aberto
Se a regra de tamanho vale também para specs em `defining/` (hoje a maior tem 167 linhas).

## Referências
[Documento mestre das specs](README.md); `scripts/check-docs.mjs`; `docs/README.md` (regras de manutenção).
