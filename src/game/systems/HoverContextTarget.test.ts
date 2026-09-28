import { describe, it, expect } from 'vitest';
import { findNearestHoverCandidate, isDesktopPointerEnvironment, HoverCandidate } from './HoverContextTarget';

describe('findNearestHoverCandidate (Spec 09 residual — menu contextual de alvo)', () => {
  it('retorna null quando não há candidato sob o cursor', () => {
    const enemies: HoverCandidate<string>[] = [{ x: 500, y: 500, label: 'ATACAR', payload: 'goblin' }];
    const result = findNearestHoverCandidate(0, 0, [enemies], 34);
    expect(result).toBeNull();
  });

  it('retorna "ATACAR" ao pairar sobre um inimigo dentro do raio', () => {
    const enemies: HoverCandidate<string>[] = [{ x: 100, y: 100, label: 'ATACAR', payload: 'goblin' }];
    const npcs: HoverCandidate<string>[] = [];
    const result = findNearestHoverCandidate(110, 100, [enemies, npcs], 34);
    expect(result).not.toBeNull();
    expect(result!.label).toBe('ATACAR');
    expect(result!.payload).toBe('goblin');
  });

  it('retorna "CONVERSAR" ao pairar sobre um NPC dentro do raio', () => {
    const enemies: HoverCandidate<string>[] = [];
    const npcs: HoverCandidate<string>[] = [{ x: 200, y: 200, label: 'CONVERSAR', payload: 'maelen' }];
    const result = findNearestHoverCandidate(205, 200, [enemies, npcs], 34);
    expect(result).not.toBeNull();
    expect(result!.label).toBe('CONVERSAR');
    expect(result!.payload).toBe('maelen');
  });

  it('prioriza inimigo sobre NPC quando ambos estão sob o cursor (grupo 0 vence grupo 1)', () => {
    const enemies: HoverCandidate<string>[] = [{ x: 100, y: 100, label: 'ATACAR', payload: 'goblin' }];
    const npcs: HoverCandidate<string>[] = [{ x: 100, y: 100, label: 'CONVERSAR', payload: 'maelen' }];
    const result = findNearestHoverCandidate(100, 100, [enemies, npcs], 34);
    expect(result!.label).toBe('ATACAR');
  });

  it('ignora candidato fora do raio de hover', () => {
    const enemies: HoverCandidate<string>[] = [{ x: 100, y: 100, label: 'ATACAR', payload: 'goblin' }];
    const result = findNearestHoverCandidate(100 + 34.01, 100, [enemies], 34);
    expect(result).toBeNull();
  });
});

describe('isDesktopPointerEnvironment (mesma checagem touch-vs-mouse de GameplayHUD.tsx isTouchCapable)', () => {
  it('é true (desktop/mouse) quando nenhum sinal de touch está presente', () => {
    expect(
      isDesktopPointerEnvironment({
        hasOntouchstart: false,
        maxTouchPoints: 0,
        msMaxTouchPoints: 0,
        matchesCoarsePointer: false,
      })
    ).toBe(true);
  });

  it('é false (esconder o menu contextual) quando `ontouchstart` existe', () => {
    expect(
      isDesktopPointerEnvironment({
        hasOntouchstart: true,
        maxTouchPoints: 0,
        msMaxTouchPoints: 0,
        matchesCoarsePointer: false,
      })
    ).toBe(false);
  });

  it('é false quando navigator.maxTouchPoints > 0 (tablet/celular)', () => {
    expect(
      isDesktopPointerEnvironment({
        hasOntouchstart: false,
        maxTouchPoints: 5,
        msMaxTouchPoints: 0,
        matchesCoarsePointer: false,
      })
    ).toBe(false);
  });

  it('é false quando matchMedia(pointer: coarse) casa (touch sem os outros sinais)', () => {
    expect(
      isDesktopPointerEnvironment({
        hasOntouchstart: false,
        maxTouchPoints: 0,
        msMaxTouchPoints: 0,
        matchesCoarsePointer: true,
      })
    ).toBe(false);
  });
});
