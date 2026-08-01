import Phaser from 'phaser';
import { Enemy } from './Enemy';
import { Projectile } from './Projectile';
import { useGameStore } from '../../store/gameStore';
import { soundEngine } from '../../utils/soundEngine';

export class Boss extends Enemy {
  public bossPhase: number = 1;
  private isEnraged: boolean = false;

  // Custom Cooldown Timers
  private lastRingBurstTime: number = 0;
  private lastSpiralSwarmTime: number = 0;
  private lastNormalShootTime: number = 0;

  // Telegraph states
  private isTelegraphing: boolean = false;
  private telegraphEndTime: number = 0;
  private telegraphType: 'ring' | 'spiral' | 'none' = 'none';

  // Spiral Swarm state
  private isChannelingSpiral: boolean = false;
  private spiralEndTime: number = 0;
  private nextSpiralShotTime: number = 0;
  private spiralAngle: number = 0;

  // Telegraph Graphics Overlay
  private telegraphGraphics: Phaser.GameObjects.Graphics;
  private enrageEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor(scene: Phaser.Scene, x: number, y: number, monsterId: string) {
    super(scene, x, y, monsterId);

    // Initial scale is 2.2x as per necro_lord_boss config
    this.baseScale = this.config.scale || 2.2;
    this.setScale(this.baseScale);

    // Setup Telegraph Graphics
    this.telegraphGraphics = scene.add.graphics().setDepth(1400);

    // Setup Enrage Red Aura Particles (disabled initially)
    this.enrageEmitter = scene.add.particles(0, 0, 'particle_blood_red', {
      scale: { start: 0.25, end: 0 },
      alpha: { start: 0.6, end: 0 },
      speed: { min: 20, max: 50 },
      lifespan: 500,
      frequency: 80,
      emitting: false
    }).setDepth(1450);

    // Activate the React UI Boss HUD
    useGameStore.getState().setBossActive(true, this.config.name, this.maxHp);
  }

  private triggerEnrage() {
    this.isEnraged = true;
    soundEngine.playBossRoar();

    // Visual changes
    this.setTint(0xff3333);

    // Scale increase
    this.scene.tweens.add({
      targets: this,
      scaleX: this.baseScale * 1.25,
      scaleY: this.baseScale * 1.25,
      duration: 600,
      ease: 'Bounce.easeOut'
    });

    // Slow movement speed, but increase firepower (scale/speed inversely proportional as requested)
    // Reduce movement speed to 65% of base
    this.config.speed = this.config.speed * 0.65;

    // Start red warning aura particles
    if (this.enrageEmitter) {
      this.enrageEmitter.start();
      this.enrageEmitter.startFollow(this);
    }

    // Float notification text
    if (typeof (this.scene as any).spawnFloatingText === 'function') {
      (this.scene as any).spawnFloatingText(this.x, this.y - 40, 'FÚRIA PROFANA!', '#ef4444', true);
    }
  }

  override updateEnemy(
    time: number,
    delta: number,
    playerX: number,
    playerY: number,
    hasWallBetweenPlayer: boolean,
    nearbyEnemies?: Enemy[]
  ): { attack: boolean; damage: number; attackType?: 'melee' | 'ranged'; dodged?: boolean } {
    if (!this.active) return { attack: false, damage: 0 };

    // Update enrage emitter position
    if (this.isEnraged && this.enrageEmitter) {
      this.enrageEmitter.setPosition(this.x, this.y);
    }

    // Clear previous frame telegraph graphics
    this.telegraphGraphics.clear();

    const distanceToPlayer = Phaser.Math.Distance.Between(this.x, this.y, playerX, playerY);

    // If telegraph is active
    if (this.isTelegraphing) {
      this.setVelocity(this.body.velocity.x * 0.1, this.body.velocity.y * 0.1);

      // Draw red flashing telegraphed circle/fan lines on floor
      const alphaVal = 0.2 + Math.abs(Math.sin(time * 0.015)) * 0.35;
      this.telegraphGraphics.lineStyle(3, 0xef4444, alphaVal + 0.3);
      this.telegraphGraphics.fillStyle(0xef4444, alphaVal);

      if (this.telegraphType === 'ring') {
        // Draw expanding danger area
        const warningRadius = 220;
        this.telegraphGraphics.fillCircle(this.x, this.y, warningRadius);
        this.telegraphGraphics.strokeCircle(this.x, this.y, warningRadius);
      } else if (this.telegraphType === 'spiral') {
        // Draw swirling spirals
        const numArms = 4;
        const maxDist = 280;
        for (let j = 0; j < numArms; j++) {
          const baseAngle = this.spiralAngle + (j * Math.PI / 2);
          this.telegraphGraphics.beginPath();
          this.telegraphGraphics.moveTo(this.x, this.y);
          const endX = this.x + Math.cos(baseAngle) * maxDist;
          const endY = this.y + Math.sin(baseAngle) * maxDist;
          this.telegraphGraphics.lineTo(endX, endY);
          this.telegraphGraphics.strokePath();
        }
      }

      // Progress warning stretch & tint
      this.setTint(0xef4444);
      const pulseFactor = 1.0 + Math.sin(time * 0.02) * 0.1;
      this.setScale(this.baseScale * pulseFactor, this.baseScale / pulseFactor);

      if (time >= this.telegraphEndTime) {
        this.isTelegraphing = false;
        this.clearTint();
        if (this.isEnraged) this.setTint(0xff3333);
        this.setScale(this.isEnraged ? this.baseScale * 1.25 : this.baseScale);

        // Unleash the attack!
        if (this.telegraphType === 'ring') {
          this.fireRingBurst();
        } else if (this.telegraphType === 'spiral') {
          this.startSpiralSwarm(time);
        }
        this.telegraphType = 'none';
      }

      // Do not perform other updates while telegraphing
      return { attack: false, damage: 0 };
    }

    // If currently channeling Spiral Swarm (Phase 2 core)
    if (this.isChannelingSpiral) {
      // Stand still or move very slowly during channeling
      this.setVelocity(this.body.velocity.x * 0.05, this.body.velocity.y * 0.05);

      if (time >= this.nextSpiralShotTime) {
        this.fireSpiralWave();
        this.nextSpiralShotTime = time + 120; // Fire every 120ms
      }

      if (time >= this.spiralEndTime) {
        this.isChannelingSpiral = false;
        this.lastSpiralSwarmTime = time;
      }

      return { attack: false, damage: 0 };
    }

    // Standard AI decision tree for Bullet Hell Boss
    if (distanceToPlayer <= 350) {
      if (this.bossPhase === 1) {
        // RING BURST: Every 5 seconds (5000ms cooldown)
        if (time > this.lastRingBurstTime + 5000) {
          this.isTelegraphing = true;
          this.telegraphEndTime = time + 1000; // 1 second telegraphed warning
          this.telegraphType = 'ring';
          soundEngine.playTelegraph();
          return { attack: false, damage: 0 };
        }

        // Standard Shoot: Every 2 seconds
        if (time > this.lastNormalShootTime + 2000) {
          this.fireNormalShoot(playerX, playerY);
          this.lastNormalShootTime = time;
        }
      } else {
        // Phase 2 ENRAGED
        // SPIRAL SWARM: Every 6 seconds
        if (time > this.lastSpiralSwarmTime + 6000) {
          this.isTelegraphing = true;
          this.telegraphEndTime = time + 1200; // 1.2 seconds telegraphed warning
          this.telegraphType = 'spiral';
          this.spiralAngle = Phaser.Math.Angle.Between(this.x, this.y, playerX, playerY);
          soundEngine.playBossRoar();
          return { attack: false, damage: 0 };
        }

        // Rapid single shoots in between
        if (time > this.lastNormalShootTime + 1400) {
          this.fireNormalShoot(playerX, playerY);
          this.lastNormalShootTime = time;
        }
      }
    }

    // Call base class for standard movement/patrol behaviour
    return super.updateEnemy(time, delta, playerX, playerY, hasWallBetweenPlayer, nearbyEnemies);
  }

