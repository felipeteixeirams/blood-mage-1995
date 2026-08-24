import Phaser from 'phaser';
import { GameScene } from '../scenes/GameScene';
import { Enemy } from '../objects/Enemy';
import { LootSprite } from '../objects/Loot';
import { LootSystem } from './LootSystem';
import { DismembermentSystem } from './DismembermentSystem';
import { CombatFeel } from './CombatFeel';
import { ContractSystem } from './ContractSystem';
import { soundEngine } from '../../utils/soundEngine';
import HapticFeedback from '../../utils/haptics';
import { useGameStore } from '../../store/gameStore';
import upgradesData from '../../data/upgrades.json';
import { UpgradeOption } from '../../types/game';

/**
 * Feedback de combate (texto flutuante, slash, borrifo de sangue, combo kill),
 * morte de inimigo (gore/dismemberment/loot/XP) e transições de level-up/game
 * over. Extraído de GameScene.ts (item 1 do roadmap de refatoração — bloco
 * final de métodos ainda inline após a extração de PlayerSkillSystem,
 * CollisionHandlers e DungeonFlowController). Mantido como uma única classe
 * porque handleEnemyDeath depende diretamente de quase todos os outros
 * métodos aqui (registerKillCombo, spawnFloatingText, triggerLevelUp).
 */
export class CombatEffectsSystem {
  constructor(private scene: GameScene) {}

  spawnProceduralGore(enemy: Enemy) {
    const scene = this.scene;
    const numFrags = enemy.config.executionFragments || 3;
    const impulse = enemy.config.executionImpulse || 180;
    const bloodScale = enemy.config.executionBloodScale || 3.0;

    const w = enemy.width;
    const h = enemy.height;
    const stripHeight = h / numFrags;

    CombatFeel.triggerHitStop(scene, 140);
    CombatFeel.triggerVibration('execution');
    soundEngine.playExecutionGore();

    if (scene.bloodEmitter) {
      scene.bloodEmitter.emitParticleAt(enemy.x, enemy.y, 25 * bloodScale);
    }

    for (let i = 0; i < numFrags; i++) {
      const cropX = 0;
      const cropY = i * stripHeight;
      const cropW = w;
      const cropH = stripHeight;

      const fragX = enemy.x;
      const fragY = enemy.y - (h / 2) + (i * stripHeight) + (stripHeight / 2);

      const frag = scene.physics.add.image(fragX, fragY, enemy.texture.key);
      frag.setCrop(cropX, cropY, cropW, cropH);
      frag.setScale(enemy.scaleX, enemy.scaleY);
      if (enemy.isTinted) {
        frag.setTint(enemy.tintTopLeft);
      }

      const body = frag.body as Phaser.Physics.Arcade.Body;
      if (body) {
        body.setGravityY(400);
        body.setCollideWorldBounds(true);

        const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.5;
        const speed = impulse * (0.8 + Math.random() * 0.4);
        body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
        body.setAngularVelocity(Phaser.Math.Between(-300, 300));
      }

      scene.tweens.add({
        targets: frag,
        alpha: 0,
        duration: 1000 + Math.random() * 500,
        onComplete: () => frag.destroy()
      });
    }
  }

