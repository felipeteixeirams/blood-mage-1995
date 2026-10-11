# Modais e telas (referência)

**Mestre:** [ui](README.md)
**Status:** verificado
**Verificado em:** 2026-10-11

Inventário das telas e modais fora do HUD de jogo: `src/components/*.tsx` e `src/components/ui/`. HUD, controles e hooks estão em hud.md; Conquistas e Códice em achievements-and-codex.md. Leitura estática.

## Como os modais são montados

- Flags de abertura vivem no `gameStore` (`isSettingsOpen`, `isHighScoresOpen`, `isAchievementsOpen`, `isInventoryOpen`, `isTalentsOpen`, `isPrestigeOpen`, `isObservabilityOpen`, `isSoundTestOpen`, `isBestiaryOpen`); `levelUpData` e `gameOverStats` fazem o papel de flag para LevelUp e GameOver. `App.tsx` importa todos com `lazy` + `Suspense` e os renderiza dentro de `AnimatePresence`.
- Com qualquer um aberto, `soundEngine.setBGMMuffled(true)` abafa a trilha.
- `ModalBase` (`ui/ModalBase.tsx`): moldura gótica (`role="dialog"`, `aria-modal`), props `title`, `subtitle?`, `onClose`, `children`; fecha com Esc ou botão X; chama `useGamepadUINavigation` (B fecha); bloqueia `pointerdown` (`stopPropagation` + `stopImmediatePropagation`) para não vazar ao jogo. Só 4 consumidores: `AchievementsModal`, `CodexModal`, `PrestigeModal` e o aviso "Recomeçar Campanha" de `App.tsx`. Os demais modais têm moldura própria.
- Modais cujo conteúdo é uma cena Phaser própria (instância extra de `Phaser.Game`): `MainMenu` (`TitleScene`), `SettingsModal` (`SettingsScene`), `HighScoresModal` (`RecordsScene`); eles recebem dados/callbacks por `game.registry`.

## Componentes

| Componente | Papel | Store/ações usadas | Onde é montado |
|---|---|---|---|
| `SplashScreen` | boot falso (6 linhas de log a cada 250 ms, depois fade de 800 ms); qualquer tecla ou toque pula e tenta travar paisagem | nenhuma; `onComplete` | `App.tsx` (`isBooting`) |
| `MainMenu` | hospeda `TitleScene` (menu desenhado em Phaser: continuar, campanha, arcade, recordes, talentos, bestiário, conquistas, config); em React só o botão de Teste de Som e o de mudo | `setBestiaryOpen`, `setTalentsOpen`, `setSoundTestOpen`; props `onStart*`, `onOpen*`, `isMuted`, `onToggleMute` | `App.tsx` (`gameState === 'menu'` sem `gameOverStats`) |
| `RotateDeviceOverlay` | tela cheia pedindo paisagem quando `innerHeight > innerWidth` | nenhuma | `App.tsx` |
| `SettingsModal` | hospeda `SettingsScene`: sliders (sfxVolume, bgmVolume, virtualControlsOpacity, touchSensitivity), toggles (CRT, fearDistortion, tinnitus, leftHandedMode, floatingStick), idioma, escala do stick, intensidade de conteúdo, botões APLICAR / RESTAURAR / SAIR | props `settings`, `onUpdateSettings` (-> `updateSettings`) | `App.tsx` (`isSettingsOpen`; também pelo botão CONFIG da pausa) |
| `HighScoresModal` | hospeda `RecordsScene` com a lista `highScores` (`HighScoreRecord`: score, kills, wave, timeSurvived, levelReached) | prop `scores` | `App.tsx` |
| `LevelUpModal` | escolha de 1 entre `options` (`UpgradeOption`, selo de raridade); gamepad em grade de 3 colunas, sem fechar | `levelUpData` (via `App`); `onSelectOption` -> `GameScene.applyUpgradeChoice` | `App.tsx` |
| `GameOverModal` | resumo (nível, andar, abates, pontuação, curativos); botões "RENASCER NA VILA (PERDA DE XP)" (`setRespawnRequested(true)`) e menu principal (`onGoHome`) | `setRespawnRequested`; props `stats`, `onRestart`, `onGoHome` | `App.tsx` (`gameOverStats`). `onRestart` é recebido, mas os botões visíveis não o chamam |
| `InventoryModal` | arma, armadura e 3 slots de relíquia (equipar/desequipar), atributos efetivos (HP, dano, recarga, vampirismo com bônus de relíquia), histórico de loot, catálogo de relíquias (`relics.json`) com filtro todas/desbloqueadas/equipadas | `equipment`, `playerStats`, `recentLootLog`, `unlockedRelics`, `equipRelicById`, `unequipRelicById`, `getRelicModifiers` | `App.tsx` (atalho I) |
| `TalentsModal` | árvore de 9 talentos (`talents.json`: categoria offense/defense/utility, `maxLevel`, `costPerLevel`, `exclusive_with`); compra com cristais | `bloodCrystals`, `talentLevels`, `upgradeTalent(id, custo)` (recusa sem saldo ou se exclusivo já tem nível) | `App.tsx` (atalho T; menu) |
| `PrestigeModal` | Selos de Sangue (5 tipos), dificuldade (NORMAL, PESADELO exige prestígio 1, INFERNO exige 3) e botão de sacrifício com confirmação; testado em `PrestigeModal.test.tsx` | `prestige`, `playerStats`, `canPrestige`, `performPrestige`, `allocateBloodSeal`, `setDifficulty`, `getPrestigeModifiers` | `App.tsx` (atalho P) |
| `AchievementsModal` | ver achievements-and-codex.md | `achievements`, `runStats`, `redeemAchievement` | `App.tsx` |
| `CodexModal` | ver achievements-and-codex.md | `codexState`, `claimCodexMilestone`, `getLoreCompletionPercentage`, `bloodCrystals` | `App.tsx` |
| `ObservabilityModal` | diagnóstico: abas logs, telemetria e sistema; exporta logs em JSON (`bloodmage_diagnostics_<sessão>.json`), limpa logs; lê `logger` e `telemetry`, sem store | nenhuma | `App.tsx` (atalho O) |
| `SoundTestModal` | teste de áudio: temas BGM sintetizados (3 listados no componente), amostras `.wav` em `/audio_samples/`, controle de mudo/volumes | `isMuted`, `toggleMute`, `settings`, `updateSettings`; prop `isOpen` | `App.tsx` (atalho M; botão no menu) |
| `BestiaryModal` | wrapper que apenas renderiza `CodexModal` | nenhuma | **não montado** (só `CodexModal` é usado) |

