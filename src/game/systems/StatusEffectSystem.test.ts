import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StatusEffectSystem } from './StatusEffectSystem';

function makeMockScene() {
  const textures = {
    exists: vi.fn(() => true),
  };

  const add = {
    particles: vi.fn(() => ({
      setDepth: vi.fn().mockReturnThis(),
      emitParticleAt: vi.fn(),
      destroy: vi.fn(),
    })),
    sprite: vi.fn(() => ({
      setScale: vi.fn().mockReturnThis(),
      setAlpha: vi.fn().mockReturnThis(),
      setDepth: vi.fn().mockReturnThis(),
      setPosition: vi.fn().mockReturnThis(),
      destroy: vi.fn(),
      active: true,
    })),
  };

  const scene = {
    textures,
    add,
    spawnFloatingText: vi.fn(),
  };

  return { scene, textures, add };
}

describe('StatusEffectSystem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('aplica e detecta status de burning no alvo', () => {
    const { scene } = makeMockScene();
    const system = new StatusEffectSystem(scene as any);

    const target = {
      x: 100,
      y: 100,
      active: true,
      hp: 100,
      takeDamage: vi.fn(),
      setTint: vi.fn(),
      clearTint: vi.fn(),
      once: vi.fn(),
    } as any;

    system.applyStatus(target, 'burning', 3000, 20);
    expect(system.hasStatus(target, 'burning')).toBe(true);
    expect(system.hasStatus(target, 'frozen')).toBe(false);
  });

  it('executa ticks periódicos de DoT e aplica dano ao alvo', () => {
    const { scene } = makeMockScene();
    const system = new StatusEffectSystem(scene as any);

    const target = {
      x: 100,
      y: 100,
      active: true,
      hp: 100,
      takeDamage: vi.fn(),
      setTint: vi.fn(),
      clearTint: vi.fn(),
      once: vi.fn(),
    } as any;

    system.applyStatus(target, 'burning', 2000, 25);
    
    // Update com delta menor que tickInterval (400ms)
    system.update(100, 200);
    expect(target.takeDamage).not.toHaveBeenCalled();

    // Update completando tickInterval (200 + 250 = 450ms)
    system.update(350, 250);
    expect(target.takeDamage).toHaveBeenCalled();
    expect(scene.spawnFloatingText).toHaveBeenCalled();
  });

  it('remove status específico e restaura tint original', () => {
    const { scene } = makeMockScene();
    const system = new StatusEffectSystem(scene as any);

    const target = {
      x: 100,
      y: 100,
      active: true,
      hp: 100,
      takeDamage: vi.fn(),
      setTint: vi.fn(),
      applyBaseTint: vi.fn(),
      once: vi.fn(),
    } as any;

    system.applyStatus(target, 'frozen', 1500);
    expect(system.hasStatus(target, 'frozen')).toBe(true);

    system.removeStatus(target, 'frozen');
    expect(system.hasStatus(target, 'frozen')).toBe(false);
    expect(target.applyBaseTint).toHaveBeenCalled();
  });
});