  handleEnemyDeath(enemy: Enemy, killerSpellId?: string, wasLowHp: boolean = false) {
    const scene = this.scene;

    // 1. Stats
    scene.player.stats.kills++;
    scene.player.stats.score += enemy.config.scoreValue;
    scene.floorMonstersKilled++;
    this.registerKillCombo(enemy.x, enemy.y);
    ContractSystem.onEnemyKilled(enemy, scene);
    useGameStore.getState().onEnemyKilled(enemy.config.id);

    // Fase 5: Advanced Visual Effect on kill
    if (scene.advancedParticles) {
      scene.advancedParticles.emit({
        type: 'spectral_burst',
        x: enemy.x,
        y: enemy.y,
        intensity: 1.0, // Kill = intensidade máxima
      });
    }
    if (scene.screenShake) {
      scene.screenShake.light(); // Leve shake na vitória
    }
    if (scene.lightingPolish) {
      scene.lightingPolish.addDeathGlow(enemy.x, enemy.y);
    }

    // Fase 5: Achievement Wiring - Kill-based achievements
    if (scene.achievements) {
      const ach = scene.achievements.unlock('first_blood'); // Sempre desbloqueado no 1º kill
      if (ach && scene.achievementNotification) {
        scene.achievementNotification.show({
          name: ach.name,
          description: ach.description,
          icon: '🩸',
          rewards: {
            bloodCrystals: ach.reward?.bloodCrystals,
            talentPoints: ach.reward?.talentPoints,
          },
          rarity: 'rare',
        });
      }

      if (scene.player.stats.kills >= 10) {
        const achKills = scene.achievements.unlock('slayer_10');
        if (achKills && scene.achievementNotification) {
          scene.achievementNotification.show({
            name: achKills.name,
            description: achKills.description,
            icon: '⚔️',
            rewards: {
              bloodCrystals: achKills.reward?.bloodCrystals,
              talentPoints: achKills.reward?.talentPoints,
            },
            rarity: 'epic',
          });
        }
      }

      if (scene.player.stats.kills >= 50) {
        const achSlayer = scene.achievements.unlock('slayer_50');
        if (achSlayer && scene.achievementNotification) {
          scene.achievementNotification.show({
            name: achSlayer.name,
            description: achSlayer.description,
            icon: '💀',
            rewards: {
              bloodCrystals: achSlayer.reward?.bloodCrystals,
              talentPoints: achSlayer.reward?.talentPoints,
            },
            rarity: 'legendary',
          });
        }
      }
    }

    // Onboarding trigger
    useGameStore.getState().triggerOnboardingEvent('firstKillDone', 'DICA: Colete o loot no chão antes de continuar!');

    // 2. Gore Effect: Blood Stain on Floor
    const isAbomination = enemy.config.id === 'gore_abomination';
    const isZombie = enemy.config.id === 'zombie_shambler';

    const stainScale = isAbomination ? 2.5 : 1.0;
    const stain = scene.add.image(enemy.x, enemy.y, 'blood_pool_stain').setDepth(2).setScale(stainScale);
    stain.setRotation(Math.random() * Math.PI);
    stain.setAlpha(0.85);
    scene.bloodStainsGroup.add(stain);
    scene.reflectionSystem?.addLiquidZone({
      x: enemy.x,
      y: enemy.y,
      radius: 28 * stainScale,
      type: 'blood'
    });
    // Fade out blood stain slowly over ~60 seconds (living ecosystem)
    scene.tweens.add({
      targets: stain,
      alpha: 0,
      delay: 45000,
      duration: 15000,
      onComplete: () => { scene.bloodStainsGroup.remove(stain, true, true); },
    });

    // Persistent Monster Corpse — sprite lying on the floor for environmental storytelling
    const corpseDecal = scene.add.image(enemy.x, enemy.y, enemy.texture.key)
      .setDepth(3)
      .setScale(enemy.scaleX * 1.1, enemy.scaleY * 0.55) // flattened/squashed = lying down
      .setTint(isAbomination ? 0x1a4a1a : 0x3a0a0a)       // dark tint: dead flesh
      .setAlpha(0.9)
      .setRotation(Math.random() < 0.5 ? Math.PI / 2 : -Math.PI / 2); // fallen sideways
    scene.bloodStainsGroup.add(corpseDecal);
    // Corpse also fades out slowly after ~90 seconds
    scene.tweens.add({
      targets: corpseDecal,
      alpha: 0,
      delay: 75000,
      duration: 20000,
      onComplete: () => { scene.bloodStainsGroup.remove(corpseDecal, true, true); },
    });

    // Gore Abomination Explosion Effect
    if (isAbomination) {
      soundEngine.playGoreExplosion();
      scene.cameras.main.shake(220, 0.018);

      const expRing = scene.add.circle(enemy.x, enemy.y, 15, 0x22c55e, 0.85).setDepth(1700);
      scene.tweens.add({
        targets: expRing,
        radius: 110,
        alpha: 0,
        duration: 400,
        onComplete: () => expRing.destroy(),
      });

      // Area damage to player
      const distToPlayer = Phaser.Math.Distance.Between(enemy.x, enemy.y, scene.player.x, scene.player.y);
      if (distToPlayer <= 110) {
        scene.playerHitByEnemy(28);
        scene.spawnFloatingText(scene.player.x, scene.player.y - 15, 'EXPLOSÃO TÓXICA!', '#22c55e', true);
      }
    }

    // Zombie Shambler Death Spawns Bat Swarm
    if (isZombie) {
      for (let b = 0; b < 2; b++) {
        const batX = enemy.x + (Math.random() - 0.5) * 30;
        const batY = enemy.y + (Math.random() - 0.5) * 30;
        const bat = new Enemy(scene, batX, batY, 'bat_swarm');
        bat.alertToCombat();
        scene.enemiesGroup.add(bat);
      }
      scene.spawnFloatingText(enemy.x, enemy.y - 12, 'MORCEGOS LIBERTADOS!', '#a855f7', false);
    }

    // 3. Dismemberment & Gore Execution (3-factor system)
    const isSacrificial = ['crimson_scythe', 'hellfire_nova', 'blood_ritual_circle', 'hemomancy_beam'].includes(killerSpellId || '');
    const isExecution = isSacrificial && wasLowHp;

    const dismemberResult = DismembermentSystem.calculateDismemberment({
      monsterConfig: enemy.config,
      damageAmount: enemy.maxHp * 0.9,
      enemyMaxHp: enemy.maxHp,
      enemyCurrentHp: 0,
      isCrit: wasLowHp,
      isExecution,
      killerSpellId,
      playerLevel: scene.player.stats.level,
    });

    DismembermentSystem.executeDismemberment(
      scene,
      {
        x: enemy.x,
        y: enemy.y,
        texture: enemy.texture,
        scaleX: enemy.scaleX,
        scaleY: enemy.scaleY,
        config: enemy.config,
        bloodEmitter: scene.bloodEmitter,
      },
      dismemberResult,
      killerSpellId
    );

    if (isExecution || dismemberResult.type === 'total_destruction') {
      ContractSystem.onExecutionDone(scene);
    }

    // 4. Grant XP directly to player (no gems to collect)
    const hasFuryPit = useGameStore.getState().activeModifiers.includes('fury_pit');
    const xpDrop = hasFuryPit ? Math.round(enemy.config.xpDrop * 1.5) : enemy.config.xpDrop;
    const leveledUp = scene.player.addXp(xpDrop);
    scene.spawnFloatingText(enemy.x, enemy.y - 30, `+${xpDrop} XP`, '#3b82f6', false);
    if (leveledUp) {
      this.triggerLevelUp();
    }

    // 5. Check Loot Drop & Elite Rewards
    if (enemy.eliteAffix && enemy.eliteAffix !== 'none') {
      const bonusCrystals = 4 + Math.floor(Math.random() * 4);
      useGameStore.getState().addBloodCrystals(bonusCrystals);
      const affixNames: Record<string, string> = {
        frenzied: '⚡ FRENÉTICO',
        vampiric: '🩸 VAMPÍRICO',
        cursed: '💀 AMALDIÇOADO',
        spectral: '👻 ETÉREO'
      };
      const title = affixNames[enemy.eliteAffix] || 'ELITE';
      scene.spawnFloatingText(enemy.x, enemy.y - 45, `+${bonusCrystals} CRISTAIS ${title}! 💎`, '#facc15', true);
      soundEngine.playOrbPickup();
    }

    const hasBloodTide = useGameStore.getState().activeModifiers.includes('blood_tide');
    const rolled = hasBloodTide ? (Math.random() < 0.325) : LootSystem.rollLootChance();
    if (rolled) {
      const lootData = LootSystem.generateLoot(scene.currentFloorDepth);
      const loot = new LootSprite(scene, enemy.x + (Math.random() - 0.5) * 30, enemy.y + (Math.random() - 0.5) * 30, lootData);
      scene.lootGroup.add(loot);
      scene.lightingPolish?.addItemGlow(loot, lootData.rarity);
    }

    enemy.destroy();

    // Fill screen up to cap if more are waiting
    scene.checkAndSpawnPendingEnemies();

    // Check if Floor Cleared -> Reveal Portal
    if (scene.enemiesGroup.countActive() === 0 && scene.pendingEnemySpawns.length === 0 && !scene.isPortalActive) {
      scene.revealDescentPortal(enemy.x, enemy.y);
    }
  }

