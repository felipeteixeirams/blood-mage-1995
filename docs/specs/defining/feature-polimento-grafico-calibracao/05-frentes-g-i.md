# Polimento gráfico por calibração dos sistemas existentes (parte 5: Frentes G a I, partículas, shader e lifecycle)

**Mestre:** [feature-polimento-grafico-calibracao](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Estado vs código:** verificado em 2026-10-11 (leitura estática; `node_modules` ausente, nada executado): parcial. Existem as correções de integração das Frentes A e B e os sistemas com testes: `LightingPolish.applyBloomFilter` (`src/game/systems/LightingPolish.ts`) chama `enableFilters()` uma vez por sprite, limpa o Glow anterior antes de reaplicar, remove no evento `destroy` e em `cleanup()`, com `MAX_ACTIVE_BLOOM_TARGETS = 16` e Glow desligado por `postProcessingEnabled === false` ou `lowPerformanceParticles`; `PostFXSystem.createFilters` usa `camera.filters.external` (com `internal` como alternativa) e guarda `activeFloorDepth`; `PostFXSystem.test.ts` cobre callbacks tardios de `effectCriticalDamage`/`effectInfection`; `AdvancedParticles.emitDirectional` restaura a rotação (teste existe). Faltam: validar `filters.external` no Phaser 4.2.1, Glow em WebGL real, remoção do Glow ao reciclar sem destruir, calibração visual das Frentes C a H, testes de zona líquida do `ReflectionSystem` (só 2 testes), validação antes/depois e orçamento de performance medido.

Parte 5 de 8. Índice: [README](README.md).

## Anexo: Frentes G a I

Requisitos e calibração de cada frente; os critérios de aceite estão na [parte 8](08-criterios-e-pendencias.md).

## 5.7 Frente G — Calibração do `AdvancedParticles`

### Objetivo

Aprimorar o comportamento dos emissores existentes por meio de parâmetros e timing, sem adicionar novos emissores ou texturas.

### Emissores cobertos

- `blood_splatter`
- `bone_dust`
- `acid_splash`
- `spectral_burst`
- `critical_hit`
- `atmospheric_fog`
- `torch_embers`
- `forest_pollen`
- `spell_trail`

### Requisitos

- Calibrar quantidade em função de `intensity` sem criar picos abruptos.
- Harmonizar lifespan e fade para que partículas não desapareçam antes de comunicar o impacto.
- Ajustar escala inicial/final para evitar partículas grandes demais em baixa resolução.
- Refinar velocidade, gravidade e ângulo dos emissores direcionais.
- Ajustar alpha e tint para separar sangue, poeira, ácido, energia e crítico usando os recursos já disponíveis.
- Calibrar profundidade dos emissores para manter a ordem de renderização existente.
- Preservar a redução de densidade em `lowPerformanceParticles`.
- Corrigir emissores que continuam vivos depois de `stopAll`, `stopAmbient` ou troca de cena.
- Reutilizar os emissores atuais sem criar um emissor por ocorrência de impacto.

Já existe: `emitDirectional` restaura a rotação do emissor após emitir (teste em `AdvancedParticles.test.ts`).

---

## 5.8 Frente H — Calibração do Shader e Terreno Procedural Existentes

### Objetivo

Refinar os parâmetros visuais da floresta, árvores e detalhes assados já existentes, sem alterar a arquitetura de geração.

### Requisitos

- Ajustar intensidade e velocidade do vento no `AtmosphericTreeShader`.
- Calibrar fog e iluminação direcional para não descolar a árvore do chão.
- Ajustar AO aproximada para criar volume sem deixar bordas pretas.
- Preservar variação procedural e seeds existentes.
- Ajustar paleta e contraste das texturas assadas em `TerrainDetailFactory`.
- Reduzir repetição perceptível por meio de parâmetros existentes de escala, rotação e variação, sem criar novas famílias de assets.
- Manter o padrão `bake once, render many`.
- Validar que a alteração de parâmetros não aumenta criação de `Graphics` por frame.

---

## 5.9 Frente I — Integração, Ordem de Renderização e Lifecycle

### Objetivo

Garantir que os refinamentos apareçam na ordem correta e sejam limpos sem efeitos residuais.

### Requisitos

- Verificar profundidades relativas de:
  - piso;
  - sombras;
  - poças;
  - reflexos;
  - entidades;
  - partículas;
  - ground fog;
  - upper haze;
  - HUD.
- Garantir que o `GameScene` atualize os sistemas numa ordem estável.
- Evitar que uma transição de bioma recrie objetos sem destruir o estado anterior.
- Confirmar que `shutdown`, `destroy`, troca de onda e troca de mapa limpam:
  - luzes;
  - filtros;
  - tweens;
  - emissores;
  - sombras;
  - reflexos;
  - callbacks atrasados.
- Manter a separação React para UI e Phaser para mundo/efeitos.
- Manter fallback Canvas/headless para testes.
