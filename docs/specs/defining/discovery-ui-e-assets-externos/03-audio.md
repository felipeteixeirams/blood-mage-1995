# Evolução de UI e assets externos góticos: transição de áudio (parte 3)

**Mestre:** [discovery-ui-e-assets-externos](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Estado vs código:** verificado em 2026-10-11 (leitura estática): parcial. Existe: todo o som sintetizado por `src/utils/soundEngine.ts` (29 métodos `play*`, `AudioContext` criado sob demanda, volumes `sfxVolume` e `bgmVolume`, mute) e `src/utils/bgmSynthesizer.ts` (4 temas); Phaser com `audio.noAudio: true` nas quatro instâncias de `Phaser.Game`; 5 WAVs em `public/audio_samples/` referenciados só por `SoundTestModal.tsx`; `public/assets/audio/` vazio. Falta: carga de áudio físico no jogo (nenhum `decodeAudioData` nem `new Audio` em `src/`), `HybridSoundEngine`, telemetria de falha de áudio. Ver [audio](../../../gameplay/audio.md).

Parte 3 de 6. Índice das partes: [README](README.md).

## Escopo
Se aprovado, SFX de alta prioridade (conjuração, impacto de foice, rugidos) e a música migram gradualmente para arquivos, com a síntese Web Audio como fallback:
- Para SFX: ao pedir o som de uma chave, tentar o arquivo sob demanda (cache de `AudioBuffer` por chave); se faltar ou falhar, executar a síntese atual da mesma chave.
- Para BGM: arquivo em loop (1m30s a 2m) por streaming; se falhar, o `bgmSynthesizer` continua sendo a trilha.
- Falha de áudio físico é registrada no `logger` e enviada ao Sentry (a telemetria de imagem é de [AES](../discovery-assets-externos-e-sprites.md)).
- Formatos propostos: SFX `.mp3` mono, 22.050 ou 32.000 Hz, CBR 64 kbps (10 a 30 KB cada); BGM `.mp3` estéreo, 44.100 Hz, 96 ou 128 kbps.

Esboço conceitual do original (não é código aprovado; TypeScript strict proíbe `any` e o `Sentry` não é global, é importado de `@sentry/react`):

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
- Gravar ou licenciar o áudio (licenças: [parte 5](05-licencas-repositorios-plano.md)).
- Trocar a síntese dos SFX que já funcionam bem sem arquivo (o discovery de [evolução gráfica](../discovery-evolucao-grafica-avancada/README.md) propõe manter SFX 100% sintetizados; ver decisão 1).
- Reabrir `noAudio` no Phaser (ADR 0006, opção C).

## Arquivos e contratos
- Alterar: `src/utils/soundEngine.ts` (carga e cache de buffers; reuso do `AudioContext` e do ganho mestre existentes, sem segundo contexto), `src/utils/bgmSynthesizer.ts` apenas se a BGM física for aprovada.
- Criar: `public/assets/audio/sfx/<chave>.mp3` e `public/assets/audio/bgm/<chave>.mp3` (binários, nunca editar com ferramentas de texto).
- Atualizar no mesmo commit: `docs/gameplay/audio.md`, `docs/operations/telemetry-and-logging.md` e `Verificado em`.
- Não tocar: temas e sequenciador procedurais existentes, `GameScene.ts`.
- Contrato: a chave de SFX é a mesma do método `play*` correspondente; áudio físico respeita `sfxVolume`, `bgmVolume` e mute; ausência do arquivo nunca gera exceção visível ao jogador.

Critérios, verificação e pendências: [parte 6](06-criterios-e-pendencias.md).

## Referências
- [Áudio](../../../gameplay/audio.md), [ADR 0006](../../../decisions/0006-audio-e-conquistas.md)
- [Atmosfera e tensão](../feature-atmosfera-e-tensao.md), [bug de áudio bgmGain e temas](../bug-audio-bgmgain-e-temas.md)
