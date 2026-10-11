# Glow e pós-processamento calibrados e validados

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Classe:** C
**Depende de:** ADR 0013
**Estado vs código:** verificado em 2026-10-11 (leitura estática; `node_modules` ausente, nada executado): parcial. `LightingPolish.applyBloomFilter` (`src/game/systems/LightingPolish.ts`) chama `enableFilters()` uma vez por sprite, limpa o Glow anterior, remove no evento `destroy` e em `cleanup()`, com `MAX_ACTIVE_BLOOM_TARGETS = 16` e Glow desligado por `postProcessingEnabled === false` ou `lowPerformanceParticles`. `PostFXSystem.createFilters` usa `camera.filters.external` (com `internal` como alternativa) e guarda `activeFloorDepth`; `PostFXSystem.test.ts` cobre callbacks tardios de `effectCriticalDamage` e `effectInfection`. Faltam: validar `filters.external` no Phaser 4.2.1, Glow em WebGL real, remoção do Glow ao reciclar sem destruir, medo/level-up/boss sem estado residual e calibração dos valores.
**Origem:** dividida da spec feature-polimento-grafico-calibracao (2026-10-11)

## Contexto
Frentes A e B do polimento gráfico: Glow por objeto (`LightingPolish`) e pós-processamento de câmera (`PostFXSystem`: vignette, ColorMatrix, displacement, tint). Princípio: calibrar o que existe, sem sistema novo. Satélites: [iluminação e efeitos](../../gameplay/lighting-and-effects.md), [sistemas de mundo](../../architecture/world-systems.md). Bug relacionado (citar, não duplicar): [bug-grafico-iluminacao-e-efeitos-sem-consumidor](bug-grafico-iluminacao-e-efeitos-sem-consumidor.md). Independente das outras filhas; baseline e comparação antes/depois ficam em [feature-grafico-validacao-e-lifecycle](feature-grafico-validacao-e-lifecycle.md).

Problemas: Glow ainda não confirmado em runtime; escopo dos filtros de câmera não validado contra o Phaser 4.2.1 (implementação e mocks evoluem juntos); gradação de bioma após tint temporário; efeitos temporários (dano, medo, level-up, boss, baixa vida) podem competir.

## Objetivo
Garantir Glow aplicado e removido corretamente e vignette, ColorMatrix, displacement e tint como composição previsível, mantendo as APIs públicas do `PostFXSystem` e o limite de 16 alvos.

## Decisões de que depende
| ADR | Assunto | Status |
|---|---|---|
| [0013](../../decisions/0013-metas-de-performance.md) | Metas de performance (FPS, memória, draw calls) | Proposta |

## Fatos técnicos verificados
| Afirmação | Fonte | Verificado em |
|---|---|---|
| `applyBloomFilter` chama `enableFilters()` só se `sprite.filters` não existe, limpa o Glow anterior, adiciona o alvo a `bloomTargets` e remove no evento `destroy` | `src/game/systems/LightingPolish.ts` (linhas 76-107) | 2026-10-11 |
| `cleanup()` limpa o filtro de cada alvo, esvazia `bloomTargets` e remove as luzes de Glow | `src/game/systems/LightingPolish.ts` (linhas 543-562) | 2026-10-11 |
| `PostFXSystem` usa `filters.external \|\| filters.internal` e guarda `activeFloorDepth` (padrão de `applyBiomeMatrix`) | `src/game/systems/PostFXSystem.ts` (linhas 42, 69-70, 147) | 2026-10-11 |
| Filtros: `enableFilters()` é no-op sem `gl` (só WebGL, marcado `@webglOnly`); `filters` é `null` até habilitar e então retorna `{ internal, external }` (FilterList); FilterList tem `addGlow`, `addPixelate(amount)`, `addBlocky(config)`, `addVignette`, `addColorMatrix`, `addNormalTools`, entre outros; `Pixelate.js` e `Blocky.js` existem em `src/filters` | `node_modules/phaser/src/gameobjects/components/Filters.js` (linhas 75-95, 237-241), `components/FilterList.js`, `src/filters/`, Phaser 4.2.1 | 2026-10-11 |
| Fallback Canvas: `src/renderer/canvas` existe e `CreateRenderer.js` pode resultar em CANVAS; `enableFilters()` não faz nada sem `gl`. Comportamento do jogo sem WebGL segue não verificado além disso | `node_modules/phaser/src/core/CreateRenderer.js`, `components/Filters.js`, Phaser 4.2.1 | 2026-10-11 |
| `phaser` declarado como `^4.2.1`; instalado 4.2.1 | `package.json`, `node_modules/phaser/package.json` | 2026-10-11 |
| Filtros em 4.x se aplicam a qualquer game object ou câmera; lista `internal` (só o objeto) e `external` (contexto de render, geralmente a tela); objeto sem bounds usa o espaço externo | https://github.com/phaserjs/phaser/blob/master/changelog/v4/4.0/CHANGELOG-v4.0.0.md | 2026-10-11 |
| Glow existe em 4.x (changelog cita `Glow` com `knockout`); Bloom vem por `Phaser.Actions.AddEffectBloom()` (conjunto de filtros); Vignette existe (borda com cor configurável); Pixelate não consta, há `Blocky` (cor única por bloco) | https://github.com/phaserjs/phaser/blob/master/changelog/v4/4.0/CHANGELOG-v4.0.0.md | 2026-10-11 |
| Filtros são destruídos com o dono, salvo `ignoreDestroy`; existe `GameObject#isDestroyed`; luzes: changelog não cobre destroy | https://github.com/phaserjs/phaser/blob/master/changelog/v4/4.0/CHANGELOG-v4.0.0.md | 2026-10-11 |

