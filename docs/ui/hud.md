# HUD, controles e atalhos

**Mestre:** [ui](README.md)
**Status:** verificado
**Verificado em:** 2026-10-11
**Método:** estático
**Fonte:** `src/App.tsx`, `src/components/GameplayHUD.tsx`, `src/components/hud/`, `src/game/scenes/GameScene.ts`

HUD em jogo (`GameplayHUD` e `src/components/hud/`), controles (teclado, gamepad, toque), hooks e i18n. Os modais e telas estão em modals-and-screens.md. Leitura estática; nada foi executado ou jogado (feeling de controle touch: não validado, precisa de playtest humano).

## Montagem

`App.tsx` renderiza `PhaserGame` e `GameplayHUD` (lazy) quando `gameState` é `playing` ou `paused`. `GameplayHUD` recebe só `getCooldownRemaining(spellId)` (lê `gameSceneRef.current.player`) e lê o resto de `useGameStore`. O overlay "JOGO PAUSADO" (CONTINUAR, CONFIG, SAIR) é de `App.tsx`; `ActionButtons` pausa com `setGameState('paused')`.

## Componentes do HUD

| Componente | Papel | Store lida / ações | Onde é montado |
|---|---|---|---|
| `GameplayHUD` | contêiner: posiciona tudo, vinhetas de status (veneno, sangramento, infecção), overlay de inconsciente (`stats.isUnconscious`, `knockoutCount`/2), dicas, modo edição de HUD, aviso e modal de NPC (cleric, alchemist, blacksmith, elder), painel de ajustes rápidos | `playerStats`, `settings`, `gamepadConnected`, `isEditingHUD`, `activeTip`, `activeNPC`, `closestNPCType`, `campaignState`, `isRecordsOpen`; ações `setPlayerStats`, `setActiveSkillTrigger`, `setTouchMoveInput`, `setGameState`, `updateSettings`, `setActiveNPC`, `startDialogue`, `buyCurative`, `addBloodCrystals`, `setStatusCondition` | `App.tsx` |
| `PlayerStatus` | retrato com nível, barras de HP e XP, bandeja de curativos por aflição ativa (ATADURA [Z], ANTÍDOTO [X], ANTIBIÓTICO [V]) e selo "FÚRIA CRÍTICA" | `settings.animatedPortrait`; props `stats`; `setActiveCurativeTrigger`, `useCurative` | `GameplayHUD` (topo esquerdo) |
| `GameStats` | bioma (3 nomes mapeados, senão "CALABOUÇO"), andar, abates, pontos, cristais e tempo | `currentBiome`, `bloodCrystals`; props `stats` | `GameplayHUD` (topo centro) |
| `Minimap` | salas exploradas em caixa de proporção fixa; sala boss/segredo/spawn, baú e jogador; esconde salas não exploradas | `minimapRooms`, `settings.minimapVisible`/`minimapAlpha`, `playerStats.floorDepth` | `GameplayHUD` (topo direito) |
| `ActionButtons` | 6 botões: Recordes (abre `RecordsDisplay` e pausa), Inventário [I], Talentos [T], Prestígio [P], Ajustes Rápidos, Pausar | `setInventoryOpen`, `setTalentsOpen`, `setPrestigeOpen`, `setRecordsOpen`, `setGameState` | `GameplayHUD` |
| `QuestTracker` | quests `active` de `campaignState.quests` com objetivos (definições de `campaignQuests.json`); colapsável, some sem quest ativa | `campaignState.quests` | `GameplayHUD` |
| `ContractHUD` | painel retrátil "CONTRATOS (feitos/total)" com progresso de cada contrato da run; some sem contratos | `activeContracts` | `GameplayHUD` |
| `SkillsOverlay` | botões das magias do `skillPreset` (mín. 4 slots), custo, recarga (`getCooldownRemaining`), cadeado em magia não desbloqueada na campanha (`isCampaignSpellUnlocked`), arrastar para mirar (`setDragAim` start/move/end), modo edição (arrastar, S/M/L em `settings.hudLayout`) | `skillPreset`, `isEditingHUD`, `settings`, `updateSettings`; props `stats`, `onSkillClick`, `getCooldownRemaining` | `GameplayHUD` (canto inferior; lado oposto com `leftHandedMode`) |
| `SkillPresetEditor` | engrenagem que abre seletor de magias do preset (máx. 4; exclui `blood_bolt`) | `skillPreset`, `setSkillPreset` | `SkillsOverlay` (fora do modo edição) |
| `JoystickVisual` | desenha base e knob do joystick ativo (`variant` move ou aim) | props `state` (`FloatingJoystickState`), `opacity` | `GameplayHUD` (só variante move) |
| `TargetFrame` | barra de HP do alvo atual (destaque para boss); limpa alvo parado há mais de 5 s | `currentTarget`, `clearStaleTarget` (a cada 1 s) | `GameplayHUD` |
| `LootLog` | toast de 3 s "ITEM COLETADO" com cor por raridade (epic, rare, resto comum) | `lastLootPickup` | `GameplayHUD` |
| `AchievementToast` | toast de 4,5 s de conquista (usa `framer-motion`, os demais usam `motion/react`) | `lastUnlockedAchievement` | `GameplayHUD` |
| `DialogueModal` | diálogo de campanha: máquina de escrever (22 ms/char), escolhas, retrato por palavra-chave do falante; Espaço/Enter pulam a digitação; botão fechar | `campaignState.activeDialogueTree`/`activeDialogueNodeId`, `selectDialogueChoice`, `closeDialogue`; `useGamepadUINavigation` | `GameplayHUD` |
| `RecordsDisplay` | "Salão dos Recordes": top 8 de `loadHighScores()` por pontuação (nome `BRUXO #n`) ou lista DEMO fixa se vazio | props `isOpen`, `onClose` | `GameplayHUD` |

