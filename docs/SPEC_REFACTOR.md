# Spec: Refatoração Segura e Completa (Fase 1.5)

## Objetivo Geral
Refatorar a base de código atual, com foco principal na `GameScene.ts` (que se tornou um "God Object" com quase 1000 linhas) e no `GameplayHUD.tsx`, para melhorar a manutenibilidade, legibilidade e modularidade do projeto, preparando o terreno para futuras atualizações. A refatoração será puramente estrutural, garantindo **zero regressão** no comportamento do jogo.

## Escopo
- **GameScene Refactoring**:
  - Extrair a lógica de geração procedural do mapa para um `DungeonGenerator`.
  - Extrair a lógica de controle e spawn de inimigos para um `EnemyManager`.
  - Extrair a configuração de grupos e gerenciamento de colisões para um `CollisionManager` ou delegar adequadamente.
- **GameplayHUD Componentization**:
  - Dividir o arquivo monolítico do HUD em subcomponentes menores e focados (ex: `MobileJoysticks`, `PlayerStatus`, `LootLog`, `PauseOverlay`).
- **Limpeza de Código**:
  - Remover variáveis não utilizadas.
  - Padronizar injeção de dependências (passar a cena principal para os managers).

## Fora do Escopo
- Adição de novas mecânicas, itens ou inimigos.
- Modificação no balanceamento ou regras de negócio (cálculos de dano, chance de loot).
- Troca de framework ou motor (continuaremos com Phaser e React).

## Arquitetura (Novos Módulos)
- `src/game/systems/DungeonGenerator.ts`: Responsável por criar as paredes, baús e gerenciar o chão procedural.
- `src/game/systems/EnemyManager.ts`: Responsável pelo pooling, spawn por wave, spawn de chefes e lógica de atualização de IA.
- `src/game/systems/CombatManager.ts`: (Opcional/Depende da análise) Lógica de resolução de danos e emissão de partículas.
- `src/components/hud/`: Nova pasta para guardar os pedaços do `GameplayHUD.tsx`.

## Contratos
Os novos managers receberão a instância da `GameScene` (ou `scene: Phaser.Scene`) em seus construtores para poderem acessar a física e os grupos.

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

## Fluxo da Refatoração
A refatoração será feita de forma iterativa, em etapas seguras:
1. **Etapa 1**: Criar os arquivos base dos Managers.
2. **Etapa 2**: Mover a geração de mapa (Dungeon) primeiro, pois é a mais isolada. Testar.
3. **Etapa 3**: Mover a lógica de Inimigos (EnemyManager) e delegar os updates. Testar.
4. **Etapa 4**: Refatorar o React HUD. Testar.

## Corner Cases / Riscos
- **Perda de Contexto (`this`)**: Funções de callback de colisão do Phaser podem perder o contexto do `this` ao serem movidas para outras classes. Uso de arrow functions ou `.bind()` será estritamente avaliado.
- **Race Conditions no React**: Desmontar pedaços do HUD pode interferir nos listeners de eventos globais (ex: `loot-acquired`). Usar os hooks do React (`useEffect` cleanup) com cautela.

## Critérios de Aceite
- O arquivo `GameScene.ts` deve ser reduzido substancialmente (objetivo: < 400 linhas).
- O arquivo `GameplayHUD.tsx` deve delegar renderizações longas para subcomponentes.
- O jogo deve iniciar, gerar fases, permitir combate, dropar loot e exibir o HUD perfeitamente como antes, sem alterações visuais ou comportamentais.
- O linter (`npm run lint`) e o build (`compile_applet`) devem passar sem erros.
