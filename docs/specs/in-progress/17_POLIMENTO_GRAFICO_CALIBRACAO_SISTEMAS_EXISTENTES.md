---
agent_context: game-engine, graphics-architect, frontend, qa
target_module: src/game/systems, src/game/scenes, src/game/shaders, src/utils
priority: high
criticality: high
status: in-progress
implementation_status: not_started
last_updated: 2026-09-05
tags:
  - specs
  - graphics
  - visual-polish
  - calibration
  - phaser4
  - lighting
  - postfx
  - atmosphere
  - shadows
  - reflections
  - particles
  - performance
---

# Spec 17 — Polimento Gráfico por Calibração dos Sistemas Existentes

> **Status:** Spec em andamento; implementação ainda não iniciada.  
> **Data:** 5 de setembro de 2026  
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

1. **Glow pode não ser aplicado em runtime**  
   `LightingPolish.applyBloomFilter()` consulta `sprite.filters`, mas a inicialização do filtro precisa ser confirmada para os objetos reais. Se `enableFilters()` for necessário no Phaser 4.2.1, a ausência dessa chamada faz o sistema sair silenciosamente.

2. **Escopo dos filtros de câmera precisa ser validado**  
   `PostFXSystem` usa `camera.filters.internal`. A implementação deve confirmar se essa é a coleção correta para efeitos de tela inteira na versão instalada. Os testes atuais reproduzem a API usada, portanto implementação e mocks precisam evoluir juntos.

3. **Gradação de bioma pode ser perdida após tint temporário**  
   A matriz de cor por `floorDepth` é calculada em `applyBiomeMatrix(floorDepth)`, mas a reaplicação após um tint temporário precisa manter o bioma e a profundidade ativos. O retorno visual não pode cair silenciosamente nos valores padrão.

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

---

## 5. Frentes de Trabalho

## 5.1 Frente A — Correção e Calibração do Glow Existente

### Objetivo

Garantir que os filtros Glow já definidos em `LightingPolish` sejam realmente inicializados, aplicados uma única vez e removidos corretamente, preservando o limite atual de alvos.

### Requisitos

- Confirmar a sequência correta de inicialização de filtros para `Image` e `Sprite` no Phaser 4.2.1.
- Chamar a inicialização necessária antes de consultar/adicionar o Glow, se a API exigir.
- Manter o comportamento idempotente em objetos reciclados.
- Evitar empilhar filtros quando um sprite recebe nova raridade, spell ou estado.
- Remover o filtro e liberar o alvo do conjunto quando o objeto for destruído ou reciclado.
- Preservar `MAX_ACTIVE_BLOOM_TARGETS = 16`, salvo evidência de que o limite atual está incorreto.
- Manter o fallback Light2D/Canvas quando filtros não estiverem disponíveis.
- Não aplicar Glow em objetos que atualmente não são candidatos.

### Calibração visual

- Itens comuns devem continuar discretos.
- Itens raros, épicos e lendários devem ter separação clara sem pulsação agressiva.
- Glow de chefes deve reforçar silhueta, não apagar detalhes do sprite.
- Glow de projéteis deve permanecer legível por pouco tempo e não deixar rastro visual residual.
- O raio visual não deve ultrapassar a área útil de leitura do objeto.

### Critérios de aceite

- [ ] O Glow aparece no preview WebGL para pelo menos um item, uma magia, um monstro forte e um portal.
- [ ] Reaplicar Glow no mesmo objeto não duplica intensidade nem cria filtros acumulados.
- [ ] Destruir ou reciclar o objeto remove o filtro e atualiza o limite de alvos.
- [ ] Com pós-processamento desativado, não há Glow residual.
- [ ] Em Canvas/fallback, o jogo continua renderizando sem erro.

---

## 5.2 Frente B — Correção e Calibração do Pós-Processamento Existente

### Objetivo

Fazer vignette, ColorMatrix, displacement e tint trabalharem como uma composição previsível, mantendo as APIs públicas atuais do `PostFXSystem`.

### Requisitos de integração

- Validar, contra o Phaser 4.2.1 instalado, se os efeitos de tela inteira devem usar `filters.internal`, `filters.external` ou outra coleção suportada.
- Atualizar os testes e mocks para representar a API real, sem testar apenas uma abstração inventada.
- Manter `ScreenEffects` como fallback quando WebGL/filtros não estiverem disponíveis.
- Preservar `setEnabled`, `reset`, `setBiome`, `setVignette`, `setDisplacement`, `setTint` e os gatilhos existentes.
- Armazenar o `floorDepth` ativo para reaplicar a matriz correta após dano, medo, level-up ou qualquer tint temporário.
- Evitar que `apply()` restaure a matriz de bioma com profundidade padrão quando a cena está em um andar mais profundo.
- Garantir que `reset()` remova somente o estado temporário e preserve a gradação estrutural do bioma quando apropriado.
- Tratar chamadas sobrepostas de efeitos temporários sem deixar callbacks antigos reintroduzirem estado expirado.

