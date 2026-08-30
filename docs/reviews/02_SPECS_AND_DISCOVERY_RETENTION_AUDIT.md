---
agent_context: Product Managers, Game Designers, Engenheiros e Agentes IA
target_module: Auditoria Geral de Specs, Roadmap, Discovery e Priorização Mobile
priority: high
status: active
last_updated: 2026-08-28
tags: [audit, specs-validation, discovery-filter, retention-kpi, mobile-first, prioritization]
---

# 🛡️ Auditoria Geral de Specs, Roadmap & Discoveries (Filtro de Sucesso Mobile)

> **Objetivo:** Auditar todas as especificações ativas, frentes de expansão, experimentos de *Discovery* e itens de roadmap de *Blood Mage 1995* sob a ótica da **Bíblia de Sucesso Mobile** (`docs/product/00_MOBILE_FIRST_SUCCESS_BIBLE.md`), eliminando desperdício de engenharia e blindando a retenção (D1/D7/D30).

---

## 🧭 Resumo Executivo da Auditoria

```
                                  MAPA DE DECISÃO DE PRODUTO
 ┌───────────────────────────────────────────────┬─────────────────────────────────────────────────┐
 │ 🟢 APROVADOS & PRIORITÁRIOS (Executar Já)     │ 🔴 REJEITADOS / CONGELADOS (Anti-Overengineering│
 ├───────────────────────────────────────────────┼─────────────────────────────────────────────────┤
 │ • Spec 15: PWA & Offline Engine (Pilar 5)     │ • Infraestrutura Cloud / Auth / Firebase        │
 │ • Experimento 01: Joystick Touch Feel (Pilar 4│ • Menus complexos de inventário em combate     │
 │ • Sinergias Rápidas de Nível (3 cartas D1/D7) │ • Diálogos longos e tutoriais textuais (TTF>10s)│
 │ • Telegrafias Visuais de Chefes (Pilar 3)     │ • Inventário com micro-gerenciamento de slots   │
 └───────────────────────────────────────────────┴─────────────────────────────────────────────────┘
```

---

## 🔍 1. Auditoria das Specs Existentes (11 a 15)

### 1.1 Spec 11: Visual Polish & VFX Fronts (Code-Driven Art)
* **Status Atual:** 8/8 Frentes Concluídas (BSP+CA Dungeon, Névoa, Pegadas de sangue, Hit-stop/Squash, Iluminação 2D/Glow, Pitch shift/Drone, Equip Palette Swap, Pulso de Altar).
* **Avaliação do Filtro Mobile:**
  * **[D1 / Game Feel - Pilar 1 & 2]:** ✅ *Hit-Stop* (40-80ms), *Pitch Shift* e sons com jitter trazem sensação de impacto imediato (dopamina visceral).
  * **[Clareza Visual - Pilar 3]:** ⚠️ **Atenção:** A luz ambiente muito escura (`#1a1a2e`) e o *Fog* podem comprometer a visibilidade em telas com reflexo de sol ou telas pequenas.
  * **[Performance - Pilar 5]:** ✅ O teto de filtros de Glow (`MAX_ACTIVE_BLOOM_TARGETS = 16`) e a desativação em `lowPerformanceParticles` protegem a taxa de 60 FPS.
* **Veredito:** 🟢 **APROVADO & CONCLUÍDO.** Diretriz contínua: manter sempre o jogador e as telegrafias de perigo no topo da hierarquia visual óptica (Níveis 1 e 2).

---

### 1.2 Spec 12: Expansion & Replayability Fronts
* **Status Atual:** 5/5 Frentes Concluídas (Armadilhas/Barris, Elites com afixos, Talent Tree, HUD/Minimapa, Trilha FM Procedural).
* **Avaliação do Filtro Mobile:**
  * **[D7 / Meta-progressão - Pilar 2]:** ✅ A Árvore de Talentos no Hub cria um objetivo claro de meta-progressão com os Cristais de Sangue acumulados.
  * **[Performance & Bundle Size - Pilar 1 & 5]:** ✅ A trilha sonora FM procedural (`bgmSynthesizer.ts`) sem arquivos de áudio pesados é um dos maiores acertos do projeto: zero download de assets, bundle < 2.5MB e tempo de boot instantâneo.
  * **[UX / Ergonomia - Pilar 4]:** ✅ Correção da sobreposição do inventário garantiu um único modal limpo.
