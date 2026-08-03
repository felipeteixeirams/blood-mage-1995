---
node_type: Satellite
parent_node: /docs/SPEC.md
domain: Gameplay Mechanics / Loot System
token_weight: Medium (~600 tokens)
---

# 📦 Satellite Spec: Sistema de Loot e Atributos Dinâmicos

## Objetivo Geral
Adicionar profundidade ao ciclo de jogo recompensando o jogador com itens que alteram atributos ao derrotar inimigos e explorar andares.

## Escopo
- Definição de tipos de itens (Arma, Armadura, Relíquia).
- Tabela de drop rate e raridades (Comum, Raro, Épico, Lendário).
- Slots de equipamento (Arma Principal, Armadura, Relíquias).
- Modal de Inventário do Hemomante (tecla [I]) com estatísticas e log.
- Baús de loot procedural com taxas de drop elevadas e garantidas.
- Moeda metagame Cristais de Sangue (💎) ao derrotar chefes e abrir baús.

## Fora do Escopo
- Gráficos hiper-realistas para itens (usaremos cores/textos procedurais).
- Drag-and-drop complexo no inventário.

## Arquitetura
- `src/game/objects/Loot.ts`: Sprite animado do loot com brilho colorido por raridade (Lendário = pulso dourado).
- `src/game/systems/LootSystem.ts`: Gerador procedural de atributos, tabela de raridade e drop pools para baús.
- `src/types/game.ts`: Interfaces `LootItem`, `EquipmentSlots`, `ItemRarity` e `ItemType`.
- `src/components/InventoryModal.tsx`: Interface gótica do inventário com visualização de slots e resumo de status.
- Modificação em `src/game/objects/Player.ts` para recalcular status e aplicar vampirismo/cooldown.
- Modificação em `src/game/scenes/GameScene.ts` para spawnar loot ao matar inimigos e abrir baús.

## Contratos
```typescript
export type ItemRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type ItemType = 'weapon' | 'armor' | 'relic';

export interface LootItem {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  rarity: ItemRarity;
  stats: {
    damageMultiplier?: number;
    maxHpBonus?: number;
    speedBonus?: number;
    lifestealBonus?: number;
    cooldownReduction?: number;
  };
}

export interface EquipmentSlots {
  weapon: LootItem | null;
  armor: LootItem | null;
  relics: LootItem[];
}
```

## Fluxo
1. Inimigo morre -> Chance de 20% de gerar um `LootItem`.
2. Cria sprite (brilho colorido) no chão.
3. Jogador encosta no sprite -> `Player.equipLoot(item)`.
4. Recalcula atributos.
5. Emite evento para React (`window.dispatchEvent`) atualizando log de loot.

## Corner Cases
- Acúmulo de multiplicadores quebrando o balanceamento (limitar buff máximo).
- Memory leak por muitos itens no chão (destruir itens deixados para trás ao mudar de andar).

## Critérios de Aceite
- Ao matar inimigos, deve cair loot ocasionalmente.
- Pegar o loot deve aumentar o status visivelmente.
- O log do HUD deve mostrar o item pego.
