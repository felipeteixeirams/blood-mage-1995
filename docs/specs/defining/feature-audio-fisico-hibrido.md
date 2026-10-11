# Áudio: físico híbrido (SFX e BGM) com fallback sintetizado

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Classe:** C
**Depende de:** ADR 0006, ADR 0008
**Origem:** dividida de discovery-assets-arte-ui-audio-e-sprites (parte 04 e critérios AAS-12..17), 2026-10-11 (ex-UIA, parte 3)
**Estado vs código:** verificado em 2026-10-11 (leitura estática): parcial. Existe: todo o som sintetizado por `src/utils/soundEngine.ts` (29 métodos `play*`, `AudioContext` sob demanda, `sfxVolume`, `bgmVolume`, mute) e `src/utils/bgmSynthesizer.ts` (4 temas); Phaser com `audio.noAudio: true` nas quatro instâncias de `Phaser.Game`; 5 WAVs em `public/audio_samples/` referenciados só por `SoundTestModal.tsx`; `public/assets/audio/` vazio. Falta: carga de áudio físico (nenhum `decodeAudioData` nem `new Audio` em `src/`), `HybridSoundEngine`, telemetria de falha de áudio. Nenhum critério abaixo está implementado. Ver [audio](../../gameplay/audio.md).

## Contexto
Modelo híbrido: arquivo quando existe, síntese Web Audio atual como fallback sob a mesma chave. Tudo passa pelo `soundEngine` (ADR 0006).

## Objetivo
Se aprovada, SFX de alta prioridade (conjuração, impacto de foice, rugidos) e a música migram gradualmente para arquivos, sem perder o som sintetizado como fallback.

## Decisões de que depende
| ADR | Assunto | Status |
|---|---|---|
| [0006](../../decisions/0006-audio-e-conquistas.md) | Áudio só pelo `soundEngine`; reabrir `noAudio` no Phaser (opção C) está fora de escopo | Proposta |
| [0008](../../decisions/0008-endpoint-api-log.md) | `/api/log` usado pelo `logger` | Aprovada |

## Fatos técnicos verificados
Fatos de áudio no "Estado vs código" acima (leitura de `soundEngine.ts`, `bgmSynthesizer.ts`, `public/audio_samples/`, `public/assets/audio/`, verificado em 2026-10-11).

## Decisões a confirmar
Numeração original (preservada).

| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| 7 | Estratégia de áudio (ex-UIA 7) | A) BGM física e SFX críticos físicos, resto sintetizado; B) tudo físico; C) nada físico | A: o discovery de evolução gráfica recomenda manter SFX sintetizados |
| 8 | Como tocar a BGM física (ex-UIA 8) | A) `HTMLAudioElement` por streaming; B) mesmo `AudioContext` via `MediaElementSource` | B: preserva volume, mute e filtros do mixer; A foge do mixer |

## Escopo
Se aprovado:
- SFX: ao pedir o som de uma chave, tentar o arquivo sob demanda (cache de `AudioBuffer` por chave); se faltar ou falhar, executar a síntese atual da mesma chave.
- BGM: arquivo em loop (1m30s a 2m) por streaming; se falhar, o `bgmSynthesizer` segue como trilha.
- Falha de áudio físico vai ao `logger` e ao Sentry (a de imagem é de [feature-assets-carga-atlas-e-normal-maps](feature-assets-carga-atlas-e-normal-maps.md)).
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
- Gravar ou licenciar o áudio ([discovery-assets-orcamento-licencas-e-creditos](discovery-assets-orcamento-licencas-e-creditos.md)).
- Trocar a síntese dos SFX que já funcionam sem arquivo (ver decisão 7).
- Reabrir `noAudio` no Phaser.

## Arquivos e contratos
- Alterar: `src/utils/soundEngine.ts` (carga e cache de buffers; reuso do `AudioContext` e do ganho mestre, sem segundo contexto); `src/utils/bgmSynthesizer.ts` só se a BGM física for aprovada.
- Criar: `public/assets/audio/sfx/<chave>.mp3` e `public/assets/audio/bgm/<chave>.mp3` (binários).
- Atualizar no mesmo commit: [audio](../../gameplay/audio.md), [telemetry-and-logging](../../operations/telemetry-and-logging.md) e `Verificado em`.
- Não tocar: temas e sequenciador procedurais, `GameScene.ts`.
- Contrato: a chave de SFX é a do método `play*` correspondente; áudio físico respeita `sfxVolume`, `bgmVolume` e mute; arquivo ausente nunca gera exceção visível.

## Critérios de aceite
Prefixo `AUD`; ID antigo entre parênteses. Provisórios.
- **AUD-1** (AAS-12, UIA-3) Quando o jogador aciona o SFX de uma chave que tem arquivo físico, o soundEngine deve tocar o buffer do arquivo (provisório).
- **AUD-2** (AAS-13, UIA-4) Se o arquivo de SFX falta ou não decodifica, então o soundEngine deve executar a síntese da mesma chave (provisório).
- **AUD-3** (AAS-14, UIA-5) Se o arquivo de SFX falta ou não decodifica e o Sentry está inicializado, então o soundEngine deve enviar a chave ao Sentry (provisório).
- **AUD-4** (AAS-15, UIA-6) Enquanto o jogo está mudo, o soundEngine não deve emitir som de arquivo físico (provisório).
- **AUD-5** (AAS-16, UIA-7) Quando a trilha física de um tema existe, o soundEngine deve tocá-la em loop (provisório).
- **AUD-6** (AAS-17, UIA-8) Se a trilha física falha, então o bgmSynthesizer deve tocar o tema procedural (provisório).

## Plano de verificação
| Critério | Como verificar |
|---|---|
| AUD-1 a AUD-4 | Teste unitário em `src/utils/soundEngine.test.ts` com `AudioContext` e `fetch` simulados |
| AUD-5, AUD-6 | Teste unitário do soundEngine e do bgmSynthesizer; audição: não validado, precisa de playtest humano |

## Questões em aberto
Numeração original entre parênteses.
1. (Q8) Cache negativo: se o arquivo de áudio falta, evitar nova tentativa de download a cada disparo.
2. (Q11) Conflito a reconciliar: CAR-6 (imagem, [spec de carga](feature-assets-carga-atlas-e-normal-maps.md)) envia chave, tipo e URL ao Sentry; AUD-3 (áudio) só a chave. Enviar tipo e URL também no áudio, com as mesmas tags `system: 'asset-loader'`?

## Pendências para promover a backlog
- Discovery: sem aprovação do responsável.
- Aprovar as decisões 7 e 8 e o ADR 0006 (0008 já aprovado).
- Fechar as questões 1 e 2 (reconciliar com CAR-6) e trocar os formatos "propostos" por aprovados.
- Definir a origem e a licença do áudio ([orçamento e licenças](discovery-assets-orcamento-licencas-e-creditos.md); Q10 em [direção artística](discovery-assets-direcao-artistica-e-escopo-visual.md)).

## Referências
- [Áudio](../../gameplay/audio.md), [ADR 0006](../../decisions/0006-audio-e-conquistas.md), Atmosfera e tensão, [bug de áudio bgmGain e temas](bug-audio-bgmgain-e-temas.md), [evolução gráfica](feature-grafico-efeitos-restantes.md)
