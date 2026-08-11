---
status: ANDAMENTO
phase: 4/4
priority: P2
start_date: 2026-08-10
eta: 2026-09-30
responsible: Jules (Google AI)
progress: 80% (WorldManager, iluminação adaptativa, áudio, Safe Town com NPCs, corpos persistentes e marcas de sangue implementados; backlog D-1 a D-3 registrado como discovery)
agent_context: backend, frontend, game designer
target_module: artifacts/bloodmage/src/game
last_updated: 2026-08-11
tags: [specs, phase-4, continuous-world, safe-town, dynamic-lighting, soundscapes, persistent-corpses]
---

# 🗺️ Fase 4: Mundo Contínuo, Vilarejos Seguros e Iluminação/Áudio Dinâmico por Bioma

> **Status:** Em Andamento / Detalhada | **Prioridade:** P2 (Média)

---

## 📋 Visão Geral

**Objetivo:** Transicionar a estrutura de arena isolada/ondas para um mundo contínuo e conectado, centrado na Room 0 (Safe Town) com vilarejos e biomas em sequência, incluindo transições orgânicas de iluminação (efeito de adaptação de pupilas caverna ↔ campo aberto) e transições áudio-ambientais por bioma.

**Impacto:** Transforma a estrutura do jogo em um ARPG de exploração imersivo com transições visuais e sonoras dinâmicas.

---

## 📝 Requisitos Funcionais

### Must Have (MVP)

- [x] **Room 0 (Safe Town)**:
  - Zona neutra e protegida onde o combate é desativado e inimigos não nascem.
  - Ponto de spawn inicial ao iniciar a jornada.
- [x] **NPCs Interativos na Safe Town**:
  - **Clérigo**: Oferece bênçãos e cura espiritual.
  - **Alquimista**: Vende remédios, antídotos e poções.
  - **Ferreiro**: Repara e aprimora equipamentos básicos.
  - **Ancião**: Concede dicas de lore e abre portais para zonas de perigo.
- [x] **Biomas e Transições Lineares**:
  - Conexão contínua entre biomas (Fosso das Chagas -> Catacumbas -> Santuário de Sangue) via portais/passagens de transição.
- [x] **Iluminação Adaptativa por Bioma (Pupil Light Adaptation)**:
  - **Ambiente Fechado/Caverna**: Visão reduzida (`darknessOverlay` fechado a 130–170px, cor escura `0x050510`, névoa densa).
  - **Ambiente Aberto/Santuário**: Transição com flash suave de iluminação, expansão do raio de luz (`darknessOverlay` aberto a 320px) e feixes visuais de luz ambiente.
- [x] **Paisagem Sonora e Reverb Reativo (Ambient Audio & Reverb)**:
  - Ajuste dinâmico do `soundEngine`: Reverb e eco acentuado em cavernas e ambientes fechados; áudio ambiente com vento e sussurros em espaços abertos.
- [x] **Gerenciador de Mundo/Zonas**:
  - `WorldManager.ts` para controle de carregamento procedural, transições visuais/sonoras e persistência de estado entre zonas.
- [x] **Corpos e Marcas Persistentes (Ecossistema Vivo)**:
  - Corpos de monstros ficam no chão por ~90s com fade gradual após a morte.
  - Manchas de sangue persistem por ~60s no chão e ~30s nas paredes.
  - Todos gerenciados pelo `bloodStainsGroup` para limpeza correta na transição de andares.

### Nice to Have → Backlog de Discovery

Itens sem spec detalhada. Seguem como **discovery** — escopo, valor e decisões necessárias registradas abaixo. Só devem virar `andamento` (spec detalhada) quando um deles for priorizado por Felipe.

#### 🔍 D-1 — NPCs com Diálogo Interativo e Quests Locais

- **Valor:** Transforma a Safe Town de vitrine em ponto de interação. Hoje os 4 NPCs abrem lojas/portais, mas sem narrativa nem quests.
- **Escopo provável:** Sistema de diálogo em árvore (nós + opções) com persistência de flags por run; mini-quests locais com recompensas (itens/cristais); integração com o sistema de quests existente.
- **Decisões de design em aberto:** quantidade de linhas por NPC, tom de escrita (lore dark fantasy 1995), recompensas por quest, se diálogo pausa o jogo, se há progressão de relacionamento entre runs.
- **Dependências:** sistema de diálogo UI (provável reuso do padrão de modais), persistência de flags (localStorage já existe).

#### 🔍 D-2 — Clima Dinâmico por Bioma

- **Valor:** Alto — é o que diferencia visualmente cada bioma. A spec 7.3 já cobre o **áudio** ambiente por bioma; D-2 cobre o **visual** (partículas/efeitos).
- **Escopo provável:** Sistema de partículas climáticas por zona (chuva de sangue no Santuário, cinzas nas Catacumbas, poeira/vapor no Fosso); intensidade graduada na transição entre biomas; custo controlado por bioma (PWA mobile).
- **Decisões de design em aberto:** quais efeitos por bioma, densidade máxima de partículas, impacto no gate de 60 FPS, interação com `lowPerformanceParticles` (setting existente).
- **Dependências:** sistema de partículas (Fase 5 — `AdvancedParticles` reescrito com `scene.add.particles`), `WorldManager` (gatilho de transição).

#### 🔍 D-3 — Viagem Rápida entre Vilarejos Descobertos

- **Valor:** Reduz fricção de locomoção no mundo contínuo em runs longas.
- **Escopo provável:** Pontos de viagem (fogueiras/portais) desbloqueados por visita; mapa rápido acessível pelo menu (T?) listando destinos; custo opcional (cristais) ou gratuito.
- **Decisões de design em aberto:** se há custo, se só destinos já visitados, se interrompe/limpa estado de zona atual (corpos/sangue), integração com o sistema de morte (cadáver).
- **Dependências:** `WorldManager`, mapa de zonas.

---

## 🏗️ Arquitetura e Estrutura Técnica

### Arquivos Envolvidos
- `src/game/systems/WorldManager.ts`: Gerenciamento de conexões entre zonas, transições de luz e parâmetros de áudio.
- `src/game/scenes/GameScene.ts`: Atualização do renderizador de iluminação e gatilhos de transição de ambiente.
- `src/utils/soundEngine.ts`: Suporte a perfil de Reverb/Filtros por ambiente (indoor vs outdoor).

---

## ✅ Critérios de Aceite

1. O jogador consegue andar livremente pela Room 0 sem ameaça de inimigos.
2. Interagir com os 4 NPCs abre seus respectivos diálogos e lojas.
3. A passagem entre ambientes fechados (cavernas) e abertos ajusta suavemente o raio da iluminação e gera o flash de adaptação visual.
4. O tom do áudio e os efeitos de reverb alternam dinamicamente ao cruzar as fronteiras dos biomas.
