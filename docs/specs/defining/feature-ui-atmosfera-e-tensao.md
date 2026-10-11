# Atmosfera, tensão e indicadores de ameaça

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Estado vs código:** verificado em 2026-10-11 (leitura estática): já existem o indicador de borda (`GameScene.updateThreatIndicator`, `ThreatIndicator.test.ts`), o áudio espacial e o zumbido (`soundEngine.updateSpatialThreat`, `initThreatStatic`, `updateTinnitusState`), a vinheta por perigo (`PostFXSystem.setDangerTension`), a luz do jogador por HP (`LightingSystem.updatePlayerLight`), o chamado de reforços em `flee` (`Enemy.ts`, caso `flee`) e os toggles `tinnitusEnabled`/`fearDistortionEnabled` (`SettingsScene.ts`) e `atmosphereEffectsEnabled` (`GameplayHUD.tsx`). Faltam: alinhar luz e vinheta ao que a proposta descreve (se aprovado) e fazer a vinheta respeitar `atmosphereEffectsEnabled`. Não validado em execução.

## Contexto
Os estados de IA dos inimigos já alimentam feedbacks de tensão (satélites [lighting-and-effects](../../gameplay/lighting-and-effects.md), [audio](../../gameplay/audio.md), [status-and-feedback](../../gameplay/status-and-feedback.md)). Divergências entre a proposta original e o código:

- Luz do jogador: o raio é por bioma (`BIOME_LIGHTING.playerLightRadius`, 140 a 320 px) e encolhe de forma contínua (`0,6 + 0,4 * hpRatio`, `LightingSystem.ts:165`), não só abaixo de 30% de HP; a proposta fala em ~200 px.
- Vinheta: `setDangerTension` (`PostFXSystem.ts:236`) é chamada todo frame em `GameScene.ts:1842`, fora do `if (atmosphereEnabled)`; nenhuma opção a desliga. `atmosphereEffectsEnabled` só gateia indicador e áudio.
- Perigo médio (4 a 10 em combate): pulso de 2000 ms; alto (mais de 10, chefe ou HP <= 25%): 800 ms, ou 1200 ms se HP <= 25%, com tint `#ef4444`.
- `flee` por mais de 5 s chama `emitSound(x, y, 660)` uma vez (`reinforcementsCalled`), e não `onHearNoise()` diretamente.

## Objetivo
O jogador antecipa ameaças fora da tela e sente a intensidade do cerco por indicador, áudio, vinheta e luz, e pode desligar esses efeitos por acessibilidade.

## Decisões de que depende
| ADR | Assunto | Status |
|---|---|---|
| [0005](../../decisions/0005-iluminacao-escuridao-e-vinheta.md) | Escuridão e vinheta no gameplay | Proposta |
| [0006](../../decisions/0006-audio-e-conquistas.md) | Áudio só pelo `soundEngine` | Proposta |

## Fatos técnicos verificados
| Afirmação | Fonte | Verificado em |
|---|---|---|
| Indicador cobre `combat`/`frenzy` (conta em `alertCount`) e `investigating`, só com `atmosphereEffectsEnabled !== false` | `src/game/scenes/GameScene.ts:1734-1760` | 2026-10-11 |
| `setDangerTension` roda mesmo com `atmosphereEffectsEnabled` falso | `src/game/scenes/GameScene.ts:1842` | 2026-10-11 |
| Raio da luz = `playerLightRadius * (0,6 + 0,4 * hpRatio)` | `src/game/systems/LightingSystem.ts:160-169` | 2026-10-11 |
| Reforços: `time >= fleeStartTime + 5000`, uma vez, `emitSound(..., 660)` | `src/game/objects/Enemy.ts:675-683` | 2026-10-11 |
| `atmosphereEffectsEnabled` existe em tipos, padrão `true` e schema Zod | `src/types/game.ts:272`, `src/utils/localStorage.ts:214,242` | 2026-10-11 |
| Só o `GameplayHUD` tem toggle de `atmosphereEffectsEnabled` (a `SettingsScene` não) | `grep` em `src` | 2026-10-11 |

## Decisões a confirmar
| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| 1 | Faixas e frequências da vinheta | A) manter o código (4 a 10 / mais de 10; 2000/1200/800 ms); B) outras faixas | A: já implementado e coerente com a proposta |
| 2 | Raio e encolhimento da luz | A) manter raio por bioma e encolhimento contínuo; B) ~200 px fixo e encolhe só abaixo de 30% de HP | A: B apagaria a identidade por bioma; exige playtest em mais de um bioma |
| 3 | Reforços em `flee` | A) manter `emitSound` raio 660 após 5 s; B) alterar tempo/raio | A: já implementado |
| 4 | Vinheta de perigo respeita `atmosphereEffectsEnabled` | A) sim; B) não, opção própria | A: o tipo já descreve a opção como "indicador + vinheta + áudio" (`types/game.ts:272`) |
| 5 | Toggle de `atmosphereEffectsEnabled` em `SettingsScene` | A) adicionar; B) manter só no `GameplayHUD` | A: acessibilidade deve estar nas configurações |

