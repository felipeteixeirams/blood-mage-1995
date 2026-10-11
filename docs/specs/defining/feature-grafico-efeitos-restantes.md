# Efeitos gráficos restantes (Eixo A)

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Estado vs código:** verificado em 2026-10-11 (leitura estática): o Eixo A está em boa parte implementado (`PostFXSystem` com Vignette, ColorMatrix por bioma e Displacement; Glow por objeto em `LightingPolish.ts` e `Enemy.ts`; `LightingSystem` com luz do jogador, tochas e cor ambiente por andar; `generateNormalMap` com normal maps de 11 inimigos, tiles e props; flags `postProcessingEnabled` e `lowPerformanceParticles`; `PerformanceMonitor` via `?perf`). Faltam: Pixelate, bloom por evento, `setLighting(true)` além de `Enemy.ts`, self-shadow, `maxLights`, normal map do jogador, controle de UI para `postProcessingEnabled`, fallback funcional sem WebGL (`ScreenEffects.render` nunca é chamado) e medição de 60 FPS. Phaser `^4.2.1`, Vite `^7.3.2`.
**Origem:** dividida de `discovery-grafico-evolucao-pendente` (removida em 2026-10-11), que consolidou a pasta discovery-evolucao-grafica-avancada (5 partes, removida). O mixer dinâmico de áudio ficou em [feature-audio-mixer-dinamico](feature-audio-mixer-dinamico.md).

## Contexto
Hipótese: com Phaser 4.2.1 e WebGL, filtros de pós-processamento e Light2D com normal maps procedurais elevam o visual sem centenas de sprites externos e sem custar FPS em mobile. A base existe (ver Estado vs código); esta spec cobre só o restante do Eixo A (gráficos procedurais). Eixo B (pipeline de assets externos) e o resto do C (áudio físico, trilha composta) pertencem a [discovery-assets-externos-e-sprites](feature-assets-carga-atlas-e-normal-maps.md) e [discovery-ui-e-assets-externos](discovery-assets-direcao-artistica-e-escopo-visual.md). Calibração dos valores existentes: [feature-grafico-calibracao-visual-por-bioma](feature-grafico-calibracao-visual-por-bioma.md) e [feature-grafico-glow-e-pos-processamento-calibrados](feature-grafico-glow-e-pos-processamento-calibrados.md). Satélites: [iluminação e efeitos](../../gameplay/lighting-and-effects.md), [desempenho](../../engineering/performance.md).

## Objetivo
Se aprovada, entregar sobre a base atual: Pixelate, bloom por evento, Light2D em mais objetos, self-shadow, limite de luzes, normal map do jogador, toggle de qualidade, fallback sem WebGL e medição de FPS.

## Decisões de que depende
| ADR | Assunto | Status |
|---|---|---|
| [0005](../../decisions/0005-iluminacao-escuridao-e-vinheta.md) | Light2D como único mecanismo de escuridão e vinheta; destino do overlay morto e do fallback sem WebGL | Proposta |
| [0013](../../decisions/0013-metas-de-performance.md) | Meta de FPS (60 em "dispositivo médio") e bundle | Proposta |

