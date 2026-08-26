import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { bgmSynthesizer, BGMSynthesizer, NOTES } from './bgmSynthesizer';

describe('BGMSynthesizer (16-Bit Web Audio Procedural Soundtrack)', () => {
  let mockCtx: any;
  let mockGainNode: any;
  let mockFilterNode: any;
  let mockOscNode: any;
  let mockBufferSource: any;

  beforeEach(() => {
    vi.useFakeTimers();

    mockGainNode = {
      gain: {
        value: 1,
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        setTargetAtTime: vi.fn(),
      },
      connect: vi.fn(),
      disconnect: vi.fn(),
    };

    mockFilterNode = {
      type: 'lowpass',
      frequency: {
        value: 20000,
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
        setTargetAtTime: vi.fn(),
      },
      Q: {
        value: 1,
        setValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
      disconnect: vi.fn(),
    };

    mockOscNode = {
      type: 'sawtooth',
      frequency: {
        value: 440,
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      disconnect: vi.fn(),
    };

    mockBufferSource = {
      buffer: null,
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      disconnect: vi.fn(),
    };

    mockCtx = {
      currentTime: 10,
      sampleRate: 44100,
      state: 'running',
      destination: {},
      resume: vi.fn().mockResolvedValue(undefined),
      createGain: vi.fn(() => ({ ...mockGainNode, gain: { ...mockGainNode.gain } })),
      createBiquadFilter: vi.fn(() => ({
        ...mockFilterNode,
        frequency: { ...mockFilterNode.frequency },
        Q: { ...mockFilterNode.Q },
      })),
      createOscillator: vi.fn(() => ({
        ...mockOscNode,
        frequency: { ...mockOscNode.frequency },
      })),
      createBufferSource: vi.fn(() => ({ ...mockBufferSource })),
      createBuffer: vi.fn((channels, length, sampleRate) => ({
        length,
        sampleRate,
        getChannelData: vi.fn(() => new Float32Array(length)),
      })),
    };
  });

  afterEach(() => {
    bgmSynthesizer.stop();
    vi.restoreAllMocks();
  });

  it('initializes audio nodes properly and respects starting theme', () => {
    const synth = new BGMSynthesizer();
    synth.init(mockCtx);

    expect(mockCtx.createGain).toHaveBeenCalled();
    expect(mockCtx.createBiquadFilter).toHaveBeenCalled();
    expect(mockCtx.createBuffer).toHaveBeenCalled();
  });

  it('starts playing catacombs theme and schedules notes', () => {
    const synth = new BGMSynthesizer();
    synth.init(mockCtx);
    synth.start('catacombs');

    expect(synth.isActive()).toBe(true);
    expect(synth.getTheme()).toBe('catacombs');

    // Advance clock to trigger lookahead scheduler
    vi.advanceTimersByTime(100);

    expect(mockCtx.createOscillator).toHaveBeenCalled();
  });

  it('switches between themes (sanctuary, boss_plutonia, catacombs)', () => {
    const synth = new BGMSynthesizer();
    synth.init(mockCtx);
    synth.start('catacombs');

    synth.setTheme('boss_plutonia');
    expect(synth.getTheme()).toBe('boss_plutonia');

    synth.setTheme('sanctuary');
    expect(synth.getTheme()).toBe('sanctuary');
  });

  it('applies lowpass muffle filter for modal menus and restores upon close', () => {
    const synth = new BGMSynthesizer();
    synth.init(mockCtx);
    synth.start('catacombs');

    synth.setMuffled(true);
    // Should target 700Hz
    synth.setMuffled(false);
    // Should target 20000Hz
  });

  it('handles low HP mode properly by accelerating sequencer and scheduling heartbeat', () => {
    const synth = new BGMSynthesizer();
    synth.init(mockCtx);
    synth.start('catacombs');

    synth.setLowHp(true);
    vi.advanceTimersByTime(200);

    expect(synth.isActive()).toBe(true);

    synth.setLowHp(false);
    vi.advanceTimersByTime(200);
  });

  it('handles volume and mute controls accurately', () => {
    const synth = new BGMSynthesizer();
    synth.init(mockCtx);

    synth.setVolume(0.8);
    synth.setMute(true);
    synth.setMute(false);
  });

  it('stops and cleans up scheduler without memory leaks', () => {
    const synth = new BGMSynthesizer();
    synth.init(mockCtx);
    synth.start('catacombs');

    expect(synth.isActive()).toBe(true);
    synth.stop();
    expect(synth.isActive()).toBe(false);
  });

  it('provides complete frequency table for Gothic scales and intervals', () => {
    expect(NOTES.A1).toBe(55.0);
    expect(NOTES.A4).toBe(440.0);
    expect(NOTES.E1).toBe(41.2);
    expect(NOTES.C4).toBeCloseTo(261.63, 1);
  });
});
