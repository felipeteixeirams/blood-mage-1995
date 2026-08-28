# ROADMAP & ESTRATÉGIA DE FASES
*Bloodmage 1995*

> **ATENÇÃO AGENTES:** Este documento substitui qualquer spec antiga de Roadmap ou MVP. O projeto está em fase de "Descoberta". Não implemente integrações em nuvem (Supabase, Firebase, Google Sign-in) prematuramente.

## 🟢 FASE 0 — Fundação (Onde Estamos / O que Proteger)
**Objetivo:** Tornar o projeto seguro para continuar evoluindo.
- [x] Arquitetura base (React + Phaser isolados)
- [x] Testes / Estabilidade do Build / Vercel Deploy
- [x] Segurança (Secrets fora do client)
- [x] Workflow dos agentes ajustado e documentação limpa (Modo: Context-Driven)
- [x] Isolamento de Storage no `localStorage` (evitar que gameplay acesse direto, usar Zod schemas) — **fechado (27/08):** `src/utils/localStorage.ts` cobre 100% do storage do jogo com Zod (settings, high scores, cristais, talentos, relíquias, codex, achievements, run stats, `campaignState`).
- [x] Unificação do Sistema de Conquistas e Estatísticas — **fechado (27/08):** Sistema legado (`AchievementSystem.ts`, `AchievementNotification.ts`) totalmente unificado com `gameStore.ts`, `achievements.json` e o componente React `AchievementToast.tsx`. Todas as conquistas de combate, profundidade e sobrevivência são avaliadas centralizadamente pela store e renderizadas na camada React (respeitando estritamente a regra de UI Layering do Canvas vs DOM).

## 🟡 FASE 1 — Descoberta do Jogo (Foco Atual)
**Objetivo:** Descobrir que jogo realmente queremos fazer (Experimentação Rápida).
*Nada aqui precisa estar "final".*
- [x] Câmera - [ ] Câmera & Zoom (Game Feel) Zoom (Game Feel) (Spec 14 - Look-Ahead)
- [x] Controles Touch / Virtual Joystick (Twin-Stick Update)
- [x] Sensação do Combate / Hit-stop / Screen Shake (Spec 14 - Haptics)
- [ ] Habilidades (Blood Bolt, AoE, MP Drain)
- [ ] Inimigos & Densidade
- [ ] Mapa e Ambientação
- [ ] Progressão (Sem persistência pesada, focado na run atual)
- [ ] Direção Visual (UI React vs Phaser)

## 🟠 FASE 2 — Vertical Slice
**Objetivo:** Uma fatia polida que represente o jogo final.
- "Se eu mostrar 10–15 minutos desse jogo, ele representa o jogo que quero criar?"
- Início do congelamento de decisões de design.

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
