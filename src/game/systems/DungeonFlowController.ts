import Phaser from 'phaser';
import { Player } from '../objects/Player';
import { Enemy } from '../objects/Enemy';
import { Scavengeable } from '../objects/Scavengeable';
import { BiomeType, EliteAffix } from '../../types/game';
import { soundEngine } from '../../utils/soundEngine';
import { useGameStore } from '../../store/gameStore';
import { telemetry } from '../../utils/telemetry';
import { worldManager } from '../systems/WorldManager';
import { ContractSystem } from './ContractSystem';
import type { GameScene } from '../scenes/GameScene';

/**
 * Extraído de GameScene.ts (item 4 do roadmap de refatoração, continuação da
 * extração do PlayerSkillSystem e do CollisionHandlers). Concentra a
 * geração procedural de masmorra/piso, o spawn de inimigos (inicial e
 * incremental até o cap ativo), o portal de descida e o avanço de andar.
 *
 * Extração MECÂNICA — mesmo comportamento de antes. Muitos campos de
 * GameScene que eram `private` foram promovidos a `public` (depthGroup,
 * scavengeablesGroup, npcsGroup, enemyProjectilesGroup, collectiblesGroup,
 * wallsGroup, chestsGroup, achievements, lightingSystem,
 * achievementNotification, totalFloorMonsters, floorMonstersKilled,
 * portalSprite, isPortalActive, waveConfigs, pendingEnemySpawns) só para
 * permitir este acesso entre classes — mudança de visibilidade em tempo de
 * compilação apenas, sem alteração de comportamento em runtime.
 * getActiveEnemyCap, registerEntityEffects e showFloorBanner foram movidos
 * junto (só eram usados dentro deste bloco).
 */
export class DungeonFlowController {
  constructor(private scene: GameScene) {}

  private getActiveEnemyCap(): number {
    const depth = this.scene.currentFloorDepth;
    if (depth >= 5) return 30;
    if (depth === 4) return 24;
    return 18;
  }

  public checkAndSpawnPendingEnemies() {
    const scene = this.scene;
    const cap = this.getActiveEnemyCap();
    while (scene.enemiesGroup.countActive(true) < cap && scene.pendingEnemySpawns.length > 0) {
      const pending = scene.pendingEnemySpawns.shift();
      if (pending) {
        let affix: EliteAffix = 'none';
        if (scene.currentFloorDepth >= 2 && Math.random() < Math.min(0.25, 0.08 + (scene.currentFloorDepth - 1) * 0.03)) {
          const possibleAffixes: EliteAffix[] = ['frenzied', 'vampiric', 'cursed', 'spectral', 'teleporter', 'reflective'];
          affix = Phaser.Utils.Array.GetRandom(possibleAffixes);
        }

        const enemy = new Enemy(scene, pending.x, pending.y, pending.monsterId, {
          floorDepth: scene.currentFloorDepth,
          eliteAffix: affix
        });
        // Set room patrol boundaries
        enemy.patrolP1 = { x: pending.room.x + 40, y: pending.room.y + 40 };
        enemy.patrolP2 = { x: pending.room.x + pending.room.width - 40, y: pending.room.y + pending.room.height - 40 };

        scene.enemiesGroup.add(enemy);
        scene.depthGroup.add(enemy);
        scene.lightingPolish?.addMonsterGlow(enemy, pending.monsterId);
        this.registerEntityEffects(enemy);
      }
    }
  }

  private registerEntityEffects(entity: any): void {
    const scene = this.scene;
    if (scene.shadowSystem) scene.shadowSystem.registerEntity(entity);
    if (scene.reflectionSystem) scene.reflectionSystem.registerEntity(entity);
  }

