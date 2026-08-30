import { describe, it, expect } from 'vitest';
import {
  HeightmapGenerator,
  isoToScreen,
  screenToIso,
  calculateIsometricDepth,
} from './HeightmapGenerator';

describe('HeightmapGenerator & 2.5D Isometric Math (Spec 16)', () => {
  it('projeta coordenadas isométricas com elevação Z corretamente (isoToScreen)', () => {
    // Para gridX=10, gridY=10, altura=0:
    // screenX = (10 - 10) * 32 = 0
    // screenY = (10 + 10) * 16 - 0 = 320
    const flat = isoToScreen(10, 10, 0, 64, 32, 16);
    expect(flat.x).toBe(0);
    expect(flat.y).toBe(320);

    // Com altura Z=2: screenY deve ser deslocado para cima por 2 * 16 = 32px
    const elevated = isoToScreen(10, 10, 2, 64, 32, 16);
    expect(elevated.x).toBe(0);
    expect(elevated.y).toBe(288);
  });

  it('converte de tela para grid com consistência reversa (screenToIso)', () => {
    const gridX = 8;
    const gridY = 5;
    const height = 1;
    const screen = isoToScreen(gridX, gridY, height);
    const converted = screenToIso(screen.x, screen.y, height);

    expect(converted.gridX).toBe(gridX);
    expect(converted.gridY).toBe(gridY);
  });

  it('calcula profundidade isométrica mantendo ordenação Y e Z', () => {
    const depthLower = calculateIsometricDepth(2, 2, 0);
    const depthHigherY = calculateIsometricDepth(2, 3, 0);
    const depthHigherZ = calculateIsometricDepth(2, 2, 2);

    expect(depthHigherY).toBeGreaterThan(depthLower);
    expect(depthHigherZ).toBeGreaterThan(depthLower);
  });

  it('gera matriz de heightmap com valores válidos no intervalo [0..4]', () => {
    const gen = new HeightmapGenerator(2026);
    const cols = 20;
    const rows = 20;
    const map = gen.generateHeightmap(cols, rows);

    expect(map.length).toBe(cols);
    expect(map[0].length).toBe(rows);

    for (let x = 0; x < cols; x++) {
      for (let y = 0; y < rows; y++) {
        const h = map[x][y];
        expect(h).toBeGreaterThanOrEqual(0);
        expect(h).toBeLessThanOrEqual(4);
      }
    }
  });

  it('valida transitabilidade conforme regra da Spec 16 (|Delta H| <= 1)', () => {
    const gen = new HeightmapGenerator();
    expect(gen.isPathTraversable(1, 1)).toBe(true);
    expect(gen.isPathTraversable(1, 2)).toBe(true);
    expect(gen.isPathTraversable(2, 1)).toBe(true);
    expect(gen.isPathTraversable(0, 2)).toBe(false);
    expect(gen.isPathTraversable(1, 4)).toBe(false);
  });

  it('valida a regra de transitabilidade de terreno e desnível de falésias (isTraversable)', () => {
    const gen = new HeightmapGenerator(1995);

    // Mock getHeightAt for controlled deterministic testing of Delta Z
    const originalGetHeightAt = gen.getHeightAt.bind(gen);
    gen.getHeightAt = (gridX: number, gridY: number) => {
      if (gridX === 0 && gridY === 0) return 1;
      if (gridX === 1 && gridY === 0) return 2; // Delta Z = 1 (Rampa/Degrau - Permitido)
      if (gridX === 2 && gridY === 0) return 4; // Delta Z = 3 (Falésia - Bloqueado)
      return originalGetHeightAt(gridX, gridY);
    };

    // Grid coordinates checks
    expect(gen.isTraversable(0, 0, 1, 0, false)).toBe(true);  // Delta Z = 1 -> true
    expect(gen.isTraversable(0, 0, 2, 0, false)).toBe(false); // Delta Z = 3 -> false

    // World pixel coordinates checks (48x24 tile grid)
    expect(gen.isTraversable(0, 0, 48, 0, true)).toBe(true);  // (0,0) to (1,0) grid
    expect(gen.isTraversable(0, 0, 96, 0, true)).toBe(false); // (0,0) to (2,0) grid
  });

  it('amostra pontos de Poisson Disk sem colisões de raio mínimo', () => {
    const gen = new HeightmapGenerator(1234);
    const minDistance = 3.0;
    const points = gen.samplePoissonDisk(30, 30, minDistance);

    expect(points.length).toBeGreaterThan(5);

    // Verifica que nenhum par de pontos é mais próximo que o raio estipulado (com tolerância numérica)
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const d = Math.hypot(points[i].gridX - points[j].gridX, points[i].gridY - points[j].gridY);
        expect(d).toBeGreaterThanOrEqual(minDistance - 0.5);
      }
    }
  });

  it('respeita custom tileWidth, tileHeight e heightStep em isoToScreen e screenToIso', () => {
    const customWidth = 48;
    const customHeight = 24;
    const customStep = 10;
    const screen = isoToScreen(5, 5, 3, customWidth, customHeight, customStep);
    expect(screen.x).toBe(0);
    expect(screen.y).toBe((5 + 5) * 12 - 3 * 10); // 120 - 30 = 90

    const converted = screenToIso(screen.x, screen.y, 3, customWidth, customHeight, customStep);
    expect(converted.gridX).toBe(5);
    expect(converted.gridY).toBe(5);
  });

  it('garante determinismo para o mesmo seed de HeightmapGenerator', () => {
    const gen1 = new HeightmapGenerator(1995);
    const gen2 = new HeightmapGenerator(1995);

    for (let x = 0; x < 10; x++) {
      for (let y = 0; y < 10; y++) {
        expect(gen1.getHeightAt(x, y)).toBe(gen2.getHeightAt(x, y));
      }
    }
  });

  it('identifica corretamente bordas de desnível / falésia viradas para o sul e sudeste (getCliffEdges)', () => {
    const gen = new HeightmapGenerator(1995);

    gen.getHeightAt = (gridX: number, gridY: number) => {
      if (gridX === 5 && gridY === 5) return 3; // Elevação atual Z=3
      if (gridX === 6 && gridY === 6) return 1; // Vizinho Sul Z=1 (Delta Z = 2)
      if (gridX === 6 && gridY === 5) return 0; // Vizinho Sudeste Z=0 (Delta Z = 3)
      if (gridX === 5 && gridY === 6) return 3; // Vizinho Sudoeste Z=3 (Delta Z = 0)
      return 3;
    };

    const edges = gen.getCliffEdges(5, 5);
    expect(edges.hasSouthCliff).toBe(true);
    expect(edges.deltaZSouth).toBe(2);
    expect(edges.hasSouthEastCliff).toBe(true);
    expect(edges.deltaZSouthEast).toBe(3);
    expect(edges.hasSouthWestCliff).toBe(false);
    expect(edges.deltaZSouthWest).toBe(0);
  });

  it('retorna sem falésias se o tile atual estiver no nível Z=0 ou se não houver desnível', () => {
    const gen = new HeightmapGenerator(1995);

    gen.getHeightAt = () => 0; // Tudo Z=0
    const edgesZero = gen.getCliffEdges(5, 5);
    expect(edgesZero.hasSouthCliff).toBe(false);
    expect(edgesZero.hasSouthEastCliff).toBe(false);
    expect(edgesZero.hasSouthWestCliff).toBe(false);

    gen.getHeightAt = () => 2; // Tudo plano Z=2
    const edgesFlat = gen.getCliffEdges(5, 5);
    expect(edgesFlat.hasSouthCliff).toBe(false);
    expect(edgesFlat.hasSouthEastCliff).toBe(false);
    expect(edgesFlat.hasSouthWestCliff).toBe(false);
  });
});
