/**
 * Offline Audio Renderer for Blood Mage 1995 Procedural BGM.
 * Renders 16-bit 44.1kHz WAV audio files of the procedural synthesizer tracks.
 * 
 * Generates:
 * 1. public/audio_samples/catacombs_floor1.wav (Catacumbas dos Mártires - Gothic Cravo & FM Bass)
 * 2. public/audio_samples/sanctuary_floor3.wav (Santuário de Sangue - C Minor Ritual Chant)
 * 3. public/audio_samples/boss_plutonia.wav (Fúria de Sangue - Fast 130 BPM FM Riff DOOM 1995)
 * 4. public/audio_samples/catacombs_muffled.wav (Low-pass Filter Muffle Test for Inventory)
 * 5. public/audio_samples/boss_panic_low_hp.wav (Accelerated BPM + Low-HP Heartbeat)
 */

const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 44100;

// Frequency definitions (in Hz)
const NOTES = {
  C1: 32.70, Cs1: 34.65, D1: 36.71, Ds1: 38.89, E1: 41.20, F1: 43.65, Fs1: 46.25, G1: 49.00, Gs1: 51.91, A1: 55.00, As1: 58.27, B1: 61.74,
  C2: 65.41, Cs2: 69.30, D2: 73.42, Ds2: 77.78, E2: 82.41, F2: 87.31, Fs2: 92.50, G2: 98.00, Gs2: 103.83, A2: 110.00, As2: 116.54, B2: 123.47,
  C3: 130.81, Cs3: 138.59, D3: 146.83, Ds3: 155.56, E3: 164.81, F3: 174.61, Fs3: 185.00, G3: 196.00, Gs3: 207.65, A3: 220.00, As3: 233.08, B3: 246.94,
  C4: 261.63, Cs4: 277.18, D4: 293.66, Ds4: 311.13, E4: 329.63, F4: 349.23, Fs4: 369.99, G4: 392.00, Gs4: 415.30, A4: 440.00, As4: 466.16, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00,
};

// 1. Theme Configurations
const THEMES = {
  catacombs: {
    name: 'Catacumbas dos Mártires (Floor 1-2)',
    bpm: 92,
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
  },
  sanctuary: {
    name: 'Santuário de Sangue (Floor 3-4)',
    bpm: 84,
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
  },
  boss_plutonia: {
    name: 'Fúria de Sangue - DOOM Plutonia (Boss)',
    bpm: 130,
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
  },
};

// Low-pass Biquad Filter implementation
class LowPassFilter {
  constructor(cutoff, q) {
    this.x1 = 0;
    this.x2 = 0;
    this.y1 = 0;
    this.y2 = 0;
    this.setParams(cutoff, q);
  }

  setParams(cutoff, q) {
    const w0 = (2 * Math.PI * Math.min(cutoff, SAMPLE_RATE * 0.45)) / SAMPLE_RATE;
    const cos_w0 = Math.cos(w0);
    const alpha = Math.sin(w0) / (2 * Math.max(0.1, q));
    const a0 = 1 + alpha;

    this.b0 = ((1 - cos_w0) / 2) / a0;
    this.b1 = (1 - cos_w0) / a0;
    this.b2 = ((1 - cos_w0) / 2) / a0;
    this.a1 = (-2 * cos_w0) / a0;
    this.a2 = (1 - alpha) / a0;
  }

  process(sample) {
    const y0 = this.b0 * sample + this.b1 * this.x1 + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2;
    this.x2 = this.x1;
    this.x1 = sample;
    this.y2 = this.y1;
    this.y1 = y0;
    return y0;
  }
}

// Waveform generator
function getSample(type, phase) {
  const normPhase = (phase / (2 * Math.PI)) % 1;
  switch (type) {
    case 'sawtooth':
      return 2 * normPhase - 1;
    case 'square':
      return normPhase < 0.5 ? 0.8 : -0.8;
    case 'triangle':
      return 2 * Math.abs(2 * normPhase - 1) - 1;
    case 'sine':
    default:
      return Math.sin(phase);
  }
}

