# Calibração visual por bioma: luz, atmosfera e partículas

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Estado vs código:** verificado em 2026-10-11 (leitura estática; nada executado): existem `LightingSystem.ts` (luz do jogador com redução por HP, tochas, braseiros, cascata por `floorDepth`), `LightingPolish.ts` (Glow), `AtmosphereSystem` (ground fog depth 750, upper haze 1995, clima 1996), `ShadowSystem` (`footY = y + altura * 0.38`, depth 8), `ReflectionSystem` (depth 12, `setFrame(entity.frame.name)`; teste com só 2 casos), `AdvancedParticles` (nove emissores, lê `lowPerformanceParticles`, `emitDirectional` restaura a rotação), `AtmosphericTreeShader` e `TerrainDetailFactory`, todos com testes. Faltam: calibrar valores por bioma; testes de contagem de luzes, raio mínimo, fases do flicker, zona líquida, frame sincronizado, transição de bioma, limpeza por entidade/zona, emissores após `stopAll` (a verificar) e ausência de `Graphics`/texturas após o bake.
**Origem:** consolidada de feature-iluminacao-calibrada, feature-atmosfera-sombras-reflexos-calibrados e feature-particulas-shader-e-terreno-calibrados (2026-10-11); estas, por sua vez, divididas de feature-polimento-grafico-calibracao.

## Contexto
Frentes C, D, E, F, G e H do polimento gráfico. São subjetivas, dependem do mesmo baseline por bioma e do mesmo playtest humano, por isso numa spec só. A cascata ambiente, as luzes pontuais, o Glow e a ColorMatrix podem somar energia visual e lavar terreno e silhuetas; a atmosfera deve ficar subordinada ao gameplay (inimigos, projéteis, telégrafos, itens, jogador); sombras e reflexos são sensíveis a offsets (pés, profundidade, escala, alpha, rotação); os emissores têm velocidade, gravidade, escala, alpha e lifespan distintos, e o trabalho é harmonizar, não criar famílias novas. Padrão a manter: `bake once, render many`. O ADR 0005 registra que o `darknessOverlay` é limpo todo frame em `updateThreatIndicator()`; o alvo da calibração de luz depende dessa decisão.
Satélites: [iluminação e efeitos](../../gameplay/lighting-and-effects.md), [sistemas de mundo](../../architecture/world-systems.md); bug relacionado: [bug-grafico-iluminacao-e-efeitos-sem-consumidor](bug-grafico-iluminacao-e-efeitos-sem-consumidor.md). Tema próximo, não duplicado: atmosfera e tensao. Calibrar depois de [feature-grafico-glow-e-pos-processamento-calibrados](feature-grafico-glow-e-pos-processamento-calibrados.md) evita retrabalho de contraste; a Fase 0 (baseline), a ordem de profundidade global e a comparação final estão em [feature-grafico-validacao-e-lifecycle](feature-grafico-validacao-e-lifecycle.md). Implementável sem as outras.

## Objetivo
Refinar, só por parâmetros e timing, a iluminação, a atmosfera, as sombras, os reflexos, os emissores, o shader de árvores e as texturas assadas existentes, separando piso, entidades e efeitos sem lavar a imagem nem aumentar o custo por frame.

## Decisões de que depende
| ADR | Assunto | Status |
|---|---|---|
| [0005](../../decisions/0005-iluminacao-escuridao-e-vinheta.md) | Iluminação: escuridão e vinheta no gameplay (alvo da calibração de luz) | Proposta |
| [0013](../../decisions/0013-metas-de-performance.md) | Metas de performance | Proposta |

