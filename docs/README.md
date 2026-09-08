# 📚 Base de Conhecimento e Mapa do Projeto (Bloodmage 1995)

> **MANDATO PARA AGENTES IA:** 
> O *Bloodmage 1995* opera em **Spec-Driven Mode restrito** associado a **Context-Driven Engineering**.
> 
> **NUNCA INICIE CÓDIGO** sem ler a documentação pertinente ao domínio solicitado.
>
> **Estado real do projeto (atualizado em 2026-09-08):** a Fase 1
> (Descoberta) já está **concluída** — o jogo tem hoje uma campanha de 4
> capítulos, sistema de habilidades, loot procedural, prestígio,
> relíquias, conquistas, PWA instalável e mais de 24 specs formalmente
> **entregues** (ver índice completo em `docs/specs/README.md`). O foco
> atual é a **Fase 2** (Vertical Slice / polimento — ver
> `docs/product/ROADMAP.md`). Não trate este projeto como um protótipo
> inicial: ele tem um processo spec-driven maduro com ciclo de vida
> completo (`in-progress/ → delivered/`) e um histórico de decisões
> arquiteturais registrado (`docs/architecture/07_DECISION_LOG.md`).
>
> **Sobre integrações em nuvem (Supabase/Google Auth/Cloud Save):** não
> existiram no projeto e foram removidas — são apenas uma possibilidade
> **futura condicional**, cogitada só pra Fase 5 e "se aplicável" (ver
> `docs/product/ACCOUNT_AND_DATA.md`). **NÃO implemente nenhuma
> integração de conta/nuvem sem confirmar com Felipe primeiro** — isso
> continua valendo mesmo com o projeto mais maduro do que "Fase 1"
> sugeria.
>
> Use os links abaixo para carregar contexto antes de codificar.

---

## 🗺️ Índice do Grafo de Conhecimento

### 1. 🏗️ Arquitetura (A Verdade Atual)
Como o sistema funciona *hoje*. Leitura obrigatória antes de refatorar sistemas grandes.
* `docs/architecture/00_OVERVIEW.md` - Visão macro da separação React vs Phaser.
* `docs/architecture/01_TECH_STACK.md` - Tecnologias e bibliotecas.
* `docs/architecture/02_CODE_ORGANIZATION.md` - Estrutura de pastas da `/src`.
* `docs/architecture/03_PHASER_PATTERNS.md` - Padrões de código dentro do motor de jogo.
* `docs/architecture/04_STATE_MANAGEMENT.md` - Como React e Phaser compartilham estado.
* `docs/architecture/05_GAMESCENE_REFACTOR.md` - Tracker do corte incremental de `GameScene.ts` em sistemas extraídos.
* `docs/architecture/05_SPEC_AND_CONTEXT_DRIVEN_ENGINEERING.md` - Metodologia de engenharia com IA (quando/como consultar specs antes de codificar).
* `docs/architecture/06_PHASER_REACT_BRIDGE_MIGRATION.md` - Histórico da migração 100% Zustand (zero `CustomEvent` de gameplay).
* `docs/architecture/07_DECISION_LOG.md` - Registro de decisões arquiteturais (ADR-lite): contexto, decisão e consequências das mudanças grandes.
* `docs/architecture/08_JULES_SESSION_PROMPT.md` - Prompt padrão de sessão manual do Jules (fonte única do texto colado em jules.google.com).
* `docs/architecture/09_JULES_QUEUE_HISTORY_2026_09.md` - Histórico da antiga fila dedicada de automação Jules (aposentada, consolidada na Fila de Prioridade de `docs/specs/README.md`).
* `docs/architecture/SEAMLESS_OPEN_WORLD_FEASIBILITY.md` - Viabilidade de mundo contínuo sem costuras (roadmap de streaming de chunks).
* `docs/critical/00_ANTI_REGRESSION_GUIDE.md` - Regras de ouro anti-regressão.
* `docs/critical/01_CRITICAL_FILES.md` - **CRÍTICO:** Arquivos que quebram o jogo se mexidos sem cuidado (Player.ts, Enemy.ts, GameScene.ts, DungeonGenerator.ts, gameStore.ts, localStorage.ts).
* `docs/critical/02_PERFORMANCE_OPTIMIZATION.md` - Padrões de pooling e poda espacial já validados.
* `docs/critical/03_TESTING_GATES.md` - Requisitos de teste antes de merge.
* `docs/critical/05_TROUBLESHOOTING_KNOWN_ISSUES.md` - **CRÍTICO:** Leia antes de debugar qualquer erro de renderização, áudio ou assets.
* `docs/critical/06_SECURITY_GUIDELINES.md` - CSP, validação de `localStorage` e gestão de segredos.
* `docs/product/ACCESSIBILITY.md` - Estado real dos toggles de acessibilidade/ergonomia já implementados.