## Fatos técnicos verificados
| Afirmação | Fonte | Verificado em |
|---|---|---|
| Vignette, ColorMatrix e Displacement via `camera.filters`, só com WebGL | `src/game/systems/PostFXSystem.ts` | 2026-10-11 |
| Não há Pixelate nem Bloom nativo; o "bloom" é Glow por sprite (`MAX_ACTIVE_BLOOM_TARGETS` = 16) | `src/game/systems/LightingPolish.ts` | 2026-10-11 |
| `setLighting(true)` só é chamado em `Enemy.ts`; nenhum `setSelfShadow`, `selfShadow`, `maxLights` nem Pixelate em `src/` | busca em `src/` | 2026-10-11 |
| `postProcessingEnabled` existe em `settings` (`src/types/game.ts`, default em `src/utils/localStorage.ts`), lido por GameScene, PostFXSystem e LightingPolish, sem controle na UI | busca em `src/` | 2026-10-11 |
| Normal map não existe para o jogador (`spr_bloodmage` é arte física) | `src/utils/textureGenerator.ts` | 2026-10-11 |
| `ScreenEffects.render` nunca é chamado | `docs/gameplay/lighting-and-effects.md` | 2026-10-11 |
| Filtros em 4.x se aplicam a qualquer game object ou câmera; lista `internal` (só o objeto) e `external` (contexto de render, geralmente a tela); objeto sem bounds usa o espaço externo | https://github.com/phaserjs/phaser/blob/master/changelog/v4/4.0/CHANGELOG-v4.0.0.md | 2026-10-11 |
| `LightsManager.maxLights` inicia em -1 e é lido de `render.maxLights` do game config no primeiro `enable()`; padrão do config = 10; não muda em runtime | `node_modules/phaser/src/core/Config.js` (linha 481), `src/gameobjects/lights/LightsManager.js` (linhas 83-90, 159-163), Phaser 4.2.1 | 2026-10-11 |
| Self-shadow: config `render.selfShadow` (padrão `false`); por objeto `setSelfShadow(enabled, penumbra, diffuseFlatThreshold)` e propriedade `selfShadow` (`enabled: null` usa o padrão do config); `setLighting(enable)` existe no componente `Lighting` (Sprite, Image, Text, Graphics, Shape, ParticleEmitter, TilemapLayerBase, TileSprite e outros) | `node_modules/phaser/src/gameobjects/components/Lighting.js`, `src/core/Config.js` (linha 387), Phaser 4.2.1 | 2026-10-11 |
| Filtros: `enableFilters()` é no-op sem `gl` (só WebGL, marcado `@webglOnly`); `filters` é `null` até habilitar e então retorna `{ internal, external }` (FilterList); FilterList tem `addGlow`, `addPixelate(amount)`, `addBlocky(config)`, `addVignette`, `addColorMatrix`, `addNormalTools`, entre outros; `Pixelate.js` e `Blocky.js` existem em `src/filters` | `node_modules/phaser/src/gameobjects/components/Filters.js` (linhas 75-95, 237-241), `components/FilterList.js`, `src/filters/`, Phaser 4.2.1 | 2026-10-11 |
| Normal map: não há `setNormalMap`; o mapa entra como `dataSource` (imagem/canvas) em `textures.addImage(key, source, dataSource)`, `addSpriteSheet(key, source, config, dataSource)` e `addAtlas(..., dataSource)` (este aceita array); `Texture#setDataSource(data, startIndex, renew)` aceita um ou vários (um por TextureSource); `NormalTools` é filtro à parte | `node_modules/phaser/src/textures/TextureManager.js` (linhas 479-495, 787, 1119-1143), `Texture.js` (linha 562), Phaser 4.2.1 | 2026-10-11 |
| Fallback Canvas: `src/renderer/canvas` existe e `CreateRenderer.js` pode resultar em CANVAS; `enableFilters()` não faz nada sem `gl`. Comportamento do jogo sem WebGL segue não verificado além disso | `node_modules/phaser/src/core/CreateRenderer.js`, `components/Filters.js`, Phaser 4.2.1 | 2026-10-11 |

## Decisões a confirmar
| # | Decisão (ID antigo) | Opções | Recomendação |
|---|---|---|---|
| 1 | Priorização dos eixos (1) | A) Eixo A primeiro; B) B ou C antes | A: valida o teto procedural antes de gastar em arte externa |
| 2 | Estender filtros postFX e Light2D com normal maps procedurais (2) | A) estender; B) manter | A, mantendo o toggle de qualidade |
| 3 | Gatilho dos Eixos B e C (3) | A) só com orçamento de arte e áudio aprovados; B) preparar infraestrutura antes | A para arte; B só para a infraestrutura de AES |
| 4 | Fallback sem WebGL (4) | A) remover `ScreenEffects` ou religá-lo; B) manter morto | Decidir junto ao ADR 0005 (mesmo assunto) |
| 5 | Pixelate (5) | A) usar nos limites de cena; B) não usar | B até haver playtest: pode brigar com `pixelArt: true` |
| 6 | Bloom por evento, crítico e execução (6) | A) Glow existente; B) filtro novo | A: o Phaser 4 não tem `addBloom` nativo |
| 7 | Self-shadow (7) | A) adotar; B) manter `ShadowSystem` (elipse) | B até medir custo de FPS |

