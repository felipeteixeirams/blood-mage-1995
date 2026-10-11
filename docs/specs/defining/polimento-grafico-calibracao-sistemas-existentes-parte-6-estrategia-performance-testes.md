# Spec 17 — Polimento Gráfico por Calibração dos Sistemas Existentes (parte 6: Estratégia, orçamento de performance e testes)

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente

**Estado vs código:** verificado em 2026-10-10 (leitura estática; `node_modules` ausente, nada executado): parcial. As correções de integração das Frentes A e B existem: `LightingPolish.applyBloomFilter` chama `enableFilters()` só uma vez por sprite, limpa o Glow anterior antes de reaplicar, remove no evento `destroy` e em `cleanup()`, com `MAX_ACTIVE_BLOOM_TARGETS = 16` e desligamento por `postProcessingEnabled === false` ou `lowPerformanceParticles`; `PostFXSystem.createFilters` usa `camera.filters.external` (com `internal` como alternativa), guarda `activeFloorDepth` e reaplica a matriz do bioma, e `PostFXSystem.test.ts` cobre callbacks tardios de `effectCriticalDamage`/`effectInfection` que não apagam tint mais novo. Existem os sistemas e testes citados (`LightingSystem`, `LightingPolish`, `PostFXSystem`, `AtmosphereSystem`, `ShadowSystem` com `footY = y + altura*0.38`, `ReflectionSystem` com `setFrame` sincronizado, `AdvancedParticles` com `lowPerformanceParticles`, `AtmosphericTreeShader`, `TerrainDetailFactory`). Não verificado: se `filters.external` é a coleção correta no Phaser 4.2.1 instalado; se o Glow aparece em WebGL real; se o Glow é removido ao reciclar sem destruir (hoje só em `destroy`/`cleanup`); toda a calibração visual das Frentes C a H e a validação antes/depois (precisa de playtest e screenshots humanos); orçamento de performance medido.

Parte 6 de 7. Índice das partes: [parte 1](polimento-grafico-calibracao-sistemas-existentes-parte-1-visao-e-escopo.md).

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
