import Phaser from 'phaser';
import { Enemy } from '../objects/Enemy';
import { SpellConfig } from '../../types/game';
import spellsData from '../../data/spells.json';
import { soundEngine } from '../../utils/soundEngine';
import { useGameStore } from '../../store/gameStore';
import { CombatFeel } from './CombatFeel';
import { ContractSystem } from './ContractSystem';
import InputManager from './InputManager';
import type { GameScene } from '../scenes/GameScene';

/**
 * Extraído de GameScene.ts (item 4 do roadmap de refatoração — o arquivo
 * estava com ~117KB / ~2960 linhas). Concentra toda a execução das
 * habilidades do jogador: nova, syphon, bone shield, crimson scythe, ritual
 * circle, hemomancy beam, o tiro automático de blood bolt, o aim por
 * arrastar (drag-to-aim) e a leitura de botões do gamepad para disparar
 * skills.
 *
 * Esta é uma extração MECÂNICA — o comportamento é idêntico ao que existia
 * em GameScene.ts antes da extração. Alguns campos/métodos de GameScene que
 * eram `private` foram promovidos a `public` (ex: enemiesGroup, bloodEmitter,
 * lightingPolish, playerProjectilePool, isPaused, dragAimGraphics,
 * activeDragAimSpellId, dragAimVector, handleEnemyDeath) exclusivamente para
 * permitir este acesso entre classes — mudança de visibilidade em tempo de
 * compilação apenas, sem qualquer alteração de comportamento em runtime.
 */
export class PlayerSkillSystem {
  // Estados que só eram usados dentro deste bloco de código (não lidos em
  // nenhum outro lugar de GameScene) — movidos junto com a lógica.
  private lastGamepadButtonStates: boolean[] = [];
  private boneShieldVisuals: Phaser.GameObjects.Sprite[] = [];

  constructor(private scene: GameScene) {}

  public triggerSkill(
    skillKey: 'nova' | 'syphon' | 'bone_shield' | 'crimson_scythe' | 'blood_ritual_circle' | 'hemomancy_beam'
  ) {
    const scene = this.scene;
    if (scene.isPaused) return;

    let success = false;
    if (skillKey === 'nova' && scene.player.castNova()) {
      this.executeNovaEffect();
      scene.emitSound(scene.player.x, scene.player.y, 500); // Massive spell noise!
      ContractSystem.onSpellCasted('hellfire_nova', scene);
      success = true;
    } else if (skillKey === 'syphon' && scene.player.castSyphon()) {
      this.executeSyphonEffect();
      scene.emitSound(scene.player.x, scene.player.y, 420);
      ContractSystem.onSpellCasted('syphon_soul', scene);
      success = true;
    } else if (skillKey === 'bone_shield' && scene.player.castBoneShield()) {
      this.executeBoneShieldEffect();
      scene.emitSound(scene.player.x, scene.player.y, 350);
      ContractSystem.onSpellCasted('bone_shield', scene);
      success = true;
    } else if (skillKey === 'crimson_scythe' && scene.player.castCrimsonScythe()) {
      this.executeCrimsonScytheEffect();
      scene.emitSound(scene.player.x, scene.player.y, 450);
      ContractSystem.onSpellCasted('crimson_scythe', scene);
      success = true;
    } else if (skillKey === 'blood_ritual_circle' && scene.player.castRitualCircle()) {
      this.executeRitualCircleEffect();
      scene.emitSound(scene.player.x, scene.player.y, 400);
      ContractSystem.onSpellCasted('blood_ritual_circle', scene);
      success = true;
    } else if (skillKey === 'hemomancy_beam' && scene.player.castHemomancyBeam()) {
      this.executeHemomancyBeamEffect();
      scene.emitSound(scene.player.x, scene.player.y, 520);
      ContractSystem.onSpellCasted('hemomancy_beam', scene);
      success = true;
    }

    if (success) {
      useGameStore.getState().triggerOnboardingEvent('firstSkillCast', 'DICA: Acompanhe o indicador de cooldown piscante sobre cada habilidade!');
    }
  }

