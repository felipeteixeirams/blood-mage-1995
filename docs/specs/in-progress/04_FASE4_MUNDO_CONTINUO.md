---
status: EM ANDAMENTO (95% Concluído - D-1 e D-2 entregues; D-3 pendente em discovery)
phase: 4/4
priority: P2
start_date: 2026-08-10
eta: 2026-09-30
responsible: Jules (Google AI)
progress: 95% (WorldManager, Safe Town com NPCs, iluminação adaptativa, áudio por bioma, corpos/sangue persistentes, D-1 Diálogos/Quests e D-2 Clima Dinâmico implementados; D-3 Viagem Rápida pendente)
agent_context: backend, frontend, game designer
target_module: artifacts/bloodmage/src/game
last_updated: 2026-08-31
tags: [specs, phase-4, continuous-world, safe-town, dynamic-lighting, soundscapes, persistent-corpses, dialogue-system, weather-particles]
---

# 🗺️ Fase 4: Mundo Contínuo, Vilarejos Seguros e Iluminação/Áudio Dinâmico por Bioma

> **Status:** Em Andamento (95% Concluído) | **Prioridade:** P2 (Média)

---

## 📋 Visão Geral

**Objetivo:** Transicionar a estrutura de arena isolada/ondas para um mundo contínuo e conectado, centrado na Room 0 (Safe Town) com vilarejos e biomas em sequência, incluindo transições orgânicas de iluminação (efeito de adaptação de pupilas caverna ↔ campo aberto) e transições áudio-ambientais por bioma.

**Impacto:** Transforma a estrutura do jogo em um ARPG de exploração imersivo com transições visuais e sonoras dinâmicas.

---

## 📝 Requisitos Funcionais

### Must Have (MVP) — 100% IMPLEMENTADO ✅

- [x] **Room 0 (Safe Town)**:
  - Zona neutra e protegida onde o combate é desativado e inimigos não nascem (`DungeonGenerator.ts`, `GameScene.ts`).
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
  - **Ambiente Aberto/Santuário**: Transição com flash suave de iluminação, expansão do raio de luz (`darknessOverlay` aberto a 320px) e feixes visuais de luz ambiente (`LightingSystem.ts`, `LightingPolish.ts`).
- [x] **Paisagem Sonora e Reverb Reativo (Ambient Audio & Reverb)**:
  - Ajuste dinâmico do `soundEngine`: Reverb e eco acentuado em cavernas e ambientes fechados; áudio ambiente com vento e sussurros em espaços abertos (`soundEngine.ts`).
- [x] **Gerenciador de Mundo/Zonas**:
  - `WorldManager.ts` para controle de carregamento procedural, transições visuais/sonoras e persistência de estado entre zonas.
- [x] **Corpos e Marcas Persistentes (Ecossistema Vivo)**:
  - Corpos de monstros ficam no chão por ~90s com fade gradual após a morte (`DismembermentSystem.ts`).
  - Manchas de sangue persistem por ~60s no chão e ~30s nas paredes (`blood_pool_stain`).
  - Todos gerenciados pelo `bloodStainsGroup` para limpeza correta na transição de andares.

---

### Backlog de Discovery (Itens Adicionais)

#### ✅ D-1 — NPCs com Diálogo Interativo e Quests Locais (100% IMPLEMENTADO)
- **Status:** Entregue e integrado na base de código.
- **Implementação:**
  - Árvore de diálogos declarativa em JSON (`src/data/dialogues.json`) e tipos de campanha (`src/types/campaign.ts`).
  - Ações de diálogo e gerenciamento de estado em Zustand (`src/store/gameStore.ts`: `startDialogue`, `selectDialogueChoice`, `closeDialogue`).
  - Componente UI React para modais de conversa gótica (`src/components/hud/DialogueModal.tsx`).
- **Validação:** Testes unitários em `src/store/gameStore.test.ts`.

#### ✅ D-2 — Clima Dinâmico por Bioma (100% IMPLEMENTADO)
- **Status:** Entregue e integrado na base de código.
- **Implementação:**
  - Sistema de partículas climáticas por bioma em `src/game/systems/AtmosphereSystem.ts`:
    - `spores`: Esporos bioluminescentes flutuantes no Fosso das Chagas (`particle_spore`).
    - `ash_embers`: Cinzas e brasas incandescente nas Catacumbas dos Mártires (`particle_ash`).
    - `blood_rain`: Chuva de sangue no Santuário de Sangue (`particle_blood_drop`).
  - Mapeamento de clima por zona em `src/game/systems/WorldManager.ts` (`particleWeather`).
- **Validação:** Testes unitários em `src/game/systems/AtmosphereSystem.test.ts`.

#### 🔍 D-3 — Viagem Rápida entre Vilarejos Descobertos (PENDENTE)
- **Valor:** Reduz fricção de locomoção no mundo contínuo em runs longas.
- **Escopo provável:** Pontos de viagem (fogueiras/portais) desbloqueados por visita; mapa rápido acessível pelo menu (T?) listando destinos; custo opcional (cristais) ou gratuito.
- **Decisões de design em aberto:** se há custo, se só destinos já visitados, se interrompe/limpa estado de zona atual (corpos/sangue), integração com o sistema de morte (cadáver).
- **Dependências:** `WorldManager`, mapa de zonas.

---

## 🏗️ Arquitetura e Estrutura Técnica

### Arquivos Envolvidos
- `src/game/systems/WorldManager.ts`: Gerenciamento de conexões entre zonas, transições de luz, clima e parâmetros de áudio.
- `src/game/systems/AtmosphereSystem.ts`: Emissor de partículas climáticas por bioma (D-2).
- `src/data/dialogues.json`: Árvores de diálogo dos NPCs da Safe Town (D-1).
- `src/store/gameStore.ts`: Gerenciamento das ações de diálogo (`startDialogue`, `selectDialogueChoice`, `closeDialogue`).
- `src/components/hud/DialogueModal.tsx`: Interface visual dos diálogos.
- `src/game/scenes/GameScene.ts`: Atualização do renderizador de iluminação e gatilhos de transição de ambiente.
- `src/utils/soundEngine.ts`: Suporte a perfil de Reverb/Filtros por ambiente (indoor vs outdoor).

---

## ✅ Critérios de Aceite

1. O jogador consegue andar livremente pela Room 0 sem ameaça de inimigos.
2. Interagir com os 4 NPCs abre seus respectivos diálogos e lojas.
3. A passagem entre ambientes fechados (cavernas) e abertos ajusta suavemente o raio da iluminação e gera o flash de adaptação visual.
4. O tom do áudio e os efeitos de reverb alternam dinamicamente ao cruzar as fronteiras dos biomas.
5. O clima dinâmico (esporos, cinzas, chuva de sangue) é emitido visualmente por bioma via `AtmosphereSystem`.
