---
name: phaser-4-procedural-generation
description: Determinismo por seed, autotiling por bitmask, normal maps procedurais, paleta indexada/dithering e o fluxo Baking→Componentização para qualquer novo terreno, textura ou entidade gerada em runtime no Phaser 4.2.1 do Bloodmage 1995. Busca ativa na web quando a API do Phaser 4 não for 100% certa.
---

# 🧙 Skill: Geração Procedural & Determinismo — Bloodmage 1995

Esta skill governa a criação de **qualquer** elemento visual gerado em
runtime (terreno, textura, entidade, prop) no Phaser 4.2.1 deste projeto.
Complementa `phaser-4-development` (arquitetura WebGL2, baking pattern,
shaders) — leia as duas juntas antes de criar algo novo. Onde esta skill
cita um arquivo/função real do projeto, é para você seguir o padrão já
estabelecido, não reinventar.

---

## 1. 🔍 Resolução de ambiguidade: busca ativa na web é obrigatória

O Phaser 4 mudou arquitetura de renderização de forma profunda em relação
ao Phaser 3 (orientação de textura GL nativa, `RenderNodes`/`ShaderQuad`,
`TilemapGPULayer` — ver `phaser-4-development/SKILL.md` seção 1). Se você
não tiver certeza absoluta da sintaxe/existência de uma API do Phaser
4.2.1, **busque na web** (docs oficiais `docs.phaser.io`, changelog em
`github.com/phaserjs/phaser`) antes de escrever o código — não invente
nome de classe/método por analogia com Phaser 3. Isto já rendeu erro real
neste projeto: a auditoria de 2026-09 encontrou métodos citados em specs
que nunca existiram no código (`docs/reviews/03_AUDITORIA_BASE_DOCUMENTAL_2026_09.md`).

**`TilemapGPULayer` (confirmado real via docs oficiais, 2026-09)** —
renderiza uma camada de tilemap inteira como 1 único quad via shader,
zero custo por quantidade de tiles visíveis. **Mas exige um único
tileset/textura estática por camada** e você precisa chamar
`generateLayerDataTexture()` manualmente após qualquer edição de tile —
incompatível com o autotiling por bitmask já usado neste projeto (várias
texturas assadas por variante, cada tile um `Image` individual — ver
seção 3). Considere `TilemapGPULayer` só para uma camada de piso 100%
estática e homogênea (ex: um fundo distante sem variação); não troque o
sistema de piso existente por ele sem medir o ganho real primeiro.

---

## 2. 🎲 Determinismo por seed — quando é obrigatório, quando não é

**Obrigatório: geração de terreno, textura e variantes visuais.**
Qualquer heightmap, layout de masmorra/bioma, ou escolha de variante de
textura deve ser reprodutível a partir de uma seed — nunca `Math.random()`
cru. Padrão já estabelecido em `HeightmapGenerator.ts`:

```typescript
// Hash puro de coordenadas de malha INTEIRAS — só nas âncoras da malha
private hashLattice(ix: number, iy: number): number { /* ... */ }

// Value noise com interpolação bilinear suave (smoothstep) sobre a malha
// esparsa — NUNCA chame o hash cru direto por célula de grid (bug real
// corrigido em 2026-09: isso produz ruído "sal-e-pimenta" sem correlação
// espacial, quebrando qualquer heightmap/autotiling que dependa de
// vizinhança — ver docs/reviews/03_AUDITORIA_BASE_DOCUMENTAL_2026_09.md).
private pseudoNoise(x: number, y: number, freq: number): number { /* ... */ }
```

Seleção de variante por posição (não aleatória, reprodutível): mesmo
padrão em `DungeonGenerator.getGroundTextureKey()` e
`ProceduralForestGenerator` — `Math.sin(x * A + y * B)` normalizado, nunca
`Math.random()`.

