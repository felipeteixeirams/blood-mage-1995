---
agent_context: backend, gameplay-engineer
target_module: src/types/game.ts, src/data/equipmentSets.json, src/game/systems/EquipmentSetSystem.ts, src/store/gameStore.ts, src/components/InventoryModal.tsx
priority: medium
criticality: medium
status: completed
start_date: "2026-09-28"
completion_date: "2026-09-28"
last_updated: "2026-09-28"
tags:
  - equipment
  - relics
  - loot
  - itemization
  - delivered
---

# 📜 Spec 34: Sistema de Bônus de Conjunto (Equipment Sets)

> **Status:** 🟢 IMPLEMENTADO — ver seção 7 (Honestidade Técnica) para o que foi
> validado e como.
> **Data de Conclusão:** 28/09/2026

> **Nota de proveniência:** esta spec foi escrita diretamente pelo dono do
> projeto (Felipe) a partir da análise de um protótipo Godot separado — o
> conceito de design foi portado, não o código. Não havia arquivo em
> `docs/specs/backlog/` correspondente a esta spec antes desta entrega; este
> documento foi criado diretamente em `delivered/` no fechamento do trabalho
> (ver seção 7 para detalhes).

---

## 1. Contexto

O projeto já tinha `EquipmentSlots` (`weapon`, `armor`, `relics[]` —
`src/types/game.ts`), 8 Relíquias entregues (`src/data/relics.json`) com
efeitos passivos individuais, e `getRelicModifiers()` em
`src/store/gameStore.ts` que soma modificadores de tudo equipado em um
`RelicEffect` combinado. Faltava o conceito clássico de ARPG de bônus de
conjunto: vestir 2-3 peças do mesmo "set" concede bônus adicional.

## 2. Objetivo

Adicionar conjuntos de equipamento com bônus escalonado (2/3 peças) que somam
aos modificadores individuais já existentes, sem alterar `RelicEffect` nem
quebrar itens/saves fora de qualquer conjunto.

## 3. Escopo Entregue

1. Campo opcional `setId?: string` em `LootItem`/`RelicItem`
   (`src/types/game.ts`) — aditivo, `undefined` mantém o comportamento atual.
2. Novo `src/data/equipmentSets.json` com 2 conjuntos:
   - **Conjunto Sangue** (`selo_hemorragico` + `olho_de_carmim`): 2/2 →
     `lifestealBonus +0.05`, `damageMultiplier +0.05`.
   - **Conjunto Abissal** (`coracao_abissal` + `amuleto_do_martir` +
     `calice_amaldicoado`): 2/3 → `cooldownReductionBonus +0.05`; 3/3 →
     `cooldownReductionBonus +0.12`, `maxHpBonus +20` (substitui o bônus de
     2/3, não soma).
3. Nova função pura `calculateSetBonuses(equipment, sets)` em
   `src/game/systems/EquipmentSetSystem.ts` — sem dependência de
   Zustand/React, testável isoladamente.
4. `getRelicModifiers()` em `gameStore.ts` estendido de forma estritamente
   aditiva: soma o resultado de `calculateSetBonuses()` ao `combined` já
   calculado, antes do `return combined`.
5. `setId` marcado nos 5 itens de `relics.json` que participam dos 2
   conjuntos (nenhuma outra propriedade desses itens foi alterada).
6. Testes unitários de `calculateSetBonuses`
   (`src/game/systems/EquipmentSetSystem.test.ts`) cobrindo todos os
   critérios de aceite da spec original (0 peças, 1 peça, 2 peças, patamar 3
   substituindo o 2, 2 sets simultâneos somados, item com `setId`
   inconsistente).
7. Indicação textual simples no `InventoryModal.tsx`: linha condicional
   "Conjunto: `<nome>` (`n`/`total` peças equipadas)" nos slots equipados e
   na galeria de relíquias do catálogo. Sem componente React dedicado.

### Escopo OUT (não feito, por decisão explícita da spec original)
- UI dedicada de "Codex de Conjuntos".
- Habilidades especiais únicas por item lendário.
- Mais de 2 conjuntos nesta entrega.
- Qualquer alteração em `getRelicModifiers()` além da soma aditiva final.

## 4. Decisão de Implementação Não Trivial (declarada, não decidida em silêncio)

O campo `bloodCrystalMultiplier` em `RelicEffect` é **multiplicativo** no
loop de relíquias individuais existente (valor neutro = `1.0`, relíquias se
combinam por multiplicação). Nenhum dos 2 conjuntos padrão usa esse campo,
mas `calculateSetBonuses()` precisa devolver *algum* valor neutro para ele
para poder ser somado com segurança aos demais campos (todos aditivos,
neutro = `0`).

Se `calculateSetBonuses()` devolvesse `1.0` como neutro (mesmo valor neutro
de `getRelicModifiers()`) e a integração em `gameStore.ts` apenas somasse
`combined.bloodCrystalMultiplier += setBonuses.bloodCrystalMultiplier`, o
resultado ficaria inflado em `+1.0` mesmo sem nenhum conjunto ativo — um bug
silencioso. A solução adotada: dentro de `calculateSetBonuses()`, esse campo
é tratado como **delta aditivo** (`0` = nenhum bônus); a integração em
`gameStore.ts` só multiplica `combined.bloodCrystalMultiplier` quando esse
delta for diferente de zero (`combined.bloodCrystalMultiplier *= 1 + delta`).
Isso é documentado em comentário tanto em `EquipmentSetSystem.ts` quanto no
ponto de integração em `gameStore.ts`.