  /**
   * Builds procedural 3x3 interconnected Dungeon Map with Rooms, Corridors, Walls, Chests & Enemies
   */
  public buildDungeonMap(mapW: number, mapH: number, floorDepth: number) {
    const scene = this.scene;
    // Clear pending spawns
    scene.pendingEnemySpawns = [];
    // Frente 2 de docs/specs/13_ARPG_CAMPAIGN_AND_SAFE_HOUSE.md: descarta marcos
    // descobríveis do andar anterior (os sprites já foram destruídos junto com o
    // resto do cenário — aqui só limpamos a lista pra não checar objetos mortos)
    scene.campaignDiscoverables = [];

    // Initialize contracts on first floor
    if (floorDepth === 1) {
      ContractSystem.initRunContracts();
    }

    // Determine Biome based on Floor Depth or Campaign State
    const gameMode = useGameStore.getState().gameMode;
    let biome: BiomeType = 'fosso_chagas';
    
    if (gameMode === 'campaign') {
      biome = useGameStore.getState().campaignState.currentZone;
    } else {
      if (floorDepth >= 5) {
        biome = 'santuario_sangue';
      } else if (floorDepth >= 3) {
        biome = 'catacumbas_martires';
      }
    }

    useGameStore.getState().setCurrentBiome(biome);

    // Apply WorldManager environmental biome changes (Lighting & Audio transitions)
    const { isTransitionIndoorOutdoor, previousIndoorState } = worldManager.setBiome(biome);
    const envConfig = worldManager.getCurrentConfig();
    soundEngine.updateEnvironmentAudio(envConfig.isIndoor, envConfig.reverbLevel);
    if (scene.postFX) {
      scene.postFX.setBiome(biome);
    }
    if (scene.atmosphereSystem) {
      scene.atmosphereSystem.setBiome(biome);
    }
    if (scene.lightingSystem) {
      scene.lightingSystem.enable(biome, scene.currentFloorDepth);
      scene.lightingSystem.clearTorchLights();
    }

    // Efeito de Adaptação de Pupila (Pupil Light Adaptation): Flash ao mudar de caverna/ambiente fechado para espaço aberto
    if (isTransitionIndoorOutdoor) {
      if (!envConfig.isIndoor) {
        // Entrando em ambiente aberto ensolarado/iluminado: Flash brilhante de adaptação
        scene.cameras.main.flash(350, 255, 255, 240);
      } else {
        // Entrando em subterrâneo/caverna fechada: Flash escuro de íris dilantando
        scene.cameras.main.flash(300, 20, 10, 15);
      }
    }

    const rooms = scene.dungeonGenerator.generate(mapW, mapH, biome);
    scene.rooms = rooms;
    // Fase 2 de docs/archive/specs/propostas/09_HUD_REFERENCIAS_VISUAIS_DIABLO_DUNGEON_SIEGE.md
    scene.initMinimap();

    telemetry.trackEvent('floor_start', { floor: floorDepth, biome, rooms: rooms.length });

    // Create Player in Spawn Room 0
    const spawnRoom = rooms[0];
    if (!scene.player) {
      scene.player = new Player(scene, spawnRoom.centerX, spawnRoom.centerY);
      scene.depthGroup.add(scene.player);
    } else {
      scene.player.setPosition(spawnRoom.centerX, spawnRoom.centerY);
    }
    scene.player.stats.floorDepth = floorDepth;

    // Eixo A: luz real seguindo o player (WebGL)
    if (scene.lightingSystem) {
      scene.lightingSystem.createPlayerLight();
    }

    if (scene.lightingPolish) {
      scene.lightingPolish.addPlayerStaffGlow(scene.player);
    }

    // Clear old NPCs
    scene.npcsGroup.clear(true, true);
    // Fase 1 de docs/archive/specs/propostas/09_HUD_REFERENCIAS_VISUAIS_DIABLO_DUNGEON_SIEGE.md:
    // limpa os marcadores flutuantes do andar anterior antes de recriar os NPCs
    scene.clearNpcMarkers();

    if (biome === 'safe_house') {
      // Safe House Environment Props
      const hearth = scene.wallsGroup.create(spawnRoom.centerX, spawnRoom.y + 60, 'spr_hearth_fireplace');
      hearth.setDepth(spawnRoom.y + 60);
      hearth.setSize(48, 48);

      const bed = scene.wallsGroup.create(spawnRoom.x + 80, spawnRoom.y + 120, 'spr_straw_bed');
      bed.setDepth(spawnRoom.y + 120);

      // Frente 1/2 de docs/specs/13_ARPG_CAMPAIGN_AND_SAFE_HOUSE.md: baú inicial
      // de suprimentos — abrir dá a Adaga de Aço garantida e avança o objetivo
      // obj_loot_chest de quest_ch1_first_steps (ver CollisionHandlers.ts).
      const suppliesChest = scene.chestsGroup.create(
        spawnRoom.centerX - 90,
        spawnRoom.y + 90,
        scene.dungeonGenerator.getChestTextureKey('south')
      );
      suppliesChest.setData('questChest', 'starter_dagger');
      suppliesChest.setDepth(spawnRoom.y + 90);
      if (scene.lightingSystem) scene.lightingSystem.applyLightPipeline(suppliesChest);

      // Maelen NPC
      const maelen = scene.npcsGroup.create(spawnRoom.centerX + 100, spawnRoom.centerY, 'spr_npc_maelen');
      maelen.setData('npcType', 'maelen');
      scene.depthGroup.add(maelen);
      scene.createNpcMarker(spawnRoom.centerX + 100, spawnRoom.centerY - 20, 'maelen', 0xf59e0b);

      // No enemies in Safe House
      scene.totalFloorMonsters = 0;
      scene.floorMonstersKilled = 0;

      // Create a portal to the next zone at the back of the room
      this.revealDescentPortal(spawnRoom.centerX, spawnRoom.y + 160);
    } else {
      if (gameMode === 'arcade') {
        // Spawn Safe Village NPCs in Spawn Room (Room 0)
        // 1. Cleric (Curandeiro)
        const cleric = scene.npcsGroup.create(spawnRoom.centerX - 120, spawnRoom.centerY - 80, 'spr_cultist');
        cleric.setTint(0x38bdf8); // Blue glow
        cleric.setData('npcType', 'cleric');
        scene.depthGroup.add(cleric);
        scene.createNpcMarker(spawnRoom.centerX - 120, spawnRoom.centerY - 80, 'cleric', 0x38bdf8);

        // 2. Alchemist (Alquimista)
        const alchemist = scene.npcsGroup.create(spawnRoom.centerX + 120, spawnRoom.centerY - 80, 'spr_cultist');
        alchemist.setTint(0xc084fc); // Purple glow
        alchemist.setData('npcType', 'alchemist');
        scene.depthGroup.add(alchemist);
        scene.createNpcMarker(spawnRoom.centerX + 120, spawnRoom.centerY - 80, 'alchemist', 0xc084fc);

        // 3. Blacksmith (Ferreiro)
        const blacksmith = scene.npcsGroup.create(spawnRoom.centerX - 120, spawnRoom.centerY + 80, 'spr_skeleton');
        blacksmith.setTint(0xfacc15); // Golden glow
        blacksmith.setData('npcType', 'blacksmith');
        scene.depthGroup.add(blacksmith);
        scene.createNpcMarker(spawnRoom.centerX - 120, spawnRoom.centerY + 80, 'blacksmith', 0xfacc15);

        // 4. Elder (Ancião)
        const elder = scene.npcsGroup.create(spawnRoom.centerX + 120, spawnRoom.centerY + 80, 'spr_boss');
        elder.setTint(0xf87171); // Soft Red glow
        elder.setData('npcType', 'elder');
        scene.depthGroup.add(elder);
        scene.createNpcMarker(spawnRoom.centerX + 120, spawnRoom.centerY + 80, 'elder', 0xf87171);
      }

      // Populate Enemies across Chambers & Boss Room
      scene.totalFloorMonsters = 0;
      scene.floorMonstersKilled = 0;

      const currentWave = scene.waveConfigs[Math.min(floorDepth - 1, scene.waveConfigs.length - 1)];

      // Frente 2/3 de docs/specs/13_ARPG_CAMPAIGN_AND_SAFE_HOUSE.md: gloomy_woods é
      // a "orla da floresta" logo após a Safe House — intro leve com só os
      // batedores corrompidos que o diálogo do Maelen menciona
      // (quest_ch1_first_steps > obj_clear_woods, 4 kills), sem chefe nem elite, e
      // o Altar Ancestral (obj_find_altar) pra descobrir. Reaproveita o grid 3x3
      // padrão do DungeonGenerator (portas, tochas, chests aleatórios), só troca a
      // população de inimigos/marcos por uma leva dedicada e mais fraca.
      if (biome === 'gloomy_woods') {
        const totalScouts = 4;
        let scoutsSpawned = 0;
        const huntingGrounds = rooms.filter((r) => r.type !== 'spawn' && r.type !== 'boss');

        huntingGrounds.forEach((room, idx) => {
          if (scoutsSpawned >= totalScouts) return;
          const isLastRoom = idx === huntingGrounds.length - 1;
          const remaining = totalScouts - scoutsSpawned;
          const countHere = isLastRoom ? remaining : Math.min(1 + Math.floor(Math.random() * 2), remaining);

          for (let i = 0; i < countHere; i++) {
            const spawnX = room.x + 50 + Math.random() * (room.width - 100);
            const spawnY = room.y + 50 + Math.random() * (room.height - 100);
            scene.pendingEnemySpawns.push({ x: spawnX, y: spawnY, monsterId: 'scout_beast', room });
            scene.totalFloorMonsters++;
            scoutsSpawned++;
          }
        });

        // Altar Ancestral — sala secret_treasure do grid genérico já fica no
        // canto oposto ao spawn, serve bem como "escombros do altar ao leste"
        const altarRoom = rooms.find((r) => r.type === 'secret_treasure') || rooms[rooms.length - 1];
        if (altarRoom) {
          const altar = scene.add.image(altarRoom.centerX, altarRoom.centerY, 'spr_altar_crimson');
          altar.setDepth(altarRoom.centerY);
          altar.setData('campaignDiscoverableId', 'altar_crimson');
          scene.depthGroup.add(altar);
          if (scene.lightingSystem) scene.lightingSystem.applyLightPipeline(altar);
          scene.campaignDiscoverables.push(altar);
        }

        this.checkAndSpawnPendingEnemies();
        this.showFloorBanner(floorDepth);
        return;
      }

      rooms.forEach((room) => {
        if (room.type === 'spawn') return; // Spawn room is safe!

        if (room.type === 'boss') {
          // Boss Sanctum Room
          const bossId = currentWave.isBossWave && currentWave.bossMonsterId ? currentWave.bossMonsterId : 'necro_lord_boss';
          const boss = new Enemy(scene, room.centerX, room.centerY, bossId, { floorDepth, eliteAffix: 'none' });
          scene.enemiesGroup.add(boss);
          scene.depthGroup.add(boss);
          scene.lightingPolish?.addMonsterGlow(boss, bossId);
          this.registerEntityEffects(boss);
          scene.totalFloorMonsters++;

          if (bossId === 'necro_lord_boss' || bossId.includes('boss')) {
            useGameStore.getState().triggerOnboardingEvent('firstBossSeen', 'CUIDADO: O Senhor das Chagas despertou! Ele entrará em fúria se ferido!');
          }

          // Add Elite Bodyguards scaled by blood_tide
          const hasBloodTide = useGameStore.getState().activeModifiers.includes('blood_tide');
          const spawnMultiplier = hasBloodTide ? 1.4 : 1.0;
          const bodyguardCount = Math.round(2 * spawnMultiplier);
          for (let i = 0; i < bodyguardCount; i++) {
            const offset = i === 0 ? -90 : (i === 1 ? 90 : (i === 2 ? -140 : 140));
            const guard = new Enemy(scene, room.centerX + offset, room.centerY + 50, 'cultist_acolyte', { floorDepth, eliteAffix: 'none' });
            scene.enemiesGroup.add(guard);
            scene.depthGroup.add(guard);
            scene.lightingPolish?.addMonsterGlow(guard, 'cultist_acolyte');
            this.registerEntityEffects(guard);
            scene.totalFloorMonsters++;
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

            scene.pendingEnemySpawns.push({ x: spawnX, y: spawnY, monsterId, room });
            scene.totalFloorMonsters++;
          }
        }

        // Spawn Scavengeables in non-spawn rooms
        if (Math.random() < 0.75) {
          const numScav = Math.random() < 0.5 ? 1 : 2;
          for (let i = 0; i < numScav; i++) {
            const sx = room.x + 50 + Math.random() * (room.width - 100);
            const sy = room.y + 50 + Math.random() * (room.height - 100);
            const stype = Phaser.Utils.Array.GetRandom(['skeleton', 'corpse', 'crate']) as any;
            const scavObj = new Scavengeable(scene, sx, sy, stype);
            scene.scavengeablesGroup.add(scavObj);
            scene.depthGroup.add(scavObj);
          }
        }
      });
    }

    // Initial spawn push up to cap
    this.checkAndSpawnPendingEnemies();

    // Floor Announcement Banner
    this.showFloorBanner(floorDepth);
  }

