/**
 * 16-Bit Web Audio API Procedural BGM Synthesizer for Blood Mage 1995.
 * 
 * Generates dynamic, zero-overhead authentic 1995 FM-synth soundtrack
 * in the style of Sound Blaster 16, Yamaha OPL3, Castlevania SOTN, Diablo 1, and DOOM Plutonia.
 * 
 * Features:
 * - Deterministic lookahead step sequencer (zero audio drift, zero memory leaks).
 * - Multi-theme support: Catacombs (Gothic Cravo/Bass), Sanctuary (Ritual Drone), Boss Frenzy (Fast FM Doom Riff).
 * - Real-time audio muffle filter (low-pass smoothing when inventory or modal menus are open).
 * - Panic / Low-HP mode (increased tempo and intense heartbeat pulse below 25% HP).
 */

import { logger } from './logger';

export type BGMThemeName = 'catacombs' | 'sanctuary' | 'boss_plutonia';

interface BGMThemeConfig {
  name: string;
  bpm: number;
  stepSubdivision: number; // 4 = 16th notes
  bassWave: OscillatorType;
  leadWave: OscillatorType;
  filterBase: number;
  filterPeak: number;
  filterQ: number;
  bassSequence: (number | null)[];
  arpSequence: (number | null)[];
  kickSteps: number[];
  snareSteps: number[];
  bellSteps: number[];
  bellNote?: number;
}

// Frequency table for pitch notes (in Hz)
export const NOTES = {
  // Octave 1
  C1: 32.70, Cs1: 34.65, D1: 36.71, Ds1: 38.89, E1: 41.20, F1: 43.65, Fs1: 46.25, G1: 49.00, Gs1: 51.91, A1: 55.00, As1: 58.27, B1: 61.74,
  // Octave 2
  C2: 65.41, Cs2: 69.30, D2: 73.42, Ds2: 77.78, E2: 82.41, F2: 87.31, Fs2: 92.50, G2: 98.00, Gs2: 103.83, A2: 110.00, As2: 116.54, B2: 123.47,
  // Octave 3
  C3: 130.81, Cs3: 138.59, D3: 146.83, Ds3: 155.56, E3: 164.81, F3: 174.61, Fs3: 185.00, G3: 196.00, Gs3: 207.65, A3: 220.00, As3: 233.08, B3: 246.94,
  // Octave 4
  C4: 261.63, Cs4: 277.18, D4: 293.66, Ds4: 311.13, E4: 329.63, F4: 349.23, Fs4: 369.99, G4: 392.00, Gs4: 415.30, A4: 440.00, As4: 466.16, B4: 493.88,
  // Octave 5
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00,
};

// 1. Theme: Catacumbas dos Mártires (Gothic Cravo, Sub Bass, Cathedral Bell)
const CATACOMBS_THEME: BGMThemeConfig = {
  name: 'Catacumbas dos Mártires',
  bpm: 92,
  stepSubdivision: 4, // 16th notes
  bassWave: 'sawtooth',
  leadWave: 'square',
  filterBase: 180,
  filterPeak: 650,
  filterQ: 2.5,
  bassSequence: [
    NOTES.A1, null, NOTES.A1, null,
    NOTES.F2, null, NOTES.F2, null,
    NOTES.Gs2, null, NOTES.Gs2, null,
    NOTES.E2, null, NOTES.E2, null,
    NOTES.A1, null, NOTES.A1, null,
    NOTES.D2, null, NOTES.D2, null,
    NOTES.F2, null, NOTES.E2, null,
    NOTES.Gs2, null, NOTES.E2, null,
  ],
  arpSequence: [
    NOTES.A3, NOTES.C4, NOTES.E4, NOTES.Gs4,
    NOTES.A4, NOTES.Gs4, NOTES.E4, NOTES.C4,
    NOTES.F3, NOTES.A3, NOTES.C4, NOTES.F4,
    NOTES.E3, NOTES.Gs3, NOTES.B3, NOTES.E4,
    NOTES.A3, NOTES.C4, NOTES.E4, NOTES.A4,
    NOTES.D3, NOTES.F3, NOTES.A3, NOTES.D4,
    NOTES.F3, NOTES.A3, NOTES.C4, NOTES.E4,
    NOTES.E3, NOTES.Gs3, NOTES.B3, NOTES.Gs4,
  ],
  kickSteps: [0, 8, 16, 24],
  snareSteps: [4, 12, 20, 28],
  bellSteps: [0, 32],
  bellNote: NOTES.A2,
};

