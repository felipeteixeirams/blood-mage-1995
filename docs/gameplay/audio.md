# Áudio

**Mestre:** [gameplay](README.md)
**Status:** verificado
**Verificado em:** 2026-10-11

Todo o som é sintetizado em runtime com Web Audio; o jogo não carrega arquivo de áudio. O Phaser roda com `audio: { noAudio: true }` (`PhaserGame.tsx`, `MainMenu.tsx`, `SettingsModal.tsx`, `HighScoresModal.tsx`): nada passa pelo `SoundManager` do Phaser. Leitura estática; nada foi executado nem escutado (mixagem e timbre só se validam ouvindo: não validado, precisa de playtest humano).

## Peças

| Peça | Papel |
|---|---|
| `soundEngine` (singleton, `soundEngine.ts`) | SFX (29 métodos `play*`), BGM por delegação, efeitos de ameaça (estática espacial, tinnitus, drone de tensão), volume e mute. Cria o `AudioContext` sob demanda (`initCtx`, retoma se suspenso) |
| `bgmSynthesizer` (singleton, `bgmSynthesizer.ts`) | Sequenciador de música procedural; reutiliza o `AudioContext` do `soundEngine` (`init(ctx)`) |
| `public/audio_samples/*.wav` | 5 WAVs renderizados por `scripts/render_bgm_samples.cjs`; só `SoundTestModal` os referencia (`/audio_samples/...`). O jogo não os toca |
| `SoundTestModal` | Tela de teste: aba ao vivo (toca cada tema, liga muffle e low HP, volume, mute) e aba de amostras WAV. Aberta pelo `MainMenu` (`setSoundTestOpen`), carregada com `lazy` em `App.tsx` |

## Música por tema

`BGMThemeName`: `catacombs | sanctuary | boss_plutonia | safe_house` (`THEMES`). Passos de semicolcheia (`stepSubdivision` 4); arpejo e baixo repetem por `step % length`; bumbo, caixa e sino usam `step % 32`.

| Tema | BPM | Baixo / Lead | filterBase | Bumbo (steps) | Caixa | Sino (steps, nota) |
|---|---|---|---|---|---|---|
| catacombs | 92 | sawtooth / square | 180 | 0, 8, 16, 24 | 4, 12, 20, 28 | 0, 32 (A2) |
| sanctuary | 84 | triangle / sawtooth | 220 | 0, 16 | 8, 24 | 0, 16, 32, 48 (C3) |
| boss_plutonia | 130 | sawtooth / sawtooth | 400 | pares de 0 a 30 | 4, 12, 20, 28 | 0 (E2) |
| safe_house | 68 | sine / triangle | 350 | nenhum | nenhuma | 0, 16 (A3) |

Fonte: `bgmSynthesizer.ts` (temas `CATACOMBS_THEME`, `SANCTUARY_THEME`, `BOSS_PLUTONIA_THEME`, `SAFE_HOUSE_THEME`).
Escalonador: lookahead de 120 ms, `setTimeout` de 25 ms (`scheduler`). Vozes: arpejo (`playArp`), baixo FM (`playBass`), bumbo, caixa de ruído, sino gótico, batimento (`playHeartbeat`).

Quem escolhe o tema:

| Gatilho | Tema | Onde |
|---|---|---|
| Início da cena | por `currentBiome`: `safe_house` -> safe_house, `santuario_sangue` -> sanctuary, resto -> catacombs | `startGothicAmbientBGM` (fim de `GameScene.create`) |
| A cada ~400 ms, sala do jogador | sala `boss` -> boss_plutonia; senão `santuario_sangue` -> sanctuary, senão catacombs | `GameScene.update` (`setBGMTheme`). Suspeito: nunca devolve `safe_house` |
| Fim do jogo | para a BGM | `CombatEffectsSystem.triggerGameOver` -> `stopBGM` |

## Estados que alteram a música

| Estado | Efeito | Origem |
|---|---|---|
| Algum modal aberto (bestiário, config, recordes, conquistas, inventário, talentos, prestígio, observabilidade, teste de som, level up, game over) | Muffle: passa-baixas 700 Hz (20000 Hz fechado), constante de tempo 0,15 s | `App.tsx` -> `setBGMMuffled` -> `bgmSynthesizer.setMuffled` |
| HP <= 25% | BPM x1,12 e batimento (`playHeartbeat`) a cada 8 steps | `GameScene.update` -> `setBGMLowHp` |
| Mute | ganho do master a 0 | `toggleMute` -> `setMute` |

## Mixagem e volumes

| Item | Valor | Fonte |
|---|---|---|
| `sfxVolume` / `bgmVolume` padrão | 0,8 / 0,3 (schema Zod com o mesmo `catch`) | `localStorage.ts` |
| Ganho master da BGM | `bgmVolume * 0.22` (0 se mudo) | `BGMSynthesizer.init/setVolume` |
| Propagação | `updateSettings` e o efeito em `App.tsx` chamam `setVolumes`; sliders em `GameplayHUD`, `SettingsScene` e `SoundTestModal` | `gameStore.updateSettings` |
| Mute | `gameStore.toggleMute` -> `soundEngine.toggleMute` (BGM e SFX; `isMuted` no store) | `gameStore.ts` |
| Variação de tom | `pitchJitter` (+-6%) em 5 SFX repetitivos: `playBloodBolt`, `playDialogueBlip`, `playPlayerHurt`, `playHowl`, `playScytheSlash`; sons melódicos ficam sem | `soundEngine.ts` |