  triggerLevelUp() {
    const scene = this.scene;
    // Onboarding trigger
    useGameStore.getState().triggerOnboardingEvent('firstLevelUpDone', 'DICA: Toque na Árvore de Talentos (T) para evoluir permanente!');

    // Haptic feedback on level up (two long pulses)
    CombatFeel.triggerVibration('level_up');
    scene.lightingPolish?.addLevelUpGlow(scene.player.x, scene.player.y);

    // Just store pending data — player distributes later via talent tree (T key)
    if (scene.callbacks?.onLevelUp) {
      const shuffled = [...upgradesData].sort(() => 0.5 - Math.random());
      const selectedOptions = shuffled.slice(0, 3) as UpgradeOption[];
      scene.callbacks.onLevelUp(scene.player.stats.level, selectedOptions);
    }
  }

  triggerGameOver() {
    const scene = this.scene;
    scene.isPaused = true;
    scene.physics.pause();
    soundEngine.stopBGM();
    scene.lightingPolish?.addDeathGlow(scene.player.x, scene.player.y);

    // Fase 5: Haptic Feedback on death
    HapticFeedback.playerDeath();

    // Fase 5: Advanced Visual Effect on death
    if (scene.postFX) {
      scene.postFX.effectDeath(); // Red tint + vignette + distortion (GPU)
    }
    if (scene.screenEffects) {
      scene.screenEffects.effectDeath(); // Red tint + vignette + distortion
    }
    if (scene.screenShake) {
      scene.screenShake.heavy(); // Shake pesado na morte
    }

    if (scene.callbacks?.onGameOver) {
      scene.callbacks.onGameOver({ ...scene.player.stats });
    }
  }

