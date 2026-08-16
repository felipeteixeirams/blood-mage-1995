---
agent_context: all agents
target_module: docs
priority: medium
status: active
last_updated: 2026-08-10
tags: [reference, docs-guide]
---
# Guia consolidado para replicar a base documental

A estrutura documental do projeto funciona como um sistema de "contexto vivo" e não apenas como uma coleção de arquivos. As regras principais, extraídas de docs/AGENTS.md, docs/docs-master.md e CLAUDE.md, são estas:

## 1) Há um ponto de entrada único
- O bootstrap obrigatório para agentes e colaboradores é docs/AGENTS.md.
- A navegação deve seguir sempre este fluxo:
  1. docs/AGENTS.md
  2. um documento mestre do domínio
  3. documentos satélites de detalhe

> Regra prática: nunca comece a explorar por arquivos soltos; comece pelo hub de entrada.

## 2) A estrutura é organizada por camadas
Use a mesma lógica em outro projeto:

- context: visão geral, arquitetura, estado atual, diretrizes
- architecture: decisões técnicas, padrões, análises
- domains: domínios funcionais e capacidades
- flows: fluxos de negócio e operacionais
- conventions: padrões e guias
- decisions: ADRs e decisões
- specs: requisitos, planos, histórias e status
- reviews: análise técnica, testes, segurança
- generated: artefatos gerados
- wip: trabalho em progresso
- legacy: histórico e conteúdo descontinuado

## 3) Todo documento deve ter metadados padronizados
O padrão mínimo é:

```yaml
---
agent_context: ...
target_module: ...
priority: ...
status: ...
last_updated: ...
tags: [...]
---
```

Isso é importante porque a base documental precisa ser:
- rastreável
- legível por agentes
- fácil de organizar por contexto

## 4) O fluxo de trabalho é spec-driven + context-driven
Antes de implementar algo relevante:
- verificar se já existe uma spec relacionada em docs/specs
- se não existir, criar uma spec incremental
- alinhar a implementação com a spec e com o contexto do projeto

Em resumo:
- spec define o que e por que
- docs/context define o como e o estado atual
- implementação segue ambos

## 5) Atualizar documentação é parte do trabalho
Toda mudança relevante de desenvolvimento deve atualizar os documentos impactados.
O fechamento de uma tarefa deve registrar:
- descobertas
- decisões
- riscos
- mitigação
- conteúdo obsoleto ajustado ou removido

Essa regra é central no projeto.

## 6) O repositório separa estado documental por ciclo de vida
A pasta docs/specs é organizada por status, por exemplo:
- current
- proposals
- approved
- archived/legacy

Essa separação evita confusão entre:
- trabalho ativo
- ideias em discussão
- decisões já consolidadas
- histórico

## 7) Há uma clara distinção entre master e satélite
- master: hub de navegação e contexto geral
- satélite: detalhe específico

Exemplo prático:
- docs/AGENTS.md é o bootstrap
- docs/context/context-master.md é o hub do contexto
- arquivos menores dentro de docs/context detalham temas específicos

## Estrutura mínima recomendada para replicar

Você pode copiar esta lógica em outro projeto:

```text
docs/
  AGENTS.md
  docs-master.md
  context/
  architecture/
  domains/
  flows/
  conventions/
  decisions/
  specs/
  reviews/
  pipelines/
  generated/
  wip/
  legacy/
```

## Regras de ouro para replicar
- mantenha um único ponto de entrada
- use master docs para navegação
- use satélites para detalhe
- padronize metadados
- separe status de trabalho e decisão
- trate documentação como parte do ciclo de entrega
- mantenha contexto vivo, não apenas documentação estática

## Modelo de decisão simples
Se você quiser aplicar isso em outro projeto, use esta regra de ouro:

- se o conteúdo é fundamental para entendimento do projeto, coloque em context ou architecture
- se é uma decisão formal, coloque em decisions
- se é uma tarefa ou requisito em andamento, coloque em specs
- se é temporário, coloque em wip
- se é histórico, coloque em legacy
