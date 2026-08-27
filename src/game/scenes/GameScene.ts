import Phaser from 'phaser';
import { Player } from '../objects/Player';
import { Enemy } from '../objects/Enemy';
import { Scavengeable, ScavengeableType } from '../objects/Scavengeable';
import { Projectile } from '../objects/Projectile';
import { Collectible } from '../objects/Collectible';
import { LootSprite } from '../objects/Loot';
import { LootSystem } from '../systems/LootSystem';
import { PlayerStats, WaveConfig, UpgradeOption, SpellConfig } from '../../types/game';
import wavesData from '../../data/waves.json';
import upgradesData from '../../data/upgrades.json';
import spellsData from '../../data/spells.json';
import campaignItemsData from '../../data/campaignItems.json';
import { soundEngine } from '../../utils/soundEngine';
import HapticFeedback from '../../utils/haptics';
import ScreenEffects from '../systems/ScreenEffects';
import PostFXSystem from '../systems/PostFXSystem';
import LightingSystem from '../systems/LightingSystem';
import AdvancedParticles from '../systems/AdvancedParticles';
import ScreenShake from '../systems/ScreenShake';
import LightingPolish from '../systems/LightingPolish';
import { StatusEffectSystem } from '../systems/StatusEffectSystem';
import { ShadowSystem, LightSource } from '../systems/ShadowSystem';
import { ReflectionSystem } from '../systems/ReflectionSystem';
import { AtmosphereSystem } from '../systems/AtmosphereSystem';
import { EnemyTelegraphSystem } from '../systems/EnemyTelegraphSystem';
import { BloodSplatterSystem } from '../systems/BloodSplatterSystem';
import AchievementNotification from '../systems/AchievementNotification';
import { useGameStore } from '../../store/gameStore';
import { telemetry } from '../../utils/telemetry';
import { CombatFeel } from '../systems/CombatFeel';
import { ContractSystem } from '../systems/ContractSystem';
import AchievementSystem from '../systems/AchievementSystem';
import ObjectPool from '../systems/ObjectPool';
import ViewportCuller from '../systems/ViewportCuller';
import PerformanceMonitor from '../systems/PerformanceMonitor';
import InputManager from '../systems/InputManager';
import { VirtualJoystickSystem } from '../systems/VirtualJoystickSystem';
import { DismembermentSystem } from '../systems/DismembermentSystem';
import { PlayerSkillSystem } from '../systems/PlayerSkillSystem';
import { CollisionHandlers } from '../systems/CollisionHandlers';
import { DungeonFlowController } from '../systems/DungeonFlowController';
import { ScavengingSystem } from '../systems/ScavengingSystem';
import { CombatEffectsSystem } from '../systems/CombatEffectsSystem';

export interface GameSceneCallbacks {
  onStatsUpdate: (stats: PlayerStats) => void;
  onLevelUp: (level: number, options: UpgradeOption[]) => void;
  onGameOver: (stats: PlayerStats) => void;
}

import { DungeonGenerator, RoomData, DOOR_WIDTH } from '../systems/DungeonGenerator';

export class GameScene extends Phaser.Scene {
  public player!: Player;
  public depthGroup!: Phaser.GameObjects.Group; // público: usado por DungeonFlowController
  // Público: acessado por PlayerSkillSystem (extraído do GameScene — item 4
  // do roadmap de refatoração). Mudança de visibilidade apenas, sem
  // alteração de comportamento em runtime.
  public enemiesGroup!: Phaser.Physics.Arcade.Group;
  public scavengeablesGroup!: Phaser.Physics.Arcade.StaticGroup; // público: usado por DungeonFlowController
  public npcsGroup!: Phaser.Physics.Arcade.StaticGroup; // público: usado por DungeonFlowController
  public currentScavengeable: Scavengeable | null = null; // público: usado por ScavengingSystem
  public scavengeTimeElapsed: number = 0; // público: usado por ScavengingSystem
  public isScavenging: boolean = false; // público: usado por CollisionHandlers e ScavengingSystem
  private playerProjectilesGroup!: Phaser.Physics.Arcade.Group;
  public enemyProjectilesGroup!: Phaser.Physics.Arcade.Group; // público: usado por DungeonFlowController
  public collectiblesGroup!: Phaser.Physics.Arcade.Group; // público: usado por DungeonFlowController
  public lootGroup!: Phaser.Physics.Arcade.Group; // público: usado por CollisionHandlers
  public bloodStainsGroup!: Phaser.GameObjects.Group; // público: usado por CollisionHandlers
  public wallsGroup!: Phaser.Physics.Arcade.StaticGroup; // público: usado por DungeonFlowController
  public spikeTrapsGroup!: Phaser.Physics.Arcade.StaticGroup;
  public barrelsGroup!: Phaser.Physics.Arcade.StaticGroup;
  public chestsGroup!: Phaser.Physics.Arcade.StaticGroup; // público: usado por DungeonFlowController
  public dungeonGenerator!: DungeonGenerator;

  // --- Visual improvements ---
  public rooms: RoomData[] = []; // público: usado por CollisionHandlers
  public achievements: AchievementSystem = new AchievementSystem(); // público: usado por DungeonFlowController
  public screenEffects: ScreenEffects | null = null; // público: usado por CollisionHandlers
  public postFX: PostFXSystem | null = null; // público: usado por CollisionHandlers
  public lightingSystem: LightingSystem | null = null; // público: usado por DungeonFlowController
  public advancedParticles: AdvancedParticles | null = null; // público: usado por CollisionHandlers
  public screenShake: ScreenShake | null = null; // público: usado por CollisionHandlers
  public lightingPolish: LightingPolish | null = null; // público: usado por PlayerSkillSystem
  public statusEffectSystem: StatusEffectSystem | null = null;
  public shadowSystem: ShadowSystem | null = null;
  public reflectionSystem: ReflectionSystem | null = null;
  public virtualJoystick: VirtualJoystickSystem | null = null;
  public achievementNotification: AchievementNotification | null = null; // público: usado por DungeonFlowController
  private darknessOverlay!: Phaser.GameObjects.Graphics;

  // Fase 5: Pooling, culling e monitor de performance
  public playerProjectilePool!: ObjectPool<Projectile>; // público: usado por PlayerSkillSystem
  private enemyProjectilePool!: ObjectPool<Projectile>;
  private viewportCuller = new ViewportCuller(150);
  private performanceMonitor: PerformanceMonitor | null = null;
  private lightSprites: Phaser.GameObjects.Image[] = [];
  public atmosphereSystem: AtmosphereSystem | null = null;
  public enemyTelegraphSystem: EnemyTelegraphSystem | null = null;
  public bloodSplatterSystem: BloodSplatterSystem | null = null;
  public bloodBurstEmitter!: Phaser.GameObjects.Particles.ParticleEmitter; // público: usado por CombatEffectsSystem
  private flickerTimer?: Phaser.Time.TimerEvent;

  // Floor Depth Progression
  public currentFloorDepth: number = 1; // público: usado por CollisionHandlers e DungeonFlowController
  public totalFloorMonsters: number = 0; // público: usado por DungeonFlowController
  public floorMonstersKilled: number = 0; // público: usado por DungeonFlowController
  public portalSprite?: Phaser.GameObjects.Sprite; // público: usado por DungeonFlowController
  public isPortalActive: boolean = false; // público: usado por DungeonFlowController
  private corpsePointer?: Phaser.GameObjects.Sprite;

