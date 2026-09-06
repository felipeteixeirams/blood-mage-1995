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
});
