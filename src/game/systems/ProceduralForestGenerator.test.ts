import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProceduralForestGenerator } from './ProceduralForestGenerator';

describe('ProceduralForestGenerator (Gloomy Woods Polish)', () => {
  let mockScene: any;
  let forestGen: ProceduralForestGenerator;

  beforeEach(() => {
    mockScene = {
      sys: {
        settings: {
          key: 'GameScene'
        }
      },
      textures: {
        exists: vi.fn().mockReturnValue(false),
        remove: vi.fn(),
        createCanvas: vi.fn().mockImplementation((key, w, h) => ({
          context: {
            createLinearGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
            createRadialGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
            clearRect: vi.fn(),
            fillRect: vi.fn(),
            beginPath: vi.fn(),
            moveTo: vi.fn(),
            lineTo: vi.fn(),
            stroke: vi.fn(),
            fill: vi.fn(),
            ellipse: vi.fn(),
            arc: vi.fn(),
            strokeRect: vi.fn()
          },
          refresh: vi.fn()
        })),
        get: vi.fn().mockReturnValue({
          source: [{ width: 160, height: 220 }]
        })
      },
      add: {
        graphics: vi.fn().mockReturnValue({
          fillStyle: vi.fn(),
          fillEllipse: vi.fn(),
          fillRect: vi.fn(),
          lineStyle: vi.fn(),
          beginPath: vi.fn(),
          moveTo: vi.fn(),
          lineTo: vi.fn(),
          strokePath: vi.fn(),
          destroy: vi.fn()
        }),
        image: vi.fn().mockReturnValue({
          setDepth: vi.fn(),
          setTint: vi.fn()
        }),
        sprite: vi.fn().mockReturnValue({
          setOrigin: vi.fn(),
          setDepth: vi.fn(),
          setPixelArt: vi.fn(),
          setScrollFactor: vi.fn(),
          setScale: vi.fn(),
          setTint: vi.fn(),
          setAlpha: vi.fn()
        })
      },
      depthGroup: {
        add: vi.fn()
      }
    };

    forestGen = new ProceduralForestGenerator(mockScene);
  });

  it('draws fractal tree graphics with distinct foliage palettes based on variantIndex', () => {
    const mockGraphics: any = {
      fillStyle: vi.fn(),
      fillEllipse: vi.fn(),
      fillRect: vi.fn(),
      lineStyle: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      strokePath: vi.fn()
    };

    // Draw variant 0 (Pine - Green)
    forestGen.drawFractalTreeGraphics(mockGraphics, 80, 175, 1000, 0);
    const fillStyleCallsVariant0 = mockGraphics.fillStyle.mock.calls;

    mockGraphics.fillStyle.mockClear();

    // Draw variant 1 (Withered Autumn - Amber/Ochre)
    forestGen.drawFractalTreeGraphics(mockGraphics, 80, 175, 1000, 1);
    const fillStyleCallsVariant1 = mockGraphics.fillStyle.mock.calls;

    expect(fillStyleCallsVariant0).not.toEqual(fillStyleCallsVariant1);
  });

  it('generates forest room data successfully and instantiates trees with parallax background layer', () => {
    const rooms = forestGen.generate(640, 320);

    expect(rooms.length).toBe(1);
    expect(rooms[0].type).toBe('spawn');

    // Verify background parallax trees were rendered with scrollFactor/scale/tint
    const spriteCalls = mockScene.add.sprite.mock.results;
    expect(spriteCalls.length).toBeGreaterThan(0);

    const bgTreeInstance = spriteCalls[0].value;
    expect(bgTreeInstance.setScrollFactor).toHaveBeenCalledWith(0.65, 0.65);
    expect(bgTreeInstance.setScale).toHaveBeenCalledWith(0.65);
    expect(bgTreeInstance.setTint).toHaveBeenCalledWith(0x556655);
  });
});