## Escopo
Só o que falta:
1. **Pixelate** nos limites de cena (decisão 5).
2. **Bloom por evento** (crítico, execução) reaproveitando o Glow de `LightingPolish`, ativo só durante o evento (decisão 6).
3. **Light2D em mais objetos:** `setLighting(true)` no jogador, nos tiles e nas partículas, mantendo `ambientColor` por bioma; luzes de tocha com `z` explícito; raio da luz do jogador variando com o HP (reaproveitar `WorldManager.updateLighting`).
4. **Normal map procedural do jogador**, por derivada da spritesheet física ou ajuste manual (Laigter).
5. **Self-shadow** por objeto ou por `render.selfShadow` (decisão 7).
6. **`maxLights`** na configuração do jogo e raios curtos; medir com `PerformanceMonitor`.
7. **Toggle de qualidade** nas Configurações (`postProcessingEnabled`).
8. **Fallback sem WebGL:** conforme o ADR 0005.
9. **Medição de 60 FPS** em celular com `?perf`.

## Fora de escopo
Arte externa, atlas e carga por cena (Eixo B, AES); áudio físico e trilha composta ([UIA parte 3](feature-audio-fisico-hibrido.md)); mixer dinâmico de áudio ([feature-audio-mixer-dinamico](feature-audio-mixer-dinamico.md)); mudar combate ou balance; planejar fases e datas.

## Arquivos e contratos
- **Alterar:** `src/game/systems/{PostFXSystem,LightingSystem,LightingPolish}.ts`, `src/game/objects/Player.ts`, `src/utils/textureGenerator.ts`, `src/game/PhaserGame.tsx` (e outras instâncias de `Phaser.Game` se `maxLights` for global), `src/game/scenes/SettingsScene.ts`.
- **Atualizar no mesmo commit:** `docs/gameplay/lighting-and-effects.md`, `docs/engineering/performance.md` e `Verificado em`.
- **Não tocar sem ler `docs/engineering/risky-files.md`:** `GameScene.ts`, `Player.ts`, `Enemy.ts`; extrair lógica nova para `src/game/systems/`.
- **Contratos:** com `postProcessingEnabled` falso ou sem WebGL, nenhum filtro nem luz é criado e o jogo segue jogável; sem criar objetos no `update` (pooling); limpar luzes, tweens e filtros em `shutdown`/`destroy`. Valores (`maxLights`, raios, intensidades): em aberto.

## Critérios de aceite
Todos provisórios e dependentes de decisão de produto. Prefixo `EFR` (ID antigo `GEP` entre parênteses, com o `EGA` da origem anterior).
- **EFR-1** (GEP-1, EGA-1) Quando um crítico ou execução ocorre e `postProcessingEnabled` é verdadeiro, o LightingPolish deve ativar o bloom apenas durante o evento (provisório).
- **EFR-2** (GEP-2, EGA-2) Quando a cena entra em um limite de cena e o Pixelate foi aprovado, o PostFXSystem deve aplicar o filtro Pixelate (provisório; decisão 5).
- **EFR-3** (GEP-3, EGA-3) Enquanto o renderer é WebGL e `postProcessingEnabled` é verdadeiro, o LightingSystem deve iluminar o jogador, os tiles e as partículas por Light2D (provisório).
- **EFR-4** (GEP-4, EGA-4) Enquanto `postProcessingEnabled` é falso, o LightingSystem não deve criar luzes nem aplicar `setLighting` (provisório).
- **EFR-5** (GEP-5, EGA-5) Se o renderer não é WebGL, então o PostFXSystem e o LightingSystem devem permanecer inativos sem lançar erro (provisório).
- **EFR-6** (GEP-6, EGA-6) O LightingSystem não deve manter mais luzes ativas que o `maxLights` configurado (provisório; valor em aberto).
- **EFR-7** (GEP-7, EGA-7) O gerador de texturas deve registrar um normal map para a spritesheet do jogador (provisório).
- **EFR-8** (GEP-8, EGA-8) Se a spritesheet do jogador cai no fallback procedural, então o jogador deve continuar visível sob a mesma chave com ou sem normal map (provisório).
- **EFR-9** (GEP-9, EGA-9) Onde o self-shadow foi aprovado, o renderizador deve ativar `selfShadow` em jogador e inimigos (provisório; decisão 7).
- **EFR-10** (GEP-10, EGA-10) Quando o jogador altera o toggle de qualidade nas Configurações, o SettingsScene deve gravar `postProcessingEnabled` (provisório).
- **EFR-11** (GEP-11, EGA-11) Quando a cena é destruída, o LightingSystem e o PostFXSystem devem remover suas luzes e filtros (provisório).

