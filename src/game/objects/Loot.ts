import Phaser from 'phaser';
import { LootItem } from '../../types/game';

export class LootSprite extends Phaser.Physics.Arcade.Sprite {
  public lootData: LootItem;
  private floatTween: Phaser.Tweens.Tween;

  constructor(scene: Phaser.Scene, x: number, y: number, lootData: LootItem) {
    super(scene, x, y, 'particle_orb_blue'); // We can reuse some sprite, maybe generate one dynamically
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.lootData = lootData;

    this.setCircle(8);
    this.setDepth(150); // Under player/enemies

    // Tint based on rarity
    if (lootData.rarity === 'common') this.setTint(0xffffff);
    else if (lootData.rarity === 'rare') this.setTint(0x3b82f6); // Blue
    else if (lootData.rarity === 'epic') this.setTint(0xa855f7); // Purple
    else if (lootData.rarity === 'legendary') this.setTint(0xfacc15); // Golden

    // Simple floating animation
    this.floatTween = scene.tweens.add({
      targets: this,
      y: y - 10,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  destroy(fromScene?: boolean) {
    if (this.floatTween) {
      this.floatTween.stop();
    }
    super.destroy(fromScene);
  }
}
