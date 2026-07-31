import Phaser from 'phaser';
import { generateGameTextures } from '../../utils/textureGenerator';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // Generate procedural pixel textures
    generateGameTextures(this);
  }

  create() {
    this.scene.start('GameScene');
  }
}
