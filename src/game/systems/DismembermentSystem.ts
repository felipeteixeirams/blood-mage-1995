import Phaser from 'phaser';
import { MonsterConfig, SpellConfig, DismembermentResult, DismembermentType } from '../../types/game';
import spellsData from '../../data/spells.json';
import { soundEngine } from '../../utils/soundEngine';
import { CombatFeel } from './CombatFeel';

const typedSpellsData = spellsData as Record<string, SpellConfig>;

export interface DismembermentCalcParams {
  monsterConfig: MonsterConfig;
  damageAmount: number;
  enemyMaxHp: number;
  enemyCurrentHp: number;
  isCrit?: boolean;
  isExecution?: boolean;
  killerSpellId?: string;
  playerLevel?: number;
  spellLevel?: number;
}

export class DismembermentSystem {
  /**
   * Calculates the 3-Factor dismemberment outcome:
   * Factor 1: Monster class & body fragility (e.g. fragile flesh/bone vs dense golem/boss)
   * Factor 2: Spell kinetic & explosive destructive power (gibPower)
   * Factor 3: Overkill ratio, critical strike bonus, and level difference
   */
  public static calculateDismemberment(params: DismembermentCalcParams): DismembermentResult {
    const {
      monsterConfig,
      damageAmount,
      enemyMaxHp,
      enemyCurrentHp,
      isCrit = false,
      isExecution = false,
      killerSpellId,
      playerLevel = 1,
      spellLevel = 1,
    } = params;

    // Factor 1: Monster Fragility (0.0 to 1.0)
    const fragility = monsterConfig.fragility ?? this.getFallbackFragility(monsterConfig.id, monsterConfig.goreEffect);

    // Factor 2: Spell Destruction Power (0.2 to 2.5)
    const spellConfig = killerSpellId ? typedSpellsData[killerSpellId] : undefined;
    const baseSpellGibPower = spellConfig?.gibPower ?? (killerSpellId === 'crimson_scythe' ? 2.5 : 1.0);
    const spellLevelMultiplier = 1 + (spellLevel - 1) * 0.08;
    const effectiveSpellGib = baseSpellGibPower * spellLevelMultiplier;

    // Factor 3: Overkill Ratio & Combat Dynamics
    const overkill = Math.max(0, damageAmount - Math.max(0, enemyCurrentHp));
    const overkillRatio = enemyMaxHp > 0 ? overkill / enemyMaxHp : 0;
    const levelBonus = Math.max(-0.2, Math.min(0.3, (playerLevel - 1) * 0.04));

    // Composite Gib Score Formula
    // Base formula blends fragility (35%), spell power (30%), overkill intensity (35%)
    let gibScore =
      fragility * 0.35 +
      (effectiveSpellGib / 2.0) * 0.30 +
      Math.min(overkillRatio * 1.5, 1.0) * 0.35 +
      levelBonus;

    if (isCrit) {
      gibScore += 0.20; // Critical strikes significantly rupture structural tissue
    }

    if (isExecution) {
      gibScore += 0.60; // Direct sacrificial executions shatter targets
    }

    // Bosses and dense golems have high structural resistance unless heavily overkilled
    if (monsterConfig.bodyType === 'boss') {
      gibScore *= 0.40;
    } else if (monsterConfig.bodyType === 'dense_abomination') {
      gibScore *= 0.70;
    }

    let type: DismembermentType;
    if (gibScore >= 0.72 || isExecution) {
      type = 'total_destruction';
    } else if (gibScore >= 0.35) {
      type = 'partial_dismemberment';
    } else {
      type = 'normal_collapse';
    }

    return {
      type,
      gibScore: Number(gibScore.toFixed(3)),
      fragility,
      spellGibMultiplier: Number(effectiveSpellGib.toFixed(2)),
      overkillRatio: Number(overkillRatio.toFixed(2)),
      isCrit,
      isExecution,
    };
  }