  // Fase 1 de docs/archive/specs/propostas/09_HUD_REFERENCIAS_VISUAIS_DIABLO_DUNGEON_SIEGE.md:
  // marcador flutuante ("!") sobre NPCs interagíveis, procedural (sem sprite novo).
  private npcMarkers: { npcType: string; container: Phaser.GameObjects.Container; baseY: number }[] = []; // público via métodos: usado por DungeonFlowController

  // Fase 2 de docs/archive/specs/propostas/09_HUD_REFERENCIAS_VISUAIS_DIABLO_DUNGEON_SIEGE.md:
  // minimap mínimo — rastreia por índice do array `rooms` (layout orgânico
  // desde a Frente 1 da spec 11, 27/08: número/tamanho de salas varia por
  // andar, não é mais uma grade fixa).
  private exploredRoomIndices: Set<number> = new Set();
  private minimapPushAccumMs: number = 0;

  // Frente 2 de docs/specs/13_ARPG_CAMPAIGN_AND_SAFE_HOUSE.md: marcos descobríveis
  // da campanha (ex.: Altar Ancestral em gloomy_woods) — checados por proximidade
  // em update(), público: preenchido por DungeonFlowController.
  public campaignDiscoverables: Phaser.GameObjects.Image[] = [];
  // Frente 3 de docs/specs/13_ARPG_CAMPAIGN_AND_SAFE_HOUSE.md (27/08): último
  // `player.stats.level` já checado pra desbloqueio de feitiço por nível
  // (ver `checkLevelSpellUnlocks` em gameStore.ts) — evita rechecar todo
  // frame sem um level-up de verdade ter acontecido.
  private lastCheckedPlayerLevel: number = 1;

  private currentWaveIndex: number = 0;
  public waveConfigs: WaveConfig[] = wavesData as WaveConfig[]; // público: usado por DungeonFlowController

  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private touchMoveVector = { x: 0, y: 0 };
  private touchAimVector = { x: 0, y: 0 };

  public callbacks?: GameSceneCallbacks; // público: usado por CombatEffectsSystem
  public isPaused: boolean = false; // público: usado por PlayerSkillSystem
  private gameTimerSeconds: number = 0;
  private timerEvent?: Phaser.Time.TimerEvent;

  // Noise Emission Timer
  private lastFootstepNoiseTime: number = 0;
  // Frente 3 (spec 11, 27/08) — trilha de pegadas ensanguentadas: quantos
  // passos "molhados" ainda restam (decrementa a cada passo até secar) e qual
  // pé foi o último a pisar (alterna esquerda/direita).
  private playerWetFootstepsRemaining: number = 0;
  private playerFootSideToggle: boolean = false;

  // Spawn queue for density throttling
  public pendingEnemySpawns: { x: number; y: number; monsterId: string; room: RoomData }[] = []; // público: usado por DungeonFlowController

  // Drag-to-Aim States
  // Públicos: lidos/escritos tanto aqui (renderização do reticle em update())
  // quanto em PlayerSkillSystem (handleDragAimStart/Move/End).
  public activeDragAimSpellId: string | null = null;
  public dragAimVector = new Phaser.Math.Vector2(0, 0);
  public dragAimGraphics!: Phaser.GameObjects.Graphics;
  private threatIndicatorGraphics!: Phaser.GameObjects.Graphics;

  // Gamepad states e Bone Shield visuals foram movidos para PlayerSkillSystem
  // (só eram usados dentro do bloco de skills extraído).

  public bloodEmitter?: Phaser.GameObjects.Particles.ParticleEmitter; // público: usado por PlayerSkillSystem
  private emberEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;

  public comboKillCount: number = 0; // público: usado por CombatEffectsSystem
  public comboTimerEvent?: Phaser.Time.TimerEvent; // público: usado por CombatEffectsSystem

  private isNovaReady: boolean = true;
  private lastNovaTime: number = 0;
  private readonly NOVA_COOLDOWN = 8000;

  // Execução das habilidades do jogador (nova, syphon, bone shield, crimson
  // scythe, ritual circle, hemomancy beam, blood bolt, drag-to-aim, input de
  // skills via gamepad) — extraído para systems/PlayerSkillSystem.ts.
  private skillSystem!: PlayerSkillSystem;

  // Handlers de colisão/hit (projétil x parede/inimigo, baú, dano ao jogador,
  // coleta de orbs/loot) — extraído para systems/CollisionHandlers.ts.
  public collisionHandlers!: CollisionHandlers;

  // Geração de masmorra/piso, spawn de inimigos, portal de descida e avanço
  // de andar — extraído para systems/DungeonFlowController.ts.
  private dungeonFlow!: DungeonFlowController;

  // Scavenging (corpses/skeletons/player_corpse) e uso rápido de curativos —
  // extraído para systems/ScavengingSystem.ts (item 1 do roadmap, continuação
  // da extração dos demais systems/).
  private scavengingSystem!: ScavengingSystem;

  // Feedback de combate (texto flutuante, slash, combo kill), morte de
  // inimigo (gore/dismemberment/loot/XP) e transições de level-up/game over —
  // extraído para systems/CombatEffectsSystem.ts.
  public combatEffects!: CombatEffectsSystem;

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
    this.spikeTrapsGroup = this.physics.add.staticGroup();
    this.barrelsGroup = this.physics.add.staticGroup();
    this.scavengeablesGroup = this.physics.add.staticGroup();
    this.npcsGroup = this.physics.add.staticGroup();
    this.enemiesGroup = this.physics.add.group({ runChildUpdate: false });
    this.playerProjectilesGroup = this.physics.add.group({ runChildUpdate: true });
    this.enemyProjectilesGroup = this.physics.add.group({ runChildUpdate: true });

    // Fase 5: ObjectPool para projéteis (reduz GC/alocação por disparo)
    this.playerProjectilePool = new ObjectPool<Projectile>(() => {
      const proj = new Projectile(this, 0, 0, 'proj_blood_bolt');
      proj.setOnExpired((p) => this.playerProjectilePool.release(p));
      this.playerProjectilesGroup.add(proj);
      proj.setActive(false);
      proj.setVisible(false);
      return proj;
    }, 12);
    this.enemyProjectilePool = new ObjectPool<Projectile>(() => {
      const proj = new Projectile(this, 0, 0, 'proj_energy_bolt');
      proj.setOnExpired((p) => this.enemyProjectilePool.release(p));
      this.enemyProjectilesGroup.add(proj);
      proj.setActive(false);
      proj.setVisible(false);
      return proj;
    }, 8);
    this.collectiblesGroup = this.physics.add.group();
    this.lootGroup = this.physics.add.group();

    this.dungeonGenerator = new DungeonGenerator(this, this.wallsGroup, this.chestsGroup);