## Plano de verificação
| Critério | Como verificar |
|---|---|
| EFR-1, EFR-2 | Estender `LightingPolish.test.ts` e `PostFXSystem.test.ts` |
| EFR-3, EFR-4, EFR-6, EFR-11 | Estender `LightingSystem.test.ts` (cena simulada) |
| EFR-5 | Teste unitário com renderer Canvas simulado |
| EFR-7, EFR-8 | Estender `src/utils/textureGenerator.test.ts` |
| EFR-9 | Manual com `?perf` (não validado) |
| EFR-10 | Teste da cena de Configurações; manual |
| 60 FPS e aparência | Não validado: precisa de playtest humano em celular (`?perf`) |

## Questões em aberto
- Valores de `maxLights`, raios e intensidades; definição de "dispositivo médio" para o gate de 60 FPS (ADR 0013).
- Destino do fallback sem WebGL e do overlay de escuridão (ADR 0005).
- Pixelate e self-shadow: custo e aparência não medidos.
- `setLighting` em tiles e partículas: o componente `Lighting` está em `ParticleEmitter` e `TilemapLayerBase` no Phaser 4.2.1 instalado (ver Fatos); custo e resultado visual não verificados (só `Enemy.ts` o usa hoje).
- Normal map do jogador: por derivada ou arte manual.
- Estimativas de esforço do original não verificadas (filtros 2 a 3 dias; Light2D e normal maps 3 a 5 dias, com risco de FPS em mobile; normal maps no `textureGenerator` 1 a 2 dias).
- Não validado: precisa de playtest humano. Custo e aparência de Pixelate (existe `addPixelate`), self-shadow e `setLighting` em tiles e partículas; comportamento real sem WebGL (achado de 2026-10-11).

## Pendências para promover a backlog
- Discovery: depende de decisão de produto; sem aprovação do responsável.
- Aprovar as decisões 1 a 7 e os ADRs 0005 e 0013.
- Fechar as questões em aberto e verificar suporte a `setLighting`, Pixelate e `selfShadow` no Phaser instalado.
- Subdividir se necessário: Light2D e normal map do jogador, filtros (Pixelate e bloom), fallback sem WebGL e toggle de qualidade são assuntos separáveis (a spec ainda reúne o Eixo A restante).

## Riscos (propostos)
| Risco | Impacto | Mitigação |
|---|---|---|
| Light2D custa FPS em mobile | Alto | `maxLights` baixo, raios curtos, toggle de performance, medir com `PerformanceMonitor` |
| Filtros WebGL não existem em Canvas | Médio | Fallback do ADR 0005; detecção por `isWebGL` (já feita) |
| Normal maps procedurais ficam "falsos" | Médio | Derivada do sprite e ajuste manual (Laigter) |

## Referências
- [Iluminação e efeitos](../../gameplay/lighting-and-effects.md), [desempenho](../../engineering/performance.md), [métricas](../../engineering/performance-metrics.md)
- [ADR 0005](../../decisions/0005-iluminacao-escuridao-e-vinheta.md), [ADR 0013](../../decisions/0013-metas-de-performance.md)
- [AES](feature-assets-carga-atlas-e-normal-maps.md), [UIA](discovery-assets-direcao-artistica-e-escopo-visual.md)
