---
agent_context: [backend, frontend, all]
target_module: root
priority: alta
status: active
last_updated: 2026-09-06
tags: [automacao, jules, backlog-operacional, qualidade]
---

# Fila de Automação — Jules (Sessão Recorrente)

> ⚠️ **Este documento é diferente dos demais specs de `backlog/`.** Não é uma
> proposta de feature aguardando início — é uma **fila operacional viva**,
> consumida automaticamente por uma sessão recorrente do Jules (agendada em
> jules.google.com). Ela é editada com frequência (itens entram, são
> marcados como concluídos, e são removidos por um humano depois de
> revisados) — não segue o ciclo normal `backlog/ → in-progress/ →
> delivered/` dos outros specs.

## Como esta fila funciona

1. Uma atividade recorrente do Jules (configurada fora deste repo, no
   agendamento do jules.google.com) lê este arquivo a cada disparo.
2. Se houver algum item com `Status: 🟡 PENDENTE`, o Jules pega **o de maior
   prioridade** (o primeiro na lista, de cima pra baixo), executa **só
   esse**, abre PR contra `claude/frentes-atuacao-projeto-qypbg3`, e marca
   o próprio item como `Status: ✅ CONCLUÍDO (PR: <link>)` — na mesma sessão,
   como parte do PR.
3. Se **não** houver nenhum item `🟡 PENDENTE`, o Jules cai no protocolo de
   manutenção em cascata (test coverage → tratamento de erro → performance/
   pooling — ver o texto completo da instrução recorrente, mantido fora
   deste arquivo, no agendamento do Jules).
4. **Este documento nunca é revisado pelo Jules como aprovação final.** Todo
   PR gerado por ele (implementação ou manutenção) ainda passa por revisão
   humana/Claude — pull, verificação ao vivo do jogo (não só os testes
   unitários passarem), ajuste se precisar, e só então merge. Ver
   histórico de PRs #80/#81 nesta mesma branch: os testes unitários
   passaram 100% e ainda assim havia uma regressão visual real que só a
   verificação ao vivo (Playwright rodando o jogo de verdade) capturou.
5. Depois que um item `✅ CONCLUÍDO` for revisado e confirmado (PR mesclado
   e validado), um humano remove a entrada deste arquivo — a fila deve
   ficar enxuta, refletindo só o que ainda está pendente ou aguardando
   confirmação recente.
6. Novos itens são adicionados por nós (Claude ou Felipe), sempre no mesmo
   formato abaixo, para que o Jules não precise de nenhuma pergunta de
   esclarecimento pra começar.

## Legenda de Status

- 🟡 PENDENTE — aguardando a próxima sessão recorrente pegar
- 🔵 EM ANDAMENTO — uma sessão já pegou, PR ainda não chegou (deveria ser
  transitório; se ficar assim por muito tempo, verificar se a sessão travou)
- ✅ CONCLUÍDO (PR: `<link>`) — PR aberto, aguardando revisão humana/Claude
  antes do merge e da remoção deste arquivo

---

## Fila (ordem de prioridade)

### 1. Autotiling de paredes das masmorras

**Status:** 🟡 PENDENTE

**Contexto:** O piso das 3 masmorras (`fosso_chagas`, `catacumbas_martires`,
`santuario_sangue`) já tem autotiling de verdade (bitmask de vizinhos, 13
variantes de borda/canto — `DungeonGenerator.calculateBitmask` /
`getGroundTextureKey`, mesclado em `claude/frentes-atuacao-projeto-qypbg3`).
As **paredes**, porém, continuam no nível anterior: `buildWallLine()` (em
`src/game/systems/DungeonGenerator.ts`) só escolhe entre 5 variantes de
textura por ruído de posição, colocadas em linha reta — sem peça de canto,
junção em T, ou topo diferenciado da face lateral. Visualmente as paredes
ficam "atrás" da qualidade do piso agora.

