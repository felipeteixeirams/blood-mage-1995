# Controles: joystick único, pausa, resize, mira, gamepad e haptics (bug)

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Estado vs código:** verificado em 2026-10-11 (leitura estática): joystick Phaser existe e funciona em tese (`src/game/systems/VirtualJoystickSystem.ts` + `.test.ts`, `src/utils/joystickResponse.ts`, `input.activePointers: 3` e `Scale.RESIZE` em `src/game/PhaserGame.tsx`, settings `controlsMode`, `virtualControlsOpacity`, `floatingStick`, `leftHandedMode`, `virtualStickScale`). Bugs confirmados em `GameScene.ts`, `GameplayHUD.tsx`, `InputManager.ts`, `useGamepadUINavigation.ts`, `App.tsx`. Faltam: um só joystick de movimento, suspensão ao pausar, resize durante o toque, gamepad no joystick de toque, mira sem joystick morto, remoção de `useJoystick`, slot único do gamepad, opção de haptics. Não validado em execução.
**Origem:** consolidada de feature-joystick-virtual-nativo.md e bug-joysticks-duplicados-e-gamepad.md (2026-10-11)

## Contexto
O joystick de toque deve ser processado no canvas (`Phaser.Input.Pointer`), com resposta síncrona no `update` da `GameScene`, sem passar pelo DOM do React. Camadas de entrada: [input-and-controls](../../ui/input-and-controls.md); HUD: [hud](../../ui/hud.md); opções: [settings](../../ui/settings.md).

Já implementado (não é escopo): ponteiro isolado por `pointer.id`, reset em `pointerup`/`pointerout`/`pointercancel`, deadzone e curva, modo flutuante e drag-to-follow, escala, opacidade, modo canhoto, tema de cor, `destroy()` no shutdown.

**Joysticks duplicados**
- Movimento Phaser: `GameScene` (~511) cria `virtualJoystick`; `update` (~1387) usa `getMovementVector()` quando ativo.
- Movimento React: `GameplayHUD` (~92) cria `moveJoystick` (`useFloatingJoystick`), zona `fixed` (~558) com `stopPropagation`; alimenta `setTouchMoveInput` -> `GameScene.touchMoveVector`. O Phaser sobrescreve quando ativo. Se o React impede o Phaser de ver o mesmo ponteiro: não confirmado.
- Mira Phaser: `aimJoystick` (~524) roda `update`, mas nada lê seu vetor; a mira por toque vem de `touchAimVector` (store). Mira React: `aimJoystick` (~104) nunca é usado no JSX. `src/hooks/useJoystick.ts` não tem importador.

**Pausa, resize, gamepad no toque**
- Com `isPaused` verdadeiro, `update` retorna na primeira linha (`GameScene.ts:1046`): o joystick congela no último quadro e `active` permanece. Pause vem de `PhaserGame.tsx:243` (`gameState === 'paused'`) e de `CombatEffectsSystem.ts:288` (morte).
- Resize: `updateConfig` -> `resetPosition` só com o joystick inativo; durante o toque a base flutuante não é recalculada.
- O joystick Phaser não consulta `gamepadConnected`; o HUD esconde os controles de toque com gamepad (`showTouchControls`), o canvas continua a escutar e desenhar.

**Gamepad**
- `InputManager.readGamepadState` lê só `gamepads[0]`; `useGamepadUINavigation` (~90) lê `[0]` a `[3]`; `App.tsx` usa `some(g => g !== null)`. `onGamepadDisconnected` define `isConnected = false` sem checar outros pads; com o pad em outro slot, `InputManager` diz desconectado enquanto menus e HUD dizem conectado.

**Haptics:** nenhum campo de `GameSettings` desliga a vibração (`navigator.vibrate` em `CombatFeel`, `haptics.ts`, `gameStore`).

