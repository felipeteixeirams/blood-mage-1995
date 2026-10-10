# Acessibilidade

**Mestre:** [product](README.md)
**Status:** verificado
**Verificado em:** 2026-10-10

Verificação por leitura estática do código.

## Ajustes existentes

Campos de `GameSettings` (`src/types/game.ts`), validados por Zod com valor padrão em `src/utils/localStorage.ts` (`defaultSettings`).

| Campo | Efeito (onde é lido) | Padrão |
|---|---|---|
| `screenShakeEnabled` | tremor de tela (toggle em `GameplayHUD.tsx`) | `true` |
| `flashesEnabled` | flashes (toggle em `GameplayHUD.tsx`) | `true` |
| `fearDistortionEnabled` | distorção de tela de medo, lida em `PostFXSystem.ts` | `true` |
| `tinnitusEnabled` | zumbido de ameaça (toggle em `SettingsScene.ts`) | `true` |
| `highContrastDamageTexts` | alto contraste nos números de dano (`CombatEffectsSystem.ts`) | `false` |
| `contentIntensity` (`full`/`reduced`) | `reduced` altera desmembramento e sangue (`DismembermentSystem.ts`, `BloodSplatterSystem.ts`) | `full` |
| `leftHandedMode` | inverte zonas de movimento/mira e posição das habilidades (`GameScene.ts`, `GameplayHUD.tsx`) | `false` |
| `virtualStickScale` (`small`/`medium`/`large`) | escala do joystick 0.8x / 1.0x / 1.25x (`GameScene.ts`) | `medium` |
| `floatingStick` | joystick flutuante | `true` |
| `touchSensitivity`, `joystickDeadzone`, `joystickCurve`, `virtualControlsOpacity` | controles virtuais | 1.0, 0.08, 1.8, 0.7 |
| `hudLayout` | posição/tamanho dos botões do HUD (modo "Layout de botões" em `GameplayHUD.tsx`) | sem padrão |
| `activePaletteId` | paleta cosmética de sangue: `crimson`, `corrupted`, `golden`, `shadow` (`src/data/palettes.json`) | `crimson` |

- Onde se configura: painel rápido em `GameplayHUD.tsx` e `SettingsModal.tsx` (que monta a cena Phaser `SettingsScene.ts`).
- `activePaletteId` é cosmético (cor do sangue), não um modo para daltonismo.
- Safe-area: classes `.safe-area-*` em `src/index.css` com `env(safe-area-inset-*)`, usadas no HUD.
- `aria`: só `aria-modal`/`aria-label` em `SettingsModal.tsx` e `aria-label` nos botões de `SkillsOverlay.tsx`.

## O que não existe no código

Modo para daltonismo, leitor de tela, navegação completa por teclado nos menus, legendas de áudio. Não há decisão registrada de priorizar ou descartar.

## Convenção observada nos toggles existentes

Campo opcional em `GameSettings`, schema Zod com `.catch(<padrão>)` em `localStorage.ts`, controle na UI de configurações.

## Não verificado

- Comportamento em runtime (só leitura estática).
