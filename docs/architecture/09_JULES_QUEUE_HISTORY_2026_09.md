# 🗂️ Histórico: Fila de Automação Jules (2026-09)

> **Movido de `docs/specs/backlog/_ARCHIVED_16_FILA_AUTOMACAO_JULES.md` em
> 2026-09-08** durante a padronização das specs (ver Seção 6 de
> `05_SPEC_AND_CONTEXT_DRIVEN_ENGINEERING.md`). Isto é história de
> **governança/processo** ("como decidimos trabalhar"), não uma spec de
> feature — não pertence a `docs/specs/`. Referenciado por
> `docs/specs/backlog/30_DETERMINISMO_SEED_POISSON_DISK.md` e
> `docs/specs/backlog/31_NORMAL_MAP_TILE_DOOR.md` (os 2 itens que
> sobreviveram desta fila como specs próprias).

# ⛔ ARCHIVED — Fila de Automação Jules (consolidada na Fila de Prioridade única)

> **Aposentado em 2026-09-07.** Este arquivo era o único documento que
> consolidava tarefas prontas-para-Jules (objetivo + requisitos técnicos +
> guardrails + testes já completos, sem necessidade de esclarecimento).
> Agora que **todo** `docs/specs/backlog/` segue o mesmo padrão de
> profundidade técnica mínima (Seção 6 de
> `docs/architecture/05_SPEC_AND_CONTEXT_DRIVEN_ENGINEERING.md`) e a
> **Fila de Prioridade** em `docs/specs/README.md` já rankeia tudo que está
> destravado, manter uma fila SEPARADA só pra Jules virou redundante — dois
> lugares pra consultar "o que fazer a seguir" em vez de um.

## O que aconteceu com os itens pendentes

Os 2 itens que ainda estavam `🟡 PENDENTE` aqui viraram specs próprias em
`backlog/`, com o mesmo conteúdo técnico, prontos pra serem pegos pela Fila
de Prioridade como qualquer outro item:

- **[`backlog/30_DETERMINISMO_SEED_POISSON_DISK.md`](./30_DETERMINISMO_SEED_POISSON_DISK.md)** (era item 1)
- **[`backlog/31_NORMAL_MAP_TILE_DOOR.md`](./31_NORMAL_MAP_TILE_DOOR.md)** (era item 2)

## Como o fluxo funciona agora

1. Qualquer item em `backlog/` ou `in-progress/` que **não** apareça na
   seção "🚧 Bloqueados" da Fila de Prioridade (`docs/specs/README.md`)
   está pronto pra ser executado — por Claude, por Felipe, ou por uma
   sessão manual do Jules em jules.google.com.
2. **Felipe abre manualmente uma sessão em jules.google.com** (não há
   automação recorrente rodando isso sozinha) e cola o prompt padrão (ver
   `docs/architecture/08_JULES_SESSION_PROMPT.md`), que instrui a sessão a
   ler a Fila de Prioridade e pegar o item do topo.
3. Jules executa, abre PR contra `claude/frentes-atuacao-projeto-qypbg3`.
4. **Todo PR ainda passa por revisão humana/Claude** antes do merge — pull,
   verificação ao vivo do jogo (não só os testes unitários passarem,
   histórico de PRs #80/#81 mostra regressão visual real que só rodar o
   jogo de verdade capturou), ajuste se precisar, e só então merge.
5. Depois do merge validado, o item sai da Fila de Prioridade (vira uma
   linha em "🟢 Delivered" do índice, ou o spec correspondente é movido
   pra `delivered/`).

## Histórico preservado (referência)

As 3 PRs reais que motivaram este arquivo originalmente (#80, #81, #82)
vieram todas de sessões ao vivo que Felipe iniciou manualmente — nenhuma
delas consumindo automaticamente este arquivo. Não há e nunca houve
automação recorrente rodando sozinha nesta fila; toda sessão é manual.