* **Veredito:** 🟢 **APROVADO & CONCLUÍDO.**

---

### 1.3 Spec 13: Transição para ARPG Clássico & Safe House (Zero-to-Hero)
* **Status Atual:** 3 Frentes Concluídas (Safe House, Diálogos Maelen, Desbloqueio progressivo de magias).
* **Avaliação Crítica do Filtro Mobile:**
  * **[Alerta Crítico no Pilar 1 - Time to Fun < 10s]:** 🚨 **Risco de Churn no D1:** Se o jogador novato for forçado a iniciar na Safe House, desarmado, ler diálogos e caminhar pela floresta sem poderes por mais de 30-40 segundos, **a retenção no minuto 1 despenca**. Jogadores mobile buscam a fantasia do "Mago de Sangue Poderoso" imediatamente.
  * **Decisão de Produto:**
    1. O modo padrão de entrada no jogo deve ser **Ação Imediata (Arcade / Sobrevivência)** ou a introdução da Campanha deve levar menos de 5 segundos para o primeiro golpe de magia.
    2. Zero paredes de texto — diálogos com no máximo 2 linhas antes do combate.
* **Veredito:** 🟡 **APROVADO COM REQUISITO DE ONBOARDING RÁPIDO.**

---

### 1.4 Spec 14: Imersão, UI Premium e Game Feel
* **Status Atual:** Concluído (Caixa de diálogo 9-slice, Retículo Rúnico de Mira no Chão, Câmera Look-Ahead Lerp, Haptics e Screen Shake).
* **Avaliação do Filtro Mobile:**
  * **[Game Feel & Ergonomia - Pilares 1, 2, 4]:** 🏆 **Exemplar.** O Look-Ahead resolve a limitação de campo de visão em telas widescreen de smartphones, e o feedback de vibração suave (`navigator.vibrate`) substitui a necessidade de olhar constantemente a barra de HP.
* **Veredito:** 🟢 **APROVADO & CONCLUÍDO.**

---

### 1.5 Spec 15: PWA, Standalone Mode & Offline-Ready
* **Status Atual:** 🟢 **Concluído & Implementado** (Vite PWA, Service Worker Auto-Update, Hook `usePWA`, Offline Indicator e Banner 1-Touch).
* **Avaliação do Filtro Mobile:**
  * **[Resiliência Offline - Pilar 5]:** 🚀 Permite que o jogo seja instalado na tela inicial do Android/iOS, funcione 100% sem internet e bloqueie a orientação em `landscape` nativamente.
* **Veredito:** 🟢 **APROVADO & CONCLUÍDO.**

---

