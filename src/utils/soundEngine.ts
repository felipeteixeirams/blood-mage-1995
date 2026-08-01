/**
 * 16-Bit Web Audio API Sound Synthesizer and Dynamic Gothic Orchestral Sequencer for Bloodmage 1995.
 * Generates dark gothic retro sound effects and a dynamic BGM that changes with enemy density.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private sfxVolume: number = 0.8;
  private bgmVolume: number = 0.5;
  private isMuted: boolean = false;
  private isBgmPlaying: boolean = false;

  // BGM Sequencer States
  private schedulerIntervalId: any = null;
  private nextNoteTime: number = 0;
  private currentStep: number = 0;
  private bpm: number = 70;
  private enemyCount: number = 0;

  constructor() {
    // Lazy init audio context on first user interaction
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolumes(sfx: number, bgm: number) {
    this.sfxVolume = sfx;
    this.bgmVolume = bgm;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  // SFX: Fire Blood Bolt
  public playBloodBolt() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.12);

    gain.gain.setValueAtTime(this.sfxVolume * 0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  // SFX: Nova Blast
  public playNova() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.35;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(80, now + 0.35);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(this.sfxVolume * 0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(now);
  }

  // SFX: Squishing flesh/blood
  public playBloodSquish() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(150 + Math.random() * 80, now);
    osc.frequency.linearRampToValueAtTime(60, now + 0.1);

    gain.gain.setValueAtTime(this.sfxVolume * 0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  // SFX: Roaring enemy
  public playDemonRoar() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.linearRampToValueAtTime(140, now + 0.2);
    osc.frequency.linearRampToValueAtTime(40, now + 0.5);

    gain.gain.setValueAtTime(this.sfxVolume * 0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.5);
  }

  // SFX: Level Up Fanfare
  public playLevelUp() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25]; // C E G C E

    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(this.sfxVolume * 0.35, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.08 + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.25);
    });
  }

  // SFX: Pickup collectible
  public playOrbPickup() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.08);

    gain.gain.setValueAtTime(this.sfxVolume * 0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  // SFX: Button Click
  public playButtonClick() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.04);

    gain.gain.setValueAtTime(this.sfxVolume * 0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.04);
  }

  // DYNAMIC BGM ENGINE: SET ENEMY DENSITY
  public setEnemyCount(count: number) {
    this.enemyCount = count;
    // Ambient Mode (BPM 72, light gothic) or Battle Mode (BPM 120, heavy orchestral)
    const targetBpm = count >= 5 ? 120 : 72;
    if (this.bpm !== targetBpm) {
      this.bpm = targetBpm;
    }
  }

  // DYNAMIC GOTHIC ORCHESTRAL BGM ENGINE START
  public startGothicAmbientBGM() {
    if (this.isBgmPlaying) return;
    this.initCtx();
    if (!this.ctx) return;

    this.isBgmPlaying = true;
    this.currentStep = 0;
    this.nextNoteTime = this.ctx.currentTime;
    this.bpm = 72;
    this.enemyCount = 0;

    // Start look-ahead sequencer clock (ticks every 25ms)
    this.schedulerIntervalId = setInterval(() => {
      this.runScheduler();
    }, 25);
  }

  public stopBGM() {
    if (this.schedulerIntervalId) {
      clearInterval(this.schedulerIntervalId);
      this.schedulerIntervalId = null;
    }
    this.isBgmPlaying = false;
  }

  // Sequencer lookahead scheduling
  private runScheduler() {
    if (!this.ctx || this.isMuted || this.bgmVolume <= 0) return;

    // Schedule notes 100ms in advance
    while (this.nextNoteTime < this.ctx.currentTime + 0.1) {
      this.scheduleNextStep(this.nextNoteTime);

      // Advance step clock based on BPM (each step is an 8th note)
      const stepDuration = 60.0 / this.bpm / 2.0;
      this.nextNoteTime += stepDuration;
    }
  }

  // Schedule notes for a single 8th note step
  private scheduleNextStep(stepTime: number) {
    if (!this.ctx) return;

    const step = this.currentStep % 16;
    const measure = Math.floor(this.currentStep / 16);
    const chordIndex = measure % 4;
    const isCombat = this.enemyCount >= 5;

    // Gothic Chord Progression in D Minor / G Minor / Bb Major / A Major
    const chords = [
      [146.83, 174.61, 220.00, 293.66], // D minor (D3, F3, A3, D4)
      [130.81, 164.81, 196.00, 261.63], // C Major (C3, E3, G3, C4)
      [98.00, 116.54, 146.83, 196.00],  // G minor (G2, Bb2, D3, G3)
      [110.00, 138.59, 164.81, 220.00]   // A Major (A2, C#3, E3, A3)
    ];

    const currentChord = chords[chordIndex];

    // 1. ORGAN CHORD PADS
    if (isCombat) {
      // Galloping, pulsating arpeggiated gothic organ staccatos in combat
      if (step % 2 === 0) {
        const noteIdx = (step / 2) % currentChord.length;
        this.playOrganStaccato(currentChord[noteIdx], stepTime, this.bgmVolume * 0.14);
      }
    } else {
      // Long atmospheric organ choir pad at start of chord phases
      if (step === 0 || step === 8) {
        currentChord.forEach((freq, idx) => {
          this.playOrganPad(freq, stepTime, 2.2, this.bgmVolume * 0.07 - (idx * 0.005));
        });
      }
    }

    // 2. BASS DRONE (Low pitch support)
    if (step === 0 || step === 8) {
      const bassFreq = currentChord[0] / 2; // Bass octave
      this.playBassDrone(bassFreq, stepTime, isCombat ? 0.9 : 2.2, this.bgmVolume * 0.22);
    }

    // 3. WAR DRUMS & CYMBALS (Combat Mode ONLY)
    if (isCombat) {
      // Orchestral kick drum beats
      if (step === 0 || step === 4 || step === 8 || step === 12 || step === 14) {
        this.playWarKick(stepTime, this.bgmVolume * 0.35);
      }
      // Gothic snare rattle (filtered noise sweeps) on beats 4 & 12
      if (step === 4 || step === 12) {
        this.playWarSnare(stepTime, this.bgmVolume * 0.18);
      }
      // Frantic hi-hat tension (tick-tick-tick)
      if (step % 2 === 1) {
        this.playTensionHat(stepTime, this.bgmVolume * 0.08);
      }
    }

    // 4. GOTHIC MELODIC LEAD (Choir / Harsh Synthesized Strings)
    if (isCombat) {
      // Frantic, fast epic gothic theme (e.g., Dies Irae variation) in combat
      if (step % 2 === 0) {
        const melodyPattern = [0, 1, 2, 1, 2, 3, 2, 1, 3, 2, 1, 0, 1, 2, 1, 0];
        const offset = melodyPattern[step];
        const freq = currentChord[offset % currentChord.length] * 2.0; // Shipped 1 octave higher
        this.playStringLead(freq, stepTime, 0.18, this.bgmVolume * 0.12);
      }
    } else {
      // Sparse mournful cathedral bell / slow solo strings
      if (step === 2 || step === 6 || step === 10 || step === 14) {
        const ambientPattern = [1, 2, 0, 3];
        const noteIdx = ambientPattern[(step / 2 - 1) % ambientPattern.length];
        const freq = currentChord[noteIdx] * 2.0;
        this.playAmbientMelody(freq, stepTime, 0.95, this.bgmVolume * 0.08);
      }
    }

    this.currentStep++;
  }

  // --- AUDIO SYNTHESIS UTILITIES ---

  // Organ/Choir Slow Pad
  private playOrganPad(freq: number, startTime: number, duration: number, volume: number) {
    if (!this.ctx) return;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, startTime);
    // Slight detune for chorus cathedral effect
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(freq * 1.005, startTime);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(260, startTime);
    filter.frequency.exponentialRampToValueAtTime(180, startTime + duration);

    // Fade in/out envelope
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.4); // slow attack
    gain.gain.setValueAtTime(volume, startTime + duration - 0.4);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(startTime);
    osc2.start(startTime);
    osc1.stop(startTime + duration);
    osc2.stop(startTime + duration);
  }

  // Organ Staccato (Combat arpeggiator)
  private playOrganStaccato(freq: number, startTime: number, volume: number) {
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, startTime);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, startTime);

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.18);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + 0.18);
  }

  // Heavy Bass Drone
  private playBassDrone(freq: number, startTime: number, duration: number, volume: number) {
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, startTime);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(110, startTime);

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.2);
    gain.gain.setValueAtTime(volume, startTime + duration - 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  // Heavy Kick Drum (Low Sine Sweep)
  private playWarKick(startTime: number, volume: number) {
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    // Deep bass pitch drop
    osc.frequency.setValueAtTime(130, startTime);
    osc.frequency.exponentialRampToValueAtTime(35, startTime + 0.14);

    gain.gain.setValueAtTime(volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.14);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + 0.14);
  }

  // Snare Rattle (White Noise snare)
  private playWarSnare(startTime: number, volume: number) {
    if (!this.ctx) return;

    // Create noise buffer
    const bufferSize = this.ctx.sampleRate * 0.15;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(950, startTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.15);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(startTime);
  }

  // Tension Hi-Hat
  private playTensionHat(startTime: number, volume: number) {
    if (!this.ctx) return;

    const bufferSize = this.ctx.sampleRate * 0.03;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(7500, startTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.03);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(startTime);
  }

  // Gothic String Lead (Combat melody)
  private playStringLead(freq: number, startTime: number, duration: number, volume: number) {
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, startTime);

    // Add vibrato LFO (mournful crying strings effect)
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.setValueAtTime(6.5, startTime); // 6.5Hz vibrato
    lfoGain.gain.setValueAtTime(5.5, startTime); // pitch wobble range

    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(950, startTime);

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    lfo.start(startTime);
    osc.start(startTime);

    lfo.stop(startTime + duration);
    osc.stop(startTime + duration);
  }

  // Slow ambient cathedral melody notes
  private playAmbientMelody(freq: number, startTime: number, duration: number, volume: number) {
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.08); // soft strike
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration); // bell ring decay

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }
}

export const soundEngine = new SoundEngine();
