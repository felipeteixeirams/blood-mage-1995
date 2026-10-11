# Spec 17 — Polimento Gráfico por Calibração dos Sistemas Existentes (parte 3: Frentes A a C: Glow, pós-processamento e LightingSystem)

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente

**Estado vs código:** verificado em 2026-10-10 (leitura estática; `node_modules` ausente, nada executado): parcial. As correções de integração das Frentes A e B existem: `LightingPolish.applyBloomFilter` chama `enableFilters()` só uma vez por sprite, limpa o Glow anterior antes de reaplicar, remove no evento `destroy` e em `cleanup()`, com `MAX_ACTIVE_BLOOM_TARGETS = 16` e desligamento por `postProcessingEnabled === false` ou `lowPerformanceParticles`; `PostFXSystem.createFilters` usa `camera.filters.external` (com `internal` como alternativa), guarda `activeFloorDepth` e reaplica a matriz do bioma, e `PostFXSystem.test.ts` cobre callbacks tardios de `effectCriticalDamage`/`effectInfection` que não apagam tint mais novo. Existem os sistemas e testes citados (`LightingSystem`, `LightingPolish`, `PostFXSystem`, `AtmosphereSystem`, `ShadowSystem` com `footY = y + altura*0.38`, `ReflectionSystem` com `setFrame` sincronizado, `AdvancedParticles` com `lowPerformanceParticles`, `AtmosphericTreeShader`, `TerrainDetailFactory`). Não verificado: se `filters.external` é a coleção correta no Phaser 4.2.1 instalado; se o Glow aparece em WebGL real; se o Glow é removido ao reciclar sem destruir (hoje só em `destroy`/`cleanup`); toda a calibração visual das Frentes C a H e a validação antes/depois (precisa de playtest e screenshots humanos); orçamento de performance medido.

Parte 3 de 7. Índice das partes: [parte 1](polimento-grafico-calibracao-sistemas-existentes-parte-1-visao-e-escopo.md).

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
