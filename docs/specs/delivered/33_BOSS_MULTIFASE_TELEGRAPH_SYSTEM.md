---
agent_context: gameplay-engineer, game-designer
target_module: src/game/systems/BossPhaseController.ts, src/game/objects/Enemy.ts, src/game/systems/EnemyTelegraphSystem.ts, src/types/game.ts, src/data/monsters.json, src/game/scenes/GameScene.ts
priority: medium
criticality: medium
status: delivered
start_date: "2026-09-28"
completion_date: "2026-09-28"
last_updated: "2026-09-28"
tags:
  - boss
  - ai
  - telegraph
  - combat
  - extract-delegate
  - delivered
---

# 📜 Spec 33: Sistema de Boss Multi-Fase com Telégrafo Evolutivo

> **Status:** 🟢 100% IMPLEMENTADO E ENTREGUE
> **Data de Conclusão:** 28 de Setembro de 2026
> **Domínio:** IA de Boss, Telégrafos de Ataque, Combate.
>
> **Nota de proveniência:** esta spec foi escrita diretamente por Felipe após
> analisar um protótipo Godot separado — o conceito de design foi portado,
> não o código. Não existia previamente em `docs/specs/backlog/` (o arquivo
> referenciado no pedido original não estava no repositório); este documento
> foi criado já em `delivered/` ao final da implementação, sem passar por um
> estágio prévio em `backlog/`.

## 1. Contexto

Existe um único boss (`necro_lord_boss` em `src/data/monsters.json`), tratado
por `Enemy.ts` com `behavior: 'boss'`, que compartilha a mesma lógica do
`case 'ranged'` (kiting). `EnemyTelegraphSystem`/`Enemy.getTelegraphInfo()` já
tinha o shape `'boss_slam'`, mas o check estava hardcoded para
`this.config.id === 'blood_lord_boss'` — id que **não existe mais** em
`monsters.json` (o boss atual é `necro_lord_boss`). Ou seja, o telegraph de
`boss_slam` nunca disparava — bug real, corrigido nesta spec. Não existia
conceito de "fase de encontro" (mudança de comportamento por threshold de HP
dentro do mesmo boss).

## 2. Objetivo

Adicionar sistema de fases por threshold de HP a bosses (começando por
`necro_lord_boss`), com telégrafo visual dedicado por fase, via controlador
EXTERNO ADITIVO que NÃO toca a FSM de `Enemy.ts` — reaproveitando o campo já
existente `speedMultiplier` e o `EnemyTelegraphSystem` já existente.

## 3. Escopo

**IN:**
1. Corrigir bug de id desatualizado no telégrafo (`blood_lord_boss` →
   `necro_lord_boss`) em `Enemy.ts`.
2. Novo campo opcional `bossPhases?: BossPhaseConfig[]` em `MonsterConfig`
   (`src/types/game.ts`) e em `monsters.json` — ausente em todo monstro
   não-boss, backward-compatible.
3. Novo arquivo `src/game/systems/BossPhaseController.ts` (Extract/Delegate)
   que observa `hp`/`maxHp` de instâncias `Enemy` com `bossPhases`
   configurado, aplica de forma aditiva ao cruzar threshold pela primeira
   vez, com idempotência.
4. Novo shape de telégrafo `'wave'` (anel expansivo) em
   `EnemyTelegraphSystem.ts`, para o ataque exclusivo da fase final.
5. Configuração de 3 fases para `necro_lord_boss`.
6. Testes unitários de `BossPhaseController`.

**OUT (não feito, de propósito):**
- Novos bosses temáticos adicionais.
- Nenhuma mudança na FSM de `Enemy.ts` (switch de estados / modelo de
  movimento).
- Novos padrões de ataque além do telégrafo `'wave'`.
- Summon de minions / teleporte do boss.
- Wiring de `attackIntervalMultiplier` na timing real de ataque da FSM (ver
  Trade-off na seção 7).

## 4. Implementação

### 4.1 Correção do bug (`Enemy.ts`, `getTelegraphInfo`)

```typescript
// ❌ Antes:
if (this.config.id === 'blood_lord_boss') { ... }
// ✅ Depois:
if (this.config.id === 'necro_lord_boss') { ... }
```

### 4.2 `BossPhaseConfig` (`src/types/game.ts`)

```typescript
export interface BossPhaseConfig {
  hpThreshold: number;              // 0.0-1.0, fração do maxHp que dispara a fase
  speedMultiplier: number;          // aplicado a Enemy.speedMultiplier (multiplicativo)
  attackIntervalMultiplier: number; // < 1.0 = ataca mais rápido (ex: 0.75)
  unlocksWaveTelegraph?: boolean;   // true só na fase que desbloqueia o telégrafo 'wave'
}
```

