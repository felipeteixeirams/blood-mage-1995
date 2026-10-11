# Opções e configurações

**Mestre:** [ui](README.md)
**Status:** verificado
**Verificado em:** 2026-10-11

A tela de opções (`SettingsModal` + `SettingsScene`), o painel rápido do HUD, cada campo de `GameSettings` (chave, padrão, onde é lido) e a persistência. Leitura estática; nada foi executado.

## Telas e fluxo

| Item | Como é hoje |
|---|---|
| Abertura | `App.tsx` monta `SettingsModal` quando `isSettingsOpen`; aberto pelo menu principal (`onOpenSettings`) e pelo botão CONFIG do overlay de pausa |
| `SettingsModal` | cria um `Phaser.Game` próprio (960x540, `noAudio`, `Scale.FIT`) com a cena `settings` e passa por `game.registry`: `settings`, `onUpdateSettings` (= `updateSettings` da store), `onClose`. Reenvia o registry a cada mudança de props; destrói o jogo ao fechar |
| `SettingsScene` | estado local `settingsState` copiado de `registry.get('settings')` (se vazio, usa um objeto fixo de 12 campos). Cada slider, toggle ou seletor muda `settingsState` e chama `onUpdateSettings` na hora (nos sliders, a cada `pointermove`), então tudo é gravado ao vivo |
| Botões | APLICAR: chama `onUpdateSettings` e fecha. SAIR: só fecha (alterações já aplicadas; `savedState` é gravado mas nunca lido). RESTAURAR: veja Pontos suspeitos |
| Painel rápido | `GameplayHUD` (estado local `isQuickSettingsOpen`); descrito em [hud.md](hud.md) |

Controles da `SettingsScene` (ordem de tela): sliders `sfxVolume` (0 a 1), `bgmVolume` (0 a 1), `virtualControlsOpacity` (0,2 a 1), `touchSensitivity` (0,5 a 2); toggles `crtFilter`, `fearDistortionEnabled`, `tinnitusEnabled`, `leftHandedMode`, `floatingStick`; seletores cíclicos de idioma (`pt-BR`/`en-US`), escala do stick (`small`, `medium`, `large`) e `contentIntensity` (`full`/`reduced`). Só `crtFilter` tem efeito local na própria cena (opacidade das scanlines 0,16 ou 0).

## Campos de `GameSettings`

Padrão = `defaultSettings` em `src/utils/localStorage.ts`. Edição: **O** = SettingsScene, **H** = painel rápido do HUD, **-** = nenhuma UI.

| Chave | Padrão | Edição | Onde é lida |
|---|---|---|---|
| `language` | `pt-BR` | O | `src/i18n/index.ts` (`t`, `useTranslation`), `SettingsScene` |
| `minimapVisible` | `true` | - | `hud/Minimap.tsx` |
| `minimapAlpha` | 0,65 | - | `hud/Minimap.tsx` |
| `animatedPortrait` | `true` | H | `hud/PlayerStatus.tsx` |
| `crtFilter` | `true` | O, H | `App.tsx` (overlay), `PostFXSystem` |
| `sfxVolume` | 0,8 | O | `soundEngine.setVolumes` (via `App.tsx` e `updateSettings`) |
| `bgmVolume` | 0,3 | O, H, `SoundTestModal` | `soundEngine.setVolumes` |
| `touchSensitivity` | 1,0 | O | `GameScene` (joysticks), `GameplayHUD` (`useFloatingJoystick`) |
| `virtualControlsOpacity` | 0,7 | O, H | `GameScene`, `GameplayHUD` |
| `controlsMode` (`auto`/`touch`/`keyboard`) | `auto` | - | `GameScene` (joysticks `enabled` se diferente de `keyboard`), `GameplayHUD` (`showTouchControls`) |
| `joystickDeadzone` | 0,08 | - | `GameScene`, `GameplayHUD` |
| `joystickCurve` | 1,8 | - | `GameScene`, `GameplayHUD` |
| `virtualStickScale` | `medium` | O, H | `GameScene` (0,8 / 1,0 / 1,25) |
| `leftHandedMode` | `false` | O, H | `GameScene` (zonas), `GameplayHUD` (posições) |
| `floatingStick` | `true` | O, H | `GameScene`, `VirtualJoystickSystem` |
| `screenShakeEnabled` | `true` | H | `CombatFeel`, `CollisionHandlers` |
| `flashesEnabled` | `true` | H | `CollisionHandlers` |
| `fearDistortionEnabled` | `true` | O | `PostFXSystem` (`?? true`) |
| `tinnitusEnabled` | `true` | O | `soundEngine` (`?? true`) |
| `atmosphereEffectsEnabled` | `true` | H | `GameScene` (`!== false`) |
| `lowPerformanceParticles` | `false` | - | `AdvancedParticles`, `AtmosphereSystem`, `LightingPolish` |
| `highContrastDamageTexts` | `false` | H | `CombatEffectsSystem` |
| `postProcessingEnabled` | `true` | - | `GameScene`, `PostFXSystem`, `AtmosphereSystem`, `EnemyTelegraphSystem`, `LightingPolish` |
| `contentIntensity` | `full` | O | `DismembermentSystem`, `BloodSplatterSystem` (`reduced` altera gore) |
| `hudLayout` | sem padrão | modo EDITAR do HUD (`SkillsOverlay`, `GameplayHUD`) | `SkillsOverlay` |
| `activePaletteId` | sem padrão (lido como `crimson`) | H | `Player.ts` |

