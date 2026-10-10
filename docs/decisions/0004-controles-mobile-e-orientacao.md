# 0004 — Controles mobile: joystick flutuante e orientação paisagem

**Mestre:** [decisions](README.md)
**Status:** Proposta
**Proposta por:** Claude (Sonnet 5.5), 2026-10-10
**Aprovada por:**

## Contexto
**Joystick.** O padrão atual é flutuante (a base aparece onde o dedo toca): `defaultSettings.floatingStick = true` em `src/utils/localStorage.ts:209`, com comentário explicando que o modo fixo impedia mover para a esquerda. Há inconsistências de padrão no código: o schema Zod usa `.catch(false)` para esse campo (`localStorage.ts:237`), então um valor salvo inválido vira modo **fixo**; `VirtualJoystickSystem` tem padrão interno `false` (`:51`), usado só se a config não passar o campo (a `GameScene` sempre passa, `GameScene.ts:521`, `:533`).

**Orientação.** O manifest PWA fixa `"orientation": "landscape"` (`public/manifest.webmanifest:8`); `tryLockLandscape()` tenta travar a orientação (`src/utils/orientation.ts`); `RotateDeviceOverlay` (montado em `App.tsx:265`) cobre a tela inteira com "ROTACIONE O DISPOSITIVO" sempre que `window.innerHeight > window.innerWidth`, **sem distinguir toque de desktop**, ou seja, uma janela de navegador em pé também é bloqueada. O comentário do componente diz que retrato "nunca foi tratado como alvo de suporte".

Existir no código não é decisão.

## Opções
| Opção | Prós | Contras |
|---|---|---|
| A. Manter: flutuante como padrão e paisagem obrigatória | Reflete o que roda; HUD pensado para largura | Janela estreita no desktop também é bloqueada; fallback `.catch(false)` incoerente |
| B. A + restringir o overlay a dispositivos de toque e alinhar `.catch(true)` | Corrige as duas incoerências | Pequena mudança em `App.tsx`/`localStorage.ts` (arquivo crítico) |
| C. Suportar retrato (HUD responsivo) | Alcance maior em celular | Redesenho de HUD e controles; fora do escopo atual |
| D. Joystick fixo como padrão, flutuante opcional | Posição previsível | Contraria o motivo registrado no comentário (não mover para a esquerda) |

## Fatos técnicos verificados
| Afirmação | Fonte | Verificado em |
|---|---|---|
| Padrão `floatingStick: true` | `src/utils/localStorage.ts:209`; `SettingsScene.ts:312`, `:530` | 2026-10-10 |
| Schema usa `.catch(false)` para `floatingStick` | `localStorage.ts:237` | 2026-10-10 |
| Flutuante reposiciona a base no toque | `VirtualJoystickSystem.ts:326-329` | 2026-10-10 |
| Manifest em paisagem | `public/manifest.webmanifest:8` | 2026-10-10 |
| Overlay depende só de `innerHeight > innerWidth` | `RotateDeviceOverlay.tsx:21-39` | 2026-10-10 |
| `RotateDeviceOverlay` é montado em `App.tsx` | `App.tsx:265` | 2026-10-10 |

## Suposições (não verificadas)
- Que o HUD fica ilegível em retrato (afirmação do comentário do componente; nenhum teste em retrato foi feito).
- Que o joystick flutuante é confortável em aparelhos reais: não validado, precisa de playtest humano.

## Recomendação
**Opção B.** Mantém paisagem e joystick flutuante (o que existe) e remove duas incoerências pequenas; retrato (C) é uma decisão de escopo maior e fica para o responsável.

## Decisão
_Em branco até o responsável decidir._

## Consequências
- Se B: ajuste em `RotateDeviceOverlay.tsx` e `localStorage.ts` (arquivo crítico), teste de `localStorage` para o padrão.
- Se C: spec de HUD responsivo; afeta `GameplayHUD.tsx` e o manifest.
- `docs/product/mobile-first-bible.md` (não ratificado) cita as mesmas metas.
