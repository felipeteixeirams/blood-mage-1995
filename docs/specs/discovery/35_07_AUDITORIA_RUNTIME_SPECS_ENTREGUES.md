---
agent_context: qa, game-engine
target_module: tests/e2e (sondas), docs/specs/delivered
priority: medium
criticality: low
status: discovery
last_updated: 2026-10-07
tags: [discovery, qa, runtime, auditoria, delivered, ears]
---

# Discovery 35.07 — Auditoria de Runtime das Specs Entregues Ainda Não Verificadas

> Satélite de [35.00 — Índice Mestre](../backlog/35_00_JOGAVEL_E_VISUAL_SEM_ASSETS_INDICE.md). Achado coberto: **A15**.
> Discovery = pesquisa sem compromisso de entrega de código. O resultado
> esperado é uma lista de specs `delivered/` confirmadas ou corrigidas, e,
> para cada divergência, uma spec de correção nova.

## 1. Contexto

A auditoria de 2026-10-07 verificou em execução real (sonda Playwright,
WebGL/SwiftShader, leitura de `window.gameScene`) **apenas**:

| Spec | Resultado |
|---|---|
| 10 (polimento procedural) | ✅ silhuetas orgânicas e partículas renderizando (screenshots); ❌ parte Light2D inerte (A1) |
| 13 (Campanha + Safe House) | ✅ Campanha carrega, jogador e Maelen visíveis |
| 23.01 PostFX | ❌ inerte (A1) |
| 23.02 normal maps | ⚠️ inimigos/paredes ok; jogador sem normal map (A6) |
| 23.03 Light2D | ❌ inerte (A1, A2, A5) |
| 25 fase B.2 (offset de chunk) | ❌ offset descartado (A9) |

Todas as outras specs em `delivered/` foram validadas só por testes
unitários, por screenshots antigos ou não têm registro de validação. O padrão
"teste verde ≠ feature viva" (A13) torna provável haver outras divergências,
principalmente onde o código depende de:

- `scene.lights.active` → `LightingPolish.isLight2DActive()` (`LightingPolish.ts:43-49`): as 7 chamadas `lights.addLight` (`:291-503`), para glow de feitiço, item raro, portal e boss, nunca rodam hoje;
- `renderer.isWebGL` → `PostFXSystem`, `Enemy.applyEliteGlow`, `AtmosphericTreeShader`, glow da lareira;
- chunks na origem (A9) → qualquer sistema que posicione por faixa de mundo.

## 2. Objetivo

Classificar cada spec entregue com efeito em runtime como **confirmada**,
**divergente** (com evidência) ou **não verificável sem humano**.

## 3. Escopo

### 3.1 Specs a auditar (prioridade pela dependência dos pontos acima)

| Prioridade | Specs `delivered/` | Por quê |
|---|---|---|
| 1 | 11_05 (iluminação/bloom), 17 (calibração), 24_03 (status/sombras/reflexos), 33 (boss telegraph), 31 (normal map tile/porta) | dependem de Light2D/filtros (A1) |
| 2 | 11_01, 11_02, 11_03, 11_04, 11_07, 11_08, 20 (partículas), 24_01, 24_02 | visuais; independem de A1, mas nunca auditados em runtime |
| 3 | 14, 16, 22 (dash), 27 (joystick), 28 (modais/gamepad), 30 (determinismo), 32 (toggle gore), 34 (sets) | gameplay/UI; parte só verificável com playtest humano |

### 3.2 Fora do Escopo
- Corrigir divergências (cada uma vira spec própria em `backlog/`).
- Avaliar se o efeito "fica bonito" — só se o comportamento declarado existe.

## 4. Requisitos (EARS)

| ID | Requisito | Verificação |
|---|---|---|
| R35.07-01 | Para cada spec auditada, a auditoria **DEVE** registrar no changelog da spec a data, o método (sonda, E2E, screenshot, leitura de estado) e o resultado (confirmada / divergente / requer humano). | revisão dos changelogs |
| R35.07-02 | **SE** uma spec divergir do runtime, **ENTÃO** a auditoria **DEVE** criar uma spec de correção em `backlog/` ou `scope-definition/` com a evidência, sem alterar código dentro da auditoria. | lista de specs criadas |
| R35.07-03 | **ONDE** o comportamento depender de A1 (Light2D/filtros), a auditoria **DEVE** ser repetida depois da entrega de 35.01, e só então classificada. | ordem de execução |
| R35.07-04 | As sondas **DEVEM** reaproveitar o helper `startMode(page, mode)` de `tests/e2e/smoke-playable.spec.ts` (35.02), sem atalhos DEV-only como `?biome=`. | revisão do código das sondas |

## 5. Método sugerido

A mesma sonda da auditoria de 2026-10-07: Playwright contra `vite preview`,
Chromium com `--use-gl=angle --use-angle=swiftshader`, `page.evaluate` lendo
`window.gameScene` (contagem por `texture.key`, `lighting`, `filters`,
`lights.getLightCount()`, bounds) + screenshot por spec. FPS medido nesse
ambiente **não** vale como evidência de performance.

## 6. Critério de Conclusão

Tabela da §3.1 preenchida com o resultado de cada spec, e as specs de
correção criadas, linkadas a partir de [35.00](../backlog/35_00_JOGAVEL_E_VISUAL_SEM_ASSETS_INDICE.md).

## Registro de Mudanças

| Data | O que mudou | Autor |
|------|-------------|-------|
| 2026-10-07 | Criação: o que foi e o que não foi verificado em runtime na auditoria da Spec 35 | Claude |
