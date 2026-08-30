import Phaser from 'phaser';
import { MonsterConfig, AIState, EliteAffix, DismembermentResult } from '../../types/game';
import monstersData from '../../data/monsters.json';
import { soundEngine } from '../../utils/soundEngine';
import { useGameStore } from '../../store/gameStore';
import { safePlayAnimation } from '../animations/animationManager';
import { DismembermentSystem } from '../systems/DismembermentSystem';
import { CombatFeel } from '../systems/CombatFeel';

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

  // Dodge & Teleport Mechanics
  private lastDodgeTime: number = 0;
  private isDodging: boolean = false;
  private dodgeVector: Phaser.Math.Vector2 = new Phaser.Math.Vector2(0, 0);
  private lastTeleportTime: number = 0;
  private isTeleporting: boolean = false;

  // Flee / Reinforcements
  private fleeStartTime: number = 0;
  private reinforcementsCalled: boolean = false;

  // Status Emote Icon & Visual Variants
  private emoteSprite?: Phaser.GameObjects.Image;
  private eliteHaloGraphics?: Phaser.GameObjects.Graphics;
  private hoverOffsetY: number = 0;
  private lastDamagedParticleTime: number = 0;

  // Individual AI Personality & Movement Enhancements
  private speedMultiplier: number = 1.0;
  private personalPhase: number = 0;
  private baseScale: number = 1.0;
  private hasTriggeredHowl: boolean = false;

  // Attack Telegraphing & Realism Engine
  public attackPhase: 'none' | 'windup' | 'strike' | 'recovery' = 'none';
  public attackPhaseStartTime: number = 0;
  public attackPhaseEndTime: number = 0;
  public attackTargetPos: { x: number; y: number } = { x: 0, y: 0 };
  public attackType: 'melee' | 'ranged' = 'melee';

  // Movement acceleration (mass-based feel per monster type)
  private moveVx: number = 0;
  private moveVy: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, monsterId: string, options?: EnemyOptions) {
    const rawData = monstersData as Record<string, MonsterConfig>;
    const monsterConfig = rawData[monsterId] || rawData['skeleton_warrior'];

    super(scene, x, y, monsterConfig.spriteKey);
    if ((scene as any).lightingSystem) { (scene as any).lightingSystem.applyLightPipeline(this); }
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
    } else if (this.eliteAffix === 'teleporter') {
      affixHpMult = 1.25;
      affixSpeedMult = 1.15;
    } else if (this.eliteAffix === 'reflective') {
      affixHpMult = 1.35;
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

  public applyBaseTint() {
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
    if (this.eliteAffix === 'teleporter') {
      this.setTint(0xc084fc);
      return;
    }
    if (this.eliteAffix === 'reflective') {
      this.setTint(0x38bdf8);
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
   * Applies an elemental/necromantic status effect through StatusEffectSystem
   */
  public applyStatus(
    type: 'burning' | 'frozen' | 'cursed' | 'poison' | 'bleeding',
    durationMs: number = 3000,
    dps: number = 10
  ): void {
    if (this.scene && (this.scene as any).statusEffectSystem) {
      (this.scene as any).statusEffectSystem.applyStatus(this, type, durationMs, dps);
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
   * Spec 16: Initiates attack windup and triggers dodge hint if firstDashDone is false
   */
  public startWindup(time: number, durationMs: number, attackType: 'melee' | 'ranged', targetPos: { x: number; y: number }) {
    this.attackPhase = 'windup';
    this.attackPhaseStartTime = time;
    this.attackPhaseEndTime = time + durationMs;
    this.attackTargetPos = targetPos;
    this.attackType = attackType;
    soundEngine.playTelegraph();

    if (!useGameStore.getState().onboarding.firstDashDone && (this.config.id === 'skeleton_warrior' || this.floorDepth === 1)) {
      useGameStore.getState().setActiveTip('ESQUIVE! Toque em [DASH] ou duplo-toque para esquivar com invulnerabilidade.');
    }
  }

  /**
   * Show status indicator icon over head
   */
  private showEmote(key: string) {
    if (this.emoteSprite) {
      this.emoteSprite.destroy();
      this.emoteSprite = undefined;
    }
    const scene = this.scene;
    if (!scene || !scene.add) return;

    this.emoteSprite = scene.add.image(this.x, this.y - 28, key).setDepth(2000);
    if (scene.tweens) {
      scene.tweens.add({
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
      const scene = this.scene;
      if (scene && scene.time) {
        scene.time.delayedCall(220, () => {
          if (this.active) {
            this.isDodging = false;
          }
        });
      } else {
        this.isDodging = false;
      }
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

    // 2.3 Variant: Elite Aura / Halo Ring
    if (this.eliteAffix !== 'none' && this.scene) {
      if (!this.eliteHaloGraphics) {
        this.eliteHaloGraphics = this.scene.add.graphics();
        let haloColor = 0xb8860b;
        if (this.eliteAffix === 'frenzied') haloColor = 0xef4444;
        else if (this.eliteAffix === 'vampiric') haloColor = 0xd97706;
        else if (this.eliteAffix === 'cursed') haloColor = 0xa855f7;
        else if (this.eliteAffix === 'spectral') haloColor = 0x38bdf8;
        else if (this.eliteAffix === 'teleporter') haloColor = 0x9333ea;
        else if (this.eliteAffix === 'reflective') haloColor = 0x0284c7;

        this.eliteHaloGraphics.lineStyle(2, haloColor, 0.8);
        this.eliteHaloGraphics.strokeCircle(0, 0, 18);
        this.eliteHaloGraphics.setDepth(Math.max(1, this.depth - 1));
      }
      this.eliteHaloGraphics.setPosition(this.x, this.y + 10);
    }

    // 2.3 Variant: Damaged (HP < 40%) Periodic Blood Emissions
    const currentHpRatio = this.hp / this.maxHp;
    if (currentHpRatio < 0.40 && time > this.lastDamagedParticleTime + 800) {
      this.lastDamagedParticleTime = time;
      (this.scene as any).spawnBloodBurst?.(this.x, this.y - 4, 1);
    }

    // 2.3 Variant: Furious Crimson Pulsing Tint in Frenzy State
    if (this.aiState === 'frenzy' && this.attackPhase === 'none') {
      const pulse = (Math.sin(time * 0.012) + 1) * 0.5; // 0 to 1
      const gVal = Math.round(34 * (1 - pulse));
      const bVal = Math.round(34 * (1 - pulse));
      const pulsedTint = (0xff << 16) | (gVal << 8) | bVal;
      this.setTint(pulsedTint);
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

          if (this.attackType === 'ranged') {
            // Ranged spellcasters stay stationary during cast release (no forward lunge)
            this.setVelocity(0, 0);
            result = { attack: true, damage: this.damage, attackType: 'ranged' };
          } else {
            // Rapid forward lunge toward target position for melee
            const lungeAngle = Phaser.Math.Angle.Between(this.x, this.y, this.attackTargetPos.x, this.attackTargetPos.y);
            const lungeSpeed = (this.config.speed || 100) * 2.4;
            this.setVelocity(Math.cos(lungeAngle) * lungeSpeed, Math.sin(lungeAngle) * lungeSpeed);

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

    const isFrozen = (this.scene as any)?.statusEffectSystem?.hasStatus?.(this, 'frozen');
    const effectiveBaseSpeed = isFrozen ? 0 : this.config.speed * this.speedMultiplier;

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

        // Teleporter Elite: periodic strategic flank teleport
        if (
          this.eliteAffix === 'teleporter' &&
          !this.isTeleporting &&
          time > this.lastTeleportTime + 4200 &&
          distanceToPlayer > 110
        ) {
          this.teleportNearPlayer(playerX, playerY, time);
        }

        const currentSpeed = this.aiState === 'frenzy' ? effectiveBaseSpeed * 1.35 : effectiveBaseSpeed;

        switch (this.config.behavior) {
          case 'swarmer': {
            // Bat / Swarmer: Erratic swooping sine wave flight
            const waveAngle = angleToPlayer + Math.sin(time * 0.007 + this.personalPhase) * 0.42;
            this.accelerateToward(Math.cos(waveAngle) * currentSpeed, Math.sin(waveAngle) * currentSpeed, delta);

            if (distanceToPlayer <= this.config.attackRange) {
              if (time > this.lastAttackTime + 900) {
                this.startWindup(time, 180, 'melee', { x: playerX, y: playerY });
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
                this.startWindup(time, 300, 'melee', { x: playerX, y: playerY });
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
                this.startWindup(time, 420, 'melee', { x: playerX, y: playerY });
              }
            }
            break;

          case 'ranged':
          case 'boss': {
            let moveTargetVx = 0, moveTargetVy = 0;
            const optimalMaxRange = this.config.attackRange;
            const optimalMinRange = this.config.attackRange * 0.80;

            if (distanceToPlayer > optimalMaxRange) {
              // Advance with slight curved step toward optimal firing range
              const curveAngle = angleToPlayer + Math.sin(time * 0.003 + this.personalPhase) * 0.15;
              moveTargetVx = Math.cos(curveAngle) * currentSpeed;
              moveTargetVy = Math.sin(curveAngle) * currentSpeed;
            } else if (distanceToPlayer < optimalMinRange) {
              // Tactical kiting: backpedal away while facing player to maintain standoff distance
              const backAngle = angleToPlayer + Math.PI + Math.sin(time * 0.004 + this.personalPhase) * 0.25;
              moveTargetVx = Math.cos(backAngle) * currentSpeed * 0.95;
              moveTargetVy = Math.sin(backAngle) * currentSpeed * 0.95;
            } else {
              // Sweet spot: hold ground or slow side-step
              const strafeDirection = Math.sin(time * 0.002 + this.personalPhase) > 0 ? 1 : -1;
              const strafeAngle = angleToPlayer + (strafeDirection * Math.PI) / 2;
              moveTargetVx = Math.cos(strafeAngle) * currentSpeed * 0.35;
              moveTargetVy = Math.sin(strafeAngle) * currentSpeed * 0.35;
            }
            this.accelerateToward(moveTargetVx, moveTargetVy, delta);

            // Only fire ranged attack if within attack range AND line of sight is clear
            if (distanceToPlayer <= optimalMaxRange && !hasWallBetweenPlayer) {
              if (time > this.lastAttackTime + (this.aiState === 'frenzy' ? 1400 : 2100)) {
                this.startWindup(time, 400, 'ranged', { x: playerX, y: playerY });
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

    // 2.1 8-Directional Procedural Isometric Skew & Depth Scaling (N, NE, E, SE, S, SW, W, NW)
    // Map facingAngle to isometric scale factors
    const normalizedAngle = Phaser.Math.Angle.Normalize(this.facingAngle); // 0 to 2PI
    const isoCos = Math.abs(Math.cos(normalizedAngle)); // 0 (North/South) to 1 (East/West)
    const isoSin = Math.abs(Math.sin(normalizedAngle)); // 1 (North/South) to 0 (East/West)

    // Vertical axes (North/South) squash slightly (0.88x height, 0.94x width), horizontal (East/West) expand (1.06x width)
    const isoScaleX = 0.94 + isoCos * 0.12;
    const isoScaleY = 0.88 + isoSin * 0.12;

    // Apply Organic Walk Cycle (Stretch & Squash, Dynamic Tilt, Damaged Limp)
    if (this.body) {
      const currentVel = this.body.velocity;
      const speed = currentVel.length();
      if (speed > 8) {
        // Asymmetric/limping gait wobble when damaged (HP < 40%)
        const walkPulse = currentHpRatio < 0.40
          ? Math.abs(Math.sin(time * 0.016 + this.personalPhase)) * 0.16 - 0.04
          : Math.sin(time * 0.014 + this.personalPhase) * 0.08;
        const stretchX = 1 + walkPulse;
        const stretchY = 1 - walkPulse;
        this.setScale(this.baseScale * isoScaleX * stretchX, this.baseScale * isoScaleY * stretchY);

        const tiltAngle = (currentVel.x * 0.001) + Math.sin(time * 0.01 + this.personalPhase) * (currentHpRatio < 0.40 ? 0.12 : 0.06);
        this.setRotation(tiltAngle);
      } else {
        this.setScale(this.baseScale * isoScaleX, this.baseScale * isoScaleY);
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

    let nextVx = this._moveToward(this.moveVx, targetVx, rate * dt);
    let nextVy = this._moveToward(this.moveVy, targetVy, rate * dt);

    const isEtherealOrFlying =
      this.config.gaitType === 'ethereal' ||
      this.eliteAffix === 'spectral' ||
      this.config.spriteKey === 'spr_bat_swarm' ||
      this.config.spriteKey === 'spr_specter';

    const dungeonGen = (this.scene as any)?.dungeonGenerator;
    if (dungeonGen && !isEtherealOrFlying && (nextVx !== 0 || nextVy !== 0)) {
      const stepDist = 16;
      const futureX = this.x + Math.sign(nextVx) * stepDist;
      const futureY = this.y + Math.sign(nextVy) * stepDist;

      if (!dungeonGen.isTraversable(this.x, this.y, futureX, futureY)) {
        const canMoveX = futureX !== this.x && dungeonGen.isTraversable(this.x, this.y, futureX, this.y);
        const canMoveY = futureY !== this.y && dungeonGen.isTraversable(this.x, this.y, this.x, futureY);

        if (canMoveX && !canMoveY) {
          nextVy = 0;
        } else if (canMoveY && !canMoveX) {
          nextVx = 0;
        } else {
          nextVx = 0;
          nextVy = 0;
        }
      }
    }

    this.moveVx = nextVx;
    this.moveVy = nextVy;
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

  /**
   * Teleporta estrategicamente para o flanco do jogador (Afício Elite: Teleporter)
   */
  public teleportNearPlayer(playerX: number, playerY: number, time: number) {
    if (this.isTeleporting || !this.active || !this.scene) return;
    this.isTeleporting = true;
    this.lastTeleportTime = time;

    // Efeito visual antes do teleporte
    (this.scene as any).spawnBloodBurst?.(this.x, this.y, 8);
    if ((this.scene as any).spawnFloatingText) {
      (this.scene as any).spawnFloatingText(this.x, this.y - 14, 'TELEPORTE! ✨', '#c084fc', false);
    }
    soundEngine.playSwing();

    const scene = this.scene;
    if (scene && scene.tweens) {
      scene.tweens.add({
        targets: this,
        alpha: 0.15,
        scaleX: 0.2,
        scaleY: 0.2,
        duration: 130,
        onComplete: () => {
          if (!this.active) return;
          const angle = Math.random() * Math.PI * 2;
          const dist = 75 + Math.random() * 25;
          const newX = playerX + Math.cos(angle) * dist;
          const newY = playerY + Math.sin(angle) * dist;
          this.setPosition(newX, newY);
          (scene as any).spawnBloodBurst?.(newX, newY, 8);

          scene.tweens.add({
            targets: this,
            alpha: 1.0,
            scaleX: this.baseScale,
            scaleY: this.baseScale,
            duration: 130,
            onComplete: () => {
              this.isTeleporting = false;
              this.facingAngle = Phaser.Math.Angle.Between(this.x, this.y, playerX, playerY);
            },
          });
        },
      });
    } else {
      this.isTeleporting = false;
    }
  }

  public takeDamage(
    amount: number,
    sourceX?: number,
    sourceY?: number,
    isCrit: boolean = false,
    isExecution: boolean = false
  ): boolean {
    let dmgToApply = amount;

    // Afixo Elite: Reflective (mitiga 35% do dano e emite contra-centelha)
    if (this.eliteAffix === 'reflective') {
      dmgToApply = Math.round(amount * 0.65);
      if ((this.scene as any)?.spawnFloatingText) {
        (this.scene as any).spawnFloatingText(this.x, this.y - 12, 'REFLETIDO! 🛡️', '#38bdf8', false);
      }
      if (sourceX !== undefined && sourceY !== undefined && (this.scene as any)?.spawnReflectedSpark) {
        (this.scene as any).spawnReflectedSpark(this.x, this.y, sourceX, sourceY);
      }
    }

    const isCursed = this.eliteAffix === 'cursed' || (this.scene as any)?.statusEffectSystem?.hasStatus?.(this, 'cursed');
    const finalAmount = isCursed ? Math.round(dmgToApply * 1.25) : dmgToApply;
    this.hp -= finalAmount;
    this.isAngered = true;

    // Teleporter: Chance de esquiva reativa com teleporte ao ser atingido
    if (
      this.eliteAffix === 'teleporter' &&
      !this.isTeleporting &&
      Math.random() < 0.45 &&
      (this.scene?.time?.now || 0) > this.lastTeleportTime + 2800
    ) {
      this.teleportNearPlayer(sourceX ?? this.x, sourceY ?? this.y, this.scene?.time?.now || 0);
    }

    // Visual: blood burst particles
    if (this.active) {
      (this.scene as any).spawnBloodBurst?.(this.x, this.y, isCrit ? 12 : 6);
      if (isCrit) {
        CombatFeel.triggerVibration('critical_hit');
      }
    }

    // Alert instantly to combat when damaged!
    this.alertToCombat();

    // Set as current target in HUD
    useGameStore.getState().setCurrentTarget({
      id: this.config.id || 'enemy',
      name: this.eliteAffix !== 'none' ? `${this.eliteAffix.toUpperCase()} ${this.config.name}` : this.config.name,
      hp: Math.max(0, this.hp),
      maxHp: this.maxHp,
      level: this.floorDepth,
      isBoss: this.config.behavior === 'boss' || this.eliteAffix !== 'none'
    });

    // 2.2 Advanced Damage Effects: Hit Flash -> Red Flash -> Base Tint
    const scene = this.scene;
    if (scene && scene.time) {
      this.setTint(0xffffff);
      if (typeof (this as any).setTintMode === 'function' && (Phaser as any).TintModes?.FILL !== undefined) {
        (this as any).setTintMode((Phaser as any).TintModes.FILL);
      }
      scene.time.delayedCall(33, () => {
        if (this.active) {
          this.setTint(0xff0000);
          if (typeof (this as any).setTintMode === 'function' && (Phaser as any).TintModes?.MULTIPLY !== undefined) {
            (this as any).setTintMode((Phaser as any).TintModes.MULTIPLY);
          }
          if (scene && scene.time) {
            scene.time.delayedCall(90, () => {
              if (this.active) {
                if (this.aiState === 'frenzy') {
                  this.setTint(0xff3333);
                } else {
                  this.applyBaseTint();
                }
              }
            });
          }
        }
      });
    } else {
      this.setTint(0xff0000);
    }

    // 2.2 Flinch & Mass-based Knockback
    if (sourceX !== undefined && sourceY !== undefined && this.active && this.body) {
      const dx = this.x - sourceX;
      const dy = this.y - sourceY;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const nx = dx / dist;
      const ny = dy / dist;

      // Flinch: momentary frame shift (2-4px) away from attack origin
      const flinchDist = 3;
      this.x += nx * flinchDist;
      this.y += ny * flinchDist;

      // Mass-based knockback impulse velocity
      // Swarmers (e.g. bats/hounds): ~180px/s, Chasers (skeletons): ~100px/s, Chargers/Golems: ~20px/s, Boss: ~10px/s
      let knockbackSpeed = 100;
      switch (this.config.behavior) {
        case 'swarmer':
          knockbackSpeed = 180;
          break;
        case 'chaser':
          knockbackSpeed = 100;
          break;
        case 'ranged':
          knockbackSpeed = 110;
          break;
        case 'charger':
          knockbackSpeed = 30;
          break;
        case 'boss':
          knockbackSpeed = 15;
          break;
      }
      if (isCrit) knockbackSpeed *= 1.5;

      this.moveVx += nx * knockbackSpeed;
      this.moveVy += ny * knockbackSpeed;
      this.setVelocity(this.moveVx, this.moveVy);
    }

    soundEngine.playBloodSquish();

    // Dismemberment / Gib explosion check on death
    const isOverkill = this.hp <= -this.maxHp * 0.5 || amount >= this.maxHp * 1.5;
    if (this.hp <= 0 && (isExecution || isCrit || isOverkill)) {
      this.spawnGibs();
    }

    return this.hp <= 0;
  }

  public destroy(fromScene?: boolean) {
    if (this.eliteHaloGraphics) {
      this.eliteHaloGraphics.destroy();
      this.eliteHaloGraphics = undefined;
    }
    if (this.emoteSprite) {
      this.emoteSprite.destroy();
      this.emoteSprite = undefined;
    }
    super.destroy(fromScene);
  }

  /**
   * 3-Factor Dismemberment & Gibs Execution
   */
  public spawnGibs(result?: DismembermentResult) {
    const scene = this.scene;
    if (!scene || !scene.add) return;

    const finalResult: DismembermentResult =
      result ??
      DismembermentSystem.calculateDismemberment({
        monsterConfig: this.config,
        damageAmount: this.maxHp * 0.8,
        enemyMaxHp: this.maxHp,
        enemyCurrentHp: this.hp,
        isCrit: false,
        isExecution: false,
      });

    DismembermentSystem.executeDismemberment(
      scene,
      {
        x: this.x,
        y: this.y,
        texture: this.texture,
        scaleX: this.scaleX,
        scaleY: this.scaleY,
        config: this.config,
        bloodEmitter: (scene as any).bloodEmitter,
      },
      finalResult
    );
  }

  /**
   * Obtém os metadados de projeção visual do telégrafo de ataque (Frente 3)
   */
  public getTelegraphInfo(time: number) {
    if (this.attackPhase !== 'windup' && this.attackPhase !== 'strike') {
      return null;
    }

    const duration = Math.max(1, this.attackPhaseEndTime - this.attackPhaseStartTime);
    let progress = (time - this.attackPhaseStartTime) / duration;
    progress = Phaser.Math.Clamp(progress, 0, 1);

    const angle = Phaser.Math.Angle.Between(this.x, this.y, this.attackTargetPos.x, this.attackTargetPos.y);

    let color = 0xef4444; // Default crimson red
    if (this.eliteAffix === 'cursed') color = 0xa855f7;
    else if (this.eliteAffix === 'frenzied') color = 0xf97316;
    else if (this.eliteAffix === 'teleporter') color = 0x9333ea;
    else if (this.eliteAffix === 'reflective') color = 0x0284c7;
    else if (this.config.id === 'cultist_acolyte' || this.config.id === 'specter_wraith') color = 0x8b5cf6;
    else if (this.config.id === 'flesh_golem' || this.config.id === 'gore_abomination') color = 0xdc2626;

    if (this.config.id === 'blood_lord_boss') {
      return {
        phase: this.attackPhase,
        progress,
        shape: 'boss_slam' as const,
        originX: this.x,
        originY: this.y,
        targetX: this.attackTargetPos.x,
        targetY: this.attackTargetPos.y,
        range: 80,
        angle,
        spreadAngle: Math.PI * 2,
        color: 0xef4444,
      };
    }

    if (this.config.behavior === 'charger' || this.isCharging) {
      return {
        phase: this.attackPhase,
        progress,
        shape: 'line' as const,
        originX: this.x,
        originY: this.y,
        targetX: this.attackTargetPos.x,
        targetY: this.attackTargetPos.y,
        range: Math.max(80, Phaser.Math.Distance.Between(this.x, this.y, this.attackTargetPos.x, this.attackTargetPos.y) + 30),
        angle,
        spreadAngle: 0,
        lineWidth: 32,
        color,
      };
    }

    if (this.attackType === 'ranged') {
      return {
        phase: this.attackPhase,
        progress,
        shape: 'circle' as const,
        originX: this.attackTargetPos.x,
        originY: this.attackTargetPos.y,
        targetX: this.attackTargetPos.x,
        targetY: this.attackTargetPos.y,
        range: 36,
        angle,
        spreadAngle: Math.PI * 2,
        color,
      };
    }

    if (this.config.id === 'flesh_golem' || this.config.id === 'gore_abomination') {
      return {
        phase: this.attackPhase,
        progress,
        shape: 'cone' as const,
        originX: this.x,
        originY: this.y,
        targetX: this.attackTargetPos.x,
        targetY: this.attackTargetPos.y,
        range: this.config.attackRange + 26,
        angle,
        spreadAngle: Math.PI * 0.65, // ~117 graus cleave
        color,
      };
    }

    // Standard melee cleave / bite
    return {
      phase: this.attackPhase,
      progress,
      shape: 'cone' as const,
      originX: this.x,
      originY: this.y,
      targetX: this.attackTargetPos.x,
      targetY: this.attackTargetPos.y,
      range: this.config.attackRange + 16,
      angle,
      spreadAngle: Math.PI * 0.45, // ~80 graus cone
      color,
    };
  }
}
