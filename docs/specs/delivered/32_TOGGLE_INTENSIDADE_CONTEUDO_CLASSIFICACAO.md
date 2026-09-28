---
agent_context: frontend, game-designer, gameplay-engineer
target_module: src/game/systems, src/game/scenes/SettingsScene.ts, src/utils/localStorage.ts
priority: medium
criticality: medium
status: delivered
start_date: "2026-09-09"
completion_date: "2026-09-10"
last_updated: "2026-09-10"
tags:
  - accessibility
  - content_rating
  - gore
  - settings
  - store_compliance
  - delivered
---

# 📜 Spec 32: Toggle de Intensidade de Conteúdo (Classificação Indicativa)

> **Status:** 🟢 100% IMPLEMENTADO E ENTREGUE
> **Data de Conclusão:** Setembro de 2026
> **Domínio:** Configurações de Acessibilidade/Conteúdo, Compliance de Lojas (Play Store/IARC).

## 1. 🎯 Objetivo Geral
Dar ao jogador (e às lojas de distribuição) uma opção de reduzir a intensidade visual do gore sem alterar a identidade temática do jogo, permitindo uma classificação indicativa mais branda em lojas mais rígidas (especialmente Play Store/IARC) sem descaracterizar a experiência para quem opta pelo conteúdo completo.

---

## 2. 🔍 Contexto & Motivação

**Decisão de design registrada em `discovery/05_DISCOVERY_CAMPAIGN_PROGRESSION_LORE.md` §4:** o tema "sangue" do jogo (Mago de Sangue, Cristais de Sangue, etc.) é mantido — o vocabulário/nomenclatura não é, isoladamente, o que eleva classificação indicativa. O fator real é a **intensidade visual da violência**: o jogo já tem um sistema de execução com desmembramento procedural e partículas de gore intensificadas (ver `delivered/20_ADVANCED_PARTICLES_SYSTEM.md` e o sistema de execução ligado às habilidades sacrificiais).

Esta spec propôs a mitigação prática: um toggle que troca a apresentação visual do gore por uma versão estilizada/abstrata, mantendo o feedback de impacto (hit-stop, screen shake, dano) intacto.

---

## 3. 📐 Escopo Entregue

### 3.1. Controle em Configurações (`SettingsScene.ts`)
- Opção interativa "Intensidade de Conteúdo" na tela de Configurações (Coluna 2, Linha 3), com alternância entre `GORE: COMPLETO` e `GORE: REDUZIDO`.
- Internacionalização completa em `src/i18n/ptBR.ts` e `src/i18n/enUS.ts`.
- Persistência reativa através de `updateSettings` e atualização em tempo de execução sem necessidade de reiniciar a cena.

### 3.2. Persistência Validada por Zod (`localStorage.ts`)
- Tipo `contentIntensity: 'full' | 'reduced'` incorporado à interface `GameSettings` (`src/types/game.ts`).
- Schema `z.enum(['full', 'reduced']).catch('full').optional()` em `SettingsSchema` garantindo fallback seguro contra dados corrompidos.
- Suíte unitária `src/utils/localStorage.test.ts` cobrindo persistência e sanitização automática de valores inválidos.

### 3.3. Adaptação nos Sistemas de Partículas e Desmembramento
- **`DismembermentSystem.ts`:** quando `contentIntensity === 'reduced'`, desativa desmembramento e decapitação procedural reconhecíveis, mantendo animação de colapso normal com feedback de impacto e áudio preservados.
- **`BloodSplatterSystem.ts`:** em modo reduzido, desativa spray arterial exagerado e fragmentos soltos, gerando poças de sangue mais sutis e contidas.
- **Game Feel Preservado:** Hit-stop, tremores de tela (screen shake), números de dano e sonoplastia continuam 100% ativos em ambos os modos.

---

## 4. 🧪 Critérios de Aceite

- [x] Opção "Intensidade de Conteúdo" visível e funcional em Configurações.
- [x] Modo "Reduzido" remove desmembramento reconhecível mantendo feedback de impacto.
- [x] Preferência persiste entre sessões via localStorage validado.
- [x] Nenhuma regressão de performance ou de game feel (hit-stop/shake/dano) em nenhum dos dois modos.
- [x] Suítes de testes unitários dedicadas passando 100% (`DismembermentSystem.test.ts`, `BloodSplatterSystem.test.ts`, `localStorage.test.ts`).

---

## 5. 📂 Referências no Código

- `src/types/game.ts` — Propriedade `contentIntensity?: 'full' | 'reduced'` em `GameSettings`.
- `src/game/scenes/SettingsScene.ts` — Renderização do seletor e persistência em tempo real.
- `src/utils/localStorage.ts` — Validação Zod e valor padrão `'full'`.
- `src/game/systems/DismembermentSystem.ts` — Lógica condicional de desmembramento.
- `src/game/systems/BloodSplatterSystem.ts` — Lógica condicional de partículas de sangue.
- `src/i18n/ptBR.ts` e `src/i18n/enUS.ts` — Strings localizadas da interface.
