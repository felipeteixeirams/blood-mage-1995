# Mixer dinâmico de áudio

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Estado vs código:** verificado em 2026-10-11 (leitura estática): SFX 100% sintetizados e BGM procedural; mixer parcial (HP <= 25% sobe o BPM em 12% e liga batimento; estática espacial com `StereoPannerNode`). Faltam: percussão mais intensa com HP <= 30%, distorção em `frenzy`, áudio espacial de ameaças e SFX novos.
**Origem:** dividida de `discovery-grafico-evolucao-pendente` (removida em 2026-10-11): Eixo C restante (GEP-12 a GEP-14, decisão 8). Os efeitos gráficos ficaram em [feature-grafico-efeitos-restantes](feature-grafico-efeitos-restantes.md).

## Contexto
O mixer dinâmico da Web Audio é a parte do Eixo C que as outras specs não cobrem. O resto do C (áudio físico, trilha composta) pertence a [discovery-ui-e-assets-externos](discovery-assets-direcao-artistica-e-escopo-visual.md) ([UIA parte 3](feature-audio-fisico-hibrido.md)). Satélites: [áudio](../../gameplay/audio.md), [desempenho](../../engineering/performance.md). Bug relacionado: [bug-audio-bgmgain-e-temas](bug-audio-bgmgain-e-temas.md).

## Objetivo
Se aprovada, entregar no `soundEngine` o mixer dinâmico: percussão mais intensa com HP baixo, distorção em `frenzy`, áudio espacial de ameaças e SFX novos sintetizados.

## Decisões de que depende
| ADR | Assunto | Status |
|---|---|---|
| [0006](../../decisions/0006-audio-e-conquistas.md) | Áudio só pelo `soundEngine` (mixer dinâmico) | Proposta |

## Fatos técnicos verificados
| Afirmação | Fonte | Verificado em |
|---|---|---|
| SFX 100% sintetizados, BGM procedural; mixer parcial (HP <= 25% sobe o BPM em 12% e liga batimento; estática espacial com `StereoPannerNode`) | `src/utils/soundEngine.ts`, `src/utils/bgmSynthesizer.ts` | 2026-10-11 |

## Decisões a confirmar
| # | Decisão (ID antigo) | Opções | Recomendação |
|---|---|---|---|
| 1 | Mixer dinâmico de áudio: percussão em HP <= 30%, distorção em `frenzy`, áudio espacial de ameaças, SFX novos (8) | A) adotar; B) não | Sem recomendação firme na origem: decidir após ADR 0006 |

## Escopo
**Mixer dinâmico** (item 9 do escopo da origem): percussão mais intensa com HP <= 30% (hoje BPM x1,12 e batimento a 25%); distorção quando um chefe entra em `frenzy`; áudio espacial (`StereoPanner` ou HRTF) para a posição de ameaças; SFX novos sintetizados.

## Fora de escopo
Áudio físico e trilha composta ([UIA parte 3](feature-audio-fisico-hibrido.md)); fontes e licenças de música; mudar combate ou balance; planejar fases e datas; efeitos gráficos.

## Arquivos e contratos
- **Alterar:** `src/utils/soundEngine.ts`, `src/utils/bgmSynthesizer.ts`; disparo do mixer em `src/game/systems/`.
- **Atualizar no mesmo commit:** `docs/gameplay/audio.md` e `Verificado em`.
- **Não tocar sem ler `docs/engineering/risky-files.md`:** `GameScene.ts`, `Player.ts`, `Enemy.ts`; extrair lógica nova para `src/game/systems/`.
- **Contratos:** efeitos de áudio respeitam mute, `sfxVolume` e `atmosphereEffectsEnabled`; nenhum nó de áudio por frame sem reuso. Valores (limiares, intensidades): em aberto.

## Critérios de aceite
Todos provisórios e dependentes de decisão de produto. Prefixo `MXA` (ID antigo `GEP` entre parênteses, com o `EGA` da origem anterior).
- **MXA-1** (GEP-12, EGA-12) Quando o HP do jogador chega a 30% ou menos, o soundEngine deve intensificar a percussão da BGM (provisório; só se o mixer for aprovado).
- **MXA-2** (GEP-13, EGA-13) Quando um chefe entra em `frenzy`, o soundEngine deve aplicar distorção ao som (provisório; idem).
- **MXA-3** (GEP-14, EGA-14) Enquanto o jogo está mudo, o soundEngine não deve produzir os efeitos de mixer dinâmico (provisório; idem).

## Plano de verificação
| Critério | Como verificar |
|---|---|
| MXA-1 a MXA-3 | `src/utils/soundEngine.test.ts`; sensação: não validado, precisa de playtest humano |

## Questões em aberto
- Áudio espacial: `StereoPanner` ou HRTF; lista dos SFX novos; limiares e intensidades.
- Estimativas de esforço do original não verificadas (mixer 2 dias; SFX novos 1 a 2 dias).
- Não validado: precisa de playtest humano. Sensação da percussão, da distorção e do áudio espacial.

## Pendências para promover a backlog
- Discovery: depende de decisão de produto; sem aprovação do responsável.
- Aprovar a decisão 1 e o ADR 0006.
- Fechar as questões em aberto (espacialização, lista de SFX, valores).

## Referências
- [Áudio](../../gameplay/audio.md), [desempenho](../../engineering/performance.md)
- [ADR 0006](../../decisions/0006-audio-e-conquistas.md)
- [UIA](discovery-assets-direcao-artistica-e-escopo-visual.md), [UIA parte 3](feature-audio-fisico-hibrido.md), [bug de áudio bgmGain e temas](bug-audio-bgmgain-e-temas.md)
