---
status: ANDAMENTO
phase: 3/4
priority: P1
start_date: 2026-08-10
responsible: Claude
progress: 75% (gameplay loop completo, faltam polimentos)
---

# 🟡 Fase 3: Status de Sobrevivência

> **Status:** Gameplay loop implementado e validado | **Complexidade:** Média

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
  - 🩸 Sangrando (N ataduras) — clique consome 1 atadura via `useCurative('bandages')`
  - 🍇 Envenenado (N antídotos) — `useCurative('antidotes')`
  - 🧪 Infeccionado (N antibióticos) — `useCurative('antibiotics')`
  - Botão desabilitado se `curatives[tipo] < 1`
  - Curativos já eram compráveis no Alquimista (`buyCurative`), mas antes não havia como *usá-los* — esse loop estava incompleto. Agora fecha o ciclo: comprar → ser infligido → curar.

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

---

## ⚠️ O que NÃO foi feito nesta iteração (fica para depois)

- Cura via NPC Clérigo na vila (spec menciona isso como opção adicional) — não implementado, só cura via consumível
- Ícones customizados (usei emoji como placeholder — 🩸🍇🧪); trocar por sprite pixel-art se quiser manter 100% de consistência visual com o resto do HUD
- Tuning fino de percentuais de dreno (2%/s sangramento, 1.5%/s veneno, cap de 80% infecção) são valores de estreia — Felipe deve validar em playtesting se a tensão está calibrada (spec pede "não brutal, tensão psicológica")

---

## 📚 Documentação Relacionada

- Spec original: [[../../DISCOVERY_DUNGEON_SIEGE_EVOLUTION.md]] (Seção 2.4)
- Validação geral do projeto: [[../../VALIDATION_DUNGEON_SIEGE_2026_08_10.md]]
- Anti-regressão: [[../../CRITICAL/01_CRITICAL_FILES.md]] — `takeDamage()` não foi tocado, `applyStatusDamage()` é um método novo e isolado

---

**Responsible:** Claude
**Commits:** (ver histórico do dia 2026-08-10)

[[../../README.md]] | [[../README.md]]