`MonsterConfig.bossPhases?: BossPhaseConfig[]` — campo opcional, ausente em
todo monstro que não seja boss.

### 4.3 `BossPhaseController.ts` (novo arquivo, Extract/Delegate)

- Instanciado em `GameScene.create()` (`this.bossPhaseController = new BossPhaseController(this)`).
- `public update(bosses: Enemy[]): void` chamado do loop principal de
  `GameScene.update()`, logo após `enemyTelegraphSystem.update(...)` —
  aditivo, não reordena colliders nem muda a assinatura de
  `update(time, delta)`.
- Estado de "fase já disparada" vive inteiramente em `WeakMap`/`WeakSet`
  internos ao controller, indexados pela instância de `Enemy` — **nenhum**
  campo novo foi adicionado à classe `Enemy` (guardrail da spec).
- Ao cruzar um `hpThreshold` pela primeira vez: `enemy.speedMultiplier *=
  phase.speedMultiplier` (multiplicativo, nunca substitui), acumula
  `attackIntervalMultiplier` no WeakMap, marca fase final quando
  `unlocksWaveTelegraph: true`, e dispara `CombatFeel.triggerScreenShake` +
  `CombatFeel.triggerHitStop` como feedback de impacto (só quando a fase
  realmente muda algo — a fase placeholder `hpThreshold: 1.0` com
  multiplicadores `1.0` não dispara feedback).
- `public isFinalPhase(enemy: Enemy): boolean` — getter público consultado
  por `Enemy.ts`.

### 4.4 Ataque exclusivo + telégrafo `'wave'`

Em `Enemy.getTelegraphInfo()`, no bloco `necro_lord_boss` (mesmo bloco do bug
corrigido): consulta `(this.scene as any)?.bossPhaseController?.isFinalPhase?.(this)`
e retorna `shape: 'wave'` em vez de `'boss_slam'` quando a fase final foi
atingida.

Em `EnemyTelegraphSystem.ts`: union type ampliado para incluir `'wave'`, e
novo método `renderWaveTelegraph()` — anel fino que se expande do centro do
boss até `range`, com anéis-eco em incrementos (reaproveita `strokeCircle`,
mesmo estilo de `renderCircleTelegraph`/`renderBossSlamTelegraph`).

### 4.5 Dados — `necro_lord_boss` em `monsters.json`

```json
"bossPhases": [
  { "hpThreshold": 1.0, "speedMultiplier": 1.0, "attackIntervalMultiplier": 1.0 },
  { "hpThreshold": 0.5, "speedMultiplier": 1.15, "attackIntervalMultiplier": 0.85 },
  { "hpThreshold": 0.2, "speedMultiplier": 1.3, "attackIntervalMultiplier": 0.7, "unlocksWaveTelegraph": true }
]
```

Nenhum outro campo base (`speed`/`damage`/`hp`) de `necro_lord_boss` foi
alterado.

## 5. Arquivos Alterados

| Arquivo | Mudança |
|---|---|
| `src/game/objects/Enemy.ts` | 1 linha corrigida (`blood_lord_boss` → `necro_lord_boss`); `speedMultiplier` de `private` para `public` (comentário `// public: usado por BossPhaseController`); bloco de telégrafo do boss consulta `bossPhaseController.isFinalPhase()`. Nenhuma mudança na FSM (`updateEnemy`) nem no modelo de movimento. |
| `src/game/systems/BossPhaseController.ts` | Novo arquivo. |
| `src/game/systems/BossPhaseController.test.ts` | Novo arquivo, 8 testes unitários. |
| `src/game/systems/EnemyTelegraphSystem.ts` | Shape `'wave'` + `renderWaveTelegraph()`. |
| `src/types/game.ts` | `BossPhaseConfig` + `MonsterConfig.bossPhases?`. |
| `src/data/monsters.json` | `bossPhases` em `necro_lord_boss` (3 fases). |
| `src/game/scenes/GameScene.ts` | Import + campo público `bossPhaseController`; instanciado em `create()`; `.update(bosses)` chamado no loop principal, filtrando `enemiesGroup` por `config.behavior === 'boss' && config.bossPhases?.length`. Nenhum collider reordenado, assinatura de `update(time, delta)` inalterada. |

## 6. Testes e Validação

- `BossPhaseController.test.ts` (8 testes): boss com `hp === maxHp` não
  dispara mudança real; cruzar `hpThreshold: 0.5` aplica `speedMultiplier`
  exatamente uma vez mesmo com updates repetidos no mesmo HP (idempotência);
  queda direta de 100% para 15% dispara as duas fases intermediárias na
  ordem (produto multiplicativo); `isFinalPhase()` só é `true` após a fase
  final; multiplicativo preserva variação individual pré-existente de
  `speedMultiplier`; monstros sem `bossPhases` são ignorados
  (backward-compatible); inimigos inativos/listas vazias não lançam erro;
  estado isolado por instância (múltiplos bosses simultâneos).