    // Eixo A: Sistemas de pós-processamento e iluminação GPU (criados antes do mapa
    // para que o primeiro bioma já seja aplicado na criação dos tiles/tochas).
    this.screenEffects = new ScreenEffects(this, this.cameras.main.width, this.cameras.main.height);
    this.postFX = new PostFXSystem(this);
    this.postFX.setEnabled(useGameStore.getState().settings.postProcessingEnabled !== false);
    (window as any).__triggerFearDistortion = (durationMs?: number) => {
      if (this.postFX) {
        this.postFX.triggerFearDistortion(durationMs);
      } else if (this.screenEffects) {
        this.screenEffects.triggerFearDistortion(durationMs);
      }
    };
    this.lightingSystem = new LightingSystem(this);
    this.lightingSystem.setEnabled(useGameStore.getState().settings.postProcessingEnabled !== false);

    // Geração de masmorra/piso, spawn e avanço de andar (extraído do GameScene)
    this.dungeonFlow = new DungeonFlowController(this);

    // 3. Generate Dungeon Map Layout
    this.buildDungeonMap(mapW, mapH, this.currentFloorDepth);

    // Limpeza (2026-08-25, Fase 0 de docs/architecture/06_PHASER_REACT_BRIDGE_MIGRATION.md):
    // removidos os listeners mortos 'trigger-npc' e 'trigger-scavenge' — grep
    // confirmou que nenhum dos dois era disparado por ninguém em src/. A
    // interação com NPC já é 100% via store (setActiveNPC chamado direto pela
    // UI em GameplayHUD.tsx); scavenge por toque não tem disparo algum hoje.
    //
    // Respawno do jogador agora é disparado via store (respawnRequested), não mais
    // por window.addEventListener — ver public respawnPlayer() abaixo e
    // docs/architecture/06_PHASER_REACT_BRIDGE_MIGRATION.md

    // --- VISUAL: Darkness overlay + Lighting ---
    this.dragAimGraphics = this.add.graphics().setDepth(2050);
    this.threatIndicatorGraphics = this.add.graphics().setDepth(2100).setScrollFactor(0);
    this.darknessOverlay = this.add.graphics().setDepth(1990).setScrollFactor(0);
    this.darknessOverlay.fillStyle(0x050510, 0.12);
    this.darknessOverlay.fillRect(0, 0, mapW, mapH);

    // Fase 3.2 de docs/archive/specs/propostas/10_POLIMENTO_VISUAL_PROCEDURAL_LUZ_E_CENARIO.md:
    // hash determinístico simples (sem lib de RNG com seed) pra dar uma variação pequena
    // e reproduzível por sala, quebrando a grade perfeita sem perder consistência visual.
    const roomJitter = (roomIndex: number, salt: number, range: number): number => {
      const h = Math.sin(roomIndex * 12.9898 + salt * 78.233) * 43758.5453;
      const frac = h - Math.floor(h);
      return (frac * 2 - 1) * range;
    };

