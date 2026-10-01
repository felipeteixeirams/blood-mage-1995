---
agent_context: project-manager, game-designer, technical-director
target_module: docs/reviews
priority: high
status: consolidated
doc_type: audit_report
last_updated: 2026-09-09
tags: [audit, roadmap, game-feel, ui-ux, architecture, consulting, canonical]
---

# 📊 Roadmap Canônico (Visão PM + Auditoria Técnica TD)

> **Propósito deste documento:** Consolidação da estratégia de produto (Visão PM) com a realidade arquitetural do código (Visão Direção Técnica). Este é o **Caminho Canônico** que o projeto Bloodmage 1995 deve seguir para atingir o padrão *Indie-Premium*, mitigando riscos silenciosos na base de código.

---

## 1. O Ponto Cego Estratégico (O que a junção PM + TD revelou)

A estratégia do PM de focar na "Fundação Estética e Game Feel" e congelar escopos arriscados (como Multiplayer P2P) estava correta. No entanto, a auditoria técnica revelou que **a Fase 1 não é sobre criar do zero, mas sobre sistematizar o que já existe em estado fragmentado.**

Muitos sistemas já existem (`CombatFeel`, `PostFXSystem`, bordas 9-slice isoladas), mas estão despadronizados ou possuíam bugs críticos não testados.

---

## 2. Gaps Consolidados (Arquitetura e Produto)

| GAP | Visão do Produto (PM) | Realidade Técnica (TD) | Ação Canônica |
| :--- | :--- | :--- | :--- |
| **1. Game Feel** | Faltam micro-interações (Hit-stop, shake) para dar peso ao combate. | A fundação existe em `CombatFeel.ts`, mas o Hit-stop tinha um bug de *freeze-lock* letal (já resolvido). O sistema precisa de expansão segura, não reescrita. | Consolidar a fundação atual e expandir com partículas direcionais e audio ducking. |
| **2. UI Diegética** | A UI do React destoa do jogo, parecendo um "painel SaaS". Precisamos de um visual gótico (9-slice). | O código está duplicando `border-double` e 4 divs de canto por modal. Não existe um componente Design System. | Criar o componente central `<GothicFrame />` e refatorar os modais para consumi-lo. Fim da duplicação manual. |
| **3. Save System** | Mudar para Mundo Contínuo quebrará saves antigos se não houver versionamento. | A situação é crítica hoje: 7 schemas Zod isolados dão *reset silencioso* nos saves se qualquer campo for adicionado. | **(Bloqueador MÁXIMO)** Criar `SaveMigration.ts` e envelopar os saves antes de qualquer outra feature. |

---

## 3. ROADMAP CANÔNICO EM 3 FASES

Esqueça o desenvolvimento de novas features de gameplay temporariamente. A ordem de execução a partir de agora obedece estritamente ao controle de risco e sistematização.

### 🛠️ FASE 1: Consolidação Estrutural e Design System (ATUAL)
*O foco é criar a fundação que impede o jogo de quebrar, padronizando a arte e a UI existente.*

1. **`[URGENTE]` Versionamento de Save (`SaveMigration.ts`):** 
   - Envelopar os 7 stores atuais do `localStorage.ts` em `{ version: number, payload: any }`.
   - Adicionar mecanismo de migração segura para evitar o wipe silencioso dos jogadores na próxima atualização.
2. **Design System Gótico Centralizado (`GothicFrame.tsx`):**
   - Extrair a técnica 9-slice do `DialogueModal` para um componente global unificado (`variant: 'stone' | 'metal' | 'blood'`).
   - Substituir `TalentsModal`, `AchievementsModal` e `SettingsModal` para consumirem esse frame.
3. **Expansão de Game Feel (`CombatFeel` & `PostFX`):**
   - Com o bug do hit-stop já resolvido na engine, adicionar o *Audio Ducking* (abafar som na explosão/morte) e as partículas físicas direcionais.

### 🗺️ FASE 2: Mundo Contínuo & Progressão Segura
*Só iniciada quando o sistema de Save estiver versionado.*
1. Implementar o *Chunk Streaming* (Phaser) para exploração contínua e conectividade dos biomas (Spec 18).
2. Adicionar os dados da Campanha Clássica (Lore, NPCs na Safe House) nos Schemas Zod agora versionados com segurança.

### 🤖 FASE 3: Automação Segura e Escala
1. **Pipeline de Arte:** Ferramentas Node.js para validação técnica de assets gerados por IA, usados apenas como Concept Art ou Base Frames.
2. **Distribuição:** Empacotamento Capacitor (Mobile Nativo) do PWA já testado.

