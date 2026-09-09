---
agent_context: project-manager, game-designer, technical-director
target_module: docs/reviews
priority: high
status: registered
doc_type: audit_report
last_updated: 2026-09-09
tags: [audit, roadmap, game-feel, ui-ux, architecture, consulting]
---

# 📊 Auditoria Estratégica e Consultoria de Roadmap (PM View)

> **Propósito deste documento:** Registro formal da análise crítica das Specs de Discovery atuais, apontamento de gaps arquiteturais/design e proposta de um novo roadmap em 3 Fases focado em elevar o **Bloodmage 1995** a um padrão de qualidade *Indie-Premium* (polimento visual, estabilidade e game feel), servindo como base para segundas opiniões e futuras tomadas de decisão.

---

## 1. Auditoria Crítica das Specs de Discovery (Priorização)

Avaliamos as specs na pasta `discovery/` descartando prazos comerciais irreais e focando exclusivamente na qualidade final do produto.

### 🟢 O Caminho de Ouro (Focar Imediatamente)
*   **`01_EVOLUCAO_GRAFICA_AVANCADA` & `02_EIXO_A / B_ASSETS_EXTERNOS`**
    *   **Visão:** O coração do apelo visual do jogo. A transição para **Pixel Art Handcrafted + Phaser Light2D + Normal Maps procedurais** é o que dará o aspecto profissional e imersivo, fugindo do visual "jogo de browser amador".
    *   **Diretriz:** Fundir essas frentes. O asset deve ser pensado e exportado (Normal Map + Diffuse) diretamente para os shaders do Phaser.
*   **`05_DISCOVERY_CAMPAIGN_PROGRESSION_LORE` (Mundo Contínuo / ARPG Clássico)**
    *   **Visão:** A retenção do jogador mora aqui. O senso de lugar (Safe House) e a exploração sem cortes (Mundo Contínuo) elevam o produto de um simples "Roguelite de Arena" para um genuíno Action RPG.
    *   **Risco Técnico/Diretriz:** Requer a implementação de uma arquitetura sólida de *Chunk Streaming* no Phaser para evitar gargalos de memória.

### 🟡 Risco Elevado (Avançar com Extrema Cautela)
*   **`06_DISCOVERY_AI_ART_PIPELINE` (Pipeline de IA para Pixel Art)**
    *   **Visão:** Alto risco de degradação visual. IAs generativas destroem a consistência do Pixel Art (sub-pixel, grid snap, flicker de animação), podendo gerar corrupção de assets (problema já vivido no projeto).
    *   **Diretriz:** Pivotar a Spec. A IA deve gerar apenas *Concept Art*. A finalização/animação precisa passar por uma padronização rigorosa (script/humana) para evitar a aparência de "asset flip".

### 🔴 Armadilhas de Escopo (Congelar Imediatamente)
*   **`03_MULTIJOGADOR_COOPERATIVO_E_INTERATIVIDADE` (WebRTC P2P)**
    *   **Visão:** Adicionar multiplayer num jogo arquitetado como single-player multiplica a complexidade técnica absurdamente. 
    *   **Diretriz:** Congelar totalmente até a V1 Single-player estar impecável.
*   **`04_MOBILE_APP_E_MONETIZACAO_INDIE`**
    *   **Visão:** Otimização prematura. A arquitetura PWA atual já resolve a distribuição primária.
    *   **Diretriz:** Focar no *core-loop* e adiar o empacotamento Capacitor/TWA para o fim do ciclo.

---

## 2. Gaps Identificados (O que falta no radar?)

Três pilares cruciais para a "cara de jogo profissional" estão ausentes do atual ciclo de Discovery:

1.  **GAP 1: Game Feel & "Juiciness" (Micro-interações e Combate)**
    *   **Problema:** Um jogo estaticamente bonito perde o encanto sem um bom "feeling" tátil.
    *   **Solução:** Criar uma spec dedicada para *Hit Stops* (micro-congelamento ao acertar golpes críticos), *Camera Shake* responsivo, distorção de tela em impactos pesados, emissão de partículas físicas atreladas aos golpes e *Audio Ducking* dinâmico.
2.  **GAP 2: UI/UX Diegética (Coesão React + Canvas)**
    *   **Problema:** A arquitetura "React sobre Phaser" é excelente, mas interfaces React não estilizadas com rigor parecem "painéis corporativos SaaS" em cima de um jogo de fantasia sombria.
    *   **Solução:** Spec de UI Gótica utilizando *9-slice borders texturizadas com CSS* (`border-image`), blend-modes específicos e cursores customizados para que a interface pareça feita de pedra, metal e sangue.
3.  **GAP 3: Arquitetura de Migração de Save State e Versionamento**
    *   **Problema:** Com o escopo de ARPG contínuo, as sessões de save (Zod + LocalStorage) serão densas. Ao atualizar o jogo, schemas antigos podem corromper.
    *   **Solução:** Criar um Discovery para gerenciar versionamento de Save Data e migrações (upgrades de schema retroativos) para não resetar o progresso dos jogadores entre os patches.

---

## 3. Roadmap Proposto de Excelência (3 Fases)

Para evitar abraçar o mundo e focar em entregas de alto valor perceptível:

### 🛠️ Fase 1: Fundação Estética & Game Feel (Foco Atual)
*Transformar o jogo num produto esteticamente premium.*
*   **Ação:** Escrever e executar a "Spec de Direção de Arte Definitiva" (Pipeline de Arte Híbrida + Phaser Light2D/Shaders).
*   **Ação:** Especificar e implementar o **Game Feel** (combate visceral, impacto, partículas direcional).
*   **Ação:** Validar e aplicar o padrão Gótico nas interfaces React (UI Diegética 9-Slice).

### 🗺️ Fase 2: Expansão de Mundo & Progressão
*Com movimentação e combate satisfatórios, expandir o loop do jogo.*
*   **Ação:** Promover a spec de "Mundo Contínuo/ARPG" para implementação (Arquitetura de *Chunk Streaming*).
*   **Ação:** Implementar progressão Zero-to-Hero, interações na Safe House, inventário profundo e evolução do personagem.
*   **Ação:** Implementar o versionador/migrador de Save States.

### 🤖 Fase 3: Escala de Conteúdo & Otimização Pipeline
*Ganhar velocidade e escalar o volume do jogo com a base técnica congelada.*
*   **Ação:** Retomar a automação de arte com IA, focando em ferramentas restritas de pré-renderização.
*   **Ação:** Descongelar specs de Empacotamento Mobile Nativo para publicação.
