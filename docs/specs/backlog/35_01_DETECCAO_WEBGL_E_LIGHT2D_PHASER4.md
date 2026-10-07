---
agent_context: game-engine, qa
target_module: src/utils/renderer.ts, src/game/systems/LightingSystem.ts, src/game/systems/PostFXSystem.ts, src/game/shaders/AtmosphericTreeShader.ts, src/game/objects/Enemy.ts, src/game/systems/SafeHouseAnimationController.ts, src/game/scenes/GameScene.ts, src/game/PhaserGame.tsx, .claude/skills
priority: high
criticality: high
status: backlog
last_updated: 2026-10-07
tags: [specs, light2d, postfx, webgl, phaser4, regressao, skills, ears]
---

# Spec 35.01 — Detecção WebGL Correta e Iluminação Phaser 4 Real

> Satélite de [35.00 — Índice Mestre](./35_00_JOGAVEL_E_VISUAL_SEM_ASSETS_INDICE.md).
> Achados cobertos: **A1, A2, A3, A4, A5, A11**. Pré-requisito: [35.02](./35_02_GATE_E2E_JOGABILIDADE_ARCADE_CAMPANHA.md) entregue.

## 1. Contexto

Em execução real (WebGL, `renderer.type === 2`), a sonda de 2026-10-07 mediu:

| Medida | Valor |
|---|---|
| `game.renderer.isWebGL` | `undefined` (propriedade não existe em `node_modules/phaser/src/renderer/webgl/WebGLRenderer.js` 4.2.1) |
| `gameScene.lightingSystem.enabled` | `false` |
| `gameScene.postFX.isWebGL` | `false` |
| `gameScene.lights.active` / nº de luzes | `false` / `0` |
| `cameras.main.filters.external` | 0 filtros |
| Objetos com `lighting === true` | 18 de ~7.750 (só inimigos, por `Enemy.ts:120`) |
| `typeof obj.setPipeline` | `undefined` em 100% dos objetos |

Causas, todas confirmadas no código-fonte do engine instalado:

1. **Detecção errada** — `renderer.isWebGL === true` em 6 pontos:
   `LightingSystem.ts:79`, `PostFXSystem.ts:56`, `AtmosphericTreeShader.ts:236`,
   `Enemy.ts:160` (`applyEliteGlow`), `SafeHouseAnimationController.ts:189`
   (`setupHearthGlowFilter`). Forma correta no Phaser 4: `renderer.type === Phaser.WEBGL`.
2. **API Phaser 3** — `LightingSystem.applyLightPipeline()` (`:121-129`) chama
   `setPipeline('Light2D')`. No Phaser 4 a iluminação por objeto é
   `GameObject.setLighting(enable)` (`components/Lighting.js:74`). ~30 call sites
   (`DungeonGenerator`, `PathDrivenGenerator`, `ProceduralForestGenerator`,
   `TerrainDetailFactory`, `DungeonDetailFactory`, `SafeHouseDetailFactory`,
   `DungeonFlowController`, `Player`, `Enemy`, `Projectile`, `Collectible`,
   `Loot`, `Scavengeable`) dependem desse método.
3. **Método inexistente** — `SafeHouseAnimationController.ts:147-149` chama
   `lightingSystem.addLightSource({...})`, que não existe.
4. **Testes mascarando** — 36 ocorrências de `isWebGL` em mocks de 5 arquivos:
   `LightingSystem.test.ts`, `PostFXSystem.test.ts`, `AtmosphericTreeShader.test.ts`,
   `Enemy.test.ts`, `ProceduralForestGenerator.test.ts`.
   (Varredura de 2026-10-07: além de `isWebGL`/`setPipeline`, **nenhuma outra**
   API exclusiva do Phaser 3 aparece em `src/` — `setPostPipeline`, `preFX`,
   `createEmitter`, `ParticleEmitterManager` ausentes ou só em comentário.)
5. **Skills propagando o erro** — `phaser-4-fx-filters/SKILL.md:45,59,77` e
   `phaser-4-development/SKILL.md:236` ensinam `renderer.isWebGL`.
