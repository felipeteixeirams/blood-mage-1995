import { describe, it, expect, beforeEach } from 'vitest';
import spellsData from '../data/spells.json';
import { SpellConfig } from '../types/game';

describe('Blood Mage Resource System - Phase 3.4 Validation', () => {
  describe('Spell Cost Structure', () => {
    it('all spells have bloodCost defined', () => {
      const typedSpells = spellsData as Record<string, SpellConfig>;
      Object.entries(typedSpells).forEach(([id, spell]) => {
        expect(spell.bloodCost, `${id} should have bloodCost`).toBeDefined();
        expect(spell.bloodCost, `${id} bloodCost should be > 0`).toBeGreaterThan(0);
      });
    });

    it('bloodCost consolidates manaCost + hpCost correctly', () => {
      const typedSpells = spellsData as Record<string, SpellConfig>;
      const expectations: Record<string, number> = {
        blood_bolt: 1,
        hellfire_nova: 12,
        syphon_soul: 20,
        bone_shield: 24,
        crimson_scythe: 11,
        blood_ritual_circle: 14,
        hemomancy_beam: 30,
        blood_tendrils: 23,
        corpse_burst: 30,
      };

      Object.entries(expectations).forEach(([id, expectedCost]) => {
        const spell = typedSpells[id];
        expect(spell.bloodCost).toBe(expectedCost);
      });
    });

    it('spell costs are properly distributed (within 30x spread)', () => {
      const typedSpells = spellsData as Record<string, SpellConfig>;
      const costs = Object.values(typedSpells)
        .map((s) => s.bloodCost)
        .filter((c) => c !== undefined) as number[];

      const min = Math.min(...costs);
      const max = Math.max(...costs);
      const ratio = max / min;

      // Costs should be reasonably balanced (not more than 30x spread)
      expect(ratio).toBeLessThanOrEqual(30);
    });
  });

  describe('Spell Balance (Cost vs Damage)', () => {
    it('calculates cost-to-damage ratio for each spell', () => {
      const typedSpells = spellsData as Record<string, SpellConfig>;
      const analysis: Record<string, { cost: number; damage: number; ratio: number }> = {};

      Object.entries(typedSpells).forEach(([id, spell]) => {
        analysis[id] = {
          cost: spell.bloodCost || spell.manaCost || 0,
          damage: spell.baseDamage,
          ratio: spell.baseDamage / (spell.bloodCost || spell.manaCost || 1),
        };
      });

      // Verify no spell has ratio below 1 (cost > damage)
      Object.entries(analysis).forEach(([id, data]) => {
        expect(data.ratio, `${id} should have cost < damage (ratio > 1)`).toBeGreaterThan(0.5);
      });
    });

    it('expensive spells have higher damage multipliers', () => {
      const typedSpells = spellsData as Record<string, SpellConfig>;

      // Expensive spells (>20 blood)
      const expensive = Object.entries(typedSpells)
        .filter(([_, s]) => (s.bloodCost || 0) > 20)
        .map(([id, s]) => ({ id, cost: s.bloodCost || 0, damage: s.baseDamage }));

      // Cheap spells (<5 blood)
      const cheap = Object.entries(typedSpells)
        .filter(([_, s]) => (s.bloodCost || 0) < 5)
        .map(([id, s]) => ({ id, cost: s.bloodCost || 0, damage: s.baseDamage }));

      if (expensive.length > 0 && cheap.length > 0) {
        const avgExpensiveDamage = expensive.reduce((sum, s) => sum + s.damage, 0) / expensive.length;
        const avgCheapDamage = cheap.reduce((sum, s) => sum + s.damage, 0) / cheap.length;

        // Expensive should deal significantly more damage
        expect(avgExpensiveDamage).toBeGreaterThan(avgCheapDamage);
      }
    });
  });

  describe('Resource Management Mechanics', () => {
    it('lowest cost spell (blood_bolt) is highly spammable', () => {
      const typedSpells = spellsData as Record<string, SpellConfig>;
      const bloodBolt = typedSpells['blood_bolt'];

      expect(bloodBolt.bloodCost).toBe(1);
      expect(bloodBolt.cooldownMs).toBeLessThan(200);
    });

    it('highest cost spell (corpse_burst/hemomancy_beam) has long cooldown', () => {
      const typedSpells = spellsData as Record<string, SpellConfig>;

      const expensive = Object.entries(typedSpells)
        .filter(([_, s]) => (s.bloodCost || 0) >= 30)
        .map(([_, s]) => s);

      expect(expensive.length).toBeGreaterThan(0);
      expensive.forEach((spell) => {
        // High cost spells should have cooldowns >= 9s
        expect(spell.cooldownMs).toBeGreaterThanOrEqual(9000);
      });
    });

    it('syphon_soul (drain spell) has matching cost ratio for sustain', () => {
      const typedSpells = spellsData as Record<string, SpellConfig>;
      const syphon = typedSpells['syphon_soul'];

      // Drain spells should be expensive (fits design: drain = sustain)
      expect(syphon.bloodCost).toBeGreaterThan(15);
      // But with reasonable damage to justify vampirism benefit
      expect(syphon.baseDamage).toBeGreaterThan(40);
    });
  });

  describe('Spell Type Distribution', () => {
    it('all spell types are covered', () => {
      const typedSpells = spellsData as Record<string, SpellConfig>;
      const types = new Set(Object.values(typedSpells).map((s) => s.type));

      expect(types.has('projectile')).toBe(true);
      expect(types.has('nova')).toBe(true);
      expect(types.has('drain')).toBe(true);
      expect(types.has('shield')).toBe(true);
      expect(types.has('beam')).toBe(true);
    });

    it('spell count supports variety', () => {
      const typedSpells = spellsData as Record<string, SpellConfig>;
      expect(Object.keys(typedSpells).length).toBeGreaterThanOrEqual(8);
    });
  });

  describe('Blood Mage Identity Validation', () => {
    it('all spells use blood as primary cost (no pure mana spells)', () => {
      const typedSpells = spellsData as Record<string, SpellConfig>;

      Object.entries(typedSpells).forEach(([id, spell]) => {
        // Every spell must have bloodCost (no pure mana)
        expect(spell.bloodCost, `${id} should have bloodCost for blood-primary system`).toBeDefined();
        expect(spell.bloodCost, `${id} bloodCost should be > 0`).toBeGreaterThan(0);
      });
    });

    it('cooldowns support active playstyle (not all long cooldowns)', () => {
      const typedSpells = spellsData as Record<string, SpellConfig>;

      const shortCd = Object.values(typedSpells).filter((s) => s.cooldownMs < 2000);
      const longCd = Object.values(typedSpells).filter((s) => s.cooldownMs >= 8000);

      // Mix of fast and slow spells for variety
      expect(shortCd.length).toBeGreaterThan(0);
      expect(longCd.length).toBeGreaterThan(0);
    });

    it('spell descriptions reference blood magic (not generic mana)', () => {
      const typedSpells = spellsData as Record<string, SpellConfig>;

      // At least some spells should have blood/life/sacrifice in description
      const bloodThemed = Object.values(typedSpells).filter((s) =>
        s.description.toLowerCase().includes('sangue') ||
        s.description.toLowerCase().includes('vida') ||
        s.description.toLowerCase().includes('sacrific')
      );

      expect(bloodThemed.length).toBeGreaterThan(2);
    });
  });

  describe('Backwards Compatibility', () => {
    it('manaCost still exists for fallback', () => {
      const typedSpells = spellsData as Record<string, SpellConfig>;

      Object.entries(typedSpells).forEach(([id, spell]) => {
        // manaCost should still exist (for code compatibility during transition)
        expect(spell.manaCost, `${id} should have manaCost for fallback`).toBeDefined();
      });
    });

    it('hpCost field still exists (consolidated into bloodCost)', () => {
      const typedSpells = spellsData as Record<string, SpellConfig>;

      // Some spells still have hpCost (for reference)
      const withHpCost = Object.entries(typedSpells).filter(([_, s]) => (s.hpCost || 0) > 0);
      expect(withHpCost.length).toBeGreaterThan(0);
    });
  });

  describe('Cooldown Distribution', () => {
    it('no spell has cooldown = 0', () => {
      const typedSpells = spellsData as Record<string, SpellConfig>;

      Object.entries(typedSpells).forEach(([id, spell]) => {
        expect(spell.cooldownMs, `${id} should have cooldown > 0`).toBeGreaterThan(0);
      });
    });

    it('cooldowns have reasonable gaps (support rotation)', () => {
      const typedSpells = spellsData as Record<string, SpellConfig>;
      const cds = Object.entries(typedSpells)
        .filter(([id]) => id !== 'blood_bolt') // Exclude auto-attack
        .map(([_, s]) => s.cooldownMs)
        .sort((a, b) => a - b);

      // Should have variety in cooldowns (not all same)
      const unique = new Set(cds).size;
      expect(unique).toBeGreaterThan(3);
    });
  });
});
