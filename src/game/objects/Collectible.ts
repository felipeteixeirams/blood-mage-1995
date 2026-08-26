import Phaser from 'phaser';

export type CollectibleType = 'hp' | 'mana';

export class Collectible extends Phaser.Physics.Arcade.Sprite {
  public type: CollectibleType;
  public amount: number;

  constructor(scene: Phaser.Scene, x: number, y: number, type: CollectibleType, amount: number) {
    const key = type === 'hp' ? 'orb_hp' : 'orb_mana';
    super(scene, x, y, key);
    if ((scene as any).lightingSystem) { (scene as any).lightingSystem.applyLightPipeline(this); }
    if ((scene as any).lightingPolish) { (scene as any).lightingPolish.addCollectibleGlow(this, type); }
    this.type = type;
    this.amount = amount;

    scene.add.existing(this);
    scene.physics.add.existing(this);

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
