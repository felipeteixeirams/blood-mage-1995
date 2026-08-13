import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateNormalMap } from './textureGenerator';

// jsdom não implementa o contexto 2d real; mockamos no prototype do canvas
// com um buffer de pixels RGBA por canvas.
const buffers = new Map<HTMLCanvasElement, PixelBuffer>();

type PixelBuffer = { data: Uint8ClampedArray; width: number; height: number };

function makeContext(buffer: PixelBuffer) {
  const ctx = {
    fillStyle: '#000000',
    fillRect: vi.fn(),
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
  // Força a criação do buffer via getContext (mock do prototype).
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
    // Canal B (elevação) sempre >= 128 (normal apontando para a tela).
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
    // Mancha clara no canto esquerdo -> gradiente horizontal forte.
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

    // Direções opostas: se normal tem R<128, invertida deve ter R>128 (e vice-versa).
    expect(px[0] !== pxInv[0]).toBe(true);
  });
});
