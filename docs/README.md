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
- Nomes de arquivo em kebab-case. Idioma: pastas e documentos de referência em inglês e nomeados pelo assunto; ADRs, casos de troubleshooting e specs em português. Specs seguem `<tipo>-<tema>-<assunto>` (tipo: `bug-`, `feature-`, `discovery-`; tema: `grafico`, `audio`, `controles`, `ui`, `mundo`, `campanha`, `eventos`, `assets`, `distribuicao`, `persistencia`, `combate`, `progressao`, `docs`); spec com várias partes vira pasta com `README.md` como índice e partes numeradas (`01-...md`). Documentos de referência (architecture, engineering, gameplay, operations, product, testing, ui) levam `**Status:** verificado | não verificado | histórico` e `**Verificado em:**` no topo; só confie em `verificado`.
- Todo documento (exceto README) traz `**Mestre:** [pasta](README.md)` no topo; ADRs têm o mesmo status no registro de `decisions/` e no arquivo.
- Specs levam `**Estágio:**` e `**Aprovação do responsável:**`; em `backlog/` e `in-progress/` a aprovação é obrigatória. Também levam `**Classe:**` (A técnica, B regra de negócio, C aguarda ADR proposto, D discovery, E congelada) e `**Depende de:**` (ADRs; o `docs:check` confere que existem).
- Documentos de referência levam `**Status:**` (só `verificado`, `não verificado` ou `histórico`), `**Verificado em:**`, `**Método:**` (`estático`, `executado` ou `não verificado`) e `**Fonte:**` (caminhos conferidos; `—` se não verificado). Ressalvas vão numa linha "Nota de verificação:" no corpo.
- ADRs levam também `**Specs afetadas:**` e, se for o caso, `**Substitui:**`/`**Substituída por:**`.
- A documentação descreve o projeto como ele é hoje: sem relatórios de status, sem histórico (o histórico fica no Git).
- Tamanho: documento de referência e spec com até ~100 linhas e um único assunto; o `docs:check` avisa acima de 150 linhas e falha acima de 300. Título de spec sem numeração antiga (`Spec NN`, `Fase N`).
- Cada documento de `gameplay/` termina com uma linha `Relacionados:` com links para os satélites de `architecture/` e `engineering/` que cita. Mencionar `nome.md` de um documento existente sem link gera aviso.
- Pendência de decisão (arquitetura, negócio, escopo, segurança, custo): o documento fica na pasta da categoria que mais lhe cabe, sem inventar a decisão, e o mestre dessa pasta ganha uma seção "Pendências de decisão" com tabela (documento, o que falta decidir, recomendação). O responsável resolve em outra sessão. Pendência com regra de negócio indefinida nunca é decidida por um agente.
- `pnpm run docs:check` valida tudo isso, mais estrutura, links, frescor (aviso após 30 dias) e critérios EARS (roda no pre-commit).