## Decisões a confirmar
| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| 1 | Escopo fechado: calibrar sem nova abstração, sistema, asset ou aumento de limites (16 alvos de Glow) | A) fechado; B) permitir abstração pontual | A: nova abstração exige spec própria aprovada |
| 2 | Valores-alvo de Glow e pós-processamento | A) definir antes; B) após o baseline por bioma, com screenshots | B: sem baseline não há como julgar "melhor" |
| 3 | Objetivos visuais (Escopo) como critério de aceite humano | A) aceitar; B) reescrever | A, validados com as cenas da spec de validação |

## Escopo
- Confirmar contra o Phaser 4.2.1 instalado a coleção de filtros de tela cheia (`external` ou `internal`) e alinhar implementação e mocks de `PostFXSystem.test.ts`.
- Confirmar em WebGL real o Glow (item, magia, monstro forte, portal) e remover o Glow de sprite de pool devolvido sem `destroy`.
- Manter `ScreenEffects` como fallback sem WebGL/filtros; não aplicar Glow em objetos que hoje não são candidatos.
- `reset()` do `PostFXSystem` preserva a gradação do bioma; medo, dano crítico, level-up e boss em sequência não deixam tint ou displacement presos (hoje coberto só para dano crítico e infecção).
- Calibrar valores existentes: Glow por raridade, vignette, ColorMatrix, displacement, tint, CRT e baixa vida (valores: decisão 2).
- Objetivos visuais: itens comuns discretos; raro/épico/lendário com separação clara sem pulsação agressiva; Glow de chefe reforça silhueta sem apagar detalhes; Glow de projétil breve, sem rastro; raio do Glow dentro da área útil do objeto; vignette reforça bordas só quando necessário; ColorMatrix sem esmagar contraste nem saturar vermelhos; displacement curto; CRT sutil, sem duplicar vignette; baixa vida perceptível sem competir com dano e boss impact; tint volta à matriz do bioma.

## Fora de escopo
Novos sistemas ou efeitos com API pública nova; novas luzes; aumento de 16 alvos de Glow; reescrita do renderer; mudança de projeção ou câmera; fallback Canvas do pós-processamento (questão 4).

## Arquivos e contratos
**Alterar:** `src/game/systems/{LightingPolish,PostFXSystem}.ts` e `LightingPolish.test.ts`, `PostFXSystem.test.ts`; `GameScene.ts` só se a ordem de atualização exigir (ver `docs/engineering/risky-files.md`). **Atualizar no mesmo commit:** `docs/gameplay/lighting-and-effects.md` e `Verificado em`.
**Não tocar:** APIs públicas `setEnabled`, `reset`, `setBiome`, `setVignette`, `setDisplacement`, `setTint`; `MAX_ACTIVE_BLOOM_TARGETS = 16`; nenhum asset novo.
**Glow por raridade (cor / intensidade atuais, preservar até calibrar):** common 0x94a3b8 / 0,35; rare 0x3b82f6 / 0,65; epic 0xa855f7 / 0,85; legendary 0xf59e0b / 1,1; portal 0x06b6d4 / 0,95.

