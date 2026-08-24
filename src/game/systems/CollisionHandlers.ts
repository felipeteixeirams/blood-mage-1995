import Phaser from 'phaser';
import { Enemy } from '../objects/Enemy';
import { Projectile } from '../objects/Projectile';
import { Collectible } from '../objects/Collectible';
import { LootSprite } from '../objects/Loot';
import { LootSystem } from './LootSystem';
import { soundEngine } from '../../utils/soundEngine';
import HapticFeedback from '../../utils/haptics';
import { useGameStore } from '../../store/gameStore';
import { ContractSystem } from './ContractSystem';
import { CombatFeel } from './CombatFeel';
import type { GameScene } from '../scenes/GameScene';

/**
 * Extraído de GameScene.ts (item 4 do roadmap de refatoração, continuação da
 * extração do PlayerSkillSystem). Concentra os handlers de colisão/hit:
 * projétil x parede, projétil x inimigo, jogador abrindo baú, dano ao
 * jogador (toque de inimigo, projétil inimigo), e coleta de orbs/loot.
 *
 * Extração MECÂNICA — mesmo comportamento de antes. Vários campos/métodos
 * de GameScene que eram `private` foram promovidos a `public` (rooms,
 * isScavenging, screenEffects, postFX, advancedParticles, screenShake,
 * currentFloorDepth, triggerGameOver, applyRelicOnHitEffects, lootGroup,
 * bloodStainsGroup) só para permitir este acesso entre classes — mudança de
 * visibilidade em tempo de compilação apenas, sem alteração de
 * comportamento em runtime. `triggerGroupAlert` foi movido junto (só era
 * usado dentro de handleProjectileHitEnemy).
 */
export class CollisionHandlers {
  constructor(private scene: GameScene) {}

  private triggerGroupAlert(originX: number, originY: number, alertRadius: number = 240) {
    this.scene.enemiesGroup.getChildren().forEach((enemyObj: any) => {
      const enemy = enemyObj as Enemy;
      if (enemy.active) {
        const dist = Phaser.Math.Distance.Between(originX, originY, enemy.x, enemy.y);
        if (dist <= alertRadius) {
          enemy.alertToCombat();
        }
      }
    });
  }

  public handleProjectileHitWall(projObj: any, wallObj: any) {
    const scene = this.scene;
    const proj = projObj as Projectile;
    if (!proj.active) return;

    // Wall blood splatter mark (persistent small stain at impact point)
    if (!proj.isEnemyProjectile) {
      const wallMark = scene.add.image(proj.x, proj.y, 'blood_pool_stain')
        .setDepth(4)
        .setScale(0.25 + Math.random() * 0.2)
        .setAlpha(0.7)
        .setRotation(Math.random() * Math.PI * 2);
      scene.bloodStainsGroup.add(wallMark);
      // Wall marks fade slowly (~30s)
      scene.tweens.add({
        targets: wallMark,
        alpha: 0,
        delay: 20000,
        duration: 10000,
        onComplete: () => { scene.bloodStainsGroup.remove(wallMark, true, true); },
      });
    }

    // Create wall spark / dust impact effect
    for (let i = 0; i < 4; i++) {
      const spark = scene.add.image(proj.x, proj.y, 'particle_blood_red').setTint(0xfacc15).setDepth(1700).setScale(0.8);
      scene.tweens.add({
        targets: spark,
        x: proj.x + (Math.random() - 0.5) * 30,
        y: proj.y + (Math.random() - 0.5) * 30,
        alpha: 0,
        duration: 200,
        onComplete: () => spark.destroy(),
      });
    }

    proj.releaseToPool();
  }