Painel de ajustes rápidos (estado local `isQuickSettingsOpen` em `GameplayHUD`): sliders de volume BGM e opacidade dos controles, escala do joystick, toggles (CRT, tremor, flashes, atmosfera, danos de alto contraste, retrato animado, canhoto, joystick flutuante), paleta de sangue (`palettes.json`) e botão EDITAR do layout (`setEditingHUD(true)`).

## Controles

Teclado em jogo (`GameScene`, `addKeys` + `JustDown`; skills via `triggerSkill`):

| Tecla | Ação |
|---|---|
| W A S D / setas | mover |
| Q ou 1 | `nova` (hellfire_nova) |
| E | falar com NPC próximo; senão catar (`startScavenging`); senão `syphon` |
| 2 | `syphon` |
| Espaço ou 3 | `bone_shield` |
| R ou 4 | `crimson_scythe` |
| C ou 5 | `blood_ritual_circle` |
| F ou 6 | `hemomancy_beam` |
| Shift | dash |
| Z / X / V | curativos: bandages / antidotes / antibiotics |
| I / T / P | alterna Inventário / Talentos / Prestígio (`App.tsx`, só com `gameState === 'playing'`) |
| O / M | alterna Observabilidade / Teste de Som (`App.tsx`, em qualquer estado) |
| Esc | fecha o modal aberto (`ModalBase`) |

Gamepad em jogo (`PlayerSkillSystem.handleGamepadInput`, índices padrão da Gamepad API; `InputManager` lê o primeiro gamepad): analógico esquerdo move, direito mira; A dash, X nova, Y syphon, B bone_shield, LB crimson_scythe, RB blood_ritual_circle, RT hemomancy_beam.