### Calibração dos efeitos atuais

| Efeito | Direção do ajuste |
|---|---|
| Vignette | Reforçar bordas somente quando necessário; preservar centro de leitura |
| ColorMatrix | Manter identidade do bioma sem esmagar contraste ou saturar vermelhos |
| Displacement | Usar intensidade curta e controlada em medo, impacto e infecção |
| Tint | Funcionar como camada temporária, retornando à matriz do bioma |
| CRT | Ser uma contribuição sutil, sem duplicar vignette ou distorção |
| Baixa vida | Pulsar de forma perceptível, mas não competir com dano e boss impact |

### Critérios de aceite

- [ ] Os três filtros existentes são criados e aplicados na coleção correta do Phaser 4.2.1.
- [ ] Os testes não dependem de uma API divergente da runtime.
- [ ] `floorDepth` continua correto depois de qualquer tint temporário.
- [ ] Acionar medo, dano crítico e level-up em sequência não deixa tint ou displacement presos.
- [ ] O fallback Canvas permanece funcional.
- [ ] O pós-processamento pode ser desativado sem alteração de gameplay ou erro no ciclo de cena.

---

## 5.3 Frente C — Calibração do `LightingSystem`

### Objetivo

Refinar a iluminação Light2D já existente, mantendo as mesmas fontes, biomas e regras de redução de luz por HP.

### Requisitos

- Calibrar `ambientColor` de cada bioma para manter separação entre piso, entidades e efeitos.
- Calibrar `playerLightRadius` e `playerLightColor` sem alterar o comportamento de redução por HP.
- Calibrar `torchRadius`, `torchColor` e o multiplicador atual de braseiros.
- Garantir transição suave da cascata de luz com `floorDepth`.
- Ajustar o flicker atual para evitar oscilação mecânica ou mudança de raio perceptivelmente abrupta.
- Manter o fallback quando WebGL ou pós-processamento estiver desativado.
- Confirmar que objetos que precisam de Light2D recebem o pipeline sem tentativa repetida desnecessária.
- Garantir que a limpeza das luzes aconteça na troca de andar e no shutdown da cena.

### Regras de composição

- A luz ambiente deve definir o clima geral, não substituir a leitura dos objetos.
- A luz do jogador deve apoiar navegação e tensão, não apagar as sombras.
- Tochas devem ter maior legibilidade local do que o ambiente.
- Braseiros podem ter maior raio, mas não devem criar manchas estouradas.
- Luz de impacto crítico deve ser breve e retornar ao estado anterior sem alterar o ambiente persistente.

### Critérios de aceite

- [ ] Cada bioma mantém uma assinatura cromática reconhecível.
- [ ] O jogador permanece legível em áreas com baixa iluminação.
- [ ] Tochas e braseiros continuam visualmente distinguíveis no preview.
- [ ] A luz do jogador diminui com HP baixo sem desaparecer abruptamente.
- [ ] O flicker não produz pulsação sincronizada ou artificial entre fontes.
- [ ] Não há acúmulo de luzes após trocar de andar ou reiniciar a cena.

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

---

## 6. Estratégia de Implementação

### Fase 0 — Baseline visual e técnico

- Registrar o comportamento atual em WebGL.
- Capturar cenas de referência:
  - exploração em cada bioma;
  - tocha e braseiro;
  - jogador com HP alto e baixo;
  - elite/boss;
  - impacto crítico;
  - poça de sangue;
  - clima e floresta.
- Medir FPS, frame time, quantidade aproximada de partículas, luzes e alvos Glow.
- Confirmar o warning `404` já observado separadamente, para não atribuí-lo incorretamente a esta spec.

### Fase 1 — Correções de integração

- Inicialização real do Glow.
- Escopo real dos filtros de câmera.
- Persistência correta de `floorDepth` no ColorMatrix.
- Cleanup e idempotência de filtros, tweens e emissores.

### Fase 2 — Calibração visual

- LightingSystem e LightingPolish.
- PostFXSystem.
- AtmosphereSystem.
- ShadowSystem.
- ReflectionSystem.
- AdvancedParticles.
- Shader e detalhes procedurais existentes.

### Fase 3 — Integração e validação

- Verificar ordem de renderização.
- Comparar cenas antes/depois.
- Executar testes unitários e smoke tests.
- Validar gameplay em desktop e viewport mobile landscape.
- Confirmar ausência de regressão funcional.

---

## 7. Orçamento de Performance

### Guardrails

- Manter alvo de 60 FPS no desktop.
- Manter o objetivo de 60 FPS em dispositivos móveis compatíveis; caso o dispositivo seja limitado, degradar via configurações existentes, não via aumento de carga.
- Não aumentar o limite de 16 alvos Glow como solução de qualidade.
- Não aumentar densidade de partículas como primeira resposta.
- Não criar `Graphics`, texturas ou emissores por frame.
- Não criar luzes por frame para eventos que podem reutilizar o comportamento atual.
- Evitar callbacks atrasados que continuem ativos após o objeto ser destruído.