## Persistência

- Chave de `localStorage`: `bloodmage_1995_settings`; acesso só por `loadSettings`/`saveSettings` em `src/utils/localStorage.ts`.
- A store lê `loadSettings()` ao ser criada; `updateSettings(novo)` grava (`saveSettings`), chama `soundEngine.setVolumes(sfx, bgm)` e substitui `settings` inteiro (cada chamador envia o objeto completo).
- `SettingsSchema` (Zod, `.strict()`): cada campo tem `.catch(<padrão>)`; chave desconhecida (ou entrada que não é objeto) faz o `safeParse` falhar e o código devolve `defaultSettings` inteiro (na leitura) ou grava `defaultSettings` (na gravação).
- Ranges do schema: `minimapAlpha` 0 a 1, volumes 0 a 1, `touchSensitivity` 0,5 a 2, `virtualControlsOpacity` 0,2 a 1, `joystickDeadzone` 0 a 0,5, `joystickCurve` 0,5 a 3.
- Campos opcionais no tipo: todos os de `GameSettings` exceto `minimapVisible`, `minimapAlpha`, `animatedPortrait`, `crtFilter`, `sfxVolume`, `bgmVolume`, `touchSensitivity`, `virtualControlsOpacity`, `controlsMode`. Por isso o código lê vários com `!== false` ou `??`.

## Pontos suspeitos (o código faz isso hoje; nada foi corrigido)

- RESTAURAR monta um objeto de 14 campos, com `sfxVolume` 1,0, `bgmVolume` 1,0 e `virtualControlsOpacity` 0,5, diferentes de `defaultSettings` (0,8, 0,3 e 0,7). O objeto não tem `language`, `joystickDeadzone`, `joystickCurve`, `screenShakeEnabled`, `flashesEnabled`, `contentIntensity`, `hudLayout`, `activePaletteId` etc., e substitui `settings` na store por ele (campos ausentes ficam `undefined` em memória; no próximo `saveSettings` o schema repõe os padrões do `catch`).
- O schema usa `floatingStick: z.boolean().catch(false)`, enquanto `defaultSettings.floatingStick` é `true`: valor inválido salvo vira `false`.
- Rótulo CRT fixo em português no código (`SettingsScene.toggleDefs`); idem títulos, botões e dicas da cena (ver [i18n.md](i18n.md)).
- `controlsMode`, `joystickDeadzone`, `joystickCurve`, `minimapVisible`, `minimapAlpha`, `lowPerformanceParticles` e `postProcessingEnabled` só mudam editando o `localStorage`: nenhuma UI os escreve.
- Gravação no `localStorage` a cada `pointermove` de slider (chamada a `updateSettings`).

## Onde fica no código

- `src/components/SettingsModal.tsx` (`SettingsModal`), `src/game/scenes/SettingsScene.ts` (`SettingsScene`, `getSliderDefs`, `toggleDefs`, `buildButtons`, `BASE_W`/`BASE_H`).
- `src/types/game.ts` (`GameSettings`, `Language`), `src/utils/localStorage.ts` (`defaultSettings`, `SettingsSchema`, `loadSettings`, `saveSettings`), `src/store/gameStore.ts` (`settings`, `updateSettings`).
- `src/components/GameplayHUD.tsx` (painel rápido), `src/App.tsx` (abertura e `crtFilter`).

Relacionados: [accessibility.md](accessibility.md), [input-and-controls.md](input-and-controls.md), [i18n.md](i18n.md), [hud.md](hud.md), [../architecture/state-management.md](../architecture/state-management.md).
