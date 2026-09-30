import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { ChunkStreamer, ChunkSpec } from './ChunkStreamer';

describe('ChunkStreamer (Fase A — prova de conceito de mundo contínuo)', () => {
  describe('construção e mapeamento de posição', () => {
    it('lança se nenhum chunk for fornecido', () => {
      expect(() => new ChunkStreamer([], { loadRadius: 1, onLoad: vi.fn(), onUnload: vi.fn() })).toThrow();
    });

    it('ordena os chunks por `index` independente da ordem de entrada', () => {
      const chunks: ChunkSpec[] = [
        { id: 'b', index: 1, width: 100, biome: 'b' },
        { id: 'a', index: 0, width: 100, biome: 'a' },
      ];
      const streamer = new ChunkStreamer(chunks, { loadRadius: 0, onLoad: vi.fn(), onUnload: vi.fn() });
      // chunk 'a' (index 0) começa em x=0; chunk 'b' (index 1) começa em x=100
      expect(streamer.getChunkIndexAt(50)).toBe(0);
      expect(streamer.getChunkIndexAt(150)).toBe(1);
    });

    it('soma as larguras corretamente em getTotalWidth', () => {
      const chunks: ChunkSpec[] = [
        { id: 'a', index: 0, width: 300, biome: 'safe_house' },
        { id: 'b', index: 1, width: 500, biome: 'gloomy_woods' },
        { id: 'c', index: 2, width: 700, biome: 'fosso_chagas' },
      ];
      const streamer = new ChunkStreamer(chunks, { loadRadius: 0, onLoad: vi.fn(), onUnload: vi.fn() });
      expect(streamer.getTotalWidth()).toBe(1500);
    });

    it('mapeia posições de borda e fora dos limites sem lançar (satura no primeiro/último chunk)', () => {
      const chunks: ChunkSpec[] = [
        { id: 'a', index: 0, width: 100, biome: 'a' },
        { id: 'b', index: 1, width: 100, biome: 'b' },
      ];
      const streamer = new ChunkStreamer(chunks, { loadRadius: 0, onLoad: vi.fn(), onUnload: vi.fn() });

      expect(streamer.getChunkIndexAt(-500)).toBe(0); // muito antes do início
      expect(streamer.getChunkIndexAt(0)).toBe(0); // início exato
      expect(streamer.getChunkIndexAt(99)).toBe(0); // dentro do chunk 0
      expect(streamer.getChunkIndexAt(100)).toBe(1); // exatamente na fronteira -> chunk 1
      expect(streamer.getChunkIndexAt(199)).toBe(1); // dentro do chunk 1
      expect(streamer.getChunkIndexAt(200)).toBe(1); // exatamente no fim -> satura no último
      expect(streamer.getChunkIndexAt(9999)).toBe(1); // muito além do fim
    });
  });

  describe('janela de streaming (load/unload)', () => {
    let chunks: ChunkSpec[];
    let onLoad: Mock<(chunk: ChunkSpec) => { instanceFor: string }>;
    let onUnload: Mock<(chunk: ChunkSpec, instance: { instanceFor: string }) => void>;

    beforeEach(() => {
      // 5 chunks de 100px cada: [0,100) [100,200) [200,300) [300,400) [400,500)
      chunks = Array.from({ length: 5 }, (_, i) => ({
        id: `chunk_${i}`,
        index: i,
        width: 100,
        biome: `biome_${i}`,
      }));
      onLoad = vi.fn((chunk: ChunkSpec) => ({ instanceFor: chunk.id }));
      onUnload = vi.fn();
    });

    it('com loadRadius 0, carrega só o chunk atual', () => {
      const streamer = new ChunkStreamer(chunks, { loadRadius: 0, onLoad, onUnload });
      streamer.update(150); // dentro do chunk 1

      expect(streamer.getLoadedIndices()).toEqual([1]);
      expect(streamer.getCurrentChunkIndex()).toBe(1);
      expect(onLoad).toHaveBeenCalledTimes(1);
      expect(onLoad).toHaveBeenCalledWith(chunks[1]);
    });

    it('com loadRadius 1, carrega o chunk atual + 1 pra cada lado (janela de 3)', () => {
      const streamer = new ChunkStreamer(chunks, { loadRadius: 1, onLoad, onUnload });
      streamer.update(250); // dentro do chunk 2 (centro do caminho)

      expect(streamer.getLoadedIndices()).toEqual([1, 2, 3]);
      expect(onLoad).toHaveBeenCalledTimes(3);
    });

    it('satura a janela nas bordas do caminho (não tenta carregar índice negativo ou além do fim)', () => {
      const streamer = new ChunkStreamer(chunks, { loadRadius: 2, onLoad, onUnload });
      streamer.update(50); // dentro do chunk 0, primeiro do caminho

      // Janela pedida seria [-2,-1,0,1,2], mas só [0,1,2] existem.
      expect(streamer.getLoadedIndices()).toEqual([0, 1, 2]);
      expect(onLoad).toHaveBeenCalledTimes(3);
    });

    it('descarrega chunks que saem da janela e carrega os novos ao avançar', () => {
      const streamer = new ChunkStreamer(chunks, { loadRadius: 1, onLoad, onUnload });

      streamer.update(50); // chunk 0 -> janela [0,1]
      expect(streamer.getLoadedIndices()).toEqual([0, 1]);
      onLoad.mockClear();

      streamer.update(150); // chunk 1 -> janela [0,1,2]
      expect(streamer.getLoadedIndices()).toEqual([0, 1, 2]);
      expect(onLoad).toHaveBeenCalledTimes(1); // só o chunk 2 é novo
      expect(onUnload).not.toHaveBeenCalled(); // nada saiu ainda
      onLoad.mockClear();

      streamer.update(450); // chunk 4 -> janela [3,4]
      expect(streamer.getLoadedIndices()).toEqual([3, 4]);
      // 0, 1 e 2 devem ter sido descarregados
      expect(onUnload).toHaveBeenCalledTimes(3);
      const unloadedIds = onUnload.mock.calls.map((call) => call[0].id).sort();
      expect(unloadedIds).toEqual(['chunk_0', 'chunk_1', 'chunk_2']);
    });

    it('é idempotente: chamar update de novo pro mesmo chunk não recarrega nem descarrega nada', () => {
      const streamer = new ChunkStreamer(chunks, { loadRadius: 1, onLoad, onUnload });
      streamer.update(150);
      onLoad.mockClear();
      onUnload.mockClear();

      streamer.update(160); // ainda dentro do chunk 1, mesma janela
      expect(onLoad).not.toHaveBeenCalled();
      expect(onUnload).not.toHaveBeenCalled();
      expect(streamer.getLoadedIndices()).toEqual([0, 1, 2]);
    });

    it('nunca gera o mesmo chunk duas vezes ao oscilar na fronteira entre dois chunks', () => {
      const streamer = new ChunkStreamer(chunks, { loadRadius: 0, onLoad, onUnload });
      streamer.update(99); // chunk 0
      streamer.update(100); // chunk 1
      streamer.update(99); // volta pro chunk 0
      streamer.update(100); // chunk 1 de novo

      // 2 chunks distintos visitados, cada onLoad deve corresponder 1:1 a um onUnload
      // exceto o que ficou carregado por último.
      expect(onLoad.mock.calls.length - onUnload.mock.calls.length).toBe(1);
      expect(streamer.getLoadedIndices()).toEqual([1]);
    });

    it('dispose() descarrega tudo que estava carregado e limpa o estado', () => {
      const streamer = new ChunkStreamer(chunks, { loadRadius: 1, onLoad, onUnload });
      streamer.update(250);
      expect(streamer.getLoadedIndices().length).toBeGreaterThan(0);

      streamer.dispose();

      expect(streamer.getLoadedIndices()).toEqual([]);
      expect(streamer.getCurrentChunkIndex()).toBeNull();
      expect(onUnload).toHaveBeenCalledTimes(3); // os 3 que estavam carregados (1,2,3)
    });
  });

  describe('simulação de uma travessia completa (cadeia real da campanha)', () => {
    // Mesma ordem/nomes de bioma usados hoje em DungeonFlowController.
    // advanceToNextFloor(): safe_house -> gloomy_woods -> fosso_chagas ->
    // catacumbas_martires -> santuario_sangue. Prova que o mecanismo genérico
    // do ChunkStreamer mapeia de forma limpa pra sequência real do jogo.
    const CAMPAIGN_CHUNKS: ChunkSpec[] = [
      { id: 'safe_house', index: 0, width: 800, biome: 'safe_house' },
      { id: 'gloomy_woods', index: 1, width: 1920, biome: 'gloomy_woods' },
      { id: 'fosso_chagas', index: 2, width: 1920, biome: 'fosso_chagas' },
      { id: 'catacumbas_martires', index: 3, width: 1920, biome: 'catacumbas_martires' },
      { id: 'santuario_sangue', index: 4, width: 1920, biome: 'santuario_sangue' },
    ];

    it('carrega cada bioma exatamente uma vez ao longo de toda a travessia (janela = bioma atual + vizinhos)', () => {
      const generated: string[] = [];
      const destroyed: string[] = [];
      const streamer = new ChunkStreamer(CAMPAIGN_CHUNKS, {
        loadRadius: 1,
        onLoad: (chunk) => { generated.push(chunk.biome); return chunk.biome; },
        onUnload: (chunk) => { destroyed.push(chunk.biome); },
      });

      const totalWidth = streamer.getTotalWidth();
      // Anda em passos de 200px do início ao fim do caminho inteiro.
      for (let x = 0; x <= totalWidth; x += 200) {
        streamer.update(x);
      }
      streamer.dispose();

      // Cada bioma foi gerado exatamente 1 vez (nunca regenerado à toa
      // enquanto o jogador ainda estava dentro da janela dele).
      const uniqueGenerated = new Set(generated);
      expect(uniqueGenerated.size).toBe(CAMPAIGN_CHUNKS.length);
      CAMPAIGN_CHUNKS.forEach((c) => {
        const count = generated.filter((b) => b === c.biome).length;
        expect(count).toBe(1);
      });

      // E cada um foi destruído exatamente 1 vez (o dispose() final cobre
      // os que ainda estavam carregados no fim da travessia).
      const uniqueDestroyed = new Set(destroyed);
      expect(uniqueDestroyed.size).toBe(CAMPAIGN_CHUNKS.length);
    });

    it('no meio da travessia, o bioma anterior e o seguinte continuam carregados (continuidade real)', () => {
      const streamer = new ChunkStreamer(CAMPAIGN_CHUNKS, {
        loadRadius: 1,
        onLoad: (chunk) => chunk.biome,
        onUnload: vi.fn(),
      });

      // Posiciona o jogador dentro do chunk 'fosso_chagas' (index 2).
      const fossoStart = 800 + 1920; // safe_house + gloomy_woods
      streamer.update(fossoStart + 500);

      expect(streamer.getCurrentChunkIndex()).toBe(2);
      expect(streamer.getLoadedIndices()).toEqual([1, 2, 3]); // gloomy_woods, fosso_chagas, catacumbas_martires
    });
  });
});
