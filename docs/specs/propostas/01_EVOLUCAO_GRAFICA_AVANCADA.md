---
agent_context: game-engine, frontend
target_module: artifacts/bloodmage/src/game
priority: medium
status: draft
last_updated: 2026-08-11
tags: [specs, proposta, graficos, shaders, iluminacao, assets, performance]
---

# Proposta — Evolução Gráfica Avançada (postFX, Iluminação e Pipeline de Assets)

> Documento de proposta (roadmap). Define o **porquê** e **o que**; implementação detalhada só após aprovação e mover para `andamento/`.

## Contexto

O jogo é 100% procedural (sprites gerados via Canvas em `textureGenerator.ts`, áudio sintetizado via Web Audio em `soundEngine.ts`), com stack **Phaser 4.2.1 + Vite 7 + WebGL** (`Phaser.AUTO`, `pixelArt: true`). Auditoria no código mostrou que **nenhum shader/filtro/pipeline WebGL é usado hoje** — os efeitos de atmosfera são overlays de alpha/radius (`WorldManager.updateLighting`, `ScreenEffects`), não iluminação real.

O discovery de mercado (Phaser 4.2, ago/2026) revelou que a versão 4 entrega, nativamente, um pipeline de filtros pós-processamento e iluminação 2D dinâmica com custo baixo de integração — sem precisar escrever GLSL. Isso permite elevar a qualidade visual **sem introduzir assets externos**, postergando decisões de orçamento de arte.

Esta proposta consolida 3 eixos como roadmap. **Eixo A** é o prioritário (maior impacto visual por esforço). **Eixos B e C** são gatilhos futuros para quando a produção de arte/áudio externa for decidida.

---

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
- [ ] Self-shadows ativos sem queda de FPS (gate: 60 FPS em dispositivo médio, validar com `critical/04_PERFORMANCE_METRICS.md`)
- [ ] Todos os efeitos com toggle de acessibilidade/performance nas settings

### Esforço estimado (Eixo A)

- Filtros postFX: **Médio** (2–3 dias)
- Iluminação Light2D + normal maps: **Médio-Alto** (3–5 dias — risco de performance em mobile)
- Normal maps procedurais no `textureGenerator`: **Médio** (1–2 dias)

---

## Eixo B — Pipeline de Integração de Assets Externos 🔵 Gatilho futuro

**Objetivo:** quando arte externa for aprovada (Fase 3+ do `SPECS_EVOLUCAO.md`), integrar com qualidade sem perder desempenho — e sem quebrar o pipeline procedural.

### B.1 — Formatos recomendados (discovery)

| Categoria | Formato primário | Fallback | Motivo |
|-----------|------------------|----------|--------|
| Sprite/UI | PNG + atlas JSON (hash) | — | Transparência + 1 draw call por conjunto |
| Textura/fundo | WebP | JPG | ~40% menor, Vite gerencia hashing |
| Sprite animado | Spritesheet/atlas + JSON (TexturePacker) | — | Padding evita bleeding; `Phaser.Animations` nativo |
| Esqueleto | DragonBones JSON (suporte nativo Phaser) | — | Alternativa grátis ao Spine |
| Cutscene/vídeo | WebM (VP9/AV1) | MP4 (H.264) | Transparência só em WebM VP8/Chrome |
| SFX | OGG/WebM (mono) | MP3 | Melhor qualidade/peso |
| Música | Opus/M4A (stereo 96–192kbps) | MP3 | Streaming; iOS não toca OGG |

### B.2 — Estratégia de integração

- **Pastas por tipo**: `src/assets/sprites/`, `audio/`, `video/` (já existe `assets/ui` e `assets/images`)
- **Loader por cena + lazy-load**: boot carrega só shared (UI, player); demais por cena/bioma
- **Substituição incremental**: asset novo sobrescreve a **mesma key** do gerador procedural (`spr_bloodmage`) → zero refactor
- **Compressão**: `pngquant`/`oxipng` (40–70% menor), WebP, dimensões potência de 2
- **Draw calls**: agrupar sprites por textura, evitar mix de blend modes no mesmo batch
- **Texto**: `BitmapText` no lugar de `Text` (renderiza pre-rendered font atlas, mais barato)
- **Cache PWA**: `vite-plugin-pwa` já configurado — assets hasheados cache-first; áudio/vídeo grandes via `public/` ou CDN
- **Otimal**: `assetsInlineLimit`, `build.assetsDir` no `vite.config.ts`