  private showFloorBanner(floorDepth: number) {
    const scene = this.scene;
    const titles = ['CATACOMBAS DOS MORTOS', 'SANTUÁRIO DAS SOMBRAS', 'ABISMO INFERNAL', 'TRONO DO SENHOR DA MORTE'];
    const floorTitle = titles[(floorDepth - 1) % titles.length];

    const text = scene.add.text(
      scene.player.x,
      scene.player.y - 120,
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

    scene.tweens.add({
      targets: text,
      y: text.y - 30,
      alpha: 0,
      duration: 3200,
      onComplete: () => text.destroy(),
    });
  }

  public revealDescentPortal(x: number, y: number) {
    const scene = this.scene;
    scene.isPortalActive = true;
    scene.portalSprite = scene.add.sprite(x, y, 'spr_portal').setDepth(10).setScale(1.2);
    scene.lightingPolish?.addPortalGlow(scene.portalSprite);

    // Swirling portal tween
    scene.tweens.add({
      targets: scene.portalSprite,
      rotation: Math.PI * 2,
      duration: 3000,
      repeat: -1,
    });

    // Portal Announcement
    const text = scene.add.text(
      scene.player.x,
      scene.player.y - 100,
      '🌀 O PORTAL PARA AS PROFUNDEZES FOI REVELADO! 🌀',
      {
        fontSize: '20px',
        color: '#a855f7',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 5,
      }
    ).setOrigin(0.5).setDepth(2200);

    scene.tweens.add({
      targets: text,
      y: text.y - 40,
      alpha: 0,
      duration: 3500,
      onComplete: () => text.destroy(),
    });
  }

  public advanceToNextFloor() {
    const scene = this.scene;
    scene.isPortalActive = false;
    soundEngine.playPortalEnter();
    if (scene.portalSprite) {
      scene.portalSprite.destroy();
      scene.portalSprite = undefined;
    }

    const hpRatio = scene.player.stats.hp / scene.player.stats.maxHp;
    ContractSystem.onFloorCompleted(scene.currentFloorDepth, hpRatio, scene);

    const store = useGameStore.getState();
    const gameMode = store.gameMode;
    const currentZone = store.campaignState.currentZone;

    if (gameMode === 'campaign') {
      if (currentZone === 'safe_house') {
        store.setCampaignZone('gloomy_woods');
      } else if (currentZone === 'gloomy_woods') {
        store.setCampaignZone('fosso_chagas');
      } else if (currentZone === 'fosso_chagas') {
        store.setCampaignZone('catacumbas_martires');
      } else if (currentZone === 'catacumbas_martires') {
        store.setCampaignZone('santuario_sangue');
      } else {
        // Keeps the same, or handle end of campaign
        store.setCampaignZone('santuario_sangue');
      }
    }

    scene.currentFloorDepth++;
    scene.player.heal(35); // Reward floor clear with HP restore
    scene.player.addMana(50);

    // Fase 5: Achievement Wiring - Depth-based achievements
    if (scene.achievements) {
      if (scene.currentFloorDepth >= 10) {
        const achDepth = scene.achievements.unlock('depth_10');
        if (achDepth && scene.achievementNotification) {
          scene.achievementNotification.show({
            name: achDepth.name,
            description: achDepth.description,
            icon: '🔻',
            rewards: {
              bloodCrystals: achDepth.reward?.bloodCrystals,
              talentPoints: achDepth.reward?.talentPoints,
            },
            rarity: 'epic',
          });
        }
      }

      if (scene.currentFloorDepth >= 25) {
        const achDeep = scene.achievements.unlock('depth_25');
        if (achDeep && scene.achievementNotification) {
          scene.achievementNotification.show({
            name: achDeep.name,
            description: achDeep.description,
            icon: '🌑',
            rewards: {
              bloodCrystals: achDeep.reward?.bloodCrystals,
              talentPoints: achDeep.reward?.talentPoints,
            },
            rarity: 'legendary',
          });
        }
      }
    }

    // Clear old map entities
    scene.wallsGroup.clear(true, true);
    scene.chestsGroup.clear(true, true);
    scene.collectiblesGroup.clear(true, true);
    scene.enemyProjectilesGroup.clear(true, true);
    scene.scavengeablesGroup.clear(true, true);
    scene.lootGroup.clear(true, true);
    scene.bloodStainsGroup.clear(true, true);
    scene.bloodSplatterSystem?.clearAll();

    // If player leaves floor without collecting corpse, it is lost
    if (store.playerStats.droppedCorpse.hasDroppedCorpse) {
      store.setDroppedCorpse({
        ...store.playerStats.droppedCorpse,
        hasDroppedCorpse: false
      });
      store.addLootLog("O cadáver foi deixado para trás e perdido para sempre nas catacumbas...");
    }

    // Rebuild Dungeon Map for Next Floor Depth!
    this.buildDungeonMap(1920, 1440, scene.currentFloorDepth);
  }
}