// Render Track to PCM Float Array
function renderTheme(themeConfig, options = {}) {
  const { totalSteps = 64, isMuffled = false, isLowHp = false } = options;
  const effectiveBpm = isLowHp ? themeConfig.bpm * 1.12 : themeConfig.bpm;
  const stepTime = (60 / effectiveBpm) / 4; // 16th note in seconds
  const totalDuration = totalSteps * stepTime + 1.0; // Plus 1s tail
  const totalSamples = Math.floor(totalDuration * SAMPLE_RATE);

  const buffer = new Float32Array(totalSamples);

  // Pre-generate white noise
  const noiseBuffer = new Float32Array(SAMPLE_RATE);
  for (let i = 0; i < SAMPLE_RATE; i++) {
    noiseBuffer[i] = Math.random() * 2 - 1;
  }

  for (let step = 0; step < totalSteps; step++) {
    const startTime = step * stepTime;
    const startSample = Math.floor(startTime * SAMPLE_RATE);

    // 1. Arpeggio / Lead
    const arpFreq = themeConfig.arpSequence[step % themeConfig.arpSequence.length];
    if (arpFreq) {
      const dur = 0.16;
      const samples = Math.floor(dur * SAMPLE_RATE);
      let phase = 0;
      const phaseInc = (2 * Math.PI * arpFreq) / SAMPLE_RATE;
      for (let s = 0; s < samples; s++) {
        const t = s / SAMPLE_RATE;
        const env = Math.exp(-t / 0.04) * 0.18;
        const samp = getSample(themeConfig.leadWave, phase) * env;
        phase += phaseInc;
        if (startSample + s < totalSamples) {
          buffer[startSample + s] += samp;
        }
      }
    }

    // 2. Bass Voice
    const bassFreq = themeConfig.bassSequence[step % themeConfig.bassSequence.length];
    if (bassFreq) {
      const dur = 0.35;
      const samples = Math.floor(dur * SAMPLE_RATE);
      let phase = 0;
      const phaseInc = (2 * Math.PI * bassFreq) / SAMPLE_RATE;
      const bassFilter = new LowPassFilter(themeConfig.filterBase, themeConfig.filterQ);

      for (let s = 0; s < samples; s++) {
        const t = s / SAMPLE_RATE;
        // Filter dynamic sweep
        const sweepFreq = t < 0.04
          ? themeConfig.filterBase + (themeConfig.filterPeak - themeConfig.filterBase) * (t / 0.04)
          : themeConfig.filterPeak * Math.exp(-(t - 0.04) / 0.12) + themeConfig.filterBase;
        bassFilter.setParams(sweepFreq, themeConfig.filterQ);

        const env = Math.exp(-t / 0.08) * 0.45;
        const raw = getSample(themeConfig.bassWave, phase) * env;
        const filtered = bassFilter.process(raw);
        phase += phaseInc;
        if (startSample + s < totalSamples) {
          buffer[startSample + s] += filtered;
        }
      }
    }

    // 3. Kick Drum
    const kickIdx = step % 32;
    if (themeConfig.kickSteps.includes(kickIdx)) {
      const dur = 0.25;
      const samples = Math.floor(dur * SAMPLE_RATE);
      let phase = 0;
      for (let s = 0; s < samples; s++) {
        const t = s / SAMPLE_RATE;
        const freq = 140 * Math.exp(-t / 0.05) + 32;
        const phaseInc = (2 * Math.PI * freq) / SAMPLE_RATE;
        const env = Math.exp(-t / 0.06) * 0.65;
        const samp = Math.sin(phase) * env;
        phase += phaseInc;
        if (startSample + s < totalSamples) {
          buffer[startSample + s] += samp;
        }
      }
    }

    // 4. Snare Drum (Highpass filtered white noise)
    if (themeConfig.snareSteps.includes(kickIdx)) {
      const dur = 0.12;
      const samples = Math.floor(dur * SAMPLE_RATE);
      for (let s = 0; s < samples; s++) {
        const t = s / SAMPLE_RATE;
        const env = Math.exp(-t / 0.025) * 0.25;
        const noise = noiseBuffer[(startSample + s) % SAMPLE_RATE];
        // Highpass approximation: noise - lowpass(noise)
        const samp = noise * env;
        if (startSample + s < totalSamples) {
          buffer[startSample + s] += samp;
        }
      }
    }

    // 5. Gothic Cathedral Bell
    if (themeConfig.bellSteps.includes(kickIdx) && themeConfig.bellNote) {
      const dur = 2.8;
      const samples = Math.floor(dur * SAMPLE_RATE);
      let phase1 = 0;
      let phase2 = 0;
      const phaseInc1 = (2 * Math.PI * themeConfig.bellNote) / SAMPLE_RATE;
      const phaseInc2 = (2 * Math.PI * themeConfig.bellNote * 2.76) / SAMPLE_RATE;

      for (let s = 0; s < samples; s++) {
        const t = s / SAMPLE_RATE;
        const env1 = Math.exp(-t / 0.5) * 0.22;
        const env2 = Math.exp(-t / 0.28) * 0.08;
        const samp = Math.sin(phase1) * env1 + Math.sin(phase2) * env2;
        phase1 += phaseInc1;
        phase2 += phaseInc2;
        if (startSample + s < totalSamples) {
          buffer[startSample + s] += samp;
        }
      }
    }

    // 6. Low HP Heartbeat
    if (isLowHp && step % 8 === 0) {
      const dur = 0.12;
      const samples = Math.floor(dur * SAMPLE_RATE);
      let phase = 0;
      for (let s = 0; s < samples; s++) {
        const t = s / SAMPLE_RATE;
        const freq = 65 * Math.exp(-t / 0.06) + 35;
        const phaseInc = (2 * Math.PI * freq) / SAMPLE_RATE;
        const env = Math.exp(-t / 0.04) * 0.4;
        const samp = Math.sin(phase) * env;
        phase += phaseInc;
        if (startSample + s < totalSamples) {
          buffer[startSample + s] += samp;
        }
      }
    }
  }

  // Global Master Filter (e.g. 700Hz if Muffled)
  if (isMuffled) {
    const masterFilter = new LowPassFilter(700, 1.0);
    for (let i = 0; i < totalSamples; i++) {
      buffer[i] = masterFilter.process(buffer[i]);
    }
  }

  return {
    buffer,
    duration: totalDuration,
    sampleRate: SAMPLE_RATE,
  };
}

