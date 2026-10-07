---
agent_context: game-engine
target_module: src/utils/textureGenerator.ts, src/game/scenes/BootScene.ts, src/game/assets/assetManifest.ts
priority: high
criticality: high
status: backlog
last_updated: 2026-10-07
tags: [specs, normal-map, light2d, player, phaser4, ears]
---

# Spec 35.03 — Normal Map e Iluminação Volumétrica do Jogador

> Satélite de [35.00 — Índice Mestre](./35_00_JOGAVEL_E_VISUAL_SEM_ASSETS_INDICE.md).
> Achados cobertos: **A6, A7**. Depende de [35.01](./35_01_DETECCAO_WEBGL_E_LIGHT2D_PHASER4.md).

## 1. Contexto

- O jogador (`spr_bloodmage`) é a entidade mais visível do jogo e a única que
  **não** recebe relevo de luz:
  - Caminho principal: `assetManifest.json` carrega `assets/sprites/player/bloodmage.png`
    (544×1156, 8 colunas × 17 linhas de 68×68, `frameTotal` 137 em execução) via
    `scene.load.spritesheet(key, path, {frameWidth, frameHeight})`
    (`assetManifest.ts:104-107`) — **sem normal map**.
  - Fallback procedural: `textureGenerator.ts:198-416` desenha 544×612 e registra
    com `addSpriteSheet` (`:35-46`), que chama `textureManager.addSpriteSheet(key, canvas, config)`
    **sem** o 4º argumento `dataSource`.
  - Execução 2026-10-07: `player.texture.dataSource` vazio, `player.lighting === false`.
- Isso contradiz `delivered/23_02_PROCEDURAL_NORMAL_MAPS.md` ("aplicado a `spr_bloodmage`").
- Os 10 inimigos já têm normal map via `addTextureWithNormalMap` (spec 10, fase 3.1).
- `BaseAssetConfig.normalMapPath` (`assetManifest.ts:24`) existe no tipo mas
  `queueAssetLoading` nunca o lê.
- APIs disponíveis no Phaser 4.2.1:
  - `Texture.setDataSource(data, startIndex?, renew?)` (`textures/Texture.js:562`) — anexa normal map a textura já carregada.
  - `TextureManager.addSpriteSheet(key, source, config, dataSource)` (`TextureManager.js:1119`).
  - `generateNormalMap(source: HTMLCanvasElement, strength = 2.0, invert = false)` (`textureGenerator.ts:3122`) — Sobel por luminância.
- Skills a consultar: **`phaser-4-procedural-generation`** (normal maps procedurais), **`phaser-4-development`**.

## 2. Objetivo

Dar ao jogador um normal map gerado em runtime (sem arquivo novo), para que
tochas e a luz do cajado o modelem em volume como já acontece com os inimigos.

## 3. Escopo

### 3.1 Dentro do Escopo
- Gerar o normal map de `spr_bloodmage` no boot, para o PNG carregado **e** para o fallback procedural.
- Fazer `queueAssetLoading` honrar `normalMapPath` quando presente (sem adicionar nenhum arquivo agora).
- Teste unitário do anexo do normal map; asserção E2E.

### 3.2 Fora do Escopo
- Novo arquivo `bloodmage_n.png` (seria um asset — fora do escopo da 35).
- Redesenhar o personagem, mudar `frameWidth`, origem ou animações.
- Mudar posição/cor/raio da luz do jogador (→ 35.05).
- Normal map de projéteis, partículas ou UI.

## 4. Requisitos (EARS)

| ID | Requisito | Verificação |
|---|---|---|
| R35.03-01 | **QUANDO** o `BootScene.create()` terminar o carregamento e `spr_bloodmage` existir **sem** `dataSource`, o sistema **DEVE** desenhar a imagem-fonte num `HTMLCanvasElement`, chamar `generateNormalMap(canvas, 2.0)` e anexar o resultado com `texture.setDataSource(normalCanvas)`. | `textureGenerator.test.ts` (novo `attachRuntimeNormalMap`) |
| R35.03-02 | **ONDE** `spr_bloodmage` vier do fallback procedural, `addSpriteSheet` **DEVE** passar o normal map gerado como 4º argumento (`dataSource`). | `textureGenerator.test.ts` |
| R35.03-03 | **SE** `spr_bloodmage` já possuir `dataSource` (ex.: futuro `normalMapPath`), **ENTÃO** o sistema **NÃO DEVE** sobrescrevê-lo. | teste unitário |
| R35.03-04 | **ONDE** uma entrada do manifest declarar `normalMapPath`, `queueAssetLoading` **DEVE** carregar com a forma de config `{ key, url, normalMap, frameConfig }` (`SpriteSheetFile.js:164-170`). | `assetIntegrity.test.ts` |
| R35.03-05 | O normal map gerado **DEVE** ter exatamente as dimensões da imagem-fonte (544×1156 no PNG atual), para que os 137 frames indexem a mesma região. | teste unitário |
| R35.03-06 | **ENQUANTO** o Light2D estiver ativo (35.01), o jogador **DEVE** ter `lighting === true` e `texture.dataSource.length >= 1`. | `smoke-playable.spec.ts` (35.02) estendido |
| R35.03-07 | A geração do normal map **DEVE** ocorrer uma única vez por sessão (no boot), nunca por frame nem por troca de andar. | revisão + contador em teste |
| R35.03-08 | **SE** o canvas 2D não estiver disponível (headless sem `getContext`), **ENTÃO** o sistema **DEVE** manter a textura sem normal map e registrar `logger.warn`, sem lançar exceção. | teste unitário |