### 1.6 Spec 16: Evolução Gráfica, Resolução Adaptativa UI & Terreno Procedural 2.5D
* **Status Atual:** 🟢 **Concluído & Implementado** (Resolução virtual 1080p, Boss Zoom Out dinâmico suave, Heightmap Simplex Noise com octaves, Transitabilidade de Falésias $\Delta Z \le 1$ e Renderização de Paredes Verticais sombreadas - PRs #54, #57, #58).
* **Avaliação do Filtro Mobile:**
  * **[Hierarquia & Legibilidade - Pilares 3 & 4]:** 🏆 O escalonamento 1080p e a física de desnível vertical elevam a percepção de profundidade sem comprometer o framerate de 60 FPS no mobile.
* **Veredito:** 🟢 **APROVADO & CONCLUÍDO.**

---

### 1.7 Spec 17: Onboarding "In Media Res" & Fluxo de Combate Imediato (<10s Time-to-Fun)
* **Status Atual:** 🟢 **Concluído & Implementado** (Cerco Inicial com 3 rastejantes e 1 esqueleto telegrafado, Banner instrucional de Esquiva, Aceleração de XP para Nível 2 em <30s e Persistência Zod segura - PR #59).
* **Avaliação do Filtro Mobile:**
  * **[Retenção D1 & Time to Fun - Pilar 1]:** 🏆 O combate inicia em menos de 3 segundos, atingindo o pico de dopamina nos primeiros 30 segundos de jogo.
* **Veredito:** 🟢 **APROVADO & CONCLUÍDO.**

---

## 🎯 2. Avaliação de Ideias de Discovery & Backlog

Aplicando o **Checklist do Filtro de Sucesso (5 Gates)** sobre todas as ideias:

| Ideia / Proposta de Discovery | Impacto em KPI | Simplicidade (<5s) | Ergonomia Mobile | 60 FPS & Offline | Veredito & Decisão |
|---|---|---|---|---|---|
| **1. PWA & Offline Engine Completo (Spec 15)** | 🟢 Alto (D1/Crash) | 🟢 Alta (Instalar 1 toque) | 🟢 Nativo Landscape | 🟢 100% Offline | ✅ **CONCLUÍDO** |
| **2. Resolução 1080p & Terreno 2.5D (Spec 16)** | 🟢 Alto (Legibilidade) | 🟢 Fricção Zero | 🟢 FOV Dinâmico | 🟢 60 FPS | ✅ **CONCLUÍDO** |
| **3. Onboarding In Media Res & Dash (Spec 17)** | 🟢 Altíssimo (D1 Retenção) | 🟢 TTF < 10s | 🟢 Dica reativa touch | 🟢 Instantâneo | ✅ **CONCLUÍDO** |
| **4. Ergonomia Touch: Safe Area, Escala & Canhoto** | 🟢 Alto (D1 & D7) | 🟢 Config instantânea | 🟢 Thumb Zone total | 🟢 Sem custo | 🚀 **EM ANDAMENTO** |
| **5. Chefes Multiestágio com Telegrafias Vibrantes** | 🟢 Alto (D7 & D30) | 🟢 Leitura visual | 🟢 Arenas compactas | 🟢 60 FPS com pooling | ✅ **APROVAR (Próxima Fase)** |
| **6. Autenticação Cloud (Firebase / Supabase / Google)** | 🔴 Neutro/Negativo | 🔴 Fricção Alta (Login) | 🔴 Teclado cobre tela | 🔴 Requer internet | ❌ **REJEITADO / CONGELADO** |
| **7. Inventário com 50 slots de itens e durabilidade** | 🔴 Negativo (D1) | 🔴 Carga Cognitiva Alta | 🔴 Touch confuso | 🔴 Fricção em combate | ❌ **REJEITADO** |
| **8. Modo Gauntlet / Boss Rush Rápido (3-5 min)** | 🟢 Alto (Session Length) | 🟢 Ação imediata | 🟢 100% combate | 🟢 Salas isoladas | ✅ **APROVAR (Endgame D30)** |

---

## 🚀 3. Plano de Ação & Próximas Frentes Priorizadas

Com base nos dados e na disciplina de valor:

1. **Frente 1: Personalização Ergonômica Mobile & Safe Area Insets**  
   *Suporte a recortes de tela (Notches/Dynamic Island), Modo Canhoto e opções de escala do joystick virtual (`small/medium/large`).*
2. **Frente 2: Chefes Multiestágio & Indicadores Telegrafados**  
   *Combates épicos com ciclos claros de telegrafia de dano, fases com transições visuais e mecânicas ricas de esquiva.*
3. **Frente 3: Balanceamento do Ritual de Bênçãos & Progressão da Run**  
   *Refino das cartas de sangue e sinergias elementais (fogo, gelo, sangue, raio) para aumentar a rejogabilidade (D7/D30).*