Gamepad em menus (`useGamepadUINavigation`, polling por `requestAnimationFrame` no primeiro gamepad conectado): D-Pad ou analógico esquerdo (limiar 0,5, passo de 220 ms) move o foco entre `button`, `input`, `a[href]`, `[role=button]`, `[tabindex=0]` visíveis; A ou Start clica o elemento focado; B chama `onClose`. Foco marcado com `data-gamepad-focused`. Usado por `ModalBase`, `DialogueModal`, `GameOverModal`, `InventoryModal`, `LevelUpModal` (grade de 3 colunas, sem `onClose`) e `TalentsModal`.

Toque: `showTouchControls = !gamepadConnected && (controlsMode === 'touch' || (controlsMode !== 'keyboard' && ...))` (na prática, `auto` ou capaz de toque mostra). Metade da tela do lado de movimento (invertida com `leftHandedMode`, `top-1/3` até a base) captura o ponteiro e alimenta `useFloatingJoystick` -> `setTouchMoveInput`; mostra anel "MOVER" quando ocioso. Parâmetros vêm de `settings.joystickDeadzone`, `joystickCurve`, `touchSensitivity`. A mira é por arrastar nos botões de skill (`setDragAim`). `aimJoystick` é criado em `GameplayHUD` mas nunca ligado a uma zona nem renderizado.

## Hooks (`src/hooks/`)

| Hook | Função | Usado por |
|---|---|---|
| `useFloatingJoystick` | joystick que nasce onde o dedo toca; base segue o dedo além de 62 px; knob até 52 px; aplica `applyJoystickResponse` | `GameplayHUD` |
| `useGamepadUINavigation` | navegação de menu por gamepad (acima) | modais e `DialogueModal` |
| `useJoystick` | joystick de base fixa | nenhum componente (não montado) |
| `usePWA` | estado online/instalação PWA | nenhum componente (só `OfflineStatusBadge` e `PWAInstallBanner` o receberiam por props; nenhum é montado) |
| `use-mobile`, `use-toast` | utilitários shadcn; `use-toast` só é usado por `ui/toaster.tsx`, não montado | nenhum componente do jogo |

## i18n (`src/i18n/`)

`ptBR.ts` e `enUS.ts` (194 linhas cada), grupos: `common, mainMenu, settings, hud, status, achievements, codex, talents, highScores, gameOver, pwa`. `t(chave, params?, lang?)` cai para pt-BR se a chave faltar e devolve a chave se não achar; `useTranslation()` assina `settings.language`. Só `PWAInstallBanner`, `GameOverModal`, `AchievementsModal`, `TalentsModal` e `CodexModal` usam i18n (e a `SettingsScene`, dentro do Phaser; detalhes em [i18n](i18n.md)); o HUD (`GameplayHUD` e `hud/*`) tem textos pt-BR fixos no código.

## Onde fica no código

- `src/App.tsx` (montagem, pausa, atalhos I/T/P/O/M), `src/components/GameplayHUD.tsx`, `src/components/hud/*`.
- `src/game/scenes/GameScene.ts` (teclado), `src/game/systems/PlayerSkillSystem.ts` (gamepad), `src/game/systems/InputManager.ts`, `VirtualJoystickSystem.ts`.
- `src/hooks/*`, `src/utils/joystickResponse.ts`, `src/i18n/index.ts`.
- Estado do HUD em `src/store/gameStore.ts` (`settings`, `skillPreset`, `isEditingHUD`, `currentTarget`, `lastLootPickup`, `minimapRooms`, `activeContracts`).

## Pontos a verificar

- `GameplayHUD.handleSkillAction` desconta HP/mana no React (`setPlayerStats`: nova 15 HP, bone_shield 20 mana, syphon 15 mana, crimson_scythe 10 HP) antes de `setActiveSkillTrigger`; `Player.ts` também cobra `bloodCost` em HP ao lançar (`stats.hp -= bloodCost`), então pelo caminho do botão há dois descontos; se ambos efetivamente rodam no toque, não conferido em execução.
- `handleBackgroundTapRemoved` e o estado `splatters` (respingos de sangue ao tocar) estão definidos, mas não ligados a elemento nem renderizados.
