---
agent_context: progression-engineer, ui-designer
target_module: docs/specs/delivered
priority: high
status: completed
last_updated: 2026-08-27
tags: [specs, delivered, meta-progression, talent-tree, blood-crystals, economy]
---

# 🩸 Spec 12.03: Meta-Progressão e Economia (Replayability)

## Objetivo
Criar um loop de rejogabilidade roguelite através da introdução de uma árvore de talentos permanente financiada por Cristais de Sangue acumulados entre corridas, aplicando melhorias diretas nos atributos do caçador.

---

## Status
🟢 **COMPLETO**

---

## O que foi Entregue
- **Árvore de Talentos Permanentes:**
  - Interface gótica de talentos acessível no menu principal e tela de seleção.
  - Suporte a upgrades permanentes de Vida Máxima, Dano Global, Vampirismo (Lifesteal) e Redução de Cooldown (CDR).
- **Economia de Cristais de Sangue:**
  - Coleta e acúmulo de Cristais de Sangue como moeda persistente de metajogo.
  - Persistência com validação estrita Zod via `localStorage.ts`.
- **Aplicação Instantânea em Combate:**
  - Leitura e cálculo automatizado dos bônus de talentos na inicialização de `Player.ts`.
  - Sinergia com modificadores de relíquias e equipamentos equipados.

---

## Referência no Código
- `src/store/gameStore.ts` — Métodos `loadTalentLevels`, `saveTalentLevels` e gerenciamento dos Cristais de Sangue.
- `src/utils/localStorage.ts` — Schemas Zod para persistência e sanitização da árvore de talentos.
- `src/game/objects/Player.ts` — Aplicação instantânea de bônus passivos nos atributos base (`damageMultiplier`, `vampirism`, `maxHp`, `cooldownReduction`).
- `src/components/MainMenu.tsx` — Painel React UI para visualização e compra de talentos.
- `src/game/scenes/TitleScene.ts` — Integração de navegação para a árvore de talentos.

---

## Validação
- `pnpm test` executado com 100% dos testes aprovados.
- Verificação de persistência validada com leituras/escritas sem corrupção de dados.
- Tipagem TypeScript estrita sem o uso de `any` (`pnpm run typecheck`).

---

## Notas
- Cristais de Sangue permanecem preservados em resets de corrida normais e são consumidos apenas na árvore de talentos ou sistemas de prestígio.
