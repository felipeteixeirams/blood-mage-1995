---
agent_context: Product Managers, Engenheiros e Agentes IA
target_module: Metodologia de Delegação Manual (jules.google.com)
priority: high
criticality: low
status: active
last_updated: 2026-09-07
tags: [jules, automacao, prompt, delegacao-manual, workflow]
---

# 🤖 Prompt Padrão de Sessão Jules (Delegação Manual)

> **Como usar:** Felipe abre manualmente uma sessão em jules.google.com e
> cola o prompt abaixo (não há disparo automático — cada sessão exige essa
> ação manual). Este documento é a **fonte única** deste texto; ao ajustar
> o prompt, edite aqui primeiro e cole a versão atualizada na próxima
> sessão, para não haver duas versões divergentes circulando.
>
> **Por que isso mudou (2026-09-07):** antes existia um arquivo dedicado
> (`backlog/16_FILA_AUTOMACAO_JULES.md`, hoje arquivado em
> `docs/architecture/09_JULES_QUEUE_HISTORY_2026_09.md`) só com itens
> prontos-para-Jules. Consolidado na Fila de Prioridade única de
> `docs/specs/README.md`, que já rankeia por prioridade/criticidade e já
> exclui o que está bloqueado — não faz mais sentido manter uma fila
> paralela só pra Jules.

---

## Prompt (copiar a partir daqui)

```
Você tem UMA sessão pra executar EXATAMENTE UM item, seguindo esta ordem
de prioridade (pare no primeiro passo que gerar uma mudança real — nunca
acumule mais de um passo na mesma sessão):

PASSO 0 — Fila de Prioridade:
Leia docs/specs/README.md, seção "🎯 Fila de Prioridade — Pega a Próxima".
Pegue a PRIMEIRA linha da tabela (linha 1, maior prioridade/criticidade) —
NÃO pegue nada listado na sub-seção "🚧 Bloqueados" logo abaixo, mesmo que
pareça prioritário; esses têm impedimento documentado e não são
executáveis agora. Abra o arquivo de spec linkado nessa linha 1 (pasta
in-progress/ ou backlog/) e execute SOMENTE as instruções desse arquivo —
objetivo, requisitos técnicos, guardrails e testes já estão completos nele
(seção "Requisitos Técnicos"/"Critério de Aceite" ou equivalente) — não
peça esclarecimento.

Se o spec da linha 1 for um documento vivo sem uma ação de código clara
(ex: um índice mestre, um guia de referência, uma fila operacional), pule
pra próxima linha da tabela que tiver uma ação de código concreta.

Ao finalizar:
1. Abra PR contra claude/frentes-atuacao-projeto-qypbg3 com o título
   indicado no critério de aceite do spec (ou, na ausência de um título
   sugerido, um título convencional <tipo>(<área>): <resumo>).
2. No mesmo PR, mova o arquivo de spec de backlog/ para in-progress/ (ou
   marque como concluído se o PR já fecha o escopo inteiro) — git mv, não
   copie o conteúdo pra um arquivo novo.
3. Remova a linha correspondente da tabela "🎯 Fila de Prioridade" em
   docs/specs/README.md (o item sai da fila "quente" assim que tem PR
   aberto aguardando revisão — não fica listado como se ainda estivesse
   livre pra pegar).

Encerre a sessão. NÃO pegue um segundo item mesmo que sobre tempo.

Se a tabela "🎯 Fila de Prioridade" estiver vazia (todas as linhas restantes
sob "🚧 Bloqueados", ou a tabela sem nenhuma linha), siga para o Passo 1.

PASSO 1 — Cobertura de testes:
Audite os arquivos em src/game/ e src/utils/ com lógica não-trivial
procurando testes que cobrem só o "caminho feliz" (sem casos de borda,
erro, ou entrada inválida). Se encontrar uma lacuna real e conseguir
adicionar casos de teste que a fechem (sem reescrever os testes
existentes), adicione, abra PR contra claude/frentes-atuacao-projeto-qypbg3
com título "test(coverage): <área> — cobertura de casos de borda", e
encerre a sessão. Se não encontrar nenhuma lacuna que valha a pena, siga
pro Passo 2 SEM abrir PR.

PASSO 2 — Tratamento de erro:
Audite o código procurando pontos onde falha externa/entrada inválida
(parsing, localStorage, carregamento de textura/animação Phaser, JSON)
não está protegida por validação ou fallback seguro, seguindo o MESMO
padrão de proteção já usado no projeto (ex: Zod safeParse com fallback
default). Se encontrar e corrigir um caso real, abra PR contra
claude/frentes-atuacao-projeto-qypbg3 com título "fix(robustez): <área> —
tratamento de erro", e encerre a sessão. Se não encontrar nada relevante,
siga pro Passo 3 SEM abrir PR.

PASSO 3 — Performance e pooling:
Audite conformidade com os padrões de performance documentados em
CLAUDE.md ("Padrões de Performance": Object Pooling, Spatial Pruning) —
procure GameObjects criados dentro de loops de update em vez de
reciclados via pool, ou checagens de IA/física caras (raycast, colisão)
sem poda por distância antes. Se encontrar e corrigir uma violação real,
abra PR contra claude/frentes-atuacao-projeto-qypbg3 com título
"perf(pooling): <área> — conformidade com padrões de performance", e
encerre a sessão.

Se NENHUM dos passos 1-3 encontrar algo acionável, encerre a sessão sem
abrir PR — não force uma mudança artificial.

REGRAS EM QUALQUER PASSO:
- NUNCA abra PR contra main — sempre contra claude/frentes-atuacao-projeto-qypbg3.
- NUNCA faça mudanças amplas em GameScene.ts, Player.ts ou Enemy.ts
  (docs/critical/01_CRITICAL_FILES.md) — se estritamente necessário tocar
  algo ali (ex: um teste precisa de um mock), a mudança deve ser mínima e
  cirúrgica, documentada no PR.
- Rode pnpm verify (typecheck + build) e pnpm test antes de abrir
  qualquer PR — 0 erros, 100% dos testes passando.
- Gere um plano curto antes de escrever qualquer mudança (o que vai fazer
  e por quê) e aguarde aprovação antes de prosseguir.
```