6. `GameScene.ts:340-344` desenha `darknessOverlay` (alpha 0.32, depth 1990)
   **sempre**, embora `LightingSystem.ts:7-11` diga que ele é só fallback.
7. `PhaserGame.tsx:21` não define `render.maxLights`; o padrão do engine é **10**
   luzes por câmera (`core/Config.js:481`), com culling por distância da câmera
   (`LightsManager.js:200`). Há ~60 sprites `light_torch` por andar.

8. **Efeito cascata em `LightingPolish`** — `isLight2DActive()` (`LightingPolish.ts:43-49`)
   exige `scene.lights.active`, que nunca fica `true`; as 7 chamadas
   `lights.addLight` (`:291-503`: glow de feitiço, item raro, portal, boss) estão
   inertes. Voltam a funcionar só com R35.01-06; nenhuma mudança no arquivo.

O resto do `LightingSystem` (`enable`, `createPlayerLight`, `updatePlayerLight`,
`addTorchLights`, `update` com flicker, `clearTorchLights`, `shutdown`) já usa
a API correta (`lights.enable/addLight/removeLight/setAmbientColor`) e **não**
precisa ser reescrito.

Skills a consultar: **`phaser-4-fx-filters`**, **`phaser-4-development`**,
**`phaser4-ref-cameras`**.

## 2. Objetivo

Fazer Light2D, PostFX de câmera, glows por filtro e o shader atmosférico
realmente executarem em WebGL, com uma única função de detecção testada
contra o formato real do renderer do Phaser 4.

## 3. Escopo

### 3.1 Dentro do Escopo
- Helper único `isWebGLRenderer(game)` e substituição dos 6 pontos.
- `applyLightPipeline` migrado para `setLighting(true)` (nome/assinatura preservados).
- `LightingSystem.addLightSource(opts)` criado (contrato que a Safe House já usa).
- `darknessOverlay` escondido enquanto o Light2D estiver ativo.
- `render.maxLights` explícito em `PhaserGame.tsx`.
- Mocks de teste corrigidos + teste de regressão do helper.
- Correção dos snippets nas 2 skills.
- Notas de correção no changelog de `delivered/23_01`, `23_02`, `23_03`.

### 3.2 Fora do Escopo
- Normal map do player (→ 35.03).
- Recalibrar cores/intensidades por bioma (→ 35.05). Os valores atuais de
  `BIOME_LIGHTING` e `PostFXSystem` são usados como estão.
- Reduzir número de objetos/draw calls (→ 35.05).
- Remover o fallback Canvas.

## 4. Requisitos (EARS)

