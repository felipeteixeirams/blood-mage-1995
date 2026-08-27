import { create } from 'zustand';
import { PlayerStats, UpgradeOption, GameSettings, HighScoreRecord, LootItem, RelicItem, RelicEffect, EquipmentSlots, BiomeType, DroppedCorpse, CodexState, AchievementState, RunStats } from '../types/game';
import { GameMode, ZoneType, CampaignState, DialogueTree, QuestLogEntry, QuestDefinition, QuestObjective, CampaignEffect } from '../types/campaign';
import { loadSettings, saveSettings, loadHighScores, saveHighScore, loadBloodCrystals, saveBloodCrystals, loadTalentLevels, saveTalentLevels, loadOnboarding, saveOnboarding, loadUnlockedRelics, saveUnlockedRelics, loadEquippedRelicIds, saveEquippedRelicIds, loadCodexState, saveCodexState, loadAchievements, saveAchievements, loadRunStats, saveRunStats, loadCampaignState, saveCampaignState } from '../utils/localStorage';
import { soundEngine } from '../utils/soundEngine';
import { CodexSystem } from '../game/systems/CodexSystem';
import relicsData from '../data/relics.json';
import achievementsData from '../data/achievements.json';
import dialoguesData from '../data/dialogues.json';
import campaignQuestsData from '../data/campaignQuests.json';
import campaignItemsData from '../data/campaignItems.json';

type GameStateStatus = 'menu' | 'playing' | 'paused';

interface GameStore {
  // Game Status
  gameState: GameStateStatus;
  setGameState: (state: GameStateStatus) => void;

  // Campaign State
  gameMode: GameMode;
  setGameMode: (mode: GameMode) => void;
  campaignState: CampaignState;
  startDialogue: (treeId: string) => void;
  selectDialogueChoice: (choiceId: string) => void;
  closeDialogue: () => void;
  advanceQuestObjective: (questId: string, objectiveId: string, amount?: number) => void;
  advanceQuestObjectiveByTarget: (type: QuestObjective['type'], targetId: string, amount?: number) => void;
  setCampaignZone: (zone: ZoneType) => void;
  unlockCampaignSpell: (spellId: string) => void;
  isCampaignSpellUnlocked: (spellId: string) => boolean;
  // Frente 3 de docs/specs/13_ARPG_CAMPAIGN_AND_SAFE_HOUSE.md (27/08, fecha o
  // gap dos "6 feitiços sem gatilho" — ver CAMPAIGN_SPELL_UNLOCK_LEVEL):
  // chamado do `GameScene.update()` sempre que `player.stats.level` sobe em
  // modo Campanha; destrava todo feitiço cujo nível-requisito já foi
  // alcançado e devolve só os ids recém-destravados nesta chamada (pra quem
  // chamou poder mostrar feedback tipo "X DESBLOQUEADO!" sem duplicar
  // checagem de "já tinha desbloqueado?").
  checkLevelSpellUnlocks: (level: number) => string[];
  resetCampaignProgress: () => void;
  // Fila drenada pelo `GameScene.update()` — ver comentário em `CampaignEffect`
  // (types/campaign.ts). Não é persistida: se a página recarregar com efeitos
  // pendentes (janela de um frame), eles só se perdem, não corrompem nada.
  pendingCampaignEffects: CampaignEffect[];
  queueCampaignEffect: (effect: CampaignEffect) => void;
  drainCampaignEffects: () => CampaignEffect[];

  // Settings
  settings: GameSettings;
  updateSettings: (settings: GameSettings) => void;
  
  // High Scores
  highScores: HighScoreRecord[];
  addHighScore: (score: Omit<HighScoreRecord, 'id' | 'date'>) => void;

  // Audio
  isMuted: boolean;
  toggleMute: () => void;

  // Modals & UI overlays
  isBestiaryOpen: boolean;
  setBestiaryOpen: (isOpen: boolean) => void;
  isCodexOpen: boolean;
  setCodexOpen: (isOpen: boolean) => void;
  isSettingsOpen: boolean;
  setSettingsOpen: (isOpen: boolean) => void;
  isHighScoresOpen: boolean;
  setHighScoresOpen: (isOpen: boolean) => void;
  isAchievementsOpen: boolean;
  setAchievementsOpen: (isOpen: boolean) => void;
  isTalentsOpen: boolean;
  setTalentsOpen: (isOpen: boolean) => void;
  isInventoryOpen: boolean;
  setInventoryOpen: (isOpen: boolean) => void;
  isObservabilityOpen: boolean;
  setObservabilityOpen: (isOpen: boolean) => void;
  isSoundTestOpen: boolean;
  setSoundTestOpen: (isOpen: boolean) => void;
  isEditingHUD: boolean;
  setEditingHUD: (isEditing: boolean) => void;
  gamepadConnected: boolean;
  setGamepadConnected: (connected: boolean) => void;
  activeContracts: { id: string; label: string; description: string; progress: number; target: number; completed: boolean }[];
  setActiveContracts: (contracts: any[]) => void;
  updateContractProgress: (id: string, progress: number) => void;
  completeContract: (id: string) => void;
  activeModifiers: string[];
  toggleModifier: (id: string) => void;
  clearModifiers: () => void;
  onboarding: {
    firstKillDone: boolean;
    firstLevelUpDone: boolean;
    firstEquipDone: boolean;
    firstBossSeen: boolean;
    firstSkillCast: boolean;
  };
  triggerOnboardingEvent: (key: 'firstKillDone' | 'firstLevelUpDone' | 'firstEquipDone' | 'firstBossSeen' | 'firstSkillCast', tipText: string) => void;
  activeTip: string | null;
  setActiveTip: (tip: string | null) => void;
  isRecordsOpen: boolean;
  setRecordsOpen: (isOpen: boolean) => void;

