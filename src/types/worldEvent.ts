export type WorldEventType = 'atmospheric' | 'siege' | 'rift' | 'seasonal';

export interface WorldEventModifiers {
  lightRadiusMultiplier?: number;
  monsterFrenzy?: boolean;
  monsterAttackSpeedBonus?: number;
  dropMultiplier?: number;
  skeletonSpawnBonus?: number;
  freezeChance?: number;
}

export interface WorldEventVisuals {
  tint?: string;
  fogAlpha?: number;
  particleType?: 'embers' | 'purple_sparks' | 'snow';
  badgeIcon?: string;
  badgeColor?: string;
}

export interface SeasonalDateRange {
  startMonth: number; // 1-12
  startDay: number;   // 1-31
  endMonth: number;   // 1-12
  endDay: number;     // 1-31
}

export interface CyclicalSchedule {
  cycleDurationHours: number;
  cycleIntervalHours: number;
}

export interface WorldEvent {
  id: string;
  nameKey: string;
  descriptionKey: string;
  type: WorldEventType;
  scheduleType: 'cyclical' | 'seasonal' | 'always_active';
  cyclicalSchedule?: CyclicalSchedule;
  seasonalDateRange?: SeasonalDateRange;
  modifiers: WorldEventModifiers;
  visuals: WorldEventVisuals;
}
