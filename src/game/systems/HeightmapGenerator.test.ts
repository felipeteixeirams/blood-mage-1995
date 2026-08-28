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
});
