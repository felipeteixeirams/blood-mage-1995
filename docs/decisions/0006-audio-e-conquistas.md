# 0006 — Áudio só pelo soundEngine e conquistas centralizadas no store

**Mestre:** [decisions](README.md)
**Status:** Proposta
**Proposta por:** Claude (Sonnet 5.5), 2026-10-10
**Aprovada por:**

## Contexto
**Áudio.** As quatro instâncias de `Phaser.Game` usam `audio.noAudio: true` (`PhaserGame.tsx:56`, `MainMenu.tsx:53`, `SettingsModal.tsx:34`, `HighScoresModal.tsx:29`); todo som vem de `src/utils/soundEngine.ts` (Web Audio, `AudioContext` em `:62`) e `bgmSynthesizer.ts`. `assetManifest.ts:112` ainda sabe carregar `type: 'audio'` com `scene.load.audio`, mas o `assetManifest.json` não tem nenhuma entrada de áudio. `public/audio_samples/` tem 5 `.wav`.

**Conquistas.** O desbloqueio roda em `gameStore.ts` (`incrementRunStat`/`setRunStat` comparam com `src/data/achievements.json`) e o aviso é o componente React `AchievementToast` (`GameplayHUD.tsx:874`). `systems/AchievementSystem.ts` e `systems/AchievementNotification.ts` não são importados por nenhum arquivo de produção (só `AchievementSystem.test.ts` importa o primeiro), mas `localStorage.ts:827-898` mantém `load/saveAchievementProgress` para o `AchievementSystem`.

Existir no código não é decisão.

## Opções
| Opção | Prós | Contras |
|---|---|---|
| A. Áudio só pelo `soundEngine` + conquistas no store; apagar `AchievementSystem.ts`, `AchievementNotification.ts`, o teste e a persistência de progresso associada | Um caminho por assunto; remove código morto (UI em canvas contraria a regra "UI só em React") | Remove testes; exige conferir que nada mais usa o progresso salvo |
| B. Igual a A, mas manter os arquivos mortos | Nenhum trabalho | Dois sistemas de conquista no repositório, confusão para agentes |
| C. Permitir áudio do Phaser (samples) além do `soundEngine` | Facilita samples externos | Dois motores de áudio; reverte `noAudio` |

## Fatos técnicos verificados
| Afirmação | Fonte | Verificado em |
|---|---|---|
| `noAudio: true` nas 4 instâncias | arquivos citados acima | 2026-10-10 |
| Manifest sem entradas de áudio | `grep -c '"type": "audio"' assetManifest.json` = 0 | 2026-10-10 |
| `AchievementSystem`/`AchievementNotification` sem import de produção | `grep -rn` em `src` | 2026-10-10 |
| Toast React montado no HUD | `GameplayHUD.tsx:13`, `:874` | 2026-10-10 |

## Suposições (não verificadas)
- Que os `.wav` de `public/audio_samples/` são usados por `soundEngine`/`bgmSynthesizer` (o uso não foi rastreado).
- Que nenhum dado salvo de `achievements_progress` precisa ser migrado.

## Recomendação
**Opção A.** O jogo já se comporta assim; o código morto só induz erro.

## Decisão
_Em branco até o responsável decidir._

## Consequências
- Se A: remover os 3 arquivos, ajustar `localStorage.ts` (arquivo crítico) e `docs/architecture/game-systems.md`.
