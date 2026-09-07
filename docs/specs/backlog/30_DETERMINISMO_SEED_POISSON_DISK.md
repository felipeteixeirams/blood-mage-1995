---
agent_context: game-engine, backend
target_module: src/game/systems/HeightmapGenerator.ts
priority: medium
criticality: low
status: backlog
last_updated: 2026-09-07
tags: [specs, procedural-generation, determinism, seed, poisson-disk, jules-ready]
---

# Determinismo por Seed no Espalhamento de Vegetação/Props (Poisson Disk)

> Extraído de `_ARCHIVED_16_FILA_AUTOMACAO_JULES.md` (item 1) em 2026-09-07
> durante a consolidação da fila de automação na Fila de Prioridade única
> (`docs/specs/README.md`). Conteúdo técnico preservado sem alteração —
> pronto para execução sem esclarecimento adicional (padrão da Seção 6 de
> `docs/architecture/05_SPEC_AND_CONTEXT_DRIVEN_ENGINEERING.md`).

## Contexto

`HeightmapGenerator.ts` já é determinístico por seed pro RELEVO
(`hashLattice()`/`pseudoNoise()`, construtor recebe `seed: number = 1995`,
sempre instanciado como `new HeightmapGenerator(1995)` em
`DungeonGenerator.ts`). Mas o método `samplePoissonDisk()` (linhas ~244-330
do mesmo arquivo — usado por `DungeonGenerator.ts:240` pra escolher onde
espalhar vegetação/props respeitando distância mínima) usa `Math.random()`
cru em 3 pontos (escolha do ponto ativo a expandir, ângulo e distância do
candidato). Resultado: com a MESMA seed (1995, sempre a mesma), o relevo do
piso é idêntico entre execuções, mas a posição da vegetação/props espalhados
por cima muda a cada vez — quebra a promessa de determinismo por seed que o
resto da classe já cumpre.

## 🎯 Objetivo

Tornar `samplePoissonDisk()` determinístico pela mesma `seed` da instância,
sem mudar o algoritmo de Poisson Disk em si (só a fonte de aleatoriedade) e
sem alterar a distribuição espacial resultante (mesma distância mínima,
mesmo filtro de relevo).

## 📐 Requisitos Técnicos

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

## Testes Unitários

- Duas instâncias de `HeightmapGenerator` com a MESMA seed produzem
  exatamente os mesmos pontos de `samplePoissonDisk(cols, rows, minDistance,
  maxAttempts)` (mesmos `x`/`y`/`gridX`/`gridY` em cada ponto, na mesma
  ordem).
- Duas instâncias com seeds DIFERENTES produzem distribuições diferentes
  (não pode virar sempre a mesma distribuição por engano).
- Regressão: distância mínima entre pontos retornados continua respeitando
  `minDistance` (não pode quebrar o algoritmo de Poisson Disk em si).

## Guardrails

- NÃO toque em `GameScene.ts`, `Player.ts` ou `Enemy.ts`.
- NÃO altere `hashLattice()`/`pseudoNoise()`/o algoritmo de relevo
  (heightmap) em si — esta frente é só sobre a fonte de aleatoriedade do
  Poisson Disk.
- NÃO altere o filtro de relevo já existente (proibição de água Z=0 e
  declive íngreme `Delta H > 1`).
- Determinismo por seed é regra do projeto pra geração de terreno/posição
  visual (skill `phaser-4-procedural-generation`) — `Math.random()` cru
  não é aceitável aqui.

## Critério de Aceite / PR

Abrir PR contra `claude/frentes-atuacao-projeto-qypbg3` (NÃO `main`),
título `fix(terreno): determinismo por seed no espalhamento Poisson Disk de
vegetação`. `pnpm verify` e `pnpm test` 100% antes de abrir.
