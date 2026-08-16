import Phaser from 'phaser';
import { PlayerStats, SpellConfig, LootItem } from '../../types/game';
import spellsData from '../../data/spells.json';
import { soundEngine } from '../../utils/soundEngine';
import { useGameStore } from '../../store/gameStore';
import { safePlayAnimation } from '../animations/animationManager';

export class Player extends Phaser.Physics.Arcade.Sprite {
  public stats: PlayerStats;
  private moveVector: Phaser.Math.Vector2 = new Phaser.Math.Vector2(0, 0);
  private aimVector: Phaser.Math.Vector2 = new Phaser.Math.Vector2(1, 0);
  private lastAutoShootTime: number = 0;
  private skillCooldowns: Record<string, number> = {};
  public isInvulnerable: boolean = false;
  private invulnerableTimer: number = 0;
  public equippedLoot: LootItem[] = [];

  // Status condition DoT timers
  private bleedTimer: number = 0;
  private poisonTimer: number = 0;
  private infectionTimer: number = 0;

  // Dash mechanics
  public isDashing: boolean = false;
  private dashTimer: number = 0;
  private dashCooldownTimer: number = 0;
  private dashVector: Phaser.Math.Vector2 = new Phaser.Math.Vector2(0, 0);
  private readonly DASH_DURATION = 150; // ms
  private readonly DASH_INVULNERABILITY = 200; // ms
  private readonly DASH_COOLDOWN = 3000; // ms

