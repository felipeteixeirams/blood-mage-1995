# Evolução gráfica avançada: Eixos B e C, assets externos e áudio (parte 3)

**Mestre:** [discovery-evolucao-grafica-avancada](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Estado vs código:** verificado em 2026-10-11 (leitura estática). Eixo B: manifesto e fallback procedural por chave existem (`src/game/assets/assetManifest.ts`), carga por cena, atlas e compressão não. Eixo C: SFX 100% sintetizados (`src/utils/soundEngine.ts`), BGM procedural (`src/utils/bgmSynthesizer.ts`), mixer parcial (HP <= 25% sobe o BPM em 12% e liga batimento; estática espacial com `StereoPannerNode`), sem trilha composta e sem arquivo de áudio no jogo. Falta: tudo o que as specs dos eixos listam.

Parte 3 de 5. Índice das partes: [README](README.md).

## Escopo
Esta discovery **não** especifica B nem C para não duplicar. Quem é dono de cada um:

| Eixo | Dono | Nota |
|---|---|---|
| B. Pipeline de assets externos | [discovery-assets-externos-e-sprites](../discovery-assets-externos-e-sprites.md) (AES) | loader por cena, atlas, compressão, substituição por chave, telemetria |
| B. Limites de tamanho, formatos de arte e orçamento | [UIA partes 1 e 4](../discovery-ui-e-assets-externos/04-orcamento-e-telemetria.md) | resoluções e 2,5 MB |
| C. Trilha composta e áudio físico | [UIA parte 3](../discovery-ui-e-assets-externos/03-audio.md) | SFX físicos e BGM por arquivo |

Resta aqui, se aprovado, só o que as duas specs não cobrem do Eixo C (mixer dinâmico sobre a Web Audio):
- Intensificar a percussão quando o HP está em 30% ou menos (hoje: BPM x1,12 e batimento a 25%).
- Aplicar distorção ao som quando um chefe entra em `frenzy`.
- Áudio espacial por `StereoPanner` ou HRTF para a posição de ameaças (hoje só a estática espacial usa `StereoPanner`).
- SFX novos sintetizados (custo baixo, estimado em 1 a 2 dias, não verificado).

Formatos propostos pelo original (referência, sem aprovação): sprite e UI em PNG com atlas JSON; fundos em WebP com JPG de fallback; spritesheet animado com JSON; esqueleto em DragonBones JSON; vídeo em WebM com MP4 de fallback; SFX em OGG ou WebM mono com MP3 de fallback; música em Opus ou M4A estéreo de 96 a 192 kbps com MP3 de fallback (iOS não toca OGG, conforme o original, não verificado). O original cita pastas `src/assets/sprites/`, `audio/`, `video/`, `BitmapText` no lugar de `Text`, `assetsInlineLimit` e `build.assetsDir`; nada disso foi verificado nem decidido.

Estimativas do original para o Eixo B (loader por cena 1 dia, script de compressão 1 dia, substituição por chave meio dia) e para a mixagem dinâmica (2 dias) não foram verificadas.

## Fora de escopo
- Qualquer item de B (AES) e de trilha e áudio físico (UIA).
- Fontes e licenças de música (decisão de produção; [UIA parte 5](../discovery-ui-e-assets-externos/05-licencas-repositorios-plano.md)).

## Arquivos e contratos
- Alterar (mixer dinâmico): `src/utils/soundEngine.ts`, `src/utils/bgmSynthesizer.ts`, disparo em `src/game/systems/` (não acumular em `GameScene.ts`).
- Atualizar no mesmo commit: `docs/gameplay/audio.md` e `Verificado em`.
- Contrato: efeitos respeitam mute, `sfxVolume` e `atmosphereEffectsEnabled`; nenhum nó de áudio criado por frame sem reuso.

Critérios, verificação e pendências: [parte 5](05-criterios-e-pendencias.md).