## Escopo
- Fazer o `GameScene` encerrar a tensão da vinheta (perigo zero) quando `atmosphereEffectsEnabled === false` (decisão 4).
- Adicionar o toggle de `atmosphereEffectsEnabled` em `SettingsScene` (decisão 5), com chave i18n em `ptBR.ts` e `enUS.ts`.
- Ajustar luz, vinheta ou reforços apenas se as decisões 1 a 3 escolherem a opção B.
- Teste unitário da vinheta com a opção desligada.

## Fora de escopo
- Novos indicadores, novos sons, calibração visual de cores (exige teste em mais de um bioma), o tinnitus sem efeito (ver [bug-audio-bgmgain-e-temas](bug-audio-bgmgain-e-temas.md)) e o `darknessOverlay` (ADR 0005, [bug-grafico-iluminacao-e-efeitos-sem-consumidor](bug-grafico-iluminacao-e-efeitos-sem-consumidor.md)).

## Arquivos e contratos
- Alterar: `src/game/scenes/GameScene.ts` (bloco `updateThreatIndicator`, ~`:1842`), `src/game/scenes/SettingsScene.ts` (linha de toggle), arquivos i18n `ptBR.ts` e `enUS.ts` (chave nova), `src/game/systems/PostFXSystem.test.ts`.
- Atualizar no mesmo commit: `docs/gameplay/lighting-and-effects.md`, `docs/gameplay/status-and-feedback.md` e `Verificado em`.
- Não tocar: `Enemy.ts` (salvo decisão 3 = B), `gameStore.ts`, contrato do `soundEngine`.
- Contrato: `atmosphereEffectsEnabled?: boolean` (padrão `true`; `undefined` conta como ligado).

## Critérios de aceite
- **AT-1** Quando um inimigo em `combat` ou `frenzy` está fora da câmera e `atmosphereEffectsEnabled` não é `false`, o `GameScene` deve desenhar o indicador de borda vermelho na direção dele. (provisório)
- **AT-2** Quando um inimigo em `investigating` está fora da câmera, o `GameScene` deve desenhar o indicador âmbar. (provisório)
- **AT-3** Quando o inimigo entra na câmera ou é derrotado, o `GameScene` deve remover o indicador correspondente no mesmo frame. (provisório)
- **AT-4** Enquanto há de 4 a 10 inimigos em combate, o `PostFXSystem` deve pulsar a vinheta com período de 2000 ms. (provisório)
- **AT-5** Enquanto há mais de 10 inimigos em combate ou chefe ativo, o `PostFXSystem` deve pulsar a vinheta com período de 800 ms e tint `#ef4444`. (provisório)
- **AT-6** Quando um inimigo permanece em `flee` por 5000 ms, o `Enemy` deve emitir um som de raio 660 px uma única vez. (provisório)
- **AT-7** Se `atmosphereEffectsEnabled` é `false`, então o `GameScene` não deve desenhar indicador nem acionar a tensão da vinheta. (provisório)
- **AT-8** Se `atmosphereEffectsEnabled` é `false`, então o `GameScene` não deve enviar ameaça espacial ao `soundEngine`. (provisório)
- **AT-9** Quando o jogador altera `atmosphereEffectsEnabled` na `SettingsScene`, o gameStore deve persistir o valor. (provisório)
- **AT-10** Enquanto o HP do jogador cai, o `LightingSystem` deve reduzir o raio da luz do jogador conforme a decisão 2. (provisório)

## Plano de verificação
| Critério | Como verificar |
|---|---|
| AT-1 a AT-3 | `ThreatIndicator.test.ts` (lógica pura); desenho: manual |
| AT-4, AT-5 | `PostFXSystem.test.ts`: `setDangerTension` com 5 e 11 inimigos e chefe, checando período e tint |
| AT-6 | teste unitário do `Enemy` em `flee` com tempo simulado (hoje sem teste dedicado) |
| AT-7, AT-8 | teste com a opção falsa; manual: ligar e desligar no HUD |
| AT-9 | teste de `localStorage` (round-trip); manual na `SettingsScene` |
| AT-10 | `LightingSystem.test.ts` com `updatePlayerLight(hp)`; sensação: não validado: precisa de playtest humano |
| 60 FPS | não validado: precisa de playtest humano ([ADR 0013](../../decisions/0013-metas-de-performance.md)) |

## Questões em aberto
- Aprovação de produto dos comportamentos AT-1 a AT-10 (nenhum aprovado).
- Decisões 1 a 5 sem resposta; AT-10 depende da 2.
- Desempenho de 60 FPS com indicadores e luz: exige execução.
- AT-6 sem cobertura de teste hoje.

## Pendências para promover a backlog
- Aprovação do responsável.
- Responder as decisões 1 a 5 e remover "(provisório)".
- Verificar 60 FPS em execução.
- ADRs 0005 e 0006 Aprovados (hoje Proposta).

## Referências
- [lighting-and-effects](../../gameplay/lighting-and-effects.md), [audio](../../gameplay/audio.md), [status-and-feedback](../../gameplay/status-and-feedback.md)
- [bug-audio-bgmgain-e-temas](bug-audio-bgmgain-e-temas.md), [bug-grafico-iluminacao-e-efeitos-sem-consumidor](bug-grafico-iluminacao-e-efeitos-sem-consumidor.md)
