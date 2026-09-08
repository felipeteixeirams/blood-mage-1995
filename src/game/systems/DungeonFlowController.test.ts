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
