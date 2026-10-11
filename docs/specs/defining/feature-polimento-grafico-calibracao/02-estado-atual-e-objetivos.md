# Polimento gráfico por calibração dos sistemas existentes (parte 2: arquivos, contratos e estado atual)

**Mestre:** [feature-polimento-grafico-calibracao](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Estado vs código:** verificado em 2026-10-11 (leitura estática; `node_modules` ausente, nada executado): parcial. Existem as correções de integração das Frentes A e B e os sistemas com testes: `LightingPolish.applyBloomFilter` (`src/game/systems/LightingPolish.ts`) chama `enableFilters()` uma vez por sprite, limpa o Glow anterior antes de reaplicar, remove no evento `destroy` e em `cleanup()`, com `MAX_ACTIVE_BLOOM_TARGETS = 16` e Glow desligado por `postProcessingEnabled === false` ou `lowPerformanceParticles`; `PostFXSystem.createFilters` usa `camera.filters.external` (com `internal` como alternativa) e guarda `activeFloorDepth`; `PostFXSystem.test.ts` cobre callbacks tardios de `effectCriticalDamage`/`effectInfection`; `AdvancedParticles.emitDirectional` restaura a rotação (teste existe). Faltam: validar `filters.external` no Phaser 4.2.1, Glow em WebGL real, remoção do Glow ao reciclar sem destruir, calibração visual das Frentes C a H, testes de zona líquida do `ReflectionSystem` (só 2 testes), validação antes/depois e orçamento de performance medido.

Parte 2 de 8. Índice: [README](README.md).

## Arquivos e contratos
**Alterar (somente parâmetros, lifecycle e testes):** `src/game/systems/{LightingSystem,LightingPolish,PostFXSystem,AtmosphereSystem,ShadowSystem,ReflectionSystem,AdvancedParticles,TerrainDetailFactory}.ts`, `src/game/shaders/AtmosphericTreeShader.ts`, `src/game/scenes/GameScene.ts` (ordem de atualização, sem acumular lógica; ver `docs/engineering/risky-files.md`) e os testes `*.test.ts` correspondentes.
**Atualizar no mesmo commit:** `docs/gameplay/lighting-and-effects.md` e `Verificado em`.
**Não tocar:** APIs públicas de `PostFXSystem` (`setEnabled`, `reset`, `setBiome`, `setVignette`, `setDisplacement`, `setTint`), `MAX_ACTIVE_BLOOM_TARGETS = 16`, texturas e emissores existentes; nenhum asset novo.

**Contratos (valores atuais, a preservar):**
| Item | Valor atual |
|---|---|
| Profundidades | sombra 8; reflexo 12; entidades 20 ou mais; ground fog 750; upper haze 1995; clima 1996 |
| Glow | no máximo 16 alvos; desligado com `postProcessingEnabled === false` ou `lowPerformanceParticles` |
| Glow por raridade | common 0x94a3b8/0,35; rare 0x3b82f6/0,65; epic 0xa855f7/0,85; legendary 0xf59e0b/1,1; portal 0x06b6d4/0,95 |
| Sombra | `footY = y + altura * 0.38` |
| Emissores cobertos | `blood_splatter`, `bone_dust`, `acid_splash`, `spectral_burst`, `critical_hit`, `atmospheric_fog`, `torch_embers`, `forest_pollen`, `spell_trail` |

Valores calibrados novos: "a definir" (decisão 2 da parte 1); constam como questão em aberto na parte 8.

## Anexo: estado atual e objetivos de qualidade
## 3. Estado Atual e Pontos Identificados

### 3.1 Sistemas existentes considerados fonte da implementação

| Sistema | Responsabilidade atual |
|---|---|
| `LightingSystem.ts` | Light2D, luz do jogador, tochas, braseiros e cascata por profundidade |
| `LightingPolish.ts` | Glow por objeto, pulsação, impactos críticos e luzes de destaque |
| `PostFXSystem.ts` | Vignette, ColorMatrix, displacement, tint e efeitos temporários |
| `AtmosphereSystem.ts` | Ground fog, upper haze e clima por bioma |
| `ShadowSystem.ts` | Sombras de contato e projeções orientadas pela luz mais próxima |
| `ReflectionSystem.ts` | Reflexos invertidos em zonas de sangue e água |
| `AdvancedParticles.ts` | Emissores de sangue, poeira óssea, ácido, espectral, crítico e ambiente |
| `AtmosphericTreeShader.ts` | Vento, AO aproximada, iluminação direcional e fog das árvores |
| `TerrainDetailFactory.ts` | Texturas e detalhes procedurais assados |
| `GameScene.ts` | Ordem de renderização, integração e atualização dos sistemas |

### 3.2 Problemas e riscos observados

1. **Glow em runtime ainda não confirmado**  
   `LightingPolish.applyBloomFilter()` já chama `enableFilters()`; falta confirmar em WebGL real que o Glow aparece e é removido também ao reciclar sprites de pool (hoje só em `destroy` e `cleanup()`).

2. **Escopo dos filtros de câmera precisa ser validado**  
   `PostFXSystem` usa `camera.filters.external` com `internal` como alternativa. Falta confirmar, contra o Phaser 4.2.1 instalado, que essa é a coleção correta para efeitos de tela inteira. Os testes atuais reproduzem a API usada, portanto implementação e mocks precisam evoluir juntos.

3. **Gradação de bioma após tint temporário**  
   `PostFXSystem` guarda `activeFloorDepth` e `applyBiomeMatrix` o usa por padrão; falta validar visualmente após dano, medo e level-up.

4. **Efeitos temporários podem competir entre si**  
   Vignette, tint e displacement de dano, medo, level-up, boss e baixa vida podem ser acionados em sequência. A calibração deve impedir que uma transição deixe estado residual ou neutralize uma transição mais importante.

5. **A iluminação atual pode perder contraste**  
   A cascata ambiente, as luzes pontuais, o Glow e a ColorMatrix podem somar energia visual demais em pontos específicos e lavar a leitura do terreno ou das silhuetas.

6. **A atmosfera precisa continuar subordinada ao gameplay**  
   Ground fog, upper haze e clima já possuem proteção de visibilidade. Qualquer ajuste deve preservar a prioridade de leitura de inimigos, projéteis, telégrafos, itens e jogador.

7. **Sombras e reflexos são visualmente úteis, mas sensíveis a pequenos offsets**  
   A posição dos pés, profundidade, escala vertical, alpha e rotação precisam ser calibrados para não parecerem flutuar, deslizar ou atravessar o piso.

8. **Emissores atuais precisam de mais consistência**  
   Os emissores existentes usam configurações diferentes de velocidade, gravidade, escala, alpha e lifespan. O trabalho é harmonizar o comportamento e o timing, não criar novas famílias de efeitos.

9. **O custo por frame deve continuar controlado**  
   A quantidade de Glow, luzes e partículas já é limitada em vários pontos. A qualidade deve vir de melhores parâmetros e lifecycle, não de mais instâncias simultâneas.

---

## 4. Objetivos de Qualidade Visual

Ao final da execução, a cena deve atender aos seguintes objetivos:

- O jogador permanece o foco visual sem parecer recortado do cenário.
- A fonte de luz parece iluminar o espaço, não apenas aplicar uma cor sobre sprites.
- Tochas e braseiros são reconhecíveis pela combinação de cor, halo, flicker e influência local.
- A atmosfera cria profundidade sem esconder informações de combate.
- Sombras permanecem ancoradas nos pés e respondem de forma plausível às luzes já existentes.
- Reflexos parecem pertencer à superfície líquida e não são cópias opacas deslocadas.
- Partículas comunicam material e impacto por movimento e timing, não apenas por cor.
- Efeitos temporários reforçam eventos importantes sem transformar a tela em uma camada constante de filtros.
- A identidade dark fantasy permanece forte, mas a imagem não fica excessivamente escura, roxa, vermelha ou lavada.
- As transições entre biomas e estados de combate não apresentam saltos abruptos.
