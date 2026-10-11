# Entrada e controles

**Mestre:** [ui](README.md)
**Status:** verificado
**Verificado em:** 2026-10-11
**Método:** estático
**Fonte:** `src/game/systems/InputManager.ts`, `src/utils/haptics.ts`, `src/utils/joystickResponse.ts`, `src/components/GameplayHUD.tsx`

Como a entrada do jogador chega ao jogo: teclado, gamepad, toque (joystick) e haptics. O mapa de teclas do HUD e a lista de botões estão em [hud.md](hud.md); aqui ficam as camadas de entrada e o que não está lá. Leitura estática; feeling de controle touch/gamepad: não validado, precisa de playtest humano.

## Camadas

| Camada | Arquivo | O que faz |
|---|---|---|
| `InputManager` (estático) | `src/game/systems/InputManager.ts` | `init()` idempotente: listeners `gamepadconnected/disconnected` e `keydown/keyup` em `window`, polling por `requestAnimationFrame`. Lê só `navigator.getGamepads()[0]`. Guarda `GamepadState` (sticks, 16 botões, `isConnected`) e teclas por `e.key.toLowerCase()` |
| Teclado em jogo | `GameScene.update` (`addKeys` + `JustDown`) | Mapa em hud.md. Só este caminho dispara skills |
| Gamepad em jogo | `PlayerSkillSystem.handleGamepadInput` | Chamado por `GameScene.update` se `InputManager.isGamepadConnected()`; borda de subida por `lastGamepadButtonStates` |
| Joystick Phaser | `VirtualJoystickSystem` (2 instâncias em `GameScene`: `virtualJoystick`, `aimJoystick`) | Joystick desenhado no canvas |
| Joystick React | `useFloatingJoystick` em `GameplayHUD` | Zona de toque React; alimenta `setTouchMoveInput`/`setTouchAimInput` |
| Menus por gamepad | `useGamepadUINavigation` | Foco e clique em modais |
| Título | `TitleScene.update` e listeners de teclado | Teclado e gamepad próprios (abaixo) |

## InputManager

| Item | Valor (código) |
|---|---|
| Botões (índice) | 0 a, 1 b, 2 x, 3 y, 4 lb, 5 rb, 6 lt, 7 rt, 8 select, 9 start, 10/11 clique dos sticks, 12 a 15 D-pad (cima, baixo, esq., dir.) |
| Eixos | 0/1 analógico esquerdo, 2/3 direito |
| Deadzone | 0,1 de magnitude em `getMovementInput` e `getAimInput`; acima disso devolve o valor bruto, sem remapeamento |
| Prioridade de movimento | gamepad conectado e acima da deadzone; senão WASD/setas normalizado na diagonal |
| Mira | só o analógico direito (mouse e toque são tratados em `GameScene`) |
| API de botão | `isButtonPressed`, `wasButtonPressed` (borda; atualiza `prevButtons`), `getGamepadState` (cópia rasa) |

## Gamepad em jogo

`handleGamepadInput`: analógico esquerdo move; direito mira (só aplica se não zero). A dash; X `nova`; Y `syphon`; B `bone_shield`; LB `crimson_scythe`; RB `blood_ritual_circle`; RT `hemomancy_beam`. Não há curativo, inventário, talentos nem pausa no gamepad em jogo. Ignorado com `scene.isPaused`. `App.tsx` mantém `gamepadConnected` na store (evento `gamepadconnected`; na desconexão, `some(g => g !== null)`); com gamepad conectado o HUD esconde os controles de toque.

## Menus e título

| Contexto | Teclado | Gamepad |
|---|---|---|
| Menus React (`useGamepadUINavigation`) | Esc fecha (`ModalBase`) | D-Pad ou analógico esq. (limiar 0,5, passo 220 ms) move; A ou Start clica; B chama `onClose`; usa o primeiro dos 4 primeiros slots conectado; `playButtonClick` a cada passo |
| Título, menu fechado | Espaço, Enter ou P: `onStartGame`; C: `onContinueGame` | A ou Start: `onStartCampaign`; X: `onStartArcade`; Y ou Select: abre menu |
| Título, menu aberto | setas cima/baixo, Enter ou Espaço, Esc fecha; O alterna | D-Pad cima/baixo, A/Start executa, B/Select fecha |

Com `horizontalGridColumns` > 1 o hook navega em grade (usado por `LevelUpModal`, 3 colunas). Foco marcado com `data-gamepad-focused`.

## Joystick de movimento (toque)

