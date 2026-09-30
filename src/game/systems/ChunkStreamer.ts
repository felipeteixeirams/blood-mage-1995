import { logger } from '../../utils/logger';

/**
 * ChunkStreamer (Fase A — Mundo Contínuo estilo Dungeon Siege)
 *
 * Prova de conceito ISOLADA — ainda não conectada ao jogo real. Contexto:
 * pesquisa sobre a arquitetura original do Dungeon Siege (2002) mostra que
 * o mundo "sem tela de carregamento" era construído a partir de "Siege
 * Nodes" — blocos de terreno modulares de largura fixa, encadeados num
 * caminho linear, carregados/descarregados conforme o jogador avança (o
 * terreno atrás do jogador é destruído, o terreno à frente é gerado antes
 * dele chegar lá).
 *
 * Hoje (ver `DungeonGenerator.generate()` + `DungeonFlowController.
 * advanceToNextFloor()`), cada bioma é UMA área retangular fixa
 * (1920x1440) gerada inteira de uma vez; ao avançar, tudo é destruído e um
 * retângulo novo é gerado do zero. Funciona sem tela de carregamento, mas
 * não é "contínuo" no sentido do Dungeon Siege: não há caminho físico
 * entre biomas, é uma troca abrupta de todo o conteúdo — daí a queixa de
 * "hoje são basicamente um quadrado".
 *
 * `ChunkStreamer` generaliza a ideia dos Siege Nodes: o mundo é uma
 * sequência ORDENADA de "chunks" (segmentos de largura fixa ao longo de um
 * eixo, tipicamente X), cada um pertencendo a um bioma. Dada a posição X
 * do jogador, mantém carregada só uma JANELA de chunks ao redor dele
 * (chunk atual + N à frente + N atrás), chamando `onLoad`/`onUnload`
 * fornecidos por quem usa a classe.
 *
 * Deliberadamente PURO/agnóstico: não sabe nada de Phaser, GameObjects,
 * `DungeonGenerator` ou biomas reais — só gerencia a janela deslizante de
 * índices. Isso o torna testável sem canvas/WebGL (mock de `onLoad`/
 * `onUnload` como `vi.fn()` já basta) e reutilizável tanto para uma futura
 * integração real quanto para prototipar o conceito com segurança antes de
 * arriscar o fluxo do jogo em produção.
 *
 * Integração com `GameScene`/`DungeonGenerator` é uma fase futura separada
 * — este arquivo prova só o mecanismo de streaming em si.
 */

export interface ChunkSpec {
  /** Identificador estável do chunk (não precisa ser sequencial nem numérico). */
  id: string;
  /** Posição de ordem ao longo do caminho — define a sequência linear (pode ter lacunas). */
  index: number;
  /** Largura do chunk em pixels de mundo, ao longo do eixo de progressão. */
  width: number;
  /** Bioma que este chunk representa (repassado a `onLoad`/`onUnload`, nunca interpretado aqui). */
  biome: string;
}

export interface ChunkStreamerOptions<T> {
  /** Quantos chunks manter carregados PARA CADA LADO do atual (janela = 1 + 2×loadRadius). */
  loadRadius: number;
  /** Chamado quando um chunk entra na janela e precisa ser instanciado (ex.: gerar o bioma). */
  onLoad: (chunk: ChunkSpec) => T;
  /** Chamado quando um chunk sai da janela e precisa ser destruído/liberado. */
  onUnload: (chunk: ChunkSpec, instance: T) => void;
}

interface LoadedEntry<T> {
  chunk: ChunkSpec;
  instance: T;
}

export class ChunkStreamer<T> {
  private readonly chunks: ChunkSpec[];
  private readonly startX: number[] = [];
  private readonly loadRadius: number;
  private readonly onLoad: (chunk: ChunkSpec) => T;
  private readonly onUnload: (chunk: ChunkSpec, instance: T) => void;

  private loaded: Map<number, LoadedEntry<T>> = new Map(); // key = ChunkSpec.index
  private currentChunkIndex: number | null = null;