| ID | Requisito | Verificação |
|---|---|---|
| R35.01-01 | O módulo `src/utils/renderer.ts` **DEVE** exportar `isWebGLRenderer(game?: Phaser.Game): boolean`, que retorna `game?.renderer?.type === Phaser.WEBGL`. | `renderer.test.ts` |
| R35.01-02 | **SE** o renderer tiver apenas `isWebGL: true` sem `type === Phaser.WEBGL`, **ENTÃO** `isWebGLRenderer` **DEVE** retornar `false` (trava a regressão A1). | `renderer.test.ts` |
| R35.01-03 | `LightingSystem`, `PostFXSystem`, `AtmosphericTreeShader`, `Enemy.applyEliteGlow` e `SafeHouseAnimationController.setupHearthGlowFilter` **DEVEM** usar `isWebGLRenderer` e nenhum arquivo em `src/` **DEVE** ler `renderer.isWebGL`. | `grep -rn "isWebGL ===\|\.isWebGL\b" src` sem ocorrência fora de `renderer.ts` |
| R35.01-04 | **ENQUANTO** `lightingSystem.isActive()` for `true`, `applyLightPipeline(obj)` **DEVE** chamar `obj.setLighting(true)` quando `typeof obj.setLighting === 'function'`. | `LightingSystem.test.ts` |
| R35.01-05 | **SE** `lightingSystem.isActive()` for `false` (Canvas ou `postProcessingEnabled === false`), **ENTÃO** `applyLightPipeline` **NÃO DEVE** alterar o objeto. | `LightingSystem.test.ts` |
| R35.01-06 | **QUANDO** `DungeonFlowController` chamar `lightingSystem.enable(biome, depth)` em WebGL, a cena **DEVE** ter `lights.active === true` e ao menos 1 luz (a do jogador, via `createPlayerLight`). | `smoke-playable.spec.ts` (35.02) estendido: `gameScene.lights.active === true` |
| R35.01-07 | `LightingSystem` **DEVE** expor `addLightSource({x, y, radius, color, intensity}): Phaser.GameObjects.Light \| null`, que retorna `null` quando inativo e registra a luz para remoção em `shutdown()`. | `LightingSystem.test.ts` |
| R35.01-08 | **QUANDO** a Safe House for montada com Light2D ativo, a lareira **DEVE** ter 1 luz de raio 200, cor `0xffb347`, com intensidade pulsando entre 0.7 e 0.85 (tween já existente em `SafeHouseAnimationController.ts:155-163`). | `safe-house-animations.spec.ts` |
| R35.01-09 | **ENQUANTO** `lightingSystem.isActive()` for `true`, `darknessOverlay` **DEVE** estar `visible === false`; **ENQUANTO** for `false`, **DEVE** permanecer como hoje (alpha 0.32). | E2E + teste de `GameScene` via mock |
| R35.01-10 | `PhaserGame.tsx` **DEVE** definir `render: { maxLights: 16 }` (default — ver §6). | leitura do config |
| R35.01-11 | **ENQUANTO** o renderer for WebGL, `PostFXSystem` **DEVE** registrar seus filtros em `cameras.main.filters.external`. | E2E: `filters.external.list.length >= 1` |
| R35.01-12 | **SE** `scene.add.shader` lançar exceção em `createAtmosphericTree`, **ENTÃO** a função **DEVE** cair no sprite estático já existente e registrar `logger.warn` (o caminho shader nunca rodou em WebGL real até esta spec). | `AtmosphericTreeShader.test.ts` + E2E sem `pageerror` |
| R35.01-13 | Os mocks de renderer nos 5 testes listados em §1.4 **DEVEM** usar `type: Phaser.WEBGL` (ou `2`), não `isWebGL`. | revisão de diff |
| R35.01-14 | As skills `phaser-4-fx-filters` e `phaser-4-development` **DEVEM** trocar todo `renderer.isWebGL` por `renderer.type === Phaser.WEBGL` e incluir um aviso de que `isWebGL` não existe no Phaser 4. | revisão de diff |

## 5. Requisitos Técnicos e Arquivos-Alvo

```ts
// src/utils/renderer.ts
import Phaser from 'phaser';
export function isWebGLRenderer(game?: Phaser.Game | null): boolean {
  return game?.renderer?.type === Phaser.WEBGL;
}

// LightingSystem.applyLightPipeline — mesmo nome e assinatura (Extract/Delegate preservado)
public applyLightPipeline(gameObject: Phaser.GameObjects.GameObject): void {
  if (!this.enabled) return;
  const obj = gameObject as Phaser.GameObjects.GameObject & { setLighting?: (v: boolean) => unknown };
  if (typeof obj.setLighting === 'function') obj.setLighting(true);
}

// LightingSystem.addLightSource — Phaser 4: lights.addLight(x, y, radius, rgb, intensity, z?)
public addLightSource(o: { x: number; y: number; radius: number; color: number; intensity: number }) {
  if (!this.enabled) return null;
  const light = (this.scene.lights as Phaser.GameObjects.LightsManager).addLight(o.x, o.y, o.radius, o.color, o.intensity);
  this.extraLights.push(light);
  return light;
}
```