  // Payload plano em vez de CustomEvent<T> — a ponte com a UI passou a ser o
  // store tipado (dragAim), não mais window.dispatchEvent/CustomEvent. Ver
  // docs/architecture/06_PHASER_REACT_BRIDGE_MIGRATION.md.
  public handleDragAimStart(payload: { spellId: string }) {
    this.scene.activeDragAimSpellId = payload.spellId;
    this.scene.dragAimVector.set(0, 0);
  }

  public handleDragAimMove(payload: { spellId: string, dx: number, dy: number }) {
    if (this.scene.activeDragAimSpellId !== payload.spellId) return;
    this.scene.dragAimVector.set(payload.dx, payload.dy);

    // Rotate player to face dragging direction
    if (payload.dx !== 0 || payload.dy !== 0) {
      this.scene.player.setAimInput(payload.dx, payload.dy);
    }
  }

  public handleDragAimEnd(payload: { spellId: string, dx: number, dy: number, isDrag: boolean }) {
    if (this.scene.activeDragAimSpellId !== payload.spellId) return;

    const wasDrag = payload.isDrag;
    this.scene.activeDragAimSpellId = null;
    this.scene.dragAimGraphics.clear();

    if (wasDrag) {
      // Cast the skill in the dragged direction
      if (payload.dx !== 0 || payload.dy !== 0) {
        this.scene.player.setAimInput(payload.dx, payload.dy);
      }

      const skillKey = this.getSkillKeyFromSpellId(payload.spellId);
      if (skillKey) {
        this.triggerSkill(skillKey);
      }
    }
  }

  private getSkillKeyFromSpellId(spellId: string): 'nova' | 'syphon' | 'bone_shield' | 'crimson_scythe' | 'blood_ritual_circle' | 'hemomancy_beam' | null {
    switch (spellId) {
      case 'hellfire_nova': return 'nova';
      case 'syphon_soul': return 'syphon';
      case 'bone_shield': return 'bone_shield';
      case 'crimson_scythe': return 'crimson_scythe';
      case 'blood_ritual_circle': return 'blood_ritual_circle';
      case 'hemomancy_beam': return 'hemomancy_beam';
      default: return null;
    }
  }

  public handleGamepadInput() {
    const scene = this.scene;
    if (scene.isPaused) return;

    // 1. Move Inputs (Left Stick) via InputManager
    const move = InputManager.getMovementInput();
    scene.player.setMoveInput(move.x, move.y);

    // 2. Aim Inputs (Right Stick) via InputManager
    const aim = InputManager.getAimInput();
    if (aim.x !== 0 || aim.y !== 0) {
      scene.player.setAimInput(aim.x, aim.y);
    }

    // 3. Button presses (just-down edge detection)
    const gp = InputManager.getGamepadState();
    const currentStates = [
      gp.buttons.a, gp.buttons.b, gp.buttons.x, gp.buttons.y,
      gp.buttons.lb, gp.buttons.rb, gp.buttons.lt, gp.buttons.rt,
      gp.buttons.select, gp.buttons.start, gp.buttons.leftStickClick, gp.buttons.rightStickClick,
    ];

    const justPressed = (idx: number) => {
      const prev = this.lastGamepadButtonStates[idx] || false;
      const curr = currentStates[idx] || false;
      return curr && !prev;
    };

    // Button A (0) -> Dash
    if (justPressed(0)) {
      scene.player.triggerDash();
    }
    // Button X (2) -> hellfire_nova
    if (justPressed(2)) {
      this.triggerSkill('nova');
    }
    // Button Y (3) -> syphon_soul
    if (justPressed(3)) {
      this.triggerSkill('syphon');
    }
    // Button B (1) -> bone_shield
    if (justPressed(1)) {
      this.triggerSkill('bone_shield');
    }
    // Shoulder Left (4) -> crimson_scythe
    if (justPressed(4)) {
      this.triggerSkill('crimson_scythe');
    }
    // Shoulder Right (5) -> blood_ritual_circle
    if (justPressed(5)) {
      this.triggerSkill('blood_ritual_circle');
    }
    // Trigger Right (7) -> hemomancy_beam
    if (justPressed(7)) {
      this.triggerSkill('hemomancy_beam');
    }

    // Save state
    this.lastGamepadButtonStates = currentStates;
  }