  constructor(chunks: ChunkSpec[], options: ChunkStreamerOptions<T>) {
    if (!chunks || chunks.length === 0) {
      throw new Error('ChunkStreamer requer ao menos 1 chunk');
    }

    // Ordena por `index` — quem chama pode passar em qualquer ordem, a
    // sequência linear do caminho é sempre definida pelo campo `index`.
    this.chunks = [...chunks].sort((a, b) => a.index - b.index);
    this.loadRadius = Math.max(0, options.loadRadius);
    this.onLoad = options.onLoad;
    this.onUnload = options.onUnload;

    let acc = 0;
    for (const chunk of this.chunks) {
      this.startX.push(acc);
      acc += chunk.width;
    }

    logger.info('ChunkStreamer', 'Inicializado', {
      totalChunks: this.chunks.length,
      totalWidth: acc,
      loadRadius: this.loadRadius,
    });
  }

  /** Largura total do caminho (soma de todos os chunks, em pixels de mundo). */
  public getTotalWidth(): number {
    if (this.chunks.length === 0) return 0;
    const last = this.chunks.length - 1;
    return this.startX[last] + this.chunks[last].width;
  }

  /**
   * Mapeia uma posição X de mundo para o `index` do chunk que a contém.
   * Fora dos limites do caminho, satura no primeiro/último chunk (nunca
   * lança) — o jogador nunca deve ficar "sem chunk" por estar 1px além da borda.
   */
  public getChunkIndexAt(worldX: number): number {
    if (worldX <= 0) return this.chunks[0].index;
    for (let i = 0; i < this.chunks.length; i++) {
      const end = this.startX[i] + this.chunks[i].width;
      if (worldX < end) return this.chunks[i].index;
    }
    return this.chunks[this.chunks.length - 1].index;
  }

  /**
   * Atualiza a janela de chunks carregados com base na posição X do
   * jogador. Chama `onLoad` para chunks que entraram na janela e
   * `onUnload` para os que saíram. Idempotente: chamar de novo com uma
   * posição que mapeia pro mesmo chunk atual não recarrega nada.
   */
  public update(playerWorldX: number): void {
    const centerChunkIndex = this.getChunkIndexAt(playerWorldX);
    const centerPos = this.arrayPositionOf(centerChunkIndex);

    const wanted = new Set<number>();
    for (let offset = -this.loadRadius; offset <= this.loadRadius; offset++) {
      const pos = centerPos + offset;
      if (pos >= 0 && pos < this.chunks.length) {
        wanted.add(this.chunks[pos].index);
      }
    }

    // Descarrega o que saiu da janela primeiro (libera antes de gerar o novo).
    for (const [idx, entry] of this.loaded) {
      if (!wanted.has(idx)) {
        this.onUnload(entry.chunk, entry.instance);
        this.loaded.delete(idx);
        logger.info('ChunkStreamer', 'Chunk descarregado', { id: entry.chunk.id, index: idx });
      }
    }

    // Carrega o que entrou na janela.
    for (const idx of wanted) {
      if (!this.loaded.has(idx)) {
        const chunk = this.chunks.find((c) => c.index === idx)!;
        const instance = this.onLoad(chunk);
        this.loaded.set(idx, { chunk, instance });
        logger.info('ChunkStreamer', 'Chunk carregado', { id: chunk.id, index: idx });
      }
    }

    this.currentChunkIndex = centerChunkIndex;
  }

  /** Posição (0-based, na lista já ordenada) do chunk com o `index` dado. */
  private arrayPositionOf(chunkIndex: number): number {
    return this.chunks.findIndex((c) => c.index === chunkIndex);
  }

  /** `index` do chunk onde o jogador está atualmente (`null` antes do primeiro `update`). */
  public getCurrentChunkIndex(): number | null {
    return this.currentChunkIndex;
  }

  /** `index` dos chunks atualmente carregados, ordenados — útil pra inspeção/testes. */
  public getLoadedIndices(): number[] {
    return Array.from(this.loaded.keys()).sort((a, b) => a - b);
  }

  /** Descarrega tudo (ex.: ao destruir a cena / trocar de run). */
  public dispose(): void {
    for (const [, entry] of this.loaded) {
      this.onUnload(entry.chunk, entry.instance);
    }
    this.loaded.clear();
    this.currentChunkIndex = null;
    logger.info('ChunkStreamer', 'Disposed — todos os chunks descarregados', {});
  }
}

export default ChunkStreamer;
