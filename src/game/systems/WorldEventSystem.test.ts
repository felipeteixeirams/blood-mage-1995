import { describe, it, expect, beforeEach } from 'vitest';
import { WorldEventSystem } from './WorldEventSystem';
import { useGameStore } from '../../store/gameStore';

describe('WorldEventSystem', () => {
  beforeEach(() => {
    useGameStore.setState({ activeWorldEvent: null });
  });

  it('retrieves all configured world events', () => {
    const events = WorldEventSystem.getAllEvents();
    expect(events.length).toBeGreaterThanOrEqual(3);
    expect(events.some((e) => e.id === 'blood_eclipse')).toBe(true);
    expect(events.some((e) => e.id === 'ancestors_night')).toBe(true);
    expect(events.some((e) => e.id === 'winter_solstice')).toBe(true);
  });

  it('fetches event by ID correctly', () => {
    const eclipse = WorldEventSystem.getEventById('blood_eclipse');
    expect(eclipse).toBeDefined();
    expect(eclipse?.type).toBe('atmospheric');
    expect(eclipse?.modifiers.dropMultiplier).toBe(1.5);

    const nonExistent = WorldEventSystem.getEventById('non_existent');
    expect(nonExistent).toBeUndefined();
  });

  it('evaluates seasonal events based on UTC date range', () => {
    // October 31st (Ancestors Night)
    const halloweenDate = new Date(Date.UTC(2026, 9, 31, 12, 0, 0)); // month index 9 is October
    const halloweenEvent = WorldEventSystem.evaluateActiveEvent(halloweenDate);
    expect(halloweenEvent).toBeDefined();
    expect(halloweenEvent?.id).toBe('ancestors_night');

    // December 25th (Winter Solstice)
    const christmasDate = new Date(Date.UTC(2026, 11, 25, 12, 0, 0)); // month index 11 is December
    const winterEvent = WorldEventSystem.evaluateActiveEvent(christmasDate);
    expect(winterEvent).toBeDefined();
    expect(winterEvent?.id).toBe('winter_solstice');
  });

  it('evaluates cyclical events (Blood Eclipse) when outside seasonal ranges', () => {
    // June 15th at 01:00 UTC (1 hour into 6h cycle: active period)
    const activeDate = new Date(Date.UTC(2026, 5, 15, 1, 0, 0));
    const activeEvent = WorldEventSystem.evaluateActiveEvent(activeDate);
    expect(activeEvent?.id).toBe('blood_eclipse');

    // June 15th at 03:00 UTC (3 hours into 6h cycle: inactive period)
    const inactiveDate = new Date(Date.UTC(2026, 5, 15, 3, 0, 0));
    const inactiveEvent = WorldEventSystem.evaluateActiveEvent(inactiveDate);
    expect(inactiveEvent).toBeNull();
  });

  it('syncs active event with Zustand store and retrieves modifiers', () => {
    const activeDate = new Date(Date.UTC(2026, 9, 31, 12, 0, 0));
    const event = WorldEventSystem.updateActiveWorldEvent(activeDate);

    expect(event?.id).toBe('ancestors_night');
    expect(useGameStore.getState().activeWorldEvent?.id).toBe('ancestors_night');

    const modifiers = WorldEventSystem.getActiveModifiers();
    expect(modifiers.dropMultiplier).toBe(1.25);
    expect(modifiers.skeletonSpawnBonus).toBe(0.25);
  });
});
