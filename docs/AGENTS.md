---
agent_context: all agents (agnóstico de ferramenta — Claude Code, Jules, Codex, AI Studio, humanos)
target_module: docs, root
priority: high
criticality: high
status: active
last_updated: 2026-10-07
tags: [entrypoint, contexto-do-projeto, guardrails, navegacao, base-documental]
---

# 📚 Bloodmage 1995 — Ponto de Entrada da Base Documental

> **Leia isto primeiro.** Este é o ponto de entrada do **contexto do projeto**: o que o
> jogo é, como o código está organizado, quais regras nunca podem ser quebradas e onde
> está cada documento. Vale para qualquer agente de IA ou pessoa.
>
> **Como trabalhar** (fluxo spec-driven, honestidade técnica, checklist de conclusão,
> Git, comandos) **não mora aqui** — mora no [`CLAUDE.md`](../CLAUDE.md) (Claude Code) e na
> metodologia em [`architecture/05_SPEC_AND_CONTEXT_DRIVEN_ENGINEERING.md`](./architecture/05_SPEC_AND_CONTEXT_DRIVEN_ENGINEERING.md).

## 0. Fluxo de navegação

1. **Este arquivo** — visão, conceitos, mapa do código, guardrails, onde achar cada coisa.
2. **[`README.md`](./README.md)** — índice mestre (grafo de conhecimento por pasta).
3. **Documento satélite** — só o que a tarefa exige, via tabela da [§6](#6-onde-está-cada-coisa).

Regra prática: **nunca** comece explorando arquivos soltos. Comece por aqui.

### Eficiência de contexto
1. Não leia vários arquivos-fonte inteiros sem necessidade; use busca direcionada e o índice da documentação.
2. Consulte a documentação antes de investigar o código — ela diz qual arquivo responde a sua pergunta.
3. Em arquivo com mais de ~400 linhas (`GameScene.ts`, `GameplayHUD.tsx`), faça edição cirúrgica (search-and-replace). Nunca reescreva o arquivo inteiro.
4. Recupere o frontmatter com `grep`/`head` antes de ler o documento completo.

---

## 1. O jogo em um minuto

| | |
|---|---|
| **Tipo** | Roguelike ARPG solo em tempo real, retro 2D, inspirado em Diablo (1995) e Dungeon Siege |
| **Engine / HUD** | Phaser 4.2.1 (WebGL, Arcade Physics) + React 19 (HUD e menus) |
| **Estado** | MVP com campanha de 4 capítulos, habilidades, loot procedural, prestígio, relíquias, conquistas, PWA instalável. Fase atual e metas: [`product/ROADMAP.md`](./product/ROADMAP.md) |
| **Plataformas** | Web (PWA) e Steam (Electron) |
| **Stack** | Zustand 5 + Zod (estado/validação) · Tailwind CSS v4 + Radix UI + Shadcn UI · Web Audio API (síntese procedural + samples) · PNPM |
| **Arte hoje** | Majoritariamente **procedural** (`src/utils/textureGenerator.ts`) com assets físicos entrando pelo pipeline híbrido (guardrail 1). Detalhes em [`specs/backlog/08_*`](./specs/backlog/08_MAPEAMENTO_COMPLETO_SPRITES_E_CHECKLIST.md) |

Não trate o projeto como protótipo inicial: tem processo spec-driven maduro (`in-progress/ → delivered/`) e histórico de decisões em [`architecture/07_DECISION_LOG.md`](./architecture/07_DECISION_LOG.md).

### ⚠️ Avisos de estado (leia antes de confiar em specs `delivered/`)
- **Light2D, PostFX de câmera e glows por filtro estão inertes em WebGL real** (checagem `renderer.isWebGL` não existe no Phaser 4.2.1). Specs 23.x constam como entregues, mas o efeito não roda. Ver [`critical/05_TROUBLESHOOTING_KNOWN_ISSUES.md`](./critical/05_TROUBLESHOOTING_KNOWN_ISSUES.md) item 21 e [`specs/backlog/35_00_*`](./specs/backlog/35_00_JOGAVEL_E_VISUAL_SEM_ASSETS_INDICE.md). **Não copie `renderer.isWebGL` das skills.**
- **"Entregue" ≠ "funciona em runtime".** Specs de render/cena/mundo precisam de evidência de execução real (ver `specs/READINESS_GATES.md`, Gate de Entrega).
- **Nuvem/conta (Supabase, Google Auth, Cloud Save):** não existem no projeto. Nada de integração de conta/nuvem sem confirmação explícita do Felipe ([`product/ACCOUNT_AND_DATA.md`](./product/ACCOUNT_AND_DATA.md)).

---

## 2. Conceitos do domínio

- **Bloodmage (Hemomancer)** — personagem único. Feitiços custam **HP**, não mana clássica. Cajado com pulso carmesim dinâmico no topo (efeito de luz). Movimento com aceleração gradual (estilo Dungeon Siege), não instantâneo.
- **Árvore de Talentos (Hemomancia)** — progressão estilo Diablo. Talentos desbloqueados via cristais de sangue ganhos por conquistas. Estado persistido em Zustand + `localStorage`.
- **Modos de jogo** — **Arcade** (andares procedurais) e **Campanha** (4 capítulos). Cada capítulo = árvore de diálogo + quests + progressão de loot: 1 Santuário (intro/tutorial) · 2 Catacumbas (exploração/lore) · 3 Cripta Ancestral · 4 Câmara de Ritual.
- **Safe House (hub)** — espaço seguro entre runs, com NPCs (Maelen = guia principal), Talent Tree, Inventário e Configurações. Diálogos usam IDs parametrizados (`getMaelenDialogueTreeId()` — nunca hardcode a árvore).
- **Biomas** — `safe_house`, `gloomy_woods`, `fosso_chagas`, `catacumbas_martires`, `santuario_sangue`. Cada um tem ambiente próprio (Catacumbas = frio espectral, Santuário = rubro). Não altere cor/intensidade de iluminação sem testar em vários biomas.
- **Mundo contínuo** — campanha por chunks (`ChunkStreamer`, `DungeonFlowController`). Ver [`specs/delivered/25_*`](./specs/delivered/25_MUNDO_CONTINUO_CHUNK_STREAMING.md) e a nota de correção ao fim dela.

### Entidades principais
| Entidade | Arquivo | Papel |
|---|---|---|
| Player | `src/game/objects/Player.ts` | Personagem, física, HP |
| Enemy | `src/game/objects/Enemy.ts` | IA com FSM de 6 estados |
| Projectile | `src/game/objects/Projectile.ts` | Feitiços (pooled) |
| Traps | `src/game/objects/Traps.ts` | Armadilhas procedurais |
| Scavengeable | `src/game/objects/Scavengeable.ts` | Objetos interativos (barris etc.) |
| Collectible | `src/game/objects/Collectible.ts` | Loot, orbes de XP (pooled) |

---

## 3. Mapa do código

```
src/
├── components/     # React: HUD, modais, menus, overlays
├── data/           # Configurações JSON (monstros, magias, talentos…)
├── game/
│   ├── objects/    # Entidades físicas (Player, Enemy, Projectile…)
│   ├── scenes/     # Cenas Phaser (BootScene, TitleScene, GameScene…)
│   ├── systems/    # Lógica desacoplada (Lighting, Combat, Chunks, PostFX…)
│   ├── assets/     # assetManifest.json/.ts (pipeline híbrido)
│   └── animations/ # animationManager
├── hooks/          # React Hooks
├── store/          # Zustand (gameStore.ts) — ponte React ↔ Phaser
├── types/          # Tipos de domínio
└── utils/          # soundEngine, logger, localStorage, textureGenerator
tests/e2e/          # Playwright
scripts/            # verify-assets, build/stitch de spritesheets, docs-audit, specs-dependency-graph
```

Detalhe: [`architecture/02_CODE_ORGANIZATION.md`](./architecture/02_CODE_ORGANIZATION.md). Arquivos que quebram o jogo se mexidos sem cuidado: [`critical/01_CRITICAL_FILES.md`](./critical/01_CRITICAL_FILES.md) (`Player.ts`, `Enemy.ts`, `GameScene.ts`, `DungeonGenerator.ts`, `gameStore.ts`, `localStorage.ts`).

---

## 4. Guardrails (inegociáveis)

> A numeração (1–5, 6, 6b, 7) é **estável**: specs, skills e comentários de código citam
> "Guardrail #7", "Regra 6b" etc. Não renumere. Origem: movidos do `AGENTS.md` da raiz em 2026-10-07 (texto preservado).

Every agent modifying this codebase MUST respect the following strict, non-negotiable boundaries:

### 1. Hybrid Asset Architecture (Assets Externos + Fallback Procedural)
- **Permissão de Assets Externos:** Assets físicos (imagens PNG/WebP e áudios MP3/OGG) são permitidos desde que integrados estritamente sob o pipeline híbrido com fallback procedural unificado para evitar regressões visuais ou quebras de áudio.
- **Mecanismo de Chave Única e Fallback Procedural Mandatório:** Nunca associe ou mude as chaves de forma destrutiva. O código deve sempre tentar carregar o arquivo físico em primeiro lugar. Caso o carregamento falhe, falhe silenciosamente, acione a telemetria do Sentry e execute o gerador de canvas (`src/utils/textureGenerator.ts` para texturas) ou síntese de som (`src/utils/soundEngine.ts` para áudio) sob a mesma chave de identificação.
- **UI do React Fatiada (9-Slice):** Painéis e botões de interface de usuário gótica no React devem usar fatiamento de imagem via CSS `border-image` com propriedades Tailwind para máxima responsividade mobile e compatibilidade comercial (Steam, Play Store e PWA).
- **Orçamento de VRAM e Compactação:** Novos assets devem respeitar resoluções retrô pixeladas restritas (máximo de 64x64 para sprites de personagens/inimigos comuns e 64x32 para tiles) e ser compactados agressivamente via `pngquant` ou convertidos para `.webp` para manter o pacote inicial abaixo de 2.5 MB.
- **Fontes locais:** As fontes continuam hospedadas offline em `public/fonts/` e configuradas em `index.css`.
- **Manifesto com Flag `required` (Cobertura de Assets):** `src/game/assets/assetManifest.json` é a fonte única de verdade sobre quais assets físicos existem. Cada entrada tem `required: true|false`. `required: true` significa que o arquivo DEVE existir em `public/<path>` com dimensões compatíveis com `frameWidth`/`frameHeight` — `pnpm verify` (via `scripts/verify-assets.cjs`) **falha o build** se isso não for verdade. `required: false` marca um asset "planejado": ainda não foi produzido, o fallback procedural cobre ele por enquanto, e o build não falha — apenas reporta como pendente. **Ao adicionar um asset físico novo (gerar → stitch → colocar em `public/assets/...`), rode `pnpm verify` e só então mude `required` para `true`** no manifesto; nunca marque como obrigatório antes de o arquivo estar de fato commitado, ou o build quebra para todo mundo.

### 2. Physical and Combat Mechanics Guardrails
- **Passive contact damage ('touch damage') from enemies is forbidden.**
- Every physical or melee attack from any enemy must transition through a fully-telegraphed Finite State Machine (FSM): `Windup` -> `Strike` -> `Recovery`.
- When calculating Line of Sight (LoS) or hearing ranges for active entities, prune computations using quick spatial/distance boundaries (AABB / squared distance) before executing Phaser's geometric raycast.
- Ensure combat-related projectile collisions retain accurate wall/boundary checks to prevent bugs like wall-hacking.

### 3. State Management and Persistence
- **No Direct LocalStorage Mutations.**
- All data read or written to `localStorage` must pass strictly through `src/utils/localStorage.ts`, using robust validation via **Zod schemas** with safe-parse fallbacks to prevent state corruption, prototype pollution, or crash on outdated save files.
- Phaser-to-React communications must be decoupled using a unified event broker or global state (`src/store/gameStore.ts`). Click/pointer events in React overlays must call `e.stopPropagation()` and `e.nativeEvent.stopImmediatePropagation()` to prevent underlying canvas click triggers.

### 4. Code Standards & Typing
- **TypeScript strict mode must pass with 0 errors.** (`pnpm run typecheck` / `pnpm run verify`).
- Do not use `any`. Define strict union types or configurations.
- Use Named Arguments/Objects for functions with more than 3 parameters to avoid parameter-swapping bugs.

### 5. Mandatory Troubleshooting Documentation (Root-Cause Logging)
- **Always document non-trivial/complex bugs**: Any bug, regression, asset corruption, state mismatch, or lifecycle/rendering issue that required multi-step investigation or significant debugging time **MUST** be immediately logged in `/docs/critical/05_TROUBLESHOOTING_KNOWN_ISSUES.md`.
- **Standard Entry Structure**: Each entry must include:
  1. **Sintoma** (o que quebrou ou como se manifesta visualmente/em runtime).
  2. **Causa-Raiz** (explicação técnica exata do motivo da falha).
  3. **Como Diagnosticar** (comandos, logs ou testes para identificar rapidamente).
  4. **Procedimento de Resolução** (passo a passo claro para correção sem regressão).
  5. Atualização da **Tabela de Diagnóstico Rápido** no final do documento.

### 6. Binary Files Anti-Corruption Guardrail (CRITICAL)
- **NEVER** use text-based editing tools (`edit_file`, `create_file`, `cat`, `sed`, `awk`, `echo`) on binary files (`.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`, `.woff2`, `.mp3`, `.ogg`).
- Doing so converts non-UTF-8 bytes to the replacement character `\uFFFD` (`EF BF BD`), corrupting the asset's binary header permanently.
- If you need to generate, move, or download a binary asset, you MUST use pure binary stream handlers (e.g., `Buffer` in Node.js, `wget`, or `curl --output`) and verify its integrity using `file <path>` before proceeding.
- **Valide toda fonte de recuperação ANTES de copiar dela.** Um backup pode já estar contaminado — foi exatamente o que aconteceu com `sprites_importados/gothic_chest/` no incidente de 2026-08-21, onde restaurar de lá apenas propagou a corrupção. Cheque o header (`89 50 4E 47` para PNG, `FF D8 FF` para JPG) e a ausência de `EF BF BD` no corpo do arquivo.
- **Após restaurar um binário, commite imediatamente**, antes de qualquer outra operação de Git. Enquanto o blob corrompido estiver no histórico, um `stash pop`/`checkout`/`restore` reintroduz a corrupção no working tree.

### 6b. Spritesheet do Jogador — Pipeline Correto
- A origem de `public/assets/sprites/player/bloodmage.png` é a arte do PixelLab, montada por `scripts/build_bloodmage_spritesheet.cjs` (grade 8x9 de células 68x68, linha 0 = idle, linhas 1-8 = walk).
- `scripts/generate_bloodmage_spritesheet.cjs` é **procedural** e existe apenas como último recurso de emergência. Se ele voltar a ser a origem do arquivo, o personagem vira placeholder **silenciosamente** — o `pnpm verify` não detecta, porque o PNG gerado é perfeitamente válido.
- O export do PixelLab não é homogêneo: rotações idle vêm em **48x48** e frames de Walking em **68x68**. O montador alinha pela caixa delimitadora do conteúdo, não pela borda do arquivo; alinhar pela borda faz o personagem "pular" ao alternar entre parado e andando. Detalhes no item 15 do troubleshooting.

### 7. Strict UI Layering (React DOM vs Phaser Canvas) - CRITICAL
- **NEVER render user interface elements (Buttons, Menus, Text, Modals, HUDs) inside Phaser Scenes.**
- The Phaser engine (`<canvas>`) is STRICTLY reserved for the game world, entities, environment, combat, and background effects.
- **ALL UI MUST be built as React overlays (`.tsx` files)** using Tailwind CSS and HTML DOM elements floating over the canvas.
- If you are asked to build a Menu, Inventory, Pause Screen, or HUD, you MUST create or modify a React component (e.g., `src/components/...`) and use Zustand (`src/store/gameStore.ts`) to communicate with Phaser.
- **Forbidden Phaser methods for UI**: Do not use `this.add.text()`, `this.add.dom()`, or interactive `this.add.rectangle()` to simulate UI buttons in any Scene.

### Ponte Phaser ↔ React: 100% Zustand
Desde 2026-08-25 não existe `CustomEvent`/`window.dispatchEvent` para gameplay (ADR em [`architecture/07_DECISION_LOG.md`](./architecture/07_DECISION_LOG.md); histórico em [`06_PHASER_REACT_BRIDGE_MIGRATION.md`](./architecture/06_PHASER_REACT_BRIDGE_MIGRATION.md)). Eventos Phaser **internos** ao engine (`scene.events.on('shutdown', …)`, animation-complete, física) continuam permitidos. Dois padrões, **nunca misturados**:

```typescript
// Comando + Reset (React → Phaser, baixa frequência)
useGameStore.setState({ activeSkillTrigger: 'fireball' });
// em PhaserGame.tsx:
useEffect(() => {
  if (store.activeSkillTrigger) {
    gameScene?.castSkill(store.activeSkillTrigger);
    store.setActiveSkillTrigger(null); // reset
  }
}, [store.activeSkillTrigger]);

// Valor + Versão (qualquer direção, alta frequência)
useGameStore.getState().setPlayerStats({ hp: 45, mp: 80 });   // Phaser
const { hp, mp } = useGameStore(s => ({ hp: s.stats.hp, mp: s.stats.mp })); // React
```

Campos críticos sincronizados via Zustand: `stats` (HP/MP/Level/XP), `inventory`, `talentTree`, `runStats` (kills, dano), `achievementUnlocks`. Schema Zod completo em `src/store/gameStore.ts`. Detalhe: [`architecture/04_STATE_MANAGEMENT.md`](./architecture/04_STATE_MANAGEMENT.md).

### Performance (60 FPS)
- **Object pooling** — projéteis, efeitos e textos de dano reciclados via `Phaser.GameObjects.Group`; nunca criar objetos novos no loop de `update`.
- **Poda espacial** — filtrar por distância quadrática antes de raycast (ex.: `distanceSquaredTo(player) < 90000` ≈ 300 px) — ver guardrail 2.
- **Culling de câmera** — objetos fora da viewport são desativados.
- **Fallback** — Canvas se WebGL falhar; Light2D com fallback para `darknessOverlay` em Canvas ou `postProcessingEnabled=false`.
- Padrões validados: [`architecture/03_PHASER_PATTERNS.md`](./architecture/03_PHASER_PATTERNS.md) (inclui o padrão **Extract/Delegate** do `GameScene`) e [`critical/02_PERFORMANCE_OPTIMIZATION.md`](./critical/02_PERFORMANCE_OPTIMIZATION.md).

### Iluminação dinâmica 2D
- `LightingSystem.ts` — `ambientColor` por bioma (cascata fria→rubra com a profundidade), luz do jogador com raio por HP, luzes de tocha com flicker. `LightingPolish.ts` — glow/bloom em feitiços, itens raros, portais e bosses.
- Fallback: Canvas ou `postProcessingEnabled=false` → `darknessOverlay`.
- **Não altere cor/intensidade sem testar em vários biomas** (Catacumbas = frio espectral, Santuário = rubro).
- ⚠️ Estado real: o pipeline Light2D está **inerte em WebGL** hoje (ver Avisos de estado, §1). A spec 23.03 consta como completa, mas o efeito não roda até a 35.01 ser entregue.

### Observabilidade
```typescript
import { logger } from '@/utils/logger';
logger.info('GameScene', 'Player spawned at', { x, y });
logger.warn('LootSystem', 'Rare drop', { itemId });
logger.error('CombatSystem', 'Critical error', { error });
```
`window.useGameStore` e `window.gameScene` ficam expostos (usados pelos testes E2E). Ferramentas úteis: React DevTools, Zustand DevTools (se habilitado), Chrome DevTools → Performance (meta de 60 FPS estáveis; atenção a picos de GC, sinal de pooling falhando).

---

## 5. Convenções de documentação

### Frontmatter (obrigatório em todo documento)
```yaml
---
agent_context: <para qual agente/role>
target_module: <módulo/área do código>
priority: <high | medium | low>
status: <draft | active | complete | obsolete>   # specs: ver enum em 05_SPEC_AND_CONTEXT…
last_updated: <AAAA-MM-DD>
tags: [<tag1>, <tag2>]
---
```

### Ciclo de vida das specs (`docs/specs/`)
`discovery/` (pesquisa) → `scope-definition/` (proposta real, falta decisão) → `backlog/` (pronta, escopo 100%) → `in-progress/` → `delivered/`; `rejected/` para o que fere guardrails. **`discovery/` e `scope-definition/` são hipóteses, não requisito.** Índice, fila de prioridade e gates: [`specs/README.md`](./specs/README.md), [`specs/READINESS_GATES.md`](./specs/READINESS_GATES.md), [`specs/DEPENDENCY_GRAPH.md`](./specs/DEPENDENCY_GRAPH.md). Blueprint e frontmatter de spec: [`architecture/05_SPEC_AND_CONTEXT_DRIVEN_ENGINEERING.md`](./architecture/05_SPEC_AND_CONTEXT_DRIVEN_ENGINEERING.md) §6.

### Atualizar a documentação é parte do trabalho
Toda mudança relevante atualiza os documentos impactados. Ao fechar uma tarefa, registre descobertas, decisões, riscos, mitigação e o que ficou obsoleto. Bug com investigação não trivial → entrada em `critical/05_TROUBLESHOOTING_KNOWN_ISSUES.md` (guardrail 5). Decisão arquitetural grande → ADR em `architecture/07_DECISION_LOG.md`.

### Uma informação, um lugar
Cada fato mora em **um** documento; os demais linkam. Em conflito, vale o código em produção, depois a spec em `in-progress/`, depois o resto.

---

## 6. Onde está cada coisa

| Preciso de… | Vá para |
|---|---|
| Visão macro React × Phaser | [`architecture/00_OVERVIEW.md`](./architecture/00_OVERVIEW.md) |
| Stack e bibliotecas | [`architecture/01_TECH_STACK.md`](./architecture/01_TECH_STACK.md) |
| Padrões Phaser (pooling, Extract/Delegate, poda) | [`architecture/03_PHASER_PATTERNS.md`](./architecture/03_PHASER_PATTERNS.md) |
| Estado e ponte React↔Phaser | [`architecture/04_STATE_MANAGEMENT.md`](./architecture/04_STATE_MANAGEMENT.md) |
| Por que uma decisão grande foi tomada | [`architecture/07_DECISION_LOG.md`](./architecture/07_DECISION_LOG.md) |
| **O que não posso tocar** | [`critical/01_CRITICAL_FILES.md`](./critical/01_CRITICAL_FILES.md), [`critical/00_ANTI_REGRESSION_GUIDE.md`](./critical/00_ANTI_REGRESSION_GUIDE.md) |
| **Erro de render, áudio ou assets** | [`critical/05_TROUBLESHOOTING_KNOWN_ISSUES.md`](./critical/05_TROUBLESHOOTING_KNOWN_ISSUES.md) |
| Performance e métricas | [`critical/02_*`](./critical/02_PERFORMANCE_OPTIMIZATION.md), [`critical/04_*`](./critical/04_PERFORMANCE_METRICS.md) |
| Gates de teste | [`critical/03_TESTING_GATES.md`](./critical/03_TESTING_GATES.md) |
| Segurança (CSP, `localStorage`, segredos) | [`critical/06_SECURITY_GUIDELINES.md`](./critical/06_SECURITY_GUIDELINES.md) |
| Regras de produto, retenção mobile, KPIs | [`product/00_MOBILE_FIRST_SUCCESS_BIBLE.md`](./product/00_MOBILE_FIRST_SUCCESS_BIBLE.md) (filtro **mandatório** para toda spec de feature nova) |
| Fases do projeto, release, acessibilidade | [`product/`](./product/) (`ROADMAP`, `RELEASE_STRATEGY`, `ACCESSIBILITY`) |
| O que está sendo feito / o que é a "próxima" | [`specs/README.md`](./specs/README.md) |
| Experimentos de game feel mobile | [`experiments/`](./experiments/) |
| Auditorias e relatórios | [`reviews/`](./reviews/) |
| Histórico obsoleto (**não é verdade**) | [`archive/`](./archive/) |

Pastas (caixa baixa): `architecture/` decisões e padrões · `critical/` anti-regressão e troubleshooting · `product/` visão e estratégia · `specs/` ciclo de vida de features · `experiments/` laboratório mobile · `reviews/` auditorias · `implementation/` notas de entrega pontuais · `archive/` legado.

---

## 7. Fronteira entre `docs/AGENTS.md` e `CLAUDE.md`

| | `docs/AGENTS.md` (este) | `CLAUDE.md` (raiz) |
|---|---|---|
| **Responde** | O que é o projeto e quais regras valem | Como o Claude Code deve trabalhar nele |
| **Público** | Qualquer agente ou pessoa | Claude Code |
| **Contém** | Domínio, mapa do código, guardrails, padrões de estado/performance, convenções de docs | Ordem de leitura, skills, modos e fluxo spec-driven, honestidade técnica, perguntas pré-implementação, checklist de conclusão, comandos de teste, Git, escalonamento |
| **Muda quando** | O projeto ou as regras mudam | O fluxo de trabalho muda |

`AGENTS.md` na raiz é só um ponteiro para este arquivo (ferramentas externas ainda leem esse caminho).

---

## 8. Manutenção recorrente da base documental

Desde 2026-09-06 existe uma atividade recorrente do Jules (agendada em jules.google.com, semanal, fora deste repositório) que audita `docs/` em busca de links quebrados, entradas órfãs em `docs/specs/README.md`, duplicatas e specs cujas citações de arquivo/método já não batem com o código — corrigindo o mecânico e abrindo PR contra `claude/frentes-atuacao-projeto-qypbg3` (nunca mescla sozinha). Ver `scripts/docs-audit.py`, `scripts/check_doc_links.py` e [`reviews/03_AUDITORIA_BASE_DOCUMENTAL_2026_09.md`](./reviews/03_AUDITORIA_BASE_DOCUMENTAL_2026_09.md). Base incomumente consistente costuma ser efeito dessa rotina.