Overlays de `App.tsx` sem componente próprio: aviso "Atualização disponível" (`registerSW`, botões "Atualizar agora"/"Depois"), overlay de pausa e confirmação "Recomeçar Campanha" (`executeStartCampaign` apaga progresso de campanha), filtro CRT (`settings.crtFilter`).

## Pasta `ui/`

58 arquivos. Usados pelo jogo: só `ModalBase.tsx`. Em `src/components/ui/`:

| Grupo | Arquivos | Situação |
|---|---|---|
| Próprios do jogo | `ModalBase`, `OfflineStatusBadge`, `PWAInstallBanner` | `ModalBase` montado; os dois outros **não montados** (recebem estado de `usePWA` por props, mas ninguém chama `usePWA`) |
| shadcn/Radix genéricos | os outros 55 (`button`, `dialog`, `toast`, `toaster`, `sidebar`, `chart`, ...) | só se importam entre si; nenhum é importado por componentes do jogo (`App.tsx` e `main.tsx` não os usam); `toaster` não é montado; `src/pages/not-found.tsx` importa `ui/card` e não é referenciado por `App.tsx` nem `main.tsx` |

## Onde fica no código

- `src/App.tsx` (montagem e flags), `src/components/*.tsx`, `src/components/ui/ModalBase.tsx`.
- Cenas Phaser dos modais: `src/game/scenes/TitleScene.ts`, `SettingsScene.ts`, `RecordsScene.ts`.
- Dados: `src/data/talents.json`, `relics.json`, `upgrades.json`; estado em `src/store/gameStore.ts` (`talentLevels`, `prestige`, `equipment`, `unlockedRelics`, `settings`, `highScores`).

## Pontos a verificar

- `TitleScene` registra callbacks `onStartGame` em alguns caminhos (teclado/atalhos), mas `MainMenu` só define `onStartCampaign`/`onStartArcade`/`onContinueGame`; esses caminhos de `onStartGame` ficam sem efeito (não conferido o gatilho exato).
- `SettingsScene` e `TitleScene` desenham UI dentro do Phaser, em contraste com a regra "UI só em React" do projeto (fato do código).
