# Base Documental

Único arquivo no primeiro nível de `docs/`. Navegação: este arquivo → `README.md` mestre da categoria → satélite. Regras de trabalho dos agentes: [`CLAUDE.md`](../CLAUDE.md).

| Categoria | Leia quando |
|---|---|
| [architecture/](architecture/README.md) | for propor, criar ou refatorar feature (mapa do que o código faz hoje) |
| [gameplay/](gameplay/README.md) | for entender como uma funcionalidade do jogo funciona hoje (combate, magias, talentos, loot, campanha, HUD...) sem ler o código |
| [decisions/](decisions/README.md) | for escolher tecnologia ou serviço, definir regra de negócio ou depender de uma suposição |
| [specs/](specs/README.md) | for definir, implementar ou consumir uma spec (`defining` → `backlog` → `in-progress`) |
| [engineering/](engineering/README.md) | for escrever ou revisar código (stack, convenções), mexer em arquivo de risco, performance ou segurança |
| [ui/](ui/README.md) | for mexer em telas (HUD, modais, menus) ou em acessibilidade |
| [product/](product/README.md) | for consultar roadmap, release, conta e dados ou princípios de produto |
| [operations/](operations/README.md) | for rodar, configurar, publicar ou empacotar |
| [testing/](testing/README.md) | for escrever ou rodar testes |
| [troubleshooting/](troubleshooting/README.md) | for depurar um erro estranho ou recorrente (casos complexos já resolvidos) |

## Manutenção
- Só este arquivo fica no primeiro nível; o resto vai em pasta de categoria.
- Documento novo: liste no mestre da pasta. Categoria nova: liste aqui.
- Nomes de arquivo em kebab-case. Idioma: pastas e documentos de referência em inglês e nomeados pelo assunto; ADRs, casos de troubleshooting e specs em português. Specs levam prefixo de tipo (`bug-`, `feature-`, `discovery-`); spec com várias partes vira pasta com `README.md` como índice e partes numeradas (`01-...md`). Documentos de referência (architecture, engineering, gameplay, operations, product, testing, ui) levam `**Status:** verificado | não verificado | histórico` e `**Verificado em:**` no topo; só confie em `verificado`.
- Todo documento (exceto README) traz `**Mestre:** [pasta](README.md)` no topo; ADRs têm o mesmo status no registro de `decisions/` e no arquivo.
- Specs levam `**Estágio:**` e `**Aprovação do responsável:**`; em `backlog/` e `in-progress/` a aprovação é obrigatória.
- A documentação descreve o projeto como ele é hoje: sem relatórios de status, sem histórico (o histórico fica no Git).
- `pnpm run docs:check` valida tudo isso, mais estrutura, links e critérios EARS (roda no pre-commit).
