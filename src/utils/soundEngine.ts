/**
 * 16-Bit Web Audio API Sound Synthesizer for Bloodmage 1995.
 * Generates dark gothic retro sound effects (spell casts, blood squishes, demon roars) dynamically.
 */

import { useGameStore } from '../store/gameStore';
import { logger } from './logger';
import { bgmSynthesizer, BGMThemeName } from './bgmSynthesizer';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private sfxVolume: number = 0.8;
  private bgmVolume: number = 0.5;
  private isMuted: boolean = false;
  private bgmOscillators: OscillatorNode[] = [];
  private bgmGain: GainNode | null = null;
  private isBgmPlaying: boolean = false;
  private bgmIntervalTimer: ReturnType<typeof setInterval> | null = null;
  private activeVoicesCount: number = 0;

  // Spatial static radio fields (Silent Hill-style)
  private threatStaticSource: AudioBufferSourceNode | null = null;
  private threatStaticGain: GainNode | null = null;
  private threatPanner: StereoPannerNode | null = null;

  // Threat Tinnitus Synthesizer (High-frequency sine tone + low-pass dampening)
  private tinnitusOsc: OscillatorNode | null = null;
  private tinnitusModOsc: OscillatorNode | null = null;
  private tinnitusGain: GainNode | null = null;
  private masterLowPassFilter: BiquadFilterNode | null = null;
  private isTinnitusActive: boolean = false;

  // Tension Drone (docs/specs/11_VISUAL_POLISH_FRONTS.md, Frente 6 — 27/08):
  // drone contínuo de sub-grave cuja intensidade/frequência reagem à "tensão
  // do ambiente" (nº de inimigos hostis próximos + HP baixo), distinto do
  // Tinnitus (agudo, só dispara perto da morte/elite) — os dois podem tocar
  // juntos.
  private tensionDroneOsc: OscillatorNode | null = null;
  private tensionDroneLFO: OscillatorNode | null = null;
  private tensionDroneLFOGain: GainNode | null = null;
  private tensionDroneFilter: BiquadFilterNode | null = null;
  private tensionDroneGain: GainNode | null = null;

  constructor() {
    // Lazy init audio context on first user interaction
  }

  public getActiveVoices(): number {
    return this.activeVoicesCount;
  }

  private incrementVoices() {
    this.activeVoicesCount++;
  }

  private decrementVoices() {
    this.activeVoicesCount = Math.max(0, this.activeVoicesCount - 1);
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    if (this.ctx) {
      bgmSynthesizer.init(this.ctx);
    }
  }

  public setVolumes(sfx: number, bgm: number) {
    this.sfxVolume = sfx;
    this.bgmVolume = bgm;
    bgmSynthesizer.setVolume(bgm);
    if (this.bgmGain) {
      this.bgmGain.gain.setValueAtTime(this.isMuted ? 0 : this.bgmVolume * 0.15, this.ctx?.currentTime || 0);
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    bgmSynthesizer.setMute(this.isMuted);
    if (this.bgmGain) {
      this.bgmGain.gain.setValueAtTime(this.isMuted ? 0 : this.bgmVolume * 0.15, this.ctx?.currentTime || 0);
    }
    return this.isMuted;
  }

  private initThreatStatic() {
    if (!this.ctx) return;
    if (this.threatStaticSource) return; // Already initialized

    const now = this.ctx.currentTime;

    // Create 1-second white noise buffer
    const bufferSize = this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    // Create source
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    // Create bandpass filter to make it sound like a static radio
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1000, now);
    filter.Q.value = 1.0;

    // Create gain
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, now); // Start completely silent

    // Create stereo panner
    let panner: StereoPannerNode | null = null;
    try {
      if (this.ctx.createStereoPanner) {
        panner = this.ctx.createStereoPanner();
        panner.pan.setValueAtTime(0, now);
      }
    } catch (e) {
      logger.warn('SOUND_ENGINE', 'StereoPanner not supported by browser', { error: e });
    }

    // Chain: Source -> Filter -> Gain -> Panner -> Destination
    source.connect(filter);
    filter.connect(gain);
    if (panner) {
      gain.connect(panner);
      panner.connect(this.ctx.destination);
    } else {
      gain.connect(this.ctx.destination);
    }

    source.start(now);

    this.threatStaticSource = source;
    this.threatStaticGain = gain;
    this.threatPanner = panner;
  }

  private initTinnitus() {
    if (!this.ctx || this.tinnitusOsc) return;

    const now = this.ctx.currentTime;

    // High frequency carrier sine wave (~3500 Hz)
    const carrier = this.ctx.createOscillator();
    carrier.type = 'sine';
    carrier.frequency.setValueAtTime(3500, now);

    // Low-frequency LFO modulator for subtle ring pulsing (~4.5 Hz)
    const modulator = this.ctx.createOscillator();
    modulator.type = 'sine';
    modulator.frequency.setValueAtTime(4.5, now);

    const modGain = this.ctx.createGain();
    modGain.gain.setValueAtTime(45, now);
    modulator.connect(carrier.frequency);

    const mainGain = this.ctx.createGain();
    mainGain.gain.setValueAtTime(0, now);

    // Master low-pass filter to dampen ambient game audio during panic
    const lowPass = this.ctx.createBiquadFilter();
    lowPass.type = 'lowpass';
    lowPass.frequency.setValueAtTime(20000, now);
    lowPass.connect(this.ctx.destination);

    if (this.bgmGain) {
      try {
        this.bgmGain.disconnect();
      } catch (e) {}
      this.bgmGain.connect(lowPass);
    }

    carrier.connect(mainGain);
    mainGain.connect(this.ctx.destination);

    carrier.start(now);
    modulator.start(now);

    this.tinnitusOsc = carrier;
    this.tinnitusModOsc = modulator;
    this.tinnitusGain = mainGain;
    this.masterLowPassFilter = lowPass;
  }

  public updateTinnitusState(hpRatio: number, isEliteThreatClose: boolean) {
    const isTinnitusEnabled = useGameStore.getState().settings.tinnitusEnabled ?? true;
    const shouldBeActive = !this.isMuted && this.sfxVolume > 0 && isTinnitusEnabled && (hpRatio < 0.30 || isEliteThreatClose);

    this.initCtx();
    if (!this.ctx) return;
    this.initTinnitus();

    if (!this.tinnitusGain) return;

    const now = this.ctx.currentTime;
    if (shouldBeActive) {
      this.isTinnitusActive = true;
      const targetGain = this.sfxVolume * (hpRatio < 0.20 ? 0.08 : 0.04);
      this.tinnitusGain.gain.linearRampToValueAtTime(targetGain, now + 0.3);

      if (this.masterLowPassFilter) {
        // Muffle game sound (low-pass filter down to 1200Hz)
        this.masterLowPassFilter.frequency.linearRampToValueAtTime(1200, now + 0.3);
      }
    } else if (this.isTinnitusActive) {
      this.isTinnitusActive = false;
      this.tinnitusGain.gain.linearRampToValueAtTime(0, now + 0.5);

      if (this.masterLowPassFilter) {
        // Restore full audio frequency spectrum (20kHz)
        this.masterLowPassFilter.frequency.linearRampToValueAtTime(20000, now + 0.5);
      }
    }
  }

  public updateSpatialThreat(relativeX: number, relativeY: number, activeThreat: boolean) {
    if (this.isMuted || this.sfxVolume <= 0) {
      if (this.threatStaticGain) {
        this.threatStaticGain.gain.setValueAtTime(0, this.ctx?.currentTime || 0);
      }
      return;
    }

    this.initCtx();
    if (!this.ctx) return;
    this.initThreatStatic();

    const now = this.ctx.currentTime;
    if (this.threatStaticGain) {
      const targetGain = activeThreat ? this.sfxVolume * 0.12 : 0;
      // Smooth linear ramp to avoid click sounds
      this.threatStaticGain.gain.linearRampToValueAtTime(targetGain, now + 0.1);
    }

    if (this.threatPanner && activeThreat) {
      // Clamp pan value between -1.0 (left) and 1.0 (right)
      const targetPan = Math.max(-1.0, Math.min(1.0, relativeX));
      this.threatPanner.pan.linearRampToValueAtTime(targetPan, now + 0.1);
    }
  }

  /**
   * Frente 6 (spec 11) — Pitch Shifting aleatório. Retorna um multiplicador de
   * frequência (ex.: 0.94–1.06 pra rangePercent=0.06) usado pra variar o tom
   * de um SFX repetitivo a cada disparo, evitando o efeito "metralhadora" de
   * ouvir a mesma nota idêntica dezenas de vezes numa run. Só aplicado nos
   * SFX de combate/ação disparados com frequência — sons melódicos de
   * múltiplas notas (level up, baú, contrato) ficam de fora de propósito,
   * porque desafinar notas de uma escala musical soa quebrado, não orgânico.
   */
  private pitchJitter(rangePercent: number = 0.06): number {
    return 1 + (Math.random() * 2 - 1) * rangePercent;
  }

  /**
   * Frente 6 (spec 11) — Tension Drone: cria (uma única vez) o oscilador de
   * sub-grave contínuo cuja intensidade/frequência são ajustadas por
   * `updateTensionDrone()` a cada frame, conforme o "ambiente" de perigo.
   */
  private initTensionDrone() {
    if (!this.ctx || this.tensionDroneOsc) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth'; // rico em harmônicos — soa como um rosnado grave, não um tom limpo
    osc.frequency.setValueAtTime(38, now); // sub-grave profundo, quase mais sentido que ouvido

    // LFO lento modulando o ganho — simula uma "respiração"/pulsação de tensão,
    // em vez de um zumbido estático e cansativo.
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.18, now);
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(0, now); // profundidade da modulação, ajustada em update

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(160, now); // mantém só o sub-grave, sem harmônicos ásperos

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, now); // começa em silêncio; sobe conforme o perigo

    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    lfo.start(now);

    this.tensionDroneOsc = osc;
    this.tensionDroneLFO = lfo;
    this.tensionDroneLFOGain = lfoGain;
    this.tensionDroneFilter = filter;
    this.tensionDroneGain = gain;
  }

  /**
   * Frente 6 (spec 11) — atualiza o drone de tensão a cada frame. `alertCount`
   * é o nº de inimigos hostis em combate/frenzy perto do jogador (mesmo sinal
   * já calculado em `updateThreatIndicator`, GameScene.ts) e `hpRatio` o HP
   * atual — mais inimigos e HP baixo somam pra um "score" de perigo (0-1) que
   * controla volume e frequência do drone. Sutil de propósito (ganho máx.
   * ~5% do sfxVolume): é textura ambiente, não deve dominar a mixagem.
   */
  public updateTensionDrone(alertCount: number, hpRatio: number) {
    if (this.isMuted || this.sfxVolume <= 0) {
      if (this.tensionDroneGain && this.ctx) {
        this.tensionDroneGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.3);
      }
      return;
    }

    this.initCtx();
    if (!this.ctx) return;
    this.initTensionDrone();
    if (!this.tensionDroneGain || !this.tensionDroneOsc || !this.tensionDroneLFOGain) return;

    const now = this.ctx.currentTime;
    const dangerFromEnemies = Math.min(1, Math.max(0, alertCount) / 5); // satura com 5+ hostis simultâneos
    const dangerFromHp = hpRatio < 0.5 ? (0.5 - hpRatio) * 1.6 : 0; // HP baixo soma tensão extra
    const danger = Math.min(1, dangerFromEnemies + dangerFromHp);

    const targetGain = danger > 0.02 ? this.sfxVolume * 0.05 * danger : 0;
    this.tensionDroneGain.gain.linearRampToValueAtTime(targetGain, now + (danger > 0.02 ? 0.8 : 1.0));

    // Mais tensão = frequência um pouco mais alta e modulação mais audível
    // (a "respiração" acelera/aprofunda conforme o perigo aumenta).
    const targetFreq = 38 + danger * 14; // 38Hz calmo -> 52Hz tenso
    this.tensionDroneOsc.frequency.linearRampToValueAtTime(targetFreq, now + 0.8);
    this.tensionDroneLFOGain.gain.linearRampToValueAtTime(4 + danger * 10, now + 0.8);
  }

  public playBloodBolt() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    if (typeof window !== 'undefined' && (window as any).__triggerFearDistortion) {
      (window as any).__triggerFearDistortion(1400);
    }

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const jitter = this.pitchJitter(); // Frente 6: cada blood_bolt soa levemente diferente

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(420 * jitter, now);
    osc.frequency.exponentialRampToValueAtTime(110 * jitter, now + 0.12);

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
    const jitter = this.pitchJitter(0.08); // Frente 6: varia o "timbre" da explosão a cada disparo
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
    filter.frequency.setValueAtTime(800 * jitter, now);
    filter.frequency.exponentialRampToValueAtTime(80 * jitter, now + 0.35);

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

    // Frente 6: já tinha uma randomização parcial na frequência inicial —
    // mantida (é o som de hit mais repetido do jogo) e complementada com o
    // fim do sweep também variando, pra variar o som inteiro, não só o começo.
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150 + Math.random() * 80, now);
    osc.frequency.linearRampToValueAtTime(60 * this.pitchJitter(0.15), now + 0.1);

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
    const jitter = this.pitchJitter(0.08); // Frente 6: orbe é o pickup mais repetido do jogo

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600 * jitter, now);
    osc.frequency.exponentialRampToValueAtTime(1200 * jitter, now + 0.08);

    gain.gain.setValueAtTime(this.sfxVolume * 0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  }


  public playMenuBlip() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(600, now);

    gain.gain.setValueAtTime(this.sfxVolume * 0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  public playDialogueBlip() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const jitter = this.pitchJitter();
    osc.type = 'square';
    osc.frequency.setValueAtTime(800 * jitter, now);

    gain.gain.setValueAtTime(this.sfxVolume * 0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.04);
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

  public playChestOpen() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Wood/Latch click (square wave click)
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'square';
    osc1.frequency.setValueAtTime(300, now);
    osc1.frequency.exponentialRampToValueAtTime(80, now + 0.08);
    gain1.gain.setValueAtTime(this.sfxVolume * 0.4, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
    osc1.connect(gain1);
    gain1.connect(this.ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.08);

    // Golden Chime Sweep (Triangle synth arpeggio)
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + 0.06 + i * 0.05);
      gain.gain.setValueAtTime(this.sfxVolume * 0.25, now + 0.06 + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06 + i * 0.05 + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + 0.06 + i * 0.05);
      osc.stop(now + 0.06 + i * 0.05 + 0.3);
    });
  }

  public playPortalEnter() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.4);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.7);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(this.sfxVolume * 0.4, now + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.7);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.7);
  }

  public playPlayerHurt() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const jitter = this.pitchJitter(); // Frente 6: hit sofrido repetidamente não deve soar em loop idêntico

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180 * jitter, now);
    osc.frequency.exponentialRampToValueAtTime(50 * jitter, now + 0.18);

    gain.gain.setValueAtTime(this.sfxVolume * 0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  public playEquipLoot() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Metallic Ring
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1760, now + 0.1);

    gain.gain.setValueAtTime(this.sfxVolume * 0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  public playHowl() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const jitter = this.pitchJitter(); // Frente 6: cada uivo soa um pouco diferente

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220 * jitter, now);
    osc.frequency.linearRampToValueAtTime(480 * jitter, now + 0.3);
    osc.frequency.exponentialRampToValueAtTime(140 * jitter, now + 0.8);

    gain.gain.setValueAtTime(this.sfxVolume * 0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.8);
  }

  public playGoreExplosion() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.45;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const jitter = this.pitchJitter(0.08); // Frente 6: gore explode a cada dismember/morte, muito frequente
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600 * jitter, now);
    filter.frequency.exponentialRampToValueAtTime(60 * jitter, now + 0.45);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(this.sfxVolume * 0.55, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(now);
  }

  public playBossRoar() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(55, now);
    osc.frequency.linearRampToValueAtTime(110, now + 0.4);
    osc.frequency.linearRampToValueAtTime(35, now + 1.2);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, now);

    gain.gain.setValueAtTime(this.sfxVolume * 0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 1.2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 1.2);
  }

  public playBoneShield() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(640, now + 0.15);

    gain.gain.setValueAtTime(this.sfxVolume * 0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  public playSyphonSoul() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(700, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.25);

    gain.gain.setValueAtTime(this.sfxVolume * 0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  public playSwing() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.12;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const jitter = this.pitchJitter(0.1); // Frente 6: golpe é o SFX mais repetido de todos (jogador + inimigos)
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200 * jitter, now);
    filter.frequency.exponentialRampToValueAtTime(300 * jitter, now + 0.12);
    filter.Q.value = 3;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(this.sfxVolume * 0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(now);
  }

  public playTelegraph() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const jitter = this.pitchJitter(0.08); // Frente 6: telegraph dispara por inimigo/tentativa, muito repetitivo

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140 * jitter, now);
    osc.frequency.exponentialRampToValueAtTime(280 * jitter, now + 0.15);

    gain.gain.setValueAtTime(this.sfxVolume * 0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  public playScytheSlash() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const jitter = this.pitchJitter(); // Frente 6: skill spammável em combate

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(380 * jitter, now);
    osc.frequency.exponentialRampToValueAtTime(120 * jitter, now + 0.2);

    gain.gain.setValueAtTime(this.sfxVolume * 0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  public playRitualCircle() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.linearRampToValueAtTime(400, now + 0.3);

    gain.gain.setValueAtTime(this.sfxVolume * 0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  }

  public playHemomancyBeam() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.linearRampToValueAtTime(260, now + 0.4);

    gain.gain.setValueAtTime(this.sfxVolume * 0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.4);
  }

  public playContractComplete() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [392.00, 523.25, 659.25]; // G4, C5, E5

    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);

      gain.gain.setValueAtTime(this.sfxVolume * 0.35, now + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.12 + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.3);
    });
  }

  public playExecutionGore() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Transient grave impact (sawtooth frequency sweep)
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.3);

    // Filter to make it heavy and muffled
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(250, now);

    gain.gain.setValueAtTime(this.sfxVolume * 0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.3);

    // Squishy / tearing blood splash
    this.playBloodSquish();
    this.playGoreExplosion();
  }

  public playDash() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Whoosh (bandpass filtered white noise with descending frequency)
    const bufferSize = this.ctx.sampleRate * 0.15;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const jitter = this.pitchJitter(0.1); // Frente 6: dash é usado o tempo todo (player + inimigos escavengers)
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1000 * jitter, now);
    filter.frequency.exponentialRampToValueAtTime(150 * jitter, now + 0.15);
    filter.Q.value = 2;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(this.sfxVolume * 0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(now);
  }

  public startGothicAmbientBGM(themeName?: BGMThemeName) {
    this.initCtx();
    const biome = useGameStore.getState().currentBiome;
    let selectedTheme: BGMThemeName = themeName || 'catacombs';
    if (!themeName) {
      if (biome === 'safe_house') {
        selectedTheme = 'safe_house';
      } else if (biome === 'santuario_sangue') {
        selectedTheme = 'sanctuary';
      } else {
        selectedTheme = 'catacombs';
      }
    }
    bgmSynthesizer.start(selectedTheme);
    this.isBgmPlaying = true;
  }

  public setBGMTheme(themeName: BGMThemeName) {
    bgmSynthesizer.setTheme(themeName);
  }

  public setBGMMuffled(muffled: boolean) {
    bgmSynthesizer.setMuffled(muffled);
  }

  public setBGMLowHp(lowHp: boolean) {
    bgmSynthesizer.setLowHp(lowHp);
  }

  public updateEnvironmentAudio(isIndoor: boolean, reverbLevel: number) {
    if (!this.ctx || !this.bgmGain) return;
    const now = this.ctx.currentTime;
    // Adjust BGM gain dynamics based on indoor cave vs outdoor sanctuary
    const targetGain = this.isMuted ? 0 : (isIndoor ? this.bgmVolume * 0.12 : this.bgmVolume * 0.20);
    this.bgmGain.gain.setTargetAtTime(targetGain, now, 0.5);
  }

  public stopBGM() {
    bgmSynthesizer.stop();
    if (this.bgmIntervalTimer) {
      clearInterval(this.bgmIntervalTimer);
      this.bgmIntervalTimer = null;
    }
    this.bgmOscillators.forEach((osc) => {
      try { osc.stop(); } catch {}
    });
    this.bgmOscillators = [];
    this.isBgmPlaying = false;
  }
}

export const soundEngine = new SoundEngine();
