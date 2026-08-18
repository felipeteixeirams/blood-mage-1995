import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateGameTextures, generateUITextures, generateNormalMap } from './textureGenerator';
import { GAME_ASSET_MANIFEST } from '../game/assets/assetManifest';

// jsdom não implementa o contexto 2d real; mockamos no prototype do canvas
// com um buffer de pixels RGBA por canvas.
const buffers = new Map<HTMLCanvasElement, PixelBuffer>();

type PixelBuffer = { data: Uint8ClampedArray; width: number; height: number };

function makeContext(buffer: PixelBuffer) {
  const ctx = {
    fillStyle: '#000000',
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    ellipse: vi.fn(),
    arc: vi.fn(),
    strokeRect: vi.fn(),
    fillText: vi.fn(),
    createRadialGradient: vi.fn(() => ({
      addColorStop: vi.fn(),
    })),
    getImageData: (_x: number, _y: number, w: number, h: number) => {
      return {
        width: w,
        height: h,
        data: buffer.data,
      };
    },
    putImageData: vi.fn((imageData: ImageData, _dx: number, _dy: number) => {
      buffer.data.set(imageData.data);
    }),
    createImageData: vi.fn((w: number, h: number) => {
      return { width: w, height: h, data: new Uint8ClampedArray(w * h * 4) };
    }),
  };
  return ctx as unknown as CanvasRenderingContext2D;
}

function mockCanvasPrototype() {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function (
    this: HTMLCanvasElement,
    contextId: string
  ): CanvasRenderingContext2D | null {
    if (contextId !== '2d') return null;
    let buffer = buffers.get(this);
    if (!buffer) {
      buffer = {
        width: this.width,
        height: this.height,
        data: new Uint8ClampedArray(this.width * this.height * 4).fill(255),
      };
      buffers.set(this, buffer);
    }
    return makeContext(buffer);
  });
}

function makeCanvas(width: number, height: number, fill: { r: number; g: number; b: number; a: number } = { r: 128, g: 128, b: 128, a: 255 }): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d');
  const buffer = buffers.get(canvas)!;
  for (let i = 0; i < width * height; i++) {
    buffer.data[i * 4] = fill.r;
    buffer.data[i * 4 + 1] = fill.g;
    buffer.data[i * 4 + 2] = fill.b;
    buffer.data[i * 4 + 3] = fill.a;
  }
  return canvas;
}

function pixelAt(canvas: HTMLCanvasElement, x: number, y: number): number[] {
  const ctx = canvas.getContext('2d')!;
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const idx = (y * canvas.width + x) * 4;
  return [
    img.data[idx],
    img.data[idx + 1],
    img.data[idx + 2],
    img.data[idx + 3],
  ];
}

