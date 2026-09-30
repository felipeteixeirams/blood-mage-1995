import Phaser from 'phaser';
import { useGameStore } from '../../store/gameStore';
import contractsData from '../../data/contracts.json';
import { Enemy } from '../objects/Enemy';
import { GameScene } from '../scenes/GameScene';

export interface ContractCondition {
  type: string;
  spell?: string;
  enemy?: string;
  floor?: number;
  count?: number;
  threshold?: number;
}

export interface ContractReward {
  bloodCrystals: number;
  xpBonus: number;
}

export interface ContractConfig {
  id: string;
  label: string;
  description: string;
  condition: ContractCondition;
  reward: ContractReward;
}

export class ContractSystem {
  // Local tracking of states
  private static spellCastsInFloor: Record<string, number> = {};
  private static houndsKilledNoDamageCount = 0;
  private static chestsOpenedInFloorCount = 0;
  private static executionsCount = 0;

  /**
   * Initializes 3 random contracts for a new run.
   */
  public static initRunContracts() {
    this.spellCastsInFloor = {};
    this.houndsKilledNoDamageCount = 0;
    this.chestsOpenedInFloorCount = 0;
    this.executionsCount = 0;

    const allPool = contractsData as ContractConfig[];
    // Select 3 random unique contracts
    const shuffled = [...allPool].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 3);

    const activeContracts = selected.map((cfg) => {
      let target = 1;
      if (cfg.condition.count) {
        target = cfg.condition.count;
      }
      return {
        id: cfg.id,
        label: cfg.label,
        description: cfg.description,
        progress: 0,
        target,
        completed: false
      };
    });

    useGameStore.getState().setActiveContracts(activeContracts);
  }

  private static triggerReward(cfg: ContractConfig, scene: GameScene) {
    const store = useGameStore.getState();
    store.completeContract(cfg.id);
    store.addBloodCrystals(cfg.reward.bloodCrystals);

    // Add XP directly to player
    const leveledUp = scene.player.addXp(cfg.reward.xpBonus);
    scene.spawnFloatingText(scene.player.x, scene.player.y - 35, `CONTRATO: ${cfg.label} CUMPRIDO! 🎉`, '#f59e0b', true);
    scene.spawnFloatingText(scene.player.x, scene.player.y - 50, `+${cfg.reward.bloodCrystals} 💎 +${cfg.reward.xpBonus} XP`, '#22c55e', false);

    if (leveledUp) {
      (scene as any).triggerLevelUp();
    }
  }

  public static onSpellCasted(spellId: string, scene: GameScene) {
    this.spellCastsInFloor[spellId] = (this.spellCastsInFloor[spellId] || 0) + 1;

    // Check no_scythe_floor3 contract failure
    const active = useGameStore.getState().activeContracts;
    const contract = active.find(c => c.id === 'no_scythe_floor3' && !c.completed);
    if (contract && spellId === 'crimson_scythe' && scene.player.stats.floorDepth === 3) {
      // Failed! progress remains at 0 or we can mark it failed
    }
  }

  public static onEnemyKilled(enemy: Enemy, scene: GameScene) {
    const active = useGameStore.getState().activeContracts;

    // 1. kill_10_hounds_nodamage contract check
    const contractHounds = active.find(c => c.id === 'kill_10_hounds_nodamage' && !c.completed);
    if (contractHounds && enemy.config.id === 'hell_hound') {
      this.houndsKilledNoDamageCount++;
      useGameStore.getState().updateContractProgress('kill_10_hounds_nodamage', this.houndsKilledNoDamageCount);

      const config = (contractsData as ContractConfig[]).find(c => c.id === 'kill_10_hounds_nodamage');
      if (config && this.houndsKilledNoDamageCount >= (config.condition.count || 10)) {
        this.triggerReward(config, scene);
      }
    }
  }

  public static onPlayerDamaged() {
    // Reset hound streak on damage
    this.houndsKilledNoDamageCount = 0;

    const active = useGameStore.getState().activeContracts;
    const contractHounds = active.find(c => c.id === 'kill_10_hounds_nodamage' && !c.completed);
    if (contractHounds) {
      useGameStore.getState().updateContractProgress('kill_10_hounds_nodamage', 0);
    }
  }

  public static onChestOpened(scene: GameScene) {
    this.chestsOpenedInFloorCount++;
    const active = useGameStore.getState().activeContracts;

    const contractChests = active.find(c => c.id === 'open_3_chests' && !c.completed);
    if (contractChests) {
      useGameStore.getState().updateContractProgress('open_3_chests', this.chestsOpenedInFloorCount);

      const config = (contractsData as ContractConfig[]).find(c => c.id === 'open_3_chests');
      if (config && this.chestsOpenedInFloorCount >= (config.condition.count || 3)) {
        this.triggerReward(config, scene);
      }
    }
  }

  public static onExecutionDone(scene: GameScene) {
    this.executionsCount++;
    const active = useGameStore.getState().activeContracts;

    const contractExec = active.find(c => c.id === 'make_3_executions' && !c.completed);
    if (contractExec) {
      useGameStore.getState().updateContractProgress('make_3_executions', this.executionsCount);

      const config = (contractsData as ContractConfig[]).find(c => c.id === 'make_3_executions');
      if (config && this.executionsCount >= (config.condition.count || 3)) {
        this.triggerReward(config, scene);
      }
    }
  }

  public static onFloorCompleted(floor: number, hpRatio: number, scene: GameScene) {
    const active = useGameStore.getState().activeContracts;

    // 1. no_scythe_floor3 check
    const contractScythe = active.find(c => c.id === 'no_scythe_floor3' && !c.completed);
    if (contractScythe && floor === 3) {
      const casts = this.spellCastsInFloor['crimson_scythe'] || 0;
      if (casts === 0) {
        const config = (contractsData as ContractConfig[]).find(c => c.id === 'no_scythe_floor3');
        if (config) {
          useGameStore.getState().updateContractProgress('no_scythe_floor3', 1);
          this.triggerReward(config, scene);
        }
      }
    }

    // 2. floor_low_hp check
    const contractLowHp = active.find(c => c.id === 'floor_low_hp' && !c.completed);
    if (contractLowHp) {
      const config = (contractsData as ContractConfig[]).find(c => c.id === 'floor_low_hp');
      if (config && hpRatio < (config.condition.threshold || 0.3)) {
        useGameStore.getState().updateContractProgress('floor_low_hp', 1);
        this.triggerReward(config, scene);
      }
    }

    // Reset floor-specific counts
    this.spellCastsInFloor = {};
    this.chestsOpenedInFloorCount = 0;
    const contractChests = active.find(c => c.id === 'open_3_chests' && !c.completed);
    if (contractChests) {
      useGameStore.getState().updateContractProgress('open_3_chests', 0);
    }
  }
}
