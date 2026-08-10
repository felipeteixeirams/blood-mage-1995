import Phaser from 'phaser';

export class Projectile extends Phaser.Physics.Arcade.Sprite {
  public damage: number = 20;
  public isEnemyProjectile: boolean = false;
  public statusEffectOnHit?: { type: 'bleeding' | 'poison' | 'infection'; chance: number };
  private lifespanTimer: number = 3000;

  constructor(scene: Phaser.Scene, x: number, y: number, key: string = 'proj_blood_bolt') {
    super(scene, x, y, key);
    scene.add.existing(this);
    scene.physics.add.existing(this);
  }

  public fire(
    x: number,
    y: number,
    angle: number,
    speed: number,
    damage: number,
    isEnemy: boolean = false,
    statusEffectOnHit?: { type: 'bleeding' | 'poison' | 'infection'; chance: number }
  ) {
    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);
    this.damage = damage;
    this.isEnemyProjectile = isEnemy;
    this.statusEffectOnHit = statusEffectOnHit;
    this.lifespanTimer = 2500;

    this.setRotation(angle);
    this.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
  }

  public updateProjectile(time: number, delta: number) {
    if (!this.active) return;
    this.lifespanTimer -= delta;
    if (this.lifespanTimer <= 0) {
      this.destroy();
    }
  }
}
