import Phaser from 'phaser';

export class Projectile extends Phaser.Physics.Arcade.Sprite {
  public damage: number = 20;
  public isEnemyProjectile: boolean = false;
  private lifespanTimer: number = 3000;
  public light?: Phaser.GameObjects.Light;

  constructor(scene: Phaser.Scene, x: number, y: number, key: string = 'proj_blood_bolt') {
    super(scene, x, y, key);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Set lighting pipeline
    this.setLighting(true);
  }

  public fire(x: number, y: number, angle: number, speed: number, damage: number, isEnemy: boolean = false) {
    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);
    this.damage = damage;
    this.isEnemyProjectile = isEnemy;
    this.lifespanTimer = 2500;

    this.setRotation(angle);
    this.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);

    // Create a dynamic light trailing this projectile
    // Crimson/Red light for player blood bolts, secondaryViolet color for enemy bolt
    const lightColor = isEnemy ? 0xaf52de : 0xff3344;
    const lightRadius = isEnemy ? 40 : 50;
    const lightIntensity = isEnemy ? 1.5 : 2.0;

    this.light = this.scene.lights.addLight(x, y, lightRadius, lightColor, lightIntensity);
  }

  public updateProjectile(time: number, delta: number) {
    if (!this.active) return;
    this.lifespanTimer -= delta;

    // Follow light if active
    if (this.light) {
      this.light.x = this.x;
      this.light.y = this.y;
    }

    if (this.lifespanTimer <= 0) {
      this.destroy();
    }
  }

  public destroy(fromScene?: boolean) {
    if (this.light) {
      this.scene.lights.removeLight(this.light);
      this.light = undefined;
    }
    super.destroy(fromScene);
  }
}
