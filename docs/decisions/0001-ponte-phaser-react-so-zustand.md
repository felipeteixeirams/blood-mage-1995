# 0001 — Ponte Phaser-React: "só Zustand, sem CustomEvent"

**Mestre:** [decisions](README.md)
**Status:** Proposta
**Proposta por:** Claude (Sonnet 5.5), 2026-10-10
**Aprovada por:**

## Contexto
O `CLAUDE.md` diz que a comunicação React-Phaser é "só Zustand (`src/store/gameStore.ts`); sem `CustomEvent`/`window.dispatchEvent` para gameplay". O código cumpre a parte do `CustomEvent`, mas o Phaser fala com o React por **três** caminhos, não um:

1. Store Zustand: React para Phaser por `useEffect` em `src/game/PhaserGame.tsx` (comando + reset: `activeSkillTrigger`, `respawnRequested` etc.; valor contínuo: `touchMoveInput`, `dragAim`); Phaser para React por `useGameStore.getState().setX(...)` (ex.: `Player.ts` chama `setPlayerStats` em 9 pontos, `GameScene.ts` linhas 808 e 847).
2. Callbacks `GameSceneCallbacks` (`onStatsUpdate`, `onLevelUp`, `onGameOver`) guardados em `game.registry['reactCallbacks']` (`PhaserGame.tsx:80`, `GameScene.ts:214` e `:224`) e chamados por `GameScene.update()` (`:1656`, a cada frame) e `CombatEffectsSystem.ts` (`:274`, `:307`). Em `PhaserGame.tsx:24` o `onStatsUpdate` é a própria ação `setPlayerStats` do store, então `playerStats` recebe escrita por dois caminhos (callback por frame e chamadas diretas em `Player.ts`).
3. Leitura/escrita direta do store por entidades e sistemas (`Enemy`, `CombatFeel`, `ContractSystem`, `CollisionHandlers` etc.).

Existir no código não é decisão: a regra "só Zustand" é uma instrução do `CLAUDE.md`, e o canal de callbacks existe sem registro de decisão.

## Opções
| Opção | Prós | Contras |
|---|---|---|
| A. Manter os dois canais e reescrever a regra: "sem `CustomEvent`/`window.dispatchEvent`; Zustand para estado; callbacks do registry só para `onStatsUpdate`/`onLevelUp`/`onGameOver`" | Regra passa a descrever o código; custo zero; mantém a proteção contra o padrão que gerou bugs | Dois padrões para aprender; escrita dupla em `playerStats` continua |
| B. Migrar os três callbacks para campos/ações do store e remover `game.registry['reactCallbacks']` | Um único canal; regra literal | Mexe em `GameScene.ts`, `CombatEffectsSystem.ts`, `PhaserGame.tsx` (arquivos críticos); sem ganho funcional medido |
| C. Eventos tipados do Phaser (`game.events`) para Phaser para React | Desacopla sem store | Terceiro padrão; contraria a regra atual |

## Fatos técnicos verificados
| Afirmação | Fonte | Verificado em |
|---|---|---|
| Não há `CustomEvent`/`dispatchEvent` de gameplay em `src/` (só em testes e `addEventListener` de gamepad) | `grep -rnE "CustomEvent\|dispatchEvent" src` | 2026-10-10 |
| `game.registry` guarda `reactCallbacks`; `GameScene.init()` lê de lá | `PhaserGame.tsx:80`; `GameScene.ts:214`, `:224` | 2026-10-10 |
| `GameScene.update()` chama `callbacks.onStatsUpdate({...stats})` a cada frame | `GameScene.ts:1656-1657` | 2026-10-10 |
| `Player.ts` chama `setPlayerStats({...this.stats})` em 9 linhas | `Player.ts:343,345,1146,1155,1167,1173,1194,1224,1233` | 2026-10-10 |
| Comentário de `GameScene.ts:829` registra um bug de valor revertido por `setPlayerStats` após dano | `GameScene.ts:829` (comentário) | 2026-10-10 |

## Suposições (não verificadas)
- Que a escrita dupla em `playerStats` nunca produz estado inconsistente (ordem entre `Player.ts` e o callback por frame não foi auditada).
- Que a migração B é viável sem regressão de desempenho (re-render do React por frame não foi medido).

## Recomendação
**Opção A.** O código já cumpre o que a regra protege (nenhum `CustomEvent`); migrar os callbacks mexe em arquivos críticos sem benefício comprovado.

## Decisão
_Em branco até o responsável decidir._

## Consequências
- Se A: atualizar `CLAUDE.md` e `docs/architecture/state-management.md` para descrever os dois canais; nenhuma mudança de código.
- Se B: spec própria (arquivos críticos `GameScene.ts`, `PhaserGame.tsx`, `CombatEffectsSystem.ts`), testes de regressão do HUD e de level-up/game over.
- Nenhuma spec depende deste ADR hoje.