### 2. 🧪 Experimentos & Discovery (Laboratório Mobile)
O que testamos e estamos validando. Hipóteses orientadas a *Game Feel* e retenção.
* `docs/experiments/01_CAMERA_AND_CONTROLS.md` - Câmera Look-Ahead, 1080p e Mira Inteligente Híbrida (Concluído).
* `docs/experiments/02_TOUCH_ERGONOMICS_AND_COMBAT_DEPTH.md` - Ergonomia Touch Avançada, Safe Area Insets, Escala de Joystick e Modo Canhoto.

### 3. 📜 Especificações Técnicas (Specs: in-progress, delivered, backlog, discovery)
Index mestre: `docs/specs/README.md`

#### 🟡 Em Andamento (`docs/specs/in-progress/`)
* `docs/specs/in-progress/03_FASE3_STATUS_SOBREVIVENCIA.md` - **Fase 3:** Status de Sobrevivência (sangramento/veneno/infecção) — só falta QA manual.
* `docs/specs/in-progress/05_FASE5_POLIMENTO_PRODUCAO_PWA_STEAM.md` - **Fase 5:** Polimento de Produção, PWA e Builds Electron/Steam — só falta i18n.
* `docs/specs/in-progress/25_MUNDO_CONTINUO_CHUNK_STREAMING.md` - Mundo Contínuo via Chunk Streaming — só falta Fase C (transições sem corte).

#### 🟢 Entregues / Concluídas (`docs/specs/delivered/`)
* `docs/specs/delivered/28_UI_MODAIS_SECUNDARIOS_E_GAMEPAD_NAVIGATION.md` - **Spec 28:** Padronização de Modais Secundários, Navegação Gamepad & Retratos Rúnicos.
* `docs/specs/delivered/11_VISUAL_POLISH_FRONTS.md` - **Spec 11:** Índice Mestre de Polimento Visual (Satélites 11.01 a 11.08: Masmorra, Neblina, Sangue, Hit-Stop, Bloom, Áudio, Paletas, NPCs).
* `docs/specs/delivered/12_EXPANSION_FRONTS.md` - **Spec 12:** Índice Mestre de Expansão (Satélites 12.01 a 12.05: Armadilhas, Elites, Meta-Progressão, UX/Minimapa, Áudio FM).
* `docs/specs/delivered/13_ARPG_CAMPAIGN_AND_SAFE_HOUSE.md` - **Spec 13:** Safe House do Santuário, Maelen e Transição de Campanha.
* `docs/specs/delivered/14_IMMERSION_AND_GAME_FEEL.md` - **Spec 14:** Haptics, Screen Shake, Look-Ahead e Caixas 9-Slice.
* `docs/specs/delivered/15_PWA_AND_OFFLINE_READY.md` - **Spec 15:** PWA Instalável, Cache Workbox e Modo Offline-First.
* `docs/specs/delivered/16_GRAPHICAL_UI_TERRAIN_EVOLUTION.md` - **Spec 16:** Resolução 1080p, Boss Zoom Out, Terreno 2.5D Heightmap, Falésias e Ergonomia Touch.
* `docs/specs/delivered/17_IN_MEDIA_RES_ONBOARDING_AND_COMBAT_FLOW.md` - **Spec 17:** Onboarding In Media Res, Cerco Inicial e TTF <10s.
* `docs/specs/delivered/18_PRESTIGE_SYSTEM_BLOOD_SEAL.md` - **Spec 18:** Sistema de Prestígio 'Blood Seal' e New Game+.
* `docs/specs/delivered/19_RELICS_AND_ARTIFACTS_SYSTEM.md` - **Spec 19:** Sistema de Relíquias e Artefatos Passivos.
* `docs/specs/delivered/20_ADVANCED_PARTICLES_SYSTEM.md` - **Spec 20:** Sistema de Partículas Avançadas (Sangue, Poeira, Magia, Almas).
* `docs/specs/delivered/21_ACHIEVEMENTS_SYSTEM.md` - **Spec 21:** Sistema de Conquistas Góticas e Modais React.
* `docs/specs/delivered/22_DASH_EVASION_MECHANIC.md` - **Spec 22:** Mecânica de Dash/Esquiva com I-Frames e Cooldown.
* `docs/specs/delivered/23_EIXO_A_GRAFICOS_AVANCADOS.md` - **Spec 23:** Índice Mestre de Gráficos Avançados (Satélites 23.01 a 23.03: GPU Shaders, Normal Maps e Light2D).
* `docs/specs/delivered/24_EVOLUCAO_GRAFICA_AUDIO_QUICKWINS_E_ROADMAP.md` - **Spec 24:** Índice Mestre de Evolução Gráfica e Áudio (Satélites 24.01 a 24.03: QuickWins, Ragdolls, Fear Distortion e Threat Tinnitus).

