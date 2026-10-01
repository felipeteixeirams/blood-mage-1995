import Phaser from 'phaser';
import { LootItem } from '../../types/game';

export class LootSprite extends Phaser.Physics.Arcade.Sprite {
  public lootData: LootItem;
  private floatTween: Phaser.Tweens.Tween;

  constructor(scene: Phaser.Scene, x: number, y: number, lootData: LootItem) {
    const textureKey = `spr_item_${lootData.type}`;
    super(scene, x, y, scene.textures.exists(textureKey) ? textureKey : 'particle_orb_blue');
    if ((scene as any).lightingSystem) { (scene as any).lightingSystem.applyLightPipeline(this); }
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.lootData = lootData;

    this.setCircle(16);
    this.setDepth(150); // Under player/enemies

    // Tint based on rarity
    if (lootData.rarity === 'common') this.setTint(0x94a3b8);
    else if (lootData.rarity === 'rare') this.setTint(0x3b82f6); // Blue
    else if (lootData.rarity === 'epic') this.setTint(0xa855f7); // Purple
    else if (lootData.rarity === 'legendary') this.setTint(0xf59e0b); // Gold

    // Floating and scale pulse animation
    this.floatTween = scene.tweens.add({
      targets: this,
      y: y - 12,
      scaleX: lootData.rarity === 'legendary' ? 1.3 : 1.1,
      scaleY: lootData.rarity === 'legendary' ? 1.3 : 1.1,
      duration: 900,
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
