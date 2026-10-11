# Proposta de Discovery — Evolução de UI e Assets Externos Góticos (Pixel Art) (parte 3: Eixo C: transição gradual de áudio)

**Mestre:** [discovery-ui-e-assets-externos](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente

**Estado vs código:** verificado em 2026-10-10 (leitura estática): parcial. Existe: síntese procedural de áudio como única fonte sonora (`src/utils/soundEngine.ts`, `src/utils/bgmSynthesizer.ts`, só `AudioContext`), `src/utils/telemetry.ts` e `src/utils/logger.ts`, `Sentry.init` em `src/main.tsx` (condicionado a DSN), fontes locais em `public/fonts/`, imagens de UI em `src/assets/ui/` e `public/assets/ui/` (usadas por `SettingsScene.ts` e `RecordsScene.ts`), `border-image` com SVG inline no `hud/DialogueModal.tsx`, cores de raridade em `InventoryModal.tsx`, tint de elite em `Enemy.ts`. Não existe: `HybridSoundEngine`/carga de áudio físico (nenhum `decodeAudioData` nem `new Audio`; `public/assets/audio` só tem `.gitkeep`), classe `.gothic-panel` e `gothic_border_slice.png`, `AssetLoader` centralizado, reporte de `loaderror` ao Sentry (o loader usa só `logger`), camadas de equipamento no sprite do jogador, retratos de NPC em pixel art (o diálogo usa ícones Lucide), tela de Créditos, sprites de inimigos/NPCs/tiles externos, medição do orçamento de 2,5 MB.

Parte 3 de 5. Índice das partes: [parte 1](01-visao-e-escopo-visual.md).

---

## 4. Eixo C - Transição Gradual de Áudio (SFX e BGM)

Atualmente, o `soundEngine.ts` sintetiza ondas senoidais, dentes-de-serra e ruídos programáticos via Web Audio API. Para evoluir a experiência auditiva para algo digno de horror medieval, propõe-se um modelo de carregamento gradativo de arquivos físicos de áudio.

### 4.1. Estratégia de Transição Híbrida do SoundEngine
Os efeitos de alta prioridade (conjuração de magias, impactos de foice, rugidos de monstros) e músicas de fundo serão migrados gradualmente para arquivos compactados (`.mp3` ou `.ogg`), mantendo o gerador Web Audio como fallback silencioso para evitar erros de execução.

```typescript
// Estrutura conceitual do SoundEngine Híbrido
import { logger } from './logger';

export class HybridSoundEngine {
  private audioContext: AudioContext;
  private sfxCache: Map<string, AudioBuffer> = new Map();
  private bgmElement: HTMLAudioElement | null = null;

  constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }

  /**
   * Tenta tocar um arquivo de som físico. Caso falhe ou não exista, ativa a síntese via Web Audio.
   */
  async playSFX(key: string, fallbackSynthFn: () => void): Promise<void> {
    try {
      const cached = this.sfxCache.get(key);
      if (cached) {
        this.playBuffer(cached);
        return;
      }

      // Tenta carregar o arquivo sob demanda (lazy-loading)
      const url = `/assets/audio/sfx/${key}.mp3`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`SFX file not found: ${key}`);

      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

      this.sfxCache.set(key, audioBuffer);
      this.playBuffer(audioBuffer);
    } catch (error) {
      logger.warn(`Falha ao tocar SFX físico '${key}'. Ativando fallback procedural.`, error);

      // Envia telemetria do erro silencioso
      this.reportAudioErrorToSentry(key, error);

      // Roda o sintetizador antigo de ondas
      fallbackSynthFn();
    }
  }

  /**
   * Executa streaming de música longa diretamente por elemento HTMLAudio
   */
  playBGM(key: string, volume: number = 0.4): void {
    if (this.bgmElement) {
      this.bgmElement.pause();
    }

    this.bgmElement = new Audio(`/assets/audio/bgm/${key}.mp3`);
    this.bgmElement.loop = true;
    this.bgmElement.volume = volume;

    this.bgmElement.play().catch(error => {
      logger.warn(`Erro no streaming da trilha ${key}. Usando silêncio de segurança.`, error);
    });
  }

  private playBuffer(buffer: AudioBuffer): void {
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioContext.destination);
    source.start(0);
  }

  private reportAudioErrorToSentry(key: string, error: any): void {
    // Integração com Sentry para logs silenciosos em produção
    if ((window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        tags: { system: 'audio-engine', asset_key: key },
        extra: { message: `Audio asset failed to stream or load. Procedural fallback activated.` }
      });
    }
  }
}
```

### 4.2. Diretrizes de Compactação e Formatos de Áudio
Para manter o carregamento instantâneo do PWA, o áudio deve ser altamente otimizado:
* **Efeitos Sonoros (SFX):** Formato `.mp3` mono, taxa de amostragem reduzida para **22.050 Hz** ou **32.000 Hz**, taxa de bits constante (CBR) de **64 kbps**. Essa compressão combina perfeitamente com a estética rústica e crua de meados dos anos 90, pesando apenas de 10 KB a 30 KB por arquivo de som.
* **Trilhas de Fundo (BGM):** Formato `.mp3` estéreo, taxa de amostragem de **44.100 Hz**, taxa de bits de **96 kbps** ou **128 kbps**. As faixas devem ser curtas (loops de 1m30s a 2m) e tocadas via streaming (`new Audio()`), evitando carregar todo o arquivo na memória RAM do dispositivo.
