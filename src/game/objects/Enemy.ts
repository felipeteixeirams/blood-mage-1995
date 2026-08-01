import Phaser from 'phaser';
import { MonsterConfig, AIState } from '../../types/game';
import monstersData from '../../data/monsters.json';
import { soundEngine } from '../../utils/soundEngine';

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  public config: MonsterConfig;
  public hp: number;
  public maxHp: number;
  public aiState: AIState = 'idle';

  private lastAttackTime: number = 0;
  private facingAngle: number = 0; // Radians
  private chargeVector: Phaser.Math.Vector2 = new Phaser.Math.Vector2(0, 0);
  private isCharging: boolean = false;

  // Patrol Nodes
  public patrolP1: { x: number; y: number };
  public patrolP2: { x: number; y: number };
  private currentPatrolTarget: { x: number; y: number };
  private patrolWaitTimer: number = 0;

  // Sound Investigation
  private investigatePoint: { x: number; y: number } | null = null;
  private investigateTimer: number = 0;

  // Dodge Mechanics
  private lastDodgeTime: number = 0;
  private isDodging: boolean = false;
  private dodgeVector: Phaser.Math.Vector2 = new Phaser.Math.Vector2(0, 0);

  // Status Emote Icon
  private emoteSprite?: Phaser.GameObjects.Image;
  private hoverOffsetY: number = 0;

  // Individual AI Personality & Movement Enhancements
  private speedMultiplier: number = 1.0;
  private personalPhase: number = 0;
  private baseScale: number = 1.0;

  // Attack Telegraphing & Realism Engine
  public attackPhase: 'none' | 'windup' | 'strike' | 'recovery' = 'none';
  private attackPhaseEndTime: number = 0;
  private attackTargetPos: { x: number; y: number } = { x: 0, y: 0 };
  private attackType: 'melee' | 'ranged' = 'melee';

  constructor(scene: Phaser.Scene, x: number, y: number, monsterId: string) {
    const rawData = monstersData as Record<string, MonsterConfig>;
    const monsterConfig = rawData[monsterId] || rawData['skeleton_warrior'];

    super(scene, x, y, monsterConfig.spriteKey);
    this.config = monsterConfig;
    this.hp = monsterConfig.hp;
    this.maxHp = monsterConfig.hp;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.baseScale = monsterConfig.scale;
    this.setScale(this.baseScale);
    this.setCollideWorldBounds(true);
    this.setSize(22, 26);

    // Individual speed variance (85% - 115%) & personal phase offset
    this.speedMultiplier = 0.85 + Math.random() * 0.3;
    this.personalPhase = Math.random() * Math.PI * 2;

    // Initial facing angle randomized
    this.facingAngle = Math.random() * Math.PI * 2;

    // Set patrol nodes in initial vicinity
    this.patrolP1 = { x: x - 80 + Math.random() * 40, y: y - 40 + Math.random() * 20 };
    this.patrolP2 = { x: x + 80 + Math.random() * 40, y: y + 40 + Math.random() * 20 };
    this.currentPatrolTarget = this.patrolP2;

    // Start in IDLE or PATROL state
    this.aiState = Math.random() < 0.6 ? 'patrol' : 'idle';

    // Base color tinting
    this.applyBaseTint();
  }

  private applyBaseTint() {
    if (this.config.color) {
      const tintHex = parseInt(this.config.color.replace('#', '0x'), 16);
      this.setTint(tintHex);
    } else {
      this.clearTint();
    }
  }

  /**
   * Field of View (FOV) check against Player
   * Evaluates vision distance, vision cone angle, and line-of-sight obstacle wall obstruction
   */
  public canSeePlayer(playerX: number, playerY: number, hasWallBetween: boolean): boolean {
    if (hasWallBetween) return false;

    const distance = Phaser.Math.Distance.Between(this.x, this.y, playerX, playerY);
    const maxDist = this.config.visionDistance || 320;
    if (distance > maxDist) return false;

    // Check vision cone angle
    const angleToPlayer = Phaser.Math.Angle.Between(this.x, this.y, playerX, playerY);
    let diff = Math.abs(Phaser.Math.Angle.Normalize(angleToPlayer) - Phaser.Math.Angle.Normalize(this.facingAngle));
    if (diff > Math.PI) diff = Math.PI * 2 - diff;

    const coneHalfRad = Phaser.Math.DegToRad((this.config.visionConeDegrees || 120) / 2);
    return diff <= coneHalfRad;
  }

  /**
   * Called when a noise event occurs (e.g. running footsteps, spell firing, explosions)
   */
  public onHearNoise(noiseX: number, noiseY: number, loudness: number, hasWallBetween: boolean) {
    if (this.aiState === 'combat' || this.aiState === 'frenzy' || this.aiState === 'flee') return;

    const dist = Phaser.Math.Distance.Between(this.x, this.y, noiseX, noiseY);
    const effectiveRadius = loudness * (this.config.hearingSensitivity || 1.0) * (hasWallBetween ? 0.4 : 1.0);

    if (dist <= effectiveRadius) {
      this.aiState = 'investigating';
      this.investigatePoint = { x: noiseX, y: noiseY };
      this.investigateTimer = this.scene.time.now + 3500;
      this.showEmote('icon_suspicious');
    }
  }

  /**
   * Force alert to combat state (e.g., seen or damaged)
   */
  public alertToCombat() {
    if (this.aiState === 'flee') return;
    if (this.aiState !== 'combat' && this.aiState !== 'frenzy') {
      this.aiState = 'combat';
      this.showEmote('icon_alert');
    }
  }

  /**
   * Show status indicator icon over head
   */
  private showEmote(key: string) {
    if (this.emoteSprite) {
      this.emoteSprite.destroy();
    }
    this.emoteSprite = this.scene.add.image(this.x, this.y - 28, key).setDepth(2000);
    this.scene.tweens.add({
      targets: this.emoteSprite,
      y: this.y - 38,
      alpha: 0,
      duration: 1800,
      onComplete: () => {
        if (this.emoteSprite) {
          this.emoteSprite.destroy();
          this.emoteSprite = undefined;
        }
      },
    });
  }

  /**
   * Check incoming player projectile to attempt a tactical side dodge
   */
  public tryDodgeProjectile(projX: number, projY: number, projVx: number, projVy: number, time: number) {
    if (this.isDodging || (this.config.dodgeChance || 0) <= 0) return;
    if (time < this.lastDodgeTime + 2000) return;

    const dist = Phaser.Math.Distance.Between(this.x, this.y, projX, projY);
    if (dist > 180 || dist < 30) return;

    // Check probability
    if (Math.random() <= (this.config.dodgeChance || 0)) {
      this.lastDodgeTime = time;
      this.isDodging = true;

      // Calculate perpendicular side step direction
      const projAngle = Math.atan2(projVy, projVx);
      const sideAngle = projAngle + (Math.random() < 0.5 ? Math.PI / 2 : -Math.PI / 2);

      this.dodgeVector.set(Math.cos(sideAngle), Math.sin(sideAngle));
      this.setVelocity(this.dodgeVector.x * this.config.speed * 1.8, this.dodgeVector.y * this.config.speed * 1.8);

      // Reset dodge velocity after 220ms
      this.scene.time.delayedCall(220, () => {
        this.isDodging = false;
      });
    }
  }

  /**
   * Main AI Update Loop with state machine, gait & natural behaviors
   */
  public updateEnemy(
    time: number,
    delta: number,
    playerX: number,
    playerY: number,
    hasWallBetweenPlayer: boolean,
    nearbyEnemies?: Enemy[]
  ): { attack: boolean; damage: number; attackType?: 'melee' | 'ranged'; dodged?: boolean } {
    if (!this.active) return { attack: false, damage: 0 };

    const distanceToPlayer = Phaser.Math.Distance.Between(this.x, this.y, playerX, playerY);
    const angleToPlayer = Phaser.Math.Angle.Between(this.x, this.y, playerX, playerY);

    // Keep emote centered
    if (this.emoteSprite && this.emoteSprite.active) {
      this.emoteSprite.setPosition(this.x, this.y - 28);
    }

    // Ethereal gait floating effect
    if (this.config.gaitType === 'ethereal') {
      this.hoverOffsetY = Math.sin(time * 0.005 + this.personalPhase) * 3;
      this.y += Math.sin(time * 0.008 + this.personalPhase) * 0.2;
    }

    // Check fear/courage threshold when damaged
    const hpRatio = this.hp / this.maxHp;
    if (
      this.aiState === 'combat' &&
      this.config.temperament === 'timid' &&
      hpRatio < (this.config.courage || 0.35)
    ) {
      this.aiState = 'flee';
      this.showEmote('icon_flee');
    }

    // Check frenzy threshold for aggressive enemies
    if (
      (this.aiState === 'combat' || this.aiState === 'investigating') &&
      this.config.temperament === 'aggressive' &&
      hpRatio < 0.5
    ) {
      this.aiState = 'frenzy';
      this.setTint(0xff3333);
      this.showEmote('icon_alert');
    }

    // Perception check: Can see player?
    if (this.aiState === 'idle' || this.aiState === 'patrol' || this.aiState === 'investigating') {
      if (this.canSeePlayer(playerX, playerY, hasWallBetweenPlayer)) {
        this.alertToCombat();
      }
    }

    let result: { attack: boolean; damage: number; attackType?: 'melee' | 'ranged'; dodged?: boolean } = { attack: false, damage: 0 };

    // If dodging, retain side-step velocity
    if (this.isDodging) {
      return result;
    }

    // ACTIVE ATTACK STATE MACHINE (Windup -> Strike -> Recovery)
    if (this.attackPhase !== 'none') {
      if (this.attackPhase === 'windup') {
        // Slow down and coil during windup
        if (this.body) {
          this.setVelocity(this.body.velocity.x * 0.15, this.body.velocity.y * 0.15);
        }
        this.facingAngle = Phaser.Math.Angle.Between(this.x, this.y, this.attackTargetPos.x, this.attackTargetPos.y);
        this.setFlipX(this.attackTargetPos.x < this.x);

        // Visual telegraph: warning tint & backward coil stretch
        this.setTint(0xef4444);
        const coilFactor = 1.0 + Math.sin(time * 0.02) * 0.08;
        this.setScale(this.baseScale * 0.86 * coilFactor, this.baseScale * 1.2 * coilFactor);
        this.setRotation(this.flipX ? 0.18 : -0.18);

        if (time >= this.attackPhaseEndTime) {
          this.attackPhase = 'strike';
          this.attackPhaseEndTime = time + 110;

          soundEngine.playSwing();

          // Rapid forward lunge toward target position
          const lungeAngle = Phaser.Math.Angle.Between(this.x, this.y, this.attackTargetPos.x, this.attackTargetPos.y);
          const lungeSpeed = (this.config.speed || 100) * 2.6;
          this.setVelocity(Math.cos(lungeAngle) * lungeSpeed, Math.sin(lungeAngle) * lungeSpeed);

          // Hit check: Did player remain in the attack range during windup?
          if (this.attackType === 'ranged') {
            result = { attack: true, damage: this.config.damage, attackType: 'ranged' };
          } else {
            const currentDist = Phaser.Math.Distance.Between(this.x, this.y, playerX, playerY);
            if (currentDist <= this.config.attackRange + 22) {
              result = { attack: true, damage: this.config.damage, attackType: 'melee' };
            } else {
              result = { attack: false, damage: 0, dodged: true };
            }
          }
        }
        return result;
      } else if (this.attackPhase === 'strike') {
        // Extension snap during active hit window
        this.setScale(this.baseScale * 1.25, this.baseScale * 0.82);
        this.setRotation(this.flipX ? -0.15 : 0.15);

        if (time >= this.attackPhaseEndTime) {
          this.attackPhase = 'recovery';
          this.attackPhaseEndTime = time + 220;
          this.applyBaseTint();
        }
        return result;
      } else if (this.attackPhase === 'recovery') {
        // Recovery cool-down stance
        this.setScale(this.baseScale);
        this.setRotation(0);

        if (time >= this.attackPhaseEndTime) {
          this.attackPhase = 'none';
          this.lastAttackTime = time;
        }
        return result;
      }
    }

    const effectiveBaseSpeed = this.config.speed * this.speedMultiplier;

    // STATE MACHINE IMPLEMENTATION
    switch (this.aiState) {
      case 'idle':
        this.setVelocity(0, 0);
        // Slowly look around
        this.facingAngle += Math.sin(time * 0.002 + this.personalPhase) * 0.01;
        break;

      case 'patrol': {
        const distP = Phaser.Math.Distance.Between(this.x, this.y, this.currentPatrolTarget.x, this.currentPatrolTarget.y);
        if (distP < 15) {
          this.setVelocity(0, 0);
          if (time > this.patrolWaitTimer) {
            this.currentPatrolTarget = this.currentPatrolTarget === this.patrolP1 ? this.patrolP2 : this.patrolP1;
            this.patrolWaitTimer = time + 2000 + Math.random() * 2000;
          }
        } else {
          const moveAngle = Phaser.Math.Angle.Between(this.x, this.y, this.currentPatrolTarget.x, this.currentPatrolTarget.y);
          this.facingAngle = moveAngle;
          const patrolSpeed = effectiveBaseSpeed * 0.45;
          this.setVelocity(Math.cos(moveAngle) * patrolSpeed, Math.sin(moveAngle) * patrolSpeed);
          this.setFlipX(Math.cos(moveAngle) < 0);
        }
        break;
      }

      case 'investigating': {
        if (this.investigatePoint) {
          const distInv = Phaser.Math.Distance.Between(this.x, this.y, this.investigatePoint.x, this.investigatePoint.y);
          if (distInv > 20) {
            const moveAngle = Phaser.Math.Angle.Between(this.x, this.y, this.investigatePoint.x, this.investigatePoint.y);
            this.facingAngle = moveAngle;
            const invSpeed = effectiveBaseSpeed * 0.65;
            this.setVelocity(Math.cos(moveAngle) * invSpeed, Math.sin(moveAngle) * invSpeed);
            this.setFlipX(Math.cos(moveAngle) < 0);
          } else {
            this.setVelocity(0, 0);
            if (time > this.investigateTimer) {
              // Return to patrol
              this.aiState = 'patrol';
              this.investigatePoint = null;
            }
          }
        }
        break;
      }

      case 'flee': {
        // Run directly away from player
        const fleeAngle = angleToPlayer + Math.PI;
        this.facingAngle = fleeAngle;
        const fleeSpeed = effectiveBaseSpeed * 1.25;
        this.setVelocity(Math.cos(fleeAngle) * fleeSpeed, Math.sin(fleeAngle) * fleeSpeed);
        this.setFlipX(Math.cos(fleeAngle) < 0);
        break;
      }

      case 'combat':
      case 'frenzy': {
        this.facingAngle = angleToPlayer;
        this.setFlipX(playerX < this.x);

        const currentSpeed = this.aiState === 'frenzy' ? effectiveBaseSpeed * 1.35 : effectiveBaseSpeed;

        switch (this.config.behavior) {
          case 'swarmer': {
            // Bat / Swarmer: Erratic swooping sine wave flight
            const waveAngle = angleToPlayer + Math.sin(time * 0.007 + this.personalPhase) * 0.42;
            this.setVelocity(Math.cos(waveAngle) * currentSpeed, Math.sin(waveAngle) * currentSpeed);

            if (distanceToPlayer <= this.config.attackRange) {
              if (time > this.lastAttackTime + 900) {
                this.attackPhase = 'windup';
                this.attackPhaseEndTime = time + 180;
                this.attackTargetPos = { x: playerX, y: playerY };
                this.attackType = 'melee';
                soundEngine.playTelegraph();
              }
            }
            break;
          }

          case 'chaser': {
            // Progressive acceleration when hunting player up close + slight zigzag weave
            const huntingBoost = distanceToPlayer < 150 ? 1.15 : 1.0;
            const weaveAngle = angleToPlayer + Math.sin(time * 0.005 + this.personalPhase) * 0.16;
            this.setVelocity(
              Math.cos(weaveAngle) * currentSpeed * huntingBoost,
              Math.sin(weaveAngle) * currentSpeed * huntingBoost
            );

            if (distanceToPlayer <= this.config.attackRange) {
              if (time > this.lastAttackTime + 1100) {
                this.attackPhase = 'windup';
                this.attackPhaseEndTime = time + 300;
                this.attackTargetPos = { x: playerX, y: playerY };
                this.attackType = 'melee';
                soundEngine.playTelegraph();
              }
            }
            break;
          }

          case 'charger':
            if (!this.isCharging && distanceToPlayer < 240) {
              this.isCharging = true;
              this.chargeVector.setTo(playerX - this.x, playerY - this.y).normalize();
            }
            if (this.isCharging) {
              this.setVelocity(this.chargeVector.x * currentSpeed * 1.7, this.chargeVector.y * currentSpeed * 1.7);
            } else {
              this.scene.physics.moveTo(this, playerX, playerY, currentSpeed);
            }
            if (distanceToPlayer <= this.config.attackRange) {
              if (time > this.lastAttackTime + 900) {
                this.isCharging = false;
                this.attackPhase = 'windup';
                this.attackPhaseEndTime = time + 420;
                this.attackTargetPos = { x: playerX, y: playerY };
                this.attackType = 'melee';
                soundEngine.playTelegraph();
              }
            }
            break;

          case 'ranged':
          case 'boss': {
            if (distanceToPlayer > this.config.attackRange) {
              // Approach with slight curve
              const curveAngle = angleToPlayer + Math.sin(time * 0.003 + this.personalPhase) * 0.2;
              this.setVelocity(Math.cos(curveAngle) * currentSpeed, Math.sin(curveAngle) * currentSpeed);
            } else if (distanceToPlayer < this.config.attackRange * 0.55) {
              // Tactical backing away with angled steps
              const backAngle = angleToPlayer + Math.PI + Math.sin(time * 0.004 + this.personalPhase) * 0.35;
              this.setVelocity(Math.cos(backAngle) * currentSpeed * 1.05, Math.sin(backAngle) * currentSpeed * 1.05);
            } else {
              // Tactical circle-strafing around player
              const strafeDirection = Math.sin(time * 0.002 + this.personalPhase) > 0 ? 1 : -1;
              const strafeAngle = angleToPlayer + (strafeDirection * Math.PI) / 2;
              this.setVelocity(Math.cos(strafeAngle) * currentSpeed * 0.6, Math.sin(strafeAngle) * currentSpeed * 0.6);
            }

            if (distanceToPlayer <= this.config.attackRange + 50) {
              if (time > this.lastAttackTime + (this.aiState === 'frenzy' ? 1300 : 1900)) {
                this.attackPhase = 'windup';
                this.attackPhaseEndTime = time + 380;
                this.attackTargetPos = { x: playerX, y: playerY };
                this.attackType = 'ranged';
                soundEngine.playTelegraph();
              }
            }
            break;
          }
        }
        break;
      }
    }

    // Apply Flocking Separation Force (prevents sprite stacking)
    if (nearbyEnemies && this.body && this.aiState !== 'idle') {
      let sepX = 0;
      let sepY = 0;
      let count = 0;
      for (let i = 0; i < nearbyEnemies.length; i++) {
        const other = nearbyEnemies[i];
        if (other !== this && other.active && other.body) {
          const dx = this.x - other.x;
          const dy = this.y - other.y;
          const distSq = dx * dx + dy * dy;
          if (distSq > 0 && distSq < 1156) { // Within 34px radius
            const dist = Math.sqrt(distSq);
            const force = (34 - dist) / 34;
            sepX += (dx / dist) * force * 50;
            sepY += (dy / dist) * force * 50;
            count++;
          }
        }
      }
      if (count > 0) {
        const bodyVel = this.body.velocity;
        this.setVelocity(bodyVel.x + sepX, bodyVel.y + sepY);
      }
    }

    // Apply Organic Walk Cycle (Stretch & Squash, Dynamic Tilt)
    if (this.body) {
      const currentVel = this.body.velocity;
      const speed = currentVel.length();
      if (speed > 8) {
        const walkPulse = Math.sin(time * 0.014 + this.personalPhase);
        const stretchX = 1 + walkPulse * 0.08;
        const stretchY = 1 - walkPulse * 0.08;
        this.setScale(this.baseScale * stretchX, this.baseScale * stretchY);

        const tiltAngle = (currentVel.x * 0.001) + Math.sin(time * 0.01 + this.personalPhase) * 0.06;
        this.setRotation(tiltAngle);
      } else {
        this.setScale(this.baseScale);
        this.setRotation(0);
      }
    }

    return result;
  }

  public takeDamage(amount: number): boolean {
    this.hp -= amount;

    // Alert instantly to combat when damaged!
    this.alertToCombat();

    // Red damage flash
    this.setTint(0xff0000);
    this.scene.time.delayedCall(120, () => {
      if (this.active) {
        if (this.aiState === 'frenzy') {
          this.setTint(0xff3333);
        } else {
          this.applyBaseTint();
        }
      }
    });

    soundEngine.playBloodSquish();
    return this.hp <= 0;
  }
}
