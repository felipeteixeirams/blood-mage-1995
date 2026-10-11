# Áudio: bgmGain nunca criado, tinnitus sem efeito e temas incorretos (bug)

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Classe:** A
**Depende de:** nenhum
**Prioridade:** P3 (sugerida)
**Esforço:** —
**Estado vs código:** verificado em 2026-10-11 (leitura estática): bug confirmado em `src/utils/soundEngine.ts` (`bgmGain`, `initTinnitus`, `incrementVoices`/`decrementVoices`), `src/utils/bgmSynthesizer.ts` (`scheduleStep`, `bellSteps`) e `src/game/scenes/GameScene.ts` (troca de tema a cada ~400 ms). Não validado em execução.

## Contexto
Cinco achados independentes, todos no caminho de áudio (satélite [audio](../../gameplay/audio.md)):

1. **`bgmGain` nunca atribuído.** `soundEngine.ts:16` declara `private bgmGain: GainNode | null = null` e nenhuma linha faz `this.bgmGain = ...`. Consequência: `updateEnvironmentAudio` (`:1068`) retorna na guarda `!this.bgmGain`; chamada por `DungeonFlowController.ts:126` e `:336`, não tem efeito. O parâmetro `reverbLevel` nem é lido no corpo. `setVolumes` e `toggleMute` (`:79`, `:87`) também testam `bgmGain` e pulam; o BGM real usa `bgmSynthesizer` (`muffleFilter -> masterGain -> destination`, `bgmSynthesizer.ts:249-250`).
2. **Passa-baixas do tinnitus fora de qualquer caminho.** `initTinnitus` (`:150-194`) cria `masterLowPassFilter` (20000 Hz) conectado a `destination` e só liga `bgmGain` a ele (`:178-183`), que é nulo. Nenhum som entra no filtro; as rampas 20000 -> 1200 Hz (`:215`, `:223`) não abafam nada. SFX e BGM vão direto a `ctx.destination`/`bgmSynthesizer`.
3. **Contador de vozes inerte.** `incrementVoices`/`decrementVoices` (`:52-58`) não têm chamador; `getActiveVoices()` (`:48`) retorna sempre 0 e alimenta `telemetry.updatePerformanceMetrics` (`GameScene.ts:1660`).
4. **`bellSteps` 32 e 48 nunca disparam.** `scheduleStep` compara `theme.bellSteps.includes(step % 32)` (`bgmSynthesizer.ts:378`, `:389`), valores 0..31. `bellSteps` com 32 (`:81`, `:117`) e 48 (`:117`) são inalcançáveis; o sino de `:81` toca só em 0 e o de `:117` em 0 e 16.
5. **Tema nunca devolve `safe_house`.** A cada ~400 ms, dentro de `getRoomIndexAt(...) >= 0` (`GameScene.ts:1267-1275`), o jogo chama `setBGMTheme('boss_plutonia')` em sala de chefe, senão `santuario_sangue ? 'sanctuary' : 'catacombs'`. `startGothicAmbientBGM` (`soundEngine.ts:1038-1050`) escolhe `safe_house` quando `currentBiome === 'safe_house'`, mas o tema é sobrescrito se o jogador estiver numa sala indexada (se a safe house tem `rooms` não foi verificado). `gloomy_woods` também cai em `catacombs`.

Decisões vigentes: [ADR 0006](../../decisions/0006-audio-e-conquistas.md) (áudio só pelo `soundEngine`; status Proposta, não duplicado aqui).

## Objetivo (proposta)
O volume do BGM reage ao ambiente (interno/externo) e o tinnitus abafa o jogo de fato; a telemetria reporta vozes reais; os sinos tocam nas posições previstas; o tema reflete o bioma, inclusive `safe_house`.

