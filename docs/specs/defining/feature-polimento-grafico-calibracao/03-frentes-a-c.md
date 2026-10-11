# Polimento gráfico por calibração dos sistemas existentes (parte 3: Frentes A a C, Glow, pós-processamento e iluminação)

**Mestre:** [feature-polimento-grafico-calibracao](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Estado vs código:** verificado em 2026-10-11 (leitura estática; `node_modules` ausente, nada executado): parcial. Existem as correções de integração das Frentes A e B e os sistemas com testes: `LightingPolish.applyBloomFilter` (`src/game/systems/LightingPolish.ts`) chama `enableFilters()` uma vez por sprite, limpa o Glow anterior antes de reaplicar, remove no evento `destroy` e em `cleanup()`, com `MAX_ACTIVE_BLOOM_TARGETS = 16` e Glow desligado por `postProcessingEnabled === false` ou `lowPerformanceParticles`; `PostFXSystem.createFilters` usa `camera.filters.external` (com `internal` como alternativa) e guarda `activeFloorDepth`; `PostFXSystem.test.ts` cobre callbacks tardios de `effectCriticalDamage`/`effectInfection`; `AdvancedParticles.emitDirectional` restaura a rotação (teste existe). Faltam: validar `filters.external` no Phaser 4.2.1, Glow em WebGL real, remoção do Glow ao reciclar sem destruir, calibração visual das Frentes C a H, testes de zona líquida do `ReflectionSystem` (só 2 testes), validação antes/depois e orçamento de performance medido.

Parte 3 de 8. Índice: [README](README.md).

## Anexo: Frentes A a C

Requisitos e calibração de cada frente; os critérios de aceite estão na [parte 8](08-criterios-e-pendencias.md).

## 5. Frentes de Trabalho

## 5.1 Frente A — Correção e Calibração do Glow Existente

### Objetivo

Garantir que os filtros Glow já definidos em `LightingPolish` sejam realmente inicializados, aplicados uma única vez e removidos corretamente, preservando o limite atual de alvos.

### Requisitos

- Confirmar a sequência de inicialização de filtros para `Image` e `Sprite` no Phaser 4.2.1 (o código já chama `enableFilters()` uma vez por sprite).
- Remover o filtro e liberar o alvo de `bloomTargets` quando o sprite de pool for devolvido sem `destroy` (hoje a remoção só ocorre em `destroy` e `cleanup()`).
- Manter o fallback Light2D/Canvas quando filtros não estiverem disponíveis.
- Não aplicar Glow em objetos que atualmente não são candidatos.

Já existe (fora de escopo): idempotência e limpeza do Glow anterior ao reaplicar, remoção em `destroy`, teto de 16 alvos, desligamento por `postProcessingEnabled`/`lowPerformanceParticles`.

### Calibração visual

- Itens comuns devem continuar discretos.
- Itens raros, épicos e lendários devem ter separação clara sem pulsação agressiva.
- Glow de chefes deve reforçar silhueta, não apagar detalhes do sprite.
- Glow de projéteis deve permanecer legível por pouco tempo e não deixar rastro visual residual.
- O raio visual não deve ultrapassar a área útil de leitura do objeto.

---

## 5.2 Frente B — Correção e Calibração do Pós-Processamento Existente

### Objetivo

Fazer vignette, ColorMatrix, displacement e tint trabalharem como uma composição previsível, mantendo as APIs públicas atuais do `PostFXSystem`.

### Requisitos de integração

- Validar, contra o Phaser 4.2.1 instalado, se os efeitos de tela inteira devem usar `filters.internal`, `filters.external` ou outra coleção suportada.
- Atualizar os testes e mocks para representar a API real, sem testar apenas uma abstração inventada.
- Manter `ScreenEffects` como fallback quando WebGL/filtros não estiverem disponíveis.
- Preservar `setEnabled`, `reset`, `setBiome`, `setVignette`, `setDisplacement`, `setTint` e os gatilhos existentes.
- Garantir que `reset()` remova somente o estado temporário e preserve a gradação estrutural do bioma quando apropriado.
- Tratar chamadas sobrepostas de efeitos temporários sem deixar callbacks antigos reintroduzirem estado expirado (já coberto para `effectCriticalDamage` e `effectInfection`; falta medo, level-up e boss).

Já existe: `floorDepth` ativo guardado em `activeFloorDepth` e reaplicado em `applyBiomeMatrix`.

### Calibração dos efeitos atuais

| Efeito | Direção do ajuste |
|---|---|
| Vignette | Reforçar bordas somente quando necessário; preservar centro de leitura |
| ColorMatrix | Manter identidade do bioma sem esmagar contraste ou saturar vermelhos |
| Displacement | Usar intensidade curta e controlada em medo, impacto e infecção |
| Tint | Funcionar como camada temporária, retornando à matriz do bioma |
| CRT | Ser uma contribuição sutil, sem duplicar vignette ou distorção |
| Baixa vida | Pulsar de forma perceptível, mas não competir com dano e boss impact |

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
