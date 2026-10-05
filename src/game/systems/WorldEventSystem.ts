import { WorldEvent, WorldEventModifiers } from '../../types/worldEvent';
import worldEventsData from '../../data/worldEvents.json';
import { useGameStore } from '../../store/gameStore';

export class WorldEventSystem {
  private static events: WorldEvent[] = worldEventsData as WorldEvent[];

  public static getAllEvents(): WorldEvent[] {
    return this.events;
  }

  public static getEventById(id: string): WorldEvent | undefined {
    return this.events.find((e) => e.id === id);
  }

  /**
   * Calculates whether a world event should be active for a given date.
   */
  public static evaluateActiveEvent(nowDate: Date = new Date()): WorldEvent | null {
    const month = nowDate.getUTCMonth() + 1; // 1-12
    const day = nowDate.getUTCDate();         // 1-31
    const totalMinutes = nowDate.getUTCHours() * 60 + nowDate.getUTCMinutes();

    // 1. Check seasonal events first (higher priority)
    for (const event of this.events) {
      if (event.scheduleType === 'seasonal' && event.seasonalDateRange) {
        const { startMonth, startDay, endMonth, endDay } = event.seasonalDateRange;
        if (this.isDateInRange(month, day, startMonth, startDay, endMonth, endDay)) {
          return event;
        }
      }
    }

    // 2. Check cyclical events
    for (const event of this.events) {
      if (event.scheduleType === 'cyclical' && event.cyclicalSchedule) {
        const { cycleDurationHours, cycleIntervalHours } = event.cyclicalSchedule;
        const cycleTotalMinutes = (cycleDurationHours + cycleIntervalHours) * 60;
        const currentMinuteInCycle = totalMinutes % cycleTotalMinutes;
        const activeMinutes = cycleDurationHours * 60;

        if (currentMinuteInCycle < activeMinutes) {
          return event;
        }
      }
    }

    return null;
  }

  private static isDateInRange(
    month: number,
    day: number,
    startMonth: number,
    startDay: number,
    endMonth: number,
    endDay: number
  ): boolean {
    const currentCode = month * 100 + day;
    const startCode = startMonth * 100 + startDay;
    const endCode = endMonth * 100 + endDay;

    if (startCode <= endCode) {
      // Normal range within same calendar year
      return currentCode >= startCode && currentCode <= endCode;
    } else {
      // Range wraps across new year (e.g. Dec 20 to Jan 5)
      return currentCode >= startCode || currentCode <= endCode;
    }
  }

  /**
   * Evaluates current time and syncs active event with Zustand store.
   */
  public static updateActiveWorldEvent(nowDate: Date = new Date()): WorldEvent | null {
    const active = this.evaluateActiveEvent(nowDate);
    const store = useGameStore.getState();
    const currentInStore = store.activeWorldEvent;

    if (active?.id !== currentInStore?.id) {
      store.setActiveWorldEvent(active);
    }

    return active;
  }

  /**
   * Retrieves active world event modifiers from store.
   */
  public static getActiveModifiers(): WorldEventModifiers {
    const active = useGameStore.getState().activeWorldEvent;
    return active ? active.modifiers : {};
  }
}
