import { describe, it, expect } from 'vitest';

// Mesmo motivo dos outros testes de systems/: acessar o namespace Phaser em
// runtime cascateia dependências reais de canvas/WebGL que quebram em
// jsdom. DungeonFlowController importa Player/Enemy/Scavengeable, que
// declaram `class X extends Phaser.Physics.Arcade.Sprite` — isso roda na
// AVALIAÇÃO do módulo (precisa de uma classe extensível de verdade), não
// só quando instanciado. Como não exercitamos Player/Enemy/Scavengeable
// aqui (só `getNextCampaignZone`, que não toca `this.scene`), uma classe
// vazia basta. `Phaser.Utils.Array.GetRandom` também é referenciado em
// `checkAndSpawnPendingEnemies` (não exercitado por estes testes).
import { vi } from 'vitest';
vi.mock('phaser', () => ({
  default: {
    Physics: { Arcade: { Sprite: class {} } },
    Utils: { Array: { GetRandom: () => 'none' } },
  },
}));

import { DungeonFlowController } from './DungeonFlowController';
import type { BiomeType } from '../../types/game';

/**
 * Fase B (mundo contínuo): `getNextCampaignZone` substitui o if/else
 * hardcoded que existia direto em `advanceToNextFloor()` pelo mecanismo
 * genérico do `ChunkStreamer` (Fase A). Estes testes provam que a troca
 * produz EXATAMENTE a mesma sequência de biomas que o if/else antigo —
 * zero mudança de comportamento observável, só o mecanismo por baixo do
 * capô muda (ver comentário na constante `CAMPAIGN_ZONE_CHUNKS`).
 */
