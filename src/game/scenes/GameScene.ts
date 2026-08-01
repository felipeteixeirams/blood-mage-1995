import Phaser from 'phaser';
import { Player } from '../objects/Player';
import { Enemy } from '../objects/Enemy';
import { Projectile } from '../objects/Projectile';
import { Collectible } from '../objects/Collectible';
import { LootSprite } from '../objects/Loot';
import { LootSystem } from '../systems/LootSystem';
import { PlayerStats, WaveConfig, UpgradeOption } from '../../types/game';
import wavesData from '../../data/waves.json';
import upgradesData from '../../data/upgrades.json';
import { soundEngine } from '../../utils/soundEngine';

export interface GameSceneCallbacks {
  onStatsUpdate: (stats: PlayerStats) => void;
  onLevelUp: (level: number, options: UpgradeOption[]) => void;
  onGameOver: (stats: PlayerStats) => void;
}

import { DungeonGenerator, RoomData } from '../systems/DungeonGenerator';

export class GameScene extends Phaser.Scene {
  public player!: Player;
  private depthGroup!: Phaser.GameObjects.Group;
  private enemiesGroup!: Phaser.Physics.Arcade.Group;
  private playerProjectilesGroup!: Phaser.Physics.Arcade.Group;
  private enemyProjectilesGroup!: Phaser.Physics.Arcade.Group;
  private collectiblesGroup!: Phaser.Physics.Arcade.Group;
  private lootGroup!: Phaser.Physics.Arcade.Group;
  private bloodStainsGroup!: Phaser.GameObjects.Group;
  private wallsGroup!: Phaser.Physics.Arcade.StaticGroup;
  private chestsGroup!: Phaser.Physics.Arcade.StaticGroup;
  public dungeonGenerator!: DungeonGenerator;

  // Floor Depth Progression
  private currentFloorDepth: number = 1;
  private totalFloorMonsters: number = 0;
  private floorMonstersKilled: number = 0;
  private portalSprite?: Phaser.GameObjects.Sprite;
  private isPortalActive: boolean = false;

  private currentWaveIndex: number = 0;
  private waveConfigs: WaveConfig[] = wavesData as WaveConfig[];

  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private touchMoveVector = { x: 0, y: 0 };
  private touchAimVector = { x: 0, y: 0 };

  private callbacks?: GameSceneCallbacks;
  private isPaused: boolean = false;
  private gameTimerSeconds: number = 0;
  private timerEvent?: Phaser.Time.TimerEvent;

  // Noise Emission Timer
  private lastFootstepNoiseTime: number = 0;

  // Bone shield visuals
  private boneShieldVisuals: Phaser.GameObjects.Sprite[] = [];

  private bloodEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;
  private isNovaReady: boolean = true;
  private lastNovaTime: number = 0;
  private readonly NOVA_COOLDOWN = 8000;

  constructor() {
    super({ key: 'GameScene' });
  }

  public init(data: { callbacks?: GameSceneCallbacks }) {
    this.callbacks = data?.callbacks;
  }

