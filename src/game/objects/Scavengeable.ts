import Phaser from 'phaser';

export type ScavengeableType = 'skeleton' | 'corpse' | 'crate' | 'player_corpse';

export class Scavengeable extends Phaser.Physics.Arcade.Sprite {
  public scavengeType: ScavengeableType;
  public isScavenged: boolean = false;
  public duration: number;
  public lootData?: any;

  constructor(scene: Phaser.Scene, x: number, y: number, type: ScavengeableType) {
    let spriteKey = 'spr_chest';
    let duration = 2000;

    if (type === 'skeleton') {
      spriteKey = 'spr_skeleton_remains';
      duration = 1500;
    } else if (type === 'corpse') {
      spriteKey = 'spr_dead_soldier';
      duration = 3000;
    } else if (type === 'player_corpse') {
      spriteKey = 'spr_dead_soldier';
      duration = 4000;
    } else if (type === 'crate') {
      spriteKey = 'spr_chest';
      duration = 1800;
    }

    super(scene, x, y, spriteKey);
    this.scavengeType = type;
    this.duration = duration;

    if (type === 'player_corpse') {
      this.setTint(0xff0000); // Red tint for player corpse
    } else if (type === 'crate') {
      this.setTint(0xa16207); // Brown wood tint
    }

    scene.add.existing(this);
    scene.physics.add.existing(this, true); // Static body
  }
}