// 2. Theme: Santuário de Sangue (Ancient Ritual Chant, Ominous Bell, Resonant Pads)
const SANCTUARY_THEME: BGMThemeConfig = {
  name: 'Santuário de Sangue',
  bpm: 84,
  stepSubdivision: 4,
  bassWave: 'triangle',
  leadWave: 'sawtooth',
  filterBase: 220,
  filterPeak: 800,
  filterQ: 4.0,
  bassSequence: [
    NOTES.C2, null, NOTES.C2, null,
    NOTES.Gs1, null, NOTES.Gs1, null,
    NOTES.As1, null, NOTES.As1, null,
    NOTES.G1, null, NOTES.G1, null,
    NOTES.C2, null, NOTES.Ds2, null,
    NOTES.F2, null, NOTES.Ds2, null,
    NOTES.D2, null, NOTES.G1, null,
    NOTES.C2, null, NOTES.C2, null,
  ],
  arpSequence: [
    NOTES.C4, NOTES.Ds4, NOTES.G4, NOTES.C5,
    NOTES.Gs3, NOTES.C4, NOTES.Ds4, NOTES.Gs4,
    NOTES.As3, NOTES.D4, NOTES.F4, NOTES.As4,
    NOTES.G3, NOTES.B3, NOTES.D4, NOTES.G4,
    NOTES.C4, NOTES.Ds4, NOTES.G4, NOTES.Ds4,
    NOTES.F3, NOTES.Gs3, NOTES.C4, NOTES.F4,
    NOTES.D3, NOTES.F3, NOTES.G3, NOTES.D4,
    NOTES.C4, NOTES.G3, NOTES.Ds3, NOTES.C3,
  ],
  kickSteps: [0, 16],
  snareSteps: [8, 24],
  bellSteps: [0, 16, 32, 48],
  bellNote: NOTES.C3,
};

// 3. Theme: Fúria do Chefe / Plutonia 1995 (Heavy FM Riff, Industrial Noise, Double Kick)
const BOSS_PLUTONIA_THEME: BGMThemeConfig = {
  name: 'Fúria de Sangue (Boss Theme)',
  bpm: 130,
  stepSubdivision: 4,
  bassWave: 'sawtooth',
  leadWave: 'sawtooth',
  filterBase: 400,
  filterPeak: 1400,
  filterQ: 5.5,
  bassSequence: [
    NOTES.E1, NOTES.E1, NOTES.As1, NOTES.E1,
    NOTES.A1, NOTES.E1, NOTES.G1, null,
    NOTES.E1, NOTES.E1, NOTES.B1, NOTES.As1,
    NOTES.E1, null, NOTES.E1, null,
    NOTES.E1, NOTES.E1, NOTES.As1, NOTES.E1,
    NOTES.D2, NOTES.E1, NOTES.B1, null,
    NOTES.C2, NOTES.B1, NOTES.As1, NOTES.G1,
    NOTES.E1, NOTES.G1, NOTES.As1, NOTES.B1,
  ],
  arpSequence: [
    NOTES.E3, NOTES.E3, NOTES.As3, NOTES.E3,
    NOTES.A3, NOTES.E3, NOTES.G3, NOTES.E3,
    NOTES.E4, NOTES.D4, NOTES.B3, NOTES.As3,
    NOTES.G3, NOTES.E3, NOTES.G3, NOTES.As3,
    NOTES.E3, NOTES.E3, NOTES.As3, NOTES.E3,
    NOTES.D4, NOTES.E3, NOTES.B3, NOTES.E3,
    NOTES.C4, NOTES.B3, NOTES.As3, NOTES.G3,
    NOTES.E3, NOTES.G3, NOTES.As3, NOTES.D4,
  ],
  kickSteps: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30],
  snareSteps: [4, 12, 20, 28],
  bellSteps: [0],
  bellNote: NOTES.E2,
};

const THEMES: Record<BGMThemeName, BGMThemeConfig> = {
  catacombs: CATACOMBS_THEME,
  sanctuary: SANCTUARY_THEME,
  boss_plutonia: BOSS_PLUTONIA_THEME,
};

