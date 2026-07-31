/**
 * 16-Bit Web Audio API Sound Synthesizer & Dynamic Sequencer for Bloodmage 1995.
 * Generates dark gothic retro sound effects dynamically and plays a fully-featured,
 * dynamic, reactive look-ahead sequencer-based BGM that speeds up during combat.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private sfxVolume: number = 0.8;
  private bgmVolume: number = 0.5;
  private isMuted: boolean = false;
  private bgmGain: GainNode | null = null;
  private isBgmPlaying: boolean = false;

  // Look-ahead sequencer properties
  private schedulerIntervalId: any = null;
  private nextNoteTime: number = 0;
  private currentStep: number = 0;
  private bpm: number = 72;
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
    if (this.bgmGain) {
      this.bgmGain.gain.setValueAtTime(this.isMuted ? 0 : this.bgmVolume * 0.15, this.ctx?.currentTime || 0);
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.bgmGain) {
      this.bgmGain.gain.setValueAtTime(this.isMuted ? 0 : this.bgmVolume * 0.15, this.ctx?.currentTime || 0);
    }
    return this.isMuted;
  }

  public setEnemyCount(count: number) {
    this.enemyCount = count;
    const targetBpm = count >= 5 ? 120 : 72;
    if (this.bpm !== targetBpm) {
      this.bpm = targetBpm;
    }
  }

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

  public playNova() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Noise buffer for explosion
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

  public startGothicAmbientBGM() {
    if (this.isBgmPlaying) return;
    this.initCtx();
    if (!this.ctx) return;

    this.isBgmPlaying = true;
    this.bgmGain = this.ctx.createGain();
    this.bgmGain.gain.setValueAtTime(this.isMuted ? 0 : this.bgmVolume * 0.15, this.ctx.currentTime);
    this.bgmGain.connect(this.ctx.destination);

    this.nextNoteTime = this.ctx.currentTime;
    this.currentStep = 0;
    this.bpm = 72;

    this.schedulerIntervalId = setInterval(() => {
      this.scheduler();
    }, 25);
  }

  private scheduler() {
    if (!this.ctx) return;
    const scheduleAheadTime = 0.1; // seconds
    while (this.nextNoteTime < this.ctx.currentTime + scheduleAheadTime) {
      this.scheduleNote(this.currentStep, this.nextNoteTime);
      this.advanceNote();
    }
  }

  private advanceNote() {
    const secondsPerBeat = 60.0 / this.bpm;
    const secondsPerStep = secondsPerBeat / 2; // Eighth notes
    this.nextNoteTime += secondsPerStep;
    this.currentStep = (this.currentStep + 1) % 64; // 64 step cycle (4 bars of 16 steps)
  }

  private scheduleNote(step: number, time: number) {
    if (!this.ctx || !this.bgmGain) return;

    // Chord Progression: D Minor -> C Major -> G Minor -> A Major
    // Each chord lasts for 16 steps
    const chords = [
      { root: 'Dm', notes: [146.83, 174.61, 220.00, 293.66] }, // D3, F3, A3, D4
      { root: 'C',  notes: [130.81, 164.81, 196.00, 261.63] }, // C3, E3, G3, C4
      { root: 'Gm', notes: [98.00, 116.54, 146.83, 196.00] },  // G2, Bb2, D3, G3
      { root: 'A',  notes: [110.00, 138.59, 164.81, 220.00] }, // A2, C#3, E3, A3
    ];

    const chordIndex = Math.floor(step / 16) % chords.length;
    const currentChord = chords[chordIndex];
    const isCombat = this.bpm === 120;

    // --- Layer 1: Sinos Catedralícios 🔔 (Ambient / Bar start) ---
    if (step % 16 === 0) {
      const bell = this.ctx.createOscillator();
      bell.type = 'sine';
      // High bright resonance bell notes
      bell.frequency.setValueAtTime(currentChord.notes[2] * 2, time);

      const bellGain = this.ctx.createGain();
      bellGain.gain.setValueAtTime(0, time);
      bellGain.gain.linearRampToValueAtTime(this.bgmVolume * 0.12, time + 0.05);
      bellGain.gain.exponentialRampToValueAtTime(0.001, time + 2.5);

      bell.connect(bellGain);
      bellGain.connect(this.bgmGain);
      bell.start(time);
      bell.stop(time + 2.6);
    }

    // --- Layer 2: Drones de Baixo 🔊 (Continuous Root Support) ---
    if (step % 8 === 0) {
      const drone = this.ctx.createOscillator();
      drone.type = 'triangle';
      drone.frequency.setValueAtTime(currentChord.notes[0] / 2, time); // Low sub bass root

      const droneGain = this.ctx.createGain();
      droneGain.gain.setValueAtTime(0, time);
      droneGain.gain.linearRampToValueAtTime(this.bgmVolume * 0.16, time + 0.4);
      droneGain.gain.exponentialRampToValueAtTime(0.001, time + 1.8);

      drone.connect(droneGain);
      droneGain.connect(this.bgmGain);
      drone.start(time);
      drone.stop(time + 1.9);
    }

    // --- Layer 3: Strings Góticas 🎸 (Melancholic Vibrato) ---
    if (step % 4 === 0) {
      const stringOsc = this.ctx.createOscillator();
      stringOsc.type = 'sawtooth';
      stringOsc.frequency.setValueAtTime(currentChord.notes[2], time); // Dominant chord note

      // Melancholic Vibrato LFO at 6.5Hz
      const lfo = this.ctx.createOscillator();
      lfo.frequency.setValueAtTime(6.5, time);
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(4.5, time);

      lfo.connect(lfoGain);
      lfoGain.connect(stringOsc.frequency);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(380, time);

      const stringGain = this.ctx.createGain();
      stringGain.gain.setValueAtTime(0, time);
      stringGain.gain.linearRampToValueAtTime(this.bgmVolume * 0.1, time + 0.15);
      stringGain.gain.exponentialRampToValueAtTime(0.001, time + 1.1);

      stringOsc.connect(filter);
      filter.connect(stringGain);
      stringGain.connect(this.bgmGain);

      lfo.start(time);
      stringOsc.start(time);
      lfo.stop(time + 1.2);
      stringOsc.stop(time + 1.2);
    }

    // --- Layer 4: Órgão Gótico 🎹 ---
    if (isCombat) {
      // High-speed energetic combat arpeggio
      const noteIndex = step % currentChord.notes.length;
      const arpeggioFreq = currentChord.notes[noteIndex] * 2;

      const organ = this.ctx.createOscillator();
      organ.type = 'sawtooth';
      organ.frequency.setValueAtTime(arpeggioFreq, time);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(950, time);

      const organGain = this.ctx.createGain();
      organGain.gain.setValueAtTime(this.bgmVolume * 0.09, time);
      organGain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);

      organ.connect(filter);
      filter.connect(organGain);
      organGain.connect(this.bgmGain);

      organ.start(time);
      organ.stop(time + 0.22);
    } else {
      // Soft background chord pad for ambient mode
      if (step % 4 === 0) {
        currentChord.notes.forEach((freq) => {
          if (!this.ctx || !this.bgmGain) return;
          const osc = this.ctx.createOscillator();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, time);

          const gain = this.ctx.createGain();
          gain.gain.setValueAtTime(0, time);
          gain.gain.linearRampToValueAtTime(this.bgmVolume * 0.04, time + 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, time + 0.95);

          osc.connect(gain);
          gain.connect(this.bgmGain);
          osc.start(time);
          osc.stop(time + 0.95);
        });
      }
    }

    // --- Layer 5: Tambores de Guerra 🥁 (Combat Only, 120 BPM) ---
    if (isCombat) {
      // 5a. Kick Drum on step 0, 4, 8, 12 of a 16 bar loop
      if (step % 4 === 0) {
        const kick = this.ctx.createOscillator();
        kick.type = 'sine';
        kick.frequency.setValueAtTime(150, time);
        kick.frequency.exponentialRampToValueAtTime(0.01, time + 0.15);

        const kickGain = this.ctx.createGain();
        kickGain.gain.setValueAtTime(this.bgmVolume * 0.28, time);
        kickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

        kick.connect(kickGain);
        kickGain.connect(this.bgmGain);
        kick.start(time);
        kick.stop(time + 0.15);
      }

      // 5b. Snare Drum on steps 4, 12
      if (step % 8 === 4) {
        const snareBufferSize = this.ctx.sampleRate * 0.12;
        const snareBuffer = this.ctx.createBuffer(1, snareBufferSize, this.ctx.sampleRate);
        const snareData = snareBuffer.getChannelData(0);
        for (let i = 0; i < snareBufferSize; i++) {
          snareData[i] = Math.random() * 2 - 1;
        }

        const snareSource = this.ctx.createBufferSource();
        snareSource.buffer = snareBuffer;

        const snareGain = this.ctx.createGain();
        snareGain.gain.setValueAtTime(this.bgmVolume * 0.16, time);
        snareGain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

        snareSource.connect(snareGain);
        snareGain.connect(this.bgmGain);
        snareSource.start(time);
      }

      // 5c. Hi-Hats on odd offbeat steps
      if (step % 2 === 1) {
        const hatBufferSize = this.ctx.sampleRate * 0.04;
        const hatBuffer = this.ctx.createBuffer(1, hatBufferSize, this.ctx.sampleRate);
        const hatData = hatBuffer.getChannelData(0);
        for (let i = 0; i < hatBufferSize; i++) {
          hatData[i] = Math.random() * 2 - 1;
        }

        const hatSource = this.ctx.createBufferSource();
        hatSource.buffer = hatBuffer;

        const hatFilter = this.ctx.createBiquadFilter();
        hatFilter.type = 'highpass';
        hatFilter.frequency.setValueAtTime(7500, time);

        const hatGain = this.ctx.createGain();
        hatGain.gain.setValueAtTime(this.bgmVolume * 0.08, time);
        hatGain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

        hatSource.connect(hatFilter);
        hatFilter.connect(hatGain);
        hatGain.connect(this.bgmGain);
        hatSource.start(time);
      }
    }
  }

  public stopBGM() {
    if (this.schedulerIntervalId) {
      clearInterval(this.schedulerIntervalId);
      this.schedulerIntervalId = null;
    }
    this.isBgmPlaying = false;
  }
}

export const soundEngine = new SoundEngine();
