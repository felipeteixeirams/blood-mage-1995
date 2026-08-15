import Phaser from 'phaser';
import { generateGameTextures } from '../../utils/textureGenerator';
import { queueAssetLoading } from '../assets/assetManifest';
import { registerAllAnimations } from '../animations/animationManager';

export class BootScene extends Phaser.Scene {
  private progressBar?: Phaser.GameObjects.Graphics;
  private progressBox?: Phaser.GameObjects.Graphics;
  private loadingText?: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Create Dark Gothic Loading Bar
    const boxW = Math.min(320, width * 0.7);
    const boxH = 20;
    const boxX = (width - boxW) / 2;
    const boxY = height / 2;

    this.progressBox = this.add.graphics();
    this.progressBox.fillStyle(0x180914, 0.85);
    this.progressBox.fillRect(boxX, boxY, boxW, boxH);
    this.progressBox.lineStyle(1.5, 0xd4af37, 0.9);
    this.progressBox.strokeRect(boxX, boxY, boxW, boxH);

    this.progressBar = this.add.graphics();

    this.loadingText = this.add
      .text(width / 2, boxY - 24, 'AWAKENING BLOOD MAGIC...', {
        fontFamily: 'Cinzel, Georgia, serif',
        fontSize: '13px',
        color: '#e2e8f0',
      })
      .setOrigin(0.5, 0.5);

    // Track loading progress
    this.load.on('progress', (value: number) => {
      if (this.progressBar) {
        this.progressBar.clear();
        this.progressBar.fillStyle(0xa81c2b, 1);
        const padding = 2;
        this.progressBar.fillRect(
          boxX + padding,
          boxY + padding,
          (boxW - padding * 2) * value,
          boxH - padding * 2
        );
      }
    });

    // Enqueue registered external sprites and assets
    queueAssetLoading(this);
  }

  create() {
    // Generate procedural fallbacks for any assets that were not loaded physically
    generateGameTextures(this, { force: false });

    // Register all entity and monster animations
    registerAllAnimations(this);

    // Clean up loading UI
    if (this.progressBar) this.progressBar.destroy();
    if (this.progressBox) this.progressBox.destroy();
    if (this.loadingText) this.loadingText.destroy();

    // Launch main gameplay scene
    this.scene.start('GameScene', this.sys.settings.data);
  }
}

