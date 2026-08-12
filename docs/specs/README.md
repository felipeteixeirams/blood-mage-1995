---
role: Product Manager / Architect
complexity: High
audience: Project Management + All Developers + AI Agents
agent_context: product, engineering, architecture
target_module: docs/specs
priority: high
status: active
last_updated: 2026-08-11
tags: [specs, index, master, kanban, decisions, maturation, pipeline]
---

# 📋 Documento Mestre de Especificações e Esteira de Desenvolvimento

> **⚠️ Fonte da Verdade de Engenharia & Produto:** Este é o ponto de acesso principal logo após o root `AGENTS.md`. Ele consolida todo o trabalho de implementação em andamento, planejado e finalizado, servindo como a bússola de desenvolvimento do Bloodmage 1995, independente de onde o projeto esteja sendo construído (Replit, Local Sandbox, Vercel ou GitHub).

---

## 🗺️ Mapa de Navegação Rápida

```
docs/specs/
├── README.md (Este arquivo - Entrada Master)
├── propostas/ — Ideias e conceitos iniciais em Backlog
├── andamento/ — Especificações técnicas e fases em desenvolvimento ativo
└── finalizadas/ — Especificações e relatórios de features prontas em produção
```

---

## 📊 Quadro Kanban Simplificado (Esteira de Desenvolvimento)

Abaixo está a representação visual da esteira de desenvolvimento do jogo, organizando as iniciativas pelo seu amadurecimento e estágio atual.

| 🔵 BACKLOG / PROPOSTAS | 🟡 PLANEJADO / DISCOVERY | 🟠 EM ANDAMENTO | 🟢 FINALIZADOS / PRODUÇÃO |
| :--- | :--- | :--- | :--- |
| **03. Multijogador Coop**<br>_Coop P2P via WebRTC_<br>📄 [[./propostas/03_MULTIJOVADOR_COOPERATIVO_E_INTERATIVIDADE.md]] | **02. Assets Externos (UI)**<br>_Transição para pixel-art de alta resolução_<br>📄 [[./propostas/02_DISCOVERY_UI_ASSETS_EXTERNOS.md]] | **Fase 4: Mundo Contínuo**<br>_Mapeamento de biomas, Safe Town e transições_<br>📄 [[./andamento/04_FASE4_MUNDO_CONTINUO.md]] | **Fase 1: Inconsciência**<br>_Sistema de desmaio do jogador (2x max)_<br>📄 [[./finalizadas/01_FASE1_INCONSCIENCIA.md]] |
| **05. Skinning & Camadas Canvas**<br>_Customização de visual em runtime_<br>📄 [[./propostas/05_SISTEMA_DE_SKINNING_E_CAMADAS_DINAMICAS.md]] | **04. Mobile App & Monetização**<br>_Ajustes finos Capacitor e IAP_<br>📄 [[./propostas/04_MOBILE_APP_E_MONETIZACAO_INDIE.md]] | **UI Gamepad Navigation**<br>_Navegação D-Pad em menus React/Phaser_<br>📄 [[./andamento/SPECS_EVOLUCAO.md]] | **Fase 2: Tela de Morte & Gore**<br>_Gore persistente, corpos e câmera de morte_<br>📄 [[./finalizadas/02_FASE2_TELA_DE_MORTE_E_GORE.md]] |
| **06. Sistema de Prestigio**<br>_Blood Seal prestige e scaling_<br>📄 [[./propostas/06_SISTEMA_DE_PRESTIGIO_BLOOD_SEAL.md]] | **D-1. Diálogos com NPCs**<br>_Sistema de árvore de conversas e quests locais_<br>📄 [[./andamento/04_FASE4_MUNDO_CONTINUO.md]] | | **Fase 3: Condições de Sobrevivência**<br>_Fome, infecção e itens curativos_<br>📄 [[./finalizadas/03_FASE3_CONDICOES_DE_SOBREVIVENCIA.md]] |
| **07. Eventos Globais Sazonais**<br>_Eventos rotativos do mundo gótico_<br>📄 [[./propostas/07_EVENTOS_MUNDIAIS_E_SAZONAIS.md]] | **D-2. Clima Dinâmico**<br>_Partículas de clima por bioma (chuva de sangue)_<br>📄 [[./andamento/04_FASE4_MUNDO_CONTINUO.md]] | | **Fase 5: Polimento de Produção**<br>_PWA completo, Gamepad, Haptics, Conquistas_<br>📄 [[./finalizadas/05_FASE5_POLIMENTO_PRODUCAO_COMPLETO.md]] |
| | **D-3. Fast Travel**<br>_Viagem rápida entre vilarejos descobertos_<br>📄 [[./andamento/04_FASE4_MUNDO_CONTINUO.md]] | | **Eixo A: Gráficos Avançados**<br>_postFX GPU, iluminação Light2D e Normal Maps_<br>📄 [[./andamento/06_EIXO_A_GRAFICOS_AVANCADOS.md]] |
| | | | **Records Display**<br>_Modal de recordes locais integrados_<br>📄 [[./finalizadas/01_RECORDS_DISPLAY.md]] |

