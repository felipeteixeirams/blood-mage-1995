import Phaser from 'phaser';
import { PlayerStats, SpellConfig, LootItem } from '../../types/game';
import spellsData from '../../data/spells.json';
import { soundEngine } from '../../utils/soundEngine';
import { useGameStore } from '../../store/gameStore';

export class Player extends Phaser.Physics.Arcade.Sprite {
  public stats: PlayerStats;
  private moveVector: Phaser.Math.Vector2 = new Phaser.Math.Vector2(0, 0);
  private aimVector: Phaser.Math.Vector2 = new Phaser.Math.Vector2(1, 0);
  private lastAutoShootTime: number = 0;
  private skillCooldowns: Record<string, number> = {};
  public isInvulnerable: boolean = false;
  private invulnerableTimer: number = 0;
  public equippedLoot: LootItem[] = [];

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
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setSize(20, 24);
    this.setOffset(6, 20);

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
      isUnconscious: false,
      knockoutCount: 0,
      isDefinitivelyDead: false,
      statusConditions: { bleeding: false, poison: false, infection: false },
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
      { id: "corrupted", color: "#a855f7" },
      { id: "golden", color: "#facc15" },
      { id: "shadow", color: "#1e1b4b" }
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
    this.moveVector.set(x, y);
    if (this.moveVector.length() > 1) {
      this.moveVector.normalize();
    }
  }

  public setAimInput(x: number, y: number) {
    if (x !== 0 || y !== 0) {
      this.aimVector.set(x, y).normalize();
    }
  }

  public updatePlayer(time: number, delta: number) {
    if (this.stats.isUnconscious) {
      // Regenerate passive HP during unconsciousness:
      // Regenerate 2% of maxHp per second, until we reach exactly 5% of maxHp.
      const regenAmount = (this.stats.maxHp * 0.02 * delta) / 1000;
      this.stats.hp = Math.min(this.stats.maxHp * 0.05, this.stats.hp + regenAmount);

      this.setVelocity(0, 0);
      this.setAlpha(0.5); // visual cue for unconsciousness

      if (this.stats.hp >= this.stats.maxHp * 0.05) {
        this.stats.isUnconscious = false;
        this.stats.hp = Math.floor(this.stats.maxHp * 0.05);
        this.isInvulnerable = true;
        this.invulnerableTimer = 2000; // 2 seconds invul frames upon waking up
        this.setAlpha(1.0);
        soundEngine.playLevelUp(); // play wake up audio cue!

        useGameStore.getState().setPlayerStats({ ...this.stats });
      }
      return;
    }

    // Process Status Conditions (Survival)
    if (this.stats.statusConditions) {
      const conds = this.stats.statusConditions;
      const isMoving = this.currentVx !== 0 || this.currentVy !== 0;

      // 1. Bleeding (Sangramento): drena HP a cada passo (quando se move)
      if (conds.bleeding && isMoving) {
        this.stats.hp = Math.max(1, this.stats.hp - (2.5 * delta) / 1000); // 2.5 HP/s
      }

      // 2. Poison (Envenenamento): drena HP constantemente
      if (conds.poison) {
        this.stats.hp = Math.max(1, this.stats.hp - (1.2 * delta) / 1000); // 1.2 HP/s
      }
    }

    // Cooldown timers
    if (this.dashCooldownTimer > 0) {
      this.dashCooldownTimer -= delta;
    }

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
      const speed = this.stats.moveSpeed;
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

    // Flip sprite based on move or aim direction
    if (this.aimVector.x !== 0) {
      this.setFlipX(this.aimVector.x < 0);
    } else if (this.moveVector.x !== 0) {
      this.setFlipX(this.moveVector.x < 0);
    }

    // Mana Regeneration (+4 MP/sec) — blocked if infected
    const isInfected = this.stats.statusConditions?.infection || false;
    if (!isInfected && this.stats.mana < this.stats.maxMana) {
      this.stats.mana = Math.min(this.stats.maxMana, this.stats.mana + (4 * delta) / 1000);
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

    // Auto Shoot Primary (Blood Bolt) if aiming
    const bloodBoltConfig = (spellsData as Record<string, SpellConfig>)['blood_bolt'];
    const autoCd = bloodBoltConfig.cooldownMs * (1 - this.stats.cooldownReduction);
    if (time > this.lastAutoShootTime + autoCd) {
      this.castBloodBolt(time);
    }
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

  public takeDamage(amount: number): boolean {
    if (this.isInvulnerable || this.stats.isUnconscious || this.stats.isDefinitivelyDead) return false;

    this.stats.hp = Math.max(0, this.stats.hp - amount);
    this.isInvulnerable = true;
    this.invulnerableTimer = 800; // 0.8s invulnerability frame
    soundEngine.playPlayerHurt();

    if (this.stats.hp <= 0) {
      this.stats.knockoutCount = (this.stats.knockoutCount || 0) + 1;
      if (this.stats.knockoutCount < 3) {
        this.stats.isUnconscious = true;
        this.stats.hp = 0;
        this.setVelocity(0, 0);
        this.currentVx = 0;
        this.currentVy = 0;
        this.isDashing = false;
        // invulnerable during unconsciousness
        this.isInvulnerable = true;
        this.invulnerableTimer = 9999999; // indefinitely until revived

        // Notify useGameStore
        useGameStore.getState().setPlayerStats({ ...this.stats });
        return false; // not definitively dead yet!
      } else {
        this.stats.isDefinitivelyDead = true;
        useGameStore.getState().setPlayerStats({ ...this.stats });
        return true; // Is definitively dead!
      }
    }

    useGameStore.getState().setPlayerStats({ ...this.stats });
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