**Não obrigatório — e não mude: aleatoriedade de gameplay em tempo real.**
Chance de drop de loot (`LootSystem.rollLootChance()`), spawn de
armadilha/barril, afixo de elite — são decisões únicas de runtime que
nunca precisaram ser reproduzidas; usam `Math.random()` de propósito e
está correto. **Não proponha substituir isso por PRNG com seed** só por
princípio — são ~176 call sites de `Math.random()` no código hoje, quase
todos nessa categoria. Se ficar em dúvida se um caso é "terreno/textura"
(seed obrigatória) ou "gameplay" (`Math.random()` correto), pergunte antes
de decidir sozinho.

---

## 3. 🧩 Autotiling por bitmask (Wang tiles / blob method)

Padrão já validado e em produção (masmorras, PR mesclado 2026-09) —
reaproveite, não reinvente:

```typescript
// DungeonGenerator.ts
public calculateBitmask(gridX, gridY, isFloorFn): number {
  let mask = 0;
  if (isFloor(gridX, gridY - 1)) mask |= 1;  // North
  if (isFloor(gridX + 1, gridY)) mask |= 2;  // East
  if (isFloor(gridX, gridY + 1)) mask |= 4;  // South
  if (isFloor(gridX - 1, gridY)) mask |= 8;  // West
  return mask;
}
public getGroundTextureKey(gridX, gridY, isSafeHouse, isFloorFn): string {
  // mask===15 (todos os 4 vizinhos) → variante de centro por ruído
  // demais valores → borda/canto específico (edge_n/e/s/w, corner_ne/nw/se/sw)
}
```

Referência técnica: bitmask de 4 vizinhos / Wang tiles (Hao Wang, 1961),
redblobgames.com/articles/autotile. Não precisa do conjunto completo de
47 tiles do blob method — um subconjunto reduzido (bordas + cantos, como
já implementado) resolve o "grid cru" repetitivo.

**Cuidado com o piso plano-vs-relevo:** se o piso usa retângulos opacos
com sobreposição (não losango recortado), **não** desloque o Y do sprite
por elevação — bug real encontrado e corrigido em 2026-09
(`ProceduralForestGenerator`: recorte em losango ou deslocamento de Y por
tile quebra a malha contígua quando há relevo real por toda a área, ao
contrário de masmorras majoritariamente planas). Relevo real deve ser
expresso via tint por altura + paredes de falésia + altura de props, não
via deslocamento do próprio piso.

---

## 4. 🗺️ Terreno orgânico: BSP + Autômato Celular (já em produção)

Divisão espacial por BSP iterativo seguida de suavização por autômato
celular já é o padrão real deste projeto pra layout de masmorra (Spec
11.01, `DungeonGenerator.ts`) — prefira estender isso a introduzir
Marching Squares do zero. Marching Squares é uma técnica válida
(transições suaves de contorno num campo escalar 2D) mas **ainda não
está implementada aqui** — se for genuinamente necessária pra um caso
novo, avise antes de introduzir uma técnica de geração paralela à
existente, pelo mesmo motivo que motivou a Fila de Automação do Jules
(`docs/specs/backlog/16_FILA_AUTOMACAO_JULES.md`): duas técnicas
concorrentes pro mesmo problema é dívida técnica, não robustez.

---

## 5. 🖼️ Normal Maps procedurais (já em produção)

Toda textura de cor gerada deve gerar seu normal map junto — padrão já
implementado (Spec 23.02, `src/utils/textureGenerator.ts`):

```typescript
const addTextureWithNormalMap = (key: string, canvas: HTMLCanvasElement) => {
  const normalMap = generateNormalMap(canvas); // algoritmo Sobel-ish:
  // deriva luminância dos pixels do canvas base, mapeia pra canais RGB
  // representando vetores normais (X, Y, Z); strength configurável.
  // ...registra base + normal map no TextureManager para o pipeline Light2D
};
```
Sem isso, o pipeline `Light2D`/tochas para de iluminar o elemento
corretamente — confirmado aplicado em `spr_bloodmage`, monstros de elite,
`tile_wall_brick`, `spr_chest`, todas as variantes de piso.

---