---

## O que mudou em relação à versão anterior

| Antes | Agora |
|---|---|
| Passo 0 lia `docs/specs/backlog/` procurando `Status: 🟡 PENDENTE` num arquivo dedicado (`16_FILA_AUTOMACAO_JULES.md`) | Passo 0 lê a tabela "🎯 Fila de Prioridade" de `docs/specs/README.md` — a mesma fila que Claude/Felipe usam pra "pega a próxima" |
| Fila só tinha itens escritos manualmente pra Jules, num formato próprio | Qualquer spec de `backlog/`/`in-progress/` que já siga o padrão de profundidade técnica (Seção 6 de `05_SPEC_AND_CONTEXT_DRIVEN_ENGINEERING.md`) é elegível |
| Itens bloqueados não existiam nesse arquivo (removidos manualmente) | Itens bloqueados existem no índice geral, mas ficam explicitamente fora da fila "quente" — Passo 0 já instrui a pular a seção "🚧 Bloqueados" |
| Ao concluir, editava o próprio arquivo de fila (`Status: ✅ CONCLUÍDO`) | Ao concluir, move o spec pra `in-progress/` (git mv) e remove a linha da tabela — mesmo fluxo que qualquer outro spec já segue |

## Revisão continua obrigatória

Nada neste prompt dispensa revisão humana/Claude antes do merge — pull,
rodar o jogo de verdade (Playwright ou manual, não só `pnpm test`), ajuste
se precisar, só então merge. Ver histórico de PRs #80/#81 (testes 100%
passando com regressão visual real que só a verificação ao vivo capturou)
e #89 (PR redundante/duplicado que só apareceu comparando o diff real
contra o que já estava em `main`, não só pelo status do PR).
