import { BiomeType } from './game';

export type GameMode = 'arcade' | 'campaign';

// `ZoneType` era um enum próprio com nomes placeholder ('ruined_village',
// 'catacombs_depths') que nunca bateram com os biomas de verdade usados pela
// progressão de campanha em `DungeonFlowController.ts` (que avança
// safe_house → gloomy_woods → fosso_chagas → catacumbas_martires →
// santuario_sangue, os mesmos nomes de `BiomeType` do modo Arcade). Isso
// causava ~10 erros reais de typecheck (biome/currentZone incompatíveis).
// `ZoneType` agora é só um alias de `BiomeType` — não existem dois conceitos
// de "zona/bioma" no jogo, e o modo Campanha reaproveita os mesmos biomas do
// Arcade conforme o jogador avança de andar.
export type ZoneType = BiomeType;

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

// Fila de efeitos que a store (React/dialogue) pede pro Phaser (`GameScene`)
// executar de verdade — mesmo padrão de "sinal pendente lido no update()" já
// usado por `pendingMeleeHitTarget`/`SPELL_UNLOCK_BY_DISCOVERABLE`: a store não
// tem acesso a `scene.player`, então efeitos que mexem em HP/mana/loot físico
// são só enfileirados aqui e o `GameScene.update()` os drena e aplica.
// Efeitos que são puro estado de store (`unlockCampaignSpell`, `setActiveNPC`)
// NÃO passam por aqui — são aplicados direto onde a ação é decidida.
export type CampaignEffect =
  | { type: 'heal_player' }
  | { type: 'give_xp'; amount: number }
  | { type: 'give_weapon'; itemId: string };

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
  // Nota: o modo (Campanha/Arcade) NÃO vive aqui — fica em `GameStore.gameMode`,
  // um nível acima. Havia um campo `gameMode` duplicado aqui que nunca era lido
  // em lugar nenhum do código (dado morto); removido em 27/08 ao corrigir um
  // erro de typecheck (`campaignState` no `gameStore.ts` não preenchia essa
  // propriedade "obrigatória").
  currentZone: ZoneType;
  chapter: number;
  storyFlags: Record<string, boolean>;
  quests: Record<string, QuestLogEntry>;
  activeDialogueTree: DialogueTree | null;
  activeDialogueNodeId: string | null;
  discoveredZones: ZoneType[];
  // Frente 3 de docs/specs/13_ARPG_CAMPAIGN_AND_SAFE_HOUSE.md (Zero-to-Hero):
  // no modo campanha o jogador começa sem magias — cada spellId aqui foi
  // conquistado por progressão de história (ex.: blood_bolt no Altar Ancestral).
  // Não confundir com `playerStats.unlockedSpells` (herança do modo arcade,
  // sempre cheio) — ver observação em `gameStore.ts`.
  unlockedSpellIds: string[];
}
