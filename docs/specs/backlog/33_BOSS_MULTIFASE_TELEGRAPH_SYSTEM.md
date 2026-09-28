---
agent_context: game-engine, game-designer
target_module: src/game/systems, src/game/objects/Enemy.ts, src/data/monsters.json
priority: medium
criticality: high
status: backlog
last_updated: 2026-09-28
tags: [specs, boss, telegraph, combat, phase-system, godot-port]
---

# Sistema de Boss Multi-Fase com Telégrafo Evolutivo

> **Origem:** conceito portado de um protótipo em Godot (`felipeteixeirams/bloodmage1995`,
> repositório separado onde Felipe trabalhou por engano de nome parecido —
> ver `docs/architecture/07_DECISION_LOG.md`). O código-fonte lá é GDScript
> e não é reaproveitável diretamente; esta spec reimplementa o **conceito de
> design** (fases por threshold de HP, telegraph evolutivo) 100% nos padrões
> Phaser 4/TypeScript deste projeto — nenhuma linha do protótipo é copiada.

## 1. Contexto ✅

Hoje existe **um único boss** (`necro_lord_boss` em `src/data/monsters.json`),
tratado por `Enemy.ts` com `behavior: 'boss'` — que compartilha exatamente a
mesma lógica de movimento/ataque do `case 'ranged'` (kiting a distância
ótima, ver `Enemy.ts` linhas ~767-793). A descrição do monstro
("Entra em fúria frenética ao perder vida") **não está implementada**: o
único gatilho de mudança de comportamento por HP baixo em `Enemy.ts`
(linhas ~490-497) só dispara `aiState = 'flee'` quando
`temperament === 'timid'` — e `necro_lord_boss` tem
`"temperament": "aggressive"`, então esse gatilho nunca ativa para ele.

Além disso, `EnemyTelegraphSystem`/`Enemy.getTelegraphInfo()` (linha ~1246)
já tem um shape dedicado `'boss_slam'`, mas o check está hardcoded para
`this.config.id === 'blood_lord_boss'` — um id que **não existe mais** em
`monsters.json` (o boss atual se chama `necro_lord_boss`). Ou seja: **o
telegraph de boss_slam nunca dispara hoje** — bug real encontrado durante
esta análise, corrigido como parte desta spec (Requisito 1).

Não existe hoje nenhum conceito de "fase de encontro" (mudança de
comportamento/ataques por threshold de HP dentro do MESMO boss) — apenas o
FSM genérico de 6 estados (`idle/patrol/investigating/combat/frenzy/flee`)
compartilhado por todos os inimigos, que é **NÍVEL 1 crítico**
(`docs/critical/01_CRITICAL_FILES.md`) e não deve ser modificado.

## 2. Objetivo ✅

Adicionar um sistema de fases por threshold de HP a bosses (começando por
`necro_lord_boss`), com telegraph visual dedicado por ataque de fase,
implementado como um controlador externo aditivo que **não toca a FSM de
`Enemy.ts`** — reaproveitando o campo já existente `speedMultiplier` e o
sistema de telégrafo já existente (`EnemyTelegraphSystem`).

## 3. Escopo

### 3.1 Dentro do Escopo (In-Scope) ✅
1. Corrigir o bug de id desatualizado no telegraph (`blood_lord_boss` →
   `necro_lord_boss`) — 1 linha, `Enemy.ts` (ver Requisito 1).
2. Novo campo opcional e aditivo em `EnemyConfig`
   (`src/types/game.ts`/`monsters.json`): `bossPhases?: BossPhaseConfig[]`
   — ausente em todo monstro que não seja boss (backward-compatible, sem
   migração de save necessária pois não é dado persistido, é config estático).