  /**
   * Spawns physical gibs, blood spray, floor stains, and audio/haptic cues
   * based on the 3-Factor dismemberment outcome.
   */
  public static executeDismemberment(
    scene: Phaser.Scene,
    enemy: {
      x: number;
      y: number;
      texture: { key: string };
      scaleX: number;
      scaleY: number;
      config: MonsterConfig;
      bloodEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;
    },
    result: DismembermentResult,
    killerSpellId?: string
  ): void {
    if (!scene || !scene.add) return;

    const { x, y, texture, scaleX, scaleY, config, bloodEmitter } = enemy;
    const isBoss = config.bodyType === 'boss' || config.behavior === 'boss';

    if (result.type === 'total_destruction') {
      // 1. Audio & Haptics
      soundEngine.playExecutionGore();
      CombatFeel.triggerHitStop(scene, 100);
      CombatFeel.triggerVibration('execution');

      // 2. High-volume blood particles
      if (bloodEmitter && bloodEmitter.active) {
        bloodEmitter.emitParticleAt(x, y, 32);
      }

      // 3. Massive floor blood pool decal
      const poolKey = config.goreEffect === 'bone_dust' ? 'particle_bone_dust' : 'blood_pool_stain';
      const poolScale = (config.executionBloodScale || 2.5) * (isBoss ? 1.4 : 1.1);
      this.spawnFloorDecal(scene, x, y, poolKey, poolScale, 0.9, 12000);

      // 4. Fragment slice physics (4-6 quadrant chunks bursting outwards)
      const fragmentCount = Math.max(4, config.executionFragments || 5);
      const impulseBase = config.executionImpulse || 180;

      for (let i = 0; i < fragmentCount; i++) {
        const angle = (i / fragmentCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.6;
        const speed = impulseBase * (0.7 + Math.random() * 0.7);
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed - 60; // Upward initial trajectory

        this.spawnPhysicalGibPiece(
          scene,
          x + (Math.random() - 0.5) * 12,
          y + (Math.random() - 0.5) * 12,
          texture.key,
          scaleX * 0.45,
          vx,
          vy,
          (Math.random() - 0.5) * 16,
          config.goreEffect === 'bone_dust' ? 0xdcd3c1 : 0x880000
        );
      }
    } else if (result.type === 'partial_dismemberment') {
      // 1. Audio
      soundEngine.playBloodSquish();
      CombatFeel.triggerVibration('execution');

      // 2. Moderate blood particles
      if (bloodEmitter && bloodEmitter.active) {
        bloodEmitter.emitParticleAt(x, y, 16);
      }

      // 3. Medium floor blood pool
      const poolKey = config.goreEffect === 'bone_dust' ? 'particle_bone_dust' : 'blood_pool_stain';
      this.spawnFloorDecal(scene, x, y, poolKey, (config.executionBloodScale || 1.8) * 0.8, 0.85, 10000);

      // 4. Severed head / limb piece flying off
      const severAngle = Math.random() * Math.PI * 2;
      const speed = 120 + Math.random() * 70;
      this.spawnPhysicalGibPiece(
        scene,
        x,
        y - 10,
        texture.key,
        scaleX * 0.4,
        Math.cos(severAngle) * speed,
        Math.sin(severAngle) * speed - 40,
        (Math.random() - 0.5) * 12,
        config.goreEffect === 'bone_dust' ? 0xdcd3c1 : 0xaa1111
      );

      // 5. Mutilated fallen corpse decal on floor
      this.spawnMutilatedCorpseDecal(scene, x, y, texture.key, scaleX, scaleY);
    } else {
      // Normal Collapse
      soundEngine.playBloodSquish();

      // Light blood particles
      if (bloodEmitter && bloodEmitter.active) {
        bloodEmitter.emitParticleAt(x, y, 8);
      }

      // Standard small blood pool
      const poolKey = config.goreEffect === 'bone_dust' ? 'particle_bone_dust' : 'blood_pool_stain';
      this.spawnFloorDecal(scene, x, y, poolKey, 0.75, 0.75, 8000);

      // Standard intact corpse decal
      this.spawnIntactCorpseDecal(scene, x, y, texture.key, scaleX, scaleY);
    }
  }

  /**
   * Spawns a physical flying gib piece that travels in an arc, rotates, and settles.
   */
  private static spawnPhysicalGibPiece(
    scene: Phaser.Scene,
    x: number,
    y: number,
    textureKey: string,
    scale: number,
    initialVx: number,
    initialVy: number,
    angularVel: number,
    tint?: number
  ): void {
    if (!scene || !scene.add) return;

    const gib = scene.add.image(x, y, textureKey);
    gib.setScale(scale);
    gib.setDepth(3); // Above floor, below active actors
    if (tint !== undefined) {
      gib.setTint(tint);
    }

    let vx = initialVx;
    let vy = initialVy;
    let currX = x;
    let currY = y;
    let rotation = Math.random() * Math.PI * 2;
    const gravity = 280; // 2.5D top-down arc descent

    const lifetimeMs = 350 + Math.random() * 200;
    const startTime = scene.time ? scene.time.now : Date.now();

    const updateGib = () => {
      if (!gib || !gib.active || !scene) return;

      const elapsed = (scene.time ? scene.time.now : Date.now()) - startTime;
      const dt = 0.016; // ~60fps step

      if (elapsed < lifetimeMs) {
        vy += gravity * dt;
        vx *= 0.94; // Air friction
        vy *= 0.94;

        currX += vx * dt;
        currY += vy * dt;
        rotation += angularVel * dt;

        gib.setPosition(currX, currY);
        gib.setRotation(rotation);

        if (scene.time && scene.time.delayedCall) {
          scene.time.delayedCall(16, updateGib);
        }
      } else {
        // Settled on floor — fade out smoothly after delay
        if (scene.tweens) {
          scene.tweens.add({
            targets: gib,
            alpha: 0,
            delay: 4000 + Math.random() * 2000,
            duration: 1500,
            onComplete: () => {
              if (gib && gib.active) gib.destroy();
            },
          });
        }
      }
    };

    updateGib();
  }

  /**
   * Spawns a floor decal (blood pool or bone dust) that persists cleanly and fades out.
   */
  private static spawnFloorDecal(
    scene: Phaser.Scene,
    x: number,
    y: number,
    key: string,
    scale: number,
    alpha: number,
    persistMs: number
  ): void {
    if (!scene || !scene.add) return;

    const decal = scene.add.image(x, y + 4, key);
    decal.setDepth(1); // Floor layer
    decal.setScale(scale);
    decal.setAlpha(alpha);
    decal.setRotation(Math.random() * Math.PI * 2);

    if (scene.tweens) {
      scene.tweens.add({
        targets: decal,
        alpha: 0,
        delay: persistMs,
        duration: 2000,
        onComplete: () => {
          if (decal && decal.active) decal.destroy();
        },
      });
    }
  }

  /**
   * Spawns a mutilated/severed fallen corpse decal.
   */
  private static spawnMutilatedCorpseDecal(
    scene: Phaser.Scene,
    x: number,
    y: number,
    textureKey: string,
    scaleX: number,
    scaleY: number
  ): void {
    if (!scene || !scene.add) return;

    const corpse = scene.add.image(x, y + 6, textureKey);
    corpse.setDepth(2);
    corpse.setScale(scaleX * 0.9, scaleY * 0.7);
    corpse.setAngle(90 + (Math.random() - 0.5) * 30);
    corpse.setTint(0x551111); // Dark coagulated gore tint
    corpse.setAlpha(0.85);

    if (scene.tweens) {
      scene.tweens.add({
        targets: corpse,
        alpha: 0,
        delay: 7000,
        duration: 1800,
        onComplete: () => {
          if (corpse && corpse.active) corpse.destroy();
        },
      });
    }
  }

  /**
   * Spawns a standard intact corpse decal.
   */
  private static spawnIntactCorpseDecal(
    scene: Phaser.Scene,
    x: number,
    y: number,
    textureKey: string,
    scaleX: number,
    scaleY: number
  ): void {
    if (!scene || !scene.add) return;

    const corpse = scene.add.image(x, y + 6, textureKey);
    corpse.setDepth(2);
    corpse.setScale(scaleX, scaleY);
    corpse.setAngle(90);
    corpse.setTint(0x444444);
    corpse.setAlpha(0.7);

    if (scene.tweens) {
      scene.tweens.add({
        targets: corpse,
        alpha: 0,
        delay: 6000,
        duration: 1500,
        onComplete: () => {
          if (corpse && corpse.active) corpse.destroy();
        },
      });
    }
  }

  private static getFallbackFragility(monsterId: string, goreEffect: string): number {
    if (monsterId.includes('skeleton')) return 0.90;
    if (monsterId.includes('bat')) return 0.95;
    if (monsterId.includes('zombie')) return 0.85;
    if (monsterId.includes('cultist')) return 0.70;
    if (monsterId.includes('hound') || monsterId.includes('werewolf')) return 0.55;
    if (monsterId.includes('specter')) return 0.60;
    if (monsterId.includes('vampire')) return 0.45;
    if (monsterId.includes('abomination')) return 0.35;
    if (monsterId.includes('golem')) return 0.20;
    if (monsterId.includes('boss')) return 0.10;
    return goreEffect === 'bone_dust' ? 0.90 : 0.60;
  }
}
