---
status: ANDAMENTO
phase: 4/4
priority: P2
start_date: 2026-08-10
eta: 2026-09-30
responsible: Jules (Google AI)
progress: 60% (WorldManager, iluminação adaptativa e áudio implementados)
agent_context: backend, frontend, game designer
target_module: artifacts/bloodmage/src/game
last_updated: 2026-08-10
tags: [specs, phase-4, continuous-world, safe-town, dynamic-lighting, soundscapes]
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

- [ ] **Room 0 (Safe Town)**:
  - Zona neutra e protegida onde o combate é desativado e inimigos não nascem.
  - Ponto de spawn inicial ao iniciar a jornada.
- [ ] **NPCs Interativos na Safe Town**:
  - **Clérigo**: Oferece bênçãos e cura espiritual.
  - **Alquimista**: Vende remédios, antídotos e poções.
  - **Ferreiro**: Repara e aprimora equipamentos básicos.
  - **Ancião**: Concede dicas de lore e abre portais para zonas de perigo.
- [ ] **Biomas e Transições Lineares**:
  - Conexão contínua entre biomas (Fosso das Chagas -> Catacumbas -> Santuário de Sangue) via portais/passagens de transição.
- [x] **Iluminação Adaptativa por Bioma (Pupil Light Adaptation)**:
  - **Ambiente Fechado/Caverna**: Visão reduzida (`darknessOverlay` fechado a 130–170px, cor escura `0x050510`, névoa densa).
  - **Ambiente Aberto/Santuário**: Transição com flash suave de iluminação, expansão do raio de luz (`darknessOverlay` aberto a 320px) e feixes visuais de luz ambiente.
- [x] **Paisagem Sonora e Reverb Reativo (Ambient Audio & Reverb)**:
  - Ajuste dinâmico do `soundEngine`: Reverb e eco acentuado em cavernas e ambientes fechados; áudio ambiente com vento e sussurros em espaços abertos.
- [x] **Gerenciador de Mundo/Zonas**:
  - `WorldManager.ts` para controle de carregamento procedural, transições visuais/sonoras e persistência de estado entre zonas.

### Nice to Have

- [ ] NPCs com linhas de diálogo interativas e pequenas quests locais.
- [ ] Clima dinâmico por bioma (chuva de sangue no Santuário, cinzas flutuantes nas Catacumbas).
- [ ] Sistema de viagem rápida entre vilarejos já descobertos.

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