describe('generateNormalMap', () => {
  beforeEach(() => {
    buffers.clear();
    mockCanvasPrototype();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns a canvas with the same dimensions as the source', () => {
    const canvas = makeCanvas(32, 48);
    const normalMap = generateNormalMap(canvas);
    expect(normalMap.width).toBe(32);
    expect(normalMap.height).toBe(48);
  });

  it('produces opaque RGB pixels (alpha 255)', () => {
    const canvas = makeCanvas(16, 16);
    const normalMap = generateNormalMap(canvas);
    const px = pixelAt(normalMap, 8, 8);
    expect(px[3]).toBe(255);
    expect(px[2]).toBeGreaterThanOrEqual(128);
  });

  it('flat surface produces near-neutral normals (R/G ~128)', () => {
    const canvas = makeCanvas(16, 16);
    const normalMap = generateNormalMap(canvas);
    const px = pixelAt(normalMap, 8, 8);
    expect(px[0]).toBeGreaterThanOrEqual(110);
    expect(px[0]).toBeLessThanOrEqual(145);
    expect(px[1]).toBeGreaterThanOrEqual(110);
    expect(px[1]).toBeLessThanOrEqual(145);
  });

  it('higher strength amplifies the normal deviation', () => {
    const canvas = makeCanvas(16, 16);
    const ctx = canvas.getContext('2d')!;
    const data = ctx.getImageData(0, 0, 16, 16).data;
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 6; x++) {
        const idx = (y * 16 + x) * 4;
        data[idx] = 255;
        data[idx + 1] = 255;
        data[idx + 2] = 255;
      }
    }

    const low = generateNormalMap(canvas, 1.0);
    const high = generateNormalMap(canvas, 4.0);
    const pxLow = pixelAt(low, 6, 8);
    const pxHigh = pixelAt(high, 6, 8);

    const devLow = Math.abs(pxLow[0] - 128);
    const devHigh = Math.abs(pxHigh[0] - 128);
    expect(devHigh).toBeGreaterThan(devLow);
  });

  it('invert flips the horizontal gradient direction', () => {
    const canvas = makeCanvas(16, 16);
    const ctx = canvas.getContext('2d')!;
    const data = ctx.getImageData(0, 0, 16, 16).data;
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 6; x++) {
        const idx = (y * 16 + x) * 4;
        data[idx] = 255;
        data[idx + 1] = 255;
        data[idx + 2] = 255;
      }
    }

    const normal = generateNormalMap(canvas, 2.0, false);
    const inverted = generateNormalMap(canvas, 2.0, true);
    const px = pixelAt(normal, 6, 8);
    const pxInv = pixelAt(inverted, 6, 8);

    expect(px[0] !== pxInv[0]).toBe(true);
  });
});

describe('generateGameTextures & generateUITextures Fallbacks', () => {
  let mockScene: any;
  let addedTextures: Map<string, any>;
  let existingTextures: Set<string>;

  beforeEach(() => {
    buffers.clear();
    mockCanvasPrototype();
    addedTextures = new Map();
    existingTextures = new Set();

    mockScene = {
      textures: {
        exists: vi.fn((key: string) => existingTextures.has(key)),
        remove: vi.fn((key: string) => existingTextures.delete(key)),
        addCanvas: vi.fn((key: string, canvas: HTMLCanvasElement) => {
          addedTextures.set(key, canvas);
          existingTextures.add(key);
        }),
        addImage: vi.fn((key: string, canvas: HTMLCanvasElement, normalMap: HTMLCanvasElement) => {
          addedTextures.set(key, { canvas, normalMap });
          existingTextures.add(key);
        }),
        addSpriteSheet: vi.fn((key: string, canvas: HTMLCanvasElement, config: any) => {
          addedTextures.set(key, { canvas, config });
          existingTextures.add(key);
        }),
      },
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('generates procedural textures for all keys in GAME_ASSET_MANIFEST when force is true', () => {
    generateGameTextures(mockScene, { force: true });

    GAME_ASSET_MANIFEST.forEach((asset) => {
      expect(addedTextures.has(asset.key)).toBe(true);
    });
  });

  it('skips existing textures when force is false (preserving successfully loaded physical assets)', () => {
    existingTextures.add('spr_skeleton');

    generateGameTextures(mockScene, { force: false });

    // spr_skeleton was pre-existing (loaded physically), so force: false shouldn't overwrite it
    expect(mockScene.textures.remove).not.toHaveBeenCalledWith('spr_skeleton');
  });

  it('overwrites pre-existing textures when force is true', () => {
    existingTextures.add('spr_skeleton');

    generateGameTextures(mockScene, { force: true });

    expect(mockScene.textures.remove).toHaveBeenCalledWith('spr_skeleton');
    expect(addedTextures.has('spr_skeleton')).toBe(true);
  });

  it('generates procedural UI textures cleanly without errors', () => {
    generateUITextures(mockScene);

    const expectedUIKeys = ['uiGem', 'uiCap', 'uiCorner', 'uiPlaque', 'logo'];
    expectedUIKeys.forEach((key) => {
      expect(addedTextures.has(key)).toBe(true);
    });
  });
});
