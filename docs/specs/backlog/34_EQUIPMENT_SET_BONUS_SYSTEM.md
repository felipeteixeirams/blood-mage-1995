---
agent_context: game-engine, backend, game-designer
target_module: src/store/gameStore.ts, src/data, src/types/game.ts
priority: medium
criticality: medium
status: backlog
last_updated: 2026-09-28
tags: [specs, equipment, sets, itemization, loot, godot-port]
---

# Sistema de Bônus de Conjunto (Equipment Sets)

> **Origem:** conceito portado de um protótipo em Godot (`felipeteixeirams/bloodmage1995`,
> repositório separado onde Felipe trabalhou por engano de nome parecido —
> ver `docs/architecture/07_DECISION_LOG.md`). O código-fonte lá é GDScript
> e não é reaproveitável diretamente; esta spec reimplementa o **conceito de
> design** (bônus escalonado por peças de um mesmo conjunto equipadas) 100%
> nos padrões deste projeto (Zustand + Zod + `src/data/*.json`) — nenhuma
> linha do protótipo é copiada.

## 1. Contexto ✅

O projeto já tem um sistema robusto de itemização: `EquipmentSlots` (`weapon`,
`armor`, `relics[]` — `src/types/game.ts`), 8 Relíquias entregues
(`delivered/19_RELICS_AND_ARTIFACTS_SYSTEM.md`, `src/data/relics.json`) com
efeitos passivos individuais, e `getRelicModifiers()` em `gameStore.ts`
(linha ~751) que soma os modificadores de tudo que está equipado em um
`RelicEffect` combinado.

O que **não existe** é o conceito clássico de ARPG (Diablo-style) de
**bônus de conjunto**: vestir 2 ou 3 peças nomeadas do mesmo "set" temático
concede um bônus **adicional**, incentivando o jogador a montar builds em
torno de um tema em vez de só maximizar stats individuais peça a peça.

## 2. Objetivo ✅

Adicionar conjuntos de equipamento com bônus escalonado (2 peças / 3 peças)
que se somam aos modificadores individuais já existentes, sem alterar o
formato de `RelicEffect` nem quebrar itens/saves que não pertencem a
nenhum conjunto.

## 3. Escopo

### 3.1 Dentro do Escopo (In-Scope) ✅
1. Novo campo opcional `setId?: string` em `LootItem`/`RelicItem`
   (`src/types/game.ts`) — aditivo, `undefined` para todo item hoje
   existente (backward-compatible com saves antigos, sem migração Zod
   necessária: campo ausente = item avulso, comportamento idêntico ao
   atual).
2. Novo arquivo `src/data/equipmentSets.json` com 2 conjuntos temáticos
   (ver Seção 6 — Decisão de Produto) que reaproveitam `RelicEffect` como
   formato de bônus por patamar (2 peças / 3 peças), reduzindo escopo de
   parsing (não é um shape novo).
3. Nova função pura `calculateSetBonuses(equipment: EquipmentSlots,
   sets: EquipmentSetDef[]): RelicEffect` em novo arquivo
   `src/game/systems/EquipmentSetSystem.ts` — testável isoladamente, sem
   depender de Zustand.
4. Estender `getRelicModifiers()` em `gameStore.ts` para somar o resultado
   de `calculateSetBonuses()` ao `combined` já calculado (soma aditiva no
   final da função, 1 linha de integração).
5. Marcar `setId` nos 2-3 itens de `relics.json`/pool de loot que
   participarão dos conjuntos iniciais (ver Seção 6).
6. Testes unitários de `calculateSetBonuses` (0/1/2/3 peças equipadas,
   peças de conjuntos diferentes simultaneamente, item repetido não conta
   dobrado).
7. Indicação textual simples no tooltip/descrição de item com `setId` (uma
   linha adicional, ex: "Conjunto: Sangue (2/3 peças equipadas)") — UI
   mínima, sem novo componente React dedicado.

### 3.2 Fora do Escopo (Out-of-Scope) ✅
- **UI dedicada de "Codex de Conjuntos"** (tela própria listando todos os
  sets e progresso) — a indicação textual no item já equipado (item 7) é
  suficiente para esta entrega; uma tela dedicada é spec satélite futura
  se o número de conjuntos crescer.