  public applyRelicOnHitEffects(enemy: Enemy) {
    if (!enemy || !enemy.active) return;
    const relicMods = useGameStore.getState().getRelicModifiers();
    if (relicMods.bleedChanceOnHit && Math.random() < relicMods.bleedChanceOnHit) {
      this.scene.statusEffectSystem?.applyStatus(enemy, 'bleeding', 4000, relicMods.bleedDamagePerSecond || 10);
    }
  }

  public firePlayerBloodBolt() {
    const scene = this.scene;
    const aimVec = scene.player.getAimVector();
    const baseAngle = Math.atan2(aimVec.y, aimVec.x);
    const count = 1 + scene.player.stats.projectileBonus;
    const spreadAngle = 0.18; // spread in radians

    for (let i = 0; i < count; i++) {
      const offset = (i - (count - 1) / 2) * spreadAngle;
      const angle = baseAngle + offset;

      const boltCfg = (spellsData as Record<string, SpellConfig>)['blood_bolt'];
      const proj = scene.playerProjectilePool.get(scene.player.x, scene.player.y);
      proj.fire(
        scene.player.x,
        scene.player.y,
        angle,
        boltCfg.projectileSpeed,
        boltCfg.baseDamage * scene.player.getEffectiveDamageMultiplier(),
        false
      );
      scene.lightingPolish?.addSpellGlow(proj, 'blood_bolt');
    }
  }

  public executeNovaEffect() {
    const scene = this.scene;
    const novaRing = scene.add.circle(scene.player.x, scene.player.y, 10, 0xef4444, 0.7).setDepth(1500);

    // Juice: Screen Shake and Flash + Dynamic Area Light
    scene.cameras.main.shake(300, 0.02);
    scene.cameras.main.flash(200, 200, 0, 0, false);
    soundEngine.playLevelUp(); // Temporary powerful sound
    scene.lightingPolish?.addAreaSpellGlow(scene.player.x, scene.player.y, 'hellfire_nova', 220, 400);

    scene.tweens.add({
      targets: novaRing,
      radius: 200,
      alpha: 0,
      duration: 400,
      onComplete: () => novaRing.destroy(),
    });

    scene.enemiesGroup.getChildren().forEach((enemyObj: any) => {
      const enemy = enemyObj as Enemy;
      if (enemy.active) {
        const dist = Phaser.Math.Distance.Between(scene.player.x, scene.player.y, enemy.x, enemy.y);
        if (dist <= 200) {
          if (scene.bloodEmitter) scene.bloodEmitter.emitParticleAt(enemy.x, enemy.y, 15);
          const novaDmgCfg = (spellsData as Record<string, SpellConfig>)['hellfire_nova'].baseDamage;
          const novaDamage = Math.round(novaDmgCfg * scene.player.getEffectiveDamageMultiplier());

          const wasLowHp = (enemy.hp <= enemy.maxHp * 0.15);
          const isDead = enemy.takeDamage(novaDamage);
          CombatFeel.handleHitImpact(scene, novaDamage, false, true, enemy.hp / enemy.maxHp);
          this.applyRelicOnHitEffects(enemy);

          scene.spawnFloatingText(enemy.x, enemy.y, `${novaDamage}!`, '#f97316', true);
          const angle = Phaser.Math.Angle.Between(scene.player.x, scene.player.y, enemy.x, enemy.y);
          enemy.x += Math.cos(angle) * 40;
          enemy.y += Math.sin(angle) * 40;

          if (!isDead) {
            scene.statusEffectSystem?.applyStatus(enemy, 'burning', 3500, Math.max(6, Math.round(novaDamage * 0.3)));
          }

          if (isDead) {
            scene.handleEnemyDeath(enemy, 'hellfire_nova', wasLowHp);
          }
        }
      }
    });
  }

