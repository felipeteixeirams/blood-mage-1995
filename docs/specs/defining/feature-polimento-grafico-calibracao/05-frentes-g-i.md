# Polimento Gráfico por Calibração dos Sistemas Existentes (parte 5: Frentes G a I: partículas, shader/terreno e lifecycle)

**Mestre:** [feature-polimento-grafico-calibracao](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente

**Estado vs código:** verificado em 2026-10-10 (leitura estática; `node_modules` ausente, nada executado): parcial. As correções de integração das Frentes A e B existem: `LightingPolish.applyBloomFilter` chama `enableFilters()` só uma vez por sprite, limpa o Glow anterior antes de reaplicar, remove no evento `destroy` e em `cleanup()`, com `MAX_ACTIVE_BLOOM_TARGETS = 16` e desligamento por `postProcessingEnabled === false` ou `lowPerformanceParticles`; `PostFXSystem.createFilters` usa `camera.filters.external` (com `internal` como alternativa), guarda `activeFloorDepth` e reaplica a matriz do bioma, e `PostFXSystem.test.ts` cobre callbacks tardios de `effectCriticalDamage`/`effectInfection` que não apagam tint mais novo. Existem os sistemas e testes citados (`LightingSystem`, `LightingPolish`, `PostFXSystem`, `AtmosphereSystem`, `ShadowSystem` com `footY = y + altura*0.38`, `ReflectionSystem` com `setFrame` sincronizado, `AdvancedParticles` com `lowPerformanceParticles`, `AtmosphericTreeShader`, `TerrainDetailFactory`). Não verificado: se `filters.external` é a coleção correta no Phaser 4.2.1 instalado; se o Glow aparece em WebGL real; se o Glow é removido ao reciclar sem destruir (hoje só em `destroy`/`cleanup`); toda a calibração visual das Frentes C a H e a validação antes/depois (precisa de playtest e screenshots humanos); orçamento de performance medido.

Parte 5 de 7. Índice das partes: [parte 1](01-visao-e-escopo.md).

---

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
- Garantir que o ângulo configurado não fique persistente indevidamente no próximo efeito.
- Ajustar alpha e tint para separar sangue, poeira, ácido, energia e crítico usando os recursos já disponíveis.
- Calibrar profundidade dos emissores para manter a ordem de renderização existente.
- Preservar a redução de densidade em `lowPerformanceParticles`.
- Corrigir emissores que continuam vivos depois de `stopAll`, `stopAmbient` ou troca de cena.
- Reutilizar os emissores atuais sem criar um emissor por ocorrência de impacto.

### Critérios de aceite

- [ ] Os cinco efeitos de combate têm silhuetas de movimento distintas mesmo usando as texturas atuais.
- [ ] O impacto aparece no mesmo momento do dano e desaparece sem resíduo.
- [ ] Trails não acumulam partículas além do necessário.
- [ ] Clima e ambiente permanecem sutis durante combate.
- [ ] `lowPerformanceParticles` reduz custo mantendo a leitura do evento.
- [ ] Nenhuma emissão órfã continua após shutdown da cena.

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

### Critérios de aceite

- [ ] Árvores respondem ao vento sem parecerem deslocar-se do terreno.
- [ ] A névoa aplicada pelo shader combina com o `AtmosphereSystem`.
- [ ] AO e iluminação não fecham detalhes da copa, tronco ou chão.
- [ ] Detalhes assados continuam estáveis a 60 FPS.
- [ ] Não há criação contínua de texturas ou Graphics durante gameplay.

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

### Critérios de aceite

- [ ] Trocar de cena ou reiniciar uma run não duplica luzes, partículas, shadows ou reflections.
- [ ] Nenhum efeito temporário permanece ativo depois de `reset` ou `shutdown`.
- [ ] A ordem de profundidade permanece estável em gameplay.
- [ ] O HUD não é coberto por upper haze ou partículas de mundo.
- [ ] Os testes unitários conseguem instanciar os sistemas sem depender de Canvas nativo completo.