---

## 🧠 Decisões de Engenharia & Arquitetura (ADRs Sintetizadas)

O amadurecimento técnico do Bloodmage 1995 é guiado por um conjunto de decisões arquiteturais rígidas para assegurar alta performance de codificação e execução:

### 1. Comunicação Desacoplada (Phaser ↔ React 19)
*   **Decisão:** O loop físico e render de alta frequência do Phaser atualiza o estado global no Zustand (`src/store/gameStore.ts`) de forma otimizada com throttling, enquanto a interface do usuário (HUD de feitiços, inventário, etc.) é desenhada no React 19.
*   **Mitigação de Inputs:** Para evitar que cliques nos overlays de React disparem ações no canvas do Phaser, eventos de pointer do React chamam estritamente `e.stopPropagation()` e `e.nativeEvent.stopImmediatePropagation()`.

### 2. Arquitetura Híbrida de Assets (Físico ↔ Fallback Procedural)
*   **Decisão:** Assets físicos (.png/.webp/.mp3) são carregados de forma prioritária. Caso ocorra falha de rede ou de carregamento, o sistema falha silenciosamente, envia telemetria via Sentry, e executa o fallback procedural (geração de canvas em tempo real em `textureGenerator.ts` ou síntese em `soundEngine.ts`) sob a mesma chave identificadora. Isso garante imunidade a "fantasmas visuais" e crashs por falta de arquivos físicos.

### 3. Persistência Sanitizada com Validação Zod Strict
*   **Decisão:** Nenhum dado é lido do `localStorage` sem validação rígida de tipo e limites. O arquivo `src/utils/localStorage.ts` encapsula todas as escritas e leituras através de esquemas Zod robustos, aplicando fallbacks automáticos para dados corrompidos de versões anteriores, prevenindo prototype pollution e quebras silenciosas.

### 4. Iluminação Light2D + Normal Maps Procedurais (Eixo A)
*   **Decisão:** A iluminação fictícia via CPU (Graphics overlay) foi substituída por iluminação 2D acelerada por GPU (WebGL `LightsPlugin`), com normal maps gerados dinamicamente em runtime através do cálculo de derivadas de luminância das texturas procedurais. Quando WebGL não está disponível, a engine reverte automaticamente para o fallback gráfico CPU.

### 5. Otimização Brutal de Performance (Fase 5 AAA)
*   **Decisão:** Para garantir 60+ FPS em dispositivos mobile modestos, o jogo implementa:
    *   **Object Pooling (`ObjectPool.ts`):** Reuso estático de projéteis, partículas e efeitos, eliminando gargalos de Garbage Collection.
    *   **Viewport Culling (`ViewportCuller.ts`):** Entidades fora da tela param de desenhar e processar atualizações pesadas de renderização.
    *   **AABB Pruning:** Testes rápidos de colisão de caixa delimitadora descartam elementos distantes antes de executar raycasts geométricos caros de linha de visão.

---

## 📈 Amadurecimento do Projeto (Maturation Levels)

Medição contínua do nível de prontidão comercial das frentes do projeto para o lançamento:

```
[Core Gameplay Engine]  █████████████████████████░ 96% (Estável, FSM Combat)
[Gráficos e Pós-FX]     ██████████████████████░░░ 88% (GPU Lights, Normal Maps)
[Persistência e Estado] █████████████████████████░ 98% (Strict Zod Schemas)
[Infraestrutura PWA/Lojas]██████████████████████░░░ 88% (PWA Webmanifest, TWA Scripts)
[Quests e Narrativa]    ██████████████░░░░░░░░░░░ 56% (Fase 4 Safe Town, Falta Dialog Tree)
```