  public executeSyphonEffect() {
    const scene = this.scene;
    const circle = scene.add.circle(scene.player.x, scene.player.y, 150, 0x9333ea, 0.25).setDepth(1400);
    scene.lightingPolish?.addAreaSpellGlow(scene.player.x, scene.player.y, 'syphon_soul', 160, 450);
    scene.tweens.add({
      targets: circle,
      alpha: 0,
      duration: 400,
      onComplete: () => circle.destroy(),
    });

    let totalStolenHp = 0;
    scene.enemiesGroup.getChildren().forEach((enemyObj: any) => {
      const enemy = enemyObj as Enemy;
      if (enemy.active) {
        const dist = Phaser.Math.Distance.Between(scene.player.x, scene.player.y, enemy.x, enemy.y);
        if (dist <= 150) {
          if (scene.bloodEmitter) scene.bloodEmitter.emitParticleAt(enemy.x, enemy.y, 8);
          const syphonDmgCfg = (spellsData as Record<string, SpellConfig>)['syphon_soul'].baseDamage;
          const syphonDmg = Math.round(syphonDmgCfg * scene.player.getEffectiveDamageMultiplier());

          const wasLowHp = (enemy.hp <= enemy.maxHp * 0.15);
          const isDead = enemy.takeDamage(syphonDmg);
          CombatFeel.handleHitImpact(scene, syphonDmg, false, true, enemy.hp / enemy.maxHp);
          this.applyRelicOnHitEffects(enemy);

          scene.spawnFloatingText(enemy.x, enemy.y, syphonDmg.toString(), '#a855f7', false);
          totalStolenHp += 8;

          if (!isDead) {
            scene.statusEffectSystem?.applyStatus(enemy, 'cursed', 4000, 15);
          }

          if (isDead) {
            scene.handleEnemyDeath(enemy, 'syphon_soul', wasLowHp);
          }
        }
      }
    });

    if (totalStolenHp > 0) {
      scene.player.heal(totalStolenHp);
      scene.player.addMana(15);
      scene.spawnFloatingText(scene.player.x, scene.player.y - 15, `+${totalStolenHp} HP`, '#22c55e', true);
    }
  }

  public executeBoneShieldEffect() {
    const scene = this.scene;
    this.boneShieldVisuals.forEach((s) => s.destroy());
    this.boneShieldVisuals = [];

    for (let i = 0; i < 3; i++) {
      const bone = scene.add.sprite(scene.player.x, scene.player.y, 'particle_blood_red').setTint(0xe2e8f0).setScale(1.8).setDepth(1800);
      this.boneShieldVisuals.push(bone);
    }

    let angle = 0;
    let loopCount = 0;
    const maxLoops = 160;
    scene.time.addEvent({
      delay: 30,
      callback: () => {
        loopCount++;
        angle += 0.1;
        this.boneShieldVisuals.forEach((bone, idx) => {
          const boneAngle = angle + (idx * Math.PI * 2) / 3;
          bone.setPosition(scene.player.x + Math.cos(boneAngle) * 45, scene.player.y + Math.sin(boneAngle) * 45);

          scene.enemiesGroup.getChildren().forEach((enemyObj: any) => {
            const enemy = enemyObj as Enemy;
            if (enemy.active) {
              const dist = Phaser.Math.Distance.Between(bone.x, bone.y, enemy.x, enemy.y);
              if (dist < 25) {
                const boneDmg = Math.round(12 * scene.player.getEffectiveDamageMultiplier());
                const wasLowHp = (enemy.hp <= enemy.maxHp * 0.15);
                const isDead = enemy.takeDamage(boneDmg);
                CombatFeel.handleHitImpact(scene, boneDmg, false, false, enemy.hp / enemy.maxHp);
                this.applyRelicOnHitEffects(enemy);
                if (isDead) scene.handleEnemyDeath(enemy, 'bone_shield', wasLowHp);
              }
            }
          });
        });

        if (loopCount >= maxLoops) {
          this.boneShieldVisuals.forEach((s) => s.destroy());
          this.boneShieldVisuals = [];
        }
      },
      repeat: maxLoops,
    });
  }