  private fireNormalShoot(playerX: number, playerY: number) {
    if (!this.scene) return;
    const proj = new Projectile(this.scene, this.x, this.y, 'proj_energy_bolt');
    const angle = Phaser.Math.Angle.Between(this.x, this.y, playerX, playerY);

    // Scale up projectile size for threatening feel
    proj.setScale(1.4);
    proj.fire(this.x, this.y, angle, 180, this.config.damage * 0.8, true);

    // Add to projectiles group
    const scene = this.scene as any;
    if (scene.enemyProjectilesGroup) {
      scene.enemyProjectilesGroup.add(proj);
    }
    soundEngine.playBloodBolt();
  }

  private fireRingBurst() {
    if (!this.scene) return;
    soundEngine.playNova();

    const numProjectiles = 12;
    const scene = this.scene as any;

    for (let i = 0; i < numProjectiles; i++) {
      const angle = (i * Math.PI * 2) / numProjectiles;
      const proj = new Projectile(this.scene, this.x, this.y, 'proj_energy_bolt');
      proj.setScale(1.3);
      // Bullet Hell projectiles are clean, escapable but cover wide area
      proj.fire(this.x, this.y, angle, 160, this.config.damage * 0.6, true);

      if (scene.enemyProjectilesGroup) {
        scene.enemyProjectilesGroup.add(proj);
      }
    }

    this.lastRingBurstTime = this.scene.time.now;
  }

  private startSpiralSwarm(time: number) {
    this.isChannelingSpiral = true;
    this.spiralEndTime = time + 3000; // Channel for 3 seconds
    this.nextSpiralShotTime = time;
  }

  private fireSpiralWave() {
    if (!this.scene) return;
    const scene = this.scene as any;

    // Fire 2 streams in opposite directions
    const angles = [this.spiralAngle, this.spiralAngle + Math.PI];

    angles.forEach((angle) => {
      const proj = new Projectile(this.scene, this.x, this.y, 'proj_energy_bolt');
      proj.setScale(1.2).setTint(0xff5555);

      // Slower speed for escapable bullet hell wave
      proj.fire(this.x, this.y, angle, 140, this.config.damage * 0.5, true);

      if (scene.enemyProjectilesGroup) {
        scene.enemyProjectilesGroup.add(proj);
      }
    });

    // Rotate spiral
    this.spiralAngle += 0.28; // Radians to spin
    soundEngine.playBloodBolt();
  }

  override takeDamage(amount: number): boolean {
    const isDead = super.takeDamage(amount);

    // Sync to React Zustand Store
    useGameStore.getState().updateBossHealth(Math.max(0, this.hp), this.maxHp);

    // Check for Phase Transition (50% HP threshold)
    if (this.hp <= this.maxHp * 0.5 && !this.isEnraged) {
      this.bossPhase = 2;
      this.triggerEnrage();
    }

    if (isDead) {
      // Clear HUD
      useGameStore.getState().setBossActive(false);
      this.telegraphGraphics.destroy();
      if (this.enrageEmitter) {
        this.enrageEmitter.destroy();
      }
    }

    return isDead;
  }

  override destroy(fromScene?: boolean) {
    if (this.telegraphGraphics) {
      this.telegraphGraphics.destroy();
    }
    if (this.enrageEmitter) {
      this.enrageEmitter.destroy();
    }
    super.destroy(fromScene);
  }
}
