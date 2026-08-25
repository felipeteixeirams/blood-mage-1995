import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CombatFeel } from './CombatFeel';
import { useGameStore } from '../../store/gameStore';

vi.mock('phaser', () => ({
  default: {
    TintModes: {
      FILL: 1,
      MULTIPLY: 0,
    },
  },
}));

const initialStore = useGameStore.getState();

function resetStore() {
  localStorage.clear();
  useGameStore.setState(initialStore, true);
}

interface FakeScene {
  physics: { world: { pause: any; resume: any } };
  cameras: { main: { shake: any } };
  time: { addEvent: any };
  _callbacks: Array<() => void>;
}

const scenes: FakeScene[] = [];

function makeScene(): FakeScene {
  const callbacks: Array<() => void> = [];
  const scene = {
    physics: { world: { pause: vi.fn(), resume: vi.fn() } },
    cameras: { main: { shake: vi.fn() } },
    time: {
      addEvent: vi.fn((config: { delay: number; callback: () => void }) => {
        callbacks.push(config.callback);
        return {};
      }),
    },
    _callbacks: callbacks,
  };
  scenes.push(scene);
  return scene;
}

describe('CombatFeel', () => {
  beforeEach(() => {
    resetStore();
  });

  afterEach(() => {
    // Reset the static freeze flag by flushing every pending hit-stop callback
    for (const scene of scenes) {
      for (const cb of scene._callbacks) {
        cb();
      }
      scene._callbacks.length = 0;
    }
    scenes.length = 0;
  });

  describe('triggerScreenShake', () => {
    it('does not shake when screenShakeEnabled is false', () => {
      useGameStore.setState({ settings: { ...useGameStore.getState().settings, screenShakeEnabled: false } });
      const scene = makeScene();
      CombatFeel.triggerScreenShake(scene as never, 0.01, 100);
      expect(scene.cameras.main.shake).not.toHaveBeenCalled();
    });

    it('shakes when screenShakeEnabled is true', () => {
      useGameStore.setState({ settings: { ...useGameStore.getState().settings, screenShakeEnabled: true } });
      const scene = makeScene();
      CombatFeel.triggerScreenShake(scene as never, 0.01, 100);
      expect(scene.cameras.main.shake).toHaveBeenCalledWith(100, 0.01);
    });
  });

  describe('triggerHitStop', () => {
    it('pauses physics and schedules a resume', () => {
      const scene = makeScene();
      CombatFeel.triggerHitStop(scene as never, 40);
      expect(scene.physics.world.pause).toHaveBeenCalled();
      expect(scene.time.addEvent).toHaveBeenCalledWith(
        expect.objectContaining({ delay: 40 }),
      );

      // Simulate the scheduled callback resuming physics
      const config = scene.time.addEvent.mock.calls[0][0];
      config.callback();
      expect(scene.physics.world.resume).toHaveBeenCalled();
    });

    it('ignores a second hit-stop while one is active', () => {
      const scene = makeScene();
      CombatFeel.triggerHitStop(scene as never, 40);
      CombatFeel.triggerHitStop(scene as never, 80);
      expect(scene.time.addEvent).toHaveBeenCalledTimes(1);
    });
  });

  describe('handleHitImpact', () => {
    it('applies special shake intensity and hit-stop for special skills', () => {
      const scene = makeScene();
      CombatFeel.handleHitImpact(scene as never, 5, false, true, 0.8);
      expect(scene.cameras.main.shake).toHaveBeenCalledWith(200, 0.01);
      expect(scene.time.addEvent).toHaveBeenCalledTimes(1);
      const config = scene.time.addEvent.mock.calls[0][0];
      expect(config.delay).toBe(80);
      config.callback();
    });

    it('applies crit shake intensity and 40ms hit-stop', () => {
      const scene = makeScene();
      CombatFeel.handleHitImpact(scene as never, 10, true, false, 0.9);
      expect(scene.cameras.main.shake).toHaveBeenCalledWith(130, 0.006);
      const config = scene.time.addEvent.mock.calls[0][0];
      expect(config.delay).toBe(40);
      config.callback();
    });

    it('applies high-damage shake when damage > 15', () => {
      const scene = makeScene();
      CombatFeel.handleHitImpact(scene as never, 30, false, false, 0.9);
      expect(scene.cameras.main.shake).toHaveBeenCalledWith(100, 0.004);
      expect(scene.time.addEvent).not.toHaveBeenCalled();
    });

    it('triggers hit-stop when enemy HP ratio is at or below 0.2', () => {
      const scene = makeScene();
      CombatFeel.handleHitImpact(scene as never, 3, false, false, 0.2);
      expect(scene.time.addEvent).toHaveBeenCalledTimes(1);
      scene.time.addEvent.mock.calls[0][0].callback();
    });

    it('uses default gentle shake for normal hits', () => {
      const scene = makeScene();
      CombatFeel.handleHitImpact(scene as never, 5, false, false, 0.9);
      expect(scene.cameras.main.shake).toHaveBeenCalledWith(60, 0.002);
      expect(scene.time.addEvent).not.toHaveBeenCalled();
    });
  });

  describe('triggerVibration', () => {
    it('calls navigator.vibrate for damage_taken', () => {
      const vibrate = vi.fn();
      Object.defineProperty(navigator, 'vibrate', { value: vibrate, configurable: true });
      CombatFeel.triggerVibration('damage_taken');
      expect(vibrate).toHaveBeenCalledWith(50);
    });

    it('triggers vibrate for all vibration types', () => {
      const vibrate = vi.fn();
      Object.defineProperty(navigator, 'vibrate', { value: vibrate, configurable: true });
      CombatFeel.triggerVibration('dodge_success');
      expect(vibrate).toHaveBeenCalledWith([20, 30, 20]);
      CombatFeel.triggerVibration('level_up');
      expect(vibrate).toHaveBeenCalledWith([80, 20, 80]);
      CombatFeel.triggerVibration('execution');
      expect(vibrate).toHaveBeenCalledWith([30, 10, 20]);
      CombatFeel.triggerVibration('cooldown_warning');
      expect(vibrate).toHaveBeenCalledWith(10);
    });
  });

  describe('triggerHitFlash', () => {
    it('applies hit flash sequence to active sprite', () => {
      const delayedCalls: Array<{ delay: number; cb: () => void }> = [];
      const fakeScene = {
        time: {
          delayedCall: vi.fn((delay, cb) => {
            delayedCalls.push({ delay, cb });
          }),
        },
      };

      const mockSprite = {
        active: true,
        setTint: vi.fn().mockReturnThis(),
        setTintMode: vi.fn().mockReturnThis(),
        clearTint: vi.fn().mockReturnThis(),
      };

      CombatFeel.triggerHitFlash(fakeScene as never, mockSprite as never, 0xffffff, false);

      expect(mockSprite.setTint).toHaveBeenCalledWith(0xffffff);
      expect(mockSprite.setTintMode).toHaveBeenCalled();
      expect(fakeScene.time.delayedCall).toHaveBeenCalledTimes(2);

      // Execute frame 2 (dissolve)
      delayedCalls[0].cb();
      expect(mockSprite.setTint).toHaveBeenCalledWith(0xcc2222);

      // Execute frame 3 (restore)
      delayedCalls[1].cb();
      expect(mockSprite.clearTint).toHaveBeenCalled();
    });

    it('does nothing if sprite is inactive', () => {
      const fakeScene = { time: { delayedCall: vi.fn() } };
      const inactiveSprite = { active: false };
      CombatFeel.triggerHitFlash(fakeScene as never, inactiveSprite as never);
      expect(fakeScene.time.delayedCall).not.toHaveBeenCalled();
    });
  });

  describe('triggerSquashStretch', () => {
    it('applies squash and stretch scale animation sequence', () => {
      const delayedCalls: Array<{ delay: number; cb: () => void }> = [];
      const fakeScene = {
        time: {
          delayedCall: vi.fn((delay, cb) => {
            delayedCalls.push({ delay, cb });
          }),
        },
      };

      const mockSprite = {
        active: true,
        setScale: vi.fn(),
      };

      CombatFeel.triggerSquashStretch(fakeScene as never, mockSprite as never, 1.0, 1.0, true);

      expect(mockSprite.setScale).toHaveBeenCalledWith(1.35, 0.72);
      expect(fakeScene.time.delayedCall).toHaveBeenCalledTimes(2);

      // Execute stretch call
      delayedCalls[0].cb();
      expect(mockSprite.setScale).toHaveBeenCalledWith(0.8, 1.3);

      // Execute restore call
      delayedCalls[1].cb();
      expect(mockSprite.setScale).toHaveBeenCalledWith(1.0, 1.0);
    });
  });
});
