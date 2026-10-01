# Auditoria Analítica de Instruções e Governança Técnica (Blood Mage 1995)

Relatório analítico aprofundado com matriz de conformidade, mapeamento de gaps críticos e plano de ação estrutural nas instruções de agentes (`AGENTS.md`, `CLAUDE.md`) e base documental (`docs/`), com foco primordial em **Física para Jogos, FSMs de Combate e Prevenção de Regressões**, além de arquitetura escalável, reuso de código e padrões mobile-first.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> **Decisões Confirmadas na Entrevista Interativa:**
> - **Formato Principal**: Relatório analítico completo com matriz de conformidade e catálogo detalhado de gaps.
> - **Foco Primordial**: Física de jogos, Finite State Machines (FSMs) de combate telegrafado e mecanismos rigorosos de prevenção de regressão (anti-touch damage, raycast pruning, contratos de dano e persistência).

- **Achado Crítico Identificado**: Inconsistência entre a regra de `AGENTS.md` (proibição de *touch damage* passivo) e o código real em `CollisionHandlers.ts` / `GameScene.ts`, onde um overlap de contato ainda causava dano direto de 40% a cada tick físico, conflitando com a FSM telegrafada (`Windup` -> `Strike` -> `Recovery`).
- **Ação Proposta**: Documentar formalmente e remediar a divergência de código, além de consolidar diretrizes de física, determinismo e tolerância a falhas na documentação viva.

---

## 1. Overview & Core Concept

- **What It Does**: Avalia sistematicamente como o contexto documental do projeto (instruções para agentes, guias críticos, ADRs, specs e referências arquiteturais) protege o ciclo de vida do desenvolvimento de jogos, garantindo integridade de assets, determinismo de física, desacoplamento React/Phaser e retenção mobile-first.
- **Target Audience / Persona**: Desenvolvedores seniores e agentes autônomos de IA que realizam engenharia contínua e manutenção evolutiva no projeto Blood Mage 1995.
- **Key Value**: Elimina bugs silenciosos de física/combate, garante que novos agentes não reintroduzam touch damage ou memory leaks, e estabelece uma blindagem técnica completa contra regressões em produção.

---

## 2. Pilares de Engenharia de Jogos & Game Feel

