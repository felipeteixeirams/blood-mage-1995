# ROADMAP & ESTRATÉGIA DE FASES
*Bloodmage 1995*

> **ATENÇÃO AGENTES:** Este documento substitui qualquer spec antiga de Roadmap ou MVP. O projeto está em fase de "Descoberta". Não implemente integrações em nuvem (Supabase, Firebase, Google Sign-in) prematuramente.

## 🟢 FASE 0 — Fundação (Onde Estamos / O que Proteger)
**Objetivo:** Tornar o projeto seguro para continuar evoluindo.
- [x] Arquitetura base (React + Phaser isolados)
- [x] Testes / Estabilidade do Build / Vercel Deploy
- [x] Segurança (Secrets fora do client)
- [x] Workflow dos agentes ajustado e documentação limpa (Modo: Context-Driven)
- [ ] Isolamento de Storage no `localStorage` (evitar que gameplay acesse direto, usar Zod schemas) — **quase lá (auditado 27/08):** `src/utils/localStorage.ts` já cobre praticamente tudo com Zod (settings, high scores, cristais, talentos, relíquias, codex, achievements, run stats, e agora `campaignState` — ver `docs/specs/13_ARPG_CAMPAIGN_AND_SAFE_HOUSE.md`). Faltam só 3 pontos de acesso direto e sem validação: `RecordsScene.ts:43`, `AchievementSystem.ts:143,164` e `RecordsDisplay.tsx:25` (chaves `bloodmage_1995_high_scores`/`achievements_progress`, fora do padrão de nomenclatura `bloodmage_1995_*` usado no resto). Migrar esses 3 fecha o item de vez.

## 🟡 FASE 1 — Descoberta do Jogo (Foco Atual)
**Objetivo:** Descobrir que jogo realmente queremos fazer (Experimentação Rápida).
*Nada aqui precisa estar "final".*
- [ ] Câmera & Zoom (Game Feel)
- [ ] Controles Touch / Virtual Joystick
- [ ] Sensação do Combate / Hit-stop / Screen Shake
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
