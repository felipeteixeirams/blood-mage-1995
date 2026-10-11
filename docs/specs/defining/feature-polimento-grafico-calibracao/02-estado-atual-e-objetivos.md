# Polimento Gráfico por Calibração dos Sistemas Existentes (parte 2: Estado atual, problemas e objetivos de qualidade)

**Mestre:** [feature-polimento-grafico-calibracao](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente

**Estado vs código:** verificado em 2026-10-10 (leitura estática; `node_modules` ausente, nada executado): parcial. As correções de integração das Frentes A e B existem: `LightingPolish.applyBloomFilter` chama `enableFilters()` só uma vez por sprite, limpa o Glow anterior antes de reaplicar, remove no evento `destroy` e em `cleanup()`, com `MAX_ACTIVE_BLOOM_TARGETS = 16` e desligamento por `postProcessingEnabled === false` ou `lowPerformanceParticles`; `PostFXSystem.createFilters` usa `camera.filters.external` (com `internal` como alternativa), guarda `activeFloorDepth` e reaplica a matriz do bioma, e `PostFXSystem.test.ts` cobre callbacks tardios de `effectCriticalDamage`/`effectInfection` que não apagam tint mais novo. Existem os sistemas e testes citados (`LightingSystem`, `LightingPolish`, `PostFXSystem`, `AtmosphereSystem`, `ShadowSystem` com `footY = y + altura*0.38`, `ReflectionSystem` com `setFrame` sincronizado, `AdvancedParticles` com `lowPerformanceParticles`, `AtmosphericTreeShader`, `TerrainDetailFactory`). Não verificado: se `filters.external` é a coleção correta no Phaser 4.2.1 instalado; se o Glow aparece em WebGL real; se o Glow é removido ao reciclar sem destruir (hoje só em `destroy`/`cleanup`); toda a calibração visual das Frentes C a H e a validação antes/depois (precisa de playtest e screenshots humanos); orçamento de performance medido.

Parte 2 de 7. Índice das partes: [parte 1](01-visao-e-escopo.md).

---

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
