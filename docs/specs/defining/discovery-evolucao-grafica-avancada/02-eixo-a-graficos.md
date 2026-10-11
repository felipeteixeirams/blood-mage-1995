# Avaliação arquitetural: Phaser 4.2.1 e renderização procedural avançada (parte 2: Eixo A: gráficos avançados procedurais)

**Mestre:** [discovery-evolucao-grafica-avancada](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente

**Estado vs código:** não verificado

Parte 2 de 4. Índice das partes: [README.md](README.md).

## Eixo A — Gráficos Avançados (procedural, sem assets novos) 🔴 Prioritário

**Objetivo:** substituir os efeitos de "falsa iluminação" (overlays) por iluminação real + pós-processamento WebGL, mantendo zero dependência de arte externa.

### A.1 — Filtros postFX nativos do Phaser 4

Aplicar via `camera.filters.internal` / `camera.filters.external` (v4) — sem shaders customizados para a maioria dos casos:

- **Vignette** — substitui o `ScreenEffects.applyVignette` em Canvas por versão GPU
- **Glow/Blur** — luz de sangue, glows de tocha/brasier (já gerados em `textureGenerator`) com halo real
- **ColorMatrix** — gradação por bioma (dungeon frio, santuário rubro) em tempo real
- **Pixelate/Blocky** — reforço do look retro 16-bit nos limites de cena
- **Bloom** (via `Phaser.Actions.AddEffectBloom` / ParallelFilters) — pós-processo global opcional, ativado só em eventos (críticos, execuções) para não custar FPS constante
- **Displacement** — distorção de "onda de calor/perturbação" para os efeitos de status (veneno/medo), hoje simulada com `ScreenEffects.applyDistortion` em Canvas

> Compatibilidade: filtros são WebGL-only; manter `ScreenEffects` atual como fallback para quando `Phaser.CANVAS` for forçado.

### A.2 — Iluminação dinâmica Light2D com normal maps procedurais

- Habilitar `this.lights.enable()` + `ambientColor` por bioma
- `player.setLighting(true)`, inimigos, tilemap e partículas (`setLighting(true)` funciona em praticamente todos os objetos no v4)
- Luzes: tochas/braseiros como `this.lights.addLight(x, y, radius)` com `z` (altura) explícito; luz do player com raio variando por HP (reaproveitar lógica do `WorldManager.updateLighting`)
- **Normal maps procedurais**: gerar normal maps a partir dos sprites existentes (gradients/derivadas no próprio `textureGenerator` ou ferramenta Laigter) → sprites ganham volume sem arte nova
- **Self-shadows**: `render.selfShadow` no config ou `setSelfShadow()` por objeto — profundidade em sprites flat
- Performance: controlar `maxLights` no game config e o raio das luzes (custo por pixel iluminado); medir com `PerformanceMonitor.ts`

### A.3 — Critérios de aceite do Eixo A

- [ ] Filtros de câmera (vignette/glow/colormatrix) aplicados via GPU, com fallback Canvas funcional
- [ ] Luzes dinâmicas substituem os overlays de iluminação do `WorldManager` sem regressão visual
- [ ] Normal maps procedurais gerados para player + pelo menos 2 inimigos + tiles de chão/parede
- [ ] Self-shadows ativos sem queda de FPS (gate: 60 FPS em dispositivo médio, validar com `engineering/performance-metrics.md`)
- [ ] Todos os efeitos com toggle de acessibilidade/performance nas settings

### Esforço estimado (Eixo A)

- Filtros postFX: **Médio** (2–3 dias)
- Iluminação Light2D + normal maps: **Médio-Alto** (3–5 dias — risco de performance em mobile)
- Normal maps procedurais no `textureGenerator`: **Médio** (1–2 dias)

---
