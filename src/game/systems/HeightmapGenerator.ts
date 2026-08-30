export interface ScreenCoords {
  x: number;
  y: number;
}

export interface GridCoords {
  gridX: number;
  gridY: number;
}

export interface PoissonPoint {
  x: number;
  y: number;
  gridX: number;
  gridY: number;
  height: number;
}

export interface CliffEdgeInfo {
  hasSouthCliff: boolean;
  hasSouthEastCliff: boolean;
  hasSouthWestCliff: boolean;
  deltaZSouth: number;
  deltaZSouthEast: number;
  deltaZSouthWest: number;
}

/**
 * Projeta coordenadas do grid tridimensional (gridX, gridY, altura) para tela 2D
 * conforme especificado no Capítulo 3 da Spec 16.
 */
export function isoToScreen(
  gridX: number,
  gridY: number,
  altura: number,
  tileWidth: number = 64,
  tileHeight: number = 32,
  heightStep: number = 16
): ScreenCoords {
  const screenX = (gridX - gridY) * (tileWidth / 2);
  const screenY = (gridX + gridY) * (tileHeight / 2) - altura * heightStep;
  return { x: screenX, y: screenY };
}

/**
 * Converte coordenadas 2D de tela de volta para o grid base (Z = 0 ou compensado).
 */
export function screenToIso(
  screenX: number,
  screenY: number,
  altura: number = 0,
  tileWidth: number = 64,
  tileHeight: number = 32,
  heightStep: number = 16
): GridCoords {
  const adjustedY = screenY + altura * heightStep;
  const halfW = tileWidth / 2;
  const halfH = tileHeight / 2;

  const gridX = Math.round((screenX / halfW + adjustedY / halfH) / 2);
  const gridY = Math.round((adjustedY / halfH - screenX / halfW) / 2);
  return { gridX, gridY };
}

/**
 * Calcula profundidade de renderização determinística (setDepth) para evitar erros de sobreposição.
 * Formula: Depth = (gridX + gridY) * 10 + (altura * 2) + layerOffset
 */
export function calculateIsometricDepth(
  gridX: number,
  gridY: number,
  altura: number,
  layerOffset: number = 0
): number {
  return (gridX + gridY) * 10 + altura * 2 + layerOffset;
}

/**
 * Gerador de ruído pseudo-aleatório 2D determinístico (Simplex aproximado com Octaves)
 * para gerar elevações Z de 0 a 4 sem dependências externas.
 */
export class HeightmapGenerator {
  private seed: number;

  constructor(seed: number = 1995) {
    this.seed = seed;
  }

  private pseudoNoise(x: number, y: number, freq: number): number {
    const nx = x * freq + this.seed * 0.1337;
    const ny = y * freq + this.seed * 0.7331;
    const sin1 = Math.sin(nx * 12.9898 + ny * 78.233);
    const sin2 = Math.sin(nx * 39.345 + ny * 11.123);
    const val = (Math.sin(sin1 * 43758.5453) + Math.cos(sin2 * 23421.631)) * 0.5;
    return (val + 1) * 0.5; // Normalizado entre 0 e 1
  }

  /**
   * Gera o nível de elevação Z (0..4) para uma coordenada (x, y).
   * Formula: Height(x, y) = clamp(floor((N_macro * 0.7 + N_micro * 0.3) * 4), 0, 4)
   */
  public getHeightAt(gridX: number, gridY: number): number {
    const nMacro = this.pseudoNoise(gridX, gridY, 0.08);
    const nMicro = this.pseudoNoise(gridX, gridY, 0.25);
    const combined = nMacro * 0.7 + nMicro * 0.3;
    const height = Math.floor(combined * 4.99);
    return Math.max(0, Math.min(4, height));
  }

  /**
   * Gera uma matriz bidimensional de Heightmap (cols x rows).
   */
  public generateHeightmap(cols: number, rows: number): number[][] {
    const map: number[][] = [];
    for (let x = 0; x < cols; x++) {
      map[x] = [];
      for (let y = 0; y < rows; y++) {
        map[x][y] = this.getHeightAt(x, y);
      }
    }
    return map;
  }

  /**
   * Valida se a transição entre duas posições é transitável respeitando a regra de desnível/falésia.
   * - Delta Z <= 1: Transitável (mesmo nível, degraus ou rampas suaves).
   * - Delta Z > 1: Intransitável (falésias/paredes intransponíveis).
   */
  public isTraversable(
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    isWorldCoords: boolean = true
  ): boolean {
    const gridFromX = isWorldCoords ? Math.floor(fromX / 48) : Math.floor(fromX);
    const gridFromY = isWorldCoords ? Math.floor(fromY / 24) : Math.floor(fromY);
    const gridToX = isWorldCoords ? Math.floor(toX / 48) : Math.floor(toX);
    const gridToY = isWorldCoords ? Math.floor(toY / 24) : Math.floor(toY);

    const zFrom = this.getHeightAt(gridFromX, gridFromY);
    const zTo = this.getHeightAt(gridToX, gridToY);

    return Math.abs(zTo - zFrom) <= 1;
  }

