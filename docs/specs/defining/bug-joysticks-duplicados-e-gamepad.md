# Joysticks duplicados e gamepad inconsistente (bug)

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Estado vs código:** verificado em 2026-10-11 (leitura estática): bug confirmado em `src/game/scenes/GameScene.ts`, `src/components/GameplayHUD.tsx`, `src/game/systems/InputManager.ts`, `src/hooks/useGamepadUINavigation.ts`. Não validado em execução.

## Contexto
**Joysticks**
- Movimento Phaser: `GameScene` (~linha 511) cria `virtualJoystick` (`VirtualJoystickSystem`, ouve `pointerdown/move/up` do input do Phaser); `update` (~1387) usa `getMovementVector()` quando ativo.
- Movimento React: `GameplayHUD` (~92) cria `moveJoystick` (`useFloatingJoystick`) com zona `fixed` (~558) e `stopPropagation`; alimenta `setTouchMoveInput` -> `GameScene.touchMoveVector` (valor inicial de `mx`/`my`). Os dois podem alimentar o movimento (o Phaser sobrescreve quando ativo). Se o React impede o Phaser de ver o mesmo ponteiro: não confirmado (exige execução).
- Mira Phaser: `aimJoystick` (~524) roda `update`, mas nada lê seu vetor (o único `getMovementVector` fora de teste é o do movimento, ~1388). A mira por toque vem de `touchAimVector` (store).
- Mira React: `aimJoystick = useFloatingJoystick(onAimUpdate, ...)` (~104) nunca é referenciado no JSX (só `moveJoystick`).
- `src/hooks/useJoystick.ts`: nenhum importador.

**Gamepad**
- `InputManager.readGamepadState` lê só `gamepads[0]`; `useGamepadUINavigation` (~90) lê `[0]` a `[3]`; `App.tsx` usa `some(g => g !== null)`.
- `InputManager.onGamepadDisconnected` define `isConnected = false` sem checar outros; o polling reescreve `isConnected` no frame seguinte, mas só se o slot 0 estiver ocupado. Com o pad em outro slot, `InputManager` diz desconectado enquanto menus e HUD (`gamepadConnected`) dizem conectado.

**Haptics:** nenhum campo de `GameSettings` desliga a vibração (`navigator.vibrate` em `CombatFeel`, `haptics.ts`, `gameStore`).

## Objetivo
Proposta: um único joystick de movimento ativo; mira sem joystick morto; uma fonte única do gamepad ativo para jogo, menus e HUD; vibração desligável pelo jogador.

## Decisões a confirmar
| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| 1 | Joystick de movimento que permanece | A: Phaser (canvas); B: React | A: regra do projeto prioriza o canvas, mas validar em playtest touch |
| 2 | Mira por joystick | A: ligar o `aimJoystick` do Phaser em `GameScene`; B: remover os dois e manter mira por skill/arrasto | B: a mira já tem arrasto nos botões (`setDragAim`) |
| 3 | `useJoystick` | A: remover; B: manter | A: código morto |
| 4 | Slot do gamepad | A: primeiro conectado, em todos os consumidores, via função única; B: seletor | A |
| 5 | Haptics | A: campo `hapticsEnabled` + toggle; B: sem opção | A: acessibilidade |

## Escopo
- Remover o joystick duplicado (1 e 2) e `useJoystick` (3).
- `InputManager` usa o primeiro gamepad conectado e, ao desconectar, recalcula `isConnected` com os pads restantes; `useGamepadUINavigation` e `App.tsx` usam a mesma função (4).
- Opção de haptics lida por `HapticFeedback` e `CombatFeel.triggerHapticFeedback` (5).

## Fora de escopo
Remapeamento de botões, novos botões do gamepad em jogo, ajuste de feeling.

## Arquivos e contratos
- Alterar: `src/game/scenes/GameScene.ts`, `src/components/GameplayHUD.tsx`, `src/game/systems/InputManager.ts`, `src/hooks/useGamepadUINavigation.ts`, `src/App.tsx`, `src/utils/haptics.ts`, `src/game/systems/CombatFeel.ts`, `src/types/game.ts`, `src/utils/localStorage.ts` (`hapticsEnabled`, padrão `true`, se decisão 5 = A), toggle em `src/game/scenes/SettingsScene.ts` ou no painel do HUD.
- Remover: `src/hooks/useJoystick.ts`.
- Testes: `src/game/systems/VirtualJoystickSystem.test.ts`; novo teste de `InputManager.readGamepadState` e desconexão.

## Critérios de aceite (provisórios)
- **JG-1** Quando o jogador toca a zona de movimento, o GameScene deve receber o vetor de exatamente um joystick de movimento.
- **JG-2** Quando o jogador solta o toque, o GameScene deve zerar o vetor de movimento.
- **JG-3** Onde a decisão 2 ligar a mira, o GameScene deve aplicar o vetor do joystick de mira em `player.setAimInput`.
- **JG-4** Quando um gamepad conecta em qualquer slot, o InputManager deve reportar `isConnected = true` e ler esse gamepad.
- **JG-5** Quando um gamepad desconecta e outro permanece, o InputManager deve manter `isConnected = true`.
- **JG-6** Se nenhum gamepad resta, então o InputManager, o `useGamepadUINavigation` e a store devem reportar desconectado.
- **JG-7** Quando `hapticsEnabled` é `false`, o jogo não deve chamar `navigator.vibrate`.

## Plano de verificação
| Critério | Como verificar |
|---|---|
| JG-1 a JG-3 | manual em dispositivo touch (não validado: precisa de playtest humano); teste do `VirtualJoystickSystem` |
| JG-4 a JG-6 | teste unitário com `navigator.getGamepads` simulado (pads nos slots 0 e 1) |
| JG-7 | teste com spy em `navigator.vibrate` |

## Questões em aberto
Se há duplicação real do movimento em execução (React e Phaser recebendo o mesmo ponteiro) depende de playtest; decisões 1 a 5.

## Referências
[input-and-controls](../../ui/input-and-controls.md), [settings](../../ui/settings.md), [hud](../../ui/hud.md).