## Objetivo
Um único joystick de movimento ativo, que zera e some ao pausar e se reposiciona após resize; mira sem joystick morto; uma fonte única do gamepad ativo para jogo, menus e HUD; vibração desligável pelo jogador.

## Decisões de que depende
| ADR | Assunto | Status |
|---|---|---|
| [0004](../../decisions/0004-controles-mobile-e-orientacao.md) | Joystick flutuante como padrão (`floatingStick`) e orientação paisagem | Proposta |
| [0001](../../decisions/0001-ponte-phaser-react-so-zustand.md) | Ponte Phaser-React só por Zustand | Proposta |

## Fatos técnicos verificados
| Afirmação | Fonte | Verificado em |
|---|---|---|
| Raios padrão 75 (máx.) e 66 (base), deadzone 0,08, `dragToFollow` padrão `true`, `floatingStick` padrão de classe `false` | `VirtualJoystickSystem.ts` | 2026-10-11 |
| Padrão efetivo `floatingStick: true` vem das settings e `GameScene` sempre o repassa | `src/utils/localStorage.ts:209`; `GameScene.ts:521`, `:533` | 2026-10-11 |
| `GameScene.update` retorna se `isPaused`; `isPaused` é ligado por `gameState === 'paused'` e pela morte | `GameScene.ts:1046`; `PhaserGame.tsx:243`; `CombatEffectsSystem.ts:288` | 2026-10-11 |
| `reset()` só roda em `pointerup/out/cancel` do ponteiro ativo e ao desabilitar | `VirtualJoystickSystem.ts` (`handlePointerUp`, `updateConfig`) | 2026-10-11 |
| Não há `scale.on('resize')` no sistema nem na `GameScene` | `grep` em `VirtualJoystickSystem.ts`, `GameScene.ts` | 2026-10-11 |
| `Scale.RESIZE` e `activePointers: 3` | `src/game/PhaserGame.tsx` | 2026-10-11 |
| `GameScene` cria os joysticks com `enabled: controlsMode !== 'keyboard'`, sem checar gamepad | `GameScene.ts` | 2026-10-11 |
| Repouso desenhado a 55% da opacidade, não some | `VirtualJoystickSystem.ts` (`update`, `targetAlpha`) | 2026-10-11 |
| Único `getMovementVector` fora de teste é o do movimento (~1388); `aimJoystick` do React nunca está no JSX; `useJoystick.ts` sem importador | `GameScene.ts`, `GameplayHUD.tsx`, `src/hooks/` | 2026-10-11 |
| `readGamepadState` lê `gamepads[0]`; `useGamepadUINavigation` lê `[0]`..`[3]` | `InputManager.ts:119`; `useGamepadUINavigation.ts:90` | 2026-10-11 |
| Não existe `hapticsEnabled` | `grep` em `src` | 2026-10-11 |

## Decisões a confirmar
| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| 1 | Joystick de movimento que permanece | A) Phaser (canvas); B) React | A: regra do projeto prioriza o canvas; validar em playtest touch |
| 2 | Mira por joystick | A) ligar o `aimJoystick` do Phaser em `GameScene`; B) remover os dois e manter mira por skill/arrasto | B: a mira já tem arrasto nos botões (`setDragAim`) |
| 3 | `useJoystick` | A) remover; B) manter | A: código morto |
| 4 | Slot do gamepad | A) primeiro conectado, em todos os consumidores, via função única; B) seletor | A |
| 5 | Haptics | A) campo `hapticsEnabled` + toggle; B) sem opção | A: acessibilidade |
| 6 | Comportamento ao pausar | A) zerar vetor e ocultar; B) só zerar | A: evita desenho congelado e entrada presa |
| 7 | Dedo apoiado durante o pause, ao retomar | A) só reativa em novo toque; B) retoma o ponteiro | A: previsível, sem movimento fantasma |
| 8 | Joystick de toque com gamepad conectado | A) desabilitar o canvas como o HUD; B) manter | A: coerente com o HUD |
| 9 | Resize durante o toque | A) cancelar o toque e voltar ao repouso; B) manter a base | A: simples e sem base fora da tela |
| 10 | Valores finais (raios 75/66, deadzone 0,08, repouso a 55%) | A) manter; B) outros | A: já em uso; mudança de feeling exige playtest |
| 11 | Padrão flutuante | tratado no [ADR 0004](../../decisions/0004-controles-mobile-e-orientacao.md) | seguir o ADR |

