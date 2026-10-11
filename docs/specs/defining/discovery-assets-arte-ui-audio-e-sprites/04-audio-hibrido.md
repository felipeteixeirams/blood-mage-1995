# Assets de arte, UI, áudio e sprites: áudio físico híbrido (parte 4)

**Mestre:** [discovery-assets-arte-ui-audio-e-sprites](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Origem:** consolidada de discovery-ui-e-assets-externos, parte 3 (2026-10-11)
**Estado vs código:** verificado em 2026-10-11 (leitura estática): parcial. Existe: todo o som sintetizado por `src/utils/soundEngine.ts` (29 métodos `play*`, `AudioContext` sob demanda, `sfxVolume`, `bgmVolume`, mute) e `src/utils/bgmSynthesizer.ts` (4 temas); Phaser com `audio.noAudio: true` nas quatro instâncias de `Phaser.Game`; 5 WAVs em `public/audio_samples/` referenciados só por `SoundTestModal.tsx`; `public/assets/audio/` vazio. Falta: carga de áudio físico (nenhum `decodeAudioData` nem `new Audio` em `src/`), `HybridSoundEngine`, telemetria de falha de áudio. Ver [audio](../../../gameplay/audio.md).

Parte 4 de 6. Índice: [README](README.md).

## Contexto
Modelo híbrido: arquivo quando existe, síntese Web Audio atual como fallback sob a mesma chave. Tudo passa pelo `soundEngine` (ADR 0006).

## Objetivo
Se aprovada, SFX de alta prioridade (conjuração, impacto de foice, rugidos) e a música migram gradualmente para arquivos, sem perder o som sintetizado como fallback.

## Decisões de que depende
[ADR 0006](../../../decisions/0006-audio-e-conquistas.md) (Proposta): áudio só pelo `soundEngine`; reabrir `noAudio` no Phaser (opção C) está fora de escopo.

## Fatos técnicos verificados
Fatos de áudio no "Estado vs código" acima (leitura de `soundEngine.ts`, `bgmSynthesizer.ts`, `public/audio_samples/`, `public/assets/audio/`, verificado em 2026-10-11).

## Decisões a confirmar
| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| 7 | Estratégia de áudio (ex-UIA 7) | A) BGM física e SFX críticos físicos, resto sintetizado; B) tudo físico; C) nada físico | A: o discovery de evolução gráfica recomenda manter SFX sintetizados |
| 8 | Como tocar a BGM física (ex-UIA 8) | A) `HTMLAudioElement` por streaming; B) mesmo `AudioContext` via `MediaElementSource` | B: preserva volume, mute e filtros do mixer; A foge do mixer |

## Escopo
Se aprovado:
- SFX: ao pedir o som de uma chave, tentar o arquivo sob demanda (cache de `AudioBuffer` por chave); se faltar ou falhar, executar a síntese atual da mesma chave.
- BGM: arquivo em loop (1m30s a 2m) por streaming; se falhar, o `bgmSynthesizer` segue como trilha.
- Falha de áudio físico vai ao `logger` e ao Sentry (a de imagem é da [parte 2](02-carga-atlas-e-normal-maps.md)).
- Formatos propostos: SFX `.mp3` mono, 22.050 ou 32.000 Hz, CBR 64 kbps (10 a 30 KB); BGM `.mp3` estéreo, 44.100 Hz, 96 ou 128 kbps.

Esboço do original (não é código aprovado; strict proíbe `any` e o Sentry vem de `@sentry/react`):

```typescript
async playSFX(key: string, fallbackSynthFn: () => void): Promise<void> {
  try {
    const cached = this.sfxCache.get(key);
    if (cached) { this.playBuffer(cached); return; }
    const response = await fetch(`/assets/audio/sfx/${key}.mp3`);
    if (!response.ok) throw new Error(`SFX file not found: ${key}`);
    const buffer = await this.audioContext.decodeAudioData(await response.arrayBuffer());
    this.sfxCache.set(key, buffer);
    this.playBuffer(buffer);
  } catch (error) {
    logger.warn(`Falha no SFX físico '${key}'. Fallback procedural.`, error);
    fallbackSynthFn();
  }
}
```

## Fora de escopo
- Gravar ou licenciar o áudio (parte 5).
- Trocar a síntese dos SFX que já funcionam sem arquivo (ver decisão 7).
- Reabrir `noAudio` no Phaser.

## Arquivos e contratos
- Alterar: `src/utils/soundEngine.ts` (carga e cache de buffers; reuso do `AudioContext` e do ganho mestre, sem segundo contexto); `src/utils/bgmSynthesizer.ts` só se a BGM física for aprovada.
- Criar: `public/assets/audio/sfx/<chave>.mp3` e `public/assets/audio/bgm/<chave>.mp3` (binários).
- Atualizar no mesmo commit: [audio](../../../gameplay/audio.md), [telemetry-and-logging](../../../operations/telemetry-and-logging.md) e `Verificado em`.
- Não tocar: temas e sequenciador procedurais, `GameScene.ts`.
- Contrato: a chave de SFX é a do método `play*` correspondente; áudio físico respeita `sfxVolume`, `bgmVolume` e mute; arquivo ausente nunca gera exceção visível.

Critérios: [parte 6](06-criterios-e-pendencias.md) (`AAS-12` a `AAS-17`).

## Referências
- [Áudio](../../../gameplay/audio.md), [ADR 0006](../../../decisions/0006-audio-e-conquistas.md), [Atmosfera e tensão](../feature-ui-atmosfera-e-tensao.md), [bug de áudio bgmGain e temas](../bug-audio-bgmgain-e-temas.md), [evolução gráfica](../discovery-grafico-evolucao-pendente.md)