  // Metagame Currency & Talents
  bloodCrystals: number;
  addBloodCrystals: (amount: number) => void;
  talentLevels: Record<string, number>;
  upgradeTalent: (talentId: string, cost: number) => boolean;

  // Codex & Lore System
  codexState: CodexState;
  onEnemyKilled: (monsterId: string) => void;
  claimCodexMilestone: (entryId: string, killCount: number) => boolean;
  unlockCodexEntry: (entryId: string) => void;
  getLoreCompletionPercentage: () => number;

  // Relic System & Metagame
  unlockedRelics: string[];
  unlockRelic: (relicId: string) => void;
  equipRelicById: (relicId: string) => boolean;
  unequipRelicById: (relicId: string) => void;
  getRelicModifiers: () => RelicEffect;

  // Equipment & Loot
  equipment: EquipmentSlots;
  equipItem: (item: LootItem | RelicItem) => void;
  clearInventoryOnDeath: () => void;
  retrieveCorpseLoot: () => void;
  recentLootLog: string[];
  addLootLog: (msg: string) => void;

  // Biome & Environment
  currentBiome: BiomeType;
  setCurrentBiome: (biome: BiomeType) => void;

  // Gameplay Events
  levelUpData: { level: number; choices: UpgradeOption[] } | null;
  setLevelUpData: (data: { level: number; choices: UpgradeOption[] } | null) => void;
  gameOverStats: PlayerStats | null;
  setGameOverStats: (stats: PlayerStats | null) => void;

  // Real-time Stats
  playerStats: PlayerStats;
  setPlayerStats: (stats: PlayerStats) => void;
  setUnconscious: (unconscious: boolean) => void;
  setStatusCondition: (condition: 'bleeding' | 'poison' | 'infection', active: boolean) => void;
  setDefinitivelyDead: (isDead: boolean) => void;
  setDroppedCorpse: (corpse: DroppedCorpse) => void;
  useCurative: (type: 'bandages' | 'antidotes' | 'antibiotics') => boolean;
  buyCurative: (type: 'bandages' | 'antidotes' | 'antibiotics', cost: number) => boolean;

  // Controls (Touch/Skills)
  touchMoveInput: { x: number; y: number };
  setTouchMoveInput: (x: number, y: number) => void;
  touchAimInput: { x: number; y: number };
  setTouchAimInput: (x: number, y: number) => void;
  activeSkillTrigger: 'nova' | 'syphon' | 'bone_shield' | 'crimson_scythe' | 'blood_ritual_circle' | 'hemomancy_beam' | null;
  setActiveSkillTrigger: (skill: 'nova' | 'syphon' | 'bone_shield' | 'crimson_scythe' | 'blood_ritual_circle' | 'hemomancy_beam' | null) => void;

  // Bridge tipada Phaser<->React (substitui window.dispatchEvent/CustomEvent) — ver docs/architecture/06_PHASER_REACT_BRIDGE_MIGRATION.md
  /** Comando "usar curativo" disparado pela UI; PhaserGame processa e reseta para null (mesmo padrão de activeSkillTrigger). */
  activeCurativeTrigger: 'bandages' | 'antidotes' | 'antibiotics' | null;
  setActiveCurativeTrigger: (type: 'bandages' | 'antidotes' | 'antibiotics' | null) => void;
  /** Comando "respawnar jogador" disparado pelo GameOverModal; PhaserGame processa e reseta para false. */
  respawnRequested: boolean;
  setRespawnRequested: (requested: boolean) => void;
  /** Incrementado sempre que uma paleta cosmética é aplicada; PhaserGame reage à mudança de valor (sem payload). */
  cosmeticTintVersion: number;
  bumpCosmeticTint: () => void;
  /** Estado do gesto de drag-to-aim das skills direcionais (start/move/end). Mesmo padrão de touchMoveInput/touchAimInput — já validado para atualização em alta frequência. */
  dragAim: { spellId: string | null; phase: 'start' | 'move' | 'end' | null; dx: number; dy: number; isDrag: boolean };
  setDragAim: (state: { spellId: string | null; phase: 'start' | 'move' | 'end' | null; dx: number; dy: number; isDrag: boolean }) => void;
  /** Último item coletado (para o toast de LootLog). `id` incrementa a cada chamada para distinguir pickups consecutivos do mesmo item. */
  lastLootPickup: { item: LootItem; id: number } | null;
  notifyLootPickup: (item: LootItem) => void;

  /**
   * Fase 2 de docs/archive/specs/propostas/09_HUD_REFERENCIAS_VISUAIS_DIABLO_DUNGEON_SIEGE.md:
   * snapshot do minimap — layout de salas gerado por DungeonGenerator (Frente 1
   * da spec 11, 27/08: BSP + Cellular Automata, número/tamanho/posição das
   * salas variam por andar, não é mais um grid fixo). `hud/Minimap.tsx` lê
   * `x/y/width/height` de cada sala e renderiza por bounding-box percentual,
   * não por índice de grade — `index` aqui é só a posição no array, sem
   * significado geométrico. GameScene empurra um novo snapshot periodicamente;
   * hud/Minimap.tsx só lê.
   */
  minimapRooms: {
    index: number;
    type: 'spawn' | 'chamber' | 'secret_treasure' | 'boss';
    explored: boolean;
    hasChest: boolean;
    hasPlayer: boolean;
    x: number;
    y: number;
    width: number;
    height: number;
  }[];
  setMinimapRooms: (rooms: GameStore['minimapRooms']) => void;

  /** 4 spell IDs the player has pinned to the HUD skill bar */
  skillPreset: string[];
  setSkillPreset: (preset: string[]) => void;

  activeScavengeable: { id: string; type: string; duration: number } | null;
  setActiveScavengeable: (scav: { id: string; type: string; duration: number } | null) => void;
  scavengeProgress: number;
  setScavengeProgress: (prog: number) => void;

