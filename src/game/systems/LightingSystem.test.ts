import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LightingSystem } from './LightingSystem';

describe('LightingSystem (Frente C)', () => {
  let mockScene: any;
  let mockLights: any;

  beforeEach(() => {
    mockLights = {
      active: false,
      enable: vi.fn(() => { mockLights.active = true; }),
      setAmbientColor: vi.fn(),
      addLight: vi.fn((x: number, y: number, radius: number, color: number, intensity: number) => ({
        x,
        y,
        radius,
        color,
        intensity,
      })),
      removeLight: vi.fn(),
      shutdown: vi.fn(),
    };

    mockScene = {
      game: {
        renderer: {
          isWebGL: true,
        },
      },
      lights: mockLights,
      player: { x: 100, y: 150 },
    };
  });

  it('initializes and enables lights for active biome', () => {
    const system = new LightingSystem(mockScene);
    expect(system.isActive()).toBe(true);

    system.enable('catacumbas_martires', 2);
    expect(mockLights.enable).toHaveBeenCalled();
    expect(mockLights.setAmbientColor).toHaveBeenCalled();
  });

  it('creates and updates player light based on HP ratio', () => {
    const system = new LightingSystem(mockScene);
    system.enable('fosso_chagas');
    system.createPlayerLight();

    expect(mockLights.addLight).toHaveBeenCalledWith(100, 150, 180, 0xff5522, 1.0);

    // Update with 50% HP
    system.updatePlayerLight(0.5);
    // baseRadius 180 * (0.6 + 0.4 * 0.5) = 180 * 0.8 = 144
    const light = (system as any).playerLight;
    expect(light.radius).toBe(144);
  });

  it('adds, flickers, and clears torch lights', () => {
    const system = new LightingSystem(mockScene);
    system.enable('santuario_sangue');

    system.addTorchLights([
      { x: 50, y: 50, kind: 'torch' },
      { x: 200, y: 200, kind: 'brazier' },
    ]);

    expect(mockLights.addLight).toHaveBeenCalledTimes(2);

    // Simulate update
    system.update(1000, 16);
    expect((system as any).torchLights.length).toBe(2);

    system.clearTorchLights();
    expect(mockLights.removeLight).toHaveBeenCalledTimes(2);
    expect((system as any).torchLights.length).toBe(0);
  });

  it('handles shutdown cleanly', () => {
    const system = new LightingSystem(mockScene);
    system.enable('gloomy_woods');
    system.createPlayerLight();

    system.shutdown();
    expect(mockLights.shutdown).toHaveBeenCalled();
    expect((system as any).playerLight).toBeNull();
  });
});
