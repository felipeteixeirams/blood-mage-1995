# Estrutura do Repositório

**Mestre:** [engineering](README.md)
**Status:** verificado
**Verificado em:** 2026-10-10
**Método:** estático
**Fonte:** `src/`, `.agents/memory/`, `.claude/`, `.husky/`

Verificado por leitura dos diretórios. Nenhum script foi executado.

## Estrutura de diretórios

```
src/
  App.tsx, main.tsx, index.css
  components/        modais e telas React; hud/ (HUD em jogo); ui/ (shadcn/Radix)
  data/              JSON de domínio (achievements, campaignItems, campaignQuests, codex,
                     contracts, dialogues, monsters, palettes, relics, runModifiers, spells,
                     talents, upgrades, waves)
  game/
    PhaserGame.tsx   monta o Phaser.Game principal
    scenes/          BootScene, GameScene, TitleScene, SettingsScene, RecordsScene
    objects/         Player, Enemy, Projectile, Collectible, Loot, Scavengeable, Traps
    systems/         41 módulos de produção + testes
    shaders/         AtmosphericTreeShader
    animations/      animationManager
    assets/          assetManifest (.ts/.json) e teste de integridade
  hooks/             useFloatingJoystick, useGamepadUINavigation, useJoystick, usePWA,
                     use-mobile, use-toast
  i18n/              ptBR.ts, enUS.ts, index.ts
  lib/utils.ts       helper de classes (alias @/lib/utils)
  pages/             not-found.tsx
  store/             gameStore.ts
  types/             game.ts, campaign.ts
  utils/             soundEngine, bgmSynthesizer, localStorage, SaveMigration, logger,
                     telemetry, textureGenerator, uiTextures, equipmentPalette, haptics,
                     joystickResponse, orientation
tests/               setup.ts (setup global do Vitest) e e2e/ (Playwright)
api/log.ts           handler HTTP (IncomingMessage/ServerResponse) na raiz
artifacts/           api-server, bloodmage, mockup-sandbox (workspaces)
lib/                 api-client-react, api-spec, api-zod, db (workspaces)
scripts/             utilitários .cjs/.py/.sh (assets, PWA, auditoria de docs) + pacote @workspace/scripts
public/              assets, fonts, audio_samples, ícones e manifest PWA
```

- `src/` não importa nada de `lib/` nem de `@workspace/*` (busca em 2026-10-10); `@/lib/utils` é `src/lib/utils.ts`.
- `artifacts/bloodmage/` tem `package.json`, `vite.config.ts`, `index.html` e `public/`, sem `src/` próprio; seu `tsconfig.json` inclui `../../src/**/*`. O `package.json` dele usa o mesmo nome (`@workspace/bloodmage`) do `package.json` da raiz.

## Limites da verificação

- A estrutura de diretórios foi lida diretamente.

## Pastas de ferramenta
| Pasta | Conteúdo |
|---|---|
| `.claude/` | Configuração do Claude Code: `claude.json`, `.claudeignore` e `skills/` (fonte única das skills do Phaser 4 e do SpriteCook) |
| `.agents/memory/` | Memória de agente (Google AI Studio); mantida sem alteração |
| `.jules/` | Diários de aprendizado do Jules (uso eventual); mantidos sem alteração |
| `.husky/` | Hook de pre-commit (`docs:check` e `verify`) |