  public executeCrimsonScytheEffect() {
    const scene = this.scene;
    const aimVec = scene.player.getAimVector();
    const baseAngle = Math.atan2(aimVec.y, aimVec.x);

    // Visual: Arc Graphics sweeping
    const arcGfx = scene.add.graphics().setDepth(1850);
    scene.cameras.main.shake(150, 0.012);
    scene.lightingPolish?.addAreaSpellGlow(
      scene.player.x + Math.cos(baseAngle) * 45,
      scene.player.y + Math.sin(baseAngle) * 45,
      'crimson_scythe',
      140,
      250
    );

    const startAngle = baseAngle - Math.PI / 3;
    const endAngle = baseAngle + Math.PI / 3;

    arcGfx.lineStyle(8, 0xef4444, 0.95);
    arcGfx.fillStyle(0xdc2626, 0.4);
    arcGfx.beginPath();
    arcGfx.moveTo(scene.player.x, scene.player.y);
    arcGfx.arc(scene.player.x, scene.player.y, 90, startAngle, endAngle, false);
    arcGfx.closePath();
    arcGfx.strokePath();
    arcGfx.fillPath();

    scene.tweens.add({
      targets: arcGfx,
      alpha: 0,
      scaleX: 1.15,
      scaleY: 1.15,
      duration: 250,
      onComplete: () => arcGfx.destroy(),
    });

    // Blood particles
    for (let i = 0; i < 12; i++) {
      const pAngle = startAngle + Math.random() * (endAngle - startAngle);
      const pDist = 30 + Math.random() * 55;
      const px = scene.player.x + Math.cos(pAngle) * pDist;
      const py = scene.player.y + Math.sin(pAngle) * pDist;
      if (scene.bloodEmitter) scene.bloodEmitter.emitParticleAt(px, py, 1);
    }

    // Damage enemies in arc
    const scytheDmgCfg = (spellsData as Record<string, SpellConfig>)['crimson_scythe'].baseDamage;
    const scytheDmg = Math.round(scytheDmgCfg * scene.player.getEffectiveDamageMultiplier());
    scene.enemiesGroup.getChildren().forEach((enemyObj: any) => {
      const enemy = enemyObj as Enemy;
      if (enemy.active) {
        const dist = Phaser.Math.Distance.Between(scene.player.x, scene.player.y, enemy.x, enemy.y);
        if (dist <= 95) {
          const enemyAngle = Phaser.Math.Angle.Between(scene.player.x, scene.player.y, enemy.x, enemy.y);
          const angleDiff = Phaser.Math.Angle.Wrap(enemyAngle - baseAngle);
          if (Math.abs(angleDiff) <= Math.PI / 2.5) {
            const wasLowHp = (enemy.hp <= enemy.maxHp * 0.15);
            const isDead = enemy.takeDamage(scytheDmg);
            CombatFeel.handleHitImpact(scene, scytheDmg, false, true, enemy.hp / enemy.maxHp);
            this.applyRelicOnHitEffects(enemy);
            scene.spawnFloatingText(enemy.x, enemy.y, `${scytheDmg}!`, '#dc2626', true);
            // Knockback
            enemy.x += Math.cos(enemyAngle) * 35;
            enemy.y += Math.sin(enemyAngle) * 35;
            if (isDead) scene.handleEnemyDeath(enemy, 'crimson_scythe', wasLowHp);
          }
        }
      }
    });
  }

  public executeRitualCircleEffect() {
    const scene = this.scene;
    const aimVec = scene.player.getAimVector();
    const targetX = Phaser.Math.Clamp(scene.player.x + aimVec.x * 120, 40, scene.physics.world.bounds.width - 40);
    const targetY = Phaser.Math.Clamp(scene.player.y + aimVec.y * 120, 40, scene.physics.world.bounds.height - 40);

    // Spawn Pentagram Ritual Circle
    const circleRing = scene.add.circle(targetX, targetY, 80, 0xef4444, 0.25).setStrokeStyle(3, 0xf43f5e, 0.9).setDepth(1300);
    const innerStar = scene.add.star(targetX, targetY, 5, 20, 40, 0xdc2626, 0.4).setDepth(1305);
    scene.lightingPolish?.addAreaSpellGlow(targetX, targetY, 'blood_ritual_circle', 180, 4000);

    let ticks = 0;
    const maxTicks = 16; // 4 seconds (every 250ms)
    scene.time.addEvent({
      delay: 250,
      callback: () => {
        ticks++;
        innerStar.setRotation(innerStar.rotation + 0.15);

        if (scene.bloodEmitter && Math.random() > 0.3) {
          scene.bloodEmitter.emitParticleAt(targetX + (Math.random() - 0.5) * 60, targetY + (Math.random() - 0.5) * 60, 2);
        }

        let enemiesPulled = 0;
        scene.enemiesGroup.getChildren().forEach((enemyObj: any) => {
          const enemy = enemyObj as Enemy;
          if (enemy.active) {
            const dist = Phaser.Math.Distance.Between(targetX, targetY, enemy.x, enemy.y);
            if (dist <= 110) {
              enemiesPulled++;
              // Pull toward center
              const pullAngle = Phaser.Math.Angle.Between(enemy.x, enemy.y, targetX, targetY);
              enemy.x += Math.cos(pullAngle) * 8;
              enemy.y += Math.sin(pullAngle) * 8;

              // Tick damage
              const tickDmg = Math.round(10 * scene.player.getEffectiveDamageMultiplier());
              const wasLowHp = (enemy.hp <= enemy.maxHp * 0.15);
              const isDead = enemy.takeDamage(tickDmg);
              CombatFeel.handleHitImpact(scene, tickDmg, false, true, enemy.hp / enemy.maxHp);
              this.applyRelicOnHitEffects(enemy);
              if (ticks % 2 === 0) {
                scene.spawnFloatingText(enemy.x, enemy.y, `${tickDmg}`, '#e11d48', false);
              }
              if (isDead) scene.handleEnemyDeath(enemy, 'blood_ritual_circle', wasLowHp);
            }
          }
        });

        // Regenerate Mana from blood transmutations
        if (enemiesPulled > 0) {
          scene.player.addMana(enemiesPulled * 2);
        }

        if (ticks >= maxTicks) {
          scene.tweens.add({
            targets: [circleRing, innerStar],
            alpha: 0,
            scale: 1.3,
            duration: 300,
            onComplete: () => {
              circleRing.destroy();
              innerStar.destroy();
            },
          });
        }
      },
      repeat: maxTicks - 1,
    });
  }

