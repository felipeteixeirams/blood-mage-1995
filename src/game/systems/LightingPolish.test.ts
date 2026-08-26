import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LightingPolish } from './LightingPolish';

function makeMockScene() {
  const lights = {
    active: true,
    addLight: vi.fn((x: number, y: number, radius: number, color: number, intensity: number) => ({
      x, y, radius, color, intensity,
      setPosition: vi.fn(),
    })),
    removeLight: vi.fn(),
  };

  const tweens = {
    add: vi.fn(() => ({})),
  };

  const events = {
    on: vi.fn(),
    off: vi.fn(),
  };

  const scene = {
    lights,
    tweens,
    events,
  };

  return { scene, lights, tweens, events };
}

describe('LightingPolish', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('adiciona glow ao item e inicia pulsação para itens raros/épicos/lendários', () => {
    const { scene, lights, tweens } = makeMockScene();
    const polish = new LightingPolish(scene as any);

    const mockSprite = {
      x: 100,
      y: 200,
      scale: 1,
      active: true,
      once: vi.fn(),
    } as any;

    polish.addItemGlow(mockSprite, 'epic');
    expect(lights.addLight).toHaveBeenCalledWith(100, 200, 44, 0xa855f7, 0.85);
    expect(tweens.add).toHaveBeenCalled();
  });

  it('adiciona glow a monstro baseado no tipo', () => {
    const { scene, lights } = makeMockScene();
    const polish = new LightingPolish(scene as any);

    const mockSprite = {
      x: 50,
      y: 80,
      active: true,
      once: vi.fn(),
    } as any;

    polish.addMonsterGlow(mockSprite, 'blood_specter');
    expect(lights.addLight).toHaveBeenCalledWith(50, 80, 45, 0xa855f7, 0.75);
  });

  it('dispara flash de luz em impacto crítico', () => {
    const { scene, lights, tweens } = makeMockScene();
    const polish = new LightingPolish(scene as any);

    polish.addCriticalImpactGlow(150, 250);
    expect(lights.addLight).toHaveBeenCalledWith(150, 250, 120, 0xffeb3b, 1.4);
    expect(tweens.add).toHaveBeenCalled();
  });

  it('dispara pulso de cura e level up', () => {
    const { scene, lights } = makeMockScene();
    const polish = new LightingPolish(scene as any);

    polish.addHealGlow(200, 300);
    expect(lights.addLight).toHaveBeenCalledWith(200, 300, 90, 0x10b981, 1.1);

    polish.addLevelUpGlow(200, 300);
    expect(lights.addLight).toHaveBeenCalledWith(200, 300, 130, 0xfef08a, 1.5);
  });

  it('adiciona glow a orbes de hp/mana/gemas', () => {
    const { scene, lights } = makeMockScene();
    const polish = new LightingPolish(scene as any);

    const mockSprite = {
      x: 75,
      y: 125,
      active: true,
      once: vi.fn(),
    } as any;

    polish.addCollectibleGlow(mockSprite, 'hp');
    expect(lights.addLight).toHaveBeenCalledWith(75, 125, 40, 0xef4444, 0.8);

    polish.addCollectibleGlow(mockSprite, 'mana');
    expect(lights.addLight).toHaveBeenCalledWith(75, 125, 40, 0x3b82f6, 0.85);
  });

  it('dispara luz de área para magias (Hellfire Nova, Syphon Soul, etc.)', () => {
    const { scene, lights, tweens } = makeMockScene();
    const polish = new LightingPolish(scene as any);

    polish.addAreaSpellGlow(120, 180, 'hellfire_nova', 220, 400);
    expect(lights.addLight).toHaveBeenCalledWith(120, 180, 88, 0xf97316, 1.6);
    expect(tweens.add).toHaveBeenCalled();
  });

  it('limpa todas as luzes com cleanup()', () => {
    const { scene, lights } = makeMockScene();
    const polish = new LightingPolish(scene as any);

    const mockSprite = {
      x: 50,
      y: 80,
      active: true,
      once: vi.fn(),
    } as any;

    polish.addMonsterGlow(mockSprite, 'skeleton_warrior');
    polish.cleanup();
    expect(lights.removeLight).toHaveBeenCalled();
  });
});
