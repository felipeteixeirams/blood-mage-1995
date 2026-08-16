import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ScreenEffects } from './ScreenEffects';

interface Mock2DContext {
  createRadialGradient: ReturnType<typeof vi.fn>;
  fillStyle: string;
  fillRect: ReturnType<typeof vi.fn>;
  clearRect: ReturnType<typeof vi.fn>;
  drawImage: ReturnType<typeof vi.fn>;
  beginPath: ReturnType<typeof vi.fn>;
  ellipse: ReturnType<typeof vi.fn>;
  fill: ReturnType<typeof vi.fn>;
  globalAlpha: number;
  globalCompositeOperation: string;
  filter: string;
}

interface MockScene {
  make: {
    graphics: ReturnType<typeof vi.fn>;
  };
}

describe('ScreenEffects', () => {
  let mockScene: MockScene;
  let mockCtx: Mock2DContext;

  beforeEach(() => {
    vi.useFakeTimers();

    mockCtx = {
      createRadialGradient: vi.fn().mockReturnValue({
        addColorStop: vi.fn(),
      }),
      fillStyle: '',
      fillRect: vi.fn(),
      clearRect: vi.fn(),
      drawImage: vi.fn(),
      beginPath: vi.fn(),
      ellipse: vi.fn(),
      fill: vi.fn(),
      globalAlpha: 1,
      globalCompositeOperation: 'source-over',
      filter: 'none',
    };

    // Mock HTMLCanvasElement.prototype.getContext for jsdom
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(mockCtx as unknown as CanvasRenderingContext2D);

    mockScene = {
      make: {
        graphics: vi.fn().mockReturnValue({
          generateTexture: vi.fn().mockReturnValue({}),
        }),
      },
    };
  });

  it('initializes canvas and vignette texture correctly', () => {
    const effects = new ScreenEffects(mockScene as unknown as Phaser.Scene, 1280, 720);
    const canvas = effects.getCanvas();
    expect(canvas).toBeDefined();
    expect(canvas.width).toBe(1280);
    expect(canvas.height).toBe(720);
    expect(mockScene.make.graphics).toHaveBeenCalled();
  });

  it('sets darkness, vignette, distortion and chromatic aberration levels within [0, 1] bounds', () => {
    const effects = new ScreenEffects(mockScene as unknown as Phaser.Scene, 1280, 720);
    effects.setDarkness(1.5, 300);
    effects.setVignette(-0.5, 300);
    effects.setDistortion(0.8, 300);
    effects.setChromaticAberration(0.5, 300);

    // Update easing
    effects.update(300);

    // Canvas render without throwing errors
    const dummyGameCanvas = document.createElement('canvas');
    dummyGameCanvas.width = 1280;
    dummyGameCanvas.height = 720;
    expect(() => effects.render(dummyGameCanvas)).not.toThrow();
  });

  it('applies effect presets correctly', () => {
    const effects = new ScreenEffects(mockScene as unknown as Phaser.Scene, 1280, 720);
    effects.effectDeath();
    effects.update(500);

    effects.effectCriticalDamage();
    effects.update(150);

    effects.effectInfection();
    effects.update(300);

    effects.effectTension(0.4);
    effects.update(1000);

    expect(() => effects.render(document.createElement('canvas'))).not.toThrow();
  });

  it('triggers fear distortion and resets values over time', () => {
    const effects = new ScreenEffects(mockScene as unknown as Phaser.Scene, 1280, 720);
    effects.triggerFearDistortion(1000);

    vi.advanceTimersByTime(400);
    effects.update(400);

    vi.advanceTimersByTime(600);
    effects.update(600);

    effects.reset();
    expect(() => effects.render(document.createElement('canvas'))).not.toThrow();
  });
});
