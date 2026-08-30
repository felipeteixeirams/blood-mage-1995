# ROADMAP & ESTRATÉGIA DE FASES
*Bloodmage 1995*

> **ATENÇÃO AGENTES:** Este documento substitui qualquer spec antiga de Roadmap ou MVP. O projeto está em fase de "Descoberta". Não implemente integrações em nuvem (Supabase, Firebase, Google Sign-in) prematuramente.

## 🟢 FASE 0 — Fundação (Onde Estamos / O que Proteger)
**Objetivo:** Tornar o projeto seguro para continuar evoluindo.
- [x] Arquitetura base (React + Phaser isolados)
- [x] Testes / Estabilidade do Build / Vercel Deploy
- [x] Segurança (Secrets fora do client)
- [x] Workflow dos agentes ajustado e documentação limpa (Modo: Context-Driven)
- [x] Isolamento de Storage no `localStorage` (evitar que gameplay acesse direto, usar Zod schemas) — **fechado (27/08):** `src/utils/localStorage.ts` cobre 100% do storage do jogo com Zod (settings, high scores, cristais, talentos, relíquias, codex, achievements, run stats, `campaignState` — ver `docs/specs/13_ARPG_CAMPAIGN_AND_SAFE_HOUSE.md`, e agora também o progresso do `AchievementSystem.ts`). Os 3 pontos de acesso direto/sem validação encontrados na auditoria foram corrigidos: `RecordsScene.ts` e `RecordsDisplay.tsx` liam de chaves mortas (`bloodmage_1995_high_scores`/`bloodmage.records`) que nunca eram escritas em lugar nenhum — o "Salão dos Recordes" do menu de pausa sempre mostrava dados fake; agora ambos usam `loadHighScores()`. `AchievementSystem.ts` lia/escrevia direto na chave não-namespaceada `achievements_progress`; agora usa `loadAchievementProgress`/`saveAchievementProgress` (novo par de funções em `utils/localStorage.ts`, chave `bloodmage_1995_achievements_progress`, com migração automática da chave antiga).
- [x] Unificação do Sistema de Conquistas e Estatísticas — **fechado (27/08):** Sistema legado (`AchievementSystem.ts`, `AchievementNotification.ts`) totalmente unificado com `gameStore.ts`, `achievements.json` e o componente React `AchievementToast.tsx`. Todas as conquistas de combate, profundidade e sobrevivência são avaliadas centralizadamente pela store e renderizadas na camada React (respeitando estritamente a regra de UI Layering do Canvas vs DOM).

## 🟡 FASE 1 — Descoberta do Jogo & Consolidação de Game Feel (Concluída)
**Objetivo:** Descobrir que jogo realmente queremos fazer (Experimentação Rápida & Retenção Mobile).
- [x] **Câmera & Zoom Adaptativo** (Spec 14 & 16 - Look-Ahead Lerp, Resolução 1080p, Boss Zoom-out suave).
- [x] **Controles Touch & Mira Inteligente** (Twin-Stick, Cone Direcional Frontal e Mira por Prioridade de Ameaça).
- [x] **Sensação de Combate & Feedback Visceral** (Spec 11 & 14 - Hit-stop 40-80ms, Screen Shake com ruído Perlin, Haptics/Vibração).
- [x] **Terreno Procedural 2.5D & Falésias estilo Dungeon Siege** (Spec 16 - Heightmap Simplex Noise, Transitabilidade $\Delta Z \le 1$, Bloqueio de Falésia e Paredes Verticais sombreadas).
- [x] **Onboarding In Media Res & Time-to-Fun <10s** (Spec 17 - Cerco ao Altar de Sangue no Andar 1, Dica de Esquiva telegrafada e Level Up < 30s).
- [x] **PWA & Motor Offline-First** (Spec 15 - Service Worker, Cache Workbox, Hook `usePWA` e Banner de Instalação 1-Touch).
- [x] **Habilidades & Expansão de Magias** (Blood Bolt, Blood Nova AoE, Hemocyte Shield, Vampiric Touch).
- [x] **Inimigos, Densidade & Telegrafia** (FSM Windup/Strike/Recovery, Afixos de Elites, Rastejantes e Guerreiros Esqueleto).
- [x] **Direção Visual Estrita** (Canvas Phaser para Mundo/Entidades vs Overlays React DOM com Tailwind para toda UI).
- [x] **Trilha Sonora & Áudio Procedural** (Síntese FM Web Audio sem peso de assets, Sound Engine com jitter orgânico).

## 🟠 FASE 2 — Vertical Slice & Polimento Ergonômico (Foco Atual)
**Objetivo:** Uma fatia polida que represente o jogo final com ergonomia impecável no mobile (10–15 minutos de gameplay representativo).
- [ ] **Ergonomia Touch Avançada** (Safe Area Insets, Escala de Joystick `small/medium/large`, Modo Canhoto).
- [ ] **Chefes Multiestágio com Telegrafias Vibrantes** (Plutonia & Senhor da Morte com fases de padrões de bala e arena viva).
- [ ] **Balanceamento de Recompensas e Loot Drops** (Ritual de Bênçãos, Relíquias Passivas e Cristais de Sangue).
- [ ] **Congelamento das Decisões de Design Principais**.

## 🔵 FASE 3 — MVP
**Objetivo:** Jogo funcional e jogável de ponta a ponta (Standalone / Local).
- PWA funcional / Instalação
- Onboarding (Tutorial básico)
- Progressão de run completa
- Preparação de Analytics Básico (Eventos de gameplay definidos, não acoplados a provedor ainda)
- Crash Reporting real
- **Sem contas, sem auth, save apenas local.**

## 🟣 FASE 4 — Beta (Validação)
**Objetivo:** 5–10 jogadores reais.
- Análise de telemetria e feedback de usuários reais.
- Ponto de decisão: Há retenção? Precisamos de Cloud Save?

## ⚫ FASE 5 — Release & Cloud (Pós-Validação)
**Objetivo:** Publicação real e infraestrutura de nuvem.
- Se o jogo provar valor (Cenário B/C): Google Sign-in, Supabase, Cloud Save.
- Store Release Readiness (Privacy Policy, Data Safety, TWA/Play Store assets).
- Monetização (IAP).