- `pnpm run typecheck`: **0 erros** (executado e validado).
- `pnpm test -- --run` (suíte completa via `npx vitest run`): **550/550
  testes passando** em 55 arquivos, incluindo os 8 novos de
  `BossPhaseController.test.ts` e a suíte existente de `Enemy.test.ts` /
  `EnemyTelegraphSystem.test.ts` sem regressão.
- `pnpm run build` (via `npm run build`): build de produção completo com
  sucesso.
- `node scripts/verify-assets.cjs`: sem falhas obrigatórias.
- **NÃO VALIDADO:** verificação visual em jogo real do telégrafo `'wave'`
  (anel expansivo renderizando corretamente na fase final do boss, em
  navegador). O ambiente de execução deste agente não conseguiu instalar o
  binário do Chromium do Playwright (download bloqueado/sem rede para o CDN
  de browsers — `npx playwright install chromium` não produziu o cache
  esperado), então o smoke test E2E (`pnpm test:e2e`) não pôde ser
  executado. Fica pendente playtest humano: subir o jogo, chegar ao boss
  `necro_lord_boss`, reduzir o HP dele abaixo de 50% e depois de 20%, e
  confirmar visualmente (a) o boost de velocidade/agressividade e (b) a
  troca do telégrafo de `boss_slam` (disco) para `wave` (anel expansivo).

## 7. Trade-offs e Decisões Declaradas

- **`attackIntervalMultiplier` armazenado mas não conectado ao timing real de
  ataque.** A spec pede para "guardar acessível via o mesmo WeakMap (não novo
  campo público em Enemy)" — o valor é calculado, acumulado e exposto via
  `BossPhaseController.getAttackIntervalMultiplier(enemy)`, mas **não** é
  consumido por `Enemy.ts` hoje. Conectá-lo ao cooldown de ataque real exigiria
  tocar em lógica de timing dentro da FSM/ciclo de ataque de `Enemy.ts`, e o
  guardrail da spec (tabela "Arquivos-Alvo") limita explicitamente as mudanças
  em `Enemy.ts` a "1 linha corrigida" + "consultar BossPhaseController no
  bloco de telégrafo exclusivo" — nada além disso. Trade-off: o boss fica
  mais rápido (`speedMultiplier`, visível e efetivo) nas fases 2/3, mas não
  ataca mais rápido de fato ainda; isso é dado explícito a ajustar em uma
  spec futura caso o game design queira esse efeito também aplicado.
- **`EnemyConfig` → `MonsterConfig`.** A spec referenciava um tipo
  `EnemyConfig` que não existe no código — o tipo real usado por
  `Enemy.config` e `monsters.json` é `MonsterConfig`
  (`src/types/game.ts`). `BossPhaseConfig` e o campo `bossPhases?` foram
  adicionados em `MonsterConfig`.
- **Spec 33 não existia em `docs/specs/backlog/`.** O arquivo
  `33_BOSS_MULTIFASE_TELEGRAPH_SYSTEM.md` referenciado no pedido não estava
  no repositório (o backlog ia de `06` a `29`, e `delivered/` já tinha até
  `32`). Este documento foi criado diretamente em `delivered/` ao final da
  implementação, com o conteúdo funcional da spec recebida, em vez de
  "mover" um arquivo que não existia.
- **`status: delivered` em vez de `status: completed`.** O pedido original
  pediu `status: completed`, mas todo o histórico de `docs/specs/delivered/`
  usa `status: delivered` (ver specs 30, 31, 32). Segui a convenção real do
  projeto em vez do texto literal do pedido, para não introduzir um valor de
  `status` inédito na pasta.
- **Feedback de impacto (`CombatFeel`) na transição de fase.** Não fazia
  parte do pedido explícito, mas é consistente com o padrão de "Game Feel"
  do projeto (ver `phaser-4-animation-tweens/SKILL.md`) e com o uso já
  existente de `CombatFeel` no restante da base de código — screen shake +
  hit-stop leves (180ms/70ms) na transição real de fase, nunca na fase
  placeholder `hpThreshold: 1.0`.

## 8. Registro de Mudanças

- **2026-09-28**: Spec criada e entregue na íntegra por agente Claude Code.
  Bug do id `blood_lord_boss` corrigido; `BossPhaseController` criado e
  integrado a `GameScene`; telégrafo `'wave'` adicionado; 3 fases
  configuradas para `necro_lord_boss`; 8 testes unitários novos; suíte
  completa (550 testes) e build validados. Verificação visual em jogo real
  não realizada (sem acesso a browser E2E neste ambiente) — pendente
  playtest humano.