## Fatos técnicos verificados
| Afirmação | Fonte | Verificado em |
|---|---|---|
| Existem testes de `LightingSystem` e `LightingPolish` | `src/game/systems/*.test.ts` | 2026-10-11 |
| `cleanup()` do `LightingPolish` remove as luzes de Glow | `src/game/systems/LightingPolish.ts` (linhas 543-562) | 2026-10-11 |
| `ShadowSystem` usa `footY = entity.y + entityHeight * 0.38` e `depth 8` | `src/game/systems/ShadowSystem.ts` (linhas 84, 121) | 2026-10-11 |
| `ReflectionSystem` usa `depth 12` e `setFrame(entity.frame.name)` | `src/game/systems/ReflectionSystem.ts` (linhas 62, 117) | 2026-10-11 |
| `AtmosphereSystem`: ground fog `depth 750`, upper haze `1995`, partículas de clima `1996` | `src/game/systems/AtmosphereSystem.ts` (linhas 113, 121, 175) | 2026-10-11 |
| Existem testes dos três sistemas de atmosfera/sombra/reflexo; o de `ReflectionSystem` tem 2 casos | `src/game/systems/*.test.ts` | 2026-10-11 |
| `AdvancedParticles` lê `lowPerformanceParticles` do store | `src/game/systems/AdvancedParticles.ts` (linha 101) | 2026-10-11 |
| Existem testes de `AdvancedParticles`, `AtmosphericTreeShader` e `TerrainDetailFactory` | `src/game/systems/*.test.ts`, `src/game/shaders/AtmosphericTreeShader.test.ts` | 2026-10-11 |
| `LightsManager.maxLights` inicia em -1 e é lido de `render.maxLights` do game config no primeiro `enable()`; padrão do config = 10; não muda em runtime | `node_modules/phaser/src/core/Config.js` (linha 481), `src/gameobjects/lights/LightsManager.js` (linhas 83-90, 159-163), Phaser 4.2.1 | 2026-10-11 |
| Self-shadow: config `render.selfShadow` (padrão `false`); por objeto `setSelfShadow(enabled, penumbra, diffuseFlatThreshold)` e propriedade `selfShadow` (`enabled: null` usa o padrão do config); `setLighting(enable)` existe no componente `Lighting` (Sprite, Image, Text, Graphics, Shape, ParticleEmitter, TilemapLayerBase, TileSprite e outros) | `node_modules/phaser/src/gameobjects/components/Lighting.js`, `src/core/Config.js` (linha 387), Phaser 4.2.1 | 2026-10-11 |
| Normal map: não há `setNormalMap`; o mapa entra como `dataSource` (imagem/canvas) em `textures.addImage(key, source, dataSource)`, `addSpriteSheet(key, source, config, dataSource)` e `addAtlas(..., dataSource)` (este aceita array); `Texture#setDataSource(data, startIndex, renew)` aceita um ou vários (um por TextureSource); `NormalTools` é filtro à parte | `node_modules/phaser/src/textures/TextureManager.js` (linhas 479-495, 787, 1119-1143), `Texture.js` (linha 562), Phaser 4.2.1 | 2026-10-11 |
| Glow existe em 4.x (changelog cita `Glow` com `knockout`); Bloom vem por `Phaser.Actions.AddEffectBloom()` (conjunto de filtros); Vignette existe (borda com cor configurável); Pixelate não consta, há `Blocky` (cor única por bloco) | https://github.com/phaserjs/phaser/blob/master/changelog/v4/4.0/CHANGELOG-v4.0.0.md | 2026-10-11 |

## Decisões a confirmar
| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| 1 | Escopo fechado: calibrar sem nova luz, sistema, textura, emissor, abstração ou aumento de limites/densidade | A) fechado; B) abstração/permissão pontual | A: expansão exige spec própria |
| 2 | Valores-alvo (luz, tint/alpha, escala, rotação, offsets, ripple, partículas, vento, AO, paleta) | A) definir antes; B) após baseline por bioma | B: sem baseline não há como julgar |
| 3 | Objetivos visuais (Escopo) como critério de aceite humano | A) aceitar; B) reescrever | A |
| 4 | Ordem frente ao ADR 0005 (escuridão por Light2D, overlay ou ambos) | A) decidir o 0005 antes; B) calibrar só `ambientColor` | A: o valor de `ambientColor` depende da opção |

## Escopo
**Iluminação (C)**
- Calibrar `ambientColor` por bioma; `playerLightRadius` e `playerLightColor` sem alterar a redução por HP; `torchRadius`, `torchColor` e o multiplicador de braseiros; transição suave da cascata com `floorDepth`; flicker sem oscilação mecânica nem mudança abrupta de raio.
- Manter o fallback sem WebGL ou com pós-processamento desligado; objetos com Light2D recebem o pipeline sem tentativa repetida; limpar luzes na troca de andar e no shutdown.
- Composição: ambiente define clima sem substituir a leitura dos objetos; luz do jogador apoia navegação sem apagar sombras; tochas com legibilidade local maior que o ambiente; braseiros com maior raio sem manchas estouradas; luz de impacto crítico breve, sem alterar o ambiente persistente.

**Atmosfera (D)**
- Manter os limites de opacidade do sistema como teto; ajustar tint e alpha por bioma com as configurações existentes.
- Movimento das duas camadas sem parecerem texturas independentes deslizando; transições de bioma sem mudança instantânea.
- Manter redução de atmosfera em combate intenso e chefe (existência hoje: questão 4), emissor de clima alinhado à câmera, redução em baixa performance e ausência de clima onde não deve aparecer.

