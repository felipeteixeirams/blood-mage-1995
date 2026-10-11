# Testes Unitários (Vitest)

**Mestre:** [testing](README.md)
**Status:** verificado
**Verificado em:** 2026-10-10
**Método:** estático
**Fonte:** `tests/setup.ts`, `src/`, `src/components/`, `src/data/spells.json`

Configuração e inventário dos testes unitários. Conferido por leitura estática de `vitest.config.ts`, `tests/setup.ts` e da lista de arquivos; os testes não foram executados (sem `node_modules` no worktree), então este documento não afirma que passam.

## Configuração (`vitest.config.ts`)

| Item | Valor |
|---|---|
| Ambiente | `jsdom` (`globals: true`) |
| Arquivos incluídos | `src/**/*.test.{ts,tsx}` (a pasta `tests/` não entra: ali ficam o setup e os e2e) |
| Setup | `tests/setup.ts` |
| Aliases | `@` -> `src`, `@assets` -> `attached_assets` |
| Plugin | `@vitejs/plugin-react` |
| Cobertura | provider `v8`, reporters `text` e `json-summary`; mede só `src/utils/localStorage.ts`, `joystickResponse.ts`, `src/store/gameStore.ts`, `CombatFeel.ts`, `ContractSystem.ts`, `textureGenerator.ts` e `PostFXSystem.ts`, com mínimo de 80% em linhas, statements e funções |

## `tests/setup.ts`

Registra `vi.mock('phaser', () => ({ default: {} }))` como mock padrão para toda a suíte. Motivo registrado no arquivo: o Phaser 4 acessa `canvas.getContext('2d')` ao ser usado em runtime, o que falha em jsdom sem o pacote `canvas`. Suítes que precisam de mais do Phaser (por exemplo `Enemy.test.ts`, `Projectile.test.ts`, `Player.test.ts`) declaram o próprio `vi.mock('phaser', ...)`, que sobrescreve o padrão naquele arquivo.

## Inventário (54 arquivos `*.test.ts(x)` em `src/`)

| Pasta | Arquivos | Exemplos |
|---|---|---|
| `src/game/systems/` | 36 | `DungeonGenerator`, `LootSystem`, `StatusEffectSystem`, `VirtualJoystickSystem`, `ObjectPool`, `PerformanceMonitor`, `AchievementSystem`, `ShadowSystem` |
| `src/game/objects/` | 3 | `Player`, `Enemy`, `Projectile` |
| `src/utils/` | 7 | `localStorage`, `joystickResponse`, `soundEngine`, `logger`, `textureGenerator`, `bgmSynthesizer`, `equipmentPalette` |
| `src/store/` | 1 | `gameStore` |
| `src/components/` | 1 | `PrestigeModal` |
| `src/tests/` | 1 | `resourceSystem` (valida `src/data/spells.json`) |
| `src/game/animations`, `src/game/assets`, `src/game/shaders`, `src/hooks`, `src/i18n` | 1 cada | |

Contagem aproximada de casos: 554 ocorrências de `it(`/`test(` nos arquivos de teste (busca textual; inclui blocos aninhados e não é o número reportado pelo Vitest).

## Não verificado

- Que a suíte passa hoje, e o número real de testes (não executada).
- Se os limites de cobertura de 80% são atingidos (`pnpm test:coverage` não foi executado).