## 6. 🎨 Paleta indexada, dithering e resolução baixa (já em produção)

- **Paleta limitada** (3-5 cores por elemento) com propósito — nunca
  gradiente livre. Tons terrosos/sombrios/sangrentos, baixa saturação.
- **Dithering Bayer 2x2** (não ruído aleatório) para textura suave sem
  banding — padrão em `forest_grass`, tufos de grama, variantes de piso.
- **Resoluções baixas nativas** (16x16 a 64x64 típico neste projeto,
  varia por elemento) com `pixelArt: true` já ativo na config do jogo
  (`NEAREST` filtering, cantos serrilhados nítidos — não suavize).
- **Silhueta forte, reconhecível à primeira vista** — profundidade via
  sombreamento/escala, não detalhe excessivo em baixa resolução.

Zero assets externos: `this.load.image()` não é usado neste projeto pra
elementos de jogo — tudo é gerado via `Canvas`/`Graphics` e assado em
`DynamicTexture`/`addTexture` no `TextureManager` (ver
`phaser-4-development/SKILL.md` seção 2, "Baking Pattern" — é o mesmo
requisito, já em vigor).

---

## 7. 🛠️ Fluxo pra criar um novo elemento procedural (terreno, entidade, prop)

1. **Baking da textura**: método/classe dedicado que desenha no
   `Graphics` efêmero e assa em `DynamicTexture` durante `create()`/
   inicialização da Scene — nunca no `update()` (ver
   `phaser-4-development/SKILL.md` seção 2). Gere o normal map junto
   (seção 5 acima).
2. **Determinismo**: se o elemento faz parte de terreno/variante visual
   reproduzível, use seed (seção 2) — se for decisão de gameplay em
   tempo real, `Math.random()` está certo.
3. **Componentização**: separe lógica de estado/IA da renderização.
   Neste projeto isso já significa: sistemas dedicados em
   `src/game/systems/` (ex: `DungeonDetailFactory`,
   `SafeHouseDetailFactory`, `TerrainDetailFactory` — um por domínio
   temático, não uma classe monolítica).
4. **Física quando fizer sentido**: colisão de prop = corpo estático
   invisível registrado no `wallsGroup` já existente (nunca criar um novo
   `physics.add.collider()`) — mesmo padrão de árvore/rocha/tronco caído.
5. **Y-sort correto**: piso plano fica em depth fixo fora do
   `depthGroup` (ver nota da seção 3); objetos verticais (props, árvores,
   personagens) entram no `depthGroup` e recebem
   `setDepth(gameObject.y)` a cada frame.
6. **Documentação limpa**: comente POR QUE, não só o quê — este projeto
   já cita bugs reais encontrados/corrigidos como contexto em comentários
   (ex: `HeightmapGenerator.ts`, `ProceduralForestGenerator.ts`) — siga o
   mesmo padrão em vez de comentário genérico.
7. **Validação**: `pnpm test` + `pnpm run typecheck`; para qualquer
   elemento visual novo, prefira confirmar visualmente rodando o jogo de
   verdade (Playwright, ver `phaser-4-playtest-harness/SKILL.md`) — testes
   unitários com Phaser mockado não pegam regressão visual (confirmado
   nesta sessão: um bug de sobreposição de piso passou por 100% dos
   testes e só apareceu rodando o jogo real).

---

## 8. 🚨 Regras que não mudam (herdadas de `phaser-4-development` e `CLAUDE.md`)

- Nunca crie UI dentro do Canvas Phaser — toda UI é React (`src/components/`).
- Ponte Phaser↔React é 100% Zustand (`docs/architecture/06_PHASER_REACT_BRIDGE_MIGRATION.md`) — nunca `CustomEvent`/`dispatchEvent`.
- `Player.ts`, `Enemy.ts`, `GameScene.ts`, `DungeonGenerator.ts` são
  arquivos críticos Nível 1 (`docs/critical/01_CRITICAL_FILES.md`) — ver
  antes de mexer, mesmo pra algo aparentemente pequeno.
