---
status: ANDAMENTO
phase: 4/4
priority: P2
start_date: 2026-08-10
eta: 2026-09-30
responsible: Jules (Google AI)
progress: 10% (Spec criada)
agent_context: backend, frontend, game designer
target_module: artifacts/bloodmage/src/game
last_updated: 2026-08-10
tags: [specs, phase-4, continuous-world, safe-town, room-0]
---

# 🗺️ Fase 4: Mundo Contínuo e Vilarejos Seguros (Safe Towns)

> **Status:** Em Andamento / Planejada | **Prioridade:** P2 (Média-Baixa)

---

## 📋 Visão Geral

**Objetivo:** Transicionar a estrutura de arena isolada/ondas para um mundo contínuo e conectado, centrado na Room 0 (Safe Town) com vilarejos e biomas em sequência.

**Impacto:** Transforma a estrutura do jogo em um ARPG de exploração com transições suaves e hubs de comércio e preparação.

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
- [ ] **Gerenciador de Mundo/Zonas**:
  - `WorldManager.ts` para controle de carregamento procedural e persistência de estado entre zonas.

### Nice to Have

- [ ] NPCs com linhas de diálogo interativas e pequenas quests locais.
- [ ] Iluminação ambiente e clima variáveis por bioma.
- [ ] Sistema de viagem rápida entre vilarejos já descobertos.

---

## 🏗️ Arquitetura e Estrutura Técnica

### Arquivos Envolvidos
- `src/game/scenes/SafeTownScene.ts` / `Room0.ts`: Cena do vilarejo seguro.
- `src/game/entities/NPC.ts`: Classe base de NPCs interativos com diálogos e lojas.
- `src/game/systems/WorldManager.ts`: Gerenciamento de conexões entre zonas e biomas.

---

## ✅ Critérios de Aceite

1. O jogador consegue andar livremente pela Room 0 sem ameaça de inimigos.
2. Interagir com os 4 NPCs abre seus respectivos diálogos e lojas.
3. A passagem pelos portais carrega o bioma subsequente mantendo os status e inventário do jogador.
