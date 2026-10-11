# Produto — Documento Mestre

**Contexto:** estado verificável do produto hoje (conta e dados, superfícies de distribuição, princípios mobile). Planos e metas aparecem só como "Intenção (não ratificada)", nunca como fato.
**Leia quando:** for tocar em persistência local, PWA/distribuição ou precisar saber o que o jogo já entrega e o que é só proposta.

| Satélite | Conteúdo | Status |
|---|---|---|
| [account-and-data.md](account-and-data.md) | Sem conta/login; dados em `localStorage` via `src/utils/localStorage.ts` | verificado |
| [roadmap.md](roadmap.md) | O que o código entrega hoje e o que não existe; intenções não ratificadas | verificado |
| [release-strategy.md](release-strategy.md) | Superfícies de distribuição como existem hoje; intenção de lojas não ratificada | verificado |
| [product-principles.md](product-principles.md) | O que o código faz hoje para mobile (verificado) e princípios propostos (não ratificados) | verificado (princípios propostos: não verificado) |

Operação (build, deploy, variáveis): [operations](../operations/README.md).

Telas e acessibilidade: [ui](../ui/README.md).

## Pendências de decisão

| Documento | O que falta decidir | Recomendação |
|---|---|---|
| [product-principles.md](product-principles.md) | Adotar ou descartar as metas mobile (tempo até jogar, alvo de toque 48 px, bundle 2,5 MB) | Descartar por ora: sem medição, qualquer número é suposição; revisitar com o ADR 0013 |
| [product-principles.md](product-principles.md) | Pausar ao perder foco e salvar por sala/andar: comportamento desejado | Decidir via spec: hoje o jogo não pausa ao perder foco, o que pode custar progresso em mobile |
| [product-principles.md](product-principles.md) | Público-alvo e posicionamento do jogo (sem fonte no repositório) | Defini-los em ADR curto antes de qualquer meta de produto, pois orientam as demais |
| [product-principles.md](product-principles.md) | Filtro de 5 perguntas para aprovar features | Não adotar: ADR 0012 optou por sem metas; basta o critério das specs |
| [product-principles.md](product-principles.md) | Metas de performance (FPS, heap, aparelho de referência) | Aprovar o ADR 0013 opção B: medição manual com `?perf` dá critério barato |