### Detalhes de Maturação por Subsistema:
1.  **Core Combat & Physics (96%):** Altamente robusto. Estados de windup, strike e recovery totalmente implementados e livres de falhas. Proibição absoluta de touch damage passivo.
2.  **Sound Engine (90%):** Altamente robusto e leve, gerando trilhas de áudio e SFX puramente por síntese Web Audio, com suporte a transições dinâmicas de reverb para biomas indoors/outdoors.
3.  **UI & HUD Design (92%):** Layout Mobile-First excelente baseado em Diablo II e Dungeon Siege 1. Suporta HUD adaptativa, joystick virtual, gamepad cross-platform nativo e haptics em colisões/morte.
4.  **World & Generation (80%):** O ecossistema contínuo une a Safe Town inicial (Room 0) aos biomas. Possui persistência de cadáveres e manchas de sangue.

---

## 🔄 Fluxo de Esteira de Desenvolvimento (Workflow)

Independentemente se você está desenvolvendo no **Replit Sandbox**, **Localmente**, ou integrando no **GitHub**, siga estritamente os checkpoints abaixo ao mover uma iniciativa:

```
┌───────────┐     ┌───────────┐     ┌───────────┐     ┌───────────┐     ┌─────────────┐
│ 1.PROPOSTA│ ──> │2.DISCOVERY│ ──> │3.ANDAMENTO│ ──> │   4.QA    │ ──> │5.FINALIZADO │
└───────────┘     └───────────┘     └───────────┘     └───────────┘     └─────────────┘
  Conceito          Spec e GDD        Dev Ativo         Verificação       Merge & Deploy
```

### Checkpoints Exigidos por Transição:

#### A. Proposta ➔ Discovery
*   Discussão técnica preliminar documentada.
*   Viabilidade de orçamentos de RAM/VRAM para mobile validada.
*   Criação de rascunho de especificação em `docs/specs/propostas/`.

#### B. Discovery ➔ Andamento
*   Documento de especificação detalhado movido para `docs/specs/andamento/` ou `docs/features/`.
*   Zonas críticas anti-regressão em `docs/critical/01_CRITICAL_FILES.md` mapeadas e protegidas.
*   **Confirmação do Domínio:** Alterações em regras de combate ou status góticos exigem confirmação prévia formal do usuário.

#### C. Andamento ➔ QA
*   Compilação limpa com TypeScript Strict (`pnpm run typecheck` zero erros).
*   Testes unitários vitest passando sem exceção (`pnpm test`).
*   Verificação visual mobile em 320px de largura mantendo legibilidade e acessibilidade.

#### D. QA ➔ Finalizado
*   Validação de performance confirmando 60 FPS estáveis na cena de combate.
*   Mover arquivo de especificação técnica para `docs/specs/finalizadas/`.
*   Atualização deste Documento Mestre de Especificações e do painel Kanban.

---

## 🛠️ Guia do Desenvolvedor Cross-Platform

Seja no Replit Workspace, terminal local ou GitHub Actions, os comandos fundamentais de integridade são unificados:

### 1. Preparação de Ambiente
Se a pasta `node_modules` estiver ausente ou corrompida (comum em trocas rápidas de workspace do Replit), force a recriação limpa com:
```bash
pnpm install --force
```

### 2. Verificação de Tipos (Gate de Compilação)
O Bloodmage 1995 exige 100% de conformidade com TypeScript Strict. Rode antes de comitar:
```bash
pnpm run typecheck
```

### 3. Suite de Testes Unitários (Vitest)
Garante que as regras de persistência local, lógica de conquistas e pós-processamento estejam intactas:
```bash
pnpm test
```

### 4. Testes Ponta a Ponta (Playwright Visual)
Para checar regressões de renderização na HUD ou nos componentes góticos de React:
```bash
pnpm test:e2e
```

---

**Mantido por:** Product Manager / Lead Architect
**Última Atualização:** 2026-08-11
**Versão:** 1.2 (Master Spec & Unified Development Pipeline)

[[docs/README.md]] | [[AGENTS.md]] | [[docs/critical/01_CRITICAL_FILES.md]]
