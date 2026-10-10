# Especificações — Documento Mestre

**Contexto:** o que o jogo deve fazer (requisitos e contratos), organizado pelo **estágio** de cada spec.
**Leia quando:** for implementar, consumir ou definir uma spec.

## Estágios

| Pasta | Significado | Quando uma spec está aqui |
|---|---|---|
| [backlog/](backlog/README.md) | Prontas para implementar | Escopo definido, revisado e aprovado; ninguém está implementando ainda |
| [in-progress/](in-progress/README.md) | Em implementação | Há trabalho de implementação em andamento agora |
| [defining/](defining/README.md) | Em definição | Sem escopo definido ou escopo ainda sendo definido |

## Critérios de aceite (EARS)

Specs de `backlog/` e `in-progress/` têm critérios de aceite no formato **EARS** e cumprem a *Definition of Ready*: guia, padrões, regras e checklist em [ears.md](ears.md). Spec que não cumpre fica em `defining/` com as lacunas listadas.

## Aprovação e decisões

- Uma spec só entra em `backlog/` ou `in-progress/` com **aprovação do responsável registrada** no cabeçalho e com todas as decisões de que depende **aprovadas** em [decisions](../decisions/README.md).
- Comportamento de produto proposto por quem escreve a spec é **proposta**: fica em `defining/`, em *Decisões a confirmar*, até o responsável aprovar.
- Modelo de spec: [spec-template.md](spec-template.md).

## Ciclo de vida

`defining` → `backlog` (só se cumprir a Definition of Ready) → `in-progress` → (concluída: é removida de `specs/`)

- Mover uma spec de estágio = `git mv` para a pasta do novo estágio + atualizar a tabela dos dois mestres.
- Spec concluída é removida de `specs/`; o que continuar válido como contrato fica descrito em [architecture](../architecture/README.md), e as decisões em [decisions](../decisions/README.md). O histórico fica no Git (sem pasta `delivered/`).

## Satélites

| Documento | Papel |
|---|---|
| [ears.md](ears.md) | Padrões EARS, Definition of Ready e papéis |
| [spec-template.md](spec-template.md) | Modelo de spec |

Relacionados: [decisions](../decisions/README.md), [architecture](../architecture/README.md), [testing](../testing/README.md).