    // Place light sprites (additive blend over darkness)
    this.lightSprites.forEach(s => s.destroy());
    this.lightSprites = [];
    this.rooms.forEach((room, roomIndex) => {
      // Torches flanking doorways on each wall
      const flamePositions: { x: number; y: number; kind: 'torch' | 'brazier' }[] = [];

      // Fase 3.2: o offset de flanqueio agora deriva do MESMO doorWidth que o
      // DungeonGenerator usa pra abrir o vão real da porta (antes eram dois números
      // desalinhados por acidente — ±70 aqui vs. doorWidth=80 lá), + um jitter leve.
      const doorHalf = DOOR_WIDTH / 2;
      const doorClearance = 12; // distância entre a borda do vão e a tocha que o flanqueia

      if (room.y > 80) {
        flamePositions.push({ x: room.centerX - (doorHalf + doorClearance) + roomJitter(roomIndex, 1, 5), y: room.y - 6, kind: 'torch' });
        flamePositions.push({ x: room.centerX + (doorHalf + doorClearance) + roomJitter(roomIndex, 2, 5), y: room.y - 6, kind: 'torch' });
      }
      if (room.x > 100) {
        flamePositions.push({ x: room.x - 6, y: room.centerY - doorHalf + roomJitter(roomIndex, 3, 5), kind: 'torch' });
        flamePositions.push({ x: room.x - 6, y: room.centerY + doorHalf + roomJitter(roomIndex, 4, 5), kind: 'torch' });
      }

      // Fase 3.3: salas comuns de passagem ("chamber") ganham só 2 tochas de canto
      // em diagonal em vez das 4 fixas de sempre — cria variação de atmosfera entre
      // cômodos. Salas especiais (spawn/boss/secret_treasure) mantêm as 4, mais
      // iluminadas/acolhedoras, coerente com o papel narrativo de cada uma.
      const cornerInset = 40;
      const allCorners = [
        { x: room.x + cornerInset, y: room.y + cornerInset },
        { x: room.x + room.width - cornerInset, y: room.y + cornerInset },
        { x: room.x + cornerInset, y: room.y + room.height - cornerInset },
        { x: room.x + room.width - cornerInset, y: room.y + room.height - cornerInset },
      ];
      const corners = room.type === 'chamber' ? [allCorners[0], allCorners[3]] : allCorners;
      corners.forEach((c, i) => {
        flamePositions.push({
          x: c.x + roomJitter(roomIndex, 10 + i, 8),
          y: c.y + roomJitter(roomIndex, 20 + i, 8),
          kind: 'torch',
        });
      });

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

      // Eixo A: luzes reais nas tochas/braseiros (WebGL)
      if (this.lightingSystem) {
        this.lightingSystem.addTorchLights(flamePositions);
      }
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

    // --- VISUAL: Atmosphere & Volumetric Fog System (Frente 2) ---
    this.atmosphereSystem = new AtmosphereSystem(this);
    this.atmosphereSystem.initialize(mapW, mapH, 'fosso_chagas');

    // --- VISUAL: Enemy Attack Telegraphing System (Frente 3) ---
    this.enemyTelegraphSystem = new EnemyTelegraphSystem(this);
    this.enemyTelegraphSystem.initialize();

    // --- VISUAL: Persistent Floor Blood & Gore Splatter System (Frente 4) ---
    this.bloodSplatterSystem = new BloodSplatterSystem(this);
    this.bloodSplatterSystem.initialize();

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

    // Fase 5: Inicializar sistemas de polimento visual e gameplay
    this.advancedParticles = new AdvancedParticles(this);
    this.screenShake = new ScreenShake(this.cameras.main);

    // Fase 5 Final: LightingPolish - glow effects em itens, monstros, spells
    this.lightingPolish = new LightingPolish(this);

    // Sistema de execução de habilidades do jogador (extraído do GameScene)
    this.skillSystem = new PlayerSkillSystem(this);
    this.collisionHandlers = new CollisionHandlers(this);
    this.scavengingSystem = new ScavengingSystem(this);
    this.combatEffects = new CombatEffectsSystem(this);

    // Spec 10 (Parte 3): Shaders & Efeitos de Status, Sombras Direcionais e Reflexos Líquidos
    this.statusEffectSystem = new StatusEffectSystem(this);
    this.shadowSystem = new ShadowSystem(this);
    this.reflectionSystem = new ReflectionSystem(this);
    if (this.player) {
      this.shadowSystem.registerEntity(this.player as any);
      this.reflectionSystem.registerEntity(this.player as any);
    }

    // Fase 5 Final: Achievement Notifications - UI visual para desbloqueamentos
    this.achievementNotification = new AchievementNotification(this);

    // Fase 5: InputManager unificado (gamepad/keyboard) + monitor de performance (toggle dev via ?perf=1)
    InputManager.init();
    const perfQuery = new URLSearchParams(window.location.search).get('perf');
    if (perfQuery !== null) {
      this.performanceMonitor = new PerformanceMonitor();
      this.performanceMonitor.enable();
    }
    
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
    
    // Referência de zoom muito mais próxima (estilo Action RPG / Diablo)
    // Aumentamos agressivamente a base do zoom para trazer a câmera para perto do personagem.
    const adaptiveZoom = Math.max(1.8, Math.min(3.0, screenH / 300));
    this.cameras.main.setZoom(adaptiveZoom);

    // 4. Mobile / Touch Virtual Joystick (Canvas-Native, 60 FPS)
    const settings = useGameStore.getState().settings;
    this.virtualJoystick = new VirtualJoystickSystem(this, {
      deadzone: settings.joystickDeadzone,
      curve: settings.joystickCurve,
      sensitivity: settings.touchSensitivity,
      opacity: settings.virtualControlsOpacity,
      enabled: settings.controlsMode !== 'keyboard',
      dragToFollow: true,
    });
    this.virtualJoystick.init();

    // 4.1 Keyboard Controls
    if (this.input.keyboard) {
      this.keys = this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,Q,E,SPACE,R,SHIFT,F,C,Z,X,V,ONE,TWO,THREE,FOUR,FIVE,SIX') as Record<string, Phaser.Input.Keyboard.Key>;
    }

    // use-curative agora chega via store (activeCurativeTrigger) — ver
    // PhaserGame.tsx e docs/architecture/06_PHASER_REACT_BRIDGE_MIGRATION.md.
    // useCurativeItem() já era público (também usado pelos atalhos Z/X/V abaixo).

    // Mouse / Touch Aim (ignoring movement pointer when virtual joystick is active)
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.virtualJoystick && this.virtualJoystick.isActive() && pointer.id === (this.virtualJoystick as any).pointerId) {
        return;
      }
      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      const dx = worldPoint.x - this.player.x;
      const dy = worldPoint.y - this.player.y;
      if (Math.hypot(dx, dy) > 10) {
        this.player.setAimInput(dx, dy);
      }
    });

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.virtualJoystick && this.virtualJoystick.isActive() && pointer.id === (this.virtualJoystick as any).pointerId) {
        return;
      }
      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      this.player.setAimInput(worldPoint.x - this.player.x, worldPoint.y - this.player.y);
    });

    // 5. Collisions & Overlaps
    this.physics.add.collider(this.player, this.wallsGroup);
    this.physics.add.collider(this.enemiesGroup, this.wallsGroup);
    this.physics.add.collider(this.enemiesGroup, this.enemiesGroup);
    
    // Traps and Barrels
    this.physics.add.collider(this.player, this.barrelsGroup);
    this.physics.add.collider(this.enemiesGroup, this.barrelsGroup);
    
    // Projectiles hit barrels
    this.physics.add.overlap(this.playerProjectilesGroup, this.barrelsGroup, (proj, barrel) => {
      proj.destroy();
      (barrel as any).explode(this);
    });
    this.physics.add.overlap(this.enemyProjectilesGroup, this.barrelsGroup, (proj, barrel) => {
      proj.destroy();
      (barrel as any).explode(this);
    });

    // Spikes overlap
    this.physics.add.overlap(this.player, this.spikeTrapsGroup, (p, spike) => {
      if ((spike as any).isActive()) {
        this.collisionHandlers.handleTrapDamage(this.player, 10);
      }
    });
    this.physics.add.overlap(this.enemiesGroup, this.spikeTrapsGroup, (enemy, spike) => {
      if ((spike as any).isActive()) {
        this.collisionHandlers.handleEnemyTrapDamage(enemy as any, 10);
      }
    });

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

    // 'trigger-blood-nova' removido em 25/08/2026 (Fase 0 da limpeza) — grep
    // confirmou que nunca era disparado por ninguém em src/; o método
    // triggerBloodNova() que ele chamava também foi removido (só existia
    // para servir esse listener morto).

    // Drag-to-Aim: handleDragAimStart/Move/End acima já são públicos e
    // agora são chamados diretamente por PhaserGame.tsx via store (dragAim),
    // não mais por window.addEventListener.
    // update-cosmetic-tint agora chega via store (cosmeticTintVersion) — ver
    // public applyCosmeticTint() abaixo e docs/architecture/06_PHASER_REACT_BRIDGE_MIGRATION.md

    this.events.once('shutdown', () => {
      if (this.virtualJoystick) {
        this.virtualJoystick.destroy();
        this.virtualJoystick = null;
      }
      if (this.enemyTelegraphSystem) {
        this.enemyTelegraphSystem.cleanup();
        this.enemyTelegraphSystem = null;
      }
      if (this.bloodSplatterSystem) {
        this.bloodSplatterSystem.cleanup();
        this.bloodSplatterSystem = null;
      }
      if (this.flickerTimer) this.flickerTimer.destroy();
    });
    this.events.once('destroy', () => {
      if (this.virtualJoystick) {
        this.virtualJoystick.destroy();
        this.virtualJoystick = null;
      }
      if (this.enemyTelegraphSystem) {
        this.enemyTelegraphSystem.cleanup();
        this.enemyTelegraphSystem = null;
      }
      if (this.bloodSplatterSystem) {
        this.bloodSplatterSystem.cleanup();
        this.bloodSplatterSystem = null;
      }
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
   * Respawna o jogador na Safe Town após a morte: reseta stats/penalidades,
   * salva o equipamento atual como cadáver saqueável no local da morte e
   * limpa as telas de game over. Extraído do antigo listener
   * window.addEventListener('respawn-player', ...) — agora chamado por
   * PhaserGame.tsx quando useGameStore().respawnRequested vira true.
   * Ver docs/architecture/06_PHASER_REACT_BRIDGE_MIGRATION.md.
   */
  public respawnPlayer() { // público: chamado por PhaserGame.tsx via store (respawnRequested)
    const spawnRoom = this.rooms[0];
    if (!spawnRoom || !this.player) return;

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

  /**
   * Reaplica a paleta cosmética atual ao sprite do jogador. Extraído do
   * antigo listener window.addEventListener('update-cosmetic-tint', ...) —
   * agora chamado por PhaserGame.tsx quando useGameStore().cosmeticTintVersion
   * muda. Ver docs/architecture/06_PHASER_REACT_BRIDGE_MIGRATION.md.
   */
  public applyCosmeticTint() { // público: chamado por PhaserGame.tsx via store (cosmeticTintVersion)
    if (this.player) {
      this.player.applyCosmeticTint();
    }
  }

  /**
   * Remove todos os marcadores flutuantes de NPC atualmente na cena. Chamado
   * por DungeonFlowController antes de recriar os NPCs de cada andar/piso.
   * Ver docs/archive/specs/propostas/09_HUD_REFERENCIAS_VISUAIS_DIABLO_DUNGEON_SIEGE.md.
   */
  public clearNpcMarkers() { // público: chamado por DungeonFlowController
    this.npcMarkers.forEach((m) => m.container.destroy());
    this.npcMarkers = [];
  }

  /**
   * Cria um marcador flutuante ("!") acima de um NPC interagível — reforça
   * (não substitui) o prompt textual "aperte E" já existente, dando
   * legibilidade a distância. Cor combina com o tint já usado no sprite do
   * NPC (DungeonFlowController), então não introduz nenhuma cor nova fora
   * da paleta já em uso no jogo. Some automaticamente quando o jogador entra
   * em diálogo com aquele NPC (ver toggle de visibilidade em update()).
   */
  public createNpcMarker(x: number, y: number, npcType: string, color: number) { // público: chamado por DungeonFlowController
    const hex = `#${color.toString(16).padStart(6, '0')}`;
    const markerY = y - 42;

    const glow = this.add.circle(0, 0, 9, color, 0.22);
    const glyph = this.add.text(0, 0, '!', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '14px',
      color: hex,
    })
      .setOrigin(0.5)
      .setShadow(0, 0, hex, 6, true, true);

    const container = this.add.container(x, markerY, [glow, glyph]).setDepth(1700);
    this.npcMarkers.push({ npcType, container, baseY: markerY });
  }

  /**
   * Fase 2 de docs/archive/specs/propostas/09_HUD_REFERENCIAS_VISUAIS_DIABLO_DUNGEON_SIEGE.md:
   * reseta o rastreamento de exploração (a sala de spawn começa sempre
   * revelada) e empurra o primeiro snapshot pro store. Chamado por
   * DungeonFlowController logo depois de `scene.rooms = rooms`.
   */
  public initMinimap() { // público: chamado por DungeonFlowController
    this.exploredRoomIndices = new Set(this.rooms.length > 0 ? [0] : []);
    this.pushMinimapSnapshot();
  }

  private getRoomIndexAt(x: number, y: number): number {
    return this.rooms.findIndex(
      (r) => x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height
    );
  }

  private pushMinimapSnapshot() {
    if (this.rooms.length === 0) return;

    const playerRoomIndex = this.player && this.player.active
      ? this.getRoomIndexAt(this.player.x, this.player.y)
      : -1;

    const chestRoomIndices = new Set<number>();
    if (this.chestsGroup) {
      this.chestsGroup.getChildren().forEach((chestObj) => {
        const chest = chestObj as unknown as Phaser.GameObjects.Sprite;
        if (!chest.active) return;
        const idx = this.getRoomIndexAt(chest.x, chest.y);
        if (idx >= 0) chestRoomIndices.add(idx);
      });
    }

    const snapshot = this.rooms.map((room, i) => ({
      index: i,
      type: room.type,
      explored: this.exploredRoomIndices.has(i),
      hasChest: chestRoomIndices.has(i),
      hasPlayer: i === playerRoomIndex,
      x: room.x,
      y: room.y,
      width: room.width,
      height: room.height,
    }));

    useGameStore.getState().setMinimapRooms(snapshot);
  }

  // --- Geração de masmorra/piso ---
  // Implementação completa movida para systems/DungeonFlowController.ts
  // (continuação da extração do GameScene.ts). getActiveEnemyCap,
  // registerEntityEffects e showFloorBanner foram junto (só eram usados
  // dentro deste bloco). Wrappers finos preservam os nomes usados em
  // create(), update() e handleEnemyDeath.
  public checkAndSpawnPendingEnemies() { // público: usado por CombatEffectsSystem
    this.dungeonFlow.checkAndSpawnPendingEnemies();
  }

  /**
   * Builds procedural 3x3 interconnected Dungeon Map with Rooms, Corridors, Walls, Chests & Enemies
   */
  private buildDungeonMap(mapW: number, mapH: number, floorDepth: number) {
    this.dungeonFlow.buildDungeonMap(mapW, mapH, floorDepth);
  }

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
  // triggerGroupAlert foi movido para systems/CollisionHandlers.ts (só era
  // usado dentro de handleProjectileHitEnemy, que também foi movido).

  public setTouchInputs(moveX: number, moveY: number, aimX: number, aimY: number) {
    this.touchMoveVector.x = moveX;
    this.touchMoveVector.y = moveY;
    this.touchAimVector.x = aimX;
    this.touchAimVector.y = aimY;
  }

  public triggerSkill(skillKey: 'nova' | 'syphon' | 'bone_shield' | 'crimson_scythe' | 'blood_ritual_circle' | 'hemomancy_beam') {
    // Execução movida para PlayerSkillSystem (item 4 do roadmap de
    // refatoração) — mesmo comportamento, agora em systems/PlayerSkillSystem.ts.
    this.skillSystem.triggerSkill(skillKey);
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

  update(time: number, delta: number) {
    if (this.isPaused) return;

    // Fase 5: Update visual effects systems
    if (this.screenShake) {
      this.screenShake.update(delta);
    }
    if (this.screenEffects) {
      this.screenEffects.update(delta);
    }
    if (this.postFX) {
      this.postFX.update(delta);
    }
    if (this.performanceMonitor) {
      this.performanceMonitor.update();
    }

    // Spec 10: Status Effects, Shadows & Reflections
    if (this.statusEffectSystem) {
      this.statusEffectSystem.update(time, delta);
    }
    if (this.shadowSystem) {
      const lightSources: LightSource[] = [];
      if (this.player && this.player.active) {
        lightSources.push({
          x: this.player.x,
          y: this.player.y,
          radius: 220,
          intensity: 1.0,
        });
      }
      if (this.lightSprites) {
        for (let i = 0; i < this.lightSprites.length; i++) {
          const torch = this.lightSprites[i];
          if (torch.active) {
            lightSources.push({
              x: torch.x,
              y: torch.y,
              radius: 140,
              intensity: 0.8,
            });
          }
        }
      }
      this.shadowSystem.update(lightSources);
    }
    if (this.reflectionSystem) {
      this.reflectionSystem.update(time);
    }

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

    // Fase 1 de docs/archive/specs/propostas/09_HUD_REFERENCIAS_VISUAIS_DIABLO_DUNGEON_SIEGE.md:
    // bob suave + esconde o marcador do NPC com quem o jogador está conversando agora
    if (this.npcMarkers.length > 0) {
      const bob = Math.sin(time * 0.004) * 3;
      const isInCampaignDialogue = store.campaignState.activeDialogueTree !== null;
      this.npcMarkers.forEach((m) => {
        m.container.y = m.baseY + bob;
        m.container.setVisible(store.activeNPC !== m.npcType && !isInCampaignDialogue);
      });
    }

    // Frente 2/3 de docs/specs/13_ARPG_CAMPAIGN_AND_SAFE_HOUSE.md: checa proximidade
    // com marcos descobríveis da campanha (ex.: Altar Ancestral) e avança o
    // objetivo discover_zone correspondente uma única vez por marco.
    if (this.campaignDiscoverables.length > 0 && this.player && this.player.active) {
      const discoverRadius = 70;
      // Frente 8 (spec 11, 27/08): raio de "pré-aviso" visual, maior que o de
      // descoberta — o altar intensifica o realce vermelho conforme o
      // jogador se aproxima, mesmo antes de disparar a descoberta.
      const altarSensorRadius = 260;
      this.campaignDiscoverables.forEach((marker) => {
        if (!marker.active || marker.getData('discovered')) return;
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, marker.x, marker.y);
        if (dist < altarSensorRadius) {
          this.lightingPolish?.updateAltarProximity(marker, dist / altarSensorRadius);
        }
        if (dist < discoverRadius) {
          marker.setData('discovered', true);
          const targetId = marker.getData('campaignDiscoverableId') as string;
          useGameStore.getState().advanceQuestObjectiveByTarget('discover_zone', targetId, 1);
          soundEngine.playOrbPickup();
          this.spawnFloatingText(marker.x, marker.y - 30, 'ALTAR DESCOBERTO', '#990000', true);

          // Frente 3 de docs/specs/13_ARPG_CAMPAIGN_AND_SAFE_HOUSE.md (Zero-to-Hero):
          // o Altar Ancestral é onde o jogador desarmado ganha seu primeiro
          // feitiço — desbloqueio imediato na descoberta, não só quando a quest
          // inteira (baú + batedores) fecha.
          const SPELL_UNLOCK_BY_DISCOVERABLE: Record<string, string> = {
            altar_crimson: 'blood_bolt',
          };
          const spellToUnlock = SPELL_UNLOCK_BY_DISCOVERABLE[targetId];
          if (spellToUnlock) {
            useGameStore.getState().unlockCampaignSpell(spellToUnlock);
            this.spawnFloatingText(marker.x, marker.y - 46, 'BLOOD BOLT DESBLOQUEADO!', '#B8860B', true);
          }
        }
      });
    }

    // Frente 3 de docs/specs/13_ARPG_CAMPAIGN_AND_SAFE_HOUSE.md (27/08): fecha
    // o gap dos 6 feitiços sem gatilho de desbloqueio (ver
    // CAMPAIGN_SPELL_UNLOCK_LEVEL em gameStore.ts) — checa a cada frame se o
    // nível do jogador subiu desde a última checagem (mesmo padrão de "campo
    // comparado a cada update()" já usado alhures nesta cena) e, se sim,
    // destrava tudo que já bateu o nível-requisito. `addXp()`/level-up rodam
    // em vários lugares diferentes (CombatEffectsSystem, CollisionHandlers,
    // ScavengingSystem, ContractSystem) — checar aqui, central, evita
    // duplicar essa lógica em cada um deles.
    if (store.gameMode === 'campaign' && this.player && this.player.active) {
      const currentLevel = this.player.stats.level;
      if (currentLevel > this.lastCheckedPlayerLevel) {
        this.lastCheckedPlayerLevel = currentLevel;
        const newlyUnlocked = store.checkLevelSpellUnlocks(currentLevel);
        newlyUnlocked.forEach((spellId, i) => {
          const spell = (spellsData as Record<string, SpellConfig>)[spellId];
          this.spawnFloatingText(
            this.player.x,
            this.player.y - 40 - i * 16,
            `${(spell?.name || spellId).toUpperCase()} DESBLOQUEADO!`,
            spell?.color || '#B8860B',
            true
          );
        });
      }
    }

    // Fase 2 de docs/archive/specs/propostas/09_HUD_REFERENCIAS_VISUAIS_DIABLO_DUNGEON_SIEGE.md:
    // throttled a ~400ms — não precisa ser por frame, é só um mapa esquemático
    this.minimapPushAccumMs += delta;
    if (this.minimapPushAccumMs >= 400) {
      this.minimapPushAccumMs = 0;
      if (this.player && this.player.active) {
        const idx = this.getRoomIndexAt(this.player.x, this.player.y);
        if (idx >= 0) {
          this.exploredRoomIndices.add(idx);
          const room = this.rooms[idx];
          if (room && room.type === 'boss') {
            soundEngine.setBGMTheme('boss_plutonia');
          } else {
            const biome = useGameStore.getState().currentBiome;
            soundEngine.setBGMTheme(biome === 'santuario_sangue' ? 'sanctuary' : 'catacombs');
          }
        }

        // Dynamic low-HP heartbeat / tension synth
        if (this.player.stats) {
          const isLowHp = (this.player.stats.hp / Math.max(1, this.player.stats.maxHp)) <= 0.25;
          soundEngine.setBGMLowHp(isLowHp);
        }
      }
      this.pushMinimapSnapshot();
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

    // Process gamepad inputs if connected (via InputManager unificado)
    if (InputManager.isGamepadConnected()) {
      this.handleGamepadInput();
    }

    // --- Atmosphere & Volumetric Fog System update (Frente 2) ---
    if (this.atmosphereSystem) {
      const isCombatHeavy = this.isBossActive() || this.enemiesGroup.countActive() > 6;
      this.atmosphereSystem.update(delta, isCombatHeavy);
    }

    // --- Enemy Attack Telegraphing System update (Frente 3) ---
    if (this.enemyTelegraphSystem) {
      this.enemyTelegraphSystem.update(time, this.enemiesGroup, this.cameras.main);
    }

    // --- Blood & Gore Decal System update (Frente 4) ---
    if (this.bloodSplatterSystem) {
      this.bloodSplatterSystem.update(time);
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

    if (this.virtualJoystick) {
      const currentSettings = store.settings;
      this.virtualJoystick.updateConfig({
        deadzone: currentSettings.joystickDeadzone,
        curve: currentSettings.joystickCurve,
        sensitivity: currentSettings.touchSensitivity,
        opacity: currentSettings.virtualControlsOpacity,
        enabled: currentSettings.controlsMode !== 'keyboard',
      });
      this.virtualJoystick.update(time, delta);
      if (this.virtualJoystick.isActive()) {
        const joyVec = this.virtualJoystick.getMovementVector();
        mx = joyVec.x;
        my = joyVec.y;
      }
    }

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
          // Frente 2 de docs/specs/13_ARPG_CAMPAIGN_AND_SAFE_HOUSE.md: Maelen abre a
          // árvore de diálogo de campanha (mesma rota do botão "FALAR COM NPC" no HUD);
          // os outros NPCs continuam no modal de loja via setActiveNPC.
          if (type === 'maelen') {
            store.startDialogue('safe_house_maelen_intro');
          } else {
            store.setActiveNPC(type);
          }
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

      // Frente 3 (spec 11, 27/08): mesma cadência de passo pra trilha de
      // pegadas ensanguentadas — pisar perto de sangue fresco "molha a sola"
      // por alguns passos, deixando uma trilha que vai sumindo.
      if (this.bloodSplatterSystem?.isNearWetBlood(this.player.x, this.player.y, 40)) {
        this.playerWetFootstepsRemaining = 6;
      }
      if (this.playerWetFootstepsRemaining > 0) {
        const moveAngle = Math.atan2(my, mx);
        const fadeRatio = this.playerWetFootstepsRemaining / 6;
        this.playerFootSideToggle = !this.playerFootSideToggle;
        this.bloodSplatterSystem?.addFootprintDecal(this.player.x, this.player.y + 10, moveAngle, this.playerFootSideToggle, fadeRatio);
        this.playerWetFootstepsRemaining--;
      }
    }

    // 2. Update Player
    const lastMana = this.player.stats.mana;
    this.player.updatePlayer(time, delta);

    // If Blood Bolt fired in player update, create projectile & emit weapon noise
    if (this.player.stats.mana < lastMana - 1) {
      this.firePlayerBloodBolt();
      this.emitSound(this.player.x, this.player.y, 360); // Firing spell noise!
    }

    // Frente 3 de docs/specs/13_ARPG_CAMPAIGN_AND_SAFE_HOUSE.md (Zero-to-Hero):
    // updatePlayer() marcou um golpe de adaga elegível — aplica o dano aqui
    // (fora do Player, que não deve conhecer gore/blood-splatter) e limpa o
    // sinalizador, no mesmo espírito do delta de mana do blood_bolt acima.
    if (this.player.pendingMeleeHitTarget) {
      const meleeTarget = this.player.pendingMeleeHitTarget;
      this.player.pendingMeleeHitTarget = null;
      this.collisionHandlers.handleMeleeHitEnemy(meleeTarget);
      this.emitSound(this.player.x, this.player.y, 180); // Golpe curto — bem mais discreto que magia
    }

    // Fecha os gaps da Frente 2 de docs/specs/13_ARPG_CAMPAIGN_AND_SAFE_HOUSE.md:
    // ações de diálogo (heal_player/give_weapon) e recompensas de quest (XP)
    // que dependem de `scene.player` — a store só enfileira, quem aplica é aqui
    // (mesmo motivo do bloco de golpe de adaga acima).
    const campaignEffects = useGameStore.getState().drainCampaignEffects();
    for (const effect of campaignEffects) {
      if (effect.type === 'heal_player') {
        this.player.heal(this.player.stats.maxHp);
        this.player.addMana(this.player.stats.maxMana);
        this.spawnFloatingText(this.player.x, this.player.y - 30, 'CURADO', '#4ade80', true);
      } else if (effect.type === 'give_xp') {
        this.player.addXp(effect.amount);
        this.spawnFloatingText(this.player.x, this.player.y - 30, `+${effect.amount} XP`, '#3b82f6', false);
      } else if (effect.type === 'give_weapon') {
        const itemData = (campaignItemsData as Record<string, any>)[effect.itemId];
        if (itemData) {
          const lootSprite = new LootSprite(this, this.player.x, this.player.y - 10, itemData);
          this.lootGroup.add(lootSprite);
          this.lightingPolish?.addItemGlow(lootSprite, itemData.rarity);
          this.spawnFloatingText(this.player.x, this.player.y - 25, itemData.name.toUpperCase(), '#B8860B', true);
        }
      }
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

    // Fase 5: ViewportCuller — esconde inimigos fora da viewport (render cost).
    // NOTA: cullamos apenas visibilidade, nunca `active`, para não quebrar
    // `countActive()` (usado para detectar floor clear / portal reveal).
    const cam = this.cameras.main;
    this.viewportCuller.update(cam.scrollX, cam.scrollY, cam.width, cam.height, activeEnemiesList);

    activeEnemiesList.forEach((enemy: Enemy) => {
      if (enemy.active) {
        const isCombatStateEarly = enemy.aiState === 'combat' || enemy.aiState === 'frenzy' || enemy.aiState === 'flee';

        // Skip full AI tick for culled passive enemies (they are offscreen & unengaged).
        // Combat-state enemies always update to avoid AI regressions.
        if (!isCombatStateEarly && this.viewportCuller.isCulled(enemy)) {
          return;
        }

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
            // Fire ranged energy bolt (pooled)
            const proj = this.enemyProjectilePool.get(0, 0);
            const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
            proj.fire(enemy.x, enemy.y, angle, 220, enemy.config.damage, true, enemy.config.statusEffectOnHit);
          } else {
            // Melee hit player
            this.playerHitByEnemy(updateResult.damage, enemy.config.statusEffectOnHit);
            const attackAngle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
            this.spawnMeleeSlashEffect(this.player.x, this.player.y, attackAngle);
          }
        } else if (updateResult.dodged) {
          this.spawnFloatingText(this.player.x, this.player.y - 14, 'MISS!', '#94a3b8', false);
          CombatFeel.triggerVibration('dodge_success');
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

    // Clear and redraw Drag-to-Aim previews / Offscreen Threat Indicator —
    // extraídos para métodos privados abaixo (item 1 do roadmap de
    // refatoração: reduzir o tamanho de update()). Permanecem em GameScene
    // (e não em um systems/ separado) por lerem apenas campos já privados da
    // própria cena, sem necessidade de expor mais superfície pública.
    this.updateDragAimPreview();
    this.updateThreatIndicator(time);
  }

  private updateDragAimPreview() {
    if (!this.dragAimGraphics) return;
    this.dragAimGraphics.clear();

    if (!this.activeDragAimSpellId) return;

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

  private updateThreatIndicator(time: number) {
    if (!this.threatIndicatorGraphics) return;

    // Offscreen Threat Indicator (Silent Hill-style edge chevrons)
    const viewW = this.cameras.main.width || window.innerWidth;
    const viewH = this.cameras.main.height || window.innerHeight;
    const cx = viewW / 2;
    const cy = viewH / 2;
    let alertCount = 0;

    this.threatIndicatorGraphics.clear();

    const atmosphereEnabled = useGameStore.getState().settings.atmosphereEffectsEnabled !== false;
    if (atmosphereEnabled) {
      let closestOffscreenEnemy: Enemy | null = null;
      let minOffscreenDistance = Infinity;

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

        // 4.2 — Distorção de Áudio Direcional & 4.4 Tinnitus de Ameaça
        const dx = enemy.x - this.player.x;
        const dy = enemy.y - this.player.y;
        const dist = Math.hypot(dx, dy);
        const relativeX = dist > 0 ? dx / dist : 0;
        const isCombatThreat = enemy.aiState === 'combat' || enemy.aiState === 'frenzy';
        soundEngine.updateSpatialThreat(relativeX, 0, isCombatThreat);

        const isEliteOrBoss = enemy.config.behavior === 'boss' || enemy.eliteAffix !== 'none';
        const hpRatio = this.player.stats.maxHp > 0 ? this.player.stats.hp / this.player.stats.maxHp : 1.0;
        const isEliteThreatClose = isEliteOrBoss && dist < 220;
        soundEngine.updateTinnitusState(hpRatio, isEliteThreatClose);
        // Frente 6 (spec 11) — Drone de tensão: reaproveita o `alertCount`
        // (nº de inimigos em combate/frenzy) já calculado acima nesta mesma
        // função, sem nova iteração sobre os inimigos.
        soundEngine.updateTensionDrone(alertCount, hpRatio);
      } else {
        soundEngine.updateSpatialThreat(0, 0, false);
        const hpRatio = this.player.stats.maxHp > 0 ? this.player.stats.hp / this.player.stats.maxHp : 1.0;
        soundEngine.updateTinnitusState(hpRatio, false);
        soundEngine.updateTensionDrone(alertCount, hpRatio);
      }
    } else {
      soundEngine.updateSpatialThreat(0, 0, false);
      soundEngine.updateTinnitusState(1.0, false);
      soundEngine.updateTensionDrone(0, 1.0);
    }

    // 4.3 & 4.4 — Vinheta Pulsante & Iluminação Dinâmica (WorldManager)
    const playerHpRatio = this.player.stats.hp / this.player.stats.maxHp;

    // Eixo A: luz real do player
    if (this.lightingSystem) {
      this.lightingSystem.updatePlayerLight(playerHpRatio);
    }

    if (this.darknessOverlay) {
      this.darknessOverlay.clear();
    }
  }

  private isBossActive(): boolean {
    return this.enemiesGroup.getChildren().some((enemyObj: any) => {
      const enemy = enemyObj as Enemy;
      return enemy.active && enemy.config.behavior === 'boss';
    });
  }

  // --- Habilidades do jogador ---
  // A implementação completa (drag-to-aim, input de skills via gamepad,
  // efeitos visuais/dano de cada spell) foi extraída para
  // systems/PlayerSkillSystem.ts (item 4 do roadmap de refatoração —
  // GameScene.ts estava com ~117KB). Estes wrappers preservam os nomes e
  // assinaturas usados pelos event listeners e por update(), delegando para
  // o novo módulo sem alterar comportamento.
  public handleDragAimStart(payload: { spellId: string }) { // público: chamado por PhaserGame.tsx via store (dragAim)
    this.skillSystem.handleDragAimStart(payload);
  }

  public handleDragAimMove(payload: { spellId: string, dx: number, dy: number }) { // público: chamado por PhaserGame.tsx via store (dragAim)
    this.skillSystem.handleDragAimMove(payload);
  }

  public handleDragAimEnd(payload: { spellId: string, dx: number, dy: number, isDrag: boolean }) { // público: chamado por PhaserGame.tsx via store (dragAim)
    this.skillSystem.handleDragAimEnd(payload);
  }

  private handleGamepadInput() {
    this.skillSystem.handleGamepadInput();
  }

  public applyRelicOnHitEffects(enemy: Enemy) { // público: usado por CollisionHandlers
    this.skillSystem.applyRelicOnHitEffects(enemy);
  }

  private firePlayerBloodBolt() {
    this.skillSystem.firePlayerBloodBolt();
  }


  // --- Colisões / Hits ---
  // Implementação completa movida para systems/CollisionHandlers.ts (item 4
  // do roadmap de refatoração, continuação da extração do PlayerSkillSystem).
  // Wrappers finos preservam nomes/assinaturas usados pelos physics.add.overlap
  // registrados em create().
  private handleProjectileHitWall(projObj: any, wallObj: any) {
    this.collisionHandlers.handleProjectileHitWall(projObj, wallObj);
  }

  private handlePlayerOpenChest(playerObj: any, chestObj: any) {
    this.collisionHandlers.handlePlayerOpenChest(playerObj, chestObj);
  }

  private handleProjectileHitEnemy(projObj: any, enemyObj: any) {
    this.collisionHandlers.handleProjectileHitEnemy(projObj, enemyObj);
  }


  // --- Scavenging & curativos ---
  // Implementação completa movida para systems/ScavengingSystem.ts (item 1 do
  // roadmap de refatoração, continuação da extração de PlayerSkillSystem,
  // CollisionHandlers e DungeonFlowController). Wrappers finos preservam os
  // nomes usados por update() e pelos handlers de input registrados em
  // create().
  public startScavenging(scav: Scavengeable) {
    this.scavengingSystem.startScavenging(scav);
  }

  public cancelScavenging() {
    this.scavengingSystem.cancelScavenging();
  }

  public completeScavenging() {
    this.scavengingSystem.completeScavenging();
  }

  public useCurativeItem(type: 'bandages' | 'antidotes' | 'antibiotics') {
    this.scavengingSystem.useCurativeItem(type);
  }

  public playerHitByEnemy( // público: usado por CombatEffectsSystem
    damage: number,
    statusEffectOnHit?: { type: 'bleeding' | 'poison' | 'infection'; chance: number },
    hitType: 'physical' | 'ranged' | 'toxic' | 'heavy' = 'physical'
  ) {
    this.collisionHandlers.playerHitByEnemy(damage, statusEffectOnHit, hitType);
  }

  private handleEnemyTouchPlayer(playerObj: any, enemyObj: any) {
    this.collisionHandlers.handleEnemyTouchPlayer(playerObj, enemyObj);
  }

  private handleEnemyProjectileHitPlayer(playerObj: any, projObj: any) {
    this.collisionHandlers.handleEnemyProjectileHitPlayer(playerObj, projObj);
  }


  // --- Feedback de combate & morte de inimigo ---
  // Implementação completa movida para systems/CombatEffectsSystem.ts (item 1
  // do roadmap de refatoração — bloco final de métodos ainda inline após a
  // extração de PlayerSkillSystem, CollisionHandlers e DungeonFlowController).
  // Wrappers finos preservam os nomes usados por update(), CollisionHandlers,
  // PlayerSkillSystem e Player.ts.
  private spawnProceduralGore(enemy: Enemy) {
    this.combatEffects.spawnProceduralGore(enemy);
  }

  public handleEnemyDeath(enemy: Enemy, killerSpellId?: string, wasLowHp: boolean = false) { // público: usado por PlayerSkillSystem
    this.combatEffects.handleEnemyDeath(enemy, killerSpellId, wasLowHp);
  }

  public revealDescentPortal(x: number, y: number) { // público: usado por CombatEffectsSystem
    this.dungeonFlow.revealDescentPortal(x, y);
  }

  private advanceToNextFloor() {
    this.dungeonFlow.advanceToNextFloor();
  }


  private handleCollectItem(playerObj: any, itemObj: any) {
    this.collisionHandlers.handleCollectItem(playerObj, itemObj);
  }

  private handleCollectLoot(playerObj: any, lootObj: any) {
    this.collisionHandlers.handleCollectLoot(playerObj, lootObj);
  }

  private triggerLevelUp() {
    this.combatEffects.triggerLevelUp();
  }

  public triggerGameOver() { // público: usado por CollisionHandlers
    this.combatEffects.triggerGameOver();
  }

  /** Emit a short burst of blood particles at a position — used by enemy damage */
  public spawnBloodBurst(x: number, y: number, count: number = 6) {
    this.combatEffects.spawnBloodBurst(x, y, count);
  }

  /** Emit a reflected projectile / counter-spark for Reflective Elite enemies */
  public spawnReflectedSpark(originX: number, originY: number, targetX: number, targetY: number) {
    const proj = this.enemyProjectilesGroup?.get() as Projectile;
    if (proj && proj.fire) {
      const angle = Phaser.Math.Angle.Between(originX, originY, targetX, targetY);
      proj.fire(originX, originY, angle, 220, 10, true);
      if (proj.setTint) {
        proj.setTint(0x38bdf8);
      }
    }
  }

  public spawnFloatingText(x: number, y: number, text: string, color: string = '#f87171', isCrit: boolean = false) {
    this.combatEffects.spawnFloatingText(x, y, text, color, isCrit);
  }

  private spawnMeleeSlashEffect(x: number, y: number, angle: number) {
    this.combatEffects.spawnMeleeSlashEffect(x, y, angle);
  }

  private registerKillCombo(x: number, y: number) {
    this.combatEffects.registerKillCombo(x, y);
  }
}