### Esforço estimado (Eixo B)

- Infra de pastas + loader por cena: **Baixo** (1 dia)
- Script de compressão (pngquant/WebP): **Baixo** (1 dia)
- Mecanismo de substituição por key: **Baixo** (meio dia)

---

## Eixo C — Áudio Avançado (trilha híbrida) 🔵 Gatilho futuro

**Objetivo:** manter SFX 100% sintetizados (melhor custo/valor do procedural) e adicionar trilha composta em momentos de alta carga emocional.

### C.1 — Estratégia

- **Manter SFX sintetizados** (`soundEngine.ts`) — onde o procedural entrega mais por custo
- **Trilha composta** (loop exploração por bioma, combate, boss, menu): Opus 96–128kbps, streaming via service worker (não impacta load inicial)
- **Mixer dinâmico por cima**: Web Audio continua como mixer — intensificar percussão quando HP ≤ 30%, distorção quando boss entra em `frenzy`
- **Áudio espacial**: `StereoPannerNode`/HRTF para posição direcional (já existe o "static radio" de ameaça)
- **Fontes**: OpenGameArt/itch.io (CC) ou Epidemic Sound (pago) — decisão de produção, fora do time de engenharia

### Esforço estimado (Eixo C)

- SFX novos sintetizados: **Baixo** (1–2 dias)
- Mixer dinâmico: **Médio** (2 dias)
- Trilha composta: **Alto** — depende de produção musical

---

## Matriz de Priorização

| Eixo | Impacto visual | Esforço | Assets externos | Fase sugerida |
|------|----------------|---------|-----------------|---------------|
| **A. Filtros postFX** | Alto | Médio | Não | Fase 3 (agora) |
| **A. Iluminação + normal maps** | Muito Alto | Médio-Alto | Não (normal maps procedurais) | Fase 3 (agora) |
| **B. Pipeline de assets** | — (habilita Fase 3+ arte) | Baixo | — | Quando arte externa for aprovada |
| **C. Áudio/trilha híbrida** | Médio | Alto | Sim (música) | Fase 3+, decisão de produção |

> **Recomendação:** implementar o **Eixo A** antes de qualquer decisão de arte externa. O Eixo A valida o teto de qualidade procedural e informa se/pra quando a produção de sprites é necessária — evita investimento prematuro.

---

## Riscos e Mitigação

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Iluminação Light2D custa FPS em mobile | Alto | `maxLights` baixo, raios curtos, toggle de performance, validar com `PerformanceMonitor` |
| Filtros WebGL quebram em Canvas | Médio | Manter `ScreenEffects` como fallback; feature-detect de WebGL |
| Normal maps procedurais ficam "falsos" | Médio | Gerar por derivada do sprite + ajuste manual via Laigter |
| PWA offline + áudio grande | Médio | Streaming, cache estratégia por tipo de arquivo |

---

## Referências

- [[../andamento/SPECS_EVOLUCAO.md]] — spec-alvo (contextos 4 e 7, matriz Fase 3)
- [[../../architecture/01_TECH_STACK.md]] — stack atual (Phaser 4.2.1, Vite 7)
- [[../../critical/02_PERFORMANCE_OPTIMIZATION.md]] — gates de performance
- [[../../critical/04_PERFORMANCE_METRICS.md]] — métricas a validar
- [[../../features/00_DUNGEON_SIEGE_EVOLUTION.md]] — roadmap geral de features

## Registro de mudanças

| Data | O que mudou | Autor |
|------|-------------|-------|
| 2026-08-11 | Criação — roadmap Eixos A/B/C + discovery Phaser 4.2 | opencode (Felipe) |