**Sombras (E)**
- Calibrar `footY` por escala e altura real; offset sob os pés, não sob o centro; escala para entidades pequenas, grandes e chefes (questão 5).
- Rotação projetada sem ângulos exagerados; alpha de contato e sob luz sem virar mancha preta; manter sombra de contato sem fonte influente e a textura/fallback existentes.
- Ocultar, destruir e registrar sombras conforme o lifecycle da entidade; não atualizar entidades inativas.

**Reflexos (F)**
- Calibrar deslocamento a partir dos pés, escala vertical, alpha separado para sangue e água, tint sem apagar a silhueta; ripple senoidal existente com amplitude e frequência discretas.
- Reflexo só na zona líquida; frame e textura sincronizados em objetos animados; limpeza ao remover entidade ou zona; toggle sem reflexos invisíveis consumindo atualização.

**Partículas (G)** (`blood_splatter`, `bone_dust`, `acid_splash`, `spectral_burst`, `critical_hit`, `atmospheric_fog`, `torch_embers`, `forest_pollen`, `spell_trail`)
- Calibrar quantidade por `intensity` sem picos; harmonizar lifespan e fade; escala inicial/final para baixa resolução; velocidade, gravidade e ângulo dos direcionais; separar sangue, poeira, ácido, energia e crítico por alpha e tint dos recursos existentes.
- Manter a ordem de profundidade e a redução em `lowPerformanceParticles`; reutilizar emissores (nunca um por impacto); corrigir emissores vivos após `stopAll`, `stopAmbient` ou troca de cena.

**Shader e terreno (H)**
- Ajustar intensidade e velocidade do vento, fog e iluminação direcional do `AtmosphericTreeShader` sem descolar a árvore do chão; AO aproximada com volume e sem bordas pretas.
- Preservar variação procedural e seeds; ajustar paleta e contraste das texturas assadas; reduzir repetição por escala, rotação e variação existentes; sem criar `Graphics` por frame.

## Fora de escopo
Novas luzes, sistemas de sombra/reflexo/atmosfera, emissores, texturas ou famílias de assets; normal maps novos; novo sistema de materiais; fog volumétrico 3D; Three.js; mudança de projeção, câmera ou da arquitetura de geração; aumento de limites ou de densidade como solução primária; decidir o ADR 0005.

## Arquivos e contratos
**Alterar:** `src/game/systems/{LightingSystem,LightingPolish,AtmosphereSystem,ShadowSystem,ReflectionSystem,AdvancedParticles,TerrainDetailFactory}.ts`, `src/game/shaders/AtmosphericTreeShader.ts` e os `*.test.ts` correspondentes. **Atualizar no mesmo commit:** `docs/gameplay/lighting-and-effects.md` e `Verificado em`. **Não tocar:** `MAX_ACTIVE_BLOOM_TARGETS = 16`; regra de redução de luz por HP; textura de sombra; profundidades (sombra 8, reflexo 12, fog 750, haze 1995, clima 1996); emissores e texturas existentes; seeds; nenhum asset novo. Valores calibrados novos: "a definir" (questão 1).

