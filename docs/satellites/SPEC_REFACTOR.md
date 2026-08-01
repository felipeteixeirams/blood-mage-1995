---
node_type: Satellite
parent_node: /docs/SPEC.md
domain: Architecture Refactoring & Clean Code
token_weight: Medium (~700 tokens)
---

# 🧹 Satellite Spec: Refatoração Segura e Completa (Fase 1.5)

## Objetivo Geral
Refatorar a base de código atual, com foco principal na `GameScene.ts` e no `GameplayHUD.tsx`, para melhorar a manutenibilidade, legibilidade e modularidade do projeto, preparando o terreno para futuras atualizações. A refatoração será puramente estrutural, garantindo **zero regressão** no comportamento do jogo.

## Escopo
- **GameScene Refactoring**:
  - Extrair a lógica de geração procedural do mapa para um `DungeonGenerator`.
  - Extrair a lógica de controle e spawn de inimigos para um `EnemyManager`.
  - Extrair a configuração de grupos e gerenciamento de colisões para um `CollisionManager`.
- **GameplayHUD Componentization**:
  - Dividir o arquivo monolítico do HUD em subcomponentes menores (`MobileJoysticks`, `PlayerStatus`, `LootLog`, `PauseOverlay`).
- **Limpeza de Código**:
  - Remover variáveis não utilizadas e padronizar injeção de dependências.

## Fora do Escopo
- Adição de novas mecânicas, itens ou inimigos.
- Modificação no balanceamento ou regras de negócio (cálculos de dano, chance de loot).
- Troca de framework ou motor (continuaremos com Phaser e React).

## Arquitetura (Novos Módulos)
- `src/game/systems/DungeonGenerator.ts`: Responsável por criar as paredes, baús e gerenciar o chão procedural.
- `src/game/systems/EnemyManager.ts`: Responsável pelo pooling, spawn por wave, spawn de chefes e lógica de atualização de IA.
- `src/components/hud/`: Nova pasta para guardar os pedaços do `GameplayHUD.tsx`.

## Contratos
```typescript
export interface IDungeonGenerator {
    buildDungeonMap(width: number, height: number, floorDepth: number): void;
    clear(): void;
}

export interface IEnemyManager {
    spawnWave(waveIndex: number, floorDepth: number): void;
    update(time: number, delta: number): void;
    handleEnemyDeath(enemy: Enemy): void;
}
```

## Critérios de Aceite
- O arquivo `GameScene.ts` deve ser reduzido substancialmente (< 400 linhas).
- O arquivo `GameplayHUD.tsx` deve delegar renderizações longas para subcomponentes.
- O jogo deve funcionar perfeitamente sem alterações visuais ou comportamentais.
- O linter (`npm run lint`) e o build (`compile_applet`) devem passar sem erros.