Cada `play*` retorna cedo se mudo ou `sfxVolume <= 0`.

## Efeitos de ameaça

Atualizados por frame em `GameScene.updateThreatIndicator`; os três só agem com `atmosphereEffectsEnabled !== false`. Com a flag desligada, o ramo `else` os zera (`updateSpatialThreat(0,0,false)`, `updateTinnitusState(1,false)`, `updateTensionDrone(0,1)`).

| Efeito | Condição | Som | Ganho |
|---|---|---|---|
| Estática espacial (`updateSpatialThreat`) | inimigo mais próximo fora da tela em `combat` ou `frenzy` | ruído branco, passa-faixa 1000 Hz (Q 1), `StereoPanner` pelo X relativo (-1 a 1) | `sfxVolume * 0.12`, rampa 0,1 s |
| Tinnitus (`updateTinnitusState`) | `settings.tinnitusEnabled` (padrão true), não mudo, `sfxVolume > 0` e (HP < 30% ou elite/chefe a menos de 220 px) | seno 3500 Hz, LFO 4,5 Hz (+-45 Hz) | `sfxVolume * 0.08` (HP < 20%) ou `* 0.04`; rampa 0,3 s; desliga em 0,5 s |
| Drone de tensão (`updateTensionDrone`) | sempre ativo (perigo 0 = silêncio); perigo = min(1, min(1, alertas/5) + (HP < 50% ? (0,5 - HP) * 1,6 : 0)) | serra 38 a 52 Hz, passa-baixas 160 Hz, LFO 0,18 Hz (profundidade 4 a 14) | `sfxVolume * 0.05 * perigo` |

## SFX

29 métodos `play*` públicos em `soundEngine.ts`: combate (`playBloodBolt`, `playNova`, `playBloodNova`, `playSwing`, `playTelegraph`, `playScytheSlash`, `playHemomancyBeam`, `playBoneShield`, `playSyphonSoul`, `playRunicEmpowerment`, `playDash`, `playBloodSquish`, `playGoreExplosion`, `playExecutionGore`, `playPlayerHurt`), monstros (`playDemonRoar`, `playHowl`, `playBossRoar`), progressão e itens (`playLevelUp`, `playOrbPickup`, `playEquipLoot`, `playChestOpen`, `playContractComplete`, `playPortalEnter`, `playRitualCircle`) e UI (`playMenuBlip`, `playMenuSelect`, `playButtonClick`, `playDialogueBlip`).

## Achados suspeitos (descritos, não corrigidos)

| Item | O que o código faz |
|---|---|
| `bgmGain` | Declarado e lido, nunca atribuído (a BGM usa o master do `bgmSynthesizer`). `updateEnvironmentAudio(isIndoor, reverbLevel)` (chamado por `DungeonFlowController`) retorna cedo: não faz nada e `reverbLevel` não é usado |
| Tinnitus e passa-baixas | `initTinnitus` cria `masterLowPassFilter` (20000 -> 1200 Hz) e só o liga à BGM se `bgmGain` existir; como é nulo, o filtro não está no caminho de nenhum som e o abafamento não ocorre. O tom de 3500 Hz toca normalmente |
| `getActiveVoices` | `incrementVoices`/`decrementVoices` nunca são chamados; o valor enviado à telemetria (`GameScene`) é sempre 0 |
| Sino fora de `step % 32` | `bellSteps` com 32 e 48 (catacombs, sanctuary) nunca igualam `step % 32`; só 0 e 16 disparam |
| Campos de BGM antigos | `bgmOscillators`, `bgmIntervalTimer`, `isBgmPlaying` só são tocados em `startGothicAmbientBGM`/`stopBGM` |

## Onde fica no código
- `src/utils/soundEngine.ts` (`soundEngine`, `setVolumes`, `toggleMute`, `startGothicAmbientBGM`, `setBGMTheme`, `setBGMMuffled`, `setBGMLowHp`, `stopBGM`, `updateSpatialThreat`, `updateTinnitusState`, `updateTensionDrone`, `updateEnvironmentAudio`)
- `src/utils/bgmSynthesizer.ts` (`BGMSynthesizer`, `THEMES`, `NOTES`, `BGMThemeName`); testes `*.test.ts` ao lado
- `src/components/SoundTestModal.tsx`, `src/components/GameplayHUD.tsx` e `src/game/scenes/SettingsScene.ts` (sliders e toggle de tinnitus), `src/App.tsx` (muffle por modal)
- `src/game/scenes/GameScene.ts` (`updateThreatIndicator`, troca de tema), `src/game/systems/DungeonFlowController.ts` (`updateEnvironmentAudio`)
- `src/utils/localStorage.ts` (padrões e schema de `sfxVolume`, `bgmVolume`, `tinnitusEnabled`), `scripts/render_bgm_samples.cjs`

Relacionados: [lighting-and-effects.md](lighting-and-effects.md), [status-and-feedback.md](status-and-feedback.md), [../decisions/0006-audio-e-conquistas.md](../decisions/0006-audio-e-conquistas.md), [../architecture/world-systems.md](../architecture/world-systems.md).