- **Física Determinística & Detecção de Colisão**:
  - Arcade Physics com separação estrita de camadas (`wallsGroup`, `enemiesGroup`, `barrelsGroup`, `trapsGroup`).
  - Poda espacial antecipada (AABB / squared distance check) antes de qualquer raycasting geométrico de Line of Sight (LoS).
  - Verificação de travessia e amortecimento de movimento em superfícies especiais (fricção em poças d'água / pântano geradas por `PathDrivenGenerator`).
- **FSM de Combate Telegrafada (Zero Touch Damage)**:
  - FSM com fases temporizadas: `Windup` (preparação com feedback visual/áudio de aviso) ➔ `Strike` (janela ativa de acerto com lunge e colisão direcionada) ➔ `Recovery` (recuperação pós-golpe com cooldown).
  - Janelas claras de esquiva do jogador através do sistema de *Dash com I-Frames* (Spec 22).
- **Game Feel & Polimento Audiovisual**:
  - Hit-stop / frame freeze em acertos críticos para conferir peso ao golpe.
  - Screen Shake multi-nível e aberração cromática via shaders WebGL / PostFX (`PostFXSystem.ts`).
  - Haptic feedback granular para dispositivos móveis (`HapticFeedback.lightImpact()` vs `playerDamaged()`).

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Eliminação Irrestrita de Touch Damage Passivo**
  - *Chosen Approach*: Desativar o overlap passivo de dano por contato físico em `GameScene.ts` / `CollisionHandlers.ts`, consolidando todo o dano corpo-a-corpo exclusivamente no ciclo de acerto da FSM de ataque.
  - *Why*: O dano por contato físico pune injustamente o jogador em controles touch mobile compactos e contradiz a mecânica tática de esquiva e telegrafia do jogo.
  - *Alternatives Considered*: Manter dano de contato reduzido (rejeitado por gerar dano duplo quando combinado com a FSM).
- **Decision 2: Matriz de Verificação Automática Pré-Commit**
  - *Chosen Approach*: Formalização da execução obrigatória de `npm run typecheck`, `node scripts/verify-assets.cjs` e testes automatizados de física/sistemas antes de qualquer entrega.
  - *Why*: Impede a introdução de assets binários corrompidos (`\uFFFD`) e quebras de contratos de estado (`Player.stats`).
- **Decision 3: Arquitetura Híbrida de Assets com Fallback Procedural**
  - *Chosen Approach*: O manifesto `assetManifest.json` com flag `required` dita se um asset físico é obrigatório; na ausência ou falha, o gerador procedural sintético (`textureGenerator.ts` / `soundEngine.ts`) assume instantaneamente sem quebrar o jogo.
  - *Why*: Resiliência total contra ausência de arquivos em builds multiplataforma (PWA, Android, Steam).

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────┐
│                   React Overlay Layer                  │
│   (GameplayHUD, Menus, Modais 9-Slice, VirtualStick)   │
└───────────────────────────┬────────────────────────────┘
                            │ Zustand Store (100% Unidirecional)
┌───────────────────────────▼────────────────────────────┐
│                  Phaser Game Engine                    │
│   ┌────────────────────────────────────────────────┐   │
│   │ GameScene (Orquestrador / Camera Look-Ahead)   │   │
│   └──────┬──────────────────────────────────┬──────┘   │
│          │                                  │          │
│   ┌──────▼───────┐                  ┌───────▼──────┐   │
│   │ Player / FSM │                  │  Enemy / FSM │   │
│   │ (Move Speed, │                  │  (Windup ->  │   │
│   │  Dash, Stats)│                  │   Strike ->  │   │
│   └──────┬───────┘                  │   Recovery)  │   │
│          │                          └───────┬──────┘   │
│   ┌──────▼──────────────────────────────────▼──────┐   │
│   │   CollisionHandlers & Spatial AABB Pruning     │   │
│   └────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────┘
```

### Matriz de Conformidade & Catálogo de Gaps

| Pilar | Estado Atual na Base Documental | Estado Atual no Código (`src/`) | Classificação | Ação Corretiva Proposta |
|---|---|---|---|---|
| **Física & Colisão** | Proíbe *touch damage*; exige poda AABB | `CollisionHandlers.ts` ainda continha método de dano por toque (40% dano) | 🔴 **Gap Crítico** | Remover touch damage de `CollisionHandlers` e garantir dano exclusivo via FSM |
| **FSM de Inimigos** | Especifica `Windup` -> `Strike` -> `Recovery` | Implementado em `Enemy.ts` (linhas 540-608), com lunge e cálculo de esquiva | 🟢 **Conforme** | Endurecer documentação de telegrafia e timings em `docs/critical/01_CRITICAL_FILES.md` |
| **Raycast LoS** | Documentado como custo crítico de CPU em `DungeonGenerator.ts` | `hasLineOfSight` otimizado em grid; `Enemy.ts` recebe booleano | 🟢 **Conforme** | Manter preservado e vedar qualquer raycast geométrico não-podado |
| **Persistência de Dados** | Proíbe `localStorage` direto; exige Zod | `localStorage.ts` centralizado com schemas Zod estritos e fallbacks seguros | 🟢 **Conforme** | Manter guardrail ativo em `AGENTS.md` |
| **Isolamento de UI** | Proíbe UI no Phaser Canvas; tudo em React | 100% React overlays com Tailwind e 9-slice; Phaser reservado ao mundo | 🟢 **Conforme** | Manter regra em `AGENTS.md` |
| **Orçamento Mobile** | PWA offline, 60 FPS, <2.5MB pacote inicial | Testes E2E e unitários passam (553 testes, 54 arquivos); PWA funcional | 🟢 **Conforme** | Expandir métricas em `docs/critical/04_PERFORMANCE_METRICS.md` |
