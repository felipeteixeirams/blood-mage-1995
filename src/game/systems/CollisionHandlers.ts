import Phaser from 'phaser';

export class CollisionHandlers {
  constructor(private scene: Phaser.Scene) {}

  public handlePlayerOpenChest(player: any, chest: any) {
    if (chest && typeof chest.open === 'function') {
      chest.open();
    }
  }

  public handleProjectileHitWall(projectile: any, wall: any) {
    if (projectile && typeof projectile.destroy === 'function') {
      projectile.destroy();
    }
  }

  public handleProjectileHitEnemy(projectile: any, enemy: any) {
    if (projectile && typeof projectile.destroy === 'function') {
      projectile.destroy();
    }
    if (enemy && typeof enemy.takeDamage === 'function') {
      enemy.takeDamage(projectile.damage || 10);
    }
  }
}

export function handlePlayerOpenChest(player: any, chest: any) {
  if (chest && typeof chest.open === 'function') {
    chest.open();
  }
}

export function handleProjectileHitWall(projectile: any, wall: any) {
  if (projectile && typeof projectile.destroy === 'function') {
    projectile.destroy();
  }
}

export function handleProjectileHitEnemy(projectile: any, enemy: any) {
  if (projectile && typeof projectile.destroy === 'function') {
    projectile.destroy();
  }
  if (enemy && typeof enemy.takeDamage === 'function') {
    enemy.takeDamage(projectile.damage || 10);
  }
}