  create() {
    // 1. Set World Bounds for Dungeon (1920 x 1440)
    const mapW = 1920;
    const mapH = 1440;
    this.physics.world.setBounds(0, 0, mapW, mapH);

    // 2. Physics & Graphics Groups
    this.depthGroup = this.add.group();
    this.bloodStainsGroup = this.add.group();
    
    // Blood Particles Emitter
    this.bloodEmitter = this.add.particles(0, 0, 'particle_blood_red', {
      scale: { start: 0.1, end: 0 },
      alpha: { start: 0.7, end: 0 },
      speed: { min: 40, max: 100 },
      lifespan: 300,
      gravityY: 100,
      emitting: false
    }).setDepth(1900);

    this.wallsGroup = this.physics.add.staticGroup();
    this.chestsGroup = this.physics.add.staticGroup();
    this.enemiesGroup = this.physics.add.group({ runChildUpdate: false });
    this.playerProjectilesGroup = this.physics.add.group({ runChildUpdate: true });
    this.enemyProjectilesGroup = this.physics.add.group({ runChildUpdate: true });
    this.collectiblesGroup = this.physics.add.group();
    this.lootGroup = this.physics.add.group();

    this.dungeonGenerator = new DungeonGenerator(this, this.wallsGroup, this.chestsGroup);

    // 3. Generate Dungeon Map Layout
    this.buildDungeonMap(mapW, mapH, this.currentFloorDepth);

    // Camera setup
    this.cameras.main.setBounds(0, 0, mapW, mapH);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setZoom(1.15);

    // 4. Keyboard Controls
    if (this.input.keyboard) {
      this.keys = this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,Q,E,SPACE,ONE,TWO,THREE') as Record<string, Phaser.Input.Keyboard.Key>;
    }

    // Mouse Aim
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      const dx = worldPoint.x - this.player.x;
      const dy = worldPoint.y - this.player.y;
      if (Math.hypot(dx, dy) > 10) {
        this.player.setAimInput(dx, dy);
      }
    });

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      this.player.setAimInput(worldPoint.x - this.player.x, worldPoint.y - this.player.y);
    });

    // 5. Collisions & Overlaps
    this.physics.add.collider(this.player, this.wallsGroup);
    this.physics.add.collider(this.enemiesGroup, this.wallsGroup);
    this.physics.add.collider(this.enemiesGroup, this.enemiesGroup);
    this.physics.add.collider(this.player, this.chestsGroup, this.handlePlayerOpenChest as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, undefined, this);

    // Projectile collisions against walls
    this.physics.add.collider(
      this.playerProjectilesGroup,
      this.wallsGroup,
      this.handleProjectileHitWall as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );
    this.physics.add.collider(
      this.enemyProjectilesGroup,
      this.wallsGroup,
      this.handleProjectileHitWall as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );

    // Entity Overlaps
    this.physics.add.overlap(
      this.playerProjectilesGroup,
      this.enemiesGroup,
      this.handleProjectileHitEnemy as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );

    this.physics.add.collider(this.enemiesGroup, this.enemiesGroup);

    // Listen for Blood Nova event from UI
    const handleNovaEvent = () => this.triggerBloodNova();
    window.addEventListener('trigger-blood-nova', handleNovaEvent);
    this.events.once('shutdown', () => {
      window.removeEventListener('trigger-blood-nova', handleNovaEvent);
    });
    this.events.once('destroy', () => {
      window.removeEventListener('trigger-blood-nova', handleNovaEvent);
    });

    this.physics.add.overlap(
      this.player,
      this.enemiesGroup,
      this.handleEnemyTouchPlayer as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );

    this.physics.add.overlap(
      this.player,
      this.collectiblesGroup,
      this.handleCollectItem as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );

    this.physics.add.overlap(
      this.player,
      this.lootGroup,
      this.handleCollectLoot as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );

    this.physics.add.overlap(
      this.player,
      this.enemyProjectilesGroup,
      this.handleEnemyProjectileHitPlayer as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );

    // 6. Game Clock Timer
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      callback: () => {
        if (!this.isPaused) {
          this.gameTimerSeconds++;
          this.player.stats.timeSurvivedSeconds = this.gameTimerSeconds;
        }
      },
      loop: true,
    });

    soundEngine.startGothicAmbientBGM();
  }

  /**
   * Builds procedural 3x3 interconnected Dungeon Map with Rooms, Corridors, Walls, Chests & Enemies
   */
  private buildDungeonMap(mapW: number, mapH: number, floorDepth: number) {
    const rooms = this.dungeonGenerator.generate(mapW, mapH);

    // Create Player in Spawn Room 0
    const spawnRoom = rooms[0];
    if (!this.player) {
      this.player = new Player(this, spawnRoom.centerX, spawnRoom.centerY);
      this.depthGroup.add(this.player);
    } else {
      this.player.setPosition(spawnRoom.centerX, spawnRoom.centerY);
    }
    this.player.stats.floorDepth = floorDepth;

    // Populate Enemies across Chambers & Boss Room
    this.totalFloorMonsters = 0;
    this.floorMonstersKilled = 0;

    const currentWave = this.waveConfigs[Math.min(floorDepth - 1, this.waveConfigs.length - 1)];

    rooms.forEach((room) => {
      if (room.type === 'spawn') return; // Spawn room is safe!

      if (room.type === 'boss') {
        // Boss Sanctum Room
        const bossId = currentWave.isBossWave && currentWave.bossMonsterId ? currentWave.bossMonsterId : 'necro_lord_boss';
        const boss = new Enemy(this, room.centerX, room.centerY, bossId);
        this.enemiesGroup.add(boss);
        this.depthGroup.add(boss);
        this.totalFloorMonsters++;

        // Add 2 Elite Bodyguards
        for (let i = 0; i < 2; i++) {
          const guard = new Enemy(this, room.centerX + (i === 0 ? -90 : 90), room.centerY + 50, 'cultist_acolyte');
          this.enemiesGroup.add(guard);
          this.depthGroup.add(guard);
          this.totalFloorMonsters++;
        }
      } else {
        // Standard Chamber: 2 to 4 enemies in patrol/guard positions
        const monsterCount = 2 + Math.floor(Math.random() * 2) + Math.min(2, floorDepth - 1);
        for (let i = 0; i < monsterCount; i++) {
          const monsterId = Phaser.Utils.Array.GetRandom(currentWave.monsterPool);
          const spawnX = room.x + 50 + Math.random() * (room.width - 100);
          const spawnY = room.y + 50 + Math.random() * (room.height - 100);

          const enemy = new Enemy(this, spawnX, spawnY, monsterId);
          // Set room patrol boundaries
          enemy.patrolP1 = { x: room.x + 40, y: room.y + 40 };
          enemy.patrolP2 = { x: room.x + room.width - 40, y: room.y + room.height - 40 };

          this.enemiesGroup.add(enemy);
          this.depthGroup.add(enemy);
          this.totalFloorMonsters++;
        }
      }
    });

    // Floor Announcement Banner
    this.showFloorBanner(floorDepth);
  }

  private showFloorBanner(floorDepth: number) {
    const titles = ['CATACOMBAS DOS MORTOS', 'SANTUÁRIO DAS SOMBRAS', 'ABISMO INFERNAL', 'TRONO DO SENHOR DA MORTE'];
    const floorTitle = titles[(floorDepth - 1) % titles.length];

    const text = this.add.text(
      this.player.x,
      this.player.y - 120,
      `🏰 CALABOUÇO - NIVEL ${floorDepth}\n"${floorTitle}"`,
      {
        fontSize: '22px',
        color: '#f59e0b',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 6,
        align: 'center',
      }
    ).setOrigin(0.5).setDepth(2200);

    this.tweens.add({
      targets: text,
      y: text.y - 30,
      alpha: 0,
      duration: 3200,
      onComplete: () => text.destroy(),
    });
  }

  /**
   * Raycasting helper to test if line between two coordinates is blocked by dungeon walls
   */
  public hasLineOfSight(x1: number, y1: number, x2: number, y2: number): boolean {
    return this.dungeonGenerator.hasLineOfSight(x1, y1, x2, y2);
  }

  /**
   * Emits a sound pulse across the level that alerts unaware monsters in hearing range
   */
  public emitSound(x: number, y: number, loudness: number) {
    // Visual sound wave ripple
    const ring = this.add.circle(x, y, 10, 0xf59e0b, 0.35).setDepth(1500);
    this.tweens.add({
      targets: ring,
      radius: loudness * 0.7,
      alpha: 0,
      duration: 300,
      onComplete: () => ring.destroy(),
    });

    // Notify all active enemies
    this.enemiesGroup.getChildren().forEach((enemyObj: any) => {
      const enemy = enemyObj as Enemy;
      if (enemy.active) {
        const hasWall = !this.hasLineOfSight(x, y, enemy.x, enemy.y);
        enemy.onHearNoise(x, y, loudness, hasWall);
      }
    });
  }

  /**
   * Alert nearby allies in same room when enemy takes damage or sees player
   */
  private triggerGroupAlert(originX: number, originY: number, alertRadius: number = 240) {
    this.enemiesGroup.getChildren().forEach((enemyObj: any) => {
      const enemy = enemyObj as Enemy;
      if (enemy.active) {
        const dist = Phaser.Math.Distance.Between(originX, originY, enemy.x, enemy.y);
        if (dist <= alertRadius) {
          enemy.alertToCombat();
        }
      }
    });
  }

  public setTouchInputs(moveX: number, moveY: number, aimX: number, aimY: number) {
    this.touchMoveVector.x = moveX;
    this.touchMoveVector.y = moveY;
    this.touchAimVector.x = aimX;
    this.touchAimVector.y = aimY;
  }

  public triggerSkill(skillKey: 'nova' | 'syphon' | 'bone_shield') {
    if (this.isPaused) return;

    if (skillKey === 'nova' && this.player.castNova()) {
      this.executeNovaEffect();
      this.emitSound(this.player.x, this.player.y, 500); // Massive spell noise!
    } else if (skillKey === 'syphon' && this.player.castSyphon()) {
      this.executeSyphonEffect();
      this.emitSound(this.player.x, this.player.y, 420);
    } else if (skillKey === 'bone_shield' && this.player.castBoneShield()) {
      this.executeBoneShieldEffect();
      this.emitSound(this.player.x, this.player.y, 350);
    }
  }

  public applyUpgradeChoice(upgrade: UpgradeOption) {
    const e = upgrade.effect;
    if (e.hpMaxAdd) {
      this.player.stats.maxHp += e.hpMaxAdd;
      this.player.stats.hp = this.player.stats.maxHp;
    }
    if (e.manaMaxAdd) {
      this.player.stats.maxMana += e.manaMaxAdd;
      this.player.stats.mana = this.player.stats.maxMana;
    }
    if (e.moveSpeedPercent) {
      this.player.stats.moveSpeed *= (1 + e.moveSpeedPercent / 100);
    }
    if (e.damageMultiplierPercent) {
      this.player.stats.damageMultiplier *= (1 + e.damageMultiplierPercent / 100);
    }
    if (e.cooldownReductionPercent) {
      this.player.stats.cooldownReduction = Math.min(0.6, this.player.stats.cooldownReduction + e.cooldownReductionPercent / 100);
    }
    if (e.vampirismPercent) {
      this.player.stats.vampirism += e.vampirismPercent / 100;
    }
    if (e.projectileAdd) {
      this.player.stats.projectileBonus += e.projectileAdd;
    }

    this.isPaused = false;
    this.physics.resume();
  }

  private triggerBloodNova() {
    this.executeNovaEffect();
  }

  update(time: number, delta: number) {
    if (this.isPaused) return;

    // ISO Y-SORTING DEPTH SYSTEM
    this.depthGroup.getChildren().forEach((gameObject: any) => {
      if (gameObject && typeof gameObject.y === 'number') {
        gameObject.setDepth(gameObject.y);
      }
    });

    // 1. Process Input Movement
    let mx = this.touchMoveVector.x;
    let my = this.touchMoveVector.y;

    if (this.keys) {
      if (this.keys.W.isDown || this.keys.UP.isDown) my = -1;
      if (this.keys.S.isDown || this.keys.DOWN.isDown) my = 1;
      if (this.keys.A.isDown || this.keys.LEFT.isDown) mx = -1;
      if (this.keys.D.isDown || this.keys.RIGHT.isDown) mx = 1;

      // Keyboard hotkeys for skills
      if (Phaser.Input.Keyboard.JustDown(this.keys.Q) || Phaser.Input.Keyboard.JustDown(this.keys.ONE)) {
        this.triggerSkill('nova');
      }
      if (Phaser.Input.Keyboard.JustDown(this.keys.E) || Phaser.Input.Keyboard.JustDown(this.keys.TWO)) {
        this.triggerSkill('syphon');
      }
      if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE) || Phaser.Input.Keyboard.JustDown(this.keys.THREE)) {
        this.triggerSkill('bone_shield');
      }
    }

    this.player.setMoveInput(mx, my);

    if (this.touchAimVector.x !== 0 || this.touchAimVector.y !== 0) {
      this.player.setAimInput(this.touchAimVector.x, this.touchAimVector.y);
    }

    // Emit footstep noise when player is running fast
    const isMoving = mx !== 0 || my !== 0;
    if (isMoving && time > this.lastFootstepNoiseTime + 450) {
      this.lastFootstepNoiseTime = time;
      this.emitSound(this.player.x, this.player.y, 220); // Running footsteps noise
    }

    // 2. Update Player
    const lastMana = this.player.stats.mana;
    this.player.updatePlayer(time, delta);

    // If Blood Bolt fired in player update, create projectile & emit weapon noise
    if (this.player.stats.mana < lastMana - 1) {
      this.firePlayerBloodBolt();
      this.emitSound(this.player.x, this.player.y, 360); // Firing spell noise!
    }

    // Check Portal Collision to descend to next dungeon level
    if (this.isPortalActive && this.portalSprite) {
      const distToPortal = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.portalSprite.x, this.portalSprite.y);
      if (distToPortal < 35) {
        this.advanceToNextFloor();
      }
    }

    // 3. Check Incoming Projectile Dodge for Enemies
    this.playerProjectilesGroup.getChildren().forEach((projObj: any) => {
      const proj = projObj as Projectile;
      if (proj.active && proj.body) {
        this.enemiesGroup.getChildren().forEach((enemyObj: any) => {
          const enemy = enemyObj as Enemy;
          if (enemy.active && enemy.aiState === 'combat') {
            enemy.tryDodgeProjectile(proj.x, proj.y, proj.body.velocity.x, proj.body.velocity.y, time);
          }
        });
      }
    });

    // 4. Update Enemies with FOV, State Machine & Raycast Walls
    this.enemiesGroup.getChildren().forEach((enemyObj: any) => {
      const enemy = enemyObj as Enemy;
      if (enemy.active) {
        const hasWallBetween = !this.hasLineOfSight(enemy.x, enemy.y, this.player.x, this.player.y);
        const updateResult = enemy.updateEnemy(time, delta, this.player.x, this.player.y, hasWallBetween);

        if (updateResult.attack) {
          if (enemy.config.behavior === 'ranged' || enemy.config.behavior === 'boss') {
            // Fire ranged energy bolt
            const proj = new Projectile(this, enemy.x, enemy.y, 'proj_energy_bolt');
            const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
            proj.fire(enemy.x, enemy.y, angle, 220, enemy.config.damage, true);
            this.enemyProjectilesGroup.add(proj);
          } else {
            // Melee hit player
            this.playerHitByEnemy(updateResult.damage);
          }
        }
      }
    });

    // Attract collectibles to player
    this.collectiblesGroup.getChildren().forEach((itemObj: any) => {
      const item = itemObj as Collectible;
      if (item.active) {
        const dist = Phaser.Math.Distance.Between(item.x, item.y, this.player.x, this.player.y);
        if (dist < 120) {
          item.attractToPlayer(this.player.x, this.player.y);
        }
      }
    });

    // Sync HUD callback
    if (this.callbacks?.onStatsUpdate) {
      this.callbacks.onStatsUpdate({ ...this.player.stats });
    }
  }

  private firePlayerBloodBolt() {
    const aimVec = this.player.getAimVector();
    const baseAngle = Math.atan2(aimVec.y, aimVec.x);
    const count = 1 + this.player.stats.projectileBonus;
    const spreadAngle = 0.18; // spread in radians

    for (let i = 0; i < count; i++) {
      const offset = (i - (count - 1) / 2) * spreadAngle;
      const angle = baseAngle + offset;

      const proj = new Projectile(this, this.player.x, this.player.y, 'proj_blood_bolt');
      proj.fire(
        this.player.x,
        this.player.y,
        angle,
        450,
        22 * this.player.stats.damageMultiplier,
        false
      );
      this.playerProjectilesGroup.add(proj);
    }
  }

  private executeNovaEffect() {
    const novaRing = this.add.circle(this.player.x, this.player.y, 10, 0xef4444, 0.7).setDepth(1500);
    
    // Juice: Screen Shake and Flash
    this.cameras.main.shake(300, 0.02);
    this.cameras.main.flash(200, 200, 0, 0, false);
    soundEngine.playLevelUp(); // Temporary powerful sound

    this.tweens.add({
      targets: novaRing,
      radius: 200,
      alpha: 0,
      duration: 400,
      onComplete: () => novaRing.destroy(),
    });

    this.enemiesGroup.getChildren().forEach((enemyObj: any) => {
      const enemy = enemyObj as Enemy;
      if (enemy.active) {
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
        if (dist <= 200) {
          if (this.bloodEmitter) this.bloodEmitter.emitParticleAt(enemy.x, enemy.y, 15);
          const isDead = enemy.takeDamage(75 * this.player.stats.damageMultiplier);
          const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, enemy.x, enemy.y);
          enemy.x += Math.cos(angle) * 40;
          enemy.y += Math.sin(angle) * 40;

          if (isDead) {
            this.handleEnemyDeath(enemy);
          }
        }
      }
    });
  }

  private executeSyphonEffect() {
    const circle = this.add.circle(this.player.x, this.player.y, 150, 0x9333ea, 0.25).setDepth(1400);
    this.tweens.add({
      targets: circle,
      alpha: 0,
      duration: 400,
      onComplete: () => circle.destroy(),
    });

    let totalStolenHp = 0;
    this.enemiesGroup.getChildren().forEach((enemyObj: any) => {
      const enemy = enemyObj as Enemy;
      if (enemy.active) {
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
        if (dist <= 150) {
          if (this.bloodEmitter) this.bloodEmitter.emitParticleAt(enemy.x, enemy.y, 8);
          const isDead = enemy.takeDamage(45 * this.player.stats.damageMultiplier);
          totalStolenHp += 8;
          if (isDead) {
            this.handleEnemyDeath(enemy);
          }
        }
      }
    });

    if (totalStolenHp > 0) {
      this.player.heal(totalStolenHp);
      this.player.addMana(15);
    }
  }

  private executeBoneShieldEffect() {
    this.boneShieldVisuals.forEach((s) => s.destroy());
    this.boneShieldVisuals = [];

    for (let i = 0; i < 3; i++) {
      const bone = this.add.sprite(this.player.x, this.player.y, 'particle_blood_red').setTint(0xe2e8f0).setScale(1.8).setDepth(1800);
      this.boneShieldVisuals.push(bone);
    }

    let angle = 0;
    let loopCount = 0;
    const maxLoops = 160;
    this.time.addEvent({
      delay: 30,
      callback: () => {
        loopCount++;
        angle += 0.1;
        this.boneShieldVisuals.forEach((bone, idx) => {
          const boneAngle = angle + (idx * Math.PI * 2) / 3;
          bone.setPosition(this.player.x + Math.cos(boneAngle) * 45, this.player.y + Math.sin(boneAngle) * 45);

          this.enemiesGroup.getChildren().forEach((enemyObj: any) => {
            const enemy = enemyObj as Enemy;
            if (enemy.active) {
              const dist = Phaser.Math.Distance.Between(bone.x, bone.y, enemy.x, enemy.y);
              if (dist < 25) {
                const isDead = enemy.takeDamage(12 * this.player.stats.damageMultiplier);
                if (isDead) this.handleEnemyDeath(enemy);
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

  private handleProjectileHitWall(projObj: any, wallObj: any) {
    const proj = projObj as Projectile;
    if (!proj.active) return;

    // Create wall spark / dust impact effect
    for (let i = 0; i < 4; i++) {
      const spark = this.add.image(proj.x, proj.y, 'particle_blood_red').setTint(0xfacc15).setDepth(1700).setScale(0.8);
      this.tweens.add({
        targets: spark,
        x: proj.x + (Math.random() - 0.5) * 30,
        y: proj.y + (Math.random() - 0.5) * 30,
        alpha: 0,
        duration: 200,
        onComplete: () => spark.destroy(),
      });
    }

    proj.destroy();
  }

  private handlePlayerOpenChest(playerObj: any, chestObj: any) {
    const chest = chestObj as Phaser.Physics.Arcade.Sprite;
    if (!chest.active) return;

    soundEngine.playOrbPickup();

    // Spawn 3 XP gems & HP/Mana Orbs
    for (let i = 0; i < 3; i++) {
      const gem = new Collectible(this, chest.x + (Math.random() - 0.5) * 30, chest.y + (Math.random() - 0.5) * 30, 'xp', 25);
      this.collectiblesGroup.add(gem);
    }

    const orbType = Math.random() < 0.5 ? 'hp' : 'mana';
    const orb = new Collectible(this, chest.x, chest.y, orbType, 35);
    this.collectiblesGroup.add(orb);

    // Open chest animation
    chest.setTint(0x444444);
    chest.destroy();
  }

  private handleProjectileHitEnemy(projObj: any, enemyObj: any) {
    const proj = projObj as Projectile;
    const enemy = enemyObj as Enemy;

    if (!proj.active || !enemy.active) return;
    
    // Blood Particles
    if (this.bloodEmitter) {
      this.bloodEmitter.emitParticleAt(enemy.x, enemy.y, 6);
    }

    proj.destroy();

    // Taking damage alerts group!
    this.triggerGroupAlert(enemy.x, enemy.y, 220);

    const isDead = enemy.takeDamage(proj.damage);

    // Vampirism life steal
    if (this.player.stats.vampirism > 0) {
      this.player.heal(proj.damage * this.player.stats.vampirism);
    }

    if (isDead) {
      this.handleEnemyDeath(enemy);
    }
  }

  private playerHitByEnemy(damage: number) {
    const isDead = this.player.takeDamage(damage);
    
    // Juice: Screen Shake and Red Flash on damage
    this.cameras.main.shake(150, 0.015);
    this.cameras.main.flash(100, 150, 0, 0, false);

    if (isDead) {
      this.triggerGameOver();
    }
  }

  private handleEnemyTouchPlayer(playerObj: any, enemyObj: any) {
    const enemy = enemyObj as Enemy;
    if (enemy.active) {
      this.playerHitByEnemy(enemy.config.damage * 0.4);
    }
  }

  private handleEnemyProjectileHitPlayer(playerObj: any, projObj: any) {
    const proj = projObj as Projectile;
    if (proj.active) {
      proj.destroy();
      this.playerHitByEnemy(proj.damage);
    }
  }

  private handleEnemyDeath(enemy: Enemy) {
    // 1. Stats
    this.player.stats.kills++;
    this.player.stats.score += enemy.config.scoreValue;
    this.floorMonstersKilled++;

    // 2. Gore Effect: Blood Stain on Floor
    const stain = this.add.image(enemy.x, enemy.y, 'blood_pool_stain').setDepth(2);
    stain.setRotation(Math.random() * Math.PI);
    stain.setAlpha(0.8);

    // 3. Particle Splatter
    for (let i = 0; i < 8; i++) {
      const particle = this.add.image(enemy.x, enemy.y, 'particle_blood_red');
      particle.setTint(enemy.config.goreEffect === 'bone_dust' ? 0xdcd3c1 : 0xb91c1c);
      particle.setDepth(1600);

      const targetX = enemy.x + (Math.random() - 0.5) * 80;
      const targetY = enemy.y + (Math.random() - 0.5) * 80;

      this.tweens.add({
        targets: particle,
        x: targetX,
        y: targetY,
        alpha: 0,
        duration: 450 + Math.random() * 300,
        onComplete: () => particle.destroy(),
      });
    }

    // 4. Drop XP Blood Gem or HP/Mana Orbs
    const xpDrop = new Collectible(this, enemy.x, enemy.y, 'xp', enemy.config.xpDrop);
    this.collectiblesGroup.add(xpDrop);

    if (Math.random() < 0.25) {
      const type = Math.random() < 0.5 ? 'hp' : 'mana';
      const orb = new Collectible(this, enemy.x + (Math.random() - 0.5) * 20, enemy.y + (Math.random() - 0.5) * 20, type, 25);
      this.collectiblesGroup.add(orb);
    }

    // 5. Check Loot Drop
    if (LootSystem.rollLootChance()) {
      const lootData = LootSystem.generateLoot(this.currentFloorDepth);
      const loot = new LootSprite(this, enemy.x + (Math.random() - 0.5) * 30, enemy.y + (Math.random() - 0.5) * 30, lootData);
      this.lootGroup.add(loot);
    }

    enemy.destroy();

    // Check if Floor Cleared -> Reveal Portal
    if (this.enemiesGroup.countActive() === 0 && !this.isPortalActive) {
      this.revealDescentPortal(enemy.x, enemy.y);
    }
  }

  private revealDescentPortal(x: number, y: number) {
    this.isPortalActive = true;
    this.portalSprite = this.add.sprite(x, y, 'spr_portal').setDepth(10).setScale(1.2);

    // Swirling portal tween
    this.tweens.add({
      targets: this.portalSprite,
      rotation: Math.PI * 2,
      duration: 3000,
      repeat: -1,
    });

    // Portal Announcement
    const text = this.add.text(
      this.player.x,
      this.player.y - 100,
      '🌀 O PORTAL PARA AS PROFUNDEZES FOI REVELADO! 🌀',
      {
        fontSize: '20px',
        color: '#a855f7',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 5,
      }
    ).setOrigin(0.5).setDepth(2200);

    this.tweens.add({
      targets: text,
      y: text.y - 40,
      alpha: 0,
      duration: 3500,
      onComplete: () => text.destroy(),
    });
  }

  private advanceToNextFloor() {
    this.isPortalActive = false;
    if (this.portalSprite) {
      this.portalSprite.destroy();
      this.portalSprite = undefined;
    }

    this.currentFloorDepth++;
    this.player.heal(35); // Reward floor clear with HP restore
    this.player.addMana(50);

    // Clear old map entities
    this.wallsGroup.clear(true, true);
    this.chestsGroup.clear(true, true);
    this.collectiblesGroup.clear(true, true);
    this.enemyProjectilesGroup.clear(true, true);

    // Rebuild Dungeon Map for Next Floor Depth!
    this.buildDungeonMap(1920, 1440, this.currentFloorDepth);
  }

  private handleCollectItem(playerObj: any, itemObj: any) {
    const item = itemObj as Collectible;
    if (!item.active) return;

    soundEngine.playOrbPickup();

    if (item.type === 'hp') {
      this.player.heal(item.amount);
    } else if (item.type === 'mana') {
      this.player.addMana(item.amount);
    } else if (item.type === 'xp') {
      const leveledUp = this.player.addXp(item.amount);
      if (leveledUp) {
        this.triggerLevelUp();
      }
    }

    item.destroy();
  }

  private handleCollectLoot(playerObj: any, lootObj: any) {
    const loot = lootObj as LootSprite;
    if (!loot.active) return;

    this.player.equipLoot(loot.lootData);
    
    // Fancy text particle
    const text = this.add.text(loot.x, loot.y - 15, `+ ${loot.lootData.name}`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '8px',
      color: loot.lootData.rarity === 'epic' ? '#a855f7' : loot.lootData.rarity === 'rare' ? '#3b82f6' : '#ffffff'
    }).setOrigin(0.5).setDepth(2000);

    this.tweens.add({
      targets: text,
      y: loot.y - 40,
      alpha: 0,
      duration: 1200,
      onComplete: () => text.destroy()
    });

    loot.destroy();
  }

  private triggerLevelUp() {
    this.isPaused = true;
    this.physics.pause();

    const shuffled = [...upgradesData].sort(() => 0.5 - Math.random());
    const selectedOptions = shuffled.slice(0, 3) as UpgradeOption[];

    if (this.callbacks?.onLevelUp) {
      this.callbacks.onLevelUp(this.player.stats.level, selectedOptions);
    }
  }

  private triggerGameOver() {
    this.isPaused = true;
    this.physics.pause();
    soundEngine.stopBGM();

    if (this.callbacks?.onGameOver) {
      this.callbacks.onGameOver({ ...this.player.stats });
    }
  }
}