export class BGMSynthesizer {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private muffleFilter: BiquadFilterNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  private currentTheme: BGMThemeConfig = CATACOMBS_THEME;
  private currentThemeName: BGMThemeName = 'catacombs';

  private isRunning: boolean = false;
  private isMuted: boolean = false;
  private isMuffled: boolean = false;
  private isLowHp: boolean = false;
  private volume: number = 0.5;

  private currentStep: number = 0;
  private nextNoteTime: number = 0;
  private timerId: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    // AudioContext will be initialized upon user gesture
  }

  public init(existingCtx?: AudioContext | null) {
    if (existingCtx) {
      this.ctx = existingCtx;
    } else if (!this.ctx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }

    if (!this.ctx) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    if (!this.masterGain) {
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume * 0.22, this.ctx.currentTime);

      // Lowpass muffle filter for inventory / pause screens
      this.muffleFilter = this.ctx.createBiquadFilter();
      this.muffleFilter.type = 'lowpass';
      this.muffleFilter.frequency.setValueAtTime(this.isMuffled ? 750 : 20000, this.ctx.currentTime);
      this.muffleFilter.Q.setValueAtTime(1.0, this.ctx.currentTime);

      this.muffleFilter.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
    }

    // Pre-generate 1 second of white noise for industrial drums & snares
    if (!this.noiseBuffer && this.ctx) {
      const bufferSize = this.ctx.sampleRate;
      this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
    }
  }

  public start(themeName: BGMThemeName = 'catacombs') {
    this.init();
    if (!this.ctx) return;

    this.setTheme(themeName);

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    if (!this.isRunning) {
      this.isRunning = true;
      this.currentStep = 0;
      this.nextNoteTime = this.ctx.currentTime + 0.05;
      this.scheduler();
      logger.info('AUDIO', `BGM Synthesizer started theme: [${this.currentTheme.name}]`);
    }
  }

  public stop() {
    if (this.isRunning) {
      this.isRunning = false;
      if (this.timerId) {
        clearTimeout(this.timerId);
        this.timerId = null;
      }
      logger.info('AUDIO', 'BGM Synthesizer stopped');
    }
  }

  public setTheme(themeName: BGMThemeName) {
    if (THEMES[themeName]) {
      this.currentThemeName = themeName;
      this.currentTheme = THEMES[themeName];
    }
  }

  public getTheme(): BGMThemeName {
    return this.currentThemeName;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      const targetGain = this.isMuted ? 0 : this.volume * 0.22;
      this.masterGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);
    }
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      const targetGain = this.isMuted ? 0 : this.volume * 0.22;
      this.masterGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);
    }
  }

  public setMuffled(muffled: boolean) {
    if (this.isMuffled === muffled) return;
    this.isMuffled = muffled;
    if (this.muffleFilter && this.ctx) {
      const targetFreq = muffled ? 700 : 20000;
      this.muffleFilter.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.15);
    }
  }

  public setLowHp(lowHp: boolean) {
    this.isLowHp = lowHp;
  }

  public isActive(): boolean {
    return this.isRunning;
  }

  // ==========================================
  // SCHEDULING ENGINE (Lookahead Clock)
  // ==========================================
  private scheduler() {
    if (!this.ctx || !this.isRunning) return;

    // Lookahead: Schedule notes slightly ahead of currentTime (120ms window)
    while (this.nextNoteTime < this.ctx.currentTime + 0.12) {
      this.scheduleStep(this.currentStep, this.nextNoteTime);
      this.advanceStep();
    }

    this.timerId = setTimeout(() => this.scheduler(), 25);
  }

  private advanceStep() {
    const effectiveBpm = this.isLowHp ? this.currentTheme.bpm * 1.12 : this.currentTheme.bpm;
    const stepDuration = (60 / effectiveBpm) / this.currentTheme.stepSubdivision;
    this.nextNoteTime += stepDuration;
    this.currentStep++;
  }

  private scheduleStep(step: number, time: number) {
    if (!this.ctx || !this.muffleFilter) return;

    const theme = this.currentTheme;

    // 1. Arpeggio / Lead Melody (Plays every step)
    const arpFreq = theme.arpSequence[step % theme.arpSequence.length];
    if (arpFreq) {
      this.playArp(arpFreq, time, theme.leadWave);
    }

    // 2. Heavy FM Bassline (Plays every 2 steps or on specific step)
    const bassFreq = theme.bassSequence[step % theme.bassSequence.length];
    if (bassFreq) {
      this.playBass(bassFreq, time, theme);
    }

    // 3. Kick Drums
    const kickStepIndex = step % 32;
    if (theme.kickSteps.includes(kickStepIndex)) {
      this.playKick(time);
    }

    // 4. Industrial Snare / White Noise Burst
    if (theme.snareSteps.includes(kickStepIndex)) {
      this.playSnare(time);
    }

    // 5. Cathedral / Gothic Bell
    if (theme.bellSteps.includes(kickStepIndex) && theme.bellNote) {
      this.playGothicBell(theme.bellNote, time);
    }

    // 6. Low HP Heartbeat Tension Sound
    if (this.isLowHp && step % 8 === 0) {
      this.playHeartbeat(time);
    }
  }

  // ==========================================
  // INSTRUMENT VOICE GENERATORS
  // ==========================================

  /**
   * 1. Gothic Harpsichord / Retro Lead (Square or Triangle with crisp envelope)
   */
  private playArp(freq: number, time: number, wave: OscillatorType) {
    if (!this.ctx || !this.muffleFilter) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = wave;
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0.18, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.16);

    osc.connect(gain);
    gain.connect(this.muffleFilter);

    osc.start(time);
    osc.stop(time + 0.17);
  }

  /**
   * 2. FM Synth Bassline (Sawtooth with dynamic lowpass sweep)
   */
  private playBass(freq: number, time: number, theme: BGMThemeConfig) {
    if (!this.ctx || !this.muffleFilter) return;

    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = theme.bassWave;
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(theme.filterBase, time);
    filter.frequency.exponentialRampToValueAtTime(theme.filterPeak, time + 0.04);
    filter.frequency.exponentialRampToValueAtTime(theme.filterBase, time + 0.35);
    filter.Q.setValueAtTime(theme.filterQ, time);

    gain.gain.setValueAtTime(0.45, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.muffleFilter);

    osc.start(time);
    osc.stop(time + 0.36);
  }

  /**
   * 3. Deep Dungeon Kick (Sine wave pitch drop from 140Hz to 32Hz)
   */
  private playKick(time: number) {
    if (!this.ctx || !this.muffleFilter) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(32, time + 0.25);

    gain.gain.setValueAtTime(0.65, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);

    osc.connect(gain);
    gain.connect(this.muffleFilter);

    osc.start(time);
    osc.stop(time + 0.26);
  }

  /**
   * 4. Industrial Snare (High-pass filtered white noise burst)
   */
  private playSnare(time: number) {
    if (!this.ctx || !this.muffleFilter || !this.noiseBuffer) return;

    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1200, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.25, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.muffleFilter);

    source.start(time);
    source.stop(time + 0.13);
  }

  /**
   * 5. Gothic Cathedral Bell (Harmonic dual sine with long metallic resonance)
   */
  private playGothicBell(freq: number, time: number) {
    if (!this.ctx || !this.muffleFilter) return;

    // Fundamental note
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, time);

    gain1.gain.setValueAtTime(0.22, time);
    gain1.gain.exponentialRampToValueAtTime(0.0001, time + 2.8);

    osc1.connect(gain1);
    gain1.connect(this.muffleFilter);

    osc1.start(time);
    osc1.stop(time + 2.85);

    // Overtone harmonic (5th / minor 10th interval for dark church bell color)
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2.76, time);

    gain2.gain.setValueAtTime(0.08, time);
    gain2.gain.exponentialRampToValueAtTime(0.0001, time + 1.6);

    osc2.connect(gain2);
    gain2.connect(this.muffleFilter);

    osc2.start(time);
    osc2.stop(time + 1.65);
  }

  /**
   * 6. Low-HP Heartbeat Pulse (Low muffled double-thump)
   */
  private playHeartbeat(time: number) {
    if (!this.ctx || !this.muffleFilter) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(65, time);
    osc.frequency.exponentialRampToValueAtTime(35, time + 0.12);

    gain.gain.setValueAtTime(0.35, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

    osc.connect(gain);
    gain.connect(this.muffleFilter);

    osc.start(time);
    osc.stop(time + 0.13);
  }
}

export const bgmSynthesizer = new BGMSynthesizer();
