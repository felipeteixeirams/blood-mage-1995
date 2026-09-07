---
agent_context: [backend, frontend, all]
target_module: root
priority: high
criticality: low
status: backlog
last_updated: 2026-09-07
tags: [automacao, jules, backlog-operacional, qualidade]
---

# Fila de Automação — Jules (Delegação Manual por Item)

> ⚠️ **Este documento é diferente dos demais specs de `backlog/`.** Não é uma
> proposta de feature aguardando início — é uma **fila operacional viva**,
> consumida item a item quando o Felipe abre uma sessão em jules.google.com
> e aponta pro item de maior prioridade desta fila. Ela é editada com
> frequência (itens entram, são marcados como concluídos, e são removidos
> por um humano depois de revisados) — não segue o ciclo normal
> `backlog/ → in-progress/ → delivered/` dos outros specs.
>
> **Correção (2026-09-07):** este documento descrevia antes uma "sessão
> recorrente do Jules agendada em jules.google.com" que consumiria a fila
> sozinha. Confirmado com o Felipe que isso NÃO existe — as 3 PRs reais até
> agora (#80, #81, #82) vieram todas de sessões ao vivo que ele mesmo
> iniciou manualmente em jules.google.com (cada PR traz `"started by
> @felipeteixeirams"` no corpo), nenhuma delas consumindo este arquivo.
> Não há automação recorrente rodando hoje.

## Como esta fila funciona de fato

1. Claude (ou Felipe) escreve um item novo aqui, no formato do template
   abaixo, bem específico o suficiente pra Jules não precisar de nenhuma
   pergunta de esclarecimento pra começar.
2. **Felipe abre manualmente uma sessão em jules.google.com** e cola/aponta
   pro item `🟡 PENDENTE` de maior prioridade (o primeiro na lista, de cima
   pra baixo). Não há disparo automático — cada item exige essa ação manual.
3. Jules executa, abre PR contra `claude/frentes-atuacao-projeto-qypbg3`, e
   o item deveria ser atualizado pra `Status: ✅ CONCLUÍDO (PR: <link>)`
   (por Felipe ou Claude, ao notar o PR nascer — não é automático).
4. **Este documento nunca é revisado pelo Jules como aprovação final.** Todo
   PR gerado por ele ainda passa por revisão humana/Claude — pull,
   verificação ao vivo do jogo (não só os testes unitários passarem),
   ajuste se precisar, e só então merge. Ver histórico de PRs #80/#81
   nesta mesma branch: os testes unitários passaram 100% e ainda assim
   havia uma regressão visual real que só a verificação ao vivo (Playwright
   rodando o jogo de verdade) capturou.
5. Depois que um item `✅ CONCLUÍDO` for revisado e confirmado (PR mesclado
   e validado), um humano remove a entrada deste arquivo — a fila deve
   ficar enxuta, refletindo só o que ainda está pendente ou aguardando
   confirmação recente.

## Legenda de Status

- 🟡 PENDENTE — pronto pra ser colado numa sessão nova em jules.google.com
- 🔵 EM ANDAMENTO — uma sessão já pegou, PR ainda não chegou (deveria ser
  transitório; se ficar assim por muito tempo, verificar se a sessão travou)
- ✅ CONCLUÍDO (PR: `<link>`) — PR aberto, aguardando revisão humana/Claude
  antes do merge e da remoção deste arquivo

---

## Fila (ordem de prioridade)

### 1. Determinismo por seed no espalhamento de vegetação/props (Poisson Disk)

**Status:** 🟡 PENDENTE

**Contexto:** `HeightmapGenerator.ts` já é determinístico por seed pro
RELEVO (`hashLattice()`/`pseudoNoise()`, construtor recebe `seed: number =
1995`, sempre instanciado como `new HeightmapGenerator(1995)` em
`DungeonGenerator.ts`). Mas o método `samplePoissonDisk()` (linhas ~244-330
do mesmo arquivo — usado por `DungeonGenerator.ts:240` pra escolher onde
espalhar vegetação/props respeitando distância mínima) usa `Math.random()`
cru em 3 pontos (escolha do ponto ativo a expandir, ângulo e distância do
candidato). Resultado: com a MESMA seed (1995, sempre a mesma), o relevo
do piso é idêntico entre execuções, mas a posição da vegetação/props
espalhados por cima muda a cada vez — quebra a promessa de determinismo
por seed que o resto da classe já cumpre.

**🎯 Objetivo:** Tornar `samplePoissonDisk()` determinístico pela mesma
`seed` da instância, sem mudar o algoritmo de Poisson Disk em si (só a
fonte de aleatoriedade) e sem alterar a distribuição espacial resultante
(mesma distância mínima, mesmo filtro de relevo).

**📐 Requisitos Técnicos:**
1. Adicione um gerador pseudo-aleatório determinístico PRÓPRIO da instância
   (ex: um contador interno `private poissonCallCount` incrementado a cada
   chamada de `Math.random()` substituída, alimentando `this.hashLattice(N,
   0)` — reaproveitando o hash já existente, não inventando um PRNG novo do
   zero; Mulberry32/LCG simples também serve se preferir, desde que semeado
   por `this.seed`).
2. Substitua as 3 chamadas de `Math.random()` dentro de
   `samplePoissonDisk()` (escolha de `randIdx` em `activeList`, `angle`,
   `dist`) por esse gerador determinístico.
3. NÃO mude a assinatura pública de `samplePoissonDisk(cols, rows,
   minDistance, maxAttempts)` nem o formato de retorno (`PoissonPoint[]`).
4. Confirme visualmente (ou por teste) que a MESMA seed produz a MESMA
   distribuição de pontos em 2 chamadas consecutivas com os mesmos
   parâmetros.

**Testes Unitários:**
- Duas instâncias de `HeightmapGenerator` com a MESMA seed produzem
  exatamente os mesmos pontos de `samplePoissonDisk(cols, rows, minDistance,
  maxAttempts)` (mesmos `x`/`y`/`gridX`/`gridY` em cada ponto, na mesma
  ordem).
- Duas instâncias com seeds DIFERENTES produzem distribuições diferentes
  (não pode virar sempre a mesma distribuição por engano).
- Regressão: distância mínima entre pontos retornados continua respeitando
  `minDistance` (não pode quebrar o algoritmo de Poisson Disk em si).

**Guardrails:**
- NÃO toque em `GameScene.ts`, `Player.ts` ou `Enemy.ts`.
- NÃO altere `hashLattice()`/`pseudoNoise()`/o algoritmo de relevo
  (heightmap) em si — esta frente é só sobre a fonte de aleatoriedade do
  Poisson Disk.
- NÃO altere o filtro de relevo já existente (proibição de água Z=0 e
  declive íngreme `Delta H > 1`).
- Determinismo por seed é regra do projeto pra geração de terreno/posição
  visual (skill `phaser-4-procedural-generation`) — `Math.random()` cru
  não é aceitável aqui.

**PR:** contra `claude/frentes-atuacao-projeto-qypbg3` (NÃO `main`), título
`fix(terreno): determinismo por seed no espalhamento Poisson Disk de vegetação`.

---

### 2. Normal map ausente na textura `tile_door`

**Status:** 🟡 PENDENTE

**Contexto:** Em `src/utils/textureGenerator.ts`, a seção "17. Dungeon Door
Archway" (~linha 1628-1647) desenha `doorCanvas` e registra a textura via
`addTexture('tile_door', doorCanvas)` — sem normal map. Isso é uma exceção:
tudo ao redor (`tile_wall_brick`, `spr_wall`, `tile_wall_brick_var_0..4`,
poucas linhas acima, mesmo arquivo) usa
`addTextureWithNormalMap(...)`. `tile_door` é posicionado literalmente nos
vãos de porta entre salas (`DungeonGenerator.ts:301,309` e
`PathDrivenGenerator.ts:275`), cercado de paredes iluminadas corretamente
pelo Light2D — a porta fica visualmente "achatada"/sem resposta à luz
dinâmica (tochas, feitiços) no meio das paredes que respondem.

**🎯 Objetivo:** Fazer `tile_door` gerar e registrar seu normal map do
mesmo jeito que `tile_wall_brick`/`spr_wall`, sem mudar o desenho visual da
textura em si.

**📐 Requisitos Técnicos:**
1. Troque a linha `addTexture('tile_door', doorCanvas)` por
   `addTextureWithNormalMap('tile_door', doorCanvas)` (mesma função já
   usada para as texturas de parede vizinhas — não crie uma variante nova
   da função).
2. Confirme que `addTextureWithNormalMap` aceita o `doorCanvas` como está
   (é um `HTMLCanvasElement` produzido por `createPixelCanvas`, mesmo tipo
   usado pelas paredes) — não deveria precisar de nenhuma outra mudança.
3. Nenhum outro arquivo deveria precisar mudar — `tile_door` já é
   consumida como uma `Image` normal nos 3 call sites citados acima.

**Testes Unitários:**
- Teste em `textureGenerator.test.ts` confirmando que `tile_door` registra
  tanto a textura base quanto seu normal map (mock de
  `addTextureWithNormalMap`/`textures.addImage`, mesmo padrão já usado pros
  testes de `tile_wall_brick`).

**Guardrails:**
- NÃO toque em `GameScene.ts`, `Player.ts` ou `Enemy.ts`.
- NÃO altere o desenho visual de `doorCanvas` (cores, arcos, sombra) — só a
  forma de registro da textura.
- NÃO altere nenhuma outra textura deste arquivo — escopo é só `tile_door`.

**PR:** contra `claude/frentes-atuacao-projeto-qypbg3` (NÃO `main`), título
`fix(texturas): normal map ausente em tile_door`.

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