- **Habilidades especiais únicas por item lendário** (o protótipo Godot
  também tinha isso, além de sets) — sobreposição real com o sistema de
  Relíquias já entregue (spec 19); não portar agora para evitar dois
  sistemas paralelos de "efeito único por item". Se decidido no futuro,
  spec própria que decida explicitamente como os dois se relacionam.
- **Mais de 2 conjuntos na entrega inicial** — número pequeno de propósito
  para validar a mecânica (feedback de jogo real) antes de expandir
  conteúdo, que é trabalho de dados (`equipmentSets.json`), não de código.
- **Alterar `getRelicModifiers()` além da soma aditiva final** — a função
  existente continua sendo a fonte única de verdade para modificadores
  agregados; nenhuma outra chamada no código precisa saber que sets
  existem.

## 4. Requisitos Técnicos ✅

### Requisito 1 — Tipos (aditivos)
Em `src/types/game.ts`:
```typescript
// Em LootItem e RelicItem, adicionar campo opcional:
setId?: string;

// Novo tipo, mesmo arquivo:
export interface EquipmentSetDef {
  id: string;
  name: string;
  itemIds: string[];           // ids dos itens membros (LootItem.id/RelicItem.id)
  bonuses: {
    2?: Partial<RelicEffect>;  // bônus ativo com >= 2 peças do set equipadas
    3?: Partial<RelicEffect>;  // bônus ativo com >= 3 peças (substitui, não soma ao de 2 — ver Requisito 2)
  };
}
```

### Requisito 2 — `EquipmentSetSystem.ts` (novo arquivo, função pura)
```typescript
export function calculateSetBonuses(
  equipment: EquipmentSlots,
  sets: EquipmentSetDef[]
): RelicEffect {
  // 1. Coletar todos os itens equipados (weapon + armor + relics) com setId definido.
  // 2. Para cada set em `sets`, contar quantos itemIds distintos do set
  //    estão entre os equipados (Set<string> para não contar duplicata).
  // 3. Se count >= 2, aplicar bonuses[2]. Se count >= 3, aplicar bonuses[3]
  //    EM VEZ DE bonuses[2] (maior patamar sempre substitui o menor do
  //    mesmo set — nunca somar os dois patamares do mesmo conjunto).
  // 4. Combinar (somar campo a campo) os bônus de sets DIFERENTES que
  //    estejam ativos simultaneamente.
  // 5. Retornar um RelicEffect com os campos não usados como 0/undefined
  //    (mesmo shape default de `getRelicModifiers`, para soma direta).
}
```

### Requisito 3 — Integração em `gameStore.ts`
Ao final de `getRelicModifiers()` (linha ~751+, após o loop que já soma
relíquias individuais), adicionar:
```typescript
import { calculateSetBonuses } from '../game/systems/EquipmentSetSystem';
import equipmentSetsData from '../data/equipmentSets.json';
// ...
const setBonuses = calculateSetBonuses(equipment, equipmentSetsData as EquipmentSetDef[]);
// somar setBonuses campo a campo dentro de `combined` antes do `return combined;`
```
Nenhuma outra função precisa mudar — todo consumidor de
`getRelicModifiers()` (Player.ts, HUD) já recebe o total combinado.

### Skill a Consultar
Nenhuma skill de `.claude/skills/` é específica de itemização/dados —
seguir o padrão já estabelecido em `relics.json`/`RelicSystem` (spec 19)
como referência de estilo (JSON data-driven, função pura testável
separada do Zustand store).

## 5. Arquivos-Alvo ✅

| Arquivo | Mudança |
|---|---|
| `src/types/game.ts` | Campo opcional `setId?` em `LootItem`/`RelicItem`; novo tipo `EquipmentSetDef`. |
| `src/data/equipmentSets.json` | **Novo arquivo.** 2 conjuntos (ver Seção 6). |
| `src/game/systems/EquipmentSetSystem.ts` | **Novo arquivo.** Função pura `calculateSetBonuses`. |
| `src/game/systems/EquipmentSetSystem.test.ts` | **Novo arquivo.** Testes unitários (Seção 7). |
| `src/store/gameStore.ts` | 2 linhas de integração no final de `getRelicModifiers()`. |
| `src/data/relics.json` | Adicionar `setId` a 2-3 relíquias existentes que formarão os conjuntos (nenhum novo item de relíquia é criado — reaproveita o catálogo já entregue). |
| Componente de tooltip de item (`InventoryModal.tsx` ou equivalente) | 1 linha condicional: se `item.setId`, mostrar nome do set + contagem de peças equipadas. |

