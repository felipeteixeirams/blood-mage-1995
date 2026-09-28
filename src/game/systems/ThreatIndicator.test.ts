import { describe, it, expect } from 'vitest';
import {
  computeThreatIndicators,
  THREAT_INDICATOR_COLOR_ALERT,
  THREAT_INDICATOR_COLOR_INVESTIGATING,
  type ThreatIndicatorEnemyLike,
} from './ThreatIndicatorSystem';

// Nota: este teste antes definia sua PRÓPRIA cópia local de
// `computeThreatIndicators` — verde, mas testando uma reimplementação
// paralela que `GameScene.ts` não consumia (a matemática real vivia
// duplicada e inline em `updateThreatIndicator()`). Ambas as cópias
// coincidiam por sorte; qualquer alteração futura em uma sem a outra teria
// passado despercebida. Corrigido: o teste agora importa a MESMA função que
// `GameScene.ts` chama, então uma regressão real quebra o teste.
type ThreatEnemy = ThreatIndicatorEnemyLike;

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
    expect(result.closestOffscreenThreat).toBeNull();
  });

  it('identifica e calcula indicador para inimigo fora da tela em combat', () => {
    const enemies: ThreatEnemy[] = [
      { x: 1000, y: 300, aiState: 'combat', active: true },
    ];
    const result = computeThreatIndicators(player, enemies, camera);
    expect(result.indicators.length).toBe(1);
    expect(result.alertCount).toBe(1);
    expect(result.indicators[0].color).toBe(THREAT_INDICATOR_COLOR_ALERT);
    expect(result.indicators[0].indicatorX).toBe(775); // Borda direita (800 - 25)
    expect(result.closestOffscreenThreat?.enemy).toBe(enemies[0]);
  });

  it('identifica estado investigating com cor âmbar', () => {
    const enemies: ThreatEnemy[] = [
      { x: 400, y: -200, aiState: 'investigating', active: true },
    ];
    const result = computeThreatIndicators(player, enemies, camera);
    expect(result.indicators.length).toBe(1);
    expect(result.alertCount).toBe(0); // investigating não incrementa alertCount
    expect(result.indicators[0].color).toBe(THREAT_INDICATOR_COLOR_INVESTIGATING);
    expect(result.indicators[0].indicatorY).toBe(25); // Borda superior
  });

  it('limita os indicadores no máximo em 8 ameaças mais próximas', () => {
    const enemies: ThreatEnemy[] = Array.from({ length: 15 }, (_, i) => ({
      x: 1000 + i * 50,
      y: 300,
      aiState: 'combat' as const,
      active: true,
    }));
    const result = computeThreatIndicators(player, enemies, camera);
    expect(result.indicators.length).toBe(8);
    expect(result.alertCount).toBe(15);
    // A ameaça mais próxima (i=0, x=1000) deve ser a escolhida para áudio espacial.
    expect(result.closestOffscreenThreat?.enemy.x).toBe(1000);
  });

  it('não gera indicador para inimigo visível dentro da tela', () => {
    const enemies: ThreatEnemy[] = [
      { x: 450, y: 350, aiState: 'combat', active: true },
    ];
    const result = computeThreatIndicators(player, enemies, camera);
    expect(result.indicators.length).toBe(0);
    expect(result.alertCount).toBe(1);
    expect(result.closestOffscreenThreat).toBeNull();
  });

  it('ignora estado flee para fins de indicador (não é ameaça ativa)', () => {
    const enemies: ThreatEnemy[] = [
      { x: 1000, y: 300, aiState: 'flee', active: true },
    ];
    const result = computeThreatIndicators(player, enemies, camera);
    expect(result.indicators.length).toBe(0);
    expect(result.alertCount).toBe(0);
  });

  it('escolhe a ameaça fora de tela mais próxima do jogador para áudio espacial, não a primeira da lista', () => {
    const enemies: ThreatEnemy[] = [
      { x: 1500, y: 300, aiState: 'combat', active: true }, // longe
      { x: 900, y: 300, aiState: 'combat', active: true },  // perto
    ];
    const result = computeThreatIndicators(player, enemies, camera);
    expect(result.closestOffscreenThreat?.enemy.x).toBe(900);
  });

  it('respeita zoom da câmera ao decidir se o inimigo está fora de tela', () => {
    // Mesmo inimigo, mesma distância de mundo (500px) do jogador — com zoom 1
    // ele cai dentro da viewport de 800px; com zoom 2 a mesma distância de
    // mundo ocupa o dobro de pixels de tela e o inimigo passa a ficar fora.
    // A checagem de offscreen precisa multiplicar por `camera.zoom`, não usar
    // coordenadas de mundo cruas.
    const enemy: ThreatEnemy = { x: 900, y: 300, aiState: 'combat', active: true };

    const zoom1 = computeThreatIndicators(player, [enemy], { scrollX: 400, scrollY: 300, zoom: 1, width: 800, height: 600 });
    expect(zoom1.indicators.length).toBe(0); // screenX = (900-400)*1 = 500, dentro de 800

    const zoom2 = computeThreatIndicators(player, [enemy], { scrollX: 400, scrollY: 300, zoom: 2, width: 800, height: 600 });
    expect(zoom2.indicators.length).toBe(1); // screenX = (900-400)*2 = 1000, fora de 800
  });
});