## Decisões a confirmar
| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| 1 | Destino do `bgmGain`/`updateEnvironmentAudio` | A) rotear `bgmSynthesizer.masterGain` por um `bgmGain` do `soundEngine`; B) apagar `bgmGain`, `updateEnvironmentAudio` e o uso de `reverbLevel`; C) mover o ambiente para `bgmSynthesizer` | A: mantém o comportamento descrito pelo código e pelo `WorldManager` |
| 2 | Reverb (`reverbLevel`) | A) ignorar (só ganho); B) implementar reverb (Convolver/delay) | A agora: reverb é escopo novo |
| 3 | Onde passa o abafamento do tinnitus | A) tudo (BGM + SFX) por um bus mestre com o passa-baixas; B) só o BGM (`muffleFilter` já existe) | B: menor mudança, o `muffleFilter` do BGM já existe |
| 4 | Contador de vozes | A) instrumentar os geradores de SFX; B) remover `getActiveVoices` e o parâmetro de telemetria | B: 0 constante não informa; instrumentar tem custo por som |
| 5 | Posições do sino | A) trocar o módulo por 64 passos; B) corrigir os arrays (32/48 -> 0..31) | B: preserva o módulo de 32 e o ritmo atual |
| 6 | Tema por bioma | A) mapa bioma -> tema (inclui `safe_house`; `gloomy_woods` a definir); B) só não sobrescrever `safe_house` | A: uma tabela única, usada também em `startGothicAmbientBGM` |

## Escopo
- Itens 1 a 5 do Contexto, conforme as decisões acima.
- Teste unitário de `scheduleStep` (sino) e do seletor de tema.

## Fora de escopo
- Novas músicas, reverb real (se decisão 2 = A), samples externos, mixagem de volumes.

## Arquivos e contratos
- Alterar: `src/utils/soundEngine.ts`, `src/utils/bgmSynthesizer.ts`, `src/game/scenes/GameScene.ts` (bloco do tema, ~`:1267-1282`); conforme decisão 4, o módulo de telemetria e a chamada em `GameScene.ts:1660`.
- Atualizar no mesmo commit: `docs/gameplay/audio.md` (seções de achados) e `Verificado em`.
- Não tocar: o contrato público de `soundEngine` usado pelas cenas, além do necessário.

## Critérios de aceite (provisórios)
- **AU-1** Quando `updateEnvironmentAudio(isIndoor, reverbLevel)` é chamado com o áudio inicializado, o sistema deve ajustar o ganho do BGM para o alvo do ambiente (`bgmVolume * 0,12` interno, `* 0,20` externo, salvo mudança na decisão 1).
- **AU-2** Quando o jogador está mudo, o sistema deve manter o ganho do BGM em 0 após `updateEnvironmentAudio`.
- **AU-3** Quando o tinnitus fica ativo, o sistema deve reduzir o passa-baixas do caminho abafado para 1200 Hz em 0,3 s e restaurá-lo a 20000 Hz em 0,5 s ao desativar.
- **AU-4** Quando `bellSteps` de um tema contém um valor, o sino deve tocar naquele passo; nenhum valor de `bellSteps` deve ser inalcançável (>= 32).
- **AU-5** Quando o bioma atual é `safe_house`, o sistema não deve trocar o BGM para `catacombs` nem `sanctuary`.
- **AU-6** Se o contador de vozes for mantido, `getActiveVoices()` deve retornar o número de vozes ativas (>0 durante um SFX, 0 após o fim).
- **AU-7** Se o `AudioContext` não existir, `updateEnvironmentAudio` não deve lançar exceção.

## Plano de verificação
| Critério | Como verificar |
|---|---|
| AU-1, AU-2, AU-7 | teste unitário com `AudioContext` simulado: ganho-alvo e ausência de exceção |
| AU-3 | teste unitário: `updateTinnitusState(0.1, false)` e o sinal que chega ao filtro; manual: ouvir o abafamento com HP < 30% |
| AU-4 | teste em `bgmSynthesizer`: para cada tema, todo `bellSteps` < 32; sino agendado nos passos esperados |
| AU-5 | teste do seletor de tema por bioma; manual: entrar na safe house e ouvir `safe_house` por > 1 s |
| AU-6 | teste unitário ou conferência de telemetria (conforme decisão 4) |

## Questões em aberto
- A safe house tem `rooms` indexadas (o override ocorre nela hoje)? Não verificado.
- Qual tema para `gloomy_woods`?

## Referências
- [audio](../../gameplay/audio.md), [ADR 0006](../../decisions/0006-audio-e-conquistas.md)
- [world-systems](../../architecture/world-systems.md) (`reverbLevel` e `isIndoor` do `WorldManager`)
