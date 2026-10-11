# Avaliação arquitetural: Phaser 4.2.1 e renderização procedural avançada (parte 3: Eixos B e C: assets externos e áudio híbrido)

**Mestre:** [discovery-evolucao-grafica-avancada](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente

**Estado vs código:** não verificado

Parte 3 de 4. Índice das partes: [README.md](README.md).

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
