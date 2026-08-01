---
node_type: Satellite
parent_node: /docs/SPEC.md
domain: Gameplay Mechanics & Boss Battles
token_weight: Medium (~600 tokens)
---

# 👑 Spec: Boss Encounters & Bullet Hell Mechanics (Fase 2)

## 1. Objetivo Geral
Implementar encontros épicos de chefões a cada 5 andares da masmorra (ex: Andar 5, 10, 15). O chefe possui padrões de ataque no estilo "Bullet Hell", barra de vida dedicada na UI do React e recompensa de loot de alta raridade ao ser derrotado.

## 2. Escopo & Fora do Escopo
- **Entra**:
  - Invocação automática do Necro Lord Boss ao atingir o andar múltiplo de 5.
  - Padrões de projéteis em leque/anel ("Bullet Hell") com disparo circular e espiral.
  - Indicadores visuais de ataque (telegraph) antes de habilidades devastadoras.
  - Sincronização de vida do Chefe via estado/eventos com o `GameplayHUD`.
  - Invocação de portal e baú lendário de loot após a derrota.
- **Não Entra**:
  - Múltiplos modelos 3D ou dependências pesadas de mídia externa.
  - Alterações no sistema de mapa procedural fora da arena de chefe.

## 3. Arquitetura & Módulos Impactados
- `src/game/objects/Boss.ts`: Nova classe extendendo `Phaser.Physics.Arcade.Sprite` para controlar inteligência, fases e projéteis do chefe.
- `src/game/scenes/GameScene.ts`: Lógica de spawn do chefe no andar 5+ e gerenciamento do grupo de projéteis hostis.
- `src/components/GameplayHUD.tsx` ou `src/components/hud/BossHealthBar.tsx`: Componente de barra de vida de topo com nome e fase do chefe.
- `src/store/gameStore.ts`: Estado do chefe (`bossHealth`, `bossMaxHealth`, `bossActive`, `bossName`).

## 4. Contratos & Tipos (TypeScript)

```typescript
export interface BossStats {
  name: string;
  maxHealth: number;
  currentHealth: number;
  phase: number;
  attackCooldown: number;
}

export type BulletPattern = 'RING_BURST' | 'SPIRAL_SWARM' | 'BLOOD_NOVA_TELEGRAPH';
```

## 5. Fluxo de Execução
1. **Andar Múltiplo de 5**: Ao entrar no Andar 5, `GameScene` limpa mobs normais da sala central e invoca o `Necro Lord Boss`.
2. **Ciclo de Fase 1 (100% - 50% HP)**:
   - Disparo regular de `proj_energy_bolt` direcionado ao jogador.
   - Padrão `RING_BURST`: Dispara 12 projéteis em 360° com intervalo regular.
3. **Ciclo de Fase 2 (50% - 0% HP)**:
   - Enrage visual (partículas de sangue e brilho vermelho acelerado).
   - Padrão `SPIRAL_SWARM`: Projéteis giratórios em padrão espiral.
4. **Derrota do Chefe**:
   - Explosão de partículas e drop de `gem_xp`, orbes e baú de ouro com garantia de item Raro/Lendário.
   - Aparição do portal para o próximo andar.

## 6. Critérios de Aceite
- [ ] A barra de vida do chefe surge no topo do HUD apenas quando o chefe está ativo.
- [ ] O chefe altera os padrões de projéteis na metade da vida.
- [ ] A taxa de quadros (FPS) permanece em 60 FPS durante o Bullet Hell.
- [ ] Derrotar o chefe libera a passagem para o próximo nível com taxa garantida de loot lendário.
