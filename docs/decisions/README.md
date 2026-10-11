# Decisões — Documento Mestre

**Contexto:** quem decide o quê, como uma decisão é registrada e o que já foi decidido ou está pendente.
**Leia quando:** for propor, escolher ou depender de uma tecnologia, serviço, regra de negócio, escopo ou desenho de arquitetura, antes de escrever ou implementar qualquer spec.

## Princípio

Decisões de **domínio, negócio e arquitetura** passam pelo **responsável pelo produto**. Um agente (qualquer modelo) pode **propor**, nunca **decidir**, e nunca implementa uma proposta como se fosse decisão. O código não é evidência de decisão: o que está escrito no código pode ter sido uma suposição de uma sessão anterior.

## Três tipos de questão

| Tipo | Exemplos | Quem resolve | Como fica registrado |
|---|---|---|---|
| **Decisão** | trocar a engine ou uma biblioteca; integrar conta/nuvem; regra de negócio; escopo; segurança/privacidade; custo; monetização; qualquer comportamento de jogo que a spec não derive de uma regra já decidida | **Só o responsável** | Registro de decisão (ADR) com status e data de aprovação |
| **Fato técnico verificável** | "o Phaser 4.2.1 oferece essa API?"; "essa biblioteca é compatível com React 19?"; "o plano da Vercel permite X?" | O agente, **verificando em fonte primária** (documentação oficial, código, versão instalada) | Na spec ou no ADR, em *Fatos técnicos verificados*: afirmação, fonte (URL ou arquivo) e data. Sem fonte = não é fato, é suposição |
| **Detalhe de implementação** | nome de função interna, organização de arquivos dentro do que a spec já fixou | O implementador, dentro dos limites da spec | Nada além do código |

Quando um fato técnico verificado **contradiz** uma decisão já tomada, ele vira uma questão ao responsável; o agente não ajusta a decisão por conta própria.

## Regras para agentes

1. **Não decida.** Diante de uma decisão em aberto, registre como *Proposta* (ADR ou "Decisões a confirmar" da spec), explique opções e consequências, e pare até o responsável responder.
2. **Não implemente suposições.** Só implemente algo que dependa de uma decisão se o ADR estiver **Aprovado**.
3. **Verifique antes de afirmar.** Fato técnico só entra na base com fonte e data.
4. **Spec ambígua ou incompleta:** pare e pergunte. Não preencha lacunas com o que parece razoável.
5. **Aprovação é do responsável.** Um agente só registra a aprovação ("Aprovada por <nome> em <data>, conforme conversa de <data>") depois de o responsável tê-la dado explicitamente.

## Ciclo de um ADR

`Proposta` → `Aprovada` (ou `Rejeitada`) → eventualmente `Substituída` por outro ADR.

- Um ADR por decisão, arquivo `NNNN-assunto-em-kebab-case.md`, a partir do [template.md](template.md).
- Uma decisão aprovada não é editada: se mudar, cria-se um novo ADR que a substitui e o antigo recebe o status `Substituída`.
- Specs citam os ADRs de que dependem (seção *Decisões de que depende*).
- O registro abaixo e o `**Status:**` dentro de cada ADR devem coincidir (o `docs:check` valida).

## Registro

| ADR | Assunto | Status |
|---|---|---|
| [0001](0001-ponte-phaser-react-so-zustand.md) | Ponte Phaser-React: "só Zustand, sem CustomEvent" | **Proposta** |
| [0002](0002-geracao-de-terreno-e-piso.md) | Geração de terreno, piso e autotiling | **Proposta** |
| [0003](0003-mundo-continuo-e-geradores-de-floresta.md) | Mundo contínuo (ChunkStreamer) e geradores da floresta | **Proposta** |
| [0004](0004-controles-mobile-e-orientacao.md) | Controles mobile: joystick flutuante e orientação paisagem | **Proposta** |
| [0005](0005-iluminacao-escuridao-e-vinheta.md) | Iluminação: escuridão e vinheta no gameplay | **Proposta** |
| [0006](0006-audio-e-conquistas.md) | Áudio só pelo soundEngine e conquistas no store | **Proposta** |
| [0007](0007-csp-vercel.md) | CSP do vercel.json: unsafe-inline, unsafe-eval, Google Fonts | **Aprovada** |
| [0008](0008-endpoint-api-log.md) | Endpoint /api/log: CORS aberto, sem autenticação nem limite | **Aprovada** |
| [0009](0009-testes-pre-commit-e-e2e.md) | Testes: pre-commit, CI e spec e2e quebrado | **Aprovada** |
| [0010](0010-canais-de-distribuicao.md) | Distribuição: PWA, TWA/Play Store, Steam | **Aprovada** |
| [0011](0011-conta-e-dados-do-jogador.md) | Conta e dados: save local ou nuvem | **Aprovada** |
| [0012](0012-monetizacao-preco-e-metas-de-retencao.md) | Monetização, preço e metas de retenção | **Aprovada** |
| [0013](0013-metas-de-performance.md) | Metas de performance (FPS, memória, draw calls) | **Proposta** |
| [0014](0014-arquivos-intocaveis-e-niveis-de-risco.md) | Arquivos críticos: classificação e força da regra | **Proposta** |
| [0015](0015-estrutura-do-repositorio-e-dependencias.md) | Estrutura do repositório e dependências sem uso | **Proposta** |

O que o código faz hoje está em [architecture](../architecture/README.md) como fato do código, não como decisão.

## Satélites

| Documento | Papel |
|---|---|
| [template.md](template.md) | Modelo de ADR |

Relacionados: [specs](../specs/README.md) (dependem de decisões aprovadas), [engineering](../engineering/README.md).
