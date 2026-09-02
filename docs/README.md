# 📚 Base de Conhecimento e Mapa do Projeto (Bloodmage 1995)

> **MANDATO PARA AGENTES IA:** 
> O *Bloodmage 1995* opera em **Spec-Driven Mode restrito** associado a **Context-Driven Engineering**.
> 
> **NUNCA INICIE CÓDIGO** sem ler a documentação pertinente ao domínio solicitado.  
> **NUNCA ASSUMA** arquiteturas passadas (como Supabase/Google Auth) a menos que explicitamente indicado na árvore atual. O jogo está na **Fase 1 (Descoberta)**, onde velocidade e experimentação de Game Feel (câmera, controle, hitbox) superam integrações em nuvem e overengineering.
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
* `docs/critical/05_TROUBLESHOOTING_KNOWN_ISSUES.md` - **CRÍTICO:** Leia antes de debugar qualquer erro de renderização, áudio ou assets.

### 2. 🧪 Experimentos & Discovery (Laboratório Mobile)
O que testamos e estamos validando. Hipóteses orientadas a *Game Feel* e retenção.
* `docs/experiments/01_CAMERA_AND_CONTROLS.md` - Câmera Look-Ahead, 1080p e Mira Inteligente Híbrida (Concluído).
* `docs/experiments/02_TOUCH_ERGONOMICS_AND_COMBAT_DEPTH.md` - Ergonomia Touch Avançada, Safe Area Insets, Escala de Joystick e Modo Canhoto.

### 3. 📜 Especificações Técnicas (Specs: in-progress, delivered, backlog, discovery)
Index mestre: `docs/specs/README.md`

#### 🟡 Em Andamento (`docs/specs/in-progress/`)
* `docs/specs/in-progress/04_FASE4_MUNDO_CONTINUO.md` - **Fase 4:** Mundo Contínuo, Safe Town (Room 0) e Iluminação Adaptativa.
* `docs/specs/in-progress/05_FASE5_POLIMENTO_PRODUCAO_PWA_STEAM.md` - **Fase 5:** Polimento de Produção, PWA e Builds Electron/Steam.
* `docs/specs/in-progress/08_MAPEAMENTO_COMPLETO_SPRITES_E_CHECKLIST.md` - Mapeamento completo de Sprites e Checklist de integração.
* `docs/specs/in-progress/09_PIXEL_LAB_PROMPT_GUIDE.md` - Guia de Prompts e parâmetros PixelLab para Sprites.

#### 🟢 Entregues / Concluídas (`docs/specs/delivered/`)
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
* `docs/specs/backlog/` - Propostas formais de novas mecânicas e expansões (Eventos Mundiais, Guia Comercial, Referências HUD Diablo/Dungeon Siege, Polimento Procedural, Atmosfera & Tensão, Contratos & Quests, UI Framework e Sprites Tiers).

#### 💡 Discoveries & Spikes (`docs/specs/discovery/`)
* `docs/specs/discovery/` - Pesquisas exploratórias, avaliações arquiteturais (Phaser 4.2.1, UI externa, P2P WebRTC, AI art pipeline e Store wrappers).

#### ⛔ Arquivadas / Rejeitadas (`docs/specs/rejected/`)
* `docs/specs/rejected/` - Propostas rejeitadas para proteção dos guardrails técnicos do projeto.

### 4. 📦 Produto, Estratégia e Bíblia de Sucesso
As regras de produto, onde estamos, diretrizes de retenção mobile e para onde vamos:
* `docs/product/00_MOBILE_FIRST_SUCCESS_BIBLE.md` - **A Bíblia de Sucesso Mobile & Framework de Retenção** (Evidence-based KPIs, Time to Fun <10s, Carga Cognitiva, Filtro de Discovery & Specs).
* `docs/product/ROADMAP.md` - Fases do projeto (0 a 5).
* `docs/product/ACCOUNT_AND_DATA.md` - Estratégia de Salvamento e Autenticação (Local Only).
* `docs/product/RELEASE_STRATEGY.md` - Requisitos para quando formos para a Play Store.

### 5. 🔍 Auditorias e Qualidade de Código (Reviews & Quality)
Relatórios de auditoria técnica, cobertura de testes e análise de segurança.
* `docs/reviews/02_SPECS_AND_DISCOVERY_RETENTION_AUDIT.md` - **Auditoria Geral de Specs, Roadmap & Discovery** (Filtro de Sucesso Mobile).
* `docs/reviews/AUDIT_REPORT_QUALIDADE_CODIGO_2026.md` - **Relatório de Auditoria de Qualidade de Código 2026** (Testes, Tratamento de Erros, Padrões de Design, Segurança e Resiliência).

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