## 5. Critérios de Aceite

- [x] 0 peças de qualquer set equipadas → todos os campos zerados/neutros.
- [x] Exatamente 1 peça de um set de 2 → nenhum bônus.
- [x] 2 peças do mesmo set → bônus patamar "2".
- [x] 3 peças de set com patamar "3" → bônus "3" aplicado EM VEZ DE somado ao "2".
- [x] Peças de 2 sets diferentes simultaneamente → bônus de ambos somados.
- [x] Item com `setId` que não corresponde a nenhum set → não quebra, não conta bônus.
- [x] `pnpm run typecheck`: 0 erros.
- [x] `pnpm test -- --run`: 100% passando (551/551, suíte completa).

## 6. Impacto em Testes Pré-Existentes (declarado, não escondido)

`src/game/systems/RelicSystem.test.ts` tinha um teste
("can equip up to 3 relics and calculate combined modifiers correctly") que
equipava exatamente `selo_hemorragico` + `olho_de_carmim` — as 2 peças do
Conjunto Sangue. Com o novo sistema, esse teste passou a acionar
corretamente o bônus de conjunto 2/2, e os valores antigos fixos
(`damageMultiplier: 0.10`, `lifestealBonus: 0.05`) ficaram desatualizados
frente ao novo comportamento pretendido (`0.15` e `0.10` respectivamente,
individual + set). O teste foi atualizado (não ignorado/removido) para
refletir o total correto, com comentário explicando a mudança de
comportamento. Isso é uma consequência esperada e correta de introduzir bônus
de conjunto — sinalizado aqui em vez de omitido, seguindo a seção 🎓
Honestidade Técnica do `CLAUDE.md`.

## 7. Honestidade Técnica — IMPLEMENTADO / VALIDADO / NÃO VALIDADO

- **IMPLEMENTADO:** todos os itens do Escopo IN da spec original (seção 3
  acima), estritamente aditivo a `RelicEffect`, `relics.json` e
  `gameStore.ts`.
- **VALIDADO:**
  - `pnpm run typecheck` → 0 erros (rodado após `pnpm install`, que foi
    necessário porque este worktree não tinha `node_modules` local — ver
    nota abaixo).
  - `pnpm test -- --run` → 551/551 testes passando, 55 arquivos de teste,
    incluindo os 9 novos casos de `EquipmentSetSystem.test.ts`.
  - `pnpm run build` (via `pnpm verify`, que também roda
    `scripts/verify-assets.cjs`) → build de produção concluído sem erros.
- **NÃO VALIDADO:**
  - Game feel / UX do novo texto de progresso de conjunto no
    `InventoryModal.tsx` — não houve execução manual no navegador nem
    screenshot; a leitura é estática (revisão de código), não execução real.
    Precisa de playtest humano para confirmar legibilidade em mobile/telas
    pequenas (o texto foi adicionado com a mesma classe de fonte/tamanho já
    usada nas descrições de item existentes, então o risco é baixo, mas não
    foi confirmado ao vivo).
  - Balanceamento numérico dos valores de bônus (5%/12%/+20 HP) — são os
    valores literais fornecidos pela spec original, não houve validação de
    playtest sobre impacto em dificuldade/progressão.
- **PROBLEMA ENCONTRADO (fora do escopo pedido, não corrigido aqui):** este
  worktree (`agent-ad4189a701de20b4c`) não tinha `node_modules` instalado —
  diferente de outros worktrees irmãos na mesma máquina, que já tinham
  ~680MB de `node_modules` presentes. Isso fazia `pnpm test`/`pnpm run build`
  falharem por completo (binário `vitest` ausente) e o `pnpm run typecheck`
  rodar silenciosamente contra um `tsc` global (`/opt/node22`) em vez do
  TypeScript do projeto. Foi necessário rodar `pnpm install` neste worktree
  antes de validar. Isso não é uma mudança de código da spec 34 e não foi
  commitado (dependências não entram em controle de versão), mas fica
  registrado aqui como risco de setup de ambiente observado durante a
  execução desta tarefa.

## 8. Registro de Mudanças (Changelog)

- **[2026-09-28] Entrega inicial (Spec 34):**
  - Status: **CONCLUÍDO**.
  - Adicionado `setId?: string` a `LootItem`/`RelicItem` e novo tipo
    `EquipmentSetDef` em `src/types/game.ts`.
  - Criado `src/data/equipmentSets.json` (Conjunto Sangue, Conjunto Abissal).
  - Criado `src/game/systems/EquipmentSetSystem.ts`
    (`calculateSetBonuses()`, função pura) e seu teste unitário dedicado.
  - Integração aditiva em `getRelicModifiers()` (`src/store/gameStore.ts`).
  - `setId` marcado nos 5 itens correspondentes em `src/data/relics.json`.
  - Indicação textual de progresso de conjunto em `InventoryModal.tsx`.
  - Teste pré-existente em `RelicSystem.test.ts` atualizado para refletir o
    novo comportamento correto (ver seção 6).
  - `pnpm run typecheck` e `pnpm test -- --run` (551/551) e `pnpm verify`
    (assets + typecheck + build) executados e passando.
