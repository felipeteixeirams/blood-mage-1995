# Polimento gráfico por calibração dos sistemas existentes (parte 4: Frentes D a F, atmosfera, sombras e reflexos)

**Mestre:** [feature-polimento-grafico-calibracao](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Estado vs código:** verificado em 2026-10-11 (leitura estática; `node_modules` ausente, nada executado): parcial. Existem as correções de integração das Frentes A e B e os sistemas com testes: `LightingPolish.applyBloomFilter` (`src/game/systems/LightingPolish.ts`) chama `enableFilters()` uma vez por sprite, limpa o Glow anterior antes de reaplicar, remove no evento `destroy` e em `cleanup()`, com `MAX_ACTIVE_BLOOM_TARGETS = 16` e Glow desligado por `postProcessingEnabled === false` ou `lowPerformanceParticles`; `PostFXSystem.createFilters` usa `camera.filters.external` (com `internal` como alternativa) e guarda `activeFloorDepth`; `PostFXSystem.test.ts` cobre callbacks tardios de `effectCriticalDamage`/`effectInfection`; `AdvancedParticles.emitDirectional` restaura a rotação (teste existe). Faltam: validar `filters.external` no Phaser 4.2.1, Glow em WebGL real, remoção do Glow ao reciclar sem destruir, calibração visual das Frentes C a H, testes de zona líquida do `ReflectionSystem` (só 2 testes), validação antes/depois e orçamento de performance medido.

Parte 4 de 8. Índice: [README](README.md).

## Anexo: Frentes D a F

Requisitos e calibração de cada frente; os critérios de aceite estão na [parte 8](08-criterios-e-pendencias.md).

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