## Escopo
- Remover o joystick de movimento duplicado (decisão 1), o de mira morto (2) e `src/hooks/useJoystick.ts` (3).
- `VirtualJoystickSystem`: suspensão (ocultar, zerar vetor, liberar `pointerId`) e retomada; `GameScene` a aciona quando `isPaused` ou o touch está desligado.
- `VirtualJoystickSystem`: reação a `scale.on('resize')`, com remoção do listener no `destroy()`.
- Joystick habilitado conforme a decisão 8.
- `InputManager` usa o primeiro gamepad conectado e, ao desconectar, recalcula `isConnected` com os pads restantes; `useGamepadUINavigation` e `App.tsx` usam a mesma função (4).
- Opção de haptics lida por `HapticFeedback` e `CombatFeel.triggerHapticFeedback` (5).
- Testes unitários dos itens acima.

## Fora de escopo
Remapeamento de botões e novos botões do gamepad em jogo; mudar paleta, raios, curva ou mapa de teclas; assistência de mira; suporte a retrato; ajuste de feeling.

## Arquivos e contratos
- Alterar: `src/game/scenes/GameScene.ts` (blocos `update` dos joysticks e `shutdown`; risco: [risky-files](../../engineering/risky-files.md)), `src/components/GameplayHUD.tsx`, `src/game/systems/VirtualJoystickSystem.ts`, `src/game/systems/InputManager.ts`, `src/hooks/useGamepadUINavigation.ts`, `src/App.tsx`, `src/utils/haptics.ts`, `src/game/systems/CombatFeel.ts`, `src/types/game.ts`, `src/utils/localStorage.ts` (`hapticsEnabled`, padrão `true`, se decisão 5 = A), toggle em `src/game/scenes/SettingsScene.ts` ou no painel do HUD.
- Remover: `src/hooks/useJoystick.ts`.
- Contrato novo (nomes a confirmar): `suspend(): void` zera `active`, `pointerId`, vetores e esconde os gráficos; `resume(): void` reexibe sem ativar. Função única do gamepad ativo (nome e local a definir).
- Testes: `src/game/systems/VirtualJoystickSystem.test.ts`; novo teste de `InputManager.readGamepadState` e desconexão.
- Atualizar no mesmo commit: `docs/ui/input-and-controls.md`, `docs/ui/hud.md` e `Verificado em`.
- Não tocar: `joystickResponse.ts`.

