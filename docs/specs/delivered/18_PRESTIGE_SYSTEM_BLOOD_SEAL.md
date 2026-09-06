---
agent_context: progression-engineer, backend-engineer
target_module: docs/specs/delivered
priority: high
status: completed
last_updated: 2026-09-06
tags: [specs, delivered, prestige, blood-seal, meta-progression, difficulty]
---

# 🏅 Spec 18: Sistema de Prestígio 'Blood Seal' (Prestige Progression)

## Objetivo
Prover um ciclo de progressão de fim de jogo (endgame) onde o jogador pode voluntariamente realizar o ritual de sacrifício para resetar o nível e atributos base da corrida em troca de Selos de Sangue permanentes e liberação de novas dificuldades.

---

## Status
🟢 **COMPLETO** (Lógica de Metajogo, Atributos, Persistência e Sincronização com o Player vivo) / 🟡 **PARCIAL** (Modal de Interface React em Backlog — ver `docs/specs/backlog/06_SISTEMA_DE_PRESTIGIO_BLOOD_SEAL.md`)

---

## O que foi Entregue
- **Lógica e Ações de Prestígio no Store (`gameStore.ts`):**
  - Implementado o método `canPrestige()` (nível ≥10 **OU** andar ≥3 **OU** 30 abates — qualquer um dos três).
  - Implementado o método `performPrestige(sealToAllocate)` que eleva o nível de prestígio (até o teto de 10), concede pontos não gastos de Selo de Sangue e desbloqueia dificuldades superiores (*Pesadelo* no nível 1, *Inferno* no nível 3).
  - Implementada a função `getPrestigeModifiers()` que calcula os 5 bônus acumulativos permanentes (`damageMult`, `bonusMaxHp`, `cdrBonus`, `vampBonus`, `dropMult`).
- **Modificadores Passivos em Combate (`Player.ts`):**
  - Aplicação dos multiplicadores de dano, bônus de vida máxima, redução de cooldown e vampirismo diretamente nos getters do jogador (`getEffectiveDamageMultiplier`, `getEffectiveMaxHp`, `getEffectiveCooldownReduction`, `getEffectiveVampirism`).
  - `dropMult` (bônus do selo `macabre_fortune`) aplicado em `CombatEffectsSystem.ts` no cálculo real de chance de drop de loot (`LootSystem.rollLootChance(dropMult)`).
- **Sincronização do reset com a instância viva do Player (`GameScene.applyPrestigeReset()` + `PhaserGame.tsx`):**
  - `performPrestige()` só tem acesso à store — não à instância viva de `Player.ts`. Segue o mesmo padrão "Comando + Reset" já usado por `respawnPlayer()`/`useCurativeItem()`: `performPrestige()` seta `prestigeResetRequested: true`, `PhaserGame.tsx` reage e chama `GameScene.applyPrestigeReset()`, que muta `player.stats` diretamente e empurra de volta pra store.
- **Persistência Centralizada e Validada com Zod (`localStorage.ts`):**
  - Schema `PrestigeDataSchema` com sanitização e recuperações automáticas registradas sob a chave `bloodmage_1995_prestige`.
- **Efeitos Sonoros (`soundEngine.ts`):**
  - `playBloodNova()` no momento do sacrifício, `playRunicEmpowerment()` ao alocar um selo, `playMenuSelect()` ao trocar de dificuldade/abrir o painel.

---

## Referência no Código
- `src/store/gameStore.ts` — Ações `canPrestige`, `performPrestige`, `allocateBloodSeal`, `setDifficulty`, `getPrestigeModifiers`, `prestigeResetRequested`/`setPrestigeResetRequested`.
- `src/game/scenes/GameScene.ts` — `applyPrestigeReset()` (sincroniza a instância viva do Player).
- `src/game/PhaserGame.tsx` — `useEffect` que consome `prestigeResetRequested`.
- `src/game/systems/LootSystem.ts` / `CombatEffectsSystem.ts` — `rollLootChance(dropMult)` aplicando o bônus do selo `macabre_fortune`.
- `src/utils/localStorage.ts` — Funções `loadPrestigeData` e `savePrestigeData` com validação Zod.
- `src/game/objects/Player.ts` — Leitura de `getPrestigeModifiers()` para aplicar multiplicadores nos atributos do caçador.
- `src/utils/soundEngine.ts` — `playBloodNova`, `playRunicEmpowerment`, `playMenuSelect`.
- `src/types/game.ts` — Interfaces `PrestigeData`, `BloodSealType` e `GameDifficulty`.

---

## Validação
- Suite unitária dedicada em `src/store/gameStore.test.ts` (`describe('prestige system (Blood Seal)')`) e `src/game/systems/LootSystem.test.ts` — cobrindo `canPrestige`, `performPrestige` (incluindo o trigger de sincronização), `allocateBloodSeal`, `getPrestigeModifiers` (os 5 bônus) e o escalonamento de `dropMult` na chance de drop.
- Verificado ao vivo via Playwright (jogo rodando de verdade, não só mock): reset de nível/andar/wave/HP confirmado na instância viva do `Player` após `performPrestige()`, sobrevivendo a um evento de dano subsequente (que antes revertia o reset — ver "Notas & Divergência Encontrada" abaixo).
- `pnpm test`: 443/443. `pnpm run typecheck`: 0 erros.
- Integração de persistência validada com chave `bloodmage_1995_prestige`.

---

## Notas & Divergência Encontrada

- **Status do Modal UI:** a camada de backend, persistência, regras de negócio e cálculo de atributos de combate do sistema de Prestígio estão 100% implementadas e operacionais no motor. O modal React dedicado para acionar o prestígio visualmente na Safe House ainda não foi construído — ver `docs/specs/backlog/06_SISTEMA_DE_PRESTIGIO_BLOOD_SEAL.md` para o gap real. Hoje só é acionável via `useGameStore.getState().performPrestige()` (console/dev).

- **Bug crítico encontrado e corrigido em 2026-09-06** (ver
  `docs/reviews/03_AUDITORIA_BASE_DOCUMENTAL_2026_09.md`): a versão
  original de `performPrestige()` resetava nível/andar/wave/HP só na
  store — nunca na instância viva de `Player.ts` (`this.stats`), que é
  quem de fato comanda o jogo rodando. Confirmado ao vivo: logo após
  chamar `performPrestige()`, a store mostrava o reset limpo, mas
  `gameScene.player.stats` continuava com os valores antigos; o próximo
  evento natural de sincronização (qualquer dano recebido chamando
  `setPlayerStats({...this.stats})`) sobrescrevia o reset da store de
  volta pros valores antigos. Efeito líquido: o jogador ganhava o Selo de
  Sangue permanente e desbloqueava dificuldade sem nunca pagar o preço (o
  reset nunca acontecia de verdade). Corrigido com o padrão "Comando +
  Reset" descrito acima em "O que foi Entregue".

- **Bug encontrado e corrigido em 2026-09-06:** o bônus de drop rate do
  selo `macabre_fortune` (`getPrestigeModifiers().dropMult`) era calculado
  corretamente mas nunca lido em lugar nenhum do código — investir nesse
  selo não tinha efeito nenhum. Corrigido ligando o multiplicador em
  `LootSystem.rollLootChance()`/`CombatEffectsSystem.ts`.

- **Zero cobertura de teste** existia pra este sistema antes de
  2026-09-06 (a seção "Validação" original citava só a suíte geral
  passando, não testes dedicados). Cobertura dedicada adicionada — ver
  seção "Validação" acima.