**🎯 Objetivo:** Levar as paredes das masmorras ao mesmo nível de qualidade
autêntica de autotiling do piso — peças de canto interno/externo, junção em
T e tampo (topo) diferenciado da face — sem inventar sistema novo, reaproveitando
a técnica de bitmask já validada (`calculateBitmask`, referência
https://www.redblobgames.com/articles/autotile/claude/, Wang tiles).

**📐 Requisitos Técnicos:**

1. Em `src/game/systems/DungeonGenerator.ts`, `buildWallLine()` hoje
   percorre uma linha reta entre 2 pontos e escolhe a variante só por
   ruído de posição (`Math.sin(wx * 0.129 + wy * 0.782)`). Substitua (ou
   complemente) essa seleção por uma máscara de bits dos segmentos de
   parede vizinhos (reaproveitando `calculateBitmask()`, já implementado
   para o piso — adapte a assinatura se necessário, mas não duplique a
   lógica de bitmask do zero) para escolher entre: segmento reto,
   canto externo, canto interno, junção em T, extremidade (end-cap).
   Não precisa do conjunto completo de 47 tiles do blob method — um
   subconjunto reduzido (~8-10 variantes) já resolve.
2. Em `src/utils/textureGenerator.ts`, gere as texturas de parede que
   faltam (cantos, junção, extremidade) seguindo o MESMO padrão visual já
   usado em `tile_wall_brick_var_0..4` (não invente uma paleta nova) —
   cada peça precisa continuar gerando normal map
   (`addTextureWithNormalMap`, já usado) para o Light2D continuar
   iluminando a parede corretamente.
3. Mantenha a diferenciação visual TOPO (tampo da parede, visto de cima,
   iluminado) vs FACE (lateral, em sombra) se o desenho atual já fizer essa
   distinção — confirme olhando o desenho atual de `tile_wall_brick` antes
   de decidir.

**Testes Unitários:**
- Cobertura da lógica de seleção de peça de parede por máscara de bits
  (dado um layout de vizinhos conhecido, a peça escolhida é a esperada —
  lógica pura, sem canvas real).
- Cobertura de que todas as novas texturas de parede são geradas (mock de
  `textures.createCanvas`/`addTextureWithNormalMap`).
- Regressão: `wallsGroup` continua recebendo corpos físicos com
  `setSize`/`refreshBody()` (colisão não pode quebrar).

**Guardrails:**
- NÃO toque em `GameScene.ts`, `Player.ts` ou `Enemy.ts` (arquivos
  críticos — `docs/critical/01_CRITICAL_FILES.md`).
- NÃO mude a assinatura pública de `buildWallLine()` como é invocada por
  quem já a chama, a menos que seja estritamente necessário — se mudar,
  atualize todos os call sites e documente no PR.
- NÃO altere o autotiling de PISO já mesclado (`getGroundTextureKey`) —
  esta frente é só sobre paredes.
- NÃO altere a Safe House (`isSafeHouse` usa parede própria,
  `tile_wood_wall` — fora de escopo aqui; há uma frente separada em
  andamento pra Safe House).
- Baking pattern obrigatório (DynamicTexture, nunca Graphics redesenhado
  por frame — skill `phaser-4-development` do projeto).
- 60 FPS estável, 0 erros de `tsc --noEmit`, `pnpm test` 100%.

**Antes de escrever qualquer mudança**, gere um plano listando as peças de
parede que pretende criar e a lógica de bitmask escolhida — isso será
revisado antes de prosseguir.

**PR:** contra `claude/frentes-atuacao-projeto-qypbg3` (NÃO `main`), título
`feat(masmorras): autotiling de paredes com peças de canto e junção`.

---

<!--
TEMPLATE para novos itens — copie este bloco, preencha, e cole ANTES dos
itens já concluídos/em andamento removidos, mas na posição de prioridade
correta (topo = maior prioridade):

### N. <Título curto>

**Status:** 🟡 PENDENTE

**Contexto:** <o que existe hoje e por que é insuficiente, com referência a
arquivo/linha real>

**🎯 Objetivo:** <1-2 frases>

**📐 Requisitos Técnicos:** <passos concretos, arquivos, técnicas a
reaproveitar (nunca inventar sistema novo sem justificar)>

**Testes Unitários:** <o que precisa ter cobertura>

**Guardrails:** <arquivos/sistemas fora de escopo, arquivos críticos>

**PR:** contra `claude/frentes-atuacao-projeto-qypbg3`, título `<tipo>(<área>): <resumo>`.
-->