## 5. Requisitos Técnicos e Arquivos-Alvo

```ts
// src/utils/textureGenerator.ts
export function attachRuntimeNormalMap(scene: Phaser.Scene, key: string, strength = 2.0): boolean {
  const tex = scene.textures.get(key);
  if (!tex || tex.key === '__MISSING' || tex.dataSource.length > 0) return false;
  const img = tex.getSourceImage() as HTMLImageElement | HTMLCanvasElement;
  const canvas = document.createElement('canvas');
  canvas.width = img.width; canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) { logger.warn('TextureGenerator', 'Canvas 2D indisponível para normal map', { key }); return false; }
  ctx.drawImage(img, 0, 0);
  tex.setDataSource(generateNormalMap(canvas, strength));
  return true;
}
```

| Arquivo | Mudança |
|---|---|
| `src/utils/textureGenerator.ts` | `attachRuntimeNormalMap`; `addSpriteSheet` aceita/gera `dataSource` para `spr_bloodmage` |
| `src/game/scenes/BootScene.ts` | chamar `attachRuntimeNormalMap(this, 'spr_bloodmage')` após `generateGameTextures(this, { force: false })` (linha ~77) |
| `src/game/assets/assetManifest.ts:102-108` | ramo `normalMapPath` |
| `src/utils/textureGenerator.test.ts`, `src/game/assets/assetIntegrity.test.ts` (ou novo `assetManifest.test.ts`) | testes; adicionar `import { logger } from` `../utils/logger` em `textureGenerator.ts` (hoje só importa `phaser`) |
| `docs/specs/delivered/23_02_PROCEDURAL_NORMAL_MAPS.md` | changelog corrigindo a afirmação sobre `spr_bloodmage` |

`Player.ts` **não** é tocado: a iluminação do objeto vem de
`lightingSystem.applyLightPipeline(this)` (`Player.ts:76`), corrigido em 35.01.

## 6. Decisões de Produto Necessárias

| Decisão | Default seguro |
|---|---|
| `strength` do normal map do jogador | **2.0** (mesmo valor dos inimigos — consistência visual). Ajuste fino só em 35.05 com screenshot por bioma. |
| Luz do jogador no centro do sprite ou no topo do cajado | **Manter no centro** (comportamento atual de `createPlayerLight`). Mover para o cajado muda leitura de combate → decisão do Felipe em 35.05. |

## 7. Testes e Critério de Aceite

1. `pnpm test -- --run`, `pnpm run typecheck`, `pnpm run build` passam.
2. `pnpm e2e:smoke` passa com R35.03-06.
3. Tempo de boot: medir `performance.now()` antes/depois de `attachRuntimeNormalMap`
   na sonda e registrar no changelog (expectativa: dezenas de ms para ~630 mil
   pixels — **não validado** até medir).
4. Screenshot do jogador ao lado de uma tocha, antes/depois, no changelog.
5. **Não validado por esta spec:** se o relevo "fica bom" no pixel art 68×68 —
   precisa de olhar humano (o Sobel por luminância pode realçar contorno demais).

## 8. Guardrails

- Não alterar `frameWidth/frameHeight` (68×68) nem a ordem de frames — ver
  `docs/critical/05_TROUBLESHOOTING_KNOWN_ISSUES.md` item 15 (armadilha 48×48 vs 68×68).
- Não tocar `Player.ts`.
- Nenhum arquivo novo em `public/assets/`.

## 9. Referências

- [[35_00_JOGAVEL_E_VISUAL_SEM_ASSETS_INDICE]], [[35_01_DETECCAO_WEBGL_E_LIGHT2D_PHASER4]]
- [[delivered/23_02_PROCEDURAL_NORMAL_MAPS]], [[delivered/10_POLIMENTO_VISUAL_PROCEDURAL_LUZ_E_CENARIO]]

## Registro de Mudanças

| Data | O que mudou | Autor |
|------|-------------|-------|
| 2026-10-07 | Criação (achados A6, A7) | Claude |