  public handlePlayerOpenChest(playerObj: any, chestObj: any) {
    const scene = this.scene;
    const chest = chestObj as Phaser.Physics.Arcade.Sprite;
    if (!chest.active) return;

    soundEngine.playChestOpen();
    ContractSystem.onChestOpened(scene);

    // Chest: guaranteed equipment loot + blood crystals (no XP/HP drops)
    // Grant some XP directly
    scene.player.addXp(30);
    scene.spawnFloatingText(chest.x, chest.y - 13, '+30 XP', '#3b82f6', false);

    // Guaranteed Chest Equipment Loot (Higher Rarity)
    const chestLoot = LootSystem.generateLoot(scene.currentFloorDepth, true);
    const lootSprite = new LootSprite(scene, chest.x + (Math.random() - 0.5) * 30, chest.y + (Math.random() - 0.5) * 30, chestLoot);
    scene.lootGroup.add(lootSprite);
    scene.lightingPolish?.addItemGlow(lootSprite, chestLoot.rarity);

    // Grant Blood Crystals (15 to 30)
    const crystals = 15 + Math.floor(Math.random() * 16);
    useGameStore.getState().addBloodCrystals(crystals);
    scene.spawnFloatingText(chest.x, chest.y - 25, `+${crystals} CRISTAIS 💎`, '#f43f5e', true);

    // Open chest animation: swap to the matching "open" sprite for the
    // chest's current facing direction (falls back to the generic open
    // texture, then to a tint if no open asset exists at all), hold it
    // briefly so the player sees the loot pop, then fade out and remove.
    const openKey = chest.texture.key.startsWith('spr_chest_')
      ? chest.texture.key.replace('spr_chest_', 'spr_chest_open_')
      : 'spr_chest_open';
    if (scene.textures.exists(openKey)) {
      chest.setTexture(openKey);
    } else if (scene.textures.exists('spr_chest_open')) {
      chest.setTexture('spr_chest_open');
    } else {
      chest.setTint(0x444444);
    }
    scene.tweens.add({
      targets: chest,
      alpha: 0,
      delay: 1500,
      duration: 500,
      onComplete: () => chest.destroy(),
    });
  }

  public handleProjectileHitEnemy(projObj: any, enemyObj: any) {
    const scene = this.scene;
    const proj = projObj as Projectile;
    const enemy = enemyObj as Enemy;

    if (!proj.active || !enemy.active) return;

    // Read damage BEFORE releasing back to the pool (release resets the state)
    const projectileDamage = proj.damage;

    // Blood Particles
    if (scene.bloodEmitter) {
      scene.bloodEmitter.emitParticleAt(enemy.x, enemy.y, 6);
    }

    proj.releaseToPool();

    // Taking damage alerts group!
    this.triggerGroupAlert(enemy.x, enemy.y, 220);

    // Critical Hit Roll (15% chance for 1.75x damage)
    const isCrit = Math.random() < 0.15;
    const finalDamage = isCrit ? projectileDamage * 1.75 : projectileDamage;

    const wasLowHp = (enemy.hp <= enemy.maxHp * 0.15);
    const isDead = enemy.takeDamage(finalDamage, scene.player.x, scene.player.y, isCrit, false);
    CombatFeel.handleHitImpact(scene, finalDamage, isCrit, false, enemy.hp / enemy.maxHp);
    scene.applyRelicOnHitEffects(enemy);

    if (isCrit && scene.lightingPolish) {
      scene.lightingPolish.addCriticalImpactGlow(enemy.x, enemy.y);
    }

    // Floating damage numbers
    const dmgText = Math.round(finalDamage).toString();
    scene.spawnFloatingText(enemy.x, enemy.y, isCrit ? `${dmgText}!` : dmgText, isCrit ? '#facc15' : '#ffffff', isCrit);

    // Vampirism life steal
    const effVamp = scene.player.getEffectiveVampirism();
    if (effVamp > 0) {
      const stolen = finalDamage * effVamp;
      scene.player.heal(stolen);
      scene.spawnFloatingText(scene.player.x, scene.player.y - 12, `+${Math.round(stolen)}`, '#22c55e', false);
      scene.lightingPolish?.addHealGlow(scene.player.x, scene.player.y);
    }

    if (isDead) {
      scene.handleEnemyDeath(enemy, 'blood_bolt', wasLowHp);
    }
  }

