# Joystick virtual nativo no Phaser (padrão Mobile Legends / Diablo Immortal)

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Estado vs código:** verificado em 2026-10-11 (leitura estática): parcial. Existem `src/game/systems/VirtualJoystickSystem.ts` (+ `.test.ts`), duas instâncias em `src/game/scenes/GameScene.ts` (`virtualJoystick` de movimento, `aimJoystick` de mira), `src/utils/joystickResponse.ts`, `input.activePointers: 3` e `Scale.RESIZE` em `src/game/PhaserGame.tsx`, e as settings `controlsMode`, `virtualControlsOpacity`, `floatingStick`, `leftHandedMode`, `virtualStickScale`. Faltam: reset e ocultação do joystick ao pausar, tratamento de resize durante o toque e decisão sobre o gamepad conectado. O joystick DOM duplicado e o `aimJoystick` sem leitor são bugs já especificados em [bug-joysticks-duplicados-e-gamepad.md](bug-joysticks-duplicados-e-gamepad.md). Não validado em execução.

## Contexto
O joystick de toque deve ser processado no canvas (`Phaser.Input.Pointer`), com resposta síncrona no `update` da `GameScene`, sem passar pelo DOM do React. Camadas de entrada: [input-and-controls](../../ui/input-and-controls.md); HUD: [hud](../../ui/hud.md).

Já implementado (não é escopo): ponteiro isolado por `pointer.id` (multi-toque), reset em `pointerup`/`pointerout`/`pointercancel`, deadzone e curva (`applyJoystickResponse`), modo flutuante e drag-to-follow, escala e opacidade, modo canhoto (`zone`), tema de cor `red`/`purple`, `destroy()` no shutdown da cena.

Lacunas deste documento (fora do bug de joysticks duplicados):
- Com `GameScene.isPaused` verdadeiro, `update` retorna na primeira linha (`GameScene.ts:1046`): o `update` do joystick não roda, o desenho congela no último quadro e o estado `active` permanece se o dedo estava apoiado. O pause vem de `PhaserGame.tsx:243` (`gameState === 'paused'`) e de `CombatEffectsSystem.ts:288` (morte).
- Resize: com `Scale.RESIZE` a posição de repouso é recalculada por `updateConfig` -> `resetPosition` só quando o joystick está inativo e o `update` roda; durante o toque, a base em modo flutuante não é recalculada.
- O joystick Phaser não consulta `gamepadConnected`; o HUD React esconde os controles de toque com gamepad (`GameplayHUD.tsx` `showTouchControls`), o canvas continua a escutar e desenhar.

## Objetivo
O joystick de toque do canvas zera o vetor e some quando o jogo pausa, e se reposiciona corretamente após resize ou rotação, sem deixar entrada presa.

## Decisões de que depende
| ADR | Assunto | Status |
|---|---|---|
| [0004](../../decisions/0004-controles-mobile-e-orientacao.md) | Joystick flutuante como padrão (`floatingStick`) e orientação paisagem | Proposta |
| [0001](../../decisions/0001-ponte-phaser-react-so-zustand.md) | Ponte Phaser-React só por Zustand | Proposta |

## Fatos técnicos verificados
| Afirmação | Fonte | Verificado em |
|---|---|---|
| Raios padrão 75 (máx.) e 66 (base), deadzone 0,08, `dragToFollow` padrão `true`, `floatingStick` padrão de classe `false` | `VirtualJoystickSystem.ts` (campos e `updateConfig`) | 2026-10-11 |
| Padrão efetivo `floatingStick: true` vem das settings e `GameScene` sempre o repassa | `src/utils/localStorage.ts:209`; `GameScene.ts:521`, `:533` | 2026-10-11 |
| `GameScene.update` retorna se `isPaused` | `GameScene.ts:1046` | 2026-10-11 |
| `isPaused` é ligado por `gameState === 'paused'` e pela morte | `PhaserGame.tsx:243`; `CombatEffectsSystem.ts:288` | 2026-10-11 |
| `reset()` só roda em `pointerup/out/cancel` do ponteiro ativo e ao desabilitar (`enabled=false`) | `VirtualJoystickSystem.ts` (`handlePointerUp`, `updateConfig`) | 2026-10-11 |
| Não há `scale.on('resize')` no sistema nem na `GameScene` | `grep` em `VirtualJoystickSystem.ts` e `GameScene.ts` | 2026-10-11 |
| `Scale.RESIZE` e `activePointers: 3` | `src/game/PhaserGame.tsx` | 2026-10-11 |
| `GameScene` cria os joysticks com `enabled: controlsMode !== 'keyboard'`, sem checar gamepad | `GameScene.ts` (criação e `update`) | 2026-10-11 |
| Repouso desenhado a 55% da opacidade, não some | `VirtualJoystickSystem.ts` (`update`, `targetAlpha`) | 2026-10-11 |

