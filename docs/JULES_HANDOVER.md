# 📜 Guia de Handover: Bloodmage 1995 -> Google Jules + Stitch

Este documento detalha o estado atual, os gaps técnicos e o prompt para continuidade no Google Jules com integração Google Stitch.

---

## 🏗️ Estado Atual
- **Engine**: Phaser 3 (Core) + React (HUD/UI).
- **Assets**: 100% procedurais (Gerados via código/Base64).
- **PWA**: Configurado e instalável.
- **Controles**: Touch Joysticks funcionais e otimizados.

## ⚠️ Gaps & Oportunidades (Foco para Jules/Stitch)
1. **Visual Overhaul (Stitch)**:
   - Substituir os sprites procedurais (Base64) por assets de alta qualidade via Stitch.
   - Implementar Shaders de pós-processamento (CRT avançado, Bloom, Iluminação dinâmica).
2. **Audio Experience**:
   - Integrar trilha sonora dinâmica e SFX profissionais (atualmente são gerados via Web Audio API básica).
3. **Persistência Cloud**:
   - Implementar saves via Firebase/Cloud SQL (atualmente apenas LocalStorage).
4. **Conteúdo Narrativo**:
   - Usar a integração de IA do Jules para criar diálogos e lore baseada no progresso.

---

## 🤖 Prompt para o Google Jules

Copie e cole o prompt abaixo para o Jules iniciar com contexto total:

> "Olá Jules! Estou migrando o projeto **Bloodmage 1995** para você. É um RPG de ação isométrico 2.5D construído com **Phaser 3** e **React**. 
> 
> **Seu objetivo:** Assumir o desenvolvimento seguindo a arquitetura em `/docs/AGENTS.md` e `/docs/BEST_PRACTICES.md`.
> 
> **Prioridade Imediata:** 
> 1. Analise o `src/game/scenes/GameScene.ts` para entender o loop principal.
> 2. Utilize o **Google Stitch** para propor uma melhoria visual nos assets (hoje eles são procedurais/Base64). 
> 3. Foque em transformar a estética '16-bit' atual em algo mais polido e 'Dark Fantasy' profissional usando as capacidades do Stitch.
> 4. Verifique o `ROADMAP.md` para as próximas fases de conteúdo.
> 
> O projeto já possui PWA e controles Touch funcionais. Vamos evoluir a partir daqui?"
