# Códice e Bestiário

**Mestre:** [gameplay](README.md)
**Status:** verificado
**Verificado em:** 2026-10-11

Meta-progressão do Códice/Bestiário, persistida em `localStorage` e paga em Cristais de Sangue (`bloodCrystals`): `src/data/codex.json`. Leitura estática do código; nenhum teste rodado.

## Entradas e marcos

`codex.json` tem **17** entradas: 11 `enemies`, 3 `relics`, 3 `lore`. Campos comuns: `id, category, title, subtitle, lore, icon, unlockCriteria`; inimigos têm `monsterId` e `milestones[]`; relíquias têm `relicId`.

| Entrada (inimigo) | Marcos: abates -> cristais |
|---|---|
| skeleton_warrior | 1->15, 10->30, 25->60, 50->120 |
| cultist_acolyte | 1->20, 10->40, 25->80, 50->150 |
| hell_hound | 1->20, 10->45, 25->90, 50->180 |
| zombie_shambler | 1->15, 10->35, 25->70, 50->140 |
| bat_swarm | 1->10, 10->25, 25->50, 50->100 |
| blood_specter | 1->25, 10->50, 25->100, 50->200 |
| vampire_stalker, werewolf_lycan | 1->30, 10->60, 25->120, 50->220 |
| flesh_golem | 1->35, 5->70, 15->140, 30->250 |
| gore_abomination | 1->40, 5->80, 15->160, 30->300 |
| necro_lord_boss | 1->100, 3->250, 5->500, 10->1000 |

Relíquias: `relic_selo_hemorragico`, `relic_olho_de_carmim`, `relic_anel_do_pacto_sanguineo`. Lore: `lore_origem_hemomancia`, `lore_ordem_dos_martires`, `lore_santuario_sangue`. `scout_beast` existe em `monsters.json` mas não tem entrada.

### Regras (`CodexSystem`, classe estática)

- Estado `CodexState` = `{enemyKills: Record<monsterId, n>, unlockedEntries: string[], claimedMilestones: Record<entryId, killCount[]>}`, chave `bloodmage_1995_codex`. Estado inicial: `unlockedEntries = ['lore_origem_hemomancia', 'relic_selo_hemorragico']`.
- `onEnemyKilled(monsterId)` (store, chamado por `CombatEffectsSystem` a cada morte): `recordKill` soma 1 em `enemyKills`, adiciona a entrada do monstro a `unlockedEntries`, salva; depois avança objetivos de quest `kill_enemy`.
- `isEntryUnlocked`: está em `unlockedEntries`, ou (entrada com `monsterId`) tem >= 1 abate.
- `claimMilestone(entryId, killCount)`: só se a entrada tem `monsterId` e marco com esse `killCount`, abates >= `killCount` e marco ainda não resgatado. A store então salva, soma `rewardCrystals` via `addBloodCrystals` (aplica `bloodCrystalMultiplier` de relíquias) e toca `playOrbPickup`.
- `calculateCompletionPercentage`: 1 ponto por entrada desbloqueada + 1 por marco resgatado, sobre (17 + total de marcos = 17 + 44); arredonda e limita a 100.
- `unlockCodexEntry(id)` existe na store, mas nenhum chamador fora dela foi encontrado: relíquias e lore além das duas iniciais não desbloqueiam por nenhum caminho de código hoje (o `unlockCriteria` do JSON não é aplicado).

### CodexModal

Abre por `isBestiaryOpen`/`isCodexOpen` (os dois setters mantêm ambos sincronizados; `App.tsx` lê `isBestiaryOpen`; origem: `TitleScene` -> `onOpenBestiary` -> `setBestiaryOpen`). `BestiaryModal.tsx` é só um wrapper de `CodexModal`, não montado em lugar nenhum. Usa `ModalBase`, lê `codexState`, `bloodCrystals`, `getLoreCompletionPercentage()`.

- Cabeçalho: % de conclusão e saldo de cristais. Três abas (`enemies`, `relics`, `lore`).
- Inimigos: bloqueado mostra "??? [DESCONHECIDO]" e `unlockCriteria`; desbloqueado mostra HP, dano, velocidade e XP lidos de `monsters.json`, contador de abates e um botão por marco (bloqueado / "RESGATAR +N" / "RESGATADO").
- Relíquias: efeito = `description` de `relics.json` pelo `relicId`. Lore: texto em itálico.
- A maioria dos textos fixos do modal está em pt-BR no próprio componente; só título e rótulos de aba usam `t('codex.*')`.

## Onde fica no código

- `src/data/codex.json`.
- `src/store/gameStore.ts`: `codexState`, `onEnemyKilled`, `claimCodexMilestone`, `unlockCodexEntry`, `getLoreCompletionPercentage`.
- `src/game/systems/CodexSystem.ts` (`CodexSystem`, `codexEntries`).
- `src/components/CodexModal.tsx`, `BestiaryModal.tsx`.
- `src/utils/localStorage.ts` (`loadCodexState`); tipos em `src/types/game.ts` (`CodexState`, `CodexEntry`).

Relacionados: Conquistas (achievements.md, outra meta-progressão paga em cristais); [state-management](../architecture/state-management.md); [modals-and-screens](../ui/modals-and-screens.md).
