import Phaser from 'phaser';
import { GameScene } from '../scenes/GameScene';

export type TrapState = 'hidden' | 'warn' | 'active';

export class SpikeTrap extends Phaser.Physics.Arcade.Sprite {
  public currentState: TrapState = 'hidden';
  private timer: Phaser.Time.TimerEvent;
  
  // Timings in ms
  private hiddenDuration = 2000;
  private warnDuration = 1000;
  private activeDuration = 2000;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'spr_spike_hidden');
    scene.add.existing(this);
    scene.physics.add.existing(this, true); // static body
    
    // Non-blocking physically, but we'll use overlap detection
    const body = this.body as Phaser.Physics.Arcade.StaticBody;
    body.setSize(24, 24);
    body.setOffset(4, 4);
    this.setDepth(y - 10); // Under players

    // Start cycle with some random offset
    this.timer = scene.time.delayedCall(Math.random() * 2000, () => {
      this.cycleState();
    });
  }

  private cycleState() {
    if (!this.active) return;
    
    switch (this.currentState) {
      case 'hidden':
        this.currentState = 'warn';
        this.setTexture('spr_spike_warn');
        this.timer = this.scene.time.delayedCall(this.warnDuration, () => this.cycleState());
        break;
      case 'warn':
        this.currentState = 'active';
        this.setTexture('spr_spike_active');
        this.timer = this.scene.time.delayedCall(this.activeDuration, () => this.cycleState());
        break;
      case 'active':
        this.currentState = 'hidden';
        this.setTexture('spr_spike_hidden');
        this.timer = this.scene.time.delayedCall(this.hiddenDuration, () => this.cycleState());
        break;
    }
  }

  public isActive(): boolean {
    return this.currentState === 'active';
  }

  destroy(fromScene?: boolean) {
    if (this.timer) this.timer.destroy();
    super.destroy(fromScene);
  }
}

export class ExplosiveBarrel extends Phaser.Physics.Arcade.Sprite {
  public isExploded = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'spr_barrel');
    scene.add.existing(this);
    scene.physics.add.existing(this, true); // static blocking body
    
    const body = this.body as Phaser.Physics.Arcade.StaticBody;
    body.setCircle(12, 4, 4);
    this.setDepth(y);
  }

  public explode(gameScene: GameScene) {
    if (this.isExploded) return;
    this.isExploded = true;
    
    // Explosion Visuals
    gameScene.combatEffects.spawnBloodBurst(this.x, this.y, 25);
    
    // Damage entities in radius
    const explosionRadius = 80;
    const damage = 100; // Large AoE damage

    // Check player
    if (Phaser.Math.Distance.Between(this.x, this.y, gameScene.player.x, gameScene.player.y) <= explosionRadius) {
      gameScene.collisionHandlers.handleTrapDamage(gameScene.player, damage);
    }

    // Check enemies
    if (gameScene.enemiesGroup) {
      gameScene.enemiesGroup.getChildren().forEach((enemyObj: any) => {
        if (!enemyObj.active) return;
        const dist = Phaser.Math.Distance.Between(this.x, this.y, enemyObj.x, enemyObj.y);
        if (dist <= explosionRadius) {
          gameScene.collisionHandlers.handleEnemyTrapDamage(enemyObj, damage);
        }
      });
    }

    // Camera shake & sound
    gameScene.cameras.main.shake(150, 0.015);
    // (Optional) gameScene.soundEngine.playExplosion();

    this.destroy();
  }
}
