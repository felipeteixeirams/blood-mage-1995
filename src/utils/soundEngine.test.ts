import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Frente 6 (docs/specs/11_VISUAL_POLISH_FRONTS.md — 27/08): Pitch Shifting
 * aleatório em SFX repetitivos + drone dinâmico de sub-grave pra tensão.
 *
 * `soundEngine` é um singleton (só a instância é exportada, não a classe),
 * então cada teste recarrega o módulo do zero (`vi.resetModules()` +
 * `import()` dinâmico) pra não vazar estado (osciladores já criados,
 * volume configurado, etc.) de um teste pro outro.
 */

vi.mock('./bgmSynthesizer', () => ({
  bgmSynthesizer: {
    init: vi.fn(),
    setVolume: vi.fn(),
    setMute: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    setTheme: vi.fn(),
    setMuffled: vi.fn(),
    setLowHp: vi.fn(),
  },
}));

vi.mock('../store/gameStore', () => ({
  useGameStore: { getState: () => ({ settings: {}, currentBiome: 'fosso_chagas' }) },
}));

function makeMockCtx() {
  const gainNode = () => ({
    gain: {
      value: 0,
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn(),
    disconnect: vi.fn(),
  });
  const filterNode = () => ({
    type: 'lowpass',
    frequency: {
      value: 0,
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
    Q: { value: 1 },
    connect: vi.fn(),
    disconnect: vi.fn(),
  });
  const oscNode = () => ({
    type: 'sine',
    frequency: {
      value: 0,
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    disconnect: vi.fn(),
  });
  const bufferSourceNode = () => ({ buffer: null, connect: vi.fn(), start: vi.fn(), stop: vi.fn(), disconnect: vi.fn() });

  return {
    currentTime: 5,
    sampleRate: 44100,
    state: 'running',
    destination: {},
    resume: vi.fn().mockResolvedValue(undefined),
    createGain: vi.fn(gainNode),
    createBiquadFilter: vi.fn(filterNode),
    createOscillator: vi.fn(oscNode),
    createBufferSource: vi.fn(bufferSourceNode),
    createBuffer: vi.fn((_channels: number, length: number, sampleRate: number) => ({
      length,
      sampleRate,
      getChannelData: () => new Float32Array(length),
    })),
  };
}

async function loadEngine(mockCtx: ReturnType<typeof makeMockCtx>) {
  vi.resetModules();
  // Vitest 4 passa a exigir que um mock usado com `new` seja uma `function`/
  // `class` de verdade (arrow function não é "constructible" em JS puro — o
  // engine mock antigo passava numa versão anterior do Vitest, mas quebra
  // aqui com "is not a constructor"). Uma function que RETORNA um objeto
  // sobrescreve o `this` do `new`, então isso continua devolvendo `mockCtx`.
  (window as any).AudioContext = vi.fn(function AudioContextMock() {
    return mockCtx;
  });
  const mod = await import('./soundEngine');
  return mod.soundEngine;
}

describe('SoundEngine — Frente 6 (spec 11): Pitch Shifting + Tension Drone', () => {
  let mockCtx: ReturnType<typeof makeMockCtx>;
  let randomSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockCtx = makeMockCtx();
    randomSpy?.mockRestore();
  });

  describe('Pitch Shifting aleatório', () => {
    it('varia a frequência de playBloodBolt a cada disparo (não é sempre a mesma nota)', async () => {
      const engine = await loadEngine(mockCtx);
      engine.setVolumes(1, 1);

      randomSpy = vi.spyOn(Math, 'random').mockReturnValueOnce(0); // jitter mínimo
      engine.playBloodBolt();
      const firstOsc = mockCtx.createOscillator.mock.results[0].value;
      const firstFreq = firstOsc.frequency.setValueAtTime.mock.calls[0][0];

      randomSpy.mockReturnValueOnce(1); // jitter máximo
      engine.playBloodBolt();
      const secondOsc = mockCtx.createOscillator.mock.results[1].value;
      const secondFreq = secondOsc.frequency.setValueAtTime.mock.calls[0][0];

      expect(firstFreq).not.toBe(secondFreq);
      // Ambos devem ficar dentro da faixa de jitter padrão (±6%) da freq base (420Hz)
      expect(firstFreq).toBeGreaterThan(420 * 0.9);
      expect(secondFreq).toBeLessThan(420 * 1.1);
    });

    it('varia playPlayerHurt e playTelegraph (SFX de combate repetitivos)', async () => {
      const engine = await loadEngine(mockCtx);
      engine.setVolumes(1, 1);

      randomSpy = vi.spyOn(Math, 'random').mockReturnValueOnce(0).mockReturnValueOnce(1);
      engine.playPlayerHurt();
      engine.playPlayerHurt();
      const [firstCall, secondCall] = mockCtx.createOscillator.mock.results.map((r: any) => r.value);
      expect(firstCall.frequency.setValueAtTime.mock.calls[0][0]).not.toBe(
        secondCall.frequency.setValueAtTime.mock.calls[0][0]
      );

      mockCtx = makeMockCtx();
      const engine2 = await loadEngine(mockCtx);
      engine2.setVolumes(1, 1);
      randomSpy.mockRestore();
      randomSpy = vi.spyOn(Math, 'random').mockReturnValueOnce(0).mockReturnValueOnce(1);
      engine2.playTelegraph();
      engine2.playTelegraph();
      const [tFirst, tSecond] = mockCtx.createOscillator.mock.results.map((r: any) => r.value);
      expect(tFirst.frequency.setValueAtTime.mock.calls[0][0]).not.toBe(
        tSecond.frequency.setValueAtTime.mock.calls[0][0]
      );
    });

    it('NÃO varia SFX melódicos de múltiplas notas (playLevelUp mantém as notas exatas da escala)', async () => {
      const engine = await loadEngine(mockCtx);
      engine.setVolumes(1, 1);

      randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.13); // qualquer valor — não deve importar
      engine.playLevelUp();

      const notes = [261.63, 329.63, 392.0, 523.25, 659.25];
      const oscs = mockCtx.createOscillator.mock.results.map((r: any) => r.value);
      oscs.forEach((osc: any, i: number) => {
        expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(notes[i], expect.any(Number));
      });
    });
  });

  describe('Tension Drone (sub-grave dinâmico)', () => {
    it('cria o drone (lazy) na primeira chamada, mesmo sem perigo', async () => {
      const engine = await loadEngine(mockCtx);
      engine.setVolumes(1, 1);

      engine.updateTensionDrone(0, 1.0);
      // 2 osciladores: o drone principal + o LFO de "respiração"
      expect(mockCtx.createOscillator).toHaveBeenCalledTimes(2);
    });

    it('sobe o ganho e a frequência do drone conforme mais inimigos hostis se aproximam', async () => {
      const engine = await loadEngine(mockCtx);
      engine.setVolumes(1, 1);

      // initTensionDrone() cria, nessa ordem: osc principal, LFO, lfoGain (createGain #1),
      // filter, gain principal (createGain #2) — ver soundEngine.ts.
      engine.updateTensionDrone(0, 1.0); // sem perigo — só inicializa
      const droneOsc = mockCtx.createOscillator.mock.results[0].value;
      const droneGain = mockCtx.createGain.mock.results[1].value;

      engine.updateTensionDrone(5, 0.2); // perigo máximo: 5 hostis + HP baixo

      const gainCalls = droneGain.gain.linearRampToValueAtTime.mock.calls;
      const lastGain = gainCalls[gainCalls.length - 1][0];
      expect(lastGain).toBeCloseTo(1 * 0.05 * 1, 5); // sfxVolume(1) * 0.05 * danger(1, saturado)

      const freqCalls = droneOsc.frequency.linearRampToValueAtTime.mock.calls;
      const lastFreq = freqCalls[freqCalls.length - 1][0];
      expect(lastFreq).toBeCloseTo(52, 5); // 38Hz base + 1 * 14Hz no perigo máximo
    });

    it('sem inimigos hostis e com HP cheio, o drone fica silencioso (ganho 0)', async () => {
      const engine = await loadEngine(mockCtx);
      engine.setVolumes(1, 1);

      engine.updateTensionDrone(0, 1.0);
      const droneGain = mockCtx.createGain.mock.results[1].value;
      const lastGainCall = droneGain.gain.linearRampToValueAtTime.mock.calls.slice(-1)[0];
      expect(lastGainCall[0]).toBe(0);
    });

    it('respeita mute/sfxVolume=0: não cria osciladores novos e zera o ganho se já existir', async () => {
      const engine = await loadEngine(mockCtx);
      engine.setVolumes(1, 1);
      engine.updateTensionDrone(5, 0.2); // cria o drone com perigo ativo

      const createOscCallsBefore = mockCtx.createOscillator.mock.calls.length;
      engine.setVolumes(0, 1); // sfxVolume = 0
      engine.updateTensionDrone(5, 0.2);

      expect(mockCtx.createOscillator.mock.calls.length).toBe(createOscCallsBefore); // não recria nada
    });
  });
});
