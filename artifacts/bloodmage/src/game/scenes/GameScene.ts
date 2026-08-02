import Phaser from 'phaser';
import { Player } from '../objects/Player';
import { Enemy } from '../objects/Enemy';
import { Projectile } from '../objects/Projectile';
import { Collectible } from '../objects/Collectible';
import { LootSprite } from '../objects/Loot';
import { LootSystem } from '../systems/LootSystem';
import { PlayerStats, WaveConfig, UpgradeOption, BiomeType } from '../../types/game';
import wavesData from '../../data/waves.json';
import upgradesData from '../../data/upgrades.json';
import { soundEngine } from '../../utils/soundEngine';
import { useGameStore } from '../../store/gameStore';
import { telemetry } from '../../utils/telemetry';

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

  // --- Visual improvements ---
  private rooms: RoomData[] = [];
  private darknessOverlay!: Phaser.GameObjects.Graphics;
  private lightSprites: Phaser.GameObjects.Image[] = [];
  private fogOverlay!: Phaser.GameObjects.TileSprite;
  private bloodBurstEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  private flickerTimer?: Phaser.Time.TimerEvent;

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
  private emberEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;

  private comboKillCount: number = 0;
  private comboTimerEvent?: Phaser.Time.TimerEvent;

  private isNovaReady: boolean = true;
  private lastNovaTime: number = 0;
  private readonly NOVA_COOLDOWN = 8000;

  constructor() {
    super({ key: 'GameScene' });
  }

  /** Called by the Phaser scene lifecycle. Reads callbacks from the game registry
   *  (set synchronously by React before any scene runs) so there is no race. */
  public init(data: { callbacks?: GameSceneCallbacks }) {
    if (data?.callbacks) {
      // Explicit scene-start data takes priority (e.g. direct scene.start calls).
      this.callbacks = data.callbacks;
    } else {
      // Fall back to the registry entry written by PhaserGame before game creation.
      const reg = this.game?.registry?.get('reactCallbacks') as GameSceneCallbacks | undefined;
      if (reg) this.callbacks = reg;
    }
  }

  /** Update callbacks after initial scene creation (e.g. hot reload or state change). */
  public setCallbacks(callbacks: GameSceneCallbacks) {
    this.callbacks = callbacks;
    // Keep the registry in sync so future scene restarts pick up the latest callbacks.
    if (this.game?.registry) {
      this.game.registry.set('reactCallbacks', callbacks);
    }
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

    // Atmospheric Dungeon Embers
    this.emberEmitter = this.add.particles(0, 0, 'particle_blood_red', {
      scale: { start: 0.1, end: 0.02 },
      alpha: { start: 0.35, end: 0 },
      tint: 0xd97706,
      speedY: { min: -15, max: -40 },
      speedX: { min: -8, max: 8 },
      lifespan: 2000,
      frequency: 140,
      emitting: true,
      bounds: new Phaser.Geom.Rectangle(0, 0, mapW, mapH)
    }).setDepth(1950);

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

    // --- VISUAL: Darkness overlay + Lighting ---
    this.darknessOverlay = this.add.graphics().setDepth(1990);
    this.darknessOverlay.fillStyle(0x000000, 0.65);
    this.darknessOverlay.fillRect(0, 0, mapW, mapH);

    // Place light sprites (additive blend over darkness)
    this.lightSprites.forEach(s => s.destroy());
    this.lightSprites = [];
    this.rooms.forEach((room) => {
      // Torches flanking doorways on each wall
      const flamePositions: { x: number; y: number; kind: 'torch' | 'brazier' }[] = [];

      if (room.y > 80) {
        flamePositions.push({ x: room.centerX - 70, y: room.y - 6, kind: 'torch' });
        flamePositions.push({ x: room.centerX + 70, y: room.y - 6, kind: 'torch' });
      }
      if (room.x > 100) {
        flamePositions.push({ x: room.x - 6, y: room.centerY - 40, kind: 'torch' });
        flamePositions.push({ x: room.x - 6, y: room.centerY + 40, kind: 'torch' });
      }
      // Corners of the room
      flamePositions.push({ x: room.x + 40, y: room.y + 40, kind: 'torch' });
      flamePositions.push({ x: room.x + room.width - 40, y: room.y + 40, kind: 'torch' });
      flamePositions.push({ x: room.x + 40, y: room.y + room.height - 40, kind: 'torch' });
      flamePositions.push({ x: room.x + room.width - 40, y: room.y + room.height - 40, kind: 'torch' });

      // Boss room: massive brazier in center
      if (room.type === 'boss') {
        flamePositions.push({ x: room.centerX, y: room.centerY + 60, kind: 'brazier' });
      }

      flamePositions.forEach((fp) => {
        const texKey = fp.kind === 'brazier' ? 'light_brazier' : 'light_torch';
        const scale = fp.kind === 'brazier' ? 1.0 : 0.6 + Math.random() * 0.3;
        const light = this.add.image(fp.x, fp.y, texKey)
          .setBlendMode(Phaser.BlendModes.ADD)
          .setDepth(1995)
          .setAlpha(0.6 + Math.random() * 0.2)
          .setScale(scale);
        this.lightSprites.push(light);
      });
    });

    // Flicker timer — randomizes scale + alpha of all light sprites
    this.flickerTimer = this.time.addEvent({
      delay: 180,
      loop: true,
      callback: () => {
        this.lightSprites.forEach((sprite) => {
          const flicker = 0.82 + Math.random() * 0.3;
          sprite.setScale(sprite.displayWidth < 100 ? 0.6 * flicker : flicker);
          sprite.setAlpha(0.45 + Math.random() * 0.4);
        });
      },
    });

    // --- VISUAL: Ground-level mist / fog ---
    this.fogOverlay = this.add.tileSprite(0, 0, mapW, mapH, 'fog_mist')
      .setOrigin(0, 0)
      .setDepth(750)          // between floor (1) and entities
      .setAlpha(0.18);

    // --- VISUAL: Blood burst emitter (one-shot bursts) ---
    this.bloodBurstEmitter = this.add.particles(0, 0, 'particle_blood_red', {
      scale: { start: 0.12, end: 0 },
      alpha: { start: 0.9, end: 0 },
      speed: { min: 60, max: 180 },
      angle: { min: 0, max: 360 },
      lifespan: { min: 250, max: 500 },
      gravityY: 120,
      emitting: false,
    }).setDepth(2100);

    // Camera setup
    this.cameras.main.setBounds(0, 0, mapW, mapH);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setZoom(1.15);

    // 4. Keyboard Controls
    if (this.input.keyboard) {
      this.keys = this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,Q,E,SPACE,R,SHIFT,F,ONE,TWO,THREE,FOUR,FIVE,SIX') as Record<string, Phaser.Input.Keyboard.Key>;
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
      if (this.flickerTimer) this.flickerTimer.destroy();
    });
    this.events.once('destroy', () => {
      window.removeEventListener('trigger-blood-nova', handleNovaEvent);
      if (this.flickerTimer) this.flickerTimer.destroy();
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
    // Determine Biome based on Floor Depth
    let biome: BiomeType = 'fosso_chagas';
    if (floorDepth >= 5) {
      biome = 'santuario_sangue';
    } else if (floorDepth >= 3) {
      biome = 'catacumbas_martires';
    }

    useGameStore.getState().setCurrentBiome(biome);

    const rooms = this.dungeonGenerator.generate(mapW, mapH, biome);
    this.rooms = rooms;

    telemetry.trackEvent('floor_start', { floor: floorDepth, biome, rooms: rooms.length });

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

  public triggerSkill(skillKey: 'nova' | 'syphon' | 'bone_shield' | 'crimson_scythe' | 'blood_ritual_circle' | 'hemomancy_beam') {
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
    } else if (skillKey === 'crimson_scythe' && this.player.castCrimsonScythe()) {
      this.executeCrimsonScytheEffect();
      this.emitSound(this.player.x, this.player.y, 450);
    } else if (skillKey === 'blood_ritual_circle' && this.player.castRitualCircle()) {
      this.executeRitualCircleEffect();
      this.emitSound(this.player.x, this.player.y, 400);
    } else if (skillKey === 'hemomancy_beam' && this.player.castHemomancyBeam()) {
      this.executeHemomancyBeamEffect();
      this.emitSound(this.player.x, this.player.y, 520);
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

    // --- Fog / mist slow drift ---
    if (this.fogOverlay?.active) {
      this.fogOverlay.tilePositionX += 0.12;
      this.fogOverlay.tilePositionY += 0.06;
    }

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
      if (Phaser.Input.Keyboard.JustDown(this.keys.R) || Phaser.Input.Keyboard.JustDown(this.keys.FOUR)) {
        this.triggerSkill('crimson_scythe');
      }
      if (Phaser.Input.Keyboard.JustDown(this.keys.SHIFT) || Phaser.Input.Keyboard.JustDown(this.keys.FIVE)) {
        this.triggerSkill('blood_ritual_circle');
      }
      if (Phaser.Input.Keyboard.JustDown(this.keys.F) || Phaser.Input.Keyboard.JustDown(this.keys.SIX)) {
        this.triggerSkill('hemomancy_beam');
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
      const projBody = proj.active ? (proj.body as Phaser.Physics.Arcade.Body | null) : null;
      if (projBody) {
        this.enemiesGroup.getChildren().forEach((enemyObj: any) => {
          const enemy = enemyObj as Enemy;
          if (enemy.active && enemy.aiState === 'combat') {
            enemy.tryDodgeProjectile(proj.x, proj.y, projBody.velocity.x, projBody.velocity.y, time);
          }
        });
      }
    });

    // 4. Update Enemies with FOV, State Machine & Raycast Walls
    const activeEnemiesList = this.enemiesGroup.getChildren() as Enemy[];
    activeEnemiesList.forEach((enemy: Enemy) => {
      if (enemy.active) {
        const hasWallBetween = !this.hasLineOfSight(enemy.x, enemy.y, this.player.x, this.player.y);
        const updateResult = enemy.updateEnemy(time, delta, this.player.x, this.player.y, hasWallBetween, activeEnemiesList);

        if (updateResult.attack) {
          if (updateResult.attackType === 'ranged' || enemy.config.behavior === 'ranged' || enemy.config.behavior === 'boss') {
            // Fire ranged energy bolt
            const proj = new Projectile(this, enemy.x, enemy.y, 'proj_energy_bolt');
            const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
            proj.fire(enemy.x, enemy.y, angle, 220, enemy.config.damage, true);
            this.enemyProjectilesGroup.add(proj);
          } else {
            // Melee hit player
            this.playerHitByEnemy(updateResult.damage);
            const attackAngle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
            this.spawnMeleeSlashEffect(this.player.x, this.player.y, attackAngle);
          }
        } else if (updateResult.dodged) {
          this.spawnFloatingText(this.player.x, this.player.y - 14, 'MISS!', '#94a3b8', false);
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

    // Telemetry Performance Snapshot (throttle every 60 frames approx)
    if (this.game.loop.frame % 60 === 0) {
      const entityCount = this.enemiesGroup.countActive() + this.playerProjectilesGroup.countActive() + this.enemyProjectilesGroup.countActive();
      telemetry.updatePerformanceMetrics(
        this.game.loop.actualFps,
        this.game.loop.delta,
        entityCount,
        soundEngine.getActiveVoices()
      );
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
          const novaDamage = Math.round(75 * this.player.stats.damageMultiplier);
          const isDead = enemy.takeDamage(novaDamage);
          this.spawnFloatingText(enemy.x, enemy.y, `${novaDamage}!`, '#f97316', true);
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
          const syphonDmg = Math.round(45 * this.player.stats.damageMultiplier);
          const isDead = enemy.takeDamage(syphonDmg);
          this.spawnFloatingText(enemy.x, enemy.y, syphonDmg.toString(), '#a855f7', false);
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
      this.spawnFloatingText(this.player.x, this.player.y - 15, `+${totalStolenHp} HP`, '#22c55e', true);
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

  private executeCrimsonScytheEffect() {
    const aimVec = this.player.getAimVector();
    const baseAngle = Math.atan2(aimVec.y, aimVec.x);

    // Visual: Arc Graphics sweeping
    const arcGfx = this.add.graphics().setDepth(1850);
    this.cameras.main.shake(150, 0.012);

    const startAngle = baseAngle - Math.PI / 3;
    const endAngle = baseAngle + Math.PI / 3;

    arcGfx.lineStyle(8, 0xef4444, 0.95);
    arcGfx.fillStyle(0xdc2626, 0.4);
    arcGfx.beginPath();
    arcGfx.moveTo(this.player.x, this.player.y);
    arcGfx.arc(this.player.x, this.player.y, 90, startAngle, endAngle, false);
    arcGfx.closePath();
    arcGfx.strokePath();
    arcGfx.fillPath();

    this.tweens.add({
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
      const px = this.player.x + Math.cos(pAngle) * pDist;
      const py = this.player.y + Math.sin(pAngle) * pDist;
      if (this.bloodEmitter) this.bloodEmitter.emitParticleAt(px, py, 1);
    }

    // Damage enemies in arc
    const scytheDmg = Math.round(115 * this.player.stats.damageMultiplier);
    this.enemiesGroup.getChildren().forEach((enemyObj: any) => {
      const enemy = enemyObj as Enemy;
      if (enemy.active) {
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
        if (dist <= 95) {
          const enemyAngle = Phaser.Math.Angle.Between(this.player.x, this.player.y, enemy.x, enemy.y);
          const angleDiff = Phaser.Math.Angle.Wrap(enemyAngle - baseAngle);
          if (Math.abs(angleDiff) <= Math.PI / 2.5) {
            const isDead = enemy.takeDamage(scytheDmg);
            this.spawnFloatingText(enemy.x, enemy.y, `${scytheDmg}!`, '#dc2626', true);
            // Knockback
            enemy.x += Math.cos(enemyAngle) * 35;
            enemy.y += Math.sin(enemyAngle) * 35;
            if (isDead) this.handleEnemyDeath(enemy);
          }
        }
      }
    });
  }

  private executeRitualCircleEffect() {
    const aimVec = this.player.getAimVector();
    const targetX = Phaser.Math.Clamp(this.player.x + aimVec.x * 120, 40, this.physics.world.bounds.width - 40);
    const targetY = Phaser.Math.Clamp(this.player.y + aimVec.y * 120, 40, this.physics.world.bounds.height - 40);

    // Spawn Pentagram Ritual Circle
    const circleRing = this.add.circle(targetX, targetY, 80, 0xef4444, 0.25).setStrokeStyle(3, 0xf43f5e, 0.9).setDepth(1300);
    const innerStar = this.add.star(targetX, targetY, 5, 20, 40, 0xdc2626, 0.4).setDepth(1305);

    let ticks = 0;
    const maxTicks = 16; // 4 seconds (every 250ms)
    this.time.addEvent({
      delay: 250,
      callback: () => {
        ticks++;
        innerStar.setRotation(innerStar.rotation + 0.15);

        if (this.bloodEmitter && Math.random() > 0.3) {
          this.bloodEmitter.emitParticleAt(targetX + (Math.random() - 0.5) * 60, targetY + (Math.random() - 0.5) * 60, 2);
        }

        let enemiesPulled = 0;
        this.enemiesGroup.getChildren().forEach((enemyObj: any) => {
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
              const tickDmg = Math.round(10 * this.player.stats.damageMultiplier);
              const isDead = enemy.takeDamage(tickDmg);
              if (ticks % 2 === 0) {
                this.spawnFloatingText(enemy.x, enemy.y, `${tickDmg}`, '#e11d48', false);
              }
              if (isDead) this.handleEnemyDeath(enemy);
            }
          }
        });

        // Regenerate Mana from blood transmutations
        if (enemiesPulled > 0) {
          this.player.addMana(enemiesPulled * 2);
        }

        if (ticks >= maxTicks) {
          this.tweens.add({
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

  private executeHemomancyBeamEffect() {
    const aimVec = this.player.getAimVector();
    const angle = Math.atan2(aimVec.y, aimVec.x);
    const startX = this.player.x;
    const startY = this.player.y;
    const beamLength = 480;

    const endX = startX + Math.cos(angle) * beamLength;
    const endY = startY + Math.sin(angle) * beamLength;

    this.cameras.main.shake(250, 0.016);

    // Draw Piercing Blood Laser Graphics
    const beamGfx = this.add.graphics().setDepth(1900);
    beamGfx.lineStyle(16, 0xf43f5e, 0.95);
    beamGfx.lineBetween(startX, startY, endX, endY);
    beamGfx.lineStyle(6, 0xffffff, 0.9);
    beamGfx.lineBetween(startX, startY, endX, endY);

    this.tweens.add({
      targets: beamGfx,
      alpha: 0,
      duration: 350,
      onComplete: () => beamGfx.destroy(),
    });

    // Beam Line Segment collision check against enemies
    const beamLine = new Phaser.Geom.Line(startX, startY, endX, endY);
    const beamDmg = Math.round(160 * this.player.stats.damageMultiplier);

    this.enemiesGroup.getChildren().forEach((enemyObj: any) => {
      const enemy = enemyObj as Enemy;
      if (enemy.active) {
        const enemyCircle = new Phaser.Geom.Circle(enemy.x, enemy.y, 22);
        if (Phaser.Geom.Intersects.LineToCircle(beamLine, enemyCircle)) {
          if (this.bloodEmitter) this.bloodEmitter.emitParticleAt(enemy.x, enemy.y, 10);
          const isDead = enemy.takeDamage(beamDmg);
          this.spawnFloatingText(enemy.x, enemy.y, `${beamDmg}!`, '#f43f5e', true);
          if (isDead) this.handleEnemyDeath(enemy);
        }
      }
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

    soundEngine.playChestOpen();

    // Spawn 3 XP gems & HP/Mana Orbs
    for (let i = 0; i < 3; i++) {
      const gem = new Collectible(this, chest.x + (Math.random() - 0.5) * 30, chest.y + (Math.random() - 0.5) * 30, 'xp', 25);
      this.collectiblesGroup.add(gem);
    }

    const orbType = Math.random() < 0.5 ? 'hp' : 'mana';
    const orb = new Collectible(this, chest.x, chest.y, orbType, 35);
    this.collectiblesGroup.add(orb);

    // Guaranteed Chest Equipment Loot (Higher Rarity)
    const chestLoot = LootSystem.generateLoot(this.currentFloorDepth, true);
    const lootSprite = new LootSprite(this, chest.x + (Math.random() - 0.5) * 30, chest.y + (Math.random() - 0.5) * 30, chestLoot);
    this.lootGroup.add(lootSprite);

    // Grant Blood Crystals (15 to 30)
    const crystals = 15 + Math.floor(Math.random() * 16);
    useGameStore.getState().addBloodCrystals(crystals);
    this.spawnFloatingText(chest.x, chest.y - 25, `+${crystals} CRISTAIS 💎`, '#f43f5e', true);

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

    // Critical Hit Roll (15% chance for 1.75x damage)
    const isCrit = Math.random() < 0.15;
    const finalDamage = isCrit ? proj.damage * 1.75 : proj.damage;

    const isDead = enemy.takeDamage(finalDamage);

    // Floating damage numbers
    const dmgText = Math.round(finalDamage).toString();
    this.spawnFloatingText(enemy.x, enemy.y, isCrit ? `${dmgText}!` : dmgText, isCrit ? '#facc15' : '#ffffff', isCrit);

    // Vampirism life steal
    if (this.player.stats.vampirism > 0) {
      const stolen = finalDamage * this.player.stats.vampirism;
      this.player.heal(stolen);
      this.spawnFloatingText(this.player.x, this.player.y - 12, `+${Math.round(stolen)}`, '#22c55e', false);
    }

    if (isDead) {
      this.handleEnemyDeath(enemy);
    }
  }

  private playerHitByEnemy(damage: number) {
    const isDead = this.player.takeDamage(damage);
    
    // Floating damage number on player
    this.spawnFloatingText(this.player.x, this.player.y, `-${Math.round(damage)}`, '#ef4444', true);

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
    this.registerKillCombo(enemy.x, enemy.y);

    // 2. Gore Effect: Blood Stain on Floor
    const isAbomination = enemy.config.id === 'gore_abomination';
    const isZombie = enemy.config.id === 'zombie_shambler';

    const stainScale = isAbomination ? 2.5 : 1.0;
    const stain = this.add.image(enemy.x, enemy.y, 'blood_pool_stain').setDepth(2).setScale(stainScale);
    stain.setRotation(Math.random() * Math.PI);
    stain.setAlpha(0.85);

    // Gore Abomination Explosion Effect
    if (isAbomination) {
      soundEngine.playGoreExplosion();
      this.cameras.main.shake(220, 0.018);

      const expRing = this.add.circle(enemy.x, enemy.y, 15, 0x22c55e, 0.85).setDepth(1700);
      this.tweens.add({
        targets: expRing,
        radius: 110,
        alpha: 0,
        duration: 400,
        onComplete: () => expRing.destroy(),
      });

      // Area damage to player
      const distToPlayer = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);
      if (distToPlayer <= 110) {
        this.playerHitByEnemy(28);
        this.spawnFloatingText(this.player.x, this.player.y - 15, 'EXPLOSÃO TÓXICA!', '#22c55e', true);
      }
    }

    // Zombie Shambler Death Spawns Bat Swarm
    if (isZombie) {
      for (let b = 0; b < 2; b++) {
        const batX = enemy.x + (Math.random() - 0.5) * 30;
        const batY = enemy.y + (Math.random() - 0.5) * 30;
        const bat = new Enemy(this, batX, batY, 'bat_swarm');
        bat.alertToCombat();
        this.enemiesGroup.add(bat);
      }
      this.spawnFloatingText(enemy.x, enemy.y - 12, 'MORCEGOS LIBERTADOS!', '#a855f7', false);
    }

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
    soundEngine.playPortalEnter();
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
      this.spawnFloatingText(this.player.x, this.player.y - 12, `+${item.amount} HP`, '#22c55e', false);
    } else if (item.type === 'mana') {
      this.player.addMana(item.amount);
      this.spawnFloatingText(this.player.x, this.player.y - 12, `+${item.amount} MP`, '#a855f7', false);
    } else if (item.type === 'xp') {
      const leveledUp = this.player.addXp(item.amount);
      this.spawnFloatingText(this.player.x, this.player.y - 12, `+${item.amount} XP`, '#3b82f6', false);
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

    // Sync state with Zustand Store for Inventory Modal
    useGameStore.getState().equipItem(loot.lootData);
    useGameStore.getState().addLootLog(`Equipou: ${loot.lootData.name} (${loot.lootData.rarity.toUpperCase()})`);
    
    // Fancy text particle
    const rarityColor = loot.lootData.rarity === 'legendary' ? '#f59e0b' : loot.lootData.rarity === 'epic' ? '#a855f7' : loot.lootData.rarity === 'rare' ? '#3b82f6' : '#ffffff';
    const text = this.add.text(loot.x, loot.y - 15, `+ ${loot.lootData.name}`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '8px',
      color: rarityColor,
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

  /** Emit a short burst of blood particles at a position — used by enemy damage */
  public spawnBloodBurst(x: number, y: number, count: number = 6) {
    if (this.bloodBurstEmitter?.active) {
      this.bloodBurstEmitter.emitParticleAt(x, y, count);
    }
  }

  public spawnFloatingText(x: number, y: number, text: string, color: string = '#f87171', isCrit: boolean = false) {
    const fontSize = isCrit ? '14px' : '11px';
    const strokeColor = isCrit ? '#000000' : '#0f172a';

    const jitterX = (Math.random() - 0.5) * 16;
    const txt = this.add.text(x + jitterX, y - 10, text, {
      fontSize,
      fontFamily: '"Press Start 2P", monospace',
      color,
      stroke: strokeColor,
      strokeThickness: isCrit ? 4 : 3,
    }).setOrigin(0.5).setDepth(2100);

    if (isCrit) {
      txt.setScale(1.35);
      this.tweens.add({
        targets: txt,
        scaleX: 1.0,
        scaleY: 1.0,
        duration: 120,
        ease: 'Quad.easeOut',
      });
    }

    this.tweens.add({
      targets: txt,
      y: y - (isCrit ? 40 : 28),
      alpha: 0,
      duration: isCrit ? 850 : 650,
      ease: 'Cubic.easeOut',
      onComplete: () => txt.destroy(),
    });
  }

  private spawnMeleeSlashEffect(x: number, y: number, angle: number) {
    const slash = this.add.graphics({ x, y }).setDepth(2000);
    slash.lineStyle(3, 0xef4444, 0.95);
    slash.beginPath();
    slash.arc(0, 0, 20, angle - 0.75, angle + 0.75, false);
    slash.strokePath();

    this.tweens.add({
      targets: slash,
      alpha: 0,
      scaleX: 1.45,
      scaleY: 1.45,
      duration: 150,
      ease: 'Quad.easeOut',
      onComplete: () => slash.destroy(),
    });
  }

  private registerKillCombo(x: number, y: number) {
    this.comboKillCount++;

    if (this.comboTimerEvent) {
      this.comboTimerEvent.destroy();
    }

    this.comboTimerEvent = this.time.addEvent({
      delay: 2500,
      callback: () => {
        this.comboKillCount = 0;
      },
    });

    if (this.comboKillCount >= 3) {
      const isHighCombo = this.comboKillCount >= 8;
      const comboLabel = `${this.comboKillCount}x COMBO!`;
      const color = isHighCombo ? '#facc15' : '#ef4444';
      this.spawnFloatingText(x, y - 24, comboLabel, color, true);

      if (this.comboKillCount === 3 || this.comboKillCount === 5 || this.comboKillCount === 8 || this.comboKillCount === 12) {
        soundEngine.playNova();
        this.cameras.main.shake(120, 0.008);
      }
    }
  }
}