  public playerHitByEnemy(
    damage: number,
    statusEffectOnHit?: { type: 'bleeding' | 'poison' | 'infection'; chance: number },
    hitType: 'physical' | 'ranged' | 'toxic' | 'heavy' = 'physical'
  ) {
    const scene = this.scene;
    if (scene.player.isInvulnerable || scene.player.stats.isUnconscious || scene.player.stats.isDefinitivelyDead) {
      return;
    }

    if (scene.isScavenging) {
      scene.cancelScavenging();
    }

    // Check if player is inside Room 0 (Safe Town) to nullify damage
    const spawnRoom = scene.rooms[0];
    if (spawnRoom && scene.player.x >= spawnRoom.x && scene.player.x <= spawnRoom.x + spawnRoom.width &&
        scene.player.y >= spawnRoom.y && scene.player.y <= spawnRoom.y + spawnRoom.height) {
      return; // Absolute damage protection inside Safe Town!
    }

    // Roll status conditions on hit
    const store = useGameStore.getState();
    const conds = scene.player.stats.statusConditions;

    if (!conds.bleeding && hitType === 'physical' && Math.random() < 0.18) {
      conds.bleeding = true;
      store.setStatusCondition('bleeding', true);
      scene.spawnFloatingText(scene.player.x, scene.player.y - 22, '🩸 SANGRAMENTO!', '#ef4444', true);
      store.addLootLog('SANGRAMENTO: Ferida aberta! Pressione Z para usar Atadura.');
    }

    if (!conds.poison && (hitType === 'ranged' || hitType === 'toxic' || Math.random() < 0.12)) {
      conds.poison = true;
      store.setStatusCondition('poison', true);
      scene.spawnFloatingText(scene.player.x, scene.player.y - 22, '🧪 VENENO!', '#22c55e', true);
      store.addLootLog('VENENO: Sangue contaminado! Pressione X para usar Antídoto.');
    }

    if (!conds.infection && (hitType === 'heavy' || Math.random() < 0.10)) {
      conds.infection = true;
      store.setStatusCondition('infection', true);
      scene.spawnFloatingText(scene.player.x, scene.player.y - 22, '☣️ INFECÇÃO!', '#a855f7', true);
      store.addLootLog('INFECÇÃO: Vulnerabilidade a dano! Pressione V para usar Antibiótico.');
    }

    const isDead = scene.player.takeDamage(damage);
    ContractSystem.onPlayerDamaged();

    // Fase 5: Haptic Feedback on damage
    if (damage > 50) {
      HapticFeedback.playerDamaged(); // Padrão duplo para dano alto
    } else {
      HapticFeedback.lightImpact(); // Leve para dano baixo
    }

    // Fase 5: Advanced Visual Effects baseado em tipo de dano
    if (scene.screenShake && (scene.screenEffects || scene.postFX) && scene.advancedParticles) {
      // Screen Shake refinado por intensidade
      if (damage > 100) {
        scene.screenShake.heavy(); // Dano crítico
        scene.postFX?.setChromaticAberration(0.15, 200); // RGB separation (GPU)
        scene.screenEffects?.setChromaticAberration(0.15, 200);
      } else if (damage > 50) {
        scene.screenShake.medium(); // Dano alto
        scene.postFX?.setChromaticAberration(0.08, 150);
        scene.screenEffects?.setChromaticAberration(0.08, 150);
      } else if (damage > 20) {
        scene.screenShake.light(); // Dano médio
      } else {
        scene.screenShake.light();
      }

      // Advanced Particles baseado no tipo de dano
      if (hitType === 'ranged' || hitType === 'toxic') {
        // Dano à distância: gota de veneno
        scene.advancedParticles.emit({
          type: 'acid_splash',
          x: scene.player.x,
          y: scene.player.y,
          intensity: Math.min(damage / 100, 1),
        });
      } else if (hitType === 'heavy') {
        // Dano pesado: osso quebrado
        scene.advancedParticles.emit({
          type: 'bone_dust',
          x: scene.player.x,
          y: scene.player.y,
          intensity: Math.min(damage / 100, 1),
        });
      } else {
        // Dano normal: sangue
        scene.advancedParticles.emit({
          type: 'blood_splatter',
          x: scene.player.x,
          y: scene.player.y,
          intensity: Math.min(damage / 100, 1),
        });
      }
    }

    // Fase 3: Chance of inflicting a survival status condition (Dead Frontier 2 style)
    if (statusEffectOnHit && !scene.player.stats.isUnconscious && !scene.player.stats.isDefinitivelyDead) {
      if (Math.random() < statusEffectOnHit.chance) {
        const store2 = useGameStore.getState();
        if (!store2.playerStats.statusConditions[statusEffectOnHit.type]) {
          store2.setStatusCondition(statusEffectOnHit.type, true);
          const label = statusEffectOnHit.type === 'bleeding' ? 'Sangramento' : statusEffectOnHit.type === 'poison' ? 'Envenenamento' : 'Infecção';
          scene.spawnFloatingText(scene.player.x, scene.player.y - 24, label.toUpperCase(), '#84cc16', false);
          store2.addLootLog(`Você contraiu: ${label}. Use um curativo antes que piore.`);
        }
      }
    }

    // Floating damage number on player
    scene.spawnFloatingText(scene.player.x, scene.player.y, `-${Math.round(damage)}`, '#ef4444', true);

    // Juice: Screen Shake and Red Flash on damage
    const settings = useGameStore.getState().settings;
    if (settings.screenShakeEnabled !== false) {
      scene.cameras.main.shake(150, 0.015);
    }
    if (settings.flashesEnabled !== false) {
      scene.cameras.main.flash(100, 150, 0, 0, false);
    }

    if (isDead) {
      scene.triggerGameOver();
    }
  }

