---
name: phaser-4-physics-combat
description: Configuração de Arcade Physics, corpos dinâmicos e estáticos, hitboxes isométricas, projéteis, poda espacial de raycast e prevenção de dano por contato passivo no Phaser 4.2.1 para o Bloodmage 1995.
---

# ⚔️ Skill: Phaser 4.2.1 Arcade Physics & Combat Systems

Esta skill estabelece as diretrizes de física arcade, detecção de colisões, hitboxes precisas e cálculos espaciais no **Phaser 4.2.1**, respeitando as regras estritas de combate e performance do **Bloodmage 1995**.

---

## ⚙️ 1. Configuração e Corpos Físicos no Phaser 4

O Bloodmage 1995 utiliza **Arcade Physics** com gravidade zero (`top-down / isométrico 2.5D`):

```typescript
// Configuração típica na GameConfig:
physics: {
  default: 'arcade',
  arcade: {
    gravity: { x: 0, y: 0 },
    fps: 60,
    debug: false,
  },
}
```

### A. Corpos Dinâmicos vs Estáticos
- **Corpos Dinâmicos (`physics.add.sprite`)**: Entidades que se movem, sofrem impulsos e têm velocidade (Jogador, Inimigos, Projéteis).
- **Corpos Estáticos (`physics.add.staticSprite` / `staticGroup`)**: Elementos do cenário que nunca se movem (Paredes, Pilares, Altares, Baús).

```typescript
// Parede de masmorra estática
const wall = this.physics.add.staticImage(tileX, tileY, 'wall_stone');
wall.refreshBody(); // Essencial após mudar posição ou escala de corpo estático
```

---

## 🎯 2. Hitboxes Isométricas e Ajuste de Bounding Box

Em jogos top-down/isométricos, a caixa de colisão com o cenário deve cobrir apenas a **base/pés** do personagem, permitindo que a cabeça se sobreponha naturalmente a paredes ao norte.

### Ajuste Padrão de Hitbox (Pés vs Corpo)
```typescript
export function setupIsometricBody(sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody): void {
  // Para um sprite de 68x68:
  const bodyWidth = 24;
  const bodyHeight = 16;
  const offsetX = (sprite.width - bodyWidth) / 2;
  const offsetY = sprite.height - bodyHeight - 4; // Ancorado nos pés

  sprite.body.setSize(bodyWidth, bodyHeight);
  sprite.body.setOffset(offsetX, offsetY);
  sprite.body.setCollideWorldBounds(true);
}
```

---

## 🏹 3. Projéteis e Colisão com Barreiras (Anti-Wallhack)

Projéteis mágicos (Blood Orbs, Blood Needles) devem sempre validar colisão contra o grupo de paredes (`wallsGroup`) **antes** ou em paralelo à colisão com inimigos:

```typescript
// 1. Colisão com paredes destrói o projétil imediatamente
this.physics.add.collider(
  this.projectilesGroup,
  this.wallsGroup,
  (projObj, wallObj) => {
    const proj = projObj as BloodProjectile;
    proj.onImpactWall();
  },
  undefined,
  this
);

// 2. Overlap com inimigos aplica dano
this.physics.add.overlap(
  this.projectilesGroup,
  this.enemiesGroup,
  (projObj, enemyObj) => {
    const proj = projObj as BloodProjectile;
    const enemy = enemyObj as BaseEnemy;
    proj.onHitEnemy(enemy);
  },
  undefined,
  this
);
```

---

## 👁️ 4. Poda Espacial (Spatial Pruning) para Raycasting e LoS

O raycasting do Phaser (`Phaser.Geom.Intersects`) e testes de linha de visão (Line of Sight - LoS) podem degradar a CPU se executados para dezenas de inimigos a cada 16ms.

### Regra de Ouro: Poda por Distância ao Quadrado (AABB Pruning)
Nunca faça raycast antes de validar se o alvo está dentro do raio máximo de visão usando distância ao quadrado (`distanceSquared`), que não calcula raiz quadrada:

```typescript
export function hasLineOfSight(
  source: { x: number; y: number },
  target: { x: number; y: number },
  maxVisionRange: number,
  walls: Phaser.GameObjects.GameObject[]
): boolean {
  const maxRangeSq = maxVisionRange * maxVisionRange;
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const distSq = dx * dx + dy * dy;

  // 1. Poda rápida: se estiver fora do raio, rejeita imediatamente sem custo
  if (distSq > maxRangeSq) {
    return false;
  }

  // 2. Se passou na poda, traça a linha geométrica
  const sightLine = new Phaser.Geom.Line(source.x, source.y, target.x, target.y);

  // 3. Verifica se alguma parede obstrui a visão
  for (let i = 0; i < walls.length; i++) {
    const wallBounds = (walls[i] as any).getBounds();
    if (Phaser.Geom.Intersects.LineToRectangle(sightLine, wallBounds)) {
      return false; // Bloqueado por obstáculo
    }
  }

  return true;
}
```

---

## 🚨 5. Guardrails Rígidos de Combate (MUST OBEY)

1. **PROIBIDO DANO POR CONTATO PASSIVO (Touch Damage)**:
   - Inimigos colidindo com o jogador (`physics.add.collider(player, enemies)`) devem apenas **bloquear passagem física**.
   - O jogador NUNCA toma dano por encostar em um inimigo parado ou andando.
   - O dano só ocorre quando o inimigo executa um golpe ativo através de sua FSM (`Windup` ➔ `Strike` ➔ `Recovery`).
2. **Hitboxes Ativas Efêmeras**:
   - A hitbox de ataque melee deve existir **apenas durante a fase de `Strike`** e ser desativada/destruída na fase de `Recovery`.
3. **Ponte com o React**:
   - Variações de HP, Sangue e Status causadas pelo combate devem atualizar o store Zustand (`useGameStore.getState().takeDamage(...)`), disparando os efeitos visuais na HUD React sem renderizar texto no canvas.
