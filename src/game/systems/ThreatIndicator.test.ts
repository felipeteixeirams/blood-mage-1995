import { describe, it, expect } from 'vitest';

export interface ThreatEnemy {
  x: number;
  y: number;
  aiState: 'idle' | 'patrol' | 'investigating' | 'combat' | 'frenzy' | 'flee';
  active: boolean;
}

export function computeThreatIndicators(
  player: { x: number; y: number },
  enemies: ThreatEnemy[],
  camera: { scrollX: number; scrollY: number; zoom: number; width: number; height: number }
) {
  const viewW = camera.width;
  const viewH = camera.height;
  const cx = viewW / 2;
  const cy = viewH / 2;
  let alertCount = 0;

  const offscreenThreats: { enemy: ThreatEnemy; dist: number }[] = [];

  enemies.forEach((enemy) => {
    if (enemy.active) {
      const isThreat = enemy.aiState === 'combat' || enemy.aiState === 'frenzy' || enemy.aiState === 'investigating';
      if (isThreat) {
        if (enemy.aiState === 'combat' || enemy.aiState === 'frenzy') {
          alertCount++;
        }

        const screenX = (enemy.x - camera.scrollX) * camera.zoom;
        const screenY = (enemy.y - camera.scrollY) * camera.zoom;
        const isOffscreen = screenX < 0 || screenX > viewW || screenY < 0 || screenY > viewH;

        if (isOffscreen) {
          const dx = enemy.x - player.x;
          const dy = enemy.y - player.y;
          const dist = Math.hypot(dx, dy);
          offscreenThreats.push({ enemy, dist });
        }
      }
    }
  });

  offscreenThreats.sort((a, b) => a.dist - b.dist);
  const visibleThreats = offscreenThreats.slice(0, 8);

  const indicators = visibleThreats.map(({ enemy }) => {
    const angle = Math.atan2(enemy.y - player.y, enemy.x - player.x);
    const edgeX = cx + Math.cos(angle) * (cx - 25);
    const edgeY = cy + Math.sin(angle) * (cy - 25);

    const indicatorX = Math.max(25, Math.min(viewW - 25, edgeX));
    const indicatorY = Math.max(25, Math.min(viewH - 25, edgeY));

    const color = (enemy.aiState === 'combat' || enemy.aiState === 'frenzy') ? 0xef4444 : 0xf59e0b;

    return { indicatorX, indicatorY, angle, color };
  });

  return { alertCount, indicators };
}

describe('Threat Indicator System', () => {
  const camera = { scrollX: 0, scrollY: 0, zoom: 1, width: 800, height: 600 };
  const player = { x: 400, y: 300 };

  it('ignora inimigos inativos ou passivos', () => {
    const enemies: ThreatEnemy[] = [
      { x: 1200, y: 300, aiState: 'idle', active: true },
      { x: 1200, y: 300, aiState: 'patrol', active: true },
      { x: 1200, y: 300, aiState: 'combat', active: false },
    ];
    const result = computeThreatIndicators(player, enemies, camera);
    expect(result.indicators.length).toBe(0);
    expect(result.alertCount).toBe(0);
  });

  it('identifica e calcula indicador para inimigo fora da tela em combat', () => {
    const enemies: ThreatEnemy[] = [
      { x: 1000, y: 300, aiState: 'combat', active: true },
    ];
    const result = computeThreatIndicators(player, enemies, camera);
    expect(result.indicators.length).toBe(1);
    expect(result.alertCount).toBe(1);
    expect(result.indicators[0].color).toBe(0xef4444);
    expect(result.indicators[0].indicatorX).toBe(775); // Borda direita (800 - 25)
  });

  it('identifica estado investigating com cor âmbar', () => {
    const enemies: ThreatEnemy[] = [
      { x: 400, y: -200, aiState: 'investigating', active: true },
    ];
    const result = computeThreatIndicators(player, enemies, camera);
    expect(result.indicators.length).toBe(1);
    expect(result.alertCount).toBe(0); // investigating não incrementa alertCount
    expect(result.indicators[0].color).toBe(0xf59e0b);
    expect(result.indicators[0].indicatorY).toBe(25); // Borda superior
  });

  it('limita os indicadores no máximo em 8 ameaças mais próximas', () => {
    const enemies: ThreatEnemy[] = Array.from({ length: 15 }, (_, i) => ({
      x: 1000 + i * 50,
      y: 300,
      aiState: 'combat',
      active: true,
    }));
    const result = computeThreatIndicators(player, enemies, camera);
    expect(result.indicators.length).toBe(8);
    expect(result.alertCount).toBe(15);
  });

  it('não gera indicador para inimigo visível dentro da tela', () => {
    const enemies: ThreatEnemy[] = [
      { x: 450, y: 350, aiState: 'combat', active: true },
    ];
    const result = computeThreatIndicators(player, enemies, camera);
    expect(result.indicators.length).toBe(0);
    expect(result.alertCount).toBe(1);
  });
});