  /**
   * Identifica bordas de desnível / falésia viradas para o jogador (direção isométrica)
   * quando a altura do tile atual Z é maior que o vizinho adjacente (Delta Z >= 1).
   */
  public getCliffEdges(gridX: number, gridY: number): CliffEdgeInfo {
    const zCurrent = this.getHeightAt(gridX, gridY);
    if (zCurrent <= 0) {
      return {
        hasSouthCliff: false,
        hasSouthEastCliff: false,
        hasSouthWestCliff: false,
        deltaZSouth: 0,
        deltaZSouthEast: 0,
        deltaZSouthWest: 0,
      };
    }

    const zSouth = this.getHeightAt(gridX + 1, gridY + 1);
    const zSouthEast = this.getHeightAt(gridX + 1, gridY);
    const zSouthWest = this.getHeightAt(gridX, gridY + 1);

    const deltaZSouth = zCurrent - zSouth;
    const deltaZSouthEast = zCurrent - zSouthEast;
    const deltaZSouthWest = zCurrent - zSouthWest;

    return {
      hasSouthCliff: deltaZSouth >= 1,
      hasSouthEastCliff: deltaZSouthEast >= 1,
      hasSouthWestCliff: deltaZSouthWest >= 1,
      deltaZSouth: Math.max(0, deltaZSouth),
      deltaZSouthEast: Math.max(0, deltaZSouthEast),
      deltaZSouthWest: Math.max(0, deltaZSouthWest),
    };
  }

  /**
   * Valida conectividade espacial para navegação e pathfinding 3D (Spec 16 - Cap. 3.4).
   * - |Delta H| <= 1: Transitável (mesmo nível ou rampa).
   * - |Delta H| >= 2: Intransitável (falésia/parede).
   */
  public isPathTraversable(heightA: number, heightB: number): boolean {
    return Math.abs(heightA - heightB) <= 1;
  }

  /**
   * Amostragem Poisson Disk para posicionar vegetação / props respeitando um raio mínimo
   * de separação e filtro de relevo (proibido em água Z=0 ou declives íngremes Delta H > 1).
   */
  public samplePoissonDisk(
    cols: number,
    rows: number,
    minDistance: number = 3.5,
    maxAttempts: number = 30
  ): PoissonPoint[] {
    const cellSize = minDistance / Math.SQRT2;
    const gridW = Math.ceil(cols / cellSize);
    const gridH = Math.ceil(rows / cellSize);
    const grid: (PoissonPoint | null)[][] = Array.from({ length: gridW }, () => Array(gridH).fill(null));

    const points: PoissonPoint[] = [];
    const activeList: PoissonPoint[] = [];

    // Primeiro ponto inicial válido (dentro dos limites e Z > 0)
    let startX = Math.floor(cols / 2);
    let startY = Math.floor(rows / 2);
    const startHeight = this.getHeightAt(startX, startY);

    const initialPoint: PoissonPoint = {
      x: startX * 64,
      y: startY * 32,
      gridX: startX,
      gridY: startY,
      height: startHeight,
    };

    points.push(initialPoint);
    activeList.push(initialPoint);

    const gx = Math.floor(startX / cellSize);
    const gy = Math.floor(startY / cellSize);
    if (gx >= 0 && gx < gridW && gy >= 0 && gy < gridH) {
      grid[gx][gy] = initialPoint;
    }

    while (activeList.length > 0) {
      const randIdx = Math.floor(Math.random() * activeList.length);
      const current = activeList[randIdx];
      let foundValid = false;

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = minDistance + Math.random() * minDistance;
        const candidateGridX = current.gridX + Math.cos(angle) * dist;
        const candidateGridY = current.gridY + Math.sin(angle) * dist;

        const roundX = Math.round(candidateGridX);
        const roundY = Math.round(candidateGridY);

        if (roundX < 0 || roundX >= cols || roundY < 0 || roundY >= rows) continue;

        const height = this.getHeightAt(roundX, roundY);
        // Filtro de relevo: sem árvores em Z=0 (água) ou com declive íngreme em relação ao vizinho
        if (height === 0 || Math.abs(height - current.height) > 1) continue;

        const cGx = Math.floor(roundX / cellSize);
        const cGy = Math.floor(roundY / cellSize);

        // Verifica proximidade na grade espacial
        let tooClose = false;
        const minCheckX = Math.max(0, cGx - 2);
        const maxCheckX = Math.min(gridW - 1, cGx + 2);
        const minCheckY = Math.max(0, cGy - 2);
        const maxCheckY = Math.min(gridH - 1, cGy + 2);

        for (let ix = minCheckX; ix <= maxCheckX; ix++) {
          for (let iy = minCheckY; iy <= maxCheckY; iy++) {
            const neighbor = grid[ix][iy];
            if (neighbor) {
              const d = Math.hypot(neighbor.gridX - roundX, neighbor.gridY - roundY);
              if (d < minDistance) {
                tooClose = true;
                break;
              }
            }
          }
          if (tooClose) break;
        }

        if (!tooClose) {
          const newPoint: PoissonPoint = {
            x: roundX * 64,
            y: roundY * 32,
            gridX: roundX,
            gridY: roundY,
            height,
          };
          points.push(newPoint);
          activeList.push(newPoint);
          grid[cGx][cGy] = newPoint;
          foundValid = true;
          break;
        }
      }

      if (!foundValid) {
        activeList.splice(randIdx, 1);
      }
    }

    return points;
  }
}