| Aspecto | React (`useFloatingJoystick`) | Phaser (`VirtualJoystickSystem`) |
|---|---|---|
| Raios | knob até 52 px; base segue o dedo além de 62 px | `maxRadius` 75, `baseRadius` 66 (x escala); com `dragToFollow` (padrão `true`) a base desliza 28 % do excesso |
| Zona | metade da largura (`left-0` ou `right-0`, `w-1/2`), de `top-1/3` até a base | `left`: x < 48 % e y > 20 %; `right`: x > 52 % e y > 20 % |
| Flutuante | sempre nasce onde toca | só com `floatingStick`; senão base fixa (x = min(12 % da largura, 100), y = altura - min(20 %, 100)) |
| Multi-toque | um ponteiro por vez (`activePointerId`) | um `pointerId` por instância; `GameScene` ignora esses ponteiros na mira por mouse/toque |
| Resposta | `applyJoystickResponse` | idem |

`applyJoystickResponse` (`src/utils/joystickResponse.ts`): remapeia [deadzone, 1] para [0, 1], multiplica pela sensibilidade (teto 1) e aplica potência com sinal. Padrões 0,08 (deadzone) e 1,8 (curva); limites 0 a 0,5 e 0,5 a 3,0.

Configurações lidas (chave, padrão e persistência em [settings.md](settings.md)): `controlsMode`, `leftHandedMode` (movimento na metade direita, mira na esquerda), `floatingStick`, `virtualStickScale` (0,8 / 1,0 / 1,25), `virtualControlsOpacity` (mínimo 0,1 no Phaser), `touchSensitivity`, `joystickDeadzone`, `joystickCurve`. `GameScene.update` reaplica `updateConfig` a cada frame.

Caminho de toque do HUD: `useFloatingJoystick` -> `setTouchMoveInput` (store) -> `GameScene.setTouchInputs` -> `touchMoveVector`; WASD sobrescreve `mx`/`my` no mesmo frame. A mira por toque usa `touchAimVector` e o arrastar dos botões de skill (`setDragAim`, hud.md).

## Haptics

| Origem | Chamadores | Observação |
|---|---|---|
| `src/utils/haptics.ts` (`HapticFeedback`) | `CollisionHandlers` (`playerDamaged` ou `lightImpact`), `CombatEffectsSystem` (`playerDeath`) | `navigator.vibrate` com prefixos de fabricante; sem suporte, ignora |
| `CombatFeel.triggerHapticFeedback` / `triggerVibration` | `CombatFeel` | padrões `damage_taken`, `critical_hit`, `explosion` etc. |
| `gameStore` | reset de prestígio | `navigator.vibrate([100, 50, 150])` |

Nenhum campo de `GameSettings` desliga a vibração.

## Pontos suspeitos (o código faz isso hoje; nada foi corrigido)

- Há dois joysticks de movimento: o Phaser (`virtualJoystick`, canvas) e o React (zona `fixed` em `GameplayHUD`). O React usa `stopPropagation` no `pointerdown`; se o Phaser ainda receber o ponteiro, os dois alimentam `mx`/`my`. Não conferido em execução.
- O `aimJoystick` do React (`GameplayHUD`) é criado mas não ligado a zona; o `aimJoystick` do Phaser atualiza estado e visual, mas `GameScene` não lê seu vetor.
- `useJoystick` (base fixa) não é usado por nenhum componente.
- `InputManager` lê o slot 0; `useGamepadUINavigation` lê o primeiro dos 4 slots. `onGamepadDisconnected` do `InputManager` zera `isConnected` sem checar outros gamepads.

## Onde fica no código

- `src/game/systems/InputManager.ts` (`InputManager`), `VirtualJoystickSystem.ts` (`VirtualJoystickSystem`, `updateConfig`, `handlePointerDown/Move/Up`).
- `src/game/systems/PlayerSkillSystem.ts` (`handleGamepadInput`), `src/game/scenes/GameScene.ts` (criação e `update` dos joysticks, teclas, `setTouchInputs`), `src/game/scenes/TitleScene.ts`.
- `src/hooks/useFloatingJoystick.ts`, `useJoystick.ts`, `useGamepadUINavigation.ts`; `src/utils/joystickResponse.ts`, `src/utils/haptics.ts`; `src/components/GameplayHUD.tsx` (`showTouchControls`), `src/components/hud/JoystickVisual.tsx`.

Relacionados: [hud.md](hud.md), [settings.md](settings.md), [accessibility.md](accessibility.md), [../architecture/README.md](../architecture/README.md), [../engineering/risky-files.md](../engineering/risky-files.md).
