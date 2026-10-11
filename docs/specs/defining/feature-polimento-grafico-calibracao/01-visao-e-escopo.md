# Polimento Gráfico por Calibração dos Sistemas Existentes (parte 1: Resumo executivo e escopo fechado)

**Mestre:** [feature-polimento-grafico-calibracao](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente

**Estado vs código:** verificado em 2026-10-10 (leitura estática; `node_modules` ausente, nada executado): parcial. As correções de integração das Frentes A e B existem: `LightingPolish.applyBloomFilter` chama `enableFilters()` só uma vez por sprite, limpa o Glow anterior antes de reaplicar, remove no evento `destroy` e em `cleanup()`, com `MAX_ACTIVE_BLOOM_TARGETS = 16` e desligamento por `postProcessingEnabled === false` ou `lowPerformanceParticles`; `PostFXSystem.createFilters` usa `camera.filters.external` (com `internal` como alternativa), guarda `activeFloorDepth` e reaplica a matriz do bioma, e `PostFXSystem.test.ts` cobre callbacks tardios de `effectCriticalDamage`/`effectInfection` que não apagam tint mais novo. Existem os sistemas e testes citados (`LightingSystem`, `LightingPolish`, `PostFXSystem`, `AtmosphereSystem`, `ShadowSystem` com `footY = y + altura*0.38`, `ReflectionSystem` com `setFrame` sincronizado, `AdvancedParticles` com `lowPerformanceParticles`, `AtmosphericTreeShader`, `TerrainDetailFactory`). Não verificado: se `filters.external` é a coleção correta no Phaser 4.2.1 instalado; se o Glow aparece em WebGL real; se o Glow é removido ao reciclar sem destruir (hoje só em `destroy`/`cleanup`); toda a calibração visual das Frentes C a H e a validação antes/depois (precisa de playtest e screenshots humanos); orçamento de performance medido.

## Partes desta spec

Spec dividida em partes menores; o conteúdo é o do documento original, sem alteração de significado.

| Parte | Assunto |
|---|---|
| [1](01-visao-e-escopo.md) | Resumo executivo e escopo fechado |
| [2](02-estado-atual-e-objetivos.md) | Estado atual, problemas e objetivos de qualidade |
| [3](03-frentes-a-c.md) | Frentes A a C: Glow, pós-processamento e LightingSystem |
| [4](04-frentes-d-f.md) | Frentes D a F: atmosfera, sombras e reflexos |
| [5](05-frentes-g-i.md) | Frentes G a I: partículas, shader/terreno e lifecycle |
| [6](06-estrategia-performance-testes.md) | Estratégia, orçamento de performance e testes |
| [7](07-prioridade-aceite-esforco.md) | Prioridade, critérios globais e esforço |

## Decisões a confirmar

Comportamento e escopo abaixo são propostas sem aprovação registrada; nada aqui está decidido.

1. Escopo fechado: calibrar sistemas existentes sem criar abstrações novas (regra de nova abstração).
2. Valores-alvo de calibração por frente (glow, pós-processamento, luz, atmosfera, sombra).
3. Objetivos de qualidade visual da seção 4.
4. Critérios de aceite de cada frente.

---

> **Domínio:** Renderização Phaser 4, iluminação, pós-processamento, atmosfera, sombras, reflexos, partículas e validação visual.  
> **Princípio:** melhorar o que já existe antes de adicionar qualquer coisa.

---

## 1. Resumo Executivo

O *Bloodmage 1995* já possui uma camada gráfica procedural ampla: Light2D, Glow, pós-processamento de câmera, cascata de cor por profundidade, névoa por bioma, clima, sombras direcionais, reflexos líquidos, partículas de combate, shaders atmosféricos e texturas assadas.

O objetivo desta spec não é expandir esse conjunto. O objetivo é fazer os sistemas atuais entregarem uma imagem final mais coesa, legível e refinada por meio de:

1. correção de integrações que podem impedir efeitos de serem aplicados;
2. calibração de intensidade, raio, alpha, blending, timing e profundidade;
3. composição consistente entre luz, cor, névoa, sombra, reflexo e partículas;
4. remoção de conflitos entre efeitos simultâneos;
5. preservação do orçamento de performance atual.

O resultado esperado é uma melhoria perceptível na qualidade visual sem:

- criar novos sistemas;
- criar novas mecânicas;
- trocar o renderer;
- migrar para Three.js, Unity ou Godot;
- adicionar novos tipos de partículas;
- adicionar novos assets externos;
- substituir a direção visual procedural;
- aumentar indiscriminadamente a densidade de efeitos.

---

## 2. Escopo Fechado

### 2.1 Incluído

- Correção da inicialização e limpeza dos filtros já utilizados.
- Validação da coleção de filtros de câmera efetivamente aplicada pelo Phaser 4.2.1.
- Calibração dos valores existentes de iluminação por bioma.
- Calibração do flicker atual de tochas e braseiros.
- Refinamento dos parâmetros de Glow já aplicados a itens, monstros, magias, portais e impactos.
- Refinamento das transições existentes de ColorMatrix, vignette, displacement e tint.
- Preservação correta da gradação por bioma após efeitos temporários.
- Ajuste da névoa, haze e clima existentes sem ultrapassar os limites de visibilidade.
- Ajuste de posição, escala, rotação e alpha das sombras existentes.
- Ajuste de alpha, tint, offset e ripple dos reflexos existentes.
- Ajuste de velocidade, escala, lifespan, alpha, quantidade e blending das partículas existentes.
- Ajuste dos parâmetros do shader atmosférico e da geração procedural já existentes.
- Correção de lifecycle, pooling, limpeza e reuso quando isso afetar o resultado visual.
- Testes automatizados e validação visual em gameplay.

### 2.2 Fora do escopo

- Novos sistemas de renderização.
- Novos efeitos visuais com nova API pública.
- Novos tipos de partículas ou novas texturas de partículas.
- Novas luzes além das já previstas pelo `LightingSystem`.
- Normal maps novos, assets externos ou sprites externos.
- Novo sistema de materiais.
- Fog volumétrico 3D ou renderização em Three.js.
- Mudança de projeção, câmera ou composição de gameplay.
- Novos inimigos, magias, biomas ou mecânicas.
- Reescrita do renderer.
- Aumento do número máximo de filtros, luzes ou partículas como solução primária.

Se uma melhoria exigir uma nova abstração, ela deve primeiro ser avaliada como correção do sistema existente. Uma expansão só pode ser criada mediante uma nova spec aprovada.