| Arquivo | Mudança |
|---|---|
| `src/utils/renderer.ts` (+ `.test.ts`) | criar |
| `src/game/systems/LightingSystem.ts` | detecção, `applyLightPipeline`, `addLightSource`, `extraLights` limpo em `shutdown`/`clearTorchLights` |
| `src/game/systems/PostFXSystem.ts:56` | detecção |
| `src/game/shaders/AtmosphericTreeShader.ts:236` | detecção + garantir try/catch com fallback (R35.01-12) |
| `src/game/objects/Enemy.ts:160` | detecção (⚠️ arquivo crítico — só a linha de detecção) |
| `src/game/systems/SafeHouseAnimationController.ts:189` | detecção |
| `src/game/scenes/GameScene.ts:340-344` | `darknessOverlay.setVisible(!this.lightingSystem.isActive())` após `lightingSystem.enable` (⚠️ arquivo crítico — wrapper fino) |
| `src/game/PhaserGame.tsx:21` | `render.maxLights` |
| 5 arquivos `*.test.ts` | mocks |
| `.claude/skills/phaser-4-fx-filters/SKILL.md`, `.claude/skills/phaser-4-development/SKILL.md` | snippets |
| `docs/specs/delivered/23_01_*`, `23_02_*`, `23_03_*` | linha de changelog apontando para 35.01 |
| `docs/critical/05_TROUBLESHOOTING_KNOWN_ISSUES.md` | novo item "Light2D/PostFX inertes: `isWebGL` não existe no Phaser 4" |

## 6. Decisões de Produto Necessárias

| Decisão | Default seguro |
|---|---|
| `maxLights` (custo por pixel × qualidade) | **16**. Acima do padrão 10 porque o jogador + ~4–6 tochas visíveis + glows de `LightingPolish` ultrapassam 10. Revisar em 35.05 com medição em hardware real. |
| Religar tudo de uma vez ou por etapas | **Uma etapa só**, mas protegida pelo toggle já existente `settings.postProcessingEnabled` (desligar volta exatamente ao visual de hoje). |

## 7. Testes e Critério de Aceite

1. `pnpm test -- --run`, `pnpm run typecheck`, `pnpm run build` passam.
2. `pnpm e2e:smoke` (35.02) passa com as asserções extras: `lights.active === true`,
   `lights.getLightCount() >= 1`, `filters.external.list.length >= 1`, sem `pageerror`.
3. Sonda: proporção de objetos com `lighting === true` ≥ 90% dos tiles de
   piso/parede e 100% de `spr_bloodmage` (o player fica iluminado, mas sem
   relevo até 35.03).
4. Screenshots antes/depois de Arcade e Campanha anexados ao changelog.
5. **Não validado por esta spec (declarar no relatório):** FPS em mobile real e
   o "look" final — dependem de 35.05 e de playtest do Felipe.

## 8. Guardrails

- `Player.ts`, `Enemy.ts`, `GameScene.ts` são críticos: nesta spec só se
  trocam a linha de detecção / a visibilidade do overlay. Nenhuma física,
  FSM ou ordem de `create()` muda.
- Valores de cor/intensidade não mudam aqui (regra do `CLAUDE.md`: testar em
  múltiplos biomas antes de alterar — isso é 35.05).
- O toggle `postProcessingEnabled === false` **deve** reproduzir o visual de hoje.

## 9. Referências

- [[35_00_JOGAVEL_E_VISUAL_SEM_ASSETS_INDICE]], [[35_02_GATE_E2E_JOGABILIDADE_ARCADE_CAMPANHA]], [[35_03_NORMAL_MAP_E_LUZ_DO_JOGADOR]]
- [[delivered/23_01_POSTFX_GPU_SHADERS]], [[delivered/23_03_LIGHT2D_DYNAMIC_LIGHTING]], [[delivered/17_POLIMENTO_GRAFICO_CALIBRACAO_SISTEMAS_EXISTENTES]]
- Phaser 4.2.1: `components/Lighting.js`, `gameobjects/lights/LightsManager.js`, `core/Config.js`

## Registro de Mudanças

| Data | O que mudou | Autor |
|------|-------------|-------|
| 2026-10-07 | Criação (achados A1–A5, A11) com evidência de execução | Claude |
| 2026-10-07 | Correção: 5 (não 4) testes com mock `isWebGL`; varredura de outras APIs Phaser 3 (nenhuma); efeito cascata em `LightingPolish` | Claude |
