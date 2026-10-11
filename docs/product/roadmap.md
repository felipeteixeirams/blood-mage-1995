# Roadmap

**Mestre:** [product](README.md)
**Status:** verificado
**Verificado em:** 2026-10-10
**Método:** estático
**Fonte:** `src/data/monsters.json`, `src/data/relics.json`, `src/game/objects/Player.ts`, `src/game/scenes/`

Este documento lista só o que o código faz hoje. Não há roadmap ratificado; fases e prazos de documentos antigos foram removidos.

## Estado verificável hoje (leitura estática)

| Área | O que o código faz | Evidência |
|---|---|---|
| Dash | duração 150 ms, invulnerabilidade 200 ms, recarga 3000 ms | `src/game/objects/Player.ts` (`DASH_DURATION`, `DASH_INVULNERABILITY`, `DASH_COOLDOWN`) |
| Hit-stop | 40 ms; 80 ms em habilidade especial | `src/game/systems/CombatFeel.ts` |
| Vibração | `navigator.vibrate` em impacto/morte | `CombatFeel.ts`, `src/utils/haptics.ts`, `gameStore.ts` |
| Relíquias | 8 entradas | `src/data/relics.json` |
| Prestígio | dados persistidos em `bloodmage_1995_prestige` | `src/utils/localStorage.ts` |
| Conquistas, codex, estatísticas de run | persistidos com Zod; `AchievementSystem.ts` usa `loadAchievementProgress`/`saveAchievementProgress` | `localStorage.ts`, `gameStore.ts` |
| Boss | `necro_lord_boss` ("Senhor das Sombras (BOSS)") em `monsters.json` | `src/data/monsters.json` |
| Cenas Phaser | `BootScene`, `TitleScene`, `GameScene`, `RecordsScene`, `SettingsScene` | `src/game/scenes/` |
| Telemetria | Sentry (`main.tsx`, só se `VITE_SENTRY_DSN` definido) e logger remoto para `/api/log` | ver [operations](../operations/README.md) |
| PWA | `vite-plugin-pwa` configurado | ver [release-strategy.md](release-strategy.md) |
| Conta/nuvem | inexistente | ver [account-and-data.md](account-and-data.md) |

## Intenção (não ratificada)

Itens que documentos antigos tratavam como próximas fases. Nenhum tem decisão do responsável e nenhum existe no código:

- Chefes multiestágio com fases de padrões de bala ("Plutonia" existe só como tema de música `boss_plutonia`; "Senhor da Morte" não aparece no código).
- Rebalanceamento de recompensas e loot.
- Beta com jogadores reais e análise de retenção.
- Login, cloud save, monetização, publicação em lojas.

## Não verificado

- Sistemas de câmera/zoom, terreno procedural, mira inteligente e onboarding descritos em documentos antigos não foram reconferidos aqui; consulte [architecture](../architecture/README.md).