  // Movement acceleration (Dungeon Siege feel)
  private currentVx: number = 0;
  private currentVy: number = 0;
  private readonly ACCELERATION = 1400;
  private readonly DECELERATION = 1000;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'spr_bloodmage');
    if ((scene as any).lightingSystem) { (scene as any).lightingSystem.applyLightPipeline(this); }
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setSize(20, 24);
    this.setOffset(14, 22);
    (this as any).setLighting?.(true);

    const typedSpellsData = spellsData as Record<string, SpellConfig>;

    this.stats = {
      hp: 100,
      maxHp: 100,
      mana: 100,
      maxMana: 100,
      level: 1,
      currentXp: 0,
      nextLevelXp: 50,
      moveSpeed: 160,
      damageMultiplier: 1.0,
      cooldownReduction: 0.0,
      vampirism: 0.0,
      projectileBonus: 0,
      kills: 0,
      souls: 0,
      wave: 1,
      floorDepth: 1,
      score: 0,
      timeSurvivedSeconds: 0,
      unlockedSpells: ['blood_bolt', 'hellfire_nova', 'syphon_soul', 'bone_shield', 'crimson_scythe', 'blood_ritual_circle', 'hemomancy_beam'],
      pendingStatPoints: 0,
      knockoutCount: 0,
      isUnconscious: false,
      isDefinitivelyDead: false,
      statusConditions: {
        bleeding: false,
        poison: false,
        infection: false,
      },
      curatives: {
        bandages: 1,
        antidotes: 1,
        antibiotics: 0,
      },
      droppedCorpse: {
        hasDroppedCorpse: false,
        zone: '',
        x: 0,
        y: 0,
        droppedTimestamp: 0,
        equipment: { weapon: null, armor: null, relics: [] },
        curatives: { bandages: 0, antidotes: 0, antibiotics: 0 },
      },
    };

    // Init skill cooldowns
    Object.keys(typedSpellsData).forEach((id) => {
      this.skillCooldowns[id] = 0;
    });

    this.applyCosmeticTint();
  }

  public applyCosmeticTint() {
    const activeId = useGameStore.getState().settings.activePaletteId || 'crimson';
    const palettes = [
      { id: "crimson", color: "#ffffff" },
      { id: "corrupted", color: "#d8b4fe" },
      { id: "golden", color: "#fef08a" },
      { id: "shadow", color: "#ffffff" }
    ];
    const match = palettes.find(p => p.id === activeId);
    if (match && match.color !== '#ffffff') {
      const tintHex = parseInt(match.color.replace('#', '0x'), 16);
      this.setTint(tintHex);
    } else {
      this.clearTint();
    }
  }

  public setMoveInput(x: number, y: number) {
    if (this.stats.isUnconscious || this.stats.isDefinitivelyDead) {
      this.moveVector.set(0, 0);
      return;
    }
    this.moveVector.set(x, y);
    if (this.moveVector.length() > 1) {
      this.moveVector.normalize();
    }
  }

  public setAimInput(x: number, y: number) {
    if (this.stats.isUnconscious || this.stats.isDefinitivelyDead) {
      return;
    }
    if (x !== 0 || y !== 0) {
      this.aimVector.set(x, y).normalize();
    }
  }

  public updatePlayer(time: number, delta: number) {
    // Cooldown timers
    if (this.dashCooldownTimer > 0) {
      this.dashCooldownTimer -= delta;
    }

    if (this.stats.isUnconscious) {
      this.setVelocity(0, 0);
      this.currentVx = 0;
      this.currentVy = 0;
      this.setAlpha(0.6);
      this.setTint(0x550000);
      this.setAngle(90); // Lying down fallen sprite posture

      // Regenerate passive HP while unconscious (2% of Max HP per second)
      // Infection blocks natural regeneration (Discovery Seção 2.4)
      if (!this.stats.statusConditions.infection) {
        const regenAmount = (0.02 * this.stats.maxHp * delta) / 1000;
        this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + regenAmount);
      }

      const threshold = 0.05 * this.stats.maxHp;
      if (this.stats.hp >= threshold) {
        this.stats.isUnconscious = false;
        this.stats.hp = Math.ceil(threshold);
        this.isInvulnerable = true;
        this.invulnerableTimer = 1500; // 1.5s wake-up invulnerability
        this.setAlpha(1.0);
        this.setAngle(0); // Stand back up
        this.clearTint();

        useGameStore.getState().setUnconscious(false);
        useGameStore.getState().setPlayerStats({ ...this.stats });
      } else {
        useGameStore.getState().setPlayerStats({ ...this.stats });
      }

      // Update skill cooldowns
      Object.keys(this.skillCooldowns).forEach((key) => {
        if (this.skillCooldowns[key] > 0) {
          this.skillCooldowns[key] -= delta;
        }
      });
      return;
    }

    // Fase 3: Survival Status Conditions tick (Dead Frontier 2 style tension, non-lethal-to-invuln DoT)
    this.updateStatusConditions(delta);

    if (this.isDashing) {
      this.dashTimer -= delta;

      const dashSpeed = 800; // 120px in 150ms is ~800px/s
      this.setVelocity(this.dashVector.x * dashSpeed, this.dashVector.y * dashSpeed);

      // Spawn ghost trail (simple throttle)
      if (Math.floor(time / 20) % 2 === 0) {
        if (this.scene && this.scene.add) {
          const trail = this.scene.add.image(this.x, this.y, this.texture.key);
          trail.setTint(0xef4444);
          trail.setAlpha(0.5);
          trail.setScale(this.scaleX, this.scaleY);
          trail.setDepth(this.depth - 1);
          this.scene.tweens.add({
            targets: trail,
            alpha: 0,
            duration: 200,
            onComplete: () => trail.destroy()
          });
        }
      }

      if (this.dashTimer <= 0) {
        this.isDashing = false;
        this.setVelocity(0, 0);
        this.currentVx = 0;
        this.currentVy = 0;
      }
    } else {
      // Movement Physics — acceleration-based for smooth start/stop
      const speed = this.stats.moveSpeed * (this.stats.statusConditions?.bleeding ? 0.8 : 1.0);
      const dt = delta / 1000;
      const targetVx = this.moveVector.x * speed;
      const targetVy = this.moveVector.y * speed;

      // Accelerate toward target (instant if target is zero = friction)
      if (this.moveVector.x !== 0 || this.moveVector.y !== 0) {
        this.currentVx = this.moveToward(this.currentVx, targetVx, this.ACCELERATION * dt);
        this.currentVy = this.moveToward(this.currentVy, targetVy, this.ACCELERATION * dt);
      } else {
        this.currentVx = this.moveToward(this.currentVx, 0, this.DECELERATION * dt);
        this.currentVy = this.moveToward(this.currentVy, 0, this.DECELERATION * dt);
      }
      this.setVelocity(this.currentVx, this.currentVy);
    }

    // Play directional walk or idle animation based on movement and aim
    const isMoving = this.moveVector.x !== 0 || this.moveVector.y !== 0;
    const isAiming = this.aimVector.x !== 0 || this.aimVector.y !== 0;

    let dir = 'south';
    if (isAiming) {
      dir = this.get8Direction(this.aimVector.x, this.aimVector.y);
    } else if (isMoving) {
      dir = this.get8Direction(this.moveVector.x, this.moveVector.y);
    }

    this.setFlipX(false);

    const animState = isMoving ? 'walk' : 'idle';
    const animKey = `bloodmage_${animState}_${dir}`;

    if (this.scene && this.scene.anims.exists(animKey)) {
      safePlayAnimation(this, animKey);
    } else {
      safePlayAnimation(this, isMoving ? 'bloodmage_walk_south' : 'bloodmage_idle_south');
    }

    // Sync status conditions & curatives from Zustand store
    const storeStats = useGameStore.getState().playerStats;
    if (storeStats) {
      this.stats.statusConditions = storeStats.statusConditions || this.stats.statusConditions;
      this.stats.curatives = storeStats.curatives || this.stats.curatives;
    }

    // Process Status Conditions DoT (Bleeding, Poison, Infection)
    if (!this.stats.isUnconscious && !this.stats.isDefinitivelyDead) {
      this.bleedTimer += delta;
      this.poisonTimer += delta;
      this.infectionTimer += delta;

      if (this.stats.statusConditions?.bleeding) {
        if (this.bleedTimer >= 1500) {
          this.bleedTimer = 0;
          this.takeDamage(3);
          if (this.scene && 'spawnFloatingText' in this.scene) {
            (this.scene as any).spawnFloatingText(this.x, this.y - 12, '-3 SANGRAMENTO', '#ef4444', false);
          }
        }

        // Leave blood droplets on the floor while walking with bleeding status
        if ((this.moveVector.x !== 0 || this.moveVector.y !== 0) && Math.floor(time / 250) % 2 === 0) {
          if (this.scene && this.scene.add) {
            const drop = this.scene.add.image(this.x + (Math.random() - 0.5) * 8, this.y + 8, 'particle_blood_red');
            drop.setTint(0x990000);
            drop.setDepth(3);
            drop.setScale(0.7);
            this.scene.tweens.add({
              targets: drop,
              alpha: 0,
              duration: 1800,
              onComplete: () => drop.destroy()
            });
          }
        }
      }

      if (this.stats.statusConditions?.poison) {
        if (this.poisonTimer >= 2000) {
          this.poisonTimer = 0;
          this.takeDamage(4);
          if (this.scene && 'spawnFloatingText' in this.scene) {
            (this.scene as any).spawnFloatingText(this.x, this.y - 12, '-4 VENENO', '#22c55e', false);
          }
        }
      }

      if (this.stats.statusConditions?.infection) {
        if (this.infectionTimer >= 3000) {
          this.infectionTimer = 0;
          this.takeDamage(2);
          if (this.scene && 'spawnFloatingText' in this.scene) {
            (this.scene as any).spawnFloatingText(this.x, this.y - 12, '-2 INFECÇÃO', '#a855f7', false);
          }
        }
      }

      // Visual Status Tints
      if (!this.isInvulnerable) {
        if (this.stats.statusConditions?.poison) {
          this.setTint(0x4ade80); // Green
        } else if (this.stats.statusConditions?.infection) {
          this.setTint(0xc084fc); // Purple
        } else if (this.stats.statusConditions?.bleeding) {
          this.setTint(0xf87171); // Deep Red
        } else {
          this.applyCosmeticTint();
        }
      }
    }

    // Mana Regeneration (+4 MP/sec, reduced by 50% if poisoned)
    const manaRegenRate = this.stats.statusConditions?.poison ? 2 : 4;
    if (this.stats.mana < this.stats.maxMana) {
      this.stats.mana = Math.min(this.stats.maxMana, this.stats.mana + (manaRegenRate * delta) / 1000);
    }

    // Invulnerability Flashing
    if (this.isInvulnerable) {
      this.invulnerableTimer -= delta;
      this.setAlpha(Math.floor(time / 100) % 2 === 0 ? 0.3 : 1.0);
      if (this.invulnerableTimer <= 0) {
        this.isInvulnerable = false;
        this.setAlpha(1.0);
      }
    }

    // Update cooldown timers
    Object.keys(this.skillCooldowns).forEach((key) => {
      if (this.skillCooldowns[key] > 0) {
        this.skillCooldowns[key] -= delta;
      }
    });

    // Auto Shoot Primary (Blood Bolt) if pointer is down or enemy in range (< 350px)
    const bloodBoltConfig = (spellsData as Record<string, SpellConfig>)['blood_bolt'];
    const autoCd = bloodBoltConfig.cooldownMs * (1 - this.stats.cooldownReduction);

    const pointer = this.scene && this.scene.input && this.scene.input.activePointer;
    const isPointerDown = pointer && pointer.isDown;

    let hasEnemyInRange = false;
    if (this.scene && 'enemiesGroup' in this.scene) {
      const enemiesGroup = (this.scene as any).enemiesGroup;
      if (enemiesGroup && enemiesGroup.getChildren) {
        enemiesGroup.getChildren().forEach((enemy: any) => {
          if (enemy && enemy.active && enemy.hp > 0) {
            const dist = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
            if (dist < 350) {
              hasEnemyInRange = true;
            }
          }
        });
      }
    }

    if ((isPointerDown || hasEnemyInRange) && time > this.lastAutoShootTime + autoCd) {
      this.castBloodBolt(time);
    }
  }

  private get8Direction(vx: number, vy: number): string {
    const angle = Math.atan2(vy, vx) * (180 / Math.PI);
    if (angle >= -22.5 && angle < 22.5) return 'east';
    if (angle >= 22.5 && angle < 67.5) return 'south_east';
    if (angle >= 67.5 && angle < 112.5) return 'south';
    if (angle >= 112.5 && angle < 157.5) return 'south_west';
    if (angle >= 157.5 || angle < -157.5) return 'west';
    if (angle >= -157.5 && angle < -112.5) return 'north_west';
    if (angle >= -112.5 && angle < -67.5) return 'north';
    if (angle >= -67.5 && angle < -22.5) return 'north_east';
    return 'south';
  }

  public getAimAngle(): number {
    return Math.atan2(this.aimVector.y, this.aimVector.x);
  }

  public getAimVector(): Phaser.Math.Vector2 {
    return this.aimVector;
  }

  public getCooldownRemaining(spellId: string): number {
    return Math.max(0, this.skillCooldowns[spellId] || 0);
  }

  public getDashCooldownRemaining(): number {
    return Math.max(0, this.dashCooldownTimer);
  }

  public triggerDash(): boolean {
    if (this.stats.isUnconscious || this.stats.isDefinitivelyDead) return false;
    if (this.isDashing || this.dashCooldownTimer > 0) return false;

    this.isDashing = true;
    this.dashTimer = this.DASH_DURATION;

    // Set invulnerability frames: 200ms
    this.isInvulnerable = true;
    this.invulnerableTimer = this.DASH_INVULNERABILITY;

    // Direction: if moving, dash in movement direction. Otherwise, in aim direction.
    if (this.moveVector.x !== 0 || this.moveVector.y !== 0) {
      this.dashVector.copy(this.moveVector).normalize();
    } else {
      this.dashVector.copy(this.aimVector).normalize();
    }

    // Cooldown reducible by CDR (talent and stats)
    const cd = this.DASH_COOLDOWN * (1 - this.stats.cooldownReduction);
    this.dashCooldownTimer = cd;

    soundEngine.playDash();
    return true;
  }

  public castBloodBolt(time: number): boolean {
    if (this.stats.isUnconscious || this.stats.isDefinitivelyDead) return false;
    const spell = (spellsData as Record<string, SpellConfig>)['blood_bolt'];
    const hasRuneFamine = useGameStore.getState().activeModifiers.includes('rune_famine');
    const cost = hasRuneFamine ? spell.manaCost * 2 : spell.manaCost;
    if (this.stats.mana < cost) return false;

    this.stats.mana -= cost;
    this.lastAutoShootTime = time;
    soundEngine.playBloodBolt();
    return true;
  }

  public castNova(): boolean {
    if (this.stats.isUnconscious || this.stats.isDefinitivelyDead) return false;
    const spell = (spellsData as Record<string, SpellConfig>)['hellfire_nova'];
    if (this.getCooldownRemaining('hellfire_nova') > 0) return false;
    const hasRuneFamine = useGameStore.getState().activeModifiers.includes('rune_famine');
    const cost = hasRuneFamine ? spell.manaCost * 2 : spell.manaCost;
    if (this.stats.mana < cost) return false;

    this.stats.mana -= cost;
    const cd = spell.cooldownMs * (1 - this.stats.cooldownReduction);
    this.skillCooldowns['hellfire_nova'] = cd;
    soundEngine.playNova();
    return true;
  }

  public castSyphon(): boolean {
    if (this.stats.isUnconscious || this.stats.isDefinitivelyDead) return false;
    const spell = (spellsData as Record<string, SpellConfig>)['syphon_soul'];
    if (this.getCooldownRemaining('syphon_soul') > 0) return false;
    const hasRuneFamine = useGameStore.getState().activeModifiers.includes('rune_famine');
    const cost = hasRuneFamine ? spell.manaCost * 2 : spell.manaCost;
    if (this.stats.mana < cost) return false;

    this.stats.mana -= cost;
    const cd = spell.cooldownMs * (1 - this.stats.cooldownReduction);
    this.skillCooldowns['syphon_soul'] = cd;
    soundEngine.playSyphonSoul();
    return true;
  }

  public castBoneShield(): boolean {
    if (this.stats.isUnconscious || this.stats.isDefinitivelyDead) return false;
    const spell = (spellsData as Record<string, SpellConfig>)['bone_shield'];
    if (this.getCooldownRemaining('bone_shield') > 0) return false;
    const hasRuneFamine = useGameStore.getState().activeModifiers.includes('rune_famine');
    const cost = hasRuneFamine ? spell.manaCost * 2 : spell.manaCost;
    if (this.stats.mana < cost) return false;

    this.stats.mana -= cost;
    const cd = spell.cooldownMs * (1 - this.stats.cooldownReduction);
    this.skillCooldowns['bone_shield'] = cd;
    soundEngine.playBoneShield();
    return true;
  }

  public castCrimsonScythe(): boolean {
    if (this.stats.isUnconscious || this.stats.isDefinitivelyDead) return false;
    const spell = (spellsData as Record<string, SpellConfig>)['crimson_scythe'];
    if (this.getCooldownRemaining('crimson_scythe') > 0) return false;
    const hasRuneFamine = useGameStore.getState().activeModifiers.includes('rune_famine');
    const cost = hasRuneFamine ? spell.manaCost * 2 : spell.manaCost;
    if (this.stats.mana < cost) return false;
    const hpCost = spell.hpCost || 0;
    if (this.stats.hp <= hpCost) return false;

    this.stats.mana -= cost;
    this.stats.hp -= hpCost;
    const cd = spell.cooldownMs * (1 - this.stats.cooldownReduction);
    this.skillCooldowns['crimson_scythe'] = cd;
    soundEngine.playScytheSlash();
    return true;
  }

  public castRitualCircle(): boolean {
    if (this.stats.isUnconscious || this.stats.isDefinitivelyDead) return false;
    const spell = (spellsData as Record<string, SpellConfig>)['blood_ritual_circle'];
    if (this.getCooldownRemaining('blood_ritual_circle') > 0) return false;
    const hasRuneFamine = useGameStore.getState().activeModifiers.includes('rune_famine');
    const cost = hasRuneFamine ? spell.manaCost * 2 : spell.manaCost;
    if (this.stats.mana < cost) return false;
    const hpCost = spell.hpCost || 0;
    if (this.stats.hp <= hpCost) return false;

    this.stats.mana -= cost;
    this.stats.hp -= hpCost;
    const cd = spell.cooldownMs * (1 - this.stats.cooldownReduction);
    this.skillCooldowns['blood_ritual_circle'] = cd;
    soundEngine.playRitualCircle();
    return true;
  }

  public castHemomancyBeam(): boolean {
    if (this.stats.isUnconscious || this.stats.isDefinitivelyDead) return false;
    const spell = (spellsData as Record<string, SpellConfig>)['hemomancy_beam'];
    if (this.getCooldownRemaining('hemomancy_beam') > 0) return false;
    const hasRuneFamine = useGameStore.getState().activeModifiers.includes('rune_famine');
    const cost = hasRuneFamine ? spell.manaCost * 2 : spell.manaCost;
    if (this.stats.mana < cost) return false;
    const hpCost = spell.hpCost || 0;
    if (this.stats.hp <= hpCost) return false;

    this.stats.mana -= cost;
    this.stats.hp -= hpCost;
    const cd = spell.cooldownMs * (1 - this.stats.cooldownReduction);
    this.skillCooldowns['hemomancy_beam'] = cd;
    soundEngine.playHemomancyBeam();
    return true;
  }

  /**
   * Fase 3: Survival Status Conditions (Dead Frontier 2 style).
   * Non-brutal, gradual tension damage. Never triggers invulnerability frames
   * (status DoT should not shield the player from a real enemy hit landing
   * in the same instant), but DOES respect the same knockout/death flow as
   * takeDamage() so it never creates a second, inconsistent death path.
   */
  private updateStatusConditions(delta: number) {
    const sc = this.stats.statusConditions;
    if (!sc.bleeding && !sc.poison && !sc.infection) return;

    // Bleeding: drains HP only while actively moving. Standing still stops it.
    if (sc.bleeding && this.moveVector.length() > 0.05) {
      const bleedDmg = (0.02 * this.stats.maxHp * delta) / 1000; // 2%/s while moving
      this.applyStatusDamage(bleedDmg);
    }

    // Poison: continuous drain regardless of movement.
    if (sc.poison) {
      const poisonDmg = (0.015 * this.stats.maxHp * delta) / 1000; // 1.5%/s always
      this.applyStatusDamage(poisonDmg);
    }

    // Infection: temporarily caps effective Max HP (does not mutate base maxHp,
    // so curing it lets HP recover back up naturally / via potions).
    if (sc.infection) {
      const effectiveCap = this.stats.maxHp * 0.8;
      if (this.stats.hp > effectiveCap) {
        this.stats.hp = effectiveCap;
        useGameStore.getState().setPlayerStats({ ...this.stats });
      }
    }
  }

  private applyStatusDamage(amount: number) {
    if (amount <= 0 || this.stats.isUnconscious || this.stats.isDefinitivelyDead) return;

    this.stats.hp = Math.max(0, this.stats.hp - amount);
    useGameStore.getState().setPlayerStats({ ...this.stats });

    if (this.stats.hp <= 0) {
      if (this.stats.knockoutCount < 2) {
        this.stats.isUnconscious = true;
        this.stats.knockoutCount += 1;
        this.setVelocity(0, 0);
        this.currentVx = 0;
        this.currentVy = 0;

        useGameStore.getState().setUnconscious(true);
        useGameStore.getState().setPlayerStats({ ...this.stats });
        soundEngine.playPlayerHurt();
      } else {
        this.stats.isDefinitivelyDead = true;
        useGameStore.getState().setDefinitivelyDead(true);
        useGameStore.getState().setPlayerStats({ ...this.stats });
        soundEngine.playPlayerHurt();
      }
    }
  }

  public takeDamage(amount: number): boolean {
    if (this.isInvulnerable || this.stats.isUnconscious || this.stats.isDefinitivelyDead) return false;

    // Infection increases damage taken by 20%
    if (this.stats.statusConditions?.infection) {
      amount *= 1.2;
    }

    this.stats.hp = Math.max(0, this.stats.hp - amount);

    // Sync HP immediately to state
    useGameStore.getState().setPlayerStats({ ...this.stats });

    if (this.stats.hp <= 0) {
      if (this.stats.knockoutCount < 2) {
        // Enter Unconscious state!
        this.stats.isUnconscious = true;
        this.stats.knockoutCount += 1;
        this.setVelocity(0, 0);
        this.currentVx = 0;
        this.currentVy = 0;

        useGameStore.getState().setUnconscious(true);
        useGameStore.getState().setPlayerStats({ ...this.stats });

        soundEngine.playPlayerHurt();
        return false; // Not definitively dead yet
      } else {
        // 3rd knock down -> Definitive Death!
        this.stats.isDefinitivelyDead = true;
        useGameStore.getState().setDefinitivelyDead(true);
        useGameStore.getState().setPlayerStats({ ...this.stats });
        soundEngine.playPlayerHurt();
        return true; // Definitive Death triggered!
      }
    }

    this.isInvulnerable = true;
    this.invulnerableTimer = 800; // 0.8s invulnerability frame
    soundEngine.playPlayerHurt();

    return false;
  }

  public heal(amount: number) {
    this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + amount);
  }

  public addMana(amount: number) {
    this.stats.mana = Math.min(this.stats.maxMana, this.stats.mana + amount);
  }

  public addXp(amount: number): boolean {
    this.stats.currentXp += amount;
    this.stats.souls += Math.floor(amount / 2);
    if (this.stats.currentXp >= this.stats.nextLevelXp) {
      this.stats.level += 1;
      this.stats.currentXp -= this.stats.nextLevelXp;
      this.stats.nextLevelXp = Math.floor(this.stats.nextLevelXp * 1.4);
      this.stats.pendingStatPoints = (this.stats.pendingStatPoints || 0) + 1;
      soundEngine.playLevelUp();
      return true; // Triggered level up!
    }
    return false;
  }

  /** Move a value toward target by at most maxDelta (for acceleration) */
  private moveToward(current: number, target: number, maxDelta: number): number {
    const diff = target - current;
    if (Math.abs(diff) <= maxDelta) return target;
    return current + Math.sign(diff) * maxDelta;
  }

  public equipLoot(item: LootItem) {
    this.equippedLoot.push(item);

    // Onboarding trigger
    useGameStore.getState().triggerOnboardingEvent('firstEquipDone', 'DICA: Abra seu Inventário (I) para gerenciar e comparar equipamentos!');
    
    if (item.stats.maxHpBonus) {
      this.stats.maxHp += item.stats.maxHpBonus;
      this.stats.hp += item.stats.maxHpBonus; // Heal by bonus amount
    }
    if (item.stats.speedBonus) {
      this.stats.moveSpeed += item.stats.speedBonus;
    }
    if (item.stats.damageMultiplier) {
      this.stats.damageMultiplier += item.stats.damageMultiplier;
    }
    if (item.stats.lifestealBonus) {
      this.stats.vampirism += item.stats.lifestealBonus;
    }

    soundEngine.playEquipLoot(); // Play sound for loot
    
    // Notify React UI
    window.dispatchEvent(new CustomEvent('loot-acquired', { detail: item }));
  }
}