  activeNPC: 'cleric' | 'alchemist' | 'blacksmith' | 'elder' | null;
  setActiveNPC: (npc: 'cleric' | 'alchemist' | 'blacksmith' | 'elder' | null) => void;
  // 'maelen' foi adicionado com a Safe House (docs/specs/13_ARPG_CAMPAIGN_AND_SAFE_HOUSE.md)
  // — só o NPC "mais próximo" pode ser Maelen; `activeNPC` (o modal genérico de
  // loja) nunca recebe 'maelen' porque a interação com ele sempre é roteada
  // pra `startDialogue`, não pro modal de NPC comum (ver GameplayHUD.tsx/GameScene.ts).
  closestNPCType: 'cleric' | 'alchemist' | 'blacksmith' | 'elder' | 'maelen' | null;
  setClosestNPCType: (type: 'cleric' | 'alchemist' | 'blacksmith' | 'elder' | 'maelen' | null) => void;

  currentTarget: { id: string; name: string; hp: number; maxHp: number; level?: number; isBoss?: boolean; lastAttacked: number } | null;
  setCurrentTarget: (target: { id: string; name: string; hp: number; maxHp: number; level?: number; isBoss?: boolean } | null) => void;
  clearStaleTarget: (timeNow: number) => void;

  // Achievements & Stats
  achievements: Record<string, AchievementState>;
  runStats: RunStats;
  redeemAchievement: (id: string, rewardAmount: number) => void;
  unlockAchievement: (id: string) => void;
  incrementRunStat: (metric: keyof RunStats, amount: number) => void;
  resetRunStats: () => void;
}

const defaultPlayerStats: PlayerStats = {
  hp: 100, maxHp: 100,
  mana: 100, maxMana: 100,
  level: 1, currentXp: 0, nextLevelXp: 50,
  moveSpeed: 160, damageMultiplier: 1.0, cooldownReduction: 0,
  vampirism: 0, projectileBonus: 0,
  kills: 0, souls: 0, wave: 1, floorDepth: 1, score: 0, timeSurvivedSeconds: 0,
  unlockedSpells: ['blood_bolt', 'hellfire_nova', 'syphon_soul', 'bone_shield', 'crimson_scythe', 'blood_ritual_circle', 'hemomancy_beam'],
  pendingStatPoints: 0,
  knockoutCount: 0,
  isUnconscious: false,
  isDefinitivelyDead: false,
  statusConditions: {
    bleeding: false,
    poison: false,
    infection: false,
  },
  curatives: {
    bandages: 1,
    antidotes: 1,
    antibiotics: 0,
  },
  droppedCorpse: {
    hasDroppedCorpse: false,
    zone: '',
    x: 0,
    y: 0,
    droppedTimestamp: 0,
    equipment: { weapon: null, armor: null, relics: [] },
    curatives: { bandages: 0, antidotes: 0, antibiotics: 0 },
  },
};

// Frente 3 de docs/specs/13_ARPG_CAMPAIGN_AND_SAFE_HOUSE.md (27/08) — gatilho
// simples por progressão pros 6 feitiços que ficavam permanentemente
// trancados em modo Campanha (`unlockCampaignSpell` só estava ligado ao
// blood_bolt/altar). Não existe conteúdo de Capítulo 2+ ainda (quests/zonas/
// altares novos) pra dar um gatilho narrativo a cada um — ver "Observação de
// escopo" na Frente 3 do spec — então cada um destrava por nível de
// personagem, na ordem crescente de custo/poder de `spells.json` (mana +
// custo de HP): hellfire_nova (AoE barata, sem HP) → bone_shield (defesa,
// sem HP) → crimson_scythe (mana baixa, HP baixo, dano alto) → syphon_soul
// (drain caro) → hemomancy_beam (feixe caro, HP médio) → blood_ritual_circle
// (grátis em mana, mas o HP mais caro — ritual "definitivo"). `blood_bolt`
// fica de fora deste mapa de propósito: continua exclusivo do Altar Ancestral
// (Frente 2), não teria sentido também destravar por nível.
const CAMPAIGN_SPELL_UNLOCK_LEVEL: Record<string, number> = {
  hellfire_nova: 3,
  bone_shield: 5,
  crimson_scythe: 7,
  syphon_soul: 9,
  hemomancy_beam: 11,
  blood_ritual_circle: 13,
};

// Snapshot salvo depois de qualquer mutação em `gameMode`/`campaignState` que
// represente progresso real (não estado de sessão como o diálogo aberto na
// tela) — ver observação em `src/utils/localStorage.ts`.
function persistCampaignSnapshot(gameMode: GameMode, campaignState: CampaignState): void {
  saveCampaignState({
    gameMode,
    currentZone: campaignState.currentZone,
    chapter: campaignState.chapter,
    storyFlags: campaignState.storyFlags,
    quests: campaignState.quests,
    discoveredZones: campaignState.discoveredZones,
    unlockedSpellIds: campaignState.unlockedSpellIds,
  });
}

