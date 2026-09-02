---
agent_context: technical_specification_progression_and_contracts
target_module: docs/specs/backlog/12_PROGRESSAO_E_QUESTS_CONTRATOS.md
priority: medium
status: partial
last_updated: "2026-09-02"
tags:
  - progression
  - contracts
  - quests
  - talent_tree
  - run_modifiers
  - skill_evolution
---

# 📜 Spec 12: Progressão, Micro-Quests (Contratos) e Evolução de Habilidades

> **Status:** 🟡 PARCIALMENTE IMPLEMENTADO
> **Data:** Setembro de 2026
> **Domínio:** Progressão Roguelite, Contratos por Run, Modificadores de Desafio e Árvore de Talentos.

## 1. 🎯 Objetivo Geral
Expandir o propósito e a rejogabilidade de *Bloodmage 1995* através de metas dinâmicas por corrida (micro-quests/contratos), modificadores de desafio selecionáveis e escolhas de especialização de build que forcem o jogador a adaptar seu estilo de jogo a cada partida.

---

## 2. 🔍 Contexto & Estado Atual de Implementação

Diferente da especificação inicial do projeto, uma parte significativa desta frente já foi desenvolvida e integrada ao jogo em iterações anteriores:

### 🟢 Já Implementado e Integrado no Código:
- **Sistema de Contratos (Micro-Quests):** `ContractSystem.ts`, `ContractHUD.tsx`, `contracts.json` e `QuestTracker.tsx` operam em tempo real. A cada nova corrida, 3 contratos são selecionados do pool (ex: "Disciplinado", "Predador", "Sobrevivente"), acompanhados na HUD e recompensados imediatamente ao serem cumpridos.
- **Modificadores de Run:** `runModifiers.json` e `RunModifiersModal.tsx` oferecem mutadores antes de iniciar a partida (ex: "Maré de Sangue", "Penúria Rúnica"), escalando dificuldade e rendimento de Cristais de Sangue.
- **Quests de Campanha:** `campaignQuests.json` rastreia marcos de enredo e objetivos de longo prazo.

### 🔵 Pendente de Implementação (Foco desta Spec):
- **Ramificação Exclusiva na Árvore de Talentos:** Os nós atuais de `talents.json` são progressões lineares. Falta implementar caminhos mutuamente exclusivos (ex: escolher *Vampirismo Profundo* bloqueia *Execuções em Área* na mesma run).
- **Evolução por Feitiço / Skill Mutation:** Adicionar escolhas de especialização específica para cada magia ao atingir o nível 5 e 10 (ex: Foice Carmim ganhar efeito de desmembramento em AoE).

---

## 3. 📐 Especificação do Escopo Pendente

### 3.1. Ramificação Mutuamente Exclusiva
- Atualizar a estrutura de `talents.json` para suportar o atributo `"exclusive_with": ["id_do_outro_no"]`.
- Na interface da árvore de talentos, ao alocar um ponto em um nó com essa marcação, o nó oposto é visualmente selado com runas escuras e desativado até o fim da corrida atual.
- **Decisão de design (2026-09-02, ver `discovery/05_DISCOVERY_CAMPAIGN_PROGRESSION_LORE.md` §4):** a identidade narrativa do protagonista (mago amaldiçoado) permanece fixa — não há sistema de progressão livre por uso de arma (estilo Dungeon Siege 1). A liberdade de build fica inteiramente na ramificação de talentos, que deve cobrir três arquétipos de playstyle equivalentes em viabilidade, no mesmo padrão de "classe fixa, build livre" do Diablo 2:
  - **Melee-pesado:** nós que escalam dano/velocidade de ataque físico (arma inicial e upgrades físicos) e reduzem dependência de mana, com feitiços em papel de suporte ocasional.
  - **Híbrido:** nós que recompensam alternância ativa entre ataque físico e feitiços (ex: acertos físicos geram um recurso que barateia o próximo feitiço, ou vice-versa) — o "meio-termo" já sugerido no discovery doc original ("alternância orgânica").
  - **Caster-puro:** nós que escalam dano/efeito de feitiços e penalizam levemente o dano físico, para quem quer minimizar o combate corpo-a-corpo.
  - Os exemplos já existentes (*Vampirismo Profundo* vs. *Execuções em Área*) continuam válidos como ramificação dentro do eixo caster; esta expansão adiciona o eixo de arquétipo de playstyle como uma camada adicional de escolha exclusiva, não uma substituição.

### 3.2. Evolução por Habilidade (Nível 5 & 10)
- Ao elevar uma magia ao nível 5 ou 10 durante a run, abrir um popup de escolha entre 2 aprimoramentos qualitativos:
  - *Foice Sacrificial (Nível 5):* Opção A: +50% raio de alcance | Opção B: Sangramento contínuo por 3s.
  - *Explosão Necromântica (Nível 5):* Opção A: Fragmentos de ossos como projéteis secundários | Opção B: Roubo de vida de 10% do dano causado.

---

## 4. 🧪 Critérios de Aceite
- [x] 3 Contratos gerados aleatoriamente por run com acompanhamento dinâmico na HUD e entrega instantânea de recompensas (`ContractSystem.ts`).
- [x] Modificadores de corrida funcionais na tela de seleção antes do início da partida (`RunModifiersModal.tsx`).
- [ ] Árvore de talentos bloqueia caminhos mutuamente exclusivos quando um nó com `"exclusive_with"` é selecionado.
- [ ] Popup de evolução de feitiço é engajado corretamente ao atingir nível 5 e 10 de qualquer habilidade.

---

## 📊 Status & Esforço Estimado
- **Status:** 🟡 PARCIALMENTE IMPLEMENTADO (Contratos e Modificadores 100% funcionais; Ramificação de Talentos e Evolução de Skills em Backlog)
- **Esforço Estimado para Conclusão:** 2–3 dias de desenvolvimento.
