---
agent_context: technical_specification_content_rating_toggle
target_module: docs/specs/backlog/15_TOGGLE_INTENSIDADE_CONTEUDO_CLASSIFICACAO.md
priority: medium
status: backlog
last_updated: "2026-09-02"
tags:
  - accessibility
  - content_rating
  - gore
  - settings
  - store_compliance
---

# 📜 Spec 15: Toggle de Intensidade de Conteúdo (Classificação Indicativa)

> **Status:** 🔵 BACKLOG (0% implementado)
> **Data:** Setembro de 2026
> **Domínio:** Configurações de Acessibilidade/Conteúdo, Compliance de Lojas (Play Store/IARC).

## 1. 🎯 Objetivo Geral
Dar ao jogador (e às lojas de distribuição) uma opção de reduzir a intensidade visual do gore sem alterar a identidade temática do jogo, permitindo uma classificação indicativa mais branda em lojas mais rígidas (especialmente Play Store/IARC) sem descaracterizar a experiência para quem opta pelo conteúdo completo.

---

## 2. 🔍 Contexto & Motivação

**Decisão de design registrada em `discovery/05_DISCOVERY_CAMPAIGN_PROGRESSION_LORE.md` §4:** o tema "sangue" do jogo (Mago de Sangue, Cristais de Sangue, etc.) é mantido — o vocabulário/nomenclatura não é, isoladamente, o que eleva classificação indicativa. O fator real é a **intensidade visual da violência**: o jogo já tem um sistema de execução com desmembramento procedural e partículas de gore intensificadas (ver `delivered/20_ADVANCED_PARTICLES_SYSTEM.md` e o sistema de execução ligado às habilidades sacrificiais).

Esta spec propõe a mitigação prática: um toggle que troca a apresentação visual do gore por uma versão estilizada/abstrata, mantendo o feedback de impacto (hit-stop, screen shake, dano) intacto.

---

## 3. 📐 Especificação do Escopo

### 3.1. Novo Controle em Configurações
- Adicionar item "Intensidade de Conteúdo" na tela de Configurações, com duas opções: **Completo** (padrão) e **Reduzido**.
- Persistir a escolha via o mecanismo existente de `localStorage` com validação Zod (mesmo padrão dos demais settings).

### 3.2. Comportamento em "Reduzido"
- Substituir fragmentos de desmembramento (`AdvancedParticles.ts` / sistema de execução) por um efeito de dissolução/partículas abstratas (sem silhuetas de membros ou vísceras reconhecíveis).
- Reduzir a paleta de partículas de sangue para tons menos realistas (ex: mais escuro/estilizado, menos vermelho vívido saturado).
- Manter intactos: hit-stop, screen shake, dano numérico, feedback sonoro — a mudança é puramente visual, não afeta game feel ou dificuldade.

### 3.3. Fora do Escopo
- Não altera nomenclatura, lore, diálogos ou qualquer texto do jogo — apenas apresentação visual de VFX de combate.
- Não é um sistema de censura de texto/idioma — isso não é uma preocupação identificada para este projeto.

---

## 4. 🧪 Critérios de Aceite
- [ ] Opção "Intensidade de Conteúdo" visível e funcional em Configurações.
- [ ] Modo "Reduzido" remove desmembramento reconhecível mantendo feedback de impacto.
- [ ] Preferência persiste entre sessões via localStorage validado.
- [ ] Nenhuma regressão de performance ou de game feel (hit-stop/shake/dano) em nenhum dos dois modos.

---

## 📊 Status & Esforço Estimado
- **Status:** 🔵 BACKLOG (0% implementado)
- **Esforço Estimado:** 1–2 dias (reaproveita infraestrutura de partículas e settings já existentes).
