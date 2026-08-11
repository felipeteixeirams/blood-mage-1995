import Phaser from 'phaser';
import { Player } from '../objects/Player';
import { Enemy } from '../objects/Enemy';
import { Scavengeable, ScavengeableType } from '../objects/Scavengeable';
import { Projectile } from '../objects/Projectile';
import { Collectible } from '../objects/Collectible';
import { LootSprite } from '../objects/Loot';
import { LootSystem } from '../systems/LootSystem';
import { PlayerStats, WaveConfig, UpgradeOption, BiomeType, SpellConfig } from '../../types/game';
import wavesData from '../../data/waves.json';
import upgradesData from '../../data/upgrades.json';
import spellsData from '../../data/spells.json';
import { soundEngine } from '../../utils/soundEngine';
import HapticFeedback from '../../utils/haptics';
import { useGameStore } from '../../store/gameStore';
import { telemetry } from '../../utils/telemetry';
import { CombatFeel } from '../systems/CombatFeel';
import { worldManager } from '../systems/WorldManager';
import { ContractSystem } from '../systems/ContractSystem';
import AchievementSystem from '../systems/AchievementSystem';

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
  private scavengeablesGroup!: Phaser.Physics.Arcade.StaticGroup;
  private npcsGroup!: Phaser.Physics.Arcade.StaticGroup;
  private currentScavengeable: Scavengeable | null = null;
  private scavengeTimeElapsed: number = 0;
  private isScavenging: boolean = false;
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
  private achievements: AchievementSystem = new AchievementSystem();
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
  private corpsePointer?: Phaser.GameObjects.Sprite;

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

  // Spawn queue for density throttling
  private pendingEnemySpawns: { x: number; y: number; monsterId: string; room: RoomData }[] = [];

  // Drag-to-Aim States
  private activeDragAimSpellId: string | null = null;
  private dragAimVector = new Phaser.Math.Vector2(0, 0);
  private dragAimGraphics!: Phaser.GameObjects.Graphics;
  private threatIndicatorGraphics!: Phaser.GameObjects.Graphics;

  // Gamepad States
  private lastGamepadButtonStates: boolean[] = [];

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
    this.scavengeablesGroup = this.physics.add.staticGroup();
    this.npcsGroup = this.physics.add.staticGroup();
    this.enemiesGroup = this.physics.add.group({ runChildUpdate: false });
    this.playerProjectilesGroup = this.physics.add.group({ runChildUpdate: true });
    this.enemyProjectilesGroup = this.physics.add.group({ runChildUpdate: true });
    this.collectiblesGroup = this.physics.add.group();
    this.lootGroup = this.physics.add.group();

    this.dungeonGenerator = new DungeonGenerator(this, this.wallsGroup, this.chestsGroup);

    // 3. Generate Dungeon Map Layout
    this.buildDungeonMap(mapW, mapH, this.currentFloorDepth);

    // Register event listener for NPC interaction
    window.addEventListener('trigger-npc', (e: any) => {
      const npcType = e.detail;
      useGameStore.getState().setActiveNPC(npcType);
    });

    // Register event listener for player respawn
    window.addEventListener('respawn-player', () => {
      const spawnRoom = this.rooms[0];
      if (spawnRoom && this.player) {
        // Capture death spot coords
        const deathX = this.player.x;
        const deathY = this.player.y;

        // Teleport to Safe Zone
        this.player.setPosition(spawnRoom.centerX, spawnRoom.centerY);

        // Reset stats & penalties
        this.player.stats.isDefinitivelyDead = false;
        this.player.stats.isUnconscious = false;
        this.player.stats.knockoutCount = 0;
        this.player.stats.hp = this.player.stats.maxHp;
        this.player.stats.mana = this.player.stats.maxMana;
        this.player.stats.currentXp = 0; // XP progress penalty
        this.player.setAlpha(1.0);
        this.player.clearTint();

        const store = useGameStore.getState();

        // Destroy previous player corpse if it exists
        this.scavengeablesGroup.getChildren().forEach(scav => {
          const s = scav as Scavengeable;
          if (s.scavengeType === 'player_corpse') {
            s.destroy();
          }
        });

        // Save current equipment to the corpse in the store
        store.setDroppedCorpse({
          hasDroppedCorpse: true,
          zone: 'calabouco',
          x: deathX,
          y: deathY,
          droppedTimestamp: Date.now(),
          equipment: store.equipment,
          curatives: this.player.stats.curatives
        });

        // Clear death screens
        store.setDefinitivelyDead(false);
        store.setGameOverStats(null);
        
        // Push stats to store, then clear inventory (which updates the store's stats again)
        store.setPlayerStats({ ...this.player.stats });
        store.clearInventoryOnDeath();
        // Update local reference to match the cleared store
        this.player.stats.curatives = { bandages: 0, antidotes: 0, antibiotics: 0 };

        // Spawn a lost corpse scavengeable at the death spot!
        const lostCorpse = new Scavengeable(this, deathX, deathY, 'player_corpse');
        this.scavengeablesGroup.add(lostCorpse);
        this.depthGroup.add(lostCorpse);

        // Print atmospheric message
        store.addLootLog("Você sente que a terra consome seus restos... olhos carniceiros espreitam seus pertences perdidos. Apresse-se, Bloodmage.");
      }
    });

    // Register event listener for touch-scavenge button
    window.addEventListener('trigger-scavenge', () => {
      let closestScav: Scavengeable | null = null;
      let closestDist = 48;
      if (this.player && this.player.active && !this.player.stats.isUnconscious && !this.player.stats.isDefinitivelyDead) {
        this.scavengeablesGroup.getChildren().forEach((scavObj) => {
          const scav = scavObj as unknown as Scavengeable;
          if (!scav.active || scav.isScavenged) return;
          const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, scav.x, scav.y);
          if (dist < closestDist) {
            closestDist = dist;
            closestScav = scav;
          }
        });
      }
      if (closestScav) {
        this.startScavenging(closestScav);
      }
    });

    // --- VISUAL: Darkness overlay + Lighting ---
    this.dragAimGraphics = this.add.graphics().setDepth(2050);
    this.threatIndicatorGraphics = this.add.graphics().setDepth(2100).setScrollFactor(0);
    this.darknessOverlay = this.add.graphics().setDepth(1990).setScrollFactor(0);
    this.darknessOverlay.fillStyle(0x050510, 0.35);
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
          .setAlpha(0.7 + Math.random() * 0.3)
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
          sprite.setAlpha(0.65 + Math.random() * 0.35);
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
    
    // UI Pointer for Corpse
    this.corpsePointer = this.add.sprite(0, 0, 'icon_skull')
      .setScrollFactor(0)
      .setDepth(3000)
      .setScale(0.8)
      .setTint(0xff0000)
      .setVisible(false);

    // Zoom adaptativo: encaixa o jogo perfeitamente em qualquer tela landscape.
    // Usa o menor eixo (altura em landscape) como referência para não cortar verticalmente.
    const screenH = this.cameras.main.height || window.innerHeight;
    const screenW = this.cameras.main.width || window.innerWidth;
    // Referência: altura de 700px → zoom 1.0; escala proporcional + clamp
    const adaptiveZoom = Math.max(0.50, Math.min(1.15, screenH / 700));
    this.cameras.main.setZoom(adaptiveZoom);

    // 4. Keyboard Controls
    if (this.input.keyboard) {
      this.keys = this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,Q,E,SPACE,R,SHIFT,F,C,Z,X,V,ONE,TWO,THREE,FOUR,FIVE,SIX') as Record<string, Phaser.Input.Keyboard.Key>;
    }

    // Listen for curative UI clicks
    window.addEventListener('use-curative', (e: any) => {
      if (e.detail) {
        this.useCurativeItem(e.detail);
      }
    });

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

    // Drag-to-Aim Event Listeners
    this.handleDragAimStart = this.handleDragAimStart.bind(this);
    this.handleDragAimMove = this.handleDragAimMove.bind(this);
    this.handleDragAimEnd = this.handleDragAimEnd.bind(this);

    window.addEventListener('drag-aim-start', this.handleDragAimStart as any);
    window.addEventListener('drag-aim-move', this.handleDragAimMove as any);
    window.addEventListener('drag-aim-end', this.handleDragAimEnd as any);

    const handleCosmeticTint = () => {
      if (this.player) {
        this.player.applyCosmeticTint();
      }
    };
    window.addEventListener('update-cosmetic-tint', handleCosmeticTint);

    this.events.once('shutdown', () => {
      window.removeEventListener('trigger-blood-nova', handleNovaEvent);
      window.removeEventListener('drag-aim-start', this.handleDragAimStart as any);
      window.removeEventListener('drag-aim-move', this.handleDragAimMove as any);
      window.removeEventListener('drag-aim-end', this.handleDragAimEnd as any);
      window.removeEventListener('update-cosmetic-tint', handleCosmeticTint);
      if (this.flickerTimer) this.flickerTimer.destroy();
    });
    this.events.once('destroy', () => {
      window.removeEventListener('trigger-blood-nova', handleNovaEvent);
      window.removeEventListener('drag-aim-start', this.handleDragAimStart as any);
      window.removeEventListener('drag-aim-move', this.handleDragAimMove as any);
      window.removeEventListener('drag-aim-end', this.handleDragAimEnd as any);
      window.removeEventListener('update-cosmetic-tint', handleCosmeticTint);
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

  private getActiveEnemyCap(): number {
    const depth = this.currentFloorDepth;
    if (depth >= 5) return 30;
    if (depth === 4) return 24;
    return 18;
  }

  private checkAndSpawnPendingEnemies() {
    const cap = this.getActiveEnemyCap();
    while (this.enemiesGroup.countActive(true) < cap && this.pendingEnemySpawns.length > 0) {
      const pending = this.pendingEnemySpawns.shift();
      if (pending) {
        const enemy = new Enemy(this, pending.x, pending.y, pending.monsterId);
        // Set room patrol boundaries
        enemy.patrolP1 = { x: pending.room.x + 40, y: pending.room.y + 40 };
        enemy.patrolP2 = { x: pending.room.x + pending.room.width - 40, y: pending.room.y + pending.room.height - 40 };

        this.enemiesGroup.add(enemy);
        this.depthGroup.add(enemy);
      }
    }
  }

  /**
   * Builds procedural 3x3 interconnected Dungeon Map with Rooms, Corridors, Walls, Chests & Enemies
   */
  private buildDungeonMap(mapW: number, mapH: number, floorDepth: number) {
    // Clear pending spawns
    this.pendingEnemySpawns = [];

    // Initialize contracts on first floor
    if (floorDepth === 1) {
      ContractSystem.initRunContracts();
    }

    // Determine Biome based on Floor Depth
    let biome: BiomeType = 'fosso_chagas';
    if (floorDepth >= 5) {
      biome = 'santuario_sangue';
    } else if (floorDepth >= 3) {
      biome = 'catacumbas_martires';
    }

    useGameStore.getState().setCurrentBiome(biome);

    // Apply WorldManager environmental biome changes (Lighting & Audio transitions)
    const { isTransitionIndoorOutdoor, previousIndoorState } = worldManager.setBiome(biome);
    const envConfig = worldManager.getCurrentConfig();
    soundEngine.updateEnvironmentAudio(envConfig.isIndoor, envConfig.reverbLevel);

    // Efeito de Adaptação de Pupila (Pupil Light Adaptation): Flash ao mudar de caverna/ambiente fechado para espaço aberto
    if (isTransitionIndoorOutdoor) {
      if (!envConfig.isIndoor) {
        // Entrando em ambiente aberto ensolarado/iluminado: Flash brilhante de adaptação
        this.cameras.main.flash(350, 255, 255, 240);
      } else {
        // Entrando em subterrâneo/caverna fechada: Flash escuro de íris dilantando
        this.cameras.main.flash(300, 20, 10, 15);
      }
    }

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

    // Clear old NPCs
    this.npcsGroup.clear(true, true);

    // Spawn Safe Village NPCs in Spawn Room (Room 0)
    // 1. Cleric (Curandeiro)
    const cleric = this.npcsGroup.create(spawnRoom.centerX - 120, spawnRoom.centerY - 80, 'spr_cultist');
    cleric.setTint(0x38bdf8); // Blue glow
    cleric.setData('npcType', 'cleric');
    this.depthGroup.add(cleric);

    // 2. Alchemist (Alquimista)
    const alchemist = this.npcsGroup.create(spawnRoom.centerX + 120, spawnRoom.centerY - 80, 'spr_bloodmage');
    alchemist.setTint(0xc084fc); // Purple glow
    alchemist.setData('npcType', 'alchemist');
    this.depthGroup.add(alchemist);

    // 3. Blacksmith (Ferreiro)
    const blacksmith = this.npcsGroup.create(spawnRoom.centerX - 120, spawnRoom.centerY + 80, 'spr_skeleton');
    blacksmith.setTint(0xfacc15); // Golden glow
    blacksmith.setData('npcType', 'blacksmith');
    this.depthGroup.add(blacksmith);

    // 4. Elder (Ancião)
    const elder = this.npcsGroup.create(spawnRoom.centerX + 120, spawnRoom.centerY + 80, 'spr_boss');
    elder.setTint(0xf87171); // Soft Red glow
    elder.setData('npcType', 'elder');
    this.depthGroup.add(elder);

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

        if (bossId === 'necro_lord_boss' || bossId.includes('boss')) {
          useGameStore.getState().triggerOnboardingEvent('firstBossSeen', 'CUIDADO: O Senhor das Chagas despertou! Ele entrará em fúria se ferido!');
        }

        // Add Elite Bodyguards scaled by blood_tide
        const hasBloodTide = useGameStore.getState().activeModifiers.includes('blood_tide');
        const spawnMultiplier = hasBloodTide ? 1.4 : 1.0;
        const bodyguardCount = Math.round(2 * spawnMultiplier);
        for (let i = 0; i < bodyguardCount; i++) {
          const offset = i === 0 ? -90 : (i === 1 ? 90 : (i === 2 ? -140 : 140));
          const guard = new Enemy(this, room.centerX + offset, room.centerY + 50, 'cultist_acolyte');
          this.enemiesGroup.add(guard);
          this.depthGroup.add(guard);
          this.totalFloorMonsters++;
        }
      } else {
        // Standard Chamber: 2 to 4 enemies in patrol/guard positions scaled by blood_tide
        const hasBloodTide = useGameStore.getState().activeModifiers.includes('blood_tide');
        const spawnMultiplier = hasBloodTide ? 1.4 : 1.0;
        let monsterCount = 2 + Math.floor(Math.random() * 2) + Math.min(2, floorDepth - 1);
        monsterCount = Math.round(monsterCount * spawnMultiplier);

        for (let i = 0; i < monsterCount; i++) {
          const monsterId = Phaser.Utils.Array.GetRandom(currentWave.monsterPool);
          const spawnX = room.x + 50 + Math.random() * (room.width - 100);
          const spawnY = room.y + 50 + Math.random() * (room.height - 100);

          this.pendingEnemySpawns.push({ x: spawnX, y: spawnY, monsterId, room });
          this.totalFloorMonsters++;
        }
      }

      // Spawn Scavengeables in non-spawn rooms
      if (Math.random() < 0.75) {
        const numScav = Math.random() < 0.5 ? 1 : 2;
        for (let i = 0; i < numScav; i++) {
          const sx = room.x + 50 + Math.random() * (room.width - 100);
          const sy = room.y + 50 + Math.random() * (room.height - 100);
          const stype = Phaser.Utils.Array.GetRandom(['skeleton', 'corpse', 'crate']) as any;
          const scavObj = new Scavengeable(this, sx, sy, stype);
          this.scavengeablesGroup.add(scavObj);
          this.depthGroup.add(scavObj);
        }
      }
    });

    // Initial spawn push up to cap
    this.checkAndSpawnPendingEnemies();

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
      // Performance optimization: skip calculations for inactive enemies or those already in combat/frenzy
      if (enemy.active && enemy.aiState !== 'combat' && enemy.aiState !== 'frenzy') {
        const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, x, y);
        const maxHearingRange = loudness * (enemy.config.hearingSensitivity || 1.0);
        // Only perform the raycast if the enemy is close enough to potentially hear it
        if (dist <= maxHearingRange) {
          const hasWall = !this.hasLineOfSight(x, y, enemy.x, enemy.y);
          enemy.onHearNoise(x, y, loudness, hasWall);
        }
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

    let success = false;
    if (skillKey === 'nova' && this.player.castNova()) {
      this.executeNovaEffect();
      this.emitSound(this.player.x, this.player.y, 500); // Massive spell noise!
      ContractSystem.onSpellCasted('hellfire_nova', this);
      success = true;
    } else if (skillKey === 'syphon' && this.player.castSyphon()) {
      this.executeSyphonEffect();
      this.emitSound(this.player.x, this.player.y, 420);
      ContractSystem.onSpellCasted('syphon_soul', this);
      success = true;
    } else if (skillKey === 'bone_shield' && this.player.castBoneShield()) {
      this.executeBoneShieldEffect();
      this.emitSound(this.player.x, this.player.y, 350);
      ContractSystem.onSpellCasted('bone_shield', this);
      success = true;
    } else if (skillKey === 'crimson_scythe' && this.player.castCrimsonScythe()) {
      this.executeCrimsonScytheEffect();
      this.emitSound(this.player.x, this.player.y, 450);
      ContractSystem.onSpellCasted('crimson_scythe', this);
      success = true;
    } else if (skillKey === 'blood_ritual_circle' && this.player.castRitualCircle()) {
      this.executeRitualCircleEffect();
      this.emitSound(this.player.x, this.player.y, 400);
      ContractSystem.onSpellCasted('blood_ritual_circle', this);
      success = true;
    } else if (skillKey === 'hemomancy_beam' && this.player.castHemomancyBeam()) {
      this.executeHemomancyBeamEffect();
      this.emitSound(this.player.x, this.player.y, 520);
      ContractSystem.onSpellCasted('hemomancy_beam', this);
      success = true;
    }

    if (success) {
      useGameStore.getState().triggerOnboardingEvent('firstSkillCast', 'DICA: Acompanhe o indicador de cooldown piscante sobre cada habilidade!');
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

    // Level up choice applied — game keeps running (no pause)
  }

  private triggerBloodNova() {
    this.executeNovaEffect();
  }

  update(time: number, delta: number) {
    if (this.isPaused) return;

    const store = useGameStore.getState();

    // Handle corpse compass pointer
    if (this.corpsePointer) {
      const corpse = store.playerStats.droppedCorpse;
      if (corpse.hasDroppedCorpse && this.player && this.player.active && !this.player.stats.isDefinitivelyDead) {
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, corpse.x, corpse.y);
        const cw = this.cameras.main.width;
        const ch = this.cameras.main.height;
        // Don't show if the corpse is visible on screen (approx half screen width/height)
        if (dist > Math.min(cw, ch) / 2) {
          this.corpsePointer.setVisible(true);
          const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, corpse.x, corpse.y);
          // Calculate edge position
          const padding = 40;
          let px = cw / 2 + Math.cos(angle) * (cw / 2 - padding);
          let py = ch / 2 + Math.sin(angle) * (ch / 2 - padding);
          // Keep it within screen bounds
          px = Phaser.Math.Clamp(px, padding, cw - padding);
          py = Phaser.Math.Clamp(py, padding, ch - padding);
          this.corpsePointer.setPosition(px, py);
          // Pulse scale
          this.corpsePointer.setScale(0.8 + Math.sin(time * 0.005) * 0.1);
        } else {
          this.corpsePointer.setVisible(false);
        }
      } else {
        this.corpsePointer.setVisible(false);
      }
    }

    // Find closest NPC in range
    let closestNPC: Phaser.Physics.Arcade.Sprite | null = null;
    let closestNPCDist = 50; // Interaction range of 50px
    if (this.player && this.player.active && !this.player.stats.isUnconscious && !this.player.stats.isDefinitivelyDead) {
      this.npcsGroup.getChildren().forEach((npcObj) => {
        const npc = npcObj as unknown as Phaser.Physics.Arcade.Sprite;
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, npc.x, npc.y);
        if (dist < closestNPCDist) {
          closestNPCDist = dist;
          closestNPC = npc;
        }
      });
    }

    if (closestNPC) {
      const type = (closestNPC as Phaser.Physics.Arcade.Sprite).getData('npcType');
      if (store.closestNPCType !== type) {
        store.setClosestNPCType(type);
      }
    } else {
      if (store.closestNPCType !== null) {
        store.setClosestNPCType(null);
      }
    }

    // Find closest scavengeable in range for HUD prompt
    let closestScav: Scavengeable | null = null;
    let closestDist = 48; // Max interaction distance
    if (this.player && this.player.active && !this.player.stats.isUnconscious && !this.player.stats.isDefinitivelyDead) {
      this.scavengeablesGroup.getChildren().forEach((scavObj) => {
        const scav = scavObj as unknown as Scavengeable;
        if (!scav.active || scav.isScavenged) return;
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, scav.x, scav.y);
        if (dist < closestDist) {
          closestDist = dist;
          closestScav = scav;
        }
      });
    }
    if (closestScav) {
      const activeScav = closestScav as unknown as Scavengeable;
      if (!store.activeScavengeable || store.activeScavengeable.id !== activeScav.scavengeType + '_' + activeScav.x) {
        store.setActiveScavengeable({
          id: activeScav.scavengeType + '_' + activeScav.x,
          type: activeScav.scavengeType,
          duration: activeScav.duration
        });
      }
    } else {
      if (store.activeScavengeable) {
        store.setActiveScavengeable(null);
        if (this.isScavenging) {
          this.cancelScavenging();
        }
      }
    }

    // Process scavenging tick
    if (this.isScavenging) {
      if (this.player && this.player.active) {
        this.player.setVelocity(0, 0);
      }

      // Cancel scavenging if trying to move
      if (this.keys && (this.keys.W.isDown || this.keys.S.isDown || this.keys.A.isDown || this.keys.D.isDown || this.keys.UP.isDown || this.keys.DOWN.isDown || this.keys.LEFT.isDown || this.keys.RIGHT.isDown)) {
        this.cancelScavenging();
      } else {
        this.scavengeTimeElapsed += delta;
        const pct = Math.min(100, Math.round((this.scavengeTimeElapsed / this.currentScavengeable!.duration) * 100));
        store.setScavengeProgress(pct);

        if (this.scavengeTimeElapsed >= this.currentScavengeable!.duration) {
          this.completeScavenging();
        }
      }
    }

    // Process gamepad inputs if connected
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gp = gamepads.find(g => g !== null);
    if (gp) {
      this.handleGamepadInput(gp);
    }

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
      if (Phaser.Input.Keyboard.JustDown(this.keys.E)) {
        if (closestNPC) {
          const type = (closestNPC as Phaser.Physics.Arcade.Sprite).getData('npcType');
          store.setActiveNPC(type);
        } else if (closestScav) {
          this.startScavenging(closestScav);
        } else {
          this.triggerSkill('syphon');
        }
      } else if (Phaser.Input.Keyboard.JustDown(this.keys.TWO)) {
        this.triggerSkill('syphon');
      }
      if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE) || Phaser.Input.Keyboard.JustDown(this.keys.THREE)) {
        this.triggerSkill('bone_shield');
      }
      if (Phaser.Input.Keyboard.JustDown(this.keys.R) || Phaser.Input.Keyboard.JustDown(this.keys.FOUR)) {
        this.triggerSkill('crimson_scythe');
      }
      if (Phaser.Input.Keyboard.JustDown(this.keys.SHIFT)) {
        this.player.triggerDash();
      }
      if (Phaser.Input.Keyboard.JustDown(this.keys.C) || Phaser.Input.Keyboard.JustDown(this.keys.FIVE)) {
        this.triggerSkill('blood_ritual_circle');
      }
      if (Phaser.Input.Keyboard.JustDown(this.keys.F) || Phaser.Input.Keyboard.JustDown(this.keys.SIX)) {
        this.triggerSkill('hemomancy_beam');
      }

      // Curatives hotkeys: Z (Bandages), X (Antidotes), V (Antibiotics)
      if (Phaser.Input.Keyboard.JustDown(this.keys.Z)) {
        this.useCurativeItem('bandages');
      }
      if (Phaser.Input.Keyboard.JustDown(this.keys.X)) {
        this.useCurativeItem('antidotes');
      }
      if (Phaser.Input.Keyboard.JustDown(this.keys.V)) {
        this.useCurativeItem('antibiotics');
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

    // Status Condition DoT (bleeding/poison) can trigger Definitive Death on its own,
    // outside the normal enemy-hit flow — catch that transition here.
    if (this.player.stats.isDefinitivelyDead && !this.isPaused) {
      this.triggerGameOver();
      return;
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
        const distToPlayer = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);

        // ⚡ Bolt's Optimization: Skip expensive wall raycasting (hasLineOfSight) for out-of-range passive enemies.
        // For combat-related states, we retain accurate wall-collision details to prevent logic regressions
        // like wall-hacking projectiles (up to 800px). For idle/patrol/investigating states, we prune
        // raycasting entirely if they are outside their maximum vision range (defaults to 320px).
        let hasWallBetween = true;
        const isCombatState = enemy.aiState === 'combat' || enemy.aiState === 'frenzy' || enemy.aiState === 'flee';

        if (isCombatState) {
          hasWallBetween = distToPlayer > 800 ? true : !this.hasLineOfSight(enemy.x, enemy.y, this.player.x, this.player.y);
        } else {
          const maxVisionDist = enemy.config.visionDistance || 320;
          if (distToPlayer <= maxVisionDist) {
            hasWallBetween = !this.hasLineOfSight(enemy.x, enemy.y, this.player.x, this.player.y);
          }
        }

        const updateResult = enemy.updateEnemy(time, delta, this.player.x, this.player.y, hasWallBetween, activeEnemiesList);

        if (updateResult.attack) {
          if (updateResult.attackType === 'ranged' || enemy.config.behavior === 'ranged' || enemy.config.behavior === 'boss') {
            // Fire ranged energy bolt
            const proj = new Projectile(this, enemy.x, enemy.y, 'proj_energy_bolt');
            const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
            proj.fire(enemy.x, enemy.y, angle, 220, enemy.config.damage, true, enemy.config.statusEffectOnHit);
            this.enemyProjectilesGroup.add(proj);
          } else {
            // Melee hit player
            this.playerHitByEnemy(updateResult.damage, enemy.config.statusEffectOnHit);
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

    // Clear and redraw Drag-to-Aim previews
    if (this.dragAimGraphics) {
      this.dragAimGraphics.clear();

      if (this.activeDragAimSpellId) {
        const aimAngle = this.player.getAimAngle();
        const startX = this.player.x;
        const startY = this.player.y;

        this.dragAimGraphics.lineStyle(2, 0xef4444, 0.85);
        this.dragAimGraphics.fillStyle(0xef4444, 0.22);

        if (this.activeDragAimSpellId === 'crimson_scythe') {
          // Arc of 120° in aim direction (radius 95px)
          const radius = 95;
          const startRad = aimAngle - Math.PI / 3;
          const endRad = aimAngle + Math.PI / 3;

          this.dragAimGraphics.beginPath();
          this.dragAimGraphics.moveTo(startX, startY);
          this.dragAimGraphics.arc(startX, startY, radius, startRad, endRad, false);
          this.dragAimGraphics.closePath();
          this.dragAimGraphics.strokePath();
          this.dragAimGraphics.fillPath();
        } else if (this.activeDragAimSpellId === 'hemomancy_beam') {
          // Beam preview of length 480px and width 16px
          const beamLength = 480;
          const width = 16;

          this.dragAimGraphics.beginPath();
          const dx = Math.cos(aimAngle);
          const dy = Math.sin(aimAngle);
          const px = -dy * (width / 2);
          const py = dx * (width / 2);

          this.dragAimGraphics.moveTo(startX + px, startY + py);
          this.dragAimGraphics.lineTo(startX - px, startY - py);
          this.dragAimGraphics.lineTo(startX - px + dx * beamLength, startY - py + dy * beamLength);
          this.dragAimGraphics.lineTo(startX + px + dx * beamLength, startY + py + dy * beamLength);
          this.dragAimGraphics.closePath();
          this.dragAimGraphics.strokePath();
          this.dragAimGraphics.fillPath();
        } else if (this.activeDragAimSpellId === 'blood_ritual_circle') {
          // Circle target at player.x + aimVec * 120, radius 80px
          const aimVec = this.player.getAimVector();
          const targetX = Phaser.Math.Clamp(this.player.x + aimVec.x * 120, 40, this.physics.world.bounds.width - 40);
          const targetY = Phaser.Math.Clamp(this.player.y + aimVec.y * 120, 40, this.physics.world.bounds.height - 40);

          this.dragAimGraphics.strokeCircle(targetX, targetY, 80);
          this.dragAimGraphics.fillCircle(targetX, targetY, 80);

          this.dragAimGraphics.lineStyle(1.5, 0xef4444, 0.4);
          this.dragAimGraphics.lineBetween(startX, startY, targetX, targetY);
        } else if (this.activeDragAimSpellId === 'hellfire_nova') {
          // Circle around player with radius 200px
          this.dragAimGraphics.strokeCircle(startX, startY, 200);
          this.dragAimGraphics.fillCircle(startX, startY, 200);
        }
      }
    }

    // Offscreen Threat Indicator (Silent Hill-style edge chevrons)
    if (this.threatIndicatorGraphics) {
      this.threatIndicatorGraphics.clear();

      const viewW = this.cameras.main.width || window.innerWidth;
      const viewH = this.cameras.main.height || window.innerHeight;
      const cx = viewW / 2;
      const cy = viewH / 2;

      let closestOffscreenEnemy: Enemy | null = null;
      let minOffscreenDistance = Infinity;
      let alertCount = 0;

      this.enemiesGroup.getChildren().forEach((enemyObj: any) => {
        const enemy = enemyObj as Enemy;
        if (enemy.active) {
          const isThreat = enemy.aiState === 'combat' || enemy.aiState === 'frenzy' || enemy.aiState === 'investigating';
          if (isThreat) {
            if (enemy.aiState === 'combat' || enemy.aiState === 'frenzy') {
              alertCount++;
            }

            // Check if offscreen
            const screenX = (enemy.x - this.cameras.main.scrollX) * this.cameras.main.zoom;
            const screenY = (enemy.y - this.cameras.main.scrollY) * this.cameras.main.zoom;
            const isOffscreen = screenX < 0 || screenX > viewW || screenY < 0 || screenY > viewH;

            if (isOffscreen) {
              const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
              if (dist < minOffscreenDistance) {
                minOffscreenDistance = dist;
                closestOffscreenEnemy = enemy;
              }
            }
          }
        }
      });

      if (closestOffscreenEnemy) {
        const enemy = closestOffscreenEnemy as Enemy;
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, enemy.x, enemy.y);

        // Project onto border
        const edgeX = cx + Math.cos(angle) * (cx - 25);
        const edgeY = cy + Math.sin(angle) * (cy - 25);

        const indicatorX = Phaser.Math.Clamp(edgeX, 25, viewW - 25);
        const indicatorY = Phaser.Math.Clamp(edgeY, 25, viewH - 25);

        const pulse = 0.4 + 0.3 * Math.sin(time * 0.008);
        const finalAlpha = Phaser.Math.Clamp(pulse + (alertCount * 0.03), 0.3, 0.95);
        const color = (enemy.aiState === 'combat' || enemy.aiState === 'frenzy') ? 0xef4444 : 0xf59e0b;

        this.threatIndicatorGraphics.lineStyle(2, color, finalAlpha);
        this.threatIndicatorGraphics.fillStyle(color, finalAlpha * 0.4);

        const size = 16;
        const px = Math.cos(angle) * size;
        const py = Math.sin(angle) * size;
        const tx = -Math.sin(angle) * (size * 0.6);
        const ty = Math.cos(angle) * (size * 0.6);

        this.threatIndicatorGraphics.beginPath();
        this.threatIndicatorGraphics.moveTo(indicatorX + px, indicatorY + py);
        this.threatIndicatorGraphics.lineTo(indicatorX - px + tx, indicatorY - py + ty);
        this.threatIndicatorGraphics.lineTo(indicatorX - px - tx, indicatorY - py - ty);
        this.threatIndicatorGraphics.closePath();
        this.threatIndicatorGraphics.fillPath();
        this.threatIndicatorGraphics.strokePath();

        // 4.2 — Distorção de Áudio Direcional (Silent Hill Radio Static)
        const dx = enemy.x - this.player.x;
        const dy = enemy.y - this.player.y;
        const dist = Math.hypot(dx, dy);
        const relativeX = dist > 0 ? dx / dist : 0;
        const isCombatThreat = enemy.aiState === 'combat' || enemy.aiState === 'frenzy';
        soundEngine.updateSpatialThreat(relativeX, 0, isCombatThreat);
      } else {
        soundEngine.updateSpatialThreat(0, 0, false);
      }

      // 4.3 & 4.4 — Vinheta Pulsante & Iluminação Dinâmica (WorldManager)
      if (this.darknessOverlay) {
        this.darknessOverlay.clear();

        worldManager.updateLighting(delta);
        const envConfig = worldManager.getCurrentConfig();

        const isBoss = this.isBossActive();
        const baseColor = (alertCount > 10 || isBoss) ? 0x2d0208 : envConfig.darknessColor;
        const maxOverlayAlpha = (alertCount > 10 || isBoss)
          ? (0.55 + 0.25 * Math.sin(time * 0.012)) // Rapid high danger pulse
          : (alertCount > 3 ? (envConfig.darknessAlpha + 0.1 * Math.sin(time * 0.003)) : envConfig.darknessAlpha);

        const playerHpRatio = this.player.stats.hp / this.player.stats.maxHp;
        const hpMultiplier = playerHpRatio < 0.3 ? 0.75 : 1.0;
        const targetRadius = worldManager.currentLightRadius * hpMultiplier;

        // Draw concentric rings from center to create smooth radial light hole
        const numRings = 10;
        for (let r = 0; r < numRings; r++) {
          const outerRadius = ((r + 1) / numRings) * targetRadius;
          const ringAlpha = (r / numRings) * maxOverlayAlpha;

          this.darknessOverlay.fillStyle(baseColor, ringAlpha);
          this.darknessOverlay.fillCircle(cx, cy, outerRadius);
        }

        // Fill rest of the screen
        this.darknessOverlay.lineStyle(viewW, baseColor, maxOverlayAlpha);
        this.darknessOverlay.strokeCircle(cx, cy, targetRadius + viewW / 2);
      }
    }
  }

  private isBossActive(): boolean {
    return this.enemiesGroup.getChildren().some((enemyObj: any) => {
      const enemy = enemyObj as Enemy;
      return enemy.active && enemy.config.behavior === 'boss';
    });
  }

  private handleDragAimStart(e: CustomEvent<{ spellId: string }>) {
    this.activeDragAimSpellId = e.detail.spellId;
    this.dragAimVector.set(0, 0);
  }

  private handleDragAimMove(e: CustomEvent<{ spellId: string, dx: number, dy: number }>) {
    if (this.activeDragAimSpellId !== e.detail.spellId) return;
    this.dragAimVector.set(e.detail.dx, e.detail.dy);

    // Rotate player to face dragging direction
    if (e.detail.dx !== 0 || e.detail.dy !== 0) {
      this.player.setAimInput(e.detail.dx, e.detail.dy);
    }
  }

  private handleDragAimEnd(e: CustomEvent<{ spellId: string, dx: number, dy: number, isDrag: boolean }>) {
    if (this.activeDragAimSpellId !== e.detail.spellId) return;

    const wasDrag = e.detail.isDrag;
    this.activeDragAimSpellId = null;
    this.dragAimGraphics.clear();

    if (wasDrag) {
      // Cast the skill in the dragged direction
      if (e.detail.dx !== 0 || e.detail.dy !== 0) {
        this.player.setAimInput(e.detail.dx, e.detail.dy);
      }

      const skillKey = this.getSkillKeyFromSpellId(e.detail.spellId);
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

  private handleGamepadInput(gp: Gamepad) {
    if (this.isPaused) return;

    // 1. Move Inputs (Left Stick: axes 0 and 1)
    let mx = gp.axes[0];
    let my = gp.axes[1];
    // Apply circular deadzone of 0.15
    const moveLen = Math.hypot(mx, my);
    if (moveLen < 0.15) {
      mx = 0;
      my = 0;
    } else {
      mx /= moveLen;
      my /= moveLen;
    }
    this.player.setMoveInput(mx, my);

    // 2. Aim Inputs (Right Stick: axes 2 and 3)
    let ax = gp.axes[2];
    let ay = gp.axes[3];
    const aimLen = Math.hypot(ax, ay);
    if (aimLen >= 0.15) {
      this.player.setAimInput(ax, ay);
    }

    // 3. Button presses (just-down edge detection)
    const currentStates = gp.buttons.map(b => b.pressed);

    const justPressed = (idx: number) => {
      const prev = this.lastGamepadButtonStates[idx] || false;
      const curr = currentStates[idx] || false;
      return curr && !prev;
    };

    // Button A (0) -> Dash
    if (justPressed(0)) {
      this.player.triggerDash();
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

  private firePlayerBloodBolt() {
    const aimVec = this.player.getAimVector();
    const baseAngle = Math.atan2(aimVec.y, aimVec.x);
    const count = 1 + this.player.stats.projectileBonus;
    const spreadAngle = 0.18; // spread in radians

    for (let i = 0; i < count; i++) {
      const offset = (i - (count - 1) / 2) * spreadAngle;
      const angle = baseAngle + offset;

      const boltCfg = (spellsData as Record<string, SpellConfig>)['blood_bolt'];
      const proj = new Projectile(this, this.player.x, this.player.y, 'proj_blood_bolt');
      proj.fire(
        this.player.x,
        this.player.y,
        angle,
        boltCfg.projectileSpeed,
        boltCfg.baseDamage * this.player.stats.damageMultiplier,
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
          const novaDmgCfg = (spellsData as Record<string, SpellConfig>)['hellfire_nova'].baseDamage;
          const novaDamage = Math.round(novaDmgCfg * this.player.stats.damageMultiplier);

          const wasLowHp = (enemy.hp <= enemy.maxHp * 0.15);
          const isDead = enemy.takeDamage(novaDamage);
          CombatFeel.handleHitImpact(this, novaDamage, false, true, enemy.hp / enemy.maxHp);

          this.spawnFloatingText(enemy.x, enemy.y, `${novaDamage}!`, '#f97316', true);
          const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, enemy.x, enemy.y);
          enemy.x += Math.cos(angle) * 40;
          enemy.y += Math.sin(angle) * 40;

          if (isDead) {
            this.handleEnemyDeath(enemy, 'hellfire_nova', wasLowHp);
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
          const syphonDmgCfg = (spellsData as Record<string, SpellConfig>)['syphon_soul'].baseDamage;
          const syphonDmg = Math.round(syphonDmgCfg * this.player.stats.damageMultiplier);

          const wasLowHp = (enemy.hp <= enemy.maxHp * 0.15);
          const isDead = enemy.takeDamage(syphonDmg);
          CombatFeel.handleHitImpact(this, syphonDmg, false, true, enemy.hp / enemy.maxHp);

          this.spawnFloatingText(enemy.x, enemy.y, syphonDmg.toString(), '#a855f7', false);
          totalStolenHp += 8;
          if (isDead) {
            this.handleEnemyDeath(enemy, 'syphon_soul', wasLowHp);
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
                const boneDmg = Math.round(12 * this.player.stats.damageMultiplier);
                const wasLowHp = (enemy.hp <= enemy.maxHp * 0.15);
                const isDead = enemy.takeDamage(boneDmg);
                CombatFeel.handleHitImpact(this, boneDmg, false, false, enemy.hp / enemy.maxHp);
                if (isDead) this.handleEnemyDeath(enemy, 'bone_shield', wasLowHp);
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
    const scytheDmgCfg = (spellsData as Record<string, SpellConfig>)['crimson_scythe'].baseDamage;
    const scytheDmg = Math.round(scytheDmgCfg * this.player.stats.damageMultiplier);
    this.enemiesGroup.getChildren().forEach((enemyObj: any) => {
      const enemy = enemyObj as Enemy;
      if (enemy.active) {
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
        if (dist <= 95) {
          const enemyAngle = Phaser.Math.Angle.Between(this.player.x, this.player.y, enemy.x, enemy.y);
          const angleDiff = Phaser.Math.Angle.Wrap(enemyAngle - baseAngle);
          if (Math.abs(angleDiff) <= Math.PI / 2.5) {
            const wasLowHp = (enemy.hp <= enemy.maxHp * 0.15);
            const isDead = enemy.takeDamage(scytheDmg);
            CombatFeel.handleHitImpact(this, scytheDmg, false, true, enemy.hp / enemy.maxHp);
            this.spawnFloatingText(enemy.x, enemy.y, `${scytheDmg}!`, '#dc2626', true);
            // Knockback
            enemy.x += Math.cos(enemyAngle) * 35;
            enemy.y += Math.sin(enemyAngle) * 35;
            if (isDead) this.handleEnemyDeath(enemy, 'crimson_scythe', wasLowHp);
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
              const wasLowHp = (enemy.hp <= enemy.maxHp * 0.15);
              const isDead = enemy.takeDamage(tickDmg);
              CombatFeel.handleHitImpact(this, tickDmg, false, true, enemy.hp / enemy.maxHp);
              if (ticks % 2 === 0) {
                this.spawnFloatingText(enemy.x, enemy.y, `${tickDmg}`, '#e11d48', false);
              }
              if (isDead) this.handleEnemyDeath(enemy, 'blood_ritual_circle', wasLowHp);
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
    const beamDmgCfg = (spellsData as Record<string, SpellConfig>)['hemomancy_beam'].baseDamage;
    const beamDmg = Math.round(beamDmgCfg * this.player.stats.damageMultiplier);

    this.enemiesGroup.getChildren().forEach((enemyObj: any) => {
      const enemy = enemyObj as Enemy;
      if (enemy.active) {
        const enemyCircle = new Phaser.Geom.Circle(enemy.x, enemy.y, 22);
        if (Phaser.Geom.Intersects.LineToCircle(beamLine, enemyCircle)) {
          if (this.bloodEmitter) this.bloodEmitter.emitParticleAt(enemy.x, enemy.y, 10);
          const wasLowHp = (enemy.hp <= enemy.maxHp * 0.15);
          const isDead = enemy.takeDamage(beamDmg);
          CombatFeel.handleHitImpact(this, beamDmg, false, true, enemy.hp / enemy.maxHp);
          this.spawnFloatingText(enemy.x, enemy.y, `${beamDmg}!`, '#f43f5e', true);
          if (isDead) this.handleEnemyDeath(enemy, 'hemomancy_beam', wasLowHp);
        }
      }
    });
  }

  private handleProjectileHitWall(projObj: any, wallObj: any) {
    const proj = projObj as Projectile;
    if (!proj.active) return;

    // Wall blood splatter mark (persistent small stain at impact point)
    if (!proj.isEnemyProjectile) {
      const wallMark = this.add.image(proj.x, proj.y, 'blood_pool_stain')
        .setDepth(4)
        .setScale(0.25 + Math.random() * 0.2)
        .setAlpha(0.7)
        .setRotation(Math.random() * Math.PI * 2);
      this.bloodStainsGroup.add(wallMark);
      // Wall marks fade slowly (~30s)
      this.tweens.add({
        targets: wallMark,
        alpha: 0,
        delay: 20000,
        duration: 10000,
        onComplete: () => { this.bloodStainsGroup.remove(wallMark, true, true); },
      });
    }

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
    ContractSystem.onChestOpened(this);

    // Chest: guaranteed equipment loot + blood crystals (no XP/HP drops)
    // Grant some XP directly
    this.player.addXp(30);
    this.spawnFloatingText(chest.x, chest.y - 13, '+30 XP', '#3b82f6', false);

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

    const wasLowHp = (enemy.hp <= enemy.maxHp * 0.15);
    const isDead = enemy.takeDamage(finalDamage);
    CombatFeel.handleHitImpact(this, finalDamage, isCrit, false, enemy.hp / enemy.maxHp);

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
      this.handleEnemyDeath(enemy, 'blood_bolt', wasLowHp);
    }
  }

  public startScavenging(scav: Scavengeable) {
    if (this.isScavenging) return;
    this.isScavenging = true;
    this.currentScavengeable = scav;
    this.scavengeTimeElapsed = 0;
    useGameStore.getState().setScavengeProgress(0);
    soundEngine.playDash();
  }

  public cancelScavenging() {
    this.isScavenging = false;
    this.currentScavengeable = null;
    this.scavengeTimeElapsed = 0;
    useGameStore.getState().setScavengeProgress(0);
  }

  public completeScavenging() {
    if (!this.isScavenging || !this.currentScavengeable) return;
    const scav = this.currentScavengeable;
    scav.isScavenged = true;
    scav.setTint(0x333333);

    soundEngine.playChestOpen();

    if (scav.scavengeType === 'player_corpse') {
      useGameStore.getState().retrieveCorpseLoot();
      this.spawnFloatingText(scav.x, scav.y - 12, `EQUIPAMENTOS RECUPERADOS!`, '#f59e0b', true);
      this.cancelScavenging();
      return;
    }

    const isCorpse = scav.scavengeType === 'corpse';
    const isSkeleton = scav.scavengeType === 'skeleton';

    const xpReward = isCorpse ? 25 : (isSkeleton ? 15 : 10);
    this.player.addXp(xpReward);
    this.spawnFloatingText(scav.x, scav.y - 12, `+${xpReward} XP`, '#3b82f6', false);

    const crystals = Math.floor(10 + Math.random() * (isCorpse ? 30 : 15));
    useGameStore.getState().addBloodCrystals(crystals);
    this.spawnFloatingText(scav.x, scav.y - 25, `+${crystals} CRISTAIS 💎`, '#f43f5e', true);

    const equipChance = isCorpse ? 0.25 : 0.10;
    if (Math.random() < equipChance) {
      const lootItem = LootSystem.generateLoot(this.currentFloorDepth, false);
      const lootSprite = new LootSprite(this, scav.x + (Math.random() - 0.5) * 20, scav.y + (Math.random() - 0.5) * 20, lootItem);
      this.lootGroup.add(lootSprite);
      this.depthGroup.add(lootSprite);
    }

    // Chance to scavenge curatives (Atadura, Antídoto, Antibiótico)
    if (Math.random() < 0.35) {
      const types: Array<'bandages' | 'antidotes' | 'antibiotics'> = ['bandages', 'antidotes', 'antibiotics'];
      const picked = types[Math.floor(Math.random() * types.length)];
      const names = { bandages: 'Atadura 🩸', antidotes: 'Antídoto 🍇', antibiotics: 'Antibiótico 🧪' };
      const store = useGameStore.getState();
      const currentCuratives = store.playerStats.curatives || { bandages: 0, antidotes: 0, antibiotics: 0 };
      useGameStore.setState((state) => ({
        playerStats: {
          ...state.playerStats,
          curatives: {
            ...currentCuratives,
            [picked]: currentCuratives[picked] + 1
          }
        }
      }));
      this.player.stats.curatives = useGameStore.getState().playerStats.curatives;
      this.spawnFloatingText(scav.x, scav.y - 38, `+1 ${names[picked]}`, '#38bdf8', true);
      store.addLootLog(`Saqueou curativo: ${names[picked]}`);
    }

    this.cancelScavenging();
  }

  public useCurativeItem(type: 'bandages' | 'antidotes' | 'antibiotics') {
    const store = useGameStore.getState();
    const success = store.useCurative(type);
    if (success) {
      this.player.stats.statusConditions = store.playerStats.statusConditions;
      this.player.stats.curatives = store.playerStats.curatives;
      const msgs = {
        bandages: 'FERIDA ESTANCADA!',
        antidotes: 'VENENO PURIFICADO!',
        antibiotics: 'INFECÇÃO ERRADICADA!'
      };
      const colors = {
        bandages: '#ef4444',
        antidotes: '#22c55e',
        antibiotics: '#a855f7'
      };
      this.spawnFloatingText(this.player.x, this.player.y - 18, msgs[type], colors[type], true);
      store.addLootLog(`Atalho: Usou ${type}`);
    } else {
      if (store.playerStats.curatives[type] < 1) {
        this.spawnFloatingText(this.player.x, this.player.y - 15, 'SEM CURATIVOS!', '#94a3b8', false);
      }
    }
  }

  private playerHitByEnemy(
    damage: number,
    statusEffectOnHit?: { type: 'bleeding' | 'poison' | 'infection'; chance: number },
    hitType: 'physical' | 'ranged' | 'toxic' | 'heavy' = 'physical'
  ) {
    if (this.player.isInvulnerable || this.player.stats.isUnconscious || this.player.stats.isDefinitivelyDead) {
      return;
    }

    if (this.isScavenging) {
      this.cancelScavenging();
    }

    // Check if player is inside Room 0 (Safe Town) to nullify damage
    const spawnRoom = this.rooms[0];
    if (spawnRoom && this.player.x >= spawnRoom.x && this.player.x <= spawnRoom.x + spawnRoom.width &&
        this.player.y >= spawnRoom.y && this.player.y <= spawnRoom.y + spawnRoom.height) {
      return; // Absolute damage protection inside Safe Town!
    }

    // Roll status conditions on hit
    const store = useGameStore.getState();
    const conds = this.player.stats.statusConditions;

    if (!conds.bleeding && hitType === 'physical' && Math.random() < 0.18) {
      conds.bleeding = true;
      store.setStatusCondition('bleeding', true);
      this.spawnFloatingText(this.player.x, this.player.y - 22, '🩸 SANGRAMENTO!', '#ef4444', true);
      store.addLootLog('SANGRAMENTO: Ferida aberta! Pressione Z para usar Atadura.');
    }

    if (!conds.poison && (hitType === 'ranged' || hitType === 'toxic' || Math.random() < 0.12)) {
      conds.poison = true;
      store.setStatusCondition('poison', true);
      this.spawnFloatingText(this.player.x, this.player.y - 22, '🧪 VENENO!', '#22c55e', true);
      store.addLootLog('VENENO: Sangue contaminado! Pressione X para usar Antídoto.');
    }

    if (!conds.infection && (hitType === 'heavy' || Math.random() < 0.10)) {
      conds.infection = true;
      store.setStatusCondition('infection', true);
      this.spawnFloatingText(this.player.x, this.player.y - 22, '☣️ INFECÇÃO!', '#a855f7', true);
      store.addLootLog('INFECÇÃO: Vulnerabilidade a dano! Pressione V para usar Antibiótico.');
    }

    const isDead = this.player.takeDamage(damage);
    ContractSystem.onPlayerDamaged();

    // Fase 5: Haptic Feedback on damage
    if (damage > 50) {
      HapticFeedback.playerDamaged(); // Padrão duplo para dano alto
    } else {
      HapticFeedback.lightImpact(); // Leve para dano baixo
    }

    // Fase 3: Chance of inflicting a survival status condition (Dead Frontier 2 style)
    if (statusEffectOnHit && !this.player.stats.isUnconscious && !this.player.stats.isDefinitivelyDead) {
      if (Math.random() < statusEffectOnHit.chance) {
        const store = useGameStore.getState();
        if (!store.playerStats.statusConditions[statusEffectOnHit.type]) {
          store.setStatusCondition(statusEffectOnHit.type, true);
          const label = statusEffectOnHit.type === 'bleeding' ? 'Sangramento' : statusEffectOnHit.type === 'poison' ? 'Envenenamento' : 'Infecção';
          this.spawnFloatingText(this.player.x, this.player.y - 24, label.toUpperCase(), '#84cc16', false);
          store.addLootLog(`Você contraiu: ${label}. Use um curativo antes que piore.`);
        }
      }
    }
    
    // Floating damage number on player
    this.spawnFloatingText(this.player.x, this.player.y, `-${Math.round(damage)}`, '#ef4444', true);

    // Juice: Screen Shake and Red Flash on damage
    const settings = useGameStore.getState().settings;
    if (settings.screenShakeEnabled !== false) {
      this.cameras.main.shake(150, 0.015);
    }
    if (settings.flashesEnabled !== false) {
      this.cameras.main.flash(100, 150, 0, 0, false);
    }

    if (isDead) {
      this.triggerGameOver();
    }
  }

  private handleEnemyTouchPlayer(playerObj: any, enemyObj: any) {
    const enemy = enemyObj as Enemy;
    if (enemy.active) {
      this.playerHitByEnemy(enemy.config.damage * 0.4, enemy.config.statusEffectOnHit);
    }
  }

  private handleEnemyProjectileHitPlayer(playerObj: any, projObj: any) {
    const proj = projObj as Projectile;
    if (proj.active) {
      const statusEffectOnHit = proj.statusEffectOnHit;
      proj.destroy();
      this.playerHitByEnemy(proj.damage, statusEffectOnHit);
    }
  }

  private spawnProceduralGore(enemy: Enemy) {
    const numFrags = enemy.config.executionFragments || 3;
    const impulse = enemy.config.executionImpulse || 180;
    const bloodScale = enemy.config.executionBloodScale || 3.0;

    const w = enemy.width;
    const h = enemy.height;
    const stripHeight = h / numFrags;

    CombatFeel.triggerHitStop(this, 140);
    CombatFeel.triggerVibration('execution');
    soundEngine.playExecutionGore();

    if (this.bloodEmitter) {
      this.bloodEmitter.emitParticleAt(enemy.x, enemy.y, 25 * bloodScale);
    }

    for (let i = 0; i < numFrags; i++) {
      const cropX = 0;
      const cropY = i * stripHeight;
      const cropW = w;
      const cropH = stripHeight;

      const fragX = enemy.x;
      const fragY = enemy.y - (h / 2) + (i * stripHeight) + (stripHeight / 2);

      const frag = this.physics.add.image(fragX, fragY, enemy.texture.key);
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

      this.tweens.add({
        targets: frag,
        alpha: 0,
        duration: 1000 + Math.random() * 500,
        onComplete: () => frag.destroy()
      });
    }
  }

  private handleEnemyDeath(enemy: Enemy, killerSpellId?: string, wasLowHp: boolean = false) {
    // 1. Stats
    this.player.stats.kills++;
    this.player.stats.score += enemy.config.scoreValue;
    this.floorMonstersKilled++;
    this.registerKillCombo(enemy.x, enemy.y);
    ContractSystem.onEnemyKilled(enemy, this);

    // Onboarding trigger
    useGameStore.getState().triggerOnboardingEvent('firstKillDone', 'DICA: Colete o loot no chão antes de continuar!');

    // 2. Gore Effect: Blood Stain on Floor
    const isAbomination = enemy.config.id === 'gore_abomination';
    const isZombie = enemy.config.id === 'zombie_shambler';

    const stainScale = isAbomination ? 2.5 : 1.0;
    const stain = this.add.image(enemy.x, enemy.y, 'blood_pool_stain').setDepth(2).setScale(stainScale);
    stain.setRotation(Math.random() * Math.PI);
    stain.setAlpha(0.85);
    this.bloodStainsGroup.add(stain);
    // Fade out blood stain slowly over ~60 seconds (living ecosystem)
    this.tweens.add({
      targets: stain,
      alpha: 0,
      delay: 45000,
      duration: 15000,
      onComplete: () => { this.bloodStainsGroup.remove(stain, true, true); },
    });

    // Persistent Monster Corpse — sprite lying on the floor for environmental storytelling
    const corpseDecal = this.add.image(enemy.x, enemy.y, enemy.texture.key)
      .setDepth(3)
      .setScale(enemy.scaleX * 1.1, enemy.scaleY * 0.55) // flattened/squashed = lying down
      .setTint(isAbomination ? 0x1a4a1a : 0x3a0a0a)       // dark tint: dead flesh
      .setAlpha(0.9)
      .setRotation(Math.random() < 0.5 ? Math.PI / 2 : -Math.PI / 2); // fallen sideways
    this.bloodStainsGroup.add(corpseDecal);
    // Corpse also fades out slowly after ~90 seconds
    this.tweens.add({
      targets: corpseDecal,
      alpha: 0,
      delay: 75000,
      duration: 20000,
      onComplete: () => { this.bloodStainsGroup.remove(corpseDecal, true, true); },
    });

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

    const isSacrificial = ['crimson_scythe', 'hellfire_nova', 'blood_ritual_circle', 'hemomancy_beam'].includes(killerSpellId || '');
    if (isSacrificial && wasLowHp) {
      this.spawnProceduralGore(enemy);
      ContractSystem.onExecutionDone(this);
    } else {
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
    }

    // 4. Grant XP directly to player (no gems to collect)
    const hasFuryPit = useGameStore.getState().activeModifiers.includes('fury_pit');
    const xpDrop = hasFuryPit ? Math.round(enemy.config.xpDrop * 1.5) : enemy.config.xpDrop;
    const leveledUp = this.player.addXp(xpDrop);
    this.spawnFloatingText(enemy.x, enemy.y - 30, `+${xpDrop} XP`, '#3b82f6', false);
    if (leveledUp) {
      this.triggerLevelUp();
    }

    // 5. Check Loot Drop
    const hasBloodTide = useGameStore.getState().activeModifiers.includes('blood_tide');
    const rolled = hasBloodTide ? (Math.random() < 0.325) : LootSystem.rollLootChance();
    if (rolled) {
      const lootData = LootSystem.generateLoot(this.currentFloorDepth);
      const loot = new LootSprite(this, enemy.x + (Math.random() - 0.5) * 30, enemy.y + (Math.random() - 0.5) * 30, lootData);
      this.lootGroup.add(loot);
    }

    enemy.destroy();

    // Fill screen up to cap if more are waiting
    this.checkAndSpawnPendingEnemies();

    // Check if Floor Cleared -> Reveal Portal
    if (this.enemiesGroup.countActive() === 0 && this.pendingEnemySpawns.length === 0 && !this.isPortalActive) {
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

    const hpRatio = this.player.stats.hp / this.player.stats.maxHp;
    ContractSystem.onFloorCompleted(this.currentFloorDepth, hpRatio, this);

    this.currentFloorDepth++;
    this.player.heal(35); // Reward floor clear with HP restore
    this.player.addMana(50);

    // Clear old map entities
    this.wallsGroup.clear(true, true);
    this.chestsGroup.clear(true, true);
    this.collectiblesGroup.clear(true, true);
    this.enemyProjectilesGroup.clear(true, true);
    this.scavengeablesGroup.clear(true, true);
    this.lootGroup.clear(true, true);
    this.bloodStainsGroup.clear(true, true);

    // If player leaves floor without collecting corpse, it is lost
    const store = useGameStore.getState();
    if (store.playerStats.droppedCorpse.hasDroppedCorpse) {
      store.setDroppedCorpse({
        ...store.playerStats.droppedCorpse,
        hasDroppedCorpse: false
      });
      store.addLootLog("O cadáver foi deixado para trás e perdido para sempre nas catacumbas...");
    }

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
    // Onboarding trigger
    useGameStore.getState().triggerOnboardingEvent('firstLevelUpDone', 'DICA: Toque na Árvore de Talentos (T) para evoluir permanente!');

    // Just store pending data — player distributes later via talent tree (T key)
    if (this.callbacks?.onLevelUp) {
      const shuffled = [...upgradesData].sort(() => 0.5 - Math.random());
      const selectedOptions = shuffled.slice(0, 3) as UpgradeOption[];
      this.callbacks.onLevelUp(this.player.stats.level, selectedOptions);
    }
  }

  private triggerGameOver() {
    this.isPaused = true;
    this.physics.pause();
    soundEngine.stopBGM();

    // Fase 5: Haptic Feedback on death
    HapticFeedback.playerDeath();

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
    const highContrast = useGameStore.getState().settings.highContrastDamageTexts;
    const fontSize = highContrast
      ? (isCrit ? '22px' : '16px')
      : (isCrit ? '14px' : '11px');
    const strokeColor = '#000000';
    const strokeThickness = highContrast ? 6 : (isCrit ? 4 : 3);

    const jitterX = (Math.random() - 0.5) * 16;
    const txt = this.add.text(x + jitterX, y - 10, text, {
      fontSize,
      fontFamily: '"Press Start 2P", monospace',
      color,
      stroke: strokeColor,
      strokeThickness,
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