  public handleEnemyTouchPlayer(playerObj: any, enemyObj: any) {
    const enemy = enemyObj as Enemy;
    if (enemy.active) {
      const touchDamage = (enemy.damage ?? enemy.config.damage) * 0.4;
      this.playerHitByEnemy(touchDamage, enemy.config.statusEffectOnHit);
    }
  }

  public handleEnemyProjectileHitPlayer(playerObj: any, projObj: any) {
    const proj = projObj as Projectile;
    if (proj.active) {
      const statusEffectOnHit = proj.statusEffectOnHit;
      const projDamage = proj.damage;
      proj.releaseToPool();
      this.playerHitByEnemy(projDamage, statusEffectOnHit);
    }
  }

  public handleCollectItem(playerObj: any, itemObj: any) {
    const scene = this.scene;
    const item = itemObj as Collectible;
    if (!item.active) return;

    soundEngine.playOrbPickup();

    if (item.type === 'hp') {
      scene.player.heal(item.amount);
      scene.spawnFloatingText(scene.player.x, scene.player.y - 12, `+${item.amount} HP`, '#22c55e', false);
    } else if (item.type === 'mana') {
      scene.player.addMana(item.amount);
      scene.spawnFloatingText(scene.player.x, scene.player.y - 12, `+${item.amount} MP`, '#a855f7', false);
    }

    item.destroy();
  }

  public handleCollectLoot(playerObj: any, lootObj: any) {
    const scene = this.scene;
    const loot = lootObj as LootSprite;
    if (!loot.active) return;

    scene.player.equipLoot(loot.lootData);

    // Sync state with Zustand Store for Inventory Modal
    useGameStore.getState().equipItem(loot.lootData);
    useGameStore.getState().addLootLog(`Equipou: ${loot.lootData.name} (${loot.lootData.rarity.toUpperCase()})`);

    // Fancy text particle
    const rarityColor = loot.lootData.rarity === 'legendary' ? '#f59e0b' : loot.lootData.rarity === 'epic' ? '#a855f7' : loot.lootData.rarity === 'rare' ? '#3b82f6' : '#ffffff';
    const text = scene.add.text(loot.x, loot.y - 15, `+ ${loot.lootData.name}`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '8px',
      color: rarityColor,
    }).setOrigin(0.5).setDepth(2000);

    scene.tweens.add({
      targets: text,
      y: loot.y - 40,
      alpha: 0,
      duration: 1200,
      onComplete: () => text.destroy()
    });

    loot.destroy();
  }
}