  public executeHemomancyBeamEffect() {
    const scene = this.scene;
    const aimVec = scene.player.getAimVector();
    const angle = Math.atan2(aimVec.y, aimVec.x);
    const startX = scene.player.x;
    const startY = scene.player.y;
    const beamLength = 480;

    const endX = startX + Math.cos(angle) * beamLength;
    const endY = startY + Math.sin(angle) * beamLength;

    scene.cameras.main.shake(250, 0.016);
    scene.lightingPolish?.addAreaSpellGlow(
      startX + Math.cos(angle) * 140,
      startY + Math.sin(angle) * 140,
      'hemomancy_beam',
      180,
      350
    );

    // Draw Piercing Blood Laser Graphics
    const beamGfx = scene.add.graphics().setDepth(1900);
    beamGfx.lineStyle(16, 0xf43f5e, 0.95);
    beamGfx.lineBetween(startX, startY, endX, endY);
    beamGfx.lineStyle(6, 0xffffff, 0.9);
    beamGfx.lineBetween(startX, startY, endX, endY);

    scene.tweens.add({
      targets: beamGfx,
      alpha: 0,
      duration: 350,
      onComplete: () => beamGfx.destroy(),
    });

    // Beam Line Segment collision check against enemies
    const beamLine = new Phaser.Geom.Line(startX, startY, endX, endY);
    const beamDmgCfg = (spellsData as Record<string, SpellConfig>)['hemomancy_beam'].baseDamage;
    const beamDmg = Math.round(beamDmgCfg * scene.player.getEffectiveDamageMultiplier());

    scene.enemiesGroup.getChildren().forEach((enemyObj: any) => {
      const enemy = enemyObj as Enemy;
      if (enemy.active) {
        const enemyCircle = new Phaser.Geom.Circle(enemy.x, enemy.y, 22);
        if (Phaser.Geom.Intersects.LineToCircle(beamLine, enemyCircle)) {
          if (scene.bloodEmitter) scene.bloodEmitter.emitParticleAt(enemy.x, enemy.y, 10);
          const wasLowHp = (enemy.hp <= enemy.maxHp * 0.15);
          const isDead = enemy.takeDamage(beamDmg);
          CombatFeel.handleHitImpact(scene, beamDmg, false, true, enemy.hp / enemy.maxHp);
          this.applyRelicOnHitEffects(enemy);
          scene.spawnFloatingText(enemy.x, enemy.y, `${beamDmg}!`, '#f43f5e', true);

          if (!isDead) {
            scene.statusEffectSystem?.applyStatus(enemy, 'cursed', 3500, 20);
          }

          if (isDead) scene.handleEnemyDeath(enemy, 'hemomancy_beam', wasLowHp);
        }
      }
    });
  }
}