## Critérios de aceite
Todos provisórios.
- **GCB-1** (IL-1) Quando o andar muda ou a cena reinicia, o LightingSystem deve manter a mesma quantidade de luzes de uma sessão limpa (provisório).
- **GCB-2** (IL-2) Enquanto o HP do jogador está baixo, o LightingSystem deve manter o raio da luz do jogador maior que zero (provisório).
- **GCB-3** (IL-3) Enquanto duas tochas estão ativas, o LightingSystem deve aplicar flicker com fases diferentes entre elas (provisório).
- **GCB-4** (AM-1) O AtmosphereSystem deve manter a opacidade de ground fog e upper haze dentro dos limites definidos no sistema (provisório).
- **GCB-5** (AM-2) Quando o bioma muda, o AtmosphereSystem deve interpolar tint e alpha, sem atribuir o valor final em um único frame (provisório).
- **GCB-6** (AM-3) Quando a atmosfera é destruída ao trocar de bioma ou mapa, o AtmosphereSystem não deve deixar emissor nem tween ativo (provisório).
- **GCB-7** (AM-4) Enquanto a entidade se move ou muda de escala, o ShadowSystem deve manter a sombra ancorada em `footY` (provisório).
- **GCB-8** (AM-5) Se não há luz influente, então o ShadowSystem deve manter a sombra de contato sem rotação (provisório).
- **GCB-9** (AM-6) O ReflectionSystem deve exibir o reflexo somente enquanto a entidade está dentro da zona líquida (provisório).
- **GCB-10** (AM-7) Quando o frame do objeto original muda, o ReflectionSystem deve aplicar o mesmo frame ao reflexo (provisório).
- **GCB-11** (AM-8) Quando a entidade é destruída, o ShadowSystem e o ReflectionSystem não devem deixar sprite de sombra nem de reflexo (provisório).
- **GCB-12** (PT-1) Quando a intensidade de `emit` aumenta, o AdvancedParticles não deve emitir menos partículas (provisório).
- **GCB-13** (PT-2) Quando `stopAll` é chamado ou a cena encerra, o AdvancedParticles não deve manter emissor ativo (provisório).
- **GCB-14** (PT-3) Se `lowPerformanceParticles` é `true`, então o AdvancedParticles deve emitir menos partículas que no modo normal (provisório).
- **GCB-15** (PT-4) Durante o gameplay, o AtmosphericTreeShader e o TerrainDetailFactory não devem criar `Graphics` nem texturas depois do bake (provisório).

## Plano de verificação
| Critério | Como verificar |
|---|---|
| GCB-1, GCB-3 | `LightingSystem.test.ts`: contagem de luzes após troca de andar; fases do flicker |
| GCB-2 | `LightingSystem.test.ts` com HP mínimo. Sensação visual: não validado, precisa de playtest humano |
| GCB-4 a GCB-6 | `AtmosphereSystem.test.ts` (limites, tween de transição, `cleanup`) |
| GCB-7, GCB-8, GCB-11 | `ShadowSystem.test.ts` e `ReflectionSystem.test.ts` (âncora, contato, destruição) |
| GCB-9, GCB-10 | Novos casos em `ReflectionSystem.test.ts` (dentro e fora da zona; troca de frame) |
| GCB-12 a GCB-14 | `AdvancedParticles.test.ts` |
| GCB-15 | `TerrainDetailFactory.test.ts` e `AtmosphericTreeShader.test.ts` (contagem de `add.graphics`/`textures.addCanvas` após o bake) |
| Calibração visual | Tabela antes/depois por bioma e cenas 4 a 8 da spec de validação. Não validado: precisa de playtest humano |

## Questões em aberto
1. Valores calibrados (`ambientColor`, raios, cores, flicker, tint/alpha, escala, rotação, offsets, ripple, partículas, vento, AO, paleta): "a definir" após o baseline.
2. Como a escuridão é obtida (ADR 0005): define o alvo da luz.
3. Raio mínimo da luz do jogador com HP baixo e período mínimo do flicker (GCB-2, GCB-3): sem número na spec original.
4. A redução de atmosfera em combate intenso e chefe existe hoje no `AtmosphereSystem`? Não verificado; GCB-4 a GCB-6 cobrem só limites, transição e limpeza.
5. Definição de "entidade pequena, grande e chefe" para sombra e reflexo (alturas de referência).
6. Emissores realmente continuam vivos após `stopAll`/`stopAmbient`/troca de cena? Não verificado; GCB-13 cobre o resultado.
7. Metas de performance (ADR 0013).
8. Quem valida o aceite visual: ver decisões 3 e 4 de [feature-grafico-validacao-e-lifecycle](feature-grafico-validacao-e-lifecycle.md).
- Não validado: precisa de playtest humano. Custo em FPS e aparência de self-shadow e `setLighting` em tiles e partículas; o suporte existe no Phaser 4.2.1, mas o resultado visual e a performance não foram medidos (achado de 2026-10-11).

## Pendências para promover a backlog
- Aprovação do responsável e decisões 1 a 4; ADR 0005 aprovado.
- Questões 1 a 8 respondidas; fatos das questões 4 e 6 verificados.

## Referências
- [Iluminação e efeitos](../../gameplay/lighting-and-effects.md), [sistemas de mundo](../../architecture/world-systems.md)
- [ADR 0005](../../decisions/0005-iluminacao-escuridao-e-vinheta.md), [ADR 0013](../../decisions/0013-metas-de-performance.md)
- [bug-grafico-iluminacao-e-efeitos-sem-consumidor](bug-grafico-iluminacao-e-efeitos-sem-consumidor.md)
- Skills `phaser-4-fx-filters`, `phaser-4-procedural-generation`