// Convert Float32Array to 16-bit PCM WAV Buffer
function createWavBuffer(samples, sampleRate) {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = samples.length * 2;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;

  const wav = Buffer.alloc(totalSize);

  // RIFF Chunk
  wav.write('RIFF', 0);
  wav.writeUInt32LE(totalSize - 8, 4);
  wav.write('WAVE', 8);

  // fmt Sub-chunk
  wav.write('fmt ', 12);
  wav.writeUInt32LE(16, 16); // SubChunk1Size (16 for PCM)
  wav.writeUInt16LE(1, 20);  // AudioFormat (1 = PCM)
  wav.writeUInt16LE(numChannels, 22);
  wav.writeUInt32LE(sampleRate, 24);
  wav.writeUInt32LE(byteRate, 28);
  wav.writeUInt16LE(blockAlign, 32);
  wav.writeUInt16LE(bitsPerSample, 34);

  // data Sub-chunk
  wav.write('data', 36);
  wav.writeUInt32LE(dataSize, 40);

  // Write PCM samples with soft clipping limiter
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    let s = samples[i];
    // Soft tanh limiter
    s = Math.tanh(s);
    const intSample = Math.max(-32768, Math.min(32767, Math.floor(s * 32767)));
    wav.writeInt16LE(intSample, offset);
    offset += 2;
  }

  return wav;
}

// Main execution
function main() {
  const outputDir = path.join(__dirname, '../public/audio_samples');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('====================================================');
  console.log('🎵 BLOOD MAGE 1995 - BGM PROCEDURAL RENDERER');
  console.log('====================================================\n');

  const renders = [
    {
      id: 'catacombs_floor1.wav',
      theme: THEMES.catacombs,
      options: { totalSteps: 64, isMuffled: false, isLowHp: false },
      desc: 'Piso 1-2: Catacumbas (Cravo Gótico, Baixo FM, Sino Catedral)',
    },
    {
      id: 'sanctuary_floor3.wav',
      theme: THEMES.sanctuary,
      options: { totalSteps: 64, isMuffled: false, isLowHp: false },
      desc: 'Piso 3-4: Santuário Carmesim (Drone Ritualístico C menor)',
    },
    {
      id: 'boss_plutonia.wav',
      theme: THEMES.boss_plutonia,
      options: { totalSteps: 64, isMuffled: false, isLowHp: false },
      desc: 'Sala do Chefe: Fúria de Sangue (Fast 130 BPM Riff DOOM 1995)',
    },
    {
      id: 'catacombs_muffled_inventory.wav',
      theme: THEMES.catacombs,
      options: { totalSteps: 64, isMuffled: true, isLowHp: false },
      desc: 'Efeito Abafado / Muffle: Simulação de Menu/Inventário Aberto (700Hz)',
    },
    {
      id: 'boss_panic_low_hp.wav',
      theme: THEMES.boss_plutonia,
      options: { totalSteps: 64, isMuffled: false, isLowHp: true },
      desc: 'Modo Pânico / HP Crítico: Aceleração de BPM + Batimentos Cardíacos',
    },
  ];

  const results = [];

  for (const item of renders) {
    process.stdout.write(`Rendering: ${item.desc}... `);
    const { buffer, duration } = renderTheme(item.theme, item.options);
    const wavBuffer = createWavBuffer(buffer, SAMPLE_RATE);
    const filePath = path.join(outputDir, item.id);
    fs.writeFileSync(filePath, wavBuffer);

    const fileSizeKb = (wavBuffer.length / 1024).toFixed(1);
    console.log(`✅ OK (${duration.toFixed(1)}s, ${fileSizeKb} KB)`);

    results.push({
      file: item.id,
      path: `public/audio_samples/${item.id}`,
      desc: item.desc,
      duration: `${duration.toFixed(1)}s`,
      size: `${fileSizeKb} KB`,
    });
  }

  console.log('\n----------------------------------------------------');
  console.log('Arquivos WAV gerados com sucesso em /public/audio_samples:');
  console.table(results);
  console.log('----------------------------------------------------\n');
}

main();
