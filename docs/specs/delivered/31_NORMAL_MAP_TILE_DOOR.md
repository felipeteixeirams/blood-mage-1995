---
agent_context: game-engine, frontend
target_module: src/utils/textureGenerator.ts
priority: low
criticality: low
status: delivered
last_updated: 2026-09-08
tags: [specs, texture, normal-map, light2d, jules-ready]
---

# Normal Map Ausente na Textura `tile_door`

> Extraído de `_ARCHIVED_16_FILA_AUTOMACAO_JULES.md` (item 2) em 2026-09-07
> durante a consolidação da fila de automação na Fila de Prioridade única
> (`docs/specs/README.md`). Conteúdo técnico preservado sem alteração —
> pronto para execução sem esclarecimento adicional (padrão da Seção 6 de
> `docs/architecture/05_SPEC_AND_CONTEXT_DRIVEN_ENGINEERING.md`).

## Contexto

Em `src/utils/textureGenerator.ts`, a seção "17. Dungeon Door Archway"
(~linha 1628-1647) desenha `doorCanvas` e registra a textura via
`addTexture('tile_door', doorCanvas)` — sem normal map. Isso é uma exceção:
tudo ao redor (`tile_wall_brick`, `spr_wall`, `tile_wall_brick_var_0..4`,
poucas linhas acima, mesmo arquivo) usa `addTextureWithNormalMap(...)`.
`tile_door` é posicionado literalmente nos vãos de porta entre salas
(`DungeonGenerator.ts:301,309` e `PathDrivenGenerator.ts:275`), cercado de
paredes iluminadas corretamente pelo Light2D — a porta fica visualmente
"achatada"/sem resposta à luz dinâmica (tochas, feitiços) no meio das
paredes que respondem.

## 🎯 Objetivo

Fazer `tile_door` gerar e registrar seu normal map do mesmo jeito que
`tile_wall_brick`/`spr_wall`, sem mudar o desenho visual da textura em si.

## 📐 Requisitos Técnicos

1. Troque a linha `addTexture('tile_door', doorCanvas)` por
   `addTextureWithNormalMap('tile_door', doorCanvas)` (mesma função já
   usada para as texturas de parede vizinhas — não crie uma variante nova
   da função).
2. Confirme que `addTextureWithNormalMap` aceita o `doorCanvas` como está
   (é um `HTMLCanvasElement` produzido por `createPixelCanvas`, mesmo tipo
   usado pelas paredes) — não deveria precisar de nenhuma outra mudança.
3. Nenhum outro arquivo deveria precisar mudar — `tile_door` já é
   consumida como uma `Image` normal nos 3 call sites citados acima.

## Testes Unitários

- Teste em `textureGenerator.test.ts` confirmando que `tile_door` registra
  tanto a textura base quanto seu normal map (mock de
  `addTextureWithNormalMap`/`textures.addImage`, mesmo padrão já usado pros
  testes de `tile_wall_brick`).

## Guardrails

- NÃO toque em `GameScene.ts`, `Player.ts` ou `Enemy.ts`.
- NÃO altere o desenho visual de `doorCanvas` (cores, arcos, sombra) — só a
  forma de registro da textura.
- NÃO altere nenhuma outra textura deste arquivo — escopo é só `tile_door`.

## Critério de Aceite / PR

Abrir PR contra `claude/frentes-atuacao-projeto-qypbg3` (NÃO `main`),
título `fix(texturas): normal map ausente em tile_door`. `pnpm verify` e
`pnpm test` 100% antes de abrir.