describe('DungeonFlowController.getNextCampaignZone (Fase B — encanamento interno)', () => {
  // `getNextCampaignZone` não toca em `this.scene` — só no `zoneStreamer`
  // interno — então um mock vazio de GameScene já basta aqui.
  const makeController = () => new DungeonFlowController({} as any);

  it('reproduz a mesma sequência linear do if/else antigo, bioma por bioma', () => {
    const controller = makeController();

    // Sequência exata que existia hardcoded: safe_house -> gloomy_woods ->
    // fosso_chagas -> catacumbas_martires -> santuario_sangue.
    expect(controller.getNextCampaignZone('safe_house')).toBe('gloomy_woods');
    expect(controller.getNextCampaignZone('gloomy_woods')).toBe('fosso_chagas');
    expect(controller.getNextCampaignZone('fosso_chagas')).toBe('catacumbas_martires');
    expect(controller.getNextCampaignZone('catacumbas_martires')).toBe('santuario_sangue');
  });

  it('satura em santuario_sangue (fim de campanha), igual ao `else` antigo', () => {
    const controller = makeController();
    expect(controller.getNextCampaignZone('santuario_sangue')).toBe('santuario_sangue');
    // Chamar de novo continua saturado (modo "andar infinito" pós-campanha)
    expect(controller.getNextCampaignZone('santuario_sangue')).toBe('santuario_sangue');
  });

  it('é determinístico e sem efeito colateral cruzado entre chamadas independentes', () => {
    const controller = makeController();
    const results: BiomeType[] = [
      controller.getNextCampaignZone('safe_house'),
      controller.getNextCampaignZone('safe_house'), // mesma entrada, mesma saída
      controller.getNextCampaignZone('catacumbas_martires'),
    ];
    expect(results).toEqual(['gloomy_woods', 'gloomy_woods', 'santuario_sangue']);
  });

  it('revealDescentDoor cria a estrutura física de porta e ativa o portal de saída', () => {
    const mockSprite = { setDepth: vi.fn().mockReturnThis(), setScale: vi.fn().mockReturnThis() };
    const mockText = { setOrigin: vi.fn().mockReturnThis(), setDepth: vi.fn().mockReturnThis() };
    const mockScene: any = {
      isPortalActive: false,
      portalSprite: undefined,
      textures: { exists: vi.fn().mockReturnValue(true) },
      add: {
        sprite: vi.fn().mockReturnValue(mockSprite),
        text: vi.fn().mockReturnValue(mockText),
      },
      player: { x: 100, y: 100 },
      tweens: { add: vi.fn() },
    };

    const controller = new DungeonFlowController(mockScene);
    controller.revealDescentDoor(400, 300);

    expect(mockScene.isPortalActive).toBe(true);
    expect(mockScene.add.sprite).toHaveBeenCalledWith(400, 300, 'tile_door');
    expect(mockSprite.setScale).toHaveBeenCalledWith(1.5);
  });

  it('updateChunkStream atualiza os limites de mundo e câmera dinamicamente', () => {
    const mockScene: any = {
      updateWorldAndCameraBounds: vi.fn(),
      dungeonGenerator: { generate: vi.fn().mockReturnValue([]) },
      rooms: [],
      postFX: { setBiome: vi.fn() },
      atmosphereSystem: { setBiome: vi.fn() },
      lightingSystem: { enable: vi.fn() },
    };

    const controller = new DungeonFlowController(mockScene);
    controller.updateChunkStream(500); // chunk index 0 (safe_house)

    expect(mockScene.updateWorldAndCameraBounds).toHaveBeenCalledWith(0, 0, 3840, 1440);
  });

  it('sem markOwnFloorChunkAsBuilt, updateChunkStream regenera o chunk do piso da campanha (bug real reproduzido)', () => {
    const mockScene: any = {
      updateWorldAndCameraBounds: vi.fn(),
      dungeonGenerator: { generate: vi.fn().mockReturnValue([]) },
      rooms: [],
      postFX: { setBiome: vi.fn() },
      atmosphereSystem: { setBiome: vi.fn(), blendBiomes: vi.fn() },
      lightingSystem: { enable: vi.fn() },
    };

    const controller = new DungeonFlowController(mockScene);
    // playerX=500 cai no chunk 0 (safe_house, 0-1920) — mesma faixa onde o
    // piso da campanha (biome: safe_house) acabou de ser montado por
    // buildDungeonMap(), sem a marcação de builtChunkIndices. Com
    // loadRadius:1, chunk 0 (safe_house) E chunk 1 (gloomy_woods, vizinho)
    // carregam na mesma chamada — sem a marcação, os DOIS rodam
    // dungeonGenerator.generate(), incluindo o safe_house que buildDungeonMap()
    // já tinha acabado de montar (o bug real: regeneração duplicada dele).
    controller.updateChunkStream(500);

    expect(mockScene.dungeonGenerator.generate).toHaveBeenCalledTimes(2);
    expect(mockScene.dungeonGenerator.generate).toHaveBeenCalledWith(1920, 1440, 'safe_house');
  });

  it('markOwnFloorChunkAsBuilt impede que updateChunkStream regenere o chunk do piso da campanha (fix)', () => {
    const mockScene: any = {
      updateWorldAndCameraBounds: vi.fn(),
      dungeonGenerator: { generate: vi.fn().mockReturnValue([]) },
      rooms: [],
      postFX: { setBiome: vi.fn() },
      atmosphereSystem: { setBiome: vi.fn(), blendBiomes: vi.fn() },
      lightingSystem: { enable: vi.fn() },
    };

    const controller = new DungeonFlowController(mockScene);
    // Mesma chamada que buildDungeonMap() faz para o gameMode === 'campaign'
    // logo após determinar o bioma do piso.
    controller.markOwnFloorChunkAsBuilt('safe_house');
    controller.updateChunkStream(500);

    // O chunk 0 (safe_house) já está marcado como construído — loadChunkBiome
    // não roda dungeonGenerator.generate() de novo pra ele; o único chunk que
    // gera é o vizinho (chunk 1, gloomy_woods), carregado normalmente.
    expect(mockScene.dungeonGenerator.generate).toHaveBeenCalledTimes(1);
    expect(mockScene.dungeonGenerator.generate).toHaveBeenCalledWith(1920, 1440, 'gloomy_woods');
  });

  it('markOwnFloorChunkAsBuilt não afeta chunks vizinhos — eles continuam carregando normalmente', () => {
    const mockScene: any = {
      updateWorldAndCameraBounds: vi.fn(),
      dungeonGenerator: { generate: vi.fn().mockReturnValue([]) },
      rooms: [],
      postFX: { setBiome: vi.fn(), blendBiomes: vi.fn() },
      atmosphereSystem: { setBiome: vi.fn(), blendBiomes: vi.fn() },
      lightingSystem: { enable: vi.fn() },
      currentFloorDepth: 1,
    };

    const controller = new DungeonFlowController(mockScene);
    controller.markOwnFloorChunkAsBuilt('safe_house'); // marca só o chunk 0

    // playerX=1920 cai no chunk 1 (gloomy_woods) — com loadRadius:1, chunks
    // 0 (safe_house, marcado), 1 (gloomy_woods) e 2 (fosso_chagas) carregam.
    controller.updateChunkStream(1920);

    // Chunk 0 (marcado) não gera de novo; os dois vizinhos não-marcados geram normalmente.
    expect(mockScene.dungeonGenerator.generate).toHaveBeenCalledTimes(2);
    expect(mockScene.dungeonGenerator.generate).not.toHaveBeenCalledWith(1920, 1440, 'safe_house');
    expect(mockScene.dungeonGenerator.generate).toHaveBeenCalledWith(1920, 1440, 'gloomy_woods');
    expect(mockScene.dungeonGenerator.generate).toHaveBeenCalledWith(1920, 1440, 'fosso_chagas');
  });

  it('updateBoundaryTransitions (Fase C) calcula blendT e invoca blendBiomes ao aproximar da fronteira entre chunks', () => {
    const mockAtmosphere = { blendBiomes: vi.fn(), setBiome: vi.fn() };
    const mockPostFX = { blendBiomes: vi.fn(), setBiome: vi.fn() };
    const mockScene: any = {
      updateWorldAndCameraBounds: vi.fn(),
      dungeonGenerator: { generate: vi.fn().mockReturnValue([]) },
      rooms: [],
      atmosphereSystem: mockAtmosphere,
      postFX: mockPostFX,
      lightingSystem: { enable: vi.fn() },
      currentFloorDepth: 1,
    };

    const controller = new DungeonFlowController(mockScene);

    // 1. No centro do chunk 0 (safe_house, x=960) -> fora do MARGIN de 400px antes da borda 1920
    controller.updateChunkStream(960);
    expect(mockAtmosphere.blendBiomes).not.toHaveBeenCalled();

    // 2. A 200px da borda (x=1720) -> dentro da margem [1520, 2320], blendT = (1720 - 1520) / 800 = 0.25
    controller.updateChunkStream(1720);
    expect(mockAtmosphere.blendBiomes).toHaveBeenCalledWith('safe_house', 'gloomy_woods', 0.25);
    expect(mockPostFX.blendBiomes).toHaveBeenCalledWith('safe_house', 'gloomy_woods', 0.25, 1);

    // 3. Exatamente na borda (x=1920) -> blendT = (1920 - 1520) / 800 = 0.5
    controller.updateChunkStream(1920);
    expect(mockAtmosphere.blendBiomes).toHaveBeenCalledWith('safe_house', 'gloomy_woods', 0.5);
  });
});
