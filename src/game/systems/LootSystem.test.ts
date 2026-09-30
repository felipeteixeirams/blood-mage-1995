import { describe, it, expect, vi, afterEach } from 'vitest';
import { LootSystem } from './LootSystem';

describe('LootSystem.rollLootChance', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('usa 25% de chance por padrão (dropMult=1.0, comportamento preexistente inalterado)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.24);
    expect(LootSystem.rollLootChance()).toBe(true);
    vi.spyOn(Math, 'random').mockReturnValue(0.26);
    expect(LootSystem.rollLootChance()).toBe(false);
  });

  it('escala a chance pelo dropMult (bônus de selo de prestígio "macabre_fortune")', () => {
    // dropMult=1.2 (equivalente a 3 pontos em macabre_fortune: 1.0 + 3*0.06)
    // -> chance efetiva de 30% (0.25 * 1.2)
    vi.spyOn(Math, 'random').mockReturnValue(0.29);
    expect(LootSystem.rollLootChance(1.2)).toBe(true);
    vi.spyOn(Math, 'random').mockReturnValue(0.31);
    expect(LootSystem.rollLootChance(1.2)).toBe(false);
  });

  it('dropMult=1.0 explícito é idêntico a não passar o parâmetro', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.2);
    expect(LootSystem.rollLootChance(1.0)).toBe(LootSystem.rollLootChance());
  });
});
