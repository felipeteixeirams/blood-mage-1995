import Phaser from 'phaser';

export type CollectibleType = 'hp' | 'mana' | 'xp';

export class Collectible extends Phaser.Physics.Arcade.Sprite {
  public type: CollectibleType;
  public amount: number;

  constructor(scene: Phaser.Scene, x: number, y: number, type: CollectibleType, amount: number) {
    const key = type === 'hp' ? 'orb_hp' : type === 'mana' ? 'orb_mana' : 'gem_xp';
    super(scene, x, y, key);
    this.type = type;
    this.amount = amount;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Set lighting pipeline
    this.setLighting(true);

    // Floating bobbing animation
    scene.tweens.add({
      targets: this,
      y: y - 4,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  public attractToPlayer(playerX: number, playerY: number, speed: number = 220) {
    const angle = Phaser.Math.Angle.Between(this.x, this.y, playerX, playerY);
    this.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
  }
}