const loadedCampaignState = loadCampaignState();

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: 'menu',
  setGameState: (state) => set({ gameState: state }),

  // Campaign State Initializer — carrega o progresso salvo (zona, quests,
  // magias desbloqueadas, gameMode) do localStorage; `activeDialogueTree`/
  // `activeDialogueNodeId` nunca são persistidos, começam sempre fechados.
  gameMode: loadedCampaignState.gameMode,
  setGameMode: (mode) => {
    set({ gameMode: mode });
    persistCampaignSnapshot(mode, get().campaignState);
  },
  campaignState: {
    currentZone: loadedCampaignState.currentZone,
    chapter: loadedCampaignState.chapter,
    storyFlags: loadedCampaignState.storyFlags,
    quests: loadedCampaignState.quests,
    activeDialogueTree: null,
    activeDialogueNodeId: null,
    discoveredZones: loadedCampaignState.discoveredZones,
    unlockedSpellIds: loadedCampaignState.unlockedSpellIds,
  },
  pendingCampaignEffects: [],
  queueCampaignEffect: (effect) => {
    set((state) => ({ pendingCampaignEffects: [...state.pendingCampaignEffects, effect] }));
  },
  drainCampaignEffects: () => {
    const effects = get().pendingCampaignEffects;
    if (effects.length > 0) set({ pendingCampaignEffects: [] });
    return effects;
  },
  startDialogue: (treeId) => {
    const tree = (dialoguesData as Record<string, DialogueTree>)[treeId];
    if (tree) {
      set((state) => ({
        campaignState: {
          ...state.campaignState,
          activeDialogueTree: tree,
          activeDialogueNodeId: tree.initialNodeId
        }
      }));
    }
  },
  selectDialogueChoice: (choiceId) => {
    const state = get();
    const tree = state.campaignState.activeDialogueTree;
    const nodeId = state.campaignState.activeDialogueNodeId;
    if (tree && nodeId) {
      const node = tree.nodes[nodeId];
      const choice = node.choices.find(c => c.id === choiceId);
      if (choice) {
        if (choice.nextNodeId) {
          set((s) => ({
            campaignState: {
              ...s.campaignState,
              activeDialogueNodeId: choice.nextNodeId!
            }
          }));
        } else {
          get().closeDialogue();
        }

        // Handle Actions — nenhum diálogo hoje usa give_weapon/give_spell/
        // heal_player/open_shop (só `safe_house_maelen_intro` > give_quest),
        // mas o handler já existe pronto pra próximos capítulos/NPCs.
        if (choice.action === 'give_quest' && choice.actionPayload) {
          get().advanceQuestObjective(choice.actionPayload, 'start');
        } else if (choice.action === 'give_spell' && choice.actionPayload) {
          get().unlockCampaignSpell(choice.actionPayload);
        } else if (choice.action === 'open_shop' && choice.actionPayload) {
          const npcType = choice.actionPayload as 'cleric' | 'alchemist' | 'blacksmith' | 'elder';
          get().setActiveNPC(npcType);
        } else if (choice.action === 'heal_player') {
          get().queueCampaignEffect({ type: 'heal_player' });
        } else if (choice.action === 'give_weapon' && choice.actionPayload) {
          get().queueCampaignEffect({ type: 'give_weapon', itemId: choice.actionPayload });
        }
      }
    }
  },
  closeDialogue: () => {
    set((state) => ({
      campaignState: {
        ...state.campaignState,
        activeDialogueTree: null,
        activeDialogueNodeId: null
      }
    }));
  },
  // Frente 2 de docs/specs/13_ARPG_CAMPAIGN_AND_SAFE_HOUSE.md — "gatilhos" do
  // Capítulo 1 (baú/scout/altar): `objectiveId === 'start'` continua sendo o
  // pseudo-id usado pela escolha de diálogo `give_quest` pra ativar a quest
  // (ver `selectDialogueChoice`); qualquer outro `objectiveId` agora incrementa
  // o progresso de verdade e fecha a quest quando todos os objetivos batem o alvo.
  advanceQuestObjective: (questId, objectiveId, amount = 1) => {
    // `justCompleted` é lido fora do updater do `set` de propósito — chamar
    // get().addBloodCrystals() (que por sua vez chama set()) enquanto ESTE set()
    // ainda está no meio da própria atualização é reentrância desnecessária;
    // aqui a recompensa só é concedida depois que o set() de baixo já terminou.
    let justCompletedQuestId: string | null = null;

    set((state) => {
      const quests = { ...state.campaignState.quests };
      const questDef = (campaignQuestsData as Record<string, QuestDefinition>)[questId];
      if (!questDef) return { campaignState: state.campaignState };

      if (objectiveId === 'start') {
        if (!quests[questId]) {
          quests[questId] = {
            questId,
            status: 'active',
            currentObjectiveIndex: 0,
            objectivesProgress: {}
          };
        }
        return { campaignState: { ...state.campaignState, quests } };
      }

      const log = quests[questId];
      if (!log || log.status !== 'active') return { campaignState: state.campaignState };

      const objective = questDef.objectives.find((o) => o.id === objectiveId);
      if (!objective) return { campaignState: state.campaignState };

      const prevProgress = log.objectivesProgress[objectiveId] ?? objective.currentCount;
      if (prevProgress >= objective.targetCount) return { campaignState: state.campaignState }; // já concluído

      const nextProgress = Math.min(objective.targetCount, prevProgress + amount);
      const nextObjectivesProgress = { ...log.objectivesProgress, [objectiveId]: nextProgress };
      const allDone = questDef.objectives.every(
        (o) => (nextObjectivesProgress[o.id] ?? o.currentCount) >= o.targetCount
      );

      quests[questId] = {
        ...log,
        objectivesProgress: nextObjectivesProgress,
        status: allDone ? 'completed' : 'active',
      };

      if (allDone) justCompletedQuestId = questId;

      return { campaignState: { ...state.campaignState, quests } };
    });

    // Recompensa concedida só na transição pra 'completed' (evita duplicar).
    // Cristais de Sangue e spellUnlockId são puro estado de store (aplicados
    // direto); XP e itemRewardId dependem de `scene.player`, que a store não
    // enxerga — vão pra fila de `CampaignEffect` que o `GameScene.update()`
    // drena (mesmo motivo de `heal_player`/`give_weapon` em `selectDialogueChoice`).
    if (justCompletedQuestId) {
      const questDef = (campaignQuestsData as Record<string, QuestDefinition>)[justCompletedQuestId];
      if (questDef) {
        get().addBloodCrystals(questDef.rewards.bloodCrystals);
        if (questDef.rewards.xp > 0) {
          get().queueCampaignEffect({ type: 'give_xp', amount: questDef.rewards.xp });
        }
        if (questDef.rewards.spellUnlockId) {
          get().unlockCampaignSpell(questDef.rewards.spellUnlockId);
        }
        if (questDef.rewards.itemRewardId) {
          get().queueCampaignEffect({ type: 'give_weapon', itemId: questDef.rewards.itemRewardId });
        }
      }
    }
    persistCampaignSnapshot(get().gameMode, get().campaignState);
  },
  // Ponto único usado pelos gatilhos de gameplay (chest, kill, discover) — cada
  // um só sabe "que tipo de coisa aconteceu" (ex.: matou um scout_beast), não
  // precisa saber qual questId/objectiveId isso corresponde. Varre as quests
  // ativas procurando um objetivo do tipo+alvo certo e delega pro
  // `advanceQuestObjective` de cima.
  advanceQuestObjectiveByTarget: (type, targetId, amount = 1) => {
    const state = get();
    Object.values(state.campaignState.quests).forEach((log) => {
      if (log.status !== 'active') return;
      const questDef = (campaignQuestsData as Record<string, QuestDefinition>)[log.questId];
      if (!questDef) return;
      const objective = questDef.objectives.find((o) => o.type === type && o.targetId === targetId);
      if (!objective) return;
      const prevProgress = log.objectivesProgress[objective.id] ?? objective.currentCount;
      if (prevProgress >= objective.targetCount) return; // já concluído
      get().advanceQuestObjective(log.questId, objective.id, amount);
    });
  },
  setCampaignZone: (zone) => {
    set((state) => ({
      campaignState: {
        ...state.campaignState,
        currentZone: zone,
        discoveredZones: state.campaignState.discoveredZones.includes(zone)
          ? state.campaignState.discoveredZones
          : [...state.campaignState.discoveredZones, zone]
      }
    }));
    persistCampaignSnapshot(get().gameMode, get().campaignState);
  },
  // Frente 3 de docs/specs/13_ARPG_CAMPAIGN_AND_SAFE_HOUSE.md (Zero-to-Hero).
  unlockCampaignSpell: (spellId) => {
    const alreadyUnlocked = get().campaignState.unlockedSpellIds.includes(spellId);
    set((state) => {
      if (state.campaignState.unlockedSpellIds.includes(spellId)) return state; // já desbloqueado
      return {
        campaignState: {
          ...state.campaignState,
          unlockedSpellIds: [...state.campaignState.unlockedSpellIds, spellId],
        },
      };
    });
    if (!alreadyUnlocked) persistCampaignSnapshot(get().gameMode, get().campaignState);
  },
  // No modo arcade nunca há bloqueio (mantém o comportamento de sempre — todas
  // as magias liberadas). Só o modo campanha consulta `unlockedSpellIds`.
  isCampaignSpellUnlocked: (spellId) => {
    const state = get();
    if (state.gameMode !== 'campaign') return true;
    return state.campaignState.unlockedSpellIds.includes(spellId);
  },
  // Frente 3 de docs/specs/13_ARPG_CAMPAIGN_AND_SAFE_HOUSE.md (27/08) — ver
  // CAMPAIGN_SPELL_UNLOCK_LEVEL acima. Fora do modo Campanha é sempre um
  // no-op que devolve `[]` (não há o que destravar — `isCampaignSpellUnlocked`
  // já libera tudo direto fora da Campanha).
  checkLevelSpellUnlocks: (level) => {
    if (get().gameMode !== 'campaign') return [];
    const { unlockedSpellIds } = get().campaignState;
    const newlyUnlocked: string[] = [];
    Object.entries(CAMPAIGN_SPELL_UNLOCK_LEVEL).forEach(([spellId, requiredLevel]) => {
      if (level >= requiredLevel && !unlockedSpellIds.includes(spellId)) {
        get().unlockCampaignSpell(spellId);
        newlyUnlocked.push(spellId);
      }
    });
    return newlyUnlocked;
  },
  // Apaga quests/unlocks/zona salvos e volta pro estado inicial da Safe House —
  // usado por "Nova Campanha" (App.tsx) quando já existe progresso salvo, pra
  // dar um jeito real de recomeçar do zero em vez de só reaproveitar o save
  // antigo por cima. `gameMode` NÃO é tocado aqui de propósito (quem decide
  // isso é `setGameMode`, chamado separadamente por quem inicia a campanha).
  resetCampaignProgress: () => {
    set({
      campaignState: {
        currentZone: 'safe_house',
        chapter: 1,
        storyFlags: {},
        quests: {},
        activeDialogueTree: null,
        activeDialogueNodeId: null,
        discoveredZones: ['safe_house'],
        unlockedSpellIds: [],
      },
    });
    persistCampaignSnapshot(get().gameMode, get().campaignState);
  },

  settings: loadSettings(),
  updateSettings: (newSettings) => {
    saveSettings(newSettings);
    soundEngine.setVolumes(newSettings.sfxVolume, newSettings.bgmVolume);
    set({ settings: newSettings });
  },

  highScores: loadHighScores(),
  addHighScore: (scoreData) => {
    const updated = saveHighScore(scoreData);
    set({ highScores: updated });
  },

  isMuted: false,
  toggleMute: () => {
    const muted = soundEngine.toggleMute();
    set({ isMuted: muted });
  },

  isBestiaryOpen: false,
  setBestiaryOpen: (isOpen) => set({ isBestiaryOpen: isOpen, isCodexOpen: isOpen }),
  isCodexOpen: false,
  setCodexOpen: (isOpen) => set({ isCodexOpen: isOpen, isBestiaryOpen: isOpen }),
  isSettingsOpen: false,
  setSettingsOpen: (isOpen) => set({ isSettingsOpen: isOpen }),
  isHighScoresOpen: false,
  setHighScoresOpen: (isOpen) => set({ isHighScoresOpen: isOpen }),
  isAchievementsOpen: false,
  setAchievementsOpen: (isOpen) => set({ isAchievementsOpen: isOpen }),
  isTalentsOpen: false,
  setTalentsOpen: (isOpen) => set({ isTalentsOpen: isOpen }),
  isInventoryOpen: false,
  setInventoryOpen: (isOpen) => set({ isInventoryOpen: isOpen }),
  isObservabilityOpen: false,
  setObservabilityOpen: (isOpen) => set({ isObservabilityOpen: isOpen }),
  isSoundTestOpen: false,
  setSoundTestOpen: (isOpen) => set({ isSoundTestOpen: isOpen }),
  isEditingHUD: false,
  setEditingHUD: (isEditing) => set({ isEditingHUD: isEditing }),
  gamepadConnected: false,
  setGamepadConnected: (connected) => set({ gamepadConnected: connected }),
  activeModifiers: [],
  toggleModifier: (id) => {
    const current = get().activeModifiers;
    const next = current.includes(id) ? current.filter(x => x !== id) : [...current, id];
    set({ activeModifiers: next });
  },
  clearModifiers: () => set({ activeModifiers: [] }),
  onboarding: loadOnboarding(),
  activeTip: null,
  setActiveTip: (tip) => set({ activeTip: tip }),
  triggerOnboardingEvent: (key, tipText) => {
    const current = get().onboarding;
    if (current[key]) return; // Already triggered before

    const updated = { ...current, [key]: true };
    saveOnboarding(updated);
    set({ onboarding: updated, activeTip: tipText });

    // Auto-fade tip after 6 seconds
    setTimeout(() => {
      if (get().activeTip === tipText) {
        set({ activeTip: null });
      }
    }, 6000);
  },
  activeContracts: [],
  setActiveContracts: (contracts) => set({ activeContracts: contracts }),
  updateContractProgress: (id, progress) => {
    const current = get().activeContracts;
    const updated = current.map((c) => {
      if (c.id === id) {
        return { ...c, progress: Math.min(c.target, progress) };
      }
      return c;
    });
    set({ activeContracts: updated });
  },
  completeContract: (id) => {
    const current = get().activeContracts;
    const updated = current.map((c) => {
      if (c.id === id) {
        return { ...c, completed: true, progress: c.target };
      }
      return c;
    });
    set({ activeContracts: updated });
  },
  isRecordsOpen: false,
  setRecordsOpen: (isOpen) => set({ isRecordsOpen: isOpen }),

  bloodCrystals: loadBloodCrystals(),
  addBloodCrystals: (amount) => {
    const current = get().bloodCrystals;
    const mult = get().getRelicModifiers().bloodCrystalMultiplier || 1.0;
    const finalAmount = amount > 0 ? Math.round(amount * mult) : amount;
    const next = current + finalAmount;
    saveBloodCrystals(next);
    set({ bloodCrystals: next });
  },

  codexState: loadCodexState(),
  onEnemyKilled: (monsterId) => {
    const currentState = get().codexState;
    const { nextState } = CodexSystem.recordKill(monsterId, currentState);
    saveCodexState(nextState);
    set({ codexState: nextState });
    // Gatilho da quest_ch1_first_steps (obj_clear_woods) — qualquer quest ativa
    // com um objetivo kill_enemy pra esse monsterId avança sozinha.
    get().advanceQuestObjectiveByTarget('kill_enemy', monsterId, 1);
  },
  claimCodexMilestone: (entryId, killCount) => {
    const currentState = get().codexState;
    const { success, rewardCrystals, nextState } = CodexSystem.claimMilestone(entryId, killCount, currentState);
    if (success) {
      saveCodexState(nextState);
      set({ codexState: nextState });
      get().addBloodCrystals(rewardCrystals);
      soundEngine.playOrbPickup();
    }
    return success;
  },
  unlockCodexEntry: (entryId) => {
    const currentState = get().codexState;
    const nextState = CodexSystem.unlockEntry(entryId, currentState);
    saveCodexState(nextState);
    set({ codexState: nextState });
  },
  getLoreCompletionPercentage: () => {
    return CodexSystem.calculateCompletionPercentage(get().codexState);
  },

  unlockedRelics: loadUnlockedRelics(),
  unlockRelic: (relicId) => {
    const current = get().unlockedRelics;
    if (!current.includes(relicId)) {
      const next = [...current, relicId];
      saveUnlockedRelics(next);
      set({ unlockedRelics: next });
    }
  },

  equipRelicById: (relicId) => {
    const relic = (relicsData as RelicItem[]).find((r) => r.id === relicId);
    if (!relic) return false;

    const { equipment } = get();
    const currentRelics = equipment.relics as RelicItem[];

    // If already equipped, return true
    if (currentRelics.some((r) => r.id === relicId)) return true;

    let updatedRelics: RelicItem[] = [];
    if (currentRelics.length < 3) {
      updatedRelics = [...currentRelics, relic];
    } else {
      updatedRelics = [currentRelics[1], currentRelics[2], relic];
    }

    const nextEquipment = { ...equipment, relics: updatedRelics };
    saveEquippedRelicIds(updatedRelics.map((r) => r.id));
    set({ equipment: nextEquipment });
    soundEngine.playEquipLoot();
    return true;
  },

  unequipRelicById: (relicId) => {
    const { equipment } = get();
    const currentRelics = equipment.relics as RelicItem[];
    const updatedRelics = currentRelics.filter((r) => r.id !== relicId);
    const nextEquipment = { ...equipment, relics: updatedRelics };
    saveEquippedRelicIds(updatedRelics.map((r) => r.id));
    set({ equipment: nextEquipment });
  },

  getRelicModifiers: () => {
    const { equipment } = get();
    const combined: RelicEffect = {
      damageMultiplier: 0,
      maxHpBonus: 0,
      speedBonus: 0,
      lifestealBonus: 0,
      cooldownReductionBonus: 0,
      hpRegenBonus: 0,
      bloodCrystalMultiplier: 1.0,
      bleedChanceOnHit: 0,
      bleedDamagePerSecond: 0,
      spellCostDiscount: 0,
    };

    equipment.relics.forEach((r) => {
      const effect = (r as RelicItem).effect || {};
      if (effect.damageMultiplier) combined.damageMultiplier! += effect.damageMultiplier;
      if (effect.maxHpBonus) combined.maxHpBonus! += effect.maxHpBonus;
      if (effect.speedBonus) combined.speedBonus! += effect.speedBonus;
      if (effect.lifestealBonus) combined.lifestealBonus! += effect.lifestealBonus;
      if (effect.cooldownReductionBonus) combined.cooldownReductionBonus! += effect.cooldownReductionBonus;
      if (effect.hpRegenBonus) combined.hpRegenBonus! += effect.hpRegenBonus;
      if (effect.bloodCrystalMultiplier) combined.bloodCrystalMultiplier! *= effect.bloodCrystalMultiplier;
      if (effect.bleedChanceOnHit) combined.bleedChanceOnHit! = Math.max(combined.bleedChanceOnHit!, effect.bleedChanceOnHit);
      if (effect.bleedDamagePerSecond) combined.bleedDamagePerSecond! += effect.bleedDamagePerSecond;
      if (effect.spellCostDiscount) combined.spellCostDiscount! += effect.spellCostDiscount;
    });

    return combined;
  },

  talentLevels: loadTalentLevels(),
  upgradeTalent: (talentId, cost) => {
    const { bloodCrystals, talentLevels } = get();
    if (bloodCrystals < cost) return false;

    const nextCrystals = bloodCrystals - cost;
    const currentLvl = talentLevels[talentId] || 0;
    const nextTalents = { ...talentLevels, [talentId]: currentLvl + 1 };

    saveBloodCrystals(nextCrystals);
    saveTalentLevels(nextTalents);

    set({
      bloodCrystals: nextCrystals,
      talentLevels: nextTalents,
    });
    return true;
  },

  equipment: {
    weapon: null,
    armor: null,
    relics: loadEquippedRelicIds()
      .map((id) => (relicsData as RelicItem[]).find((r) => r.id === id))
      .filter((r): r is RelicItem => Boolean(r)),
  },
  equipItem: (item) => {
    const { equipment } = get();
    const updated = { ...equipment };
    if (item.type === 'weapon') {
      updated.weapon = item as LootItem;
    } else if (item.type === 'armor') {
      updated.armor = item as LootItem;
    } else if (item.type === 'relic') {
      // Up to 3 relics, replaces oldest if full
      if (updated.relics.length < 3) {
        updated.relics = [...updated.relics, item];
      } else {
        updated.relics = [updated.relics[1], updated.relics[2], item];
      }
      saveEquippedRelicIds(updated.relics.map((r) => r.id));
    }
    set({ equipment: updated });
    // Frente 7 (spec 11, 27/08): Palette Swap procedural — troca de
    // arma/armadura pode mudar o tint/faíscas do personagem, reaproveita o
    // mesmo canal de refresh já usado pela paleta cosmética manual (ver
    // Player.applyCosmeticTint()/PhaserGame.tsx).
    get().bumpCosmeticTint();
  },
  clearInventoryOnDeath: () => {
    set((state) => ({
      equipment: { weapon: null, armor: null, relics: [] },
      playerStats: {
        ...state.playerStats,
        curatives: { bandages: 0, antidotes: 0, antibiotics: 0 }
      }
    }));
    get().bumpCosmeticTint();
  },
  retrieveCorpseLoot: () => {
    const state = get();
    const corpse = state.playerStats.droppedCorpse;
    if (corpse.hasDroppedCorpse) {
      set({
        equipment: corpse.equipment,
        playerStats: {
          ...state.playerStats,
          curatives: corpse.curatives,
          droppedCorpse: { ...corpse, hasDroppedCorpse: false }
        }
      });
      get().bumpCosmeticTint();
      state.addLootLog("Equipamentos e itens recuperados com sucesso!");
    }
  },

  recentLootLog: [],
  addLootLog: (msg) => {
    const current = get().recentLootLog;
    set({ recentLootLog: [msg, ...current].slice(0, 5) });
  },

  currentBiome: 'fosso_chagas',
  setCurrentBiome: (biome) => set({ currentBiome: biome }),

  levelUpData: null,
  setLevelUpData: (data) => set({ levelUpData: data }),
  
  gameOverStats: null,
  setGameOverStats: (stats) => set({ gameOverStats: stats }),

  playerStats: { ...defaultPlayerStats },
  setPlayerStats: (stats) => set({ playerStats: stats }),
  setUnconscious: (unconscious) => set((state) => ({
    playerStats: { ...state.playerStats, isUnconscious: unconscious }
  })),
  setStatusCondition: (condition, active) => set((state) => ({
    playerStats: {
      ...state.playerStats,
      statusConditions: {
        ...state.playerStats.statusConditions,
        [condition]: active
      }
    }
  })),
  setDefinitivelyDead: (isDead) => set((state) => ({
    playerStats: { ...state.playerStats, isDefinitivelyDead: isDead }
  })),
  setDroppedCorpse: (corpse) => set((state) => ({
    playerStats: { ...state.playerStats, droppedCorpse: corpse }
  })),
  useCurative: (type) => {
    const { playerStats } = get();
    if (playerStats.curatives[type] < 1) return false;

    let condition: 'bleeding' | 'poison' | 'infection' | null = null;
    if (type === 'bandages') condition = 'bleeding';
    else if (type === 'antidotes') condition = 'poison';
    else if (type === 'antibiotics') condition = 'infection';

    if (!condition || !playerStats.statusConditions[condition]) return false;

    soundEngine.playEquipLoot(); // Use sound
    set((state) => ({
      playerStats: {
        ...state.playerStats,
        statusConditions: {
          ...state.playerStats.statusConditions,
          [condition!]: false,
        },
        curatives: {
          ...state.playerStats.curatives,
          [type]: state.playerStats.curatives[type] - 1,
        },
      },
    }));
    return true;
  },
  buyCurative: (type, cost) => {
    const { bloodCrystals, playerStats } = get();
    if (bloodCrystals < cost) return false;

    const nextCrystals = bloodCrystals - cost;
    saveBloodCrystals(nextCrystals);

    soundEngine.playEquipLoot(); // Shop use sound
    set((state) => ({
      bloodCrystals: nextCrystals,
      playerStats: {
        ...state.playerStats,
        curatives: {
          ...state.playerStats.curatives,
          [type]: state.playerStats.curatives[type] + 1,
        },
      },
    }));
    return true;
  },

  touchMoveInput: { x: 0, y: 0 },
  setTouchMoveInput: (x, y) => set({ touchMoveInput: { x, y } }),
  
  touchAimInput: { x: 0, y: 0 },
  setTouchAimInput: (x, y) => set({ touchAimInput: { x, y } }),

  activeSkillTrigger: null,
  setActiveSkillTrigger: (skill) => set({ activeSkillTrigger: skill }),

  activeCurativeTrigger: null,
  setActiveCurativeTrigger: (type) => set({ activeCurativeTrigger: type }),

  respawnRequested: false,
  setRespawnRequested: (requested) => set({ respawnRequested: requested }),

  cosmeticTintVersion: 0,
  bumpCosmeticTint: () => set((state) => ({ cosmeticTintVersion: state.cosmeticTintVersion + 1 })),

  dragAim: { spellId: null, phase: null, dx: 0, dy: 0, isDrag: false },
  setDragAim: (dragAim) => set({ dragAim }),

  minimapRooms: [],
  setMinimapRooms: (rooms) => set({ minimapRooms: rooms }),

  lastLootPickup: null,
  notifyLootPickup: (item) => set((state) => ({
    lastLootPickup: { item, id: (state.lastLootPickup?.id ?? 0) + 1 }
  })),

  skillPreset: ['hellfire_nova', 'syphon_soul', 'bone_shield', 'crimson_scythe'],
  setSkillPreset: (preset) => set({ skillPreset: preset }),

  activeScavengeable: null,
  setActiveScavengeable: (scav) => set({ activeScavengeable: scav }),
  scavengeProgress: 0,
  setScavengeProgress: (prog) => set({ scavengeProgress: prog }),

  activeNPC: null,
  setActiveNPC: (npc) => set({ activeNPC: npc }),
  closestNPCType: null,
  setClosestNPCType: (type) => set({ closestNPCType: type }),

  currentTarget: null,
  setCurrentTarget: (target) => set({ 
    currentTarget: target ? { ...target, lastAttacked: Date.now() } : null 
  }),
  clearStaleTarget: (timeNow) => set((state) => {
    if (state.currentTarget && timeNow - state.currentTarget.lastAttacked > 5000) {
      return { currentTarget: null };
    }
    return state;
  }),

  achievements: loadAchievements(),
  runStats: loadRunStats(),
  
  redeemAchievement: (id, rewardAmount) => set((state) => {
    const ach = state.achievements[id];
    if (ach && ach.unlocked && !ach.redeemed) {
      const nextAchievements = {
        ...state.achievements,
        [id]: { ...ach, redeemed: true }
      };
      saveAchievements(nextAchievements);
      
      const nextCrystals = state.bloodCrystals + rewardAmount;
      saveBloodCrystals(nextCrystals);
      
      return {
        achievements: nextAchievements,
        bloodCrystals: nextCrystals
      };
    }
    return state;
  }),
  
  unlockAchievement: (id) => set((state) => {
    const ach = state.achievements[id] || { id, unlocked: false, redeemed: false };
    if (!ach.unlocked) {
      const nextAchievements = {
        ...state.achievements,
        [id]: { ...ach, unlocked: true }
      };
      saveAchievements(nextAchievements);
      return { achievements: nextAchievements };
    }
    return state;
  }),
  
  incrementRunStat: (metric, amount) => set((state) => {
    const nextStats = {
      ...state.runStats,
      [metric]: (state.runStats[metric] || 0) + amount
    };
    
    // Check achievements
    const unlockedNow: Record<string, AchievementState> = {};
    let achievementUnlocked = false;
    
    for (const achData of achievementsData) {
      if (achData.metric === metric) {
        const achState = state.achievements[achData.id] || { id: achData.id, unlocked: false, redeemed: false };
        if (!achState.unlocked && nextStats[metric] >= achData.target) {
          unlockedNow[achData.id] = { ...achState, unlocked: true };
          achievementUnlocked = true;
          // Optionally notify player here via soundEngine or toast
          console.log(`Achievement unlocked: ${achData.title}`);
        }
      }
    }
    
    saveRunStats(nextStats);
    
    if (achievementUnlocked) {
      const nextAchievements = { ...state.achievements, ...unlockedNow };
      saveAchievements(nextAchievements);
      return { runStats: nextStats, achievements: nextAchievements };
    }
    
    return { runStats: nextStats };
  }),
  
  resetRunStats: () => {
    const emptyStats: RunStats = {
      bloodless_floor: 0,
      kills_total: 0,
      kills_gargoyle: 0,
      speedrun_f3: 0,
      deaths_total: 0,
      hp_healed_magic: 0,
      dismemberments_total: 0,
      mana_orbs_run: 0,
      crystals_hoarded: 0,
      survival_time_run: 0
    };
    saveRunStats(emptyStats);
    set({ runStats: emptyStats });
  }
}));
