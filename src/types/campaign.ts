export type GameMode = 'arcade' | 'campaign';

export type ZoneType = 'safe_house' | 'gloomy_woods' | 'ruined_village' | 'catacombs_depths';

export type WeatherType = 'none' | 'gentle_rain' | 'thunderstorm' | 'thick_fog' | 'blood_mist';

export interface DialogueChoice {
  id: string;
  text: string;
  nextNodeId?: string | null;
  action?: 'give_quest' | 'give_weapon' | 'give_spell' | 'heal_player' | 'close_dialogue' | 'open_shop';
  actionPayload?: string;
  requiredQuestState?: {
    questId: string;
    status: 'not_started' | 'active' | 'completed';
  };
}

export interface DialogueNode {
  id: string;
  speakerName: string;
  speakerTitle?: string;
  speakerPortrait?: string;
  text: string;
  audioVoiceCue?: string;
  choices: DialogueChoice[];
}

export interface DialogueTree {
  id: string;
  npcId: string;
  initialNodeId: string;
  nodes: Record<string, DialogueNode>;
}

export interface NPCData {
  id: string;
  name: string;
  title: string;
  role: 'savior_host' | 'elder' | 'blacksmith' | 'healer' | 'wandering_merchant';
  portraitKey: string;
  initialDialogueTreeId: string;
  x: number;
  y: number;
  interactionRadius: number;
}

export interface QuestObjective {
  id: string;
  description: string;
  type: 'talk_npc' | 'kill_enemy' | 'collect_item' | 'discover_zone';
  targetId: string;
  targetCount: number;
  currentCount: number;
  isCompleted: boolean;
}

export interface QuestReward {
  xp: number;
  bloodCrystals: number;
  itemRewardId?: string;
  spellUnlockId?: string;
}

export interface QuestDefinition {
  id: string;
  title: string;
  chapter: number;
  summary: string;
  loreDescription: string;
  objectives: QuestObjective[];
  rewards: QuestReward;
  requiredLevel?: number;
  prerequisiteQuestId?: string;
}

export interface QuestLogEntry {
  questId: string;
  status: 'not_started' | 'active' | 'completed' | 'failed';
  currentObjectiveIndex: number;
  objectivesProgress: Record<string, number>;
}

export interface WorldZoneConfig {
  id: ZoneType;
  name: string;
  displayName: string;
  subtitle: string;
  isPeacefulHub: boolean;
  weather: WeatherType;
  ambientTrackKey: string;
  lightingTheme: {
    ambientColor: string;
    fogDensity: number;
    hasStormFlashes: boolean;
  };
  recommendedLevel: number;
}

export interface CampaignState {
  gameMode: GameMode;
  currentZone: ZoneType;
  chapter: number;
  storyFlags: Record<string, boolean>;
  quests: Record<string, QuestLogEntry>;
  activeDialogueTree: DialogueTree | null;
  activeDialogueNodeId: string | null;
  discoveredZones: ZoneType[];
}