#### 🔵 Propostas & Backlog (`docs/specs/backlog/`)
* `docs/specs/backlog/` - Especificações prontas para implementação imediata (escopo 100% definido): Prestígio (modal de UI), Mapeamento de Sprites, Guia PixelLab, Atmosfera & Tensão, Contratos & Quests, Toggle de Conteúdo, Poisson Disk, Normal Map de Porta, Cloud Save, HUD residual.

#### 🟠 Escopo em Definição (`docs/specs/scope-definition/`)
* `docs/specs/scope-definition/` - Propostas reais que ainda não batem a barra técnica mínima de `backlog/` (Eventos Mundiais e Sazonais, Topologia de Mundo Contínuo/`gloomy_woods`).

#### 💡 Discoveries & Spikes (`docs/specs/discovery/`)
* `docs/specs/discovery/` - Pesquisas exploratórias, avaliações arquiteturais (Phaser 4.2.1, UI externa, pipeline de assets externos, P2P WebRTC, AI art pipeline e Store wrappers).

#### ⛔ Arquivadas / Rejeitadas (`docs/specs/rejected/`)
* `docs/specs/rejected/` - Propostas rejeitadas para proteção dos guardrails técnicos do projeto.

### 4. 📦 Produto, Estratégia e Bíblia de Sucesso
As regras de produto, onde estamos, diretrizes de retenção mobile e para onde vamos:
* `docs/product/00_MOBILE_FIRST_SUCCESS_BIBLE.md` - **A Bíblia de Sucesso Mobile & Framework de Retenção** (Evidence-based KPIs, Time to Fun <10s, Carga Cognitiva, Filtro de Discovery & Specs).
* `docs/product/ROADMAP.md` - Fases do projeto (0 a 5).
* `docs/product/ACCOUNT_AND_DATA.md` - Estratégia de Salvamento e Autenticação (Local Only).
* `docs/product/RELEASE_STRATEGY.md` - Requisitos para quando formos para a Play Store.
* `docs/product/COMMERCIAL_READINESS_GUIDE.md` - Guia estratégico de evolução e preparação comercial (4 pilares: Assets Retrô, Ponte de Dados, UI Retrátil, Mundo Nômade).

### 5. 🔍 Auditorias e Qualidade de Código (Reviews & Quality)
Relatórios de auditoria técnica, cobertura de testes e análise de segurança.
* `docs/reviews/02_SPECS_AND_DISCOVERY_RETENTION_AUDIT.md` - **Auditoria Geral de Specs, Roadmap & Discovery** (Filtro de Sucesso Mobile).
* `docs/reviews/AUDIT_REPORT_QUALIDADE_CODIGO_2026.md` - **Relatório de Auditoria de Qualidade de Código 2026** (Testes, Tratamento de Erros, Padrões de Design, Segurança e Resiliência).
* `docs/reviews/03_AUDITORIA_BASE_DOCUMENTAL_2026_09.md` - **Auditoria da Base Documental (2026-09)** — links quebrados, specs duplicadas/órfãs, erros factuais em `critical/`, mandato desatualizado do próprio `docs/README.md`, gaps de ADR/acessibilidade/segurança. ⚠️ Achados ainda não aplicados, ver tabela de remediação no final do arquivo.

### 6. 🗄️ Arquivo (Documentação Legada)
Specs originais, planos passados e documentação desatualizada. **Não use como verdade absoluta.**
* `docs/archive/` - Contém todo o histórico e planejamento obsoleto ou em pausa.

---

## 🚦 Regras de Operação Rápida
1. **Evite Alterações Massivas:** Se um arquivo tiver >400 linhas, faça edições cirúrgicas. Nunca reescreva o arquivo inteiro.
2. **Evite Acoplamento Precoce:** Não adicione código para lidar com Auth, Firebase, Supabase ou Cloud Save. 
3. **Mantenha o Fallback:** Sempre que adicionar assets, utilize os scripts híbridos de fallback.
4. **Isolamento de React e Phaser:** A comunicação React <-> Phaser se dá por eventos (Event Bus) e Zustand Store. Não passe instâncias do React para o Phaser nem vice-versa.
5. **Filtro de Sucesso Mobile Mandatório:** Toda nova proposta ou spec de feature deve passar pelo filtro de `docs/product/00_MOBILE_FIRST_SUCCESS_BIBLE.md` (Time to Fun <10s, impacto em D1/D7/D30, ergonomia touch e 60 FPS).