3. Novo arquivo `src/game/systems/BossPhaseController.ts` (Extract/Delegate)
   que:
   - Observa `hp`/`maxHp` de instâncias `Enemy` com `bossPhases` configurado.
   - Ao cruzar um threshold pela primeira vez, aplica de forma aditiva:
     `enemy.speedMultiplier *= config.speedMultiplier`,
     ajusta o intervalo de ataque via o multiplicador já consumido pelo
     FSM (ver Requisito 3), e marca a fase como já disparada (idempotência
     — nunca reprocessa o mesmo threshold duas vezes).
   - Dispara feedback de transição: `CombatFeel.triggerScreenShake(scene,
     6, 220)` + `CombatFeel.triggerHitStop(scene, 80)`.
4. Um novo shape de telegraph `'wave'` (anel expansivo, distinto do
   `'boss_slam'` existente) em `EnemyTelegraphSystem.ts`, para o ataque
   exclusivo desbloqueado na fase final.
5. Configuração de fases para `necro_lord_boss` (3 fases: 100%/50%/20% HP,
   crescendo velocidade e frequência de ataque, desbloqueando o telegraph
   `'wave'` na fase final) — ver Decisão de Produto (Seção 6).
6. Testes unitários de `BossPhaseController` (thresholds cruzados na ordem
   certa, idempotência, nenhuma fase disparada fora de ordem).

### 3.2 Fora do Escopo (Out-of-Scope) ✅
- **Novos bosses temáticos adicionais** (o protótipo Godot tinha 3 —
  Sangue Antigo/Rei Ossudo/Rainha Sombra). Conteúdo/arte novo é uma spec
  satélite futura; esta spec entrega o **framework reusável**, aplicado ao
  boss único já existente.
- **Nenhuma mudança na FSM de `Enemy.ts`** (`updateEnemy`/switch de
  estados) — o controller opera inteiramente por fora, lendo `hp`/`maxHp`
  públicos e escrevendo em `speedMultiplier` (campo já mutável e já
  consumido pela FSM existente).
- **Novos padrões de ataque exclusivos além do 1 telegraph `'wave'`** desta
  entrega (o protótipo tinha 9 padrões de ataque distribuídos por 3 bosses
  — replicar todos infla o escopo além de "dias a uma semana", ver
  "Escopo por Arquivo" na metodologia). Padrões adicionais viram specs
  satélite quando novos bosses forem adicionados.
- **Summon de minions / teleporte do boss** (presentes no protótipo) —
  mecânicas de maior risco de regressão (spawnar `Enemy` a partir de outro
  `Enemy`, mover posição fora do grid de colisão) que merecem spec própria
  com guardrails dedicados.

## 4. Requisitos Técnicos ✅

### Requisito 1 — Corrigir bug de telegraph (bloqueante, faça primeiro)
Em `Enemy.ts`, no método que monta `TelegraphRenderData` (`getTelegraphInfo`,
linha ~1246):
```typescript
// ❌ Hoje (nunca casa — id não existe mais em monsters.json):
if (this.config.id === 'blood_lord_boss') { ... }

// ✅ Corrigir para:
if (this.config.id === 'necro_lord_boss') { ... }
```
Rode `pnpm test` isoladamente neste ponto antes de prosseguir — é uma
mudança cirúrgica de 1 linha em arquivo NÍVEL 1, valide sozinha primeiro.

### Requisito 2 — Novo tipo `BossPhaseConfig`
Em `src/types/game.ts`, adicionar (aditivo, não quebra nenhum tipo
existente):
```typescript
export interface BossPhaseConfig {
  hpThreshold: number;        // 0.0-1.0, fração do maxHp que dispara a fase
  speedMultiplier: number;     // aplicado a enemy.speedMultiplier (ex: 1.3 = +30%)
  attackIntervalMultiplier: number; // < 1.0 = ataca mais rápido (ex: 0.75)
  unlocksWaveTelegraph?: boolean; // true só na fase que desbloqueia o ataque exclusivo
}
```
Em `EnemyConfig` (mesmo arquivo), adicionar campo opcional:
`bossPhases?: BossPhaseConfig[];`