## Decisões a confirmar
| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| 1 | Comportamento ao pausar | A) zerar vetor e ocultar o joystick; B) só zerar o vetor | A: evita desenho congelado e entrada presa |
| 2 | Dedo apoiado durante o pause, ao retomar | A) joystick só reativa em novo toque; B) retoma o ponteiro | A: previsível, sem movimento fantasma |
| 3 | Joystick com gamepad conectado | A) desabilitar o canvas (`enabled=false`) como o HUD; B) manter | A: coerente com o HUD |
| 4 | Resize durante o toque | A) cancelar o toque e voltar ao repouso; B) manter a base | A: simples e sem base fora da tela |
| 5 | Valores finais (raios 75/66, deadzone 0,08, repouso a 55%) | A) manter os do código; B) outros | A: já em uso; mudança de feeling exige playtest |
| 6 | Padrão flutuante | tratado no [ADR 0004](../../decisions/0004-controles-mobile-e-orientacao.md) | seguir o ADR |

## Escopo
- `VirtualJoystickSystem`: método de suspensão (ocultar, zerar vetor, liberar `pointerId`) e retomada.
- `GameScene`: acionar suspensão quando `isPaused` ou o controle de touch está desligado, e retomar ao voltar.
- `VirtualJoystickSystem`: reação a resize da escala (`scale.on('resize')`) com remoção do listener no `destroy()`.
- Habilitar o joystick conforme a decisão 3.
- Testes unitários dos itens acima em `VirtualJoystickSystem.test.ts`.

## Fora de escopo
- Remover o joystick DOM, o `aimJoystick` morto e `useJoystick` (ver [bug-joysticks-duplicados-e-gamepad.md](bug-joysticks-duplicados-e-gamepad.md)).
- Mudar paleta, raios, curva ou mapa de teclas; assistência de mira; suporte a retrato.

## Arquivos e contratos
- Alterar: `src/game/systems/VirtualJoystickSystem.ts`, `src/game/systems/VirtualJoystickSystem.test.ts`, `src/game/scenes/GameScene.ts` (blocos `update` dos joysticks e `shutdown`; risco: ver [risky-files](../../engineering/risky-files.md)).
- Contrato novo (nomes a confirmar na implementação): `suspend(): void` zera `active`, `pointerId`, vetores, esconde os gráficos; `resume(): void` reexibe sem ativar.
- Atualizar no mesmo commit: `docs/ui/input-and-controls.md` e `Verificado em`.
- Não tocar: `joystickResponse.ts`, `GameplayHUD.tsx` (escopo do bug de joysticks).

## Critérios de aceite
- **JN-1** Quando `GameScene.isPaused` passa a verdadeiro, o `VirtualJoystickSystem` deve zerar o vetor de movimento e ocultar o desenho (provisório).
- **JN-2** Enquanto `GameScene.isPaused` é verdadeiro, o `VirtualJoystickSystem` não deve ativar com `pointerdown` (provisório).
- **JN-3** Quando `GameScene.isPaused` volta a falso com o dedo ainda apoiado, o `VirtualJoystickSystem` deve permanecer inativo até um novo `pointerdown` (provisório).
- **JN-4** Quando a escala do canvas muda (resize ou rotação) com o joystick inativo, o `VirtualJoystickSystem` deve reposicionar a base de repouso para a zona configurada (provisório).
- **JN-5** Quando a escala muda com o joystick ativo, o `VirtualJoystickSystem` deve zerar o vetor e voltar ao repouso (provisório).
- **JN-6** Onde há gamepad conectado, o `VirtualJoystickSystem` não deve ativar com toque (provisório).
- **JN-7** Se `pointercancel` chega para o ponteiro ativo, então o `VirtualJoystickSystem` deve zerar o vetor (já coberto; teste de regressão).
- **JN-8** Quando a `GameScene` encerra, o `VirtualJoystickSystem` deve remover todos os listeners, inclusive o de resize.

## Plano de verificação
| Critério | Como verificar |
|---|---|
| JN-1 a JN-5, JN-8 | teste unitário em `src/game/systems/VirtualJoystickSystem.test.ts` com cena simulada |
| JN-6 | teste unitário (`enabled` conforme gamepad); manual com gamepad |
| JN-7 | teste existente de reset em `pointerup`/`pointercancel`, estendido |
| Sensação (latência, suavidade do drag-to-follow, rotação real) | não validado: precisa de playtest humano em dispositivo touch |

## Questões em aberto
- Decisões 1 a 5 sem resposta.
- Ao pausar por modal React (nível, inventário) o `gameState` muda para `paused`? Não verificado em todos os modais; `PhaserGame.tsx:243` só considera `'paused'`.
- Remoção do joystick DOM depende da decisão 1 do bug de joysticks: a ordem de implementação entre as duas specs não foi definida.
- Nomes finais de `suspend`/`resume` e onde o `scale.on('resize')` é registrado.

## Pendências para promover a backlog
- Aprovação do responsável.
- Decisões 1 a 5 respondidas; ADRs 0004 e 0001 Aprovados (hoje Propostas); decisão 6 segue o ADR 0004.
- Questões em aberto resolvidas e critérios JN-1 a JN-6 sem a marca (provisório).
- Definir a ordem frente à spec de bug de joysticks duplicados.

## Referências
- [input-and-controls](../../ui/input-and-controls.md), [hud](../../ui/hud.md), [settings](../../ui/settings.md)
- [bug-joysticks-duplicados-e-gamepad.md](bug-joysticks-duplicados-e-gamepad.md), [ADR 0004](../../decisions/0004-controles-mobile-e-orientacao.md)
