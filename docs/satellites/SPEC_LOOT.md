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
- Tabela de drop rate (Comum, Raro, Épico).
- Sistema de inventário em memória (aplicação de status passivos no Player).
- HUD simplificado no React para mostrar últimos itens coletados.
- Baús de loot pelo mapa.

## Fora do Escopo
- Gráficos hiper-realistas para itens (usaremos cores/textos procedurais).
- Drag-and-drop complexo no inventário (aplicação automática de bônus por agora).

## Arquitetura
- `src/game/objects/Loot.ts`: Classe do item físico no chão.
- `src/game/systems/LootSystem.ts`: Gerador procedural de atributos.
- `src/types/loot.ts`: Contratos e tipos de itens.
- Modificação em `src/game/objects/Player.ts` para recalcular status (Dano, HP Máximo, Velocidade) baseado nos itens.
- Modificação no `GameScene` para spawnar loot ao matar inimigos ou abrir baús.

## Contratos
```typescript
export type ItemRarity = 'common' | 'rare' | 'epic';
export type ItemType = 'weapon' | 'armor' | 'relic';

export interface LootItem {
  id: string;
  name: string;
  type: ItemType;
  rarity: ItemRarity;
  stats: {
    damageMultiplier?: number;
    maxHpBonus?: number;
    speedBonus?: number;
    lifestealBonus?: number;
  };
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