## 6. Decisões de Produto Necessárias

Sem confirmação em contrário do Felipe, o **default seguro** é reaproveitar
integralmente relíquias **já entregues e balanceadas** (spec 19) em vez de
criar itens novos — reduz risco de desbalanceamento e escopo:

```json
[
  {
    "id": "conjunto_sangue",
    "name": "Conjunto Sangue",
    "itemIds": ["selo_hemorragico", "olho_de_carmim"],
    "bonuses": {
      "2": { "lifestealBonus": 0.05, "damageMultiplier": 0.05 }
    }
  },
  {
    "id": "conjunto_abissal",
    "name": "Conjunto Abissal",
    "itemIds": ["coracao_abissal", "amuleto_do_martir", "calice_amaldicoado"],
    "bonuses": {
      "2": { "cooldownReductionBonus": 0.05 },
      "3": { "cooldownReductionBonus": 0.12, "maxHpBonus": 20 }
    }
  }
]
```
(Nomes/valores acima são um default implementável — Felipe pode renomear
ou rebalancear sem mudar código, já que é 100% dado em JSON.)

## 7. Testes e Critério de Aceite ✅

- `EquipmentSetSystem.test.ts` (Vitest):
  - 0 peças de qualquer set equipadas → `calculateSetBonuses` retorna
    todos os campos zerados/neutros.
  - Exatamente 1 peça de um set de 2 → nenhum bônus (precisa de 2+).
  - 2 peças do mesmo set → bônus de patamar "2" aplicado.
  - 3 peças de um set com patamar "3" definido → bônus de patamar "3"
    aplicado **em vez de** somado ao de "2" (não duplica).
  - Peças de **dois sets diferentes** equipadas simultaneamente → bônus de
    ambos somados corretamente.
  - Item com `setId` que não corresponde a nenhum set em
    `equipmentSets.json` (dado inconsistente) → não quebra, apenas não
    conta para nenhum bônus (fail-safe, sem exceção).
- `pnpm run typecheck`: 0 erros.
- `pnpm test`: 100% passando.
- Verificação manual: equipar as 2 relíquias do "Conjunto Sangue" e
  confirmar no HUD/tooltip que o bônus adicional é aplicado (dano/lifesteal
  visivelmente maior que a soma dos efeitos individuais das relíquias).

## 8. Guardrails

- **NÃO** altere o shape de `RelicEffect` em si — `calculateSetBonuses`
  retorna o mesmo tipo já existente, reaproveitado.
- **NÃO** modifique `relics.json` além de adicionar o campo `setId` aos
  itens escolhidos — não altere `effect`/`rarity`/`description` das
  relíquias já entregues e balanceadas.
- **NÃO** introduza um segundo caminho de persistência — sets não têm
  estado próprio salvo; são derivados em tempo real de `equipment` (já
  persistido via `equippedRelicIds`/`localStorage.ts` existente). Nenhuma
  mudança em `src/utils/localStorage.ts` é necessária nesta spec.
- Siga o checklist de `gameStore.ts` (NÍVEL 2, `01_CRITICAL_FILES.md`):
  mudança é aditiva (nova função + 2 linhas), sem alterar schema de
  persistência existente.

## 9. Referências

- [[../delivered/19_RELICS_AND_ARTIFACTS_SYSTEM.md]] — catálogo de
  relíquias reaproveitado por esta spec.
- [[../../critical/01_CRITICAL_FILES.md]] — guardrails de `gameStore.ts`.
- Spec irmã: [[33_BOSS_MULTIFASE_TELEGRAPH_SYSTEM.md]] (mesma origem de
  análise — protótipo Godot `felipeteixeirams/bloodmage1995`).

## Registro de Mudanças

| Data | O que mudou | Autor |
|------|-------------|-------|
| 2026-09-28 | Spec criada a partir da análise do protótipo Godot `bloodmage1995` — conceito de bônus de conjunto portado para o sistema de Relíquias já entregue (spec 19), reaproveitando catálogo existente | Claude |
