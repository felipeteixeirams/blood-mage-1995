# Polimento Gráfico por Calibração dos Sistemas Existentes (parte 4: Frentes D a F: atmosfera, sombras e reflexos)

**Mestre:** [feature-polimento-grafico-calibracao](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente

**Estado vs código:** verificado em 2026-10-10 (leitura estática; `node_modules` ausente, nada executado): parcial. As correções de integração das Frentes A e B existem: `LightingPolish.applyBloomFilter` chama `enableFilters()` só uma vez por sprite, limpa o Glow anterior antes de reaplicar, remove no evento `destroy` e em `cleanup()`, com `MAX_ACTIVE_BLOOM_TARGETS = 16` e desligamento por `postProcessingEnabled === false` ou `lowPerformanceParticles`; `PostFXSystem.createFilters` usa `camera.filters.external` (com `internal` como alternativa), guarda `activeFloorDepth` e reaplica a matriz do bioma, e `PostFXSystem.test.ts` cobre callbacks tardios de `effectCriticalDamage`/`effectInfection` que não apagam tint mais novo. Existem os sistemas e testes citados (`LightingSystem`, `LightingPolish`, `PostFXSystem`, `AtmosphereSystem`, `ShadowSystem` com `footY = y + altura*0.38`, `ReflectionSystem` com `setFrame` sincronizado, `AdvancedParticles` com `lowPerformanceParticles`, `AtmosphericTreeShader`, `TerrainDetailFactory`). Não verificado: se `filters.external` é a coleção correta no Phaser 4.2.1 instalado; se o Glow aparece em WebGL real; se o Glow é removido ao reciclar sem destruir (hoje só em `destroy`/`cleanup`); toda a calibração visual das Frentes C a H e a validação antes/depois (precisa de playtest e screenshots humanos); orçamento de performance medido.

Parte 4 de 7. Índice das partes: [parte 1](01-visao-e-escopo.md).

---

## 5.4 Frente D — Calibração do `AtmosphereSystem`

### Objetivo

Aprimorar a composição das camadas atuais de ground fog, upper haze e partículas climáticas sem aumentar a obstrução visual.

### Requisitos

- Manter os limites de opacidade definidos no sistema como teto operacional.
- Ajustar tint e alpha por bioma usando as configurações existentes.
- Calibrar o movimento das duas camadas para que não pareçam duas texturas independentes deslizando.
- Manter a redução de atmosfera durante combates intensos e chefes.
- Ajustar as transições de bioma para evitar mudança instantânea de cor ou densidade.
- Manter o emissor de clima alinhado à área visível da câmera.
- Preservar a redução de frequência em dispositivos de baixa performance.
- Evitar clima em áreas onde a atmosfera não deve aparecer, respeitando o lifecycle atual.

### Critérios de aceite

- [ ] Ground fog adiciona profundidade sem ocultar pés, telégrafos ou loot.
- [ ] Upper haze é percebido como camada distante e não como véu sobre os sprites.
- [ ] A transição de bioma ocorre sem salto de alpha ou tint.
- [ ] Durante combate intenso, a leitura melhora sem a cena perder completamente a atmosfera.
- [ ] O modo de baixa performance reduz custo sem deixar partículas presas ou acumuladas.
- [ ] A atmosfera é destruída e recriada corretamente em troca de mapa/bioma.

---

## 5.5 Frente E — Refinamento do `ShadowSystem`

### Objetivo

Melhorar a ancoragem e a resposta das sombras já existentes, mantendo o modelo de sombra elíptica e a seleção da fonte de luz mais próxima.

### Requisitos

- Calibrar `footY` por escala e altura real das entidades atuais.
- Ajustar offset inicial para que a sombra fique sob os pés, não sob o centro do sprite.
- Refinar escala vertical e horizontal para entidades pequenas, grandes e chefes.
- Calibrar a rotação projetada sem criar ângulos exagerados.
- Ajustar alpha de contato e alpha sob luz sem transformar a sombra em mancha preta.
- Manter a sombra de contato quando não houver fonte influente.
- Preservar a textura de sombra existente e seu fallback procedural atual.
- Ocultar, destruir e registrar sombras de forma consistente com o lifecycle das entidades.
- Evitar atualização visual de entidades inativas ou fora do contexto renderizado quando o sistema já puder ignorá-las.

### Critérios de aceite

- [ ] A sombra permanece presa ao pé durante movimento e mudança de escala.
- [ ] A direção da projeção responde suavemente à fonte mais próxima.
- [ ] A sombra de contato não desliza em áreas sem luz.
- [ ] Jogador, inimigos comuns e chefes têm proporções visualmente coerentes.
- [ ] Nenhuma sombra aparece acima do piso ou sobre o corpo da entidade.
- [ ] O fallback não produz quadrado sólido ou artefato visível.

---

## 5.6 Frente F — Refinamento do `ReflectionSystem`

### Objetivo

Fazer os reflexos existentes de sangue e água parecerem parte da superfície, sem transformá-los em cópias brilhantes dos sprites.

### Requisitos

- Calibrar o deslocamento vertical a partir do ponto dos pés.
- Ajustar escala vertical para manter a leitura de superfície.
- Calibrar alpha separadamente para sangue e água.
- Ajustar tint para não apagar totalmente a silhueta refletida.
- Manter o ripple senoidal existente, mas com amplitude e frequência discretas.
- Evitar que o reflexo apareça fora da zona líquida.
- Confirmar que frame e textura do objeto original são sincronizados em objetos animados.
- Manter limpeza de reflexos quando entidades ou zonas forem removidas.
- Respeitar o toggle existente sem deixar reflexos invisíveis consumindo atualização.

### Critérios de aceite

- [ ] Reflexo aparece somente dentro da zona líquida correspondente.
- [ ] Sangue e água possuem leituras visuais diferentes sem depender apenas de brilho.
- [ ] O reflexo acompanha animação e posição do objeto.
- [ ] A ondulação é perceptível apenas em observação próxima, sem tremulação.
- [ ] O reflexo desaparece corretamente ao sair da poça.
- [ ] Não existem sprites de reflexo órfãos após destruição da entidade.
