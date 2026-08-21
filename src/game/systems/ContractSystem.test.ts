import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContractSystem } from './ContractSystem';
import { useGameStore } from '../../store/gameStore';
import contractsData from '../../data/contracts.json';

vi.mock('phaser', () => ({ default: {} }));
vi.mock('../objects/Enemy', () => ({ Enemy: class Enemy {} }));
vi.mock('../scenes/GameScene', () => ({ GameScene: class GameScene {} }));

const initialStore = useGameStore.getState();

function resetStore() {
  localStorage.clear();
  useGameStore.setState(initialStore, true);
}

function makeScene() {
  const player = {
    x: 10,
    y: 20,
    addXp: vi.fn(() => false),
  };
  const scene = {
    player,
    spawnFloatingText: vi.fn(),
    triggerLevelUp: vi.fn(),
  };
  return scene;
}

type FakeScene = ReturnType<typeof makeScene>;

function makeEnemy(id: string) {
  return { config: { id } };
}

describe('ContractSystem', () => {
  beforeEach(() => {
    resetStore();
    // Resets static per-run counters inside ContractSystem
    ContractSystem.initRunContracts();
  });

  describe('initRunContracts', () => {
    it('selects 3 unique contracts from the pool', () => {
      ContractSystem.initRunContracts();
      const active = useGameStore.getState().activeContracts;
      expect(active).toHaveLength(3);
      const ids = active.map((c) => c.id);
      expect(new Set(ids).size).toBe(3);
    });

    it('sets target based on condition.count', () => {
      ContractSystem.initRunContracts();
      const active = useGameStore.getState().activeContracts;
      for (const contract of active) {
        const cfg = (contractsData as Array<{ id: string; condition: { count?: number } }>).find(
          (c) => c.id === contract.id,
        );
        expect(contract.target).toBe(cfg?.condition.count ?? 1);
      }
    });
  });

  describe('onEnemyKilled (hounds contract)', () => {
    it('increments progress for hell hounds', () => {
      ContractSystem.initRunContracts();
      useGameStore.getState().setActiveContracts([
        { id: 'kill_10_hounds_nodamage', label: 'P', description: 'D', progress: 0, target: 10, completed: false },
      ]);
      const scene = makeScene();
      ContractSystem.onEnemyKilled(makeEnemy('hell_hound') as never, scene as never);
      const contract = useGameStore.getState().activeContracts[0];
      expect(contract.progress).toBe(1);
    });

    it('does not count non-hound kills', () => {
      ContractSystem.initRunContracts();
      useGameStore.getState().setActiveContracts([
        { id: 'kill_10_hounds_nodamage', label: 'P', description: 'D', progress: 0, target: 10, completed: false },
      ]);
      const scene = makeScene();
      ContractSystem.onEnemyKilled(makeEnemy('zombie') as never, scene as never);
      expect(useGameStore.getState().activeContracts[0].progress).toBe(0);
    });

    it('completes the contract and grants reward at 10 kills', () => {
      ContractSystem.initRunContracts();
      useGameStore.getState().setActiveContracts([
        { id: 'kill_10_hounds_nodamage', label: 'P', description: 'D', progress: 0, target: 10, completed: false },
      ]);
      const scene = makeScene();
      for (let i = 0; i < 10; i++) {
        ContractSystem.onEnemyKilled(makeEnemy('hell_hound') as never, scene as never);
      }
      const contract = useGameStore.getState().activeContracts[0];
      expect(contract.completed).toBe(true);
      expect(contract.progress).toBe(10);
      expect(useGameStore.getState().bloodCrystals).toBeGreaterThan(0);
      expect(scene.spawnFloatingText).toHaveBeenCalled();
    });
  });

  describe('onPlayerDamaged', () => {
    it('resets hound streak progress to 0', () => {
      ContractSystem.initRunContracts();
      useGameStore.getState().setActiveContracts([
        { id: 'kill_10_hounds_nodamage', label: 'P', description: 'D', progress: 5, target: 10, completed: false },
      ]);
      ContractSystem.onPlayerDamaged();
      expect(useGameStore.getState().activeContracts[0].progress).toBe(0);
    });
  });

  describe('onChestOpened', () => {
    it('increments chest progress and completes at 3', () => {
      ContractSystem.initRunContracts();
      useGameStore.getState().setActiveContracts([
        { id: 'open_3_chests', label: 'C', description: 'D', progress: 0, target: 3, completed: false },
      ]);
      const scene = makeScene();
      for (let i = 0; i < 3; i++) {
        ContractSystem.onChestOpened(scene as never);
      }
      const contract = useGameStore.getState().activeContracts[0];
      expect(contract.completed).toBe(true);
      expect(contract.progress).toBe(3);
    });
  });

  describe('onExecutionDone', () => {
    it('increments executions and completes at 3', () => {
      ContractSystem.initRunContracts();
      useGameStore.getState().setActiveContracts([
        { id: 'make_3_executions', label: 'X', description: 'D', progress: 0, target: 3, completed: false },
      ]);
      const scene = makeScene();
      for (let i = 0; i < 3; i++) {
        ContractSystem.onExecutionDone(scene as never);
      }
      const contract = useGameStore.getState().activeContracts[0];
      expect(contract.completed).toBe(true);
      expect(contract.progress).toBe(3);
    });
  });

  describe('onFloorCompleted', () => {
    it('rewards no_scythe_floor3 when scythe was never cast on floor 3', () => {
      ContractSystem.initRunContracts();
      useGameStore.getState().setActiveContracts([
        { id: 'no_scythe_floor3', label: 'D', description: 'D', progress: 0, target: 1, completed: false },
      ]);
      const scene = makeScene();
      ContractSystem.onFloorCompleted(3, 1.0, scene as never);
      const contract = useGameStore.getState().activeContracts[0];
      expect(contract.completed).toBe(true);
    });

    it('rewards floor_low_hp when completing under 30% HP', () => {
      ContractSystem.initRunContracts();
      useGameStore.getState().setActiveContracts([
        { id: 'floor_low_hp', label: 'S', description: 'D', progress: 0, target: 1, completed: false },
      ]);
      const scene = makeScene();
      ContractSystem.onFloorCompleted(2, 0.2, scene as never);
      expect(useGameStore.getState().activeContracts[0].completed).toBe(true);
    });

    it('does not reward floor_low_hp when HP is high', () => {
      ContractSystem.initRunContracts();
      useGameStore.getState().setActiveContracts([
        { id: 'floor_low_hp', label: 'S', description: 'D', progress: 0, target: 1, completed: false },
      ]);
      const scene = makeScene();
      ContractSystem.onFloorCompleted(2, 0.9, scene as never);
      expect(useGameStore.getState().activeContracts[0].completed).toBe(false);
    });
  });
});