  /** Emit a short burst of blood particles at a position — used by enemy damage */
  spawnBloodBurst(x: number, y: number, count: number = 6) {
    const scene = this.scene;
    if (scene.bloodBurstEmitter?.active) {
      scene.bloodBurstEmitter.emitParticleAt(x, y, count);
    }
  }

  spawnFloatingText(x: number, y: number, text: string, color: string = '#f87171', isCrit: boolean = false) {
    const scene = this.scene;
    const highContrast = useGameStore.getState().settings.highContrastDamageTexts;
    const fontSize = highContrast
      ? (isCrit ? '22px' : '16px')
      : (isCrit ? '14px' : '11px');
    const strokeColor = '#000000';
    const strokeThickness = highContrast ? 6 : (isCrit ? 4 : 3);

    const jitterX = (Math.random() - 0.5) * 16;
    const txt = scene.add.text(x + jitterX, y - 10, text, {
      fontSize,
      fontFamily: '"Press Start 2P", monospace',
      color,
      stroke: strokeColor,
      strokeThickness,
    }).setOrigin(0.5).setDepth(2100);

    if (isCrit) {
      txt.setScale(1.35);
      scene.tweens.add({
        targets: txt,
        scaleX: 1.0,
        scaleY: 1.0,
        duration: 120,
        ease: 'Quad.easeOut',
      });
    }

    scene.tweens.add({
      targets: txt,
      y: y - (isCrit ? 40 : 28),
      alpha: 0,
      duration: isCrit ? 850 : 650,
      ease: 'Cubic.easeOut',
      onComplete: () => txt.destroy(),
    });
  }

  spawnMeleeSlashEffect(x: number, y: number, angle: number) {
    const scene = this.scene;
    const slash = scene.add.graphics({ x, y }).setDepth(2000);
    slash.lineStyle(3, 0xef4444, 0.95);
    slash.beginPath();
    slash.arc(0, 0, 20, angle - 0.75, angle + 0.75, false);
    slash.strokePath();

    scene.tweens.add({
      targets: slash,
      alpha: 0,
      scaleX: 1.45,
      scaleY: 1.45,
      duration: 150,
      ease: 'Quad.easeOut',
      onComplete: () => slash.destroy(),
    });
  }

  registerKillCombo(x: number, y: number) {
    const scene = this.scene;
    scene.comboKillCount++;

    if (scene.comboTimerEvent) {
      scene.comboTimerEvent.destroy();
    }

    scene.comboTimerEvent = scene.time.addEvent({
      delay: 2500,
      callback: () => {
        scene.comboKillCount = 0;
      },
    });

    if (scene.comboKillCount >= 3) {
      const isHighCombo = scene.comboKillCount >= 8;
      const comboLabel = `${scene.comboKillCount}x COMBO!`;
      const color = isHighCombo ? '#facc15' : '#ef4444';
      this.spawnFloatingText(x, y - 24, comboLabel, color, true);

      if (scene.comboKillCount === 3 || scene.comboKillCount === 5 || scene.comboKillCount === 8 || scene.comboKillCount === 12) {
        soundEngine.playNova();
        scene.cameras.main.shake(120, 0.008);
      }
    }
  }
}
