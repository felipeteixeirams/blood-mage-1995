import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { soundEngine } from './soundEngine';

describe('SoundEngine Hybrid Audio Fallback & Resiliency', () => {
  let mockAudioContext: any;
  let mockGainNode: any;
  let mockOscillatorNode: any;
  let mockBufferSourceNode: any;
  let mockBiquadFilterNode: any;

  beforeEach(() => {
    vi.useFakeTimers();

    mockGainNode = {
      gain: {
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
        setTargetAtTime: vi.fn(),
      },
      connect: vi.fn(),
      disconnect: vi.fn(),
    };

    mockOscillatorNode = {
      type: 'sine',
      frequency: {
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };

    mockBufferSourceNode = {
      buffer: null,
      loop: false,
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };

    mockBiquadFilterNode = {
      type: 'lowpass',
      frequency: {
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      Q: { value: 0, setValueAtTime: vi.fn() },
      connect: vi.fn(),
    };

    mockAudioContext = {
      state: 'running',
      currentTime: 0,
      sampleRate: 44100,
      destination: {},
      resume: vi.fn().mockResolvedValue(undefined),
      createGain: vi.fn(() => mockGainNode),
      createOscillator: vi.fn(() => mockOscillatorNode),
      createBufferSource: vi.fn(() => mockBufferSourceNode),
      createBiquadFilter: vi.fn(() => mockBiquadFilterNode),
      createBuffer: vi.fn((_channels: number, length: number, _sampleRate: number) => ({
        getChannelData: vi.fn(() => new Float32Array(length)),
      })),
      createStereoPanner: vi.fn(() => ({
        pan: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
        connect: vi.fn(),
      })),
    };

    const MockAudioContextClass = vi.fn().mockImplementation(function (this: any) {
      return mockAudioContext;
    });

    (window as any).AudioContext = MockAudioContextClass;
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('initializes AudioContext lazily on user sound trigger', () => {
    soundEngine.setVolumes(0.8, 0.5);
    soundEngine.playBloodBolt();

    expect((window as any).AudioContext).toHaveBeenCalled();
    expect(mockAudioContext.createOscillator).toHaveBeenCalled();
  });

  it('plays all synthesized SFX methods without throwing exceptions', () => {
    soundEngine.setVolumes(1.0, 1.0);

    expect(() => soundEngine.playBloodBolt()).not.toThrow();
    expect(() => soundEngine.playNova()).not.toThrow();
    expect(() => soundEngine.playBloodSquish()).not.toThrow();
    expect(() => soundEngine.playDemonRoar()).not.toThrow();
    expect(() => soundEngine.playLevelUp()).not.toThrow();
    expect(() => soundEngine.playOrbPickup()).not.toThrow();
    expect(() => soundEngine.playButtonClick()).not.toThrow();
    expect(() => soundEngine.playChestOpen()).not.toThrow();
    expect(() => soundEngine.playPortalEnter()).not.toThrow();
    expect(() => soundEngine.playPlayerHurt()).not.toThrow();
    expect(() => soundEngine.playEquipLoot()).not.toThrow();
    expect(() => soundEngine.playHowl()).not.toThrow();
    expect(() => soundEngine.playGoreExplosion()).not.toThrow();
    expect(() => soundEngine.playBossRoar()).not.toThrow();
    expect(() => soundEngine.playBoneShield()).not.toThrow();
    expect(() => soundEngine.playSyphonSoul()).not.toThrow();
    expect(() => soundEngine.playSwing()).not.toThrow();
    expect(() => soundEngine.playTelegraph()).not.toThrow();
    expect(() => soundEngine.playScytheSlash()).not.toThrow();
    expect(() => soundEngine.playRitualCircle()).not.toThrow();
    expect(() => soundEngine.playHemomancyBeam()).not.toThrow();
    expect(() => soundEngine.playContractComplete()).not.toThrow();
    expect(() => soundEngine.playExecutionGore()).not.toThrow();
    expect(() => soundEngine.playDash()).not.toThrow();
  });

  it('handles volume changes and mute toggles safely', () => {
    soundEngine.setVolumes(0.5, 0.5);

    const isMuted = soundEngine.toggleMute();
    expect(isMuted).toBe(true);

    // When muted, triggers should return early without creating new oscillators
    mockAudioContext.createOscillator.mockClear();
    soundEngine.playBloodBolt();
    expect(mockAudioContext.createOscillator).not.toHaveBeenCalled();

    // Toggle mute back off
    const isUnmuted = soundEngine.toggleMute();
    expect(isUnmuted).toBe(false);
  });

  it('starts and stops ambient gothic BGM without throwing exceptions', () => {
    expect(() => soundEngine.startGothicAmbientBGM()).not.toThrow();

    // Advance timer to trigger arpeggiator / biomatic ambient synthesis interval
    vi.advanceTimersByTime(1000);

    expect(() => soundEngine.stopBGM()).not.toThrow();
  });

  it('updates environmental audio and threat states smoothly', () => {
    soundEngine.startGothicAmbientBGM();

    expect(() => soundEngine.updateEnvironmentAudio(true, 0.8)).not.toThrow();
    expect(() => soundEngine.updateSpatialThreat(0.5, -0.2, true)).not.toThrow();
    expect(() => soundEngine.updateTinnitusState(0.15, true)).not.toThrow();

    soundEngine.stopBGM();
  });
});