### Requisito 3 — `BossPhaseController.ts` (novo arquivo)
Padrão Extract/Delegate (ver `03_PHASER_PATTERNS.md`), instanciado em
`GameScene.create()` junto aos demais sistemas desacoplados
(`constructor(private scene: GameScene)`), com um método público chamado
do loop principal:
```typescript
public update(bosses: Enemy[]): void
```
Para cada `Enemy` com `config.bossPhases` não vazio:
1. Calcular `hpRatio = enemy.hp / enemy.maxHp`.
2. Para cada fase em `bossPhases` (ordenadas do maior `hpThreshold` pro
   menor), se `hpRatio <= hpThreshold` E essa fase ainda não foi disparada
   para esta instância (`Set<Enemy>` ou `WeakMap<Enemy, Set<number>>`
   interno ao controller — **não** adicionar novo campo de estado dentro
   de `Enemy.ts`), aplicar:
   - `enemy.speedMultiplier *= phase.speedMultiplier` (multiplicativo, não
     substitui — respeita outros multiplicadores já ativos, ex: freeze).
   - Guardar `attackIntervalMultiplier` acessível para o telegraph (ver
     Requisito 4) via o mesmo `WeakMap`, não um novo campo público em
     `Enemy`.
   - `CombatFeel.triggerScreenShake(this.scene, 6, 220);
     CombatFeel.triggerHitStop(this.scene, 80);`
   - Marcar a fase como disparada (idempotência).

### Requisito 4 — Ataque exclusivo + telegraph `'wave'`
Quando a fase final (`unlocksWaveTelegraph: true`) é atingida, o boss passa
a intercalar seu ataque `ranged` padrão com o ataque exclusivo. Implementar
via o padrão que `Enemy.ts` já usa para telegraphs especiais por id
(mesmo bloco corrigido no Requisito 1): quando
`this.config.id === 'necro_lord_boss'` **e** a fase final foi atingida
(consultar o `WeakMap` exposto por `BossPhaseController` via um getter
público, ex: `bossPhaseController.isFinalPhase(enemy)`), retornar
`shape: 'wave'` em vez de `'boss_slam'` para o próximo ataque telegrafado.

Em `EnemyTelegraphSystem.ts`, adicionar ao union type:
```typescript
shape: 'cone' | 'line' | 'circle' | 'boss_slam' | 'wave';
```
E um novo método `renderWaveTelegraph()` (anel fino que se expande do
centro do boss até `range`, distinto visualmente do preenchimento sólido
de `renderBossSlamTelegraph` — reaproveitar `strokeCircle` em incrementos,
ver padrão de `renderCircleTelegraph` como referência de código já
existente no mesmo arquivo).

### Skill a Consultar
`phaser-4-physics-combat/SKILL.md` (hitboxes/damage do ataque exclusivo) e
`phaser-4-animation-tweens/SKILL.md` (timing do windup/strike do novo
padrão, para manter consistência com o FSM de ataque Windup-Strike-Recovery
já usado por todo o resto do jogo).

## 5. Arquivos-Alvo ✅

| Arquivo | Mudança |
|---|---|
| `src/game/objects/Enemy.ts` | Corrigir 1 linha (Requisito 1); consultar `BossPhaseController` no bloco de telegraph exclusivo (Requisito 4). **Nenhuma mudança na FSM.** |
| `src/game/systems/BossPhaseController.ts` | **Novo arquivo.** Toda a lógica de fase mora aqui. |
| `src/game/systems/BossPhaseController.test.ts` | **Novo arquivo.** Testes unitários (Seção 7). |
| `src/game/systems/EnemyTelegraphSystem.ts` | Adicionar shape `'wave'` + `renderWaveTelegraph()`. |
| `src/types/game.ts` | Adicionar `BossPhaseConfig` + campo opcional `bossPhases?` em `EnemyConfig`. |
| `src/data/monsters.json` | Adicionar `bossPhases: [...]` em `necro_lord_boss` (ver Seção 6). |
| `src/game/scenes/GameScene.ts` | Instanciar `BossPhaseController` em `create()` e chamar `.update(bosses)` no loop — mudança aditiva, sem tocar colliders/ordem existente (ver guardrail `01_CRITICAL_FILES.md`). |