## Critérios de aceite
Todos provisórios (aprovação e decisão 2 pendentes).
- **GL-1** Onde o renderer é WebGL, quando o LightingPolish aplica Glow a item raro, magia, monstro de tier alto ou portal, o Glow deve ser visível na renderização (provisório).
- **GL-2** Quando um sprite de pool com Glow é devolvido sem `destroy`, o LightingPolish deve remover o filtro e liberar o alvo de `bloomTargets` (provisório).
- **GL-3** Se `postProcessingEnabled` é `false`, então o LightingPolish não deve aplicar Glow (provisório).
- **GL-4** Se o renderer não expõe filtros, então o LightingPolish deve manter o jogo renderizando sem exceção (provisório).
- **GL-5** O PostFXSystem deve criar vignette, ColorMatrix e displacement na coleção de filtros que o Phaser 4.2.1 aplica à tela cheia (provisório).
- **GL-6** O PostFXSystem.test.ts deve usar mocks com a forma da API do Phaser 4.2.1 (provisório).
- **GL-7** Quando medo, dano crítico e level-up são acionados em sequência, o PostFXSystem deve terminar sem tint nem displacement ativos após as durações (provisório).
- **GL-8** Quando um tint temporário expira, o PostFXSystem deve restaurar a ColorMatrix do bioma com o `floorDepth` ativo (provisório).
- **GL-9** Se os filtros estão indisponíveis, então o PostFXSystem deve ignorar as chamadas sem lançar exceção (provisório).

## Plano de verificação
| Critério | Como verificar |
|---|---|
| GL-1 | Manual no preview WebGL: item raro, magia, elite, portal. Não validado: precisa de playtest humano |
| GL-2, GL-3, GL-4 | Teste novo em `LightingPolish.test.ts` (devolução ao pool, setting desligada, renderer sem `enableFilters`) |
| GL-5, GL-6 | Conferir a API no `phaser` instalado (`pnpm install`, leitura dos tipos), ajustar `PostFXSystem.test.ts`; `pnpm run typecheck` |
| GL-7, GL-8, GL-9 | `PostFXSystem.test.ts` com fake timers: sequência medo, crítico, level-up; `floorDepth` após expirar |
| Calibração visual | Tabela antes/depois revisada pelo responsável. Não validado: precisa de playtest humano |

## Questões em aberto
1. Valores calibrados de Glow, vignette, ColorMatrix, displacement, tint e CRT: "a definir" após o baseline.
2. `filters.external` existe no Phaser 4.2.1 instalado (ver Fatos técnicos verificados); falta decidir qual coleção usar em cada efeito.
3. O Glow aparece em WebGL real? Não verificado.
4. O fallback Canvas do pós-processamento depende da integração do fallback em `ScreenEffects.render`; fora desta spec até ser decidido.
5. Metas de performance do Glow (depende do ADR 0013).
- Não validado: precisa de playtest humano. O Glow aparece em WebGL real? O jogo sem WebGL (renderer Canvas, filtros inativos) mantém visual aceitável? Só se verifica rodando o jogo (achado de 2026-10-11).

## Pendências para promover a backlog
- Aprovação do responsável e decisões 1 a 3.
- Questões 1 a 5; fatos das questões 2 e 3 verificados com `pnpm install` e execução em WebGL.
- ADR 0013 aprovado (ou meta de performance definida).

## Referências
- [Iluminação e efeitos](../../gameplay/lighting-and-effects.md), [sistemas de mundo](../../architecture/world-systems.md)
- [bug-grafico-iluminacao-e-efeitos-sem-consumidor](bug-grafico-iluminacao-e-efeitos-sem-consumidor.md)
- [ADR 0013](../../decisions/0013-metas-de-performance.md); skill `phaser-4-fx-filters`
