import Phaser from 'phaser';
import { PlayerStats, SpellConfig } from '../../types/game';
import spellsData from '../../data/spells.json';
import { soundEngine } from '../../utils/soundEngine';

export class Player extends Phaser.Physics.Arcade.Sprite {
  public stats: PlayerStats;
  private moveVector: Phaser.Math.Vector2 = new Phaser.Math.Vector2(0, 0);
  private aimVector: Phaser.Math.Vector2 = new Phaser.Math.Vector2(1, 0);
  private lastAutoShootTime: number = 0;
  private skillCooldowns: Record<string, number> = {};
  public isInvulnerable: boolean = false;
  private invulnerableTimer: number = 0;
  public light?: Phaser.GameObjects.Light;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'spr_bloodmage');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setSize(20, 24);
    this.setOffset(6, 20);

    // Set lighting pipeline
    this.setLighting(true);

    // Create a dynamic light centered on the Player
    this.light = scene.lights.addLight(x, y, 180, 0xff3344, 1.2);

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
      unlockedSpells: ['blood_bolt', 'hellfire_nova', 'syphon_soul', 'bone_shield'],
    };

    // Init skill cooldowns
    Object.keys(typedSpellsData).forEach((id) => {
      this.skillCooldowns[id] = 0;
    });
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
    // Movement Physics
    const speed = this.stats.moveSpeed;
    this.setVelocity(this.moveVector.x * speed, this.moveVector.y * speed);

    // Update player light position
    if (this.light) {
      this.light.x = this.x;
      this.light.y = this.y;
    }

    // Flip sprite based on move or aim direction
    if (this.aimVector.x !== 0) {
      this.setFlipX(this.aimVector.x < 0);
    } else if (this.moveVector.x !== 0) {
      this.setFlipX(this.moveVector.x < 0);
    }

    // Mana Regeneration (+4 MP/sec)
    if (this.stats.mana < this.stats.maxMana) {
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

  public castBloodBolt(time: number): boolean {
    const spell = (spellsData as Record<string, SpellConfig>)['blood_bolt'];
    if (this.stats.mana < spell.manaCost) return false;

    this.stats.mana -= spell.manaCost;
    this.lastAutoShootTime = time;
    soundEngine.playBloodBolt();
    return true;
  }

  public castNova(): boolean {
    const spell = (spellsData as Record<string, SpellConfig>)['hellfire_nova'];
    if (this.getCooldownRemaining('hellfire_nova') > 0) return false;
    if (this.stats.mana < spell.manaCost) return false;

    this.stats.mana -= spell.manaCost;
    const cd = spell.cooldownMs * (1 - this.stats.cooldownReduction);
    this.skillCooldowns['hellfire_nova'] = cd;
    soundEngine.playNova();
    return true;
  }

  public castSyphon(): boolean {
    const spell = (spellsData as Record<string, SpellConfig>)['syphon_soul'];
    if (this.getCooldownRemaining('syphon_soul') > 0) return false;
    if (this.stats.mana < spell.manaCost) return false;

    this.stats.mana -= spell.manaCost;
    const cd = spell.cooldownMs * (1 - this.stats.cooldownReduction);
    this.skillCooldowns['syphon_soul'] = cd;
    soundEngine.playOrbPickup();
    return true;
  }

  public castBoneShield(): boolean {
    const spell = (spellsData as Record<string, SpellConfig>)['bone_shield'];
    if (this.getCooldownRemaining('bone_shield') > 0) return false;
    if (this.stats.mana < spell.manaCost) return false;

    this.stats.mana -= spell.manaCost;
    const cd = spell.cooldownMs * (1 - this.stats.cooldownReduction);
    this.skillCooldowns['bone_shield'] = cd;
    soundEngine.playButtonClick();
    return true;
  }

  public takeDamage(amount: number): boolean {
    if (this.isInvulnerable) return false;

    this.stats.hp = Math.max(0, this.stats.hp - amount);
    this.isInvulnerable = true;
    this.invulnerableTimer = 800; // 0.8s invulnerability frame
    soundEngine.playDemonRoar();

    return this.stats.hp <= 0;
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
      this.stats.hp = this.stats.maxHp; // Full heal on level up
      this.stats.mana = this.stats.maxMana;
      soundEngine.playLevelUp();
      return true; // Triggered level up!
    }
    return false;
  }

  public destroy(fromScene?: boolean) {
    if (this.light) {
      this.scene.lights.removeLight(this.light);
      this.light = undefined;
    }
    super.destroy(fromScene);
  }
}