## 6. Decisões de Produto Necessárias

Sem confirmação em contrário do Felipe, os **defaults seguros** abaixo são
implementáveis sem retrabalho de escopo — valores de balanceamento são
triviais de ajustar depois via `monsters.json` (dado, não código):

```json
"bossPhases": [
  { "hpThreshold": 1.0, "speedMultiplier": 1.0, "attackIntervalMultiplier": 1.0 },
  { "hpThreshold": 0.5, "speedMultiplier": 1.15, "attackIntervalMultiplier": 0.85 },
  { "hpThreshold": 0.2, "speedMultiplier": 1.3, "attackIntervalMultiplier": 0.7, "unlocksWaveTelegraph": true }
]
```
(Fase 1 é o baseline — threshold 1.0 nunca dispara mudança real, existe só
para documentar o estado inicial na config.)

## 7. Testes e Critério de Aceite ✅

- `BossPhaseController.test.ts` (Vitest, sem dependência de Phaser scene
  real — mockar `scene` mínimo):
  - Boss com `hp = maxHp` → nenhuma fase disparada.
  - Boss cruzando `hpThreshold: 0.5` → `speedMultiplier` aplicado
    **exatamente uma vez**, mesmo chamando `.update()` em múltiplos frames
    consecutivos com o mesmo HP (idempotência).
  - Boss que perde HP rapidamente (pula direto de 100% para 15%, ex:
    execução) → todas as fases intermediárias (0.5 e 0.2) disparam, na
    ordem, não só a mais próxima.
  - `isFinalPhase()` retorna `true` só após cruzar o último threshold.
- `pnpm run typecheck`: 0 erros.
- `pnpm test`: 100% passando (suíte completa, não só o arquivo novo).
- Verificação manual em jogo (sala de boss): confirmar visualmente que o
  telegraph `boss_slam` agora aparece (Requisito 1 corrigido) e que o
  telegraph `wave` aparece só depois do boss cair abaixo de 20% HP.

## 8. Guardrails

- **NÃO** modifique o switch de estados (`updateEnemy`) nem o modelo de
  movimento de `Enemy.ts` — toda leitura de fase é feita de fora, via
  `hp`/`maxHp`/`speedMultiplier` já públicos.
- **NÃO** adicione novos campos de estado de fase dentro da classe `Enemy`
  — o estado "qual fase já disparou" vive inteiramente dentro de
  `BossPhaseController` (`WeakMap`), para manter `Enemy.ts` sem mudança de
  superfície pública além do necessário.
- **NÃO** altere `speed`/`damage`/`hp` base de `necro_lord_boss` em
  `monsters.json` além de adicionar o campo `bossPhases`.
- Siga o guardrail de `GameScene.ts`: adicionar a chamada de
  `BossPhaseController.update()` no loop principal é aditivo — não
  reordene colliders existentes nem mude a assinatura do `update(time,
  delta)` da cena.

## 9. Referências

- [[../../critical/01_CRITICAL_FILES.md]] — guardrails de `Enemy.ts`/`GameScene.ts`.
- [[../../architecture/03_PHASER_PATTERNS.md]] — padrão Extract/Delegate.
- `.claude/skills/phaser-4-physics-combat/SKILL.md`
- `.claude/skills/phaser-4-animation-tweens/SKILL.md`
- Spec irmã: [[34_EQUIPMENT_SET_BONUS_SYSTEM.md]] (mesma origem de análise —
  protótipo Godot `felipeteixeirams/bloodmage1995`).

## Registro de Mudanças

| Data | O que mudou | Autor |
|------|-------------|-------|
| 2026-09-28 | Spec criada a partir da análise do protótipo Godot `bloodmage1995` — conceito de fases de boss portado para Phaser 4/TypeScript, incluindo correção de bug real (id desatualizado no telegraph) encontrado durante a análise | Claude |