## Critérios de aceite
Todos provisórios (sem aprovação), exceto onde indicado.
- **CJG-1** (JG-1) Quando o jogador toca a zona de movimento, o GameScene deve receber o vetor de exatamente um joystick de movimento (provisório).
- **CJG-2** (JG-2) Quando o jogador solta o toque, o GameScene deve zerar o vetor de movimento (provisório).
- **CJG-3** (JG-3) Onde a decisão 2 ligar a mira, o GameScene deve aplicar o vetor do joystick de mira em `player.setAimInput` (provisório).
- **CJG-4** (JG-4) Quando um gamepad conecta em qualquer slot, o InputManager deve reportar `isConnected = true` e ler esse gamepad (provisório).
- **CJG-5** (JG-5) Quando um gamepad desconecta e outro permanece, o InputManager deve manter `isConnected = true` (provisório).
- **CJG-6** (JG-6) Se nenhum gamepad resta, então o InputManager, o `useGamepadUINavigation` e a store devem reportar desconectado (provisório).
- **CJG-7** (JG-7) Quando `hapticsEnabled` é `false`, o jogo não deve chamar `navigator.vibrate` (provisório).
- **CJG-8** (JN-1) Quando `GameScene.isPaused` passa a verdadeiro, o `VirtualJoystickSystem` deve zerar o vetor de movimento e ocultar o desenho (provisório).
- **CJG-9** (JN-2) Enquanto `GameScene.isPaused` é verdadeiro, o `VirtualJoystickSystem` não deve ativar com `pointerdown` (provisório).
- **CJG-10** (JN-3) Quando `isPaused` volta a falso com o dedo ainda apoiado, o `VirtualJoystickSystem` deve permanecer inativo até um novo `pointerdown` (provisório).
- **CJG-11** (JN-4) Quando a escala do canvas muda com o joystick inativo, o `VirtualJoystickSystem` deve reposicionar a base de repouso para a zona configurada (provisório).
- **CJG-12** (JN-5) Quando a escala muda com o joystick ativo, o `VirtualJoystickSystem` deve zerar o vetor e voltar ao repouso (provisório).
- **CJG-13** (JN-6) Onde há gamepad conectado, o `VirtualJoystickSystem` não deve ativar com toque (provisório).
- **CJG-14** (JN-7) Se `pointercancel` chega para o ponteiro ativo, então o `VirtualJoystickSystem` deve zerar o vetor (já coberto; teste de regressão).
- **CJG-15** (JN-8) Quando a `GameScene` encerra, o `VirtualJoystickSystem` deve remover todos os listeners, inclusive o de resize.

## Plano de verificação
| Critério | Como verificar |
|---|---|
| CJG-1 a CJG-3 | teste do `VirtualJoystickSystem`; manual em touch (não validado: precisa de playtest humano) |
| CJG-4 a CJG-6 | teste unitário com `navigator.getGamepads` simulado (pads nos slots 0 e 1) |
| CJG-7 | teste com spy em `navigator.vibrate` |
| CJG-8 a CJG-12, CJG-15 | teste unitário em `VirtualJoystickSystem.test.ts` com cena simulada |
| CJG-13 | teste unitário (`enabled` conforme gamepad); manual com gamepad |
| CJG-14 | teste existente de reset em `pointerup`/`pointercancel`, estendido |
| Sensação (latência, drag-to-follow, rotação real) | não validado: precisa de playtest humano em dispositivo touch |

## Questões em aberto
- Decisões 1 a 11 sem resposta.
- Há duplicação real do movimento em execução (React e Phaser recebendo o mesmo ponteiro)? Depende de playtest.
- Ao pausar por modal React (nível, inventário) o `gameState` muda para `paused`? Não verificado em todos os modais; `PhaserGame.tsx:243` só considera `'paused'`.
- Nomes finais de `suspend`/`resume`, onde registrar `scale.on('resize')` e onde fica a função única do gamepad.
- Reconciliação das originais: a spec de joystick nativo deixava a remoção do DOM para a de bug e pedia ordem entre ambas; agora é uma só entrega, na ordem: decisão 1, remoção do duplicado, suspensão/resize.

## Pendências para promover a backlog
- Aprovação do responsável.
- Decisões 1 a 11 respondidas; ADRs 0004 e 0001 Aprovados (hoje Propostas).
- Questões em aberto resolvidas (inclui playtest de duplicação) e critérios sem a marca (provisório).
- Se ficar grande na implementação, dividir (joystick/pausa/resize; gamepad; haptics) sem decidir nada.

## Referências
- [input-and-controls](../../ui/input-and-controls.md), [hud](../../ui/hud.md), [settings](../../ui/settings.md)
- [ADR 0004](../../decisions/0004-controles-mobile-e-orientacao.md), [ADR 0001](../../decisions/0001-ponte-phaser-react-so-zustand.md)
