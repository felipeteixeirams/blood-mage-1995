# Polimento gráfico por calibração dos sistemas existentes (parte 8: critérios e pendências)

**Mestre:** [feature-polimento-grafico-calibracao](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Estado vs código:** verificado em 2026-10-11 (leitura estática; `node_modules` ausente, nada executado): parcial. Glow idempotente, `filters.external`/`internal` e `activeFloorDepth` existem; faltam a validação em WebGL real, a remoção do Glow ao reciclar sem destruir, a calibração das Frentes C a H e testes de zona líquida do `ReflectionSystem`. Detalhe na [parte 1](01-visao-e-escopo.md).

Parte 8 de 8. Índice: [README](README.md).

## Critérios de aceite
Todos provisórios: dependem da aprovação do responsável e das decisões 2, 4 e 5 da [parte 1](01-visao-e-escopo.md). Sem valores calibrados: eles vão para "Questões em aberto".

**Frente A — Glow**
- **PG-1** Onde o renderer é WebGL, quando o LightingPolish aplica Glow a item raro, magia, monstro de tier alto ou portal, o Glow deve ser visível na renderização (provisório).
- **PG-2** Quando um sprite de pool com Glow é devolvido sem `destroy`, o LightingPolish deve remover o filtro e liberar o alvo de `bloomTargets` (provisório).
- **PG-3** Se `postProcessingEnabled` é `false`, então o LightingPolish não deve aplicar Glow (provisório).
- **PG-4** Se o renderer não expõe filtros, então o LightingPolish deve manter o jogo renderizando sem exceção (provisório).

**Frente B — Pós-processamento**
- **PG-5** O PostFXSystem deve criar vignette, ColorMatrix e displacement na coleção de filtros que o Phaser 4.2.1 aplica à tela cheia (provisório).
- **PG-6** O PostFXSystem.test.ts deve usar mocks com a forma da API do Phaser 4.2.1 (provisório).
- **PG-7** Quando medo, dano crítico e level-up são acionados em sequência, o PostFXSystem deve terminar sem tint nem displacement ativos após as durações (provisório).
- **PG-8** Quando um tint temporário expira, o PostFXSystem deve restaurar a ColorMatrix do bioma com o `floorDepth` ativo (provisório).
- **PG-9** Se os filtros estão indisponíveis, então o PostFXSystem deve ignorar as chamadas sem lançar exceção (provisório).

**Frente C — Iluminação**
- **PG-10** Quando o andar muda ou a cena reinicia, o LightingSystem deve manter a mesma quantidade de luzes de uma sessão limpa (provisório).
- **PG-11** Enquanto o HP do jogador está baixo, o LightingSystem deve manter o raio da luz do jogador maior que zero (provisório).
- **PG-12** Enquanto duas tochas estão ativas, o LightingSystem deve aplicar flicker com fases diferentes entre elas (provisório).

**Frentes D a F — Atmosfera, sombras e reflexos**
- **PG-13** O AtmosphereSystem deve manter a opacidade de ground fog e upper haze dentro dos limites definidos no sistema (provisório).
- **PG-14** Quando o bioma muda, o AtmosphereSystem deve interpolar tint e alpha, sem atribuir o valor final em um único frame (provisório).
- **PG-15** Quando a atmosfera é destruída ao trocar de bioma ou mapa, o AtmosphereSystem não deve deixar emissor nem tween ativo (provisório).
- **PG-16** Enquanto a entidade se move ou muda de escala, o ShadowSystem deve manter a sombra ancorada em `footY` (provisório).
- **PG-17** Se não há luz influente, então o ShadowSystem deve manter a sombra de contato sem rotação (provisório).
- **PG-18** O ReflectionSystem deve exibir o reflexo somente enquanto a entidade está dentro da zona líquida (provisório).
- **PG-19** Quando o frame do objeto original muda, o ReflectionSystem deve aplicar o mesmo frame ao reflexo (provisório).
- **PG-20** Quando a entidade é destruída, o ShadowSystem e o ReflectionSystem não devem deixar sprite de sombra nem de reflexo (provisório).

**Frentes G a I — Partículas, shader e lifecycle**
- **PG-21** Quando a intensidade de `emit` aumenta, o AdvancedParticles não deve emitir menos partículas (provisório).
- **PG-22** Quando `stopAll` é chamado ou a cena encerra, o AdvancedParticles não deve manter emissor ativo (provisório).
- **PG-23** Se `lowPerformanceParticles` é `true`, então o AdvancedParticles deve emitir menos partículas que no modo normal (provisório).
- **PG-24** Durante o gameplay, o AtmosphericTreeShader e o TerrainDetailFactory não devem criar `Graphics` nem texturas depois do bake (provisório).
- **PG-25** O GameScene deve manter a ordem de profundidade sombra 8, reflexo 12, entidades 20 ou mais, ground fog 750, upper haze 1995 e clima 1996 (provisório).
- **PG-26** Quando uma run reinicia, o GameScene não deve duplicar luzes, sombras, reflexos, emissores nem tweens (provisório).
- **PG-27** Quando a cena encerra, o PostFXSystem não deve executar callbacks atrasados de efeitos temporários (provisório).

**Globais**
- **PG-28** O polimento não deve criar sistema novo nem adicionar asset ao `assetManifest.json` (provisório).
- **PG-29** Se `pnpm run verify` falha, então a entrega não deve ser considerada concluída (provisório).
- **PG-30** Enquanto a cena roda em WebGL, o frame time não deve piorar de forma sustentada em relação ao baseline (provisório; número em aberto).

## Plano de verificação
| Critério | Como verificar |
|---|---|
| PG-1 | Manual no preview WebGL: item raro, magia, elite, portal. Não validado: precisa de playtest humano |
| PG-2, PG-3, PG-4 | Teste novo em `LightingPolish.test.ts` (devolução ao pool, setting desligada, renderer sem `enableFilters`) |
| PG-5, PG-6 | Conferir a API no `phaser` instalado (`pnpm install` e leitura dos tipos) e ajustar `PostFXSystem.test.ts`; `pnpm run typecheck` |
| PG-7, PG-8, PG-9 | `PostFXSystem.test.ts` com fake timers: sequência medo, crítico, level-up; checar `floorDepth` após expirar |
| PG-10, PG-12 | `LightingSystem.test.ts`: contagem de luzes após troca de andar; fases do flicker |
| PG-11 | `LightingSystem.test.ts` com HP mínimo. Sensação visual: não validado, precisa de playtest |
| PG-13, PG-14, PG-15 | `AtmosphereSystem.test.ts` (limites, tween de transição, `cleanup`) |
| PG-16, PG-17, PG-20 | `ShadowSystem.test.ts` e `ReflectionSystem.test.ts` (âncora, contato, destruição) |
| PG-18, PG-19 | Novos casos em `ReflectionSystem.test.ts` (dentro e fora da zona; troca de frame) |
| PG-21, PG-22, PG-23 | `AdvancedParticles.test.ts` |
| PG-24 | `TerrainDetailFactory.test.ts` e `AtmosphericTreeShader.test.ts` (contagem de `add.graphics`/`textures.addCanvas` após o bake) |
| PG-25 | Teste que lê as constantes de profundidade dos sistemas; conferência manual das 10 cenas |
| PG-26, PG-27 | Teste de lifecycle por sistema (shutdown e reinício) e smoke Playwright (`pnpm run e2e`, não validado nesta sessão) |
| PG-28 | Revisão do diff: nenhum arquivo novo em `src/game/systems/`; `assetManifest.json` sem chave nova |
| PG-29 | `pnpm run typecheck`, `pnpm run test`, `pnpm run build`, `pnpm run verify` |
| PG-30 | Comparar frame time antes/depois nas 10 cenas da parte 6. Não validado: precisa de playtest humano |
| Melhoria visual | Tabela antes/depois das 10 cenas (parte 6) revisada pelo responsável. Não validado: precisa de playtest humano |

## Questões em aberto
1. Valores calibrados (raio, alpha, cor, escala, lifespan, quantidade) de cada frente: "a definir" após o baseline da Fase 0.
2. `filters.external` é a coleção correta no Phaser 4.2.1 instalado? Fato não verificado (`node_modules` ausente).
3. O Glow aparece em WebGL real? Não verificado.
4. Metas de performance: FPS mínimo, frame time e limite de objetos Phaser (depende do ADR 0013).
5. Como a escuridão é obtida (ADR 0005), pois define o alvo da Frente C.
6. Raio mínimo da luz do jogador com HP baixo e período mínimo do flicker (PG-11, PG-12): sem número na spec original.
7. A redução de atmosfera em combate intenso e chefe existe hoje no `AtmosphereSystem`? Não verificado; PG-13 a PG-15 cobrem só limites, transição e limpeza.
8. O fallback Canvas do pós-processamento depende de [feature-graficos-avancados-eixo-a.md](../feature-graficos-avancados-eixo-a.md) (`ScreenEffects.render`); fora desta spec até ser decidido.
9. O warning 404 já observado em separado: origem não identificada (baseline da Fase 0).
10. A definição de "entidade pequena, grande e chefe" para calibrar sombra e reflexo (alturas de referência).

## Pendências para promover a backlog
- Aprovação do responsável (cabeçalho) e decisões 1 a 6 da [parte 1](01-visao-e-escopo.md).
- ADRs 0005 e 0013 aprovados.
- Questões 1 a 10 respondidas; fatos 2 e 3 verificados com `pnpm install` e execução em WebGL.
- Dividir em specs menores (uma por frente ou grupo P0 e P1) para caber como unidade implementável; hoje é um épico de 5,5 a 10 dias.
- Confirmar que os testes novos dos critérios cobrem os mocks pela API real.

## Referências
- [Iluminação e efeitos](../../../gameplay/lighting-and-effects.md), [sistemas de mundo](../../../architecture/world-systems.md)
- [ADR 0005](../../../decisions/0005-iluminacao-escuridao-e-vinheta.md), [ADR 0013](../../../decisions/0013-metas-de-performance.md)
- [Eixo A — Gráficos Avançados](../feature-graficos-avancados-eixo-a.md)
- Skills `phaser-4-fx-filters`, `phaser-4-playtest-harness`