### Métricas mínimas

- Frame time estável, sem queda sustentada causada pelo polimento.
- Sem crescimento contínuo de objetos Phaser após troca de onda ou reinício.
- Sem aumento permanente de listeners, tweens ou emissores.
- Sem diferença visual entre modo normal e fallback que impeça o gameplay.
- O modo `lowPerformanceParticles` continua reduzindo custo de forma observável.

---

## 8. Testes e Verificação

### Testes unitários

Atualizar ou ampliar os testes existentes para cobrir:

- `LightingPolish.test.ts`
- `PostFXSystem.test.ts`
- `AtmosphereSystem.test.ts`
- `ShadowSystem.test.ts`
- `ReflectionSystem.test.ts`
- `AdvancedParticles.test.ts`
- `AtmosphericTreeShader.test.ts`
- `TerrainDetailFactory.test.ts`

Os testes devem validar comportamento e lifecycle, não apenas a existência de mocks.

### Smoke tests

- A cena inicia em WebGL sem erro de renderer.
- A cena inicia em fallback Canvas/headless quando suportado pelo teste.
- O jogo atravessa pelo menos uma sequência de exploração, combate, impacto, morte de inimigo e troca de estado.
- Não há tela preta, textura 404 nova ou erro de ciclo de vida.

### Validação visual

Comparar antes/depois nas mesmas condições:

1. `fosso_chagas`
2. `catacumbas_martires`
3. `santuario_sangue`
4. `safe_house`
5. `gloomy_woods`
6. área com tocha e braseiro
7. combate com elite/boss
8. poça com entidade refletida
9. HP baixo
10. modo de baixa performance

O aceite visual deve considerar:

- contraste;
- legibilidade;
- coerência cromática;
- ancoragem espacial;
- ausência de artefatos;
- ausência de efeitos residuais;
- preservação da identidade procedural.

### Comandos de verificação

```bash
pnpm run typecheck
pnpm test -- --run
pnpm run build
pnpm run verify
```

Se houver workflow ativo, reiniciar somente após a implementação do lote completo e verificar os logs e o preview final.

---

## 9. Matriz de Prioridade

| Frente | Impacto | Risco | Prioridade |
|---|---:|---:|---:|
| Glow e filtros reais | Muito alto | Médio | P0 |
| Pós-processamento e composição de estados | Muito alto | Médio | P0 |
| Iluminação e contraste | Alto | Médio | P0 |
| Atmosfera e visibilidade | Alto | Baixo | P1 |
| Sombras | Alto | Baixo | P1 |
| Reflexos | Médio | Baixo | P1 |
| Partículas e timing | Médio-Alto | Médio | P1 |
| Shader e terreno procedural | Médio | Médio | P2 |
| Lifecycle e ordem de renderização | Muito alto | Baixo | P0 |

---

## 10. Critérios Globais de Aceite

- [ ] Nenhum sistema novo foi criado para resolver um problema de calibração.
- [ ] Nenhum asset externo novo foi necessário.
- [ ] Os filtros existentes são efetivamente aplicados no renderer suportado.
- [ ] Os filtros são removidos corretamente e não se acumulam em objetos reciclados.
- [ ] A gradação de bioma continua correta após efeitos temporários.
- [ ] Luzes, sombras, reflexos, atmosfera e partículas formam uma composição visual coerente.
- [ ] Jogador, inimigos, ataques, itens e telégrafos permanecem legíveis.
- [ ] O visual não fica excessivamente lavado, escuro, saturado ou poluído.
- [ ] A troca de cena, bioma, onda e run não deixa objetos ou efeitos órfãos.
- [ ] O desempenho permanece dentro do orçamento existente.
- [ ] `pnpm run verify` passa após a implementação.
- [ ] A validação visual confirma melhoria em relação ao baseline, sem regressão de gameplay.

---

## 11. Estimativa de Esforço

| Etapa | Estimativa |
|---|---:|
| Baseline e diagnóstico | 0,5–1 dia |
| Correção de filtros e lifecycle | 1–2 dias |
| Calibração de iluminação e pós-processamento | 1–2 dias |
| Calibração de atmosfera, sombras e reflexos | 1–2 dias |
| Calibração de partículas e shader existente | 1–2 dias |
| Testes, preview e comparação visual | 1 dia |
| **Total estimado** | **5,5–10 dias** |

O esforço pode diminuir se os problemas de filtro forem apenas de inicialização. A estimativa não inclui produção de arte, migração de engine ou novas features.

---

## 12. Registro de Mudanças

| Data | Alteração | Autor |
|---|---|---|
| 2026-09-05 | Criação da spec de polimento por calibração dos sistemas gráficos existentes, com escopo explícito contra expansão de features | Replit Agent |
