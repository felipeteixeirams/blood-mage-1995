import Phaser from 'phaser';
import { MonsterConfig, AIState, EliteAffix } from '../../types/game';
import monstersData from '../../data/monsters.json';
import { soundEngine } from '../../utils/soundEngine';
import { useGameStore } from '../../store/gameStore';
import { safePlayAnimation } from '../animations/animationManager';

export interface EnemyOptions {
  floorDepth?: number;
  eliteAffix?: EliteAffix;
}

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  public config: MonsterConfig;
  public hp: number;
  public maxHp: number;
  public damage: number;
  public floorDepth: number = 1;
  public eliteAffix: EliteAffix = 'none';
  public aiState: AIState = 'idle';
  private isAngered: boolean = false;

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

  // Flee / Reinforcements
  private fleeStartTime: number = 0;
  private reinforcementsCalled: boolean = false;

  // Status Emote Icon
  private emoteSprite?: Phaser.GameObjects.Image;
  private hoverOffsetY: number = 0;

  // Individual AI Personality & Movement Enhancements
  private speedMultiplier: number = 1.0;
  private personalPhase: number = 0;
  private baseScale: number = 1.0;
  private hasTriggeredHowl: boolean = false;

  // Attack Telegraphing & Realism Engine
  public attackPhase: 'none' | 'windup' | 'strike' | 'recovery' = 'none';
  private attackPhaseEndTime: number = 0;
  private attackTargetPos: { x: number; y: number } = { x: 0, y: 0 };
  private attackType: 'melee' | 'ranged' = 'melee';

  // Movement acceleration (mass-based feel per monster type)
  private moveVx: number = 0;
  private moveVy: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, monsterId: string, options?: EnemyOptions) {
    const rawData = monstersData as Record<string, MonsterConfig>;
    const monsterConfig = rawData[monsterId] || rawData['skeleton_warrior'];

    super(scene, x, y, monsterConfig.spriteKey);
    this.config = monsterConfig;
    this.floorDepth = options?.floorDepth ?? 1;
    this.eliteAffix = options?.eliteAffix ?? 'none';

    // Difficulty curve scaling per floor (+6% HP, +4% Damage per floor beyond floor 1)
    const floorHpMult = 1.0 + Math.max(0, this.floorDepth - 1) * 0.06;
    const floorDmgMult = 1.0 + Math.max(0, this.floorDepth - 1) * 0.04;

    let affixHpMult = 1.0;
    let affixDmgMult = 1.0;
    let affixSpeedMult = 1.0;

    if (this.eliteAffix === 'frenzied') {
      affixSpeedMult = 1.35;
      affixDmgMult = 1.25;
    } else if (this.eliteAffix === 'vampiric') {
      affixHpMult = 1.4;
    } else if (this.eliteAffix === 'cursed') {
      affixHpMult = 1.3;
    } else if (this.eliteAffix === 'spectral') {
      affixSpeedMult = 1.2;
    }

    const calculatedHp = Math.round(monsterConfig.hp * floorHpMult * affixHpMult);
    this.hp = calculatedHp;
    this.maxHp = calculatedHp;
    this.damage = Math.round(monsterConfig.damage * floorDmgMult * affixDmgMult);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.baseScale = monsterConfig.scale * (this.eliteAffix !== 'none' ? 1.15 : 1.0);
    this.setScale(this.baseScale);
    this.setCollideWorldBounds(true);
    this.setSize(22, 26);
    (this as any).setLighting?.(true);

    // Individual speed variance (85% - 115%) & personal phase offset
    this.speedMultiplier = (0.85 + Math.random() * 0.3) * affixSpeedMult;
    this.personalPhase = Math.random() * Math.PI * 2;

    // Initial facing angle randomized
    this.facingAngle = Math.random() * Math.PI * 2;

    // Set patrol nodes in initial vicinity
    this.patrolP1 = { x: x - 80 + Math.random() * 40, y: y - 40 + Math.random() * 20 };
    this.patrolP2 = { x: x + 80 + Math.random() * 40, y: y + 40 + Math.random() * 20 };
    this.currentPatrolTarget = this.patrolP2;

    // Start in IDLE or PATROL state
    const hasFuryPit = useGameStore.getState().activeModifiers.includes('fury_pit');
    if (hasFuryPit || this.eliteAffix === 'frenzied') {
      this.aiState = 'frenzy';
      this.setTint(0xff3333);
    } else {
      this.aiState = Math.random() < 0.6 ? 'patrol' : 'idle';
      this.applyBaseTint();
    }
  }

  private applyBaseTint() {
    if (this.eliteAffix === 'frenzied') {
      this.setTint(0xff4444);
      return;
    }
    if (this.eliteAffix === 'vampiric') {
      this.setTint(0xd97706);
      return;
    }
    if (this.eliteAffix === 'cursed') {
      this.setTint(0xa855f7);
      return;
    }
    if (this.eliteAffix === 'spectral') {
      this.setTint(0x38bdf8);
      this.setAlpha(0.8);
      return;
    }
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
    const isPlayerUnconsciousOrDead = useGameStore.getState().playerStats.isUnconscious || useGameStore.getState().playerStats.isDefinitivelyDead;
    if (isPlayerUnconsciousOrDead) return false;

    if (this.config.temperament === 'totally_passive') {
      return false;
    }
    if (this.config.temperament === 'defensive' && !this.isAngered) {
      return false;
    }

    if (hasWallBetween) return false;

    const distance = Phaser.Math.Distance.Between(this.x, this.y, playerX, playerY);
    let maxDist = this.config.visionDistance || 320;
    if (this.config.temperament === 'highly_aggressive') {
      maxDist *= 1.5;
    } else if (this.config.temperament === 'territorial') {
      maxDist = Math.min(maxDist, 120);
    }

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
    let multiplier = 1.0;
    if (this.config.temperament === 'highly_aggressive') {
      multiplier = 1.5;
    }
    const effectiveRadius = loudness * (this.config.hearingSensitivity || 1.0) * multiplier * (hasWallBetween ? 0.4 : 1.0);

    if (dist <= effectiveRadius) {
      if (this.config.temperament === 'totally_passive') {
        this.aiState = 'flee';
        this.fleeStartTime = this.scene.time.now;
        this.showEmote('icon_flee');
      } else {
        this.aiState = 'investigating';
        this.investigatePoint = { x: noiseX, y: noiseY };
        this.investigateTimer = this.scene.time.now + 3500;
        this.showEmote('icon_suspicious');
      }
    }
  }

  /**
   * Force alert to combat state (e.g., seen or damaged)
   */
  public alertToCombat() {
    if (this.config.temperament === 'totally_passive') {
      if (this.aiState !== 'flee') {
        this.aiState = 'flee';
        this.fleeStartTime = this.scene.time.now;
        this.showEmote('icon_flee');
      }
      return;
    }
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
    const baseDodge = this.config.dodgeChance || 0;
    const effectiveDodge = this.eliteAffix === 'spectral' ? Math.min(0.7, baseDodge + 0.35) : baseDodge;
    if (this.isDodging || effectiveDodge <= 0) return;
    if (time < this.lastDodgeTime + (this.eliteAffix === 'spectral' ? 1200 : 2000)) return;

    const dx = this.x - projX;
    // Fast horizontal boundary pruning
    if (Math.abs(dx) > 180) return;

    const dy = this.y - projY;
    // Fast vertical boundary pruning
    if (Math.abs(dy) > 180) return;

    // Avoid expensive Math.sqrt by checking squared distance
    const distSq = dx * dx + dy * dy;
    if (distSq > 32400 || distSq < 900) return; // 180^2 = 32400, 30^2 = 900

    // Check probability
    if (Math.random() <= effectiveDodge) {
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

    const isPlayerUnconsciousOrDead = useGameStore.getState().playerStats.isUnconscious || useGameStore.getState().playerStats.isDefinitivelyDead;
    if (isPlayerUnconsciousOrDead) {
      if (this.aiState === 'combat' || this.aiState === 'frenzy' || this.aiState === 'investigating' || this.aiState === 'flee') {
        this.aiState = 'patrol_away_from_player';
        this.attackPhase = 'none';
        this.setScale(this.baseScale);
        this.setRotation(0);
        this.applyBaseTint();
        
        // Calculate a patrol target away from the player
        const dirX = this.x - playerX;
        const dirY = this.y - playerY;
        const len = Math.sqrt(dirX * dirX + dirY * dirY) || 1;
        const awayDist = 200 + Math.random() * 100;
        this.currentPatrolTarget = {
          x: this.x + (dirX / len) * awayDist,
          y: this.y + (dirY / len) * awayDist
        };
      }
    }

    const distanceToPlayer = Phaser.Math.Distance.Between(this.x, this.y, playerX, playerY);
    const angleToPlayer = Phaser.Math.Angle.Between(this.x, this.y, playerX, playerY);

    if (this.config.temperament === 'totally_passive' && !isPlayerUnconsciousOrDead) {
      if (distanceToPlayer <= 100 && this.aiState !== 'flee') {
        this.aiState = 'flee';
        this.fleeStartTime = time;
        this.showEmote('icon_flee');
      }
    }

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
      this.fleeStartTime = time;
      this.reinforcementsCalled = false;
      this.showEmote('icon_flee');
    }

    // Check frenzy threshold for aggressive enemies
    if (
      (this.aiState === 'combat' || this.aiState === 'investigating') &&
      this.config.temperament === 'aggressive' &&
      hpRatio < 0.5
    ) {
      if (!this.hasTriggeredHowl && this.config.id === 'werewolf_lycan') {
        this.hasTriggeredHowl = true;
        soundEngine.playHowl();
        if (typeof window !== 'undefined' && (window as any).__triggerFearDistortion) {
          (window as any).__triggerFearDistortion(1200);
        }
        this.baseScale = this.config.scale * 1.25;
        this.showEmote('icon_alert');
      }
      this.aiState = 'frenzy';
      this.setTint(0xff3333);
      if (!this.hasTriggeredHowl) {
        this.showEmote('icon_alert');
      }
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
            result = { attack: true, damage: this.damage, attackType: 'ranged' };
          } else {
            const currentDist = Phaser.Math.Distance.Between(this.x, this.y, playerX, playerY);
            if (currentDist <= this.config.attackRange + 22) {
              result = { attack: true, damage: this.damage, attackType: 'melee' };

              // Vampire Stalker / Vampiric Elite Lifesteal Ability
              if (this.config.id === 'vampire_stalker' || this.eliteAffix === 'vampiric') {
                const stolenHp = Math.round(this.damage * 0.4);
                this.hp = Math.min(this.maxHp, this.hp + stolenHp);
                if ((this.scene as any).spawnFloatingText) {
                  (this.scene as any).spawnFloatingText(this.x, this.y - 10, `+${stolenHp} HP`, '#22c55e', false);
                }
              }
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
        this.accelerateToward(0, 0, delta);
        // Slowly look around
        this.facingAngle += Math.sin(time * 0.002 + this.personalPhase) * 0.01;
        break;

      case 'patrol_away_from_player':
      case 'patrol': {
        const distP = Phaser.Math.Distance.Between(this.x, this.y, this.currentPatrolTarget.x, this.currentPatrolTarget.y);
        if (distP < 15) {
          this.accelerateToward(0, 0, delta);
          if (time > this.patrolWaitTimer) {
            // For normal patrol, swap targets. For walk-away, just idle after reaching it.
            if (this.aiState === 'patrol_away_from_player') {
              this.aiState = 'idle';
            } else {
              this.currentPatrolTarget = this.currentPatrolTarget === this.patrolP1 ? this.patrolP2 : this.patrolP1;
            }
            this.patrolWaitTimer = time + 2000 + Math.random() * 2000;
          }
        } else {
          const moveAngle = Phaser.Math.Angle.Between(this.x, this.y, this.currentPatrolTarget.x, this.currentPatrolTarget.y);
          this.facingAngle = moveAngle;
          const patrolSpeed = effectiveBaseSpeed * 0.45;
          this.accelerateToward(Math.cos(moveAngle) * patrolSpeed, Math.sin(moveAngle) * patrolSpeed, delta);
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
            this.accelerateToward(Math.cos(moveAngle) * invSpeed, Math.sin(moveAngle) * invSpeed, delta);
            this.setFlipX(Math.cos(moveAngle) < 0);
          } else {
            this.accelerateToward(0, 0, delta);
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
        // Check reinforcements call after 5 seconds
        if (time >= this.fleeStartTime + 5000 && !this.reinforcementsCalled) {
          this.reinforcementsCalled = true;
          this.showEmote('icon_alert');
          soundEngine.playHowl(); // distinctive howling call for help!

          if (this.scene && (this.scene as any).emitSound) {
            (this.scene as any).emitSound(this.x, this.y, 660); // 3x radius (220 * 3) sound emission
            if ((this.scene as any).spawnFloatingText) {
              (this.scene as any).spawnFloatingText(this.x, this.y - 12, 'CHAMOU REFORÇOS!', '#ef4444', true);
            }
          }
        }

        // Run directly away from player
        const fleeAngle = angleToPlayer + Math.PI;
        this.facingAngle = fleeAngle;
        const fleeSpeed = effectiveBaseSpeed * 1.25;
        this.accelerateToward(Math.cos(fleeAngle) * fleeSpeed, Math.sin(fleeAngle) * fleeSpeed, delta);
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
            this.accelerateToward(Math.cos(waveAngle) * currentSpeed, Math.sin(waveAngle) * currentSpeed, delta);

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
            const chaseVx = Math.cos(weaveAngle) * currentSpeed * huntingBoost;
            const chaseVy = Math.sin(weaveAngle) * currentSpeed * huntingBoost;
            this.accelerateToward(chaseVx, chaseVy, delta);

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
              // Charger builds up speed slowly during charge
              const chargeTargetVx = this.chargeVector.x * currentSpeed * 1.7;
              const chargeTargetVy = this.chargeVector.y * currentSpeed * 1.7;
              this.accelerateToward(chargeTargetVx, chargeTargetVy, delta);
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
            let moveTargetVx = 0, moveTargetVy = 0;
            if (distanceToPlayer > this.config.attackRange) {
              // Approach with slight curve
              const curveAngle = angleToPlayer + Math.sin(time * 0.003 + this.personalPhase) * 0.2;
              moveTargetVx = Math.cos(curveAngle) * currentSpeed;
              moveTargetVy = Math.sin(curveAngle) * currentSpeed;
            } else if (distanceToPlayer < this.config.attackRange * 0.55) {
              // Tactical backing away with angled steps
              const backAngle = angleToPlayer + Math.PI + Math.sin(time * 0.004 + this.personalPhase) * 0.35;
              moveTargetVx = Math.cos(backAngle) * currentSpeed * 1.05;
              moveTargetVy = Math.sin(backAngle) * currentSpeed * 1.05;
            } else {
              // Tactical circle-strafing around player
              const strafeDirection = Math.sin(time * 0.002 + this.personalPhase) > 0 ? 1 : -1;
              const strafeAngle = angleToPlayer + (strafeDirection * Math.PI) / 2;
              moveTargetVx = Math.cos(strafeAngle) * currentSpeed * 0.6;
              moveTargetVy = Math.sin(strafeAngle) * currentSpeed * 0.6;
            }
            this.accelerateToward(moveTargetVx, moveTargetVy, delta);

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
          // Fast horizontal boundary pruning: skip if coordinate distance is >= 34px
          if (Math.abs(dx) >= 34) continue;

          const dy = this.y - other.y;
          // Fast vertical boundary pruning
          if (Math.abs(dy) >= 34) continue;

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
        this.moveVx += sepX;
        this.moveVy += sepY;
        this.setVelocity(this.moveVx, this.moveVy);
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

    this.updateAnimation();

    return result;
  }

  /** Safely plays frame-based animation or fallback based on enemy state */
  private updateAnimation() {
    const isMoving = Math.abs(this.moveVx) > 5 || Math.abs(this.moveVy) > 5;
    const key = this.config.spriteKey;
    let prefix = '';

    if (key === 'spr_skeleton') prefix = 'skeleton';
    else if (key === 'spr_cultist') prefix = 'cultist';
    else if (key === 'spr_hound') prefix = 'hound';
    else if (key === 'spr_golem') prefix = 'golem';
    else if (key === 'spr_specter') prefix = 'specter';
    else if (key === 'spr_zombie_shambler') prefix = 'zombie';
    else if (key === 'spr_vampire_stalker') prefix = 'vampire';
    else if (key === 'spr_werewolf_lycan') prefix = 'lycan';
    else if (key === 'spr_bat_swarm') prefix = 'bat';
    else if (key === 'spr_gore_abomination') prefix = 'abomination';

    if (!prefix) return;

    if (this.attackPhase === 'windup' || this.attackPhase === 'strike') {
      if (this.scene?.anims?.exists(`${prefix}_attack`)) {
        safePlayAnimation(this, `${prefix}_attack`);
      } else if (this.scene?.anims?.exists(`${prefix}_strike`)) {
        safePlayAnimation(this, `${prefix}_strike`);
      } else if (this.scene?.anims?.exists(`${prefix}_cast`)) {
        safePlayAnimation(this, `${prefix}_cast`);
      } else if (this.scene?.anims?.exists(`${prefix}_bite`)) {
        safePlayAnimation(this, `${prefix}_bite`);
      } else if (this.scene?.anims?.exists(`${prefix}_smash`)) {
        safePlayAnimation(this, `${prefix}_smash`);
      } else if (this.scene?.anims?.exists(`${prefix}_slash`)) {
        safePlayAnimation(this, `${prefix}_slash`);
      } else if (this.scene?.anims?.exists(`${prefix}_slam`)) {
        safePlayAnimation(this, `${prefix}_slam`);
      }
    } else if (isMoving) {
      if (this.scene?.anims?.exists(`${prefix}_walk`)) {
        safePlayAnimation(this, `${prefix}_walk`);
      } else if (this.scene?.anims?.exists(`${prefix}_run`)) {
        safePlayAnimation(this, `${prefix}_run`);
      } else if (this.scene?.anims?.exists(`${prefix}_fly`)) {
        safePlayAnimation(this, `${prefix}_fly`);
      } else if (this.scene?.anims?.exists(`${prefix}_float`)) {
        safePlayAnimation(this, `${prefix}_float`);
      }
    } else {
      if (this.scene?.anims?.exists(`${prefix}_idle`)) {
        safePlayAnimation(this, `${prefix}_idle`);
      }
    }
  }

  /** Smoothly accelerate toward a target velocity —
   *  heavier monsters accelerate slower (Dungeon Siege feel) */
  private accelerateToward(targetVx: number, targetVy: number, delta: number) {
    const dt = delta / 1000;
    const isMoving = targetVx !== 0 || targetVy !== 0;
    const accel = this.getAccelRate();
    const rate = isMoving ? accel : accel * 0.55; // deceleration is gentler

    this.moveVx = this._moveToward(this.moveVx, targetVx, rate * dt);
    this.moveVy = this._moveToward(this.moveVy, targetVy, rate * dt);
    this.setVelocity(this.moveVx, this.moveVy);
  }

  private getAccelRate(): number {
    switch (this.config.behavior) {
      case 'swarmer': return 2400;  // bats, flies — twitchy
      case 'chaser':  return 1200;  // skeletons, wolves
      case 'charger': return 600;   // heavy brutes — slow start
      case 'boss':    return 480;   // biggest — very sluggish
      case 'ranged':  return 900;   // casters, archers
      default:        return 1000;
    }
  }

  private _moveToward(current: number, target: number, maxDelta: number): number {
    const diff = target - current;
    if (Math.abs(diff) <= maxDelta) return target;
    return current + Math.sign(diff) * maxDelta;
  }

  public takeDamage(amount: number): boolean {
    this.hp -= amount;
    this.isAngered = true;

    // Visual: blood burst particles
    if (this.active) {
      (this.scene as any).spawnBloodBurst?.(this.x, this.y, 6);
    }

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
