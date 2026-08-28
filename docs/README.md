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

### 2. 🧪 Experimentos (Laboratório / Fase 1)
O que estamos testando agora. Estas não são specs rígidas, são hipóteses de *Game Feel*.
* `docs/experiments/01_CAMERA_AND_CONTROLS.md` - Ajustes de Câmera, Touchpad e Deadzones.

### 3. 📦 Produto, Especificações e Estratégia (Fundações)
As regras de produto, onde estamos e para onde vamos, divididas por Fases.
* `docs/product/ROADMAP.md` - Fases do projeto (0 a 5).
* `docs/product/ACCOUNT_AND_DATA.md` - Estratégia de Salvamento e Autenticação (Local Only).
* `docs/product/RELEASE_STRATEGY.md` - Requisitos para quando formos para a Play Store.
* `docs/specs/16_GRAPHICAL_UI_TERRAIN_EVOLUTION.md` - **Spec 16:** Evolução Gráfica, Resolução Adaptativa UI & Terreno Procedural 2.5D/3D.

### 4. 🔍 Auditorias e Qualidade de Código (Reviews & Quality)
Relatórios de auditoria técnica, cobertura de testes e análise de segurança.
* `docs/reviews/AUDIT_REPORT_QUALIDADE_CODIGO_2026.md` - **Relatório de Auditoria de Qualidade de Código 2026** (Testes, Tratamento de Erros, Padrões de Design, Segurança e Resiliência).

### 5. 🗄️ Arquivo (Documentação Legada)
Specs originais, planos passados e documentação desatualizada. **Não use como verdade absoluta.**
* `docs/archive/` - Contém todo o histórico e planejamento obsoleto ou em pausa.

---

## 🚦 Regras de Operação Rápida
1. **Evite Alterações Massivas:** Se um arquivo tiver >400 linhas, faça edições cirúrgicas. Nunca reescreva o arquivo inteiro.
2. **Evite Acoplamento Precoce:** Não adicione código para lidar com Auth, Firebase, Supabase ou Cloud Save. 
3. **Mantenha o Fallback:** Sempre que adicionar assets, utilize os scripts híbridos de fallback.
4. **Isolamento de React e Phaser:** A comunicação React <-> Phaser se dá por eventos (Event Bus) e Zustand Store. Não passe instâncias do React para o Phaser nem vice-versa.
