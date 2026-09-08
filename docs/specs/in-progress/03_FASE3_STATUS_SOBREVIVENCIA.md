---
agent_context: game-engine, backend, qa
target_module: src/game/systems, src/game/objects/Player.ts, src/components/GameplayHUD.tsx, src/components/hud/PlayerStatus.tsx
priority: high
criticality: high
status: in-progress
phase: 3/4
start_date: 2026-08-10
last_updated: 2026-09-08
responsible: Claude
progress: "95% — todo o trabalho de código concluído (PR #93); resta só QA manual e tuning de valores, ambos dependentes de Felipe jogar"
tags: [specs, phase-3, survival, status-effects, bleed, poison, infection]
---

> ✅ **Atualização 2026-09-08 (PR #93, mesclado por Felipe):** os 2 itens de
> código que faltavam foram entregues — cura via NPC Clérigo agora
> purifica as 3 condições (sangramento/veneno/infecção) por 15 Cristais de
> Sangue (antes só cobria infecção), e os ícones emoji placeholder viraram
> badges SVG góticos (`BleedingIcon`/`PoisonIcon`/`InfectionIcon` em
> `PlayerStatus.tsx`). Não há mais trabalho de código executável por um
> agente IA nesta spec — só resta validação manual e tuning que dependem
> do Felipe jogar de verdade (ver seções abaixo). Puxado, typecheck limpo,
> 464/464 testes passando.

# 🟡 Fase 3: Status de Sobrevivência

> **Status:** Gameplay loop implementado e validado | **Complexidade:** Média

> **Nota de consolidação (2026-09-06):** existia uma segunda spec para o
> mesmo domínio, `delivered/03_FASE3_CONDICOES_DE_SOBREVIVENCIA.md`
> (assinada "Jules", `100% CONCLUIDO`), nunca reconciliada com esta. Ela
> foi removida após verificação contra o código real: citava 3 arquivos
> que não existem (`StatusConditionSystem.ts`, `Consumables.ts`,
> `StatusHUD.tsx`) — descrevia uma implementação que nunca foi construída
> dessa forma. Esta spec (`STATUS_SOBREVIVENCIA`) é a que bate 1:1 com o
> código real (`Player.updateStatusConditions()`, `applyStatusDamage()`,
> `statusEffectOnHit` em `monsters.json`, `useCurative()` em
> `GameplayHUD.tsx` — todos confirmados presentes). Por isso ela também
> foi movida de `delivered/` pra `in-progress/`: o próprio arquivo já
> listava pendências reais (ver "O que NÃO foi feito" abaixo) — inclusive
> confirmado nesta data que o NPC Clérigo (`DungeonFlowController.ts`,
> `npcType: 'cleric'`) existe apenas como sprite decorativo, sem nenhuma
> interação de cura implementada ainda.

---

## ✅ O que foi implementado (2026-08-10)

### Dados / Config

- `src/types/game.ts` — `MonsterConfig.statusEffectOnHit?: { type, chance }`
- `src/data/monsters.json` — 7 monstros associados tematicamente:
  - **Sangramento:** `skeleton_warrior` (15%), `hell_hound` (30%), `werewolf_lycan` (35%)
  - **Infecção:** `zombie_shambler` (30%), `flesh_golem` (20%)
  - **Veneno:** `blood_specter` (25%), `gore_abomination` (30%)

### Aplicação de Status (ao ser atingido)

- `src/game/objects/Projectile.ts` — carrega `statusEffectOnHit` opcional
- `src/game/scenes/GameScene.ts` — `playerHitByEnemy()` é o funil único de todo dano de inimigo (melee, toque, projétil). Nele: rola a chance do monstro e aplica a condição via `setStatusCondition()`, com feedback visual (floating text) e mensagem no LootLog.

### Gameplay Loop (dreno/bloqueio)

- `src/game/objects/Player.ts`:
  - `updateStatusConditions(delta)` chamado a cada frame (jogador consciente)
  - **Sangramento:** dreno de 2%/s do HP máximo, **apenas enquanto o jogador se move** (`moveVector.length() > 0.05`). Parar de andar cessa o dreno — fiel ao spec.
  - **Veneno:** dreno de 1.5%/s do HP máximo, contínuo, independente de movimento.
  - **Infecção:** reduz o HP efetivo a 80% do máximo (clamp, não muta `maxHp` — cura restaura o teto normal) e **bloqueia a regeneração passiva durante a inconsciência** (Fase 1).
  - Dano de status usa `applyStatusDamage()`, um método **isolado** de `takeDamage()` — não dispara frames de invulnerabilidade (não deve blindar o jogador de um hit real de inimigo), mas respeita o mesmo fluxo de desmaio/morte definitiva (knockoutCount) para não criar um caminho de morte paralelo e inconsistente.

### Morte por Status Fora do Fluxo de Combate

- `src/game/scenes/GameScene.ts` — o loop principal agora checa, logo após `updatePlayer()`, se `isDefinitivelyDead` acabou de se tornar verdadeiro (pode acontecer só por sangramento/veneno, sem um inimigo bater no momento exato) e dispara `triggerGameOver()` normalmente.

### Cura (UI)

- `src/components/GameplayHUD.tsx` — indicador visual abaixo do HP/MP, aparece só quando há condição ativa:
  - Sangrando (N ataduras) — clique consome 1 atadura via `useCurative('bandages')`
  - Envenenado (N antídotos) — `useCurative('antidotes')`
  - Infeccionado (N antibióticos) — `useCurative('antibiotics')`
  - Botão desabilitado se `curatives[tipo] < 1`
  - Curativos já eram compráveis no Alquimista (`buyCurative`), mas antes não havia como *usá-los* — esse loop estava incompleto. Agora fecha o ciclo: comprar → ser infligido → curar.
  - Ícones customizados: `BleedingIcon`/`PoisonIcon`/`InfectionIcon` (SVG gótico) em `PlayerStatus.tsx`, substituindo os emoji placeholder (🩸🍇🧪) — **entregue no PR #93**.

### Cura via NPC Clérigo (Safe House) — entregue no PR #93

- `src/components/GameplayHUD.tsx` — botão "Purificar Todas as Aflições"
  (15 Cristais de Sangue) agora limpa `bleeding`, `poison` **e** `infection`
  de uma vez (`setStatusCondition(condição, false)` × 3), habilitado
  sempre que pelo menos uma condição estiver ativa. Antes só cobria
  infecção isoladamente.

---

## 🧪 Validação Executada

```
✅ tsc --noEmit: zero erros
✅ vite build: sucesso (23s, mesmo warning de bundle >500kb, não bloqueante)
```

**Ainda não testado manualmente (recomendo QA):**
- [ ] Confirmar visualmente que o dreno de sangramento cessa ao parar de andar
- [ ] Confirmar que infecção realmente trava a regeneração passiva durante desmaio
- [ ] Confirmar que morrer só de veneno/sangramento (sem inimigo por perto) dispara a tela de game over corretamente
- [ ] Confirmar que curar via clique no indicador realmente remove o status e desativa o botão
- [ ] *(novo, PR #93)* Confirmar que "Purificar Todas as Aflições" no Clérigo realmente limpa as 3 condições simultâneas e cobra 15 Cristais só uma vez (não 15 por condição)
- [ ] *(novo, PR #93)* Confirmar visualmente que os badges SVG (`BleedingIcon`/`PoisonIcon`/`InfectionIcon`) renderizam corretamente no HUD em vez dos emoji antigos

---

## ⚠️ O que ainda falta (dependente de Felipe, não de código)

- ~~Cura via NPC Clérigo na vila~~ — **entregue no PR #93** (2026-09-08).
- ~~Ícones customizados (emoji → pixel-art)~~ — **entregue no PR #93**
  (badges SVG, não sprite físico, mas resolve a inconsistência visual).
- Tuning fino de percentuais de dreno (2%/s sangramento, 1.5%/s veneno, cap de 80% infecção) são valores de estreia — Felipe deve validar em playtesting se a tensão está calibrada (spec pede "não brutal, tensão psicológica"). **Nenhum agente IA pode fazer isso sem o Felipe jogar e dar o veredito** — não é um item que "falta implementar", é uma decisão de balanceamento que precisa de feedback humano real.

---

## 📚 Documentação Relacionada

- Spec original: [[../../archive/legacy/DISCOVERY_DUNGEON_SIEGE_EVOLUTION.md]] (Seção 2.4)
- Validação geral do projeto: [[../../archive/reviews/VALIDATION_DUNGEON_SIEGE_2026_08_10.md]]
- Anti-regressão: [[../../critical/01_CRITICAL_FILES.md]] — `takeDamage()` não foi tocado, `applyStatusDamage()` é um método novo e isolado

---

**Responsible:** Claude
**Commits:** (ver histórico do dia 2026-08-10)

[[../../README.md]] | [[../README.md]]
