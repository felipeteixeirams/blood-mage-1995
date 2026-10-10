---
agent_context: Claude Code
target_module: root
priority: high
status: active
last_updated: 2026-10-07
tags: [claude-code, fluxo-de-trabalho, spec-driven, honestidade-tecnica, git, checklist]
---

# 🎮 Bloodmage 1995 — Como Trabalhar com Claude Code

Este arquivo define **como o Claude Code trabalha** neste repositório: ordem de leitura, fluxo
spec-driven, padrão de honestidade nos relatórios, checklist de conclusão, comandos e Git.

> **Contexto do projeto** (o que o jogo é, conceitos de domínio, mapa do código, guardrails
> inegociáveis, padrões de estado e performance, onde está cada documento) **não está aqui** —
> está em [`docs/AGENTS.md`](docs/AGENTS.md), o ponto de entrada da base documental.
> Leia-o antes de qualquer tarefa. A fronteira entre os dois arquivos está na §7 dele.

---

## 🚨 Antes de Fazer Qualquer Mudança

### 1. Ordem de leitura
1. **[`docs/AGENTS.md`](docs/AGENTS.md)** — contexto, guardrails 1–7, avisos de estado, mapa dos documentos.
2. **[`docs/critical/01_CRITICAL_FILES.md`](docs/critical/01_CRITICAL_FILES.md)** — antes de tocar `Player.ts`, `Enemy.ts` ou `GameScene.ts` (MUST READ).
3. **[`docs/critical/05_TROUBLESHOOTING_KNOWN_ISSUES.md`](docs/critical/05_TROUBLESHOOTING_KNOWN_ISSUES.md)** — antes de debugar render, áudio ou assets.
4. **`docs/architecture/`** conforme a tarefa (`03_PHASER_PATTERNS.md` é crítico para performance; `04_STATE_MANAGEMENT.md` para a ponte React↔Phaser).
5. **A spec relacionada** em `docs/specs/` (ver §3 abaixo) e a skill do domínio (§2).

### 2. Skills (`.claude/skills/` — única cópia; não recrie `skills/` nem `.agents/skills/`)
- `phaser-4-development`: WebGL2, baking pattern e shaders
- `phaser-4-procedural-generation`: determinismo por seed (terreno/textura), autotiling por bitmask, normal maps, paleta/dithering e busca ativa na web quando a API do Phaser 4 for incerta
- `phaser-4-animation-tweens`: animações, tweens encadeados e FSM de ataque
- `phaser-4-physics-combat`: Arcade Physics, hitboxes e poda espacial
- `phaser-4-fx-filters`: Beam Renderer, `enableFilters()`, auras e vinhetas
- `phaser-4-playtest-harness`: verificação de runtime e testes de fumaça E2E
- `spritecook-integration`: geração de sprites pixel art via API do SpriteCook.ai (ver `scripts/fetch-spritecook-sprite.cjs`)
- `phaser4-ref-*` (referência oficial do Phaser 4, importada de `phaserjs/phaser`): documentação do engine, complementar às skills próprias. Cobrem `particles`, `physics-arcade`, `input-keyboard-mouse-touch`, `audio-and-sound`, `time-and-timers`, `cameras`, `groups-and-containers`, `render-textures`, `scale-and-responsive`, `tweens`. São referência de API, não substituem os padrões do projeto (pooling, extract/delegate, Zustand bridge) — usar em conjunto com as `phaser-4-*` próprias, nunca no lugar delas.

⚠️ **Duas skills oficiais do repo upstream NÃO foram instaladas de propósito:** `events-system` e `data-manager`. Ambas descrevem padrões nativos do Phaser (`EventEmitter`, `this.registry`, `sprite.setData()`) que competem diretamente com a ADR "Ponte Phaser↔React é 100% Zustand, zero CustomEvent" (`docs/architecture/07_DECISION_LOG.md`, 2026-08-25). Uso de eventos Phaser *internos* ao engine (`scene.events.on('shutdown', ...)`, animation-complete, física) continua permitido e necessário, mas não deve ser aprendido/instalado como skill, para não virar atalho de comunicação Phaser↔React nem estado paralelo ao Zustand. Se precisar desse padrão para algo puramente interno ao Phaser, consulte a documentação oficial sem instalar a skill.

> ⚠️ **Skills com snippets desatualizados:** `phaser-4-fx-filters` e `phaser-4-development` ensinam `renderer.isWebGL`, que **não existe** no Phaser 4.2.1 (use `renderer.type === Phaser.WEBGL`; para luz por objeto, `setLighting(true)`, não `setPipeline`). Ver `docs/critical/05_TROUBLESHOOTING_KNOWN_ISSUES.md` item 21.

### 3. Regras de ouro

✅ **SEMPRE:**
- Verificar `docs/critical/01_CRITICAL_FILES.md` antes de mexer em `Player.ts`, `Enemy.ts` ou `GameScene.ts`
- Rodar `pnpm test` e `pnpm run verify` após cada mudança maior, sem acumular alterações (ver §6 para o que cada comando cobre)
- Seguir o padrão Extract/Delegate ao mexer no `GameScene` (`docs/architecture/03_PHASER_PATTERNS.md`)
- Documentar mudanças no changelog da spec correspondente

❌ **NUNCA:**
- Modificar cálculos de física em `Player.ts` sem entender a fundo (ver Critical Files)
- Tocar na FSM de inimigos (`Enemy.ts`) sem validação profunda
- Violar os guardrails 1–7 de `docs/AGENTS.md` — em especial UI no canvas Phaser (7), `CustomEvent`/`window.dispatchEvent` para gameplay (só Zustand), `localStorage` fora de `src/utils/localStorage.ts` (3) e edição de binários com ferramenta de texto (6)
- Fazer alterações acumuladas sem rodar testes entre elas
- Tratar uma spec de `docs/specs/discovery/` ou `scope-definition/` como requisito ativo — são hipóteses, não escopo aprovado

---

## 🚦 Fluxo de Trabalho Spec-Driven

Metodologia completa (modos, blueprint de spec, triagem de complexidade, gates):
[`docs/architecture/05_SPEC_AND_CONTEXT_DRIVEN_ENGINEERING.md`](docs/architecture/05_SPEC_AND_CONTEXT_DRIVEN_ENGINEERING.md). O essencial:

**Classifique o pedido antes de agir.** Nem toda interação exige especificação formal.

| Modo | Gatilho | O que fazer |
|---|---|---|
| **Conversational** | Pergunta conceitual, brainstorm, opinião técnica | Responda direto e conciso. **Não** crie specs, arquivos em `docs/specs/` nem planos não pedidos |
| **Architecture** | Tradeoffs, desenho de sistema/integração | Apresente prós/contras e alternativas pragmáticas. Mini-spec **só se pedida** |
| **Spec-Driven** | Feature relevante, refatoração de vários módulos, mudança de persistência/arquitetura | Ciclo `Spec` → `Contract` → `Implementation` |

**Antes de implementar algo relevante:** procure spec em `docs/specs/` (ver `specs/README.md`). A spec define o **o quê e o porquê**; `architecture/` define o **como e o estado atual**. Se não houver spec e o trabalho for Spec-Driven, crie uma incremental seguindo o Blueprint (`05_SPEC…` §6) — e só em `backlog/` se tiver profundidade técnica mínima; senão `scope-definition/`.

**Ciclo de vida** (detalhe em `docs/AGENTS.md` §5): `discovery/` → `scope-definition/` → `backlog/` → `in-progress/` → `delivered/`; `rejected/`.
- Só `backlog/` (pronta) e `in-progress/` são executáveis. Se um pedido citar uma spec de `discovery/`/`scope-definition/`, **confirme o escopo antes de codar** — documento antigo de proposta não é mandato silencioso.
- Confira os gates de [`docs/specs/READINESS_GATES.md`](docs/specs/READINESS_GATES.md) antes de começar uma spec; "pega a próxima" resolve para a linha 1 executável da Fila de Prioridade de `docs/specs/README.md`.
- **Gate de Entrega:** spec que muda render, cenas ou geração de mundo só vai para `delivered/` com **evidência de execução real** registrada no changelog (E2E/sonda em WebGL, screenshot ou leitura de `window.gameScene`) — `pnpm test` verde não basta.
- Ao concluir: mover a spec de `in-progress/` para `delivered/`, registrar changelog (data + o que foi entregue) e referenciar os commits.

---

## 🎓 Honestidade Técnica e Avaliação Crítica

> Gap real do projeto, não teórico: PRs com `pnpm test` 100% passando já esconderam
> regressão visual que só apareceu na verificação ao vivo (PRs #80/#81), e um PR
> chegou a duplicar código que já existia em `main` — só ficou claro comparando o
> diff de verdade, não pelo status do PR (#89). Em 2026-10-07 a auditoria da Spec 35
> achou Light2D/PostFX entregues com testes verdes e **inertes em runtime**
> (mocks com propriedade que o engine não tem). Ver
> `docs/architecture/08_JULES_SESSION_PROMPT.md` e `docs/specs/backlog/35_00_*`.

Compilar, passar nos testes existentes e funcionar no "happy path" **não** significam que uma
tarefa está pronta. Ao reportar o resultado de um trabalho, diferencie sempre:

- **IMPLEMENTADO**: o código existe e faz o que foi pedido.
- **VALIDADO**: rodou uma verificação concreta — diga qual (`pnpm test`, `pnpm run build`,
  execução manual no navegador, screenshot, leitura estática do código). "Análise estática"
  e "execução real" não são a mesma coisa e devem ser nomeadas como tal.
- **NÃO VALIDADO**: não há evidência ainda. Diga isso explicitamente — não omita.
- **PROBLEMA ENCONTRADO**: risco ou falha concreta, mesmo que fora do escopo pedido.
- **TRADE-OFF**: existe mais de uma solução razoável e a escolhida tem custo.

Nunca escreva "está ótimo" / "sem problemas" / "pronto para produção" sem apontar qual
validação sustenta a frase. "Não encontrei problemas" não vira "está excelente" — a ausência
de evidência contrária não é evidência a favor. Quando a mecânica for algo que só se sente
jogando (game feel, timing, sensação de controle mobile), declare "Não validado: precisa de
playtest humano" em vez de assumir que está bom.

## 🧠 Antes de Implementar uma Mudança Significativa

Pare e responda, mesmo que rapidamente:
1. Isso resolve o problema pedido, ou só parece resolver?
2. É consistente com a arquitetura existente (Zustand↔Phaser bridge, extract/delegate do
   `GameScene`, object pooling) ou introduz um padrão paralelo?
3. Existe solução mais simples?
4. Pode quebrar `Player.ts`, `Enemy.ts`, `GameScene.ts` ou outro arquivo de
   `docs/critical/01_CRITICAL_FILES.md`?
5. Afeta performance por frame (objetos criados/destruídos, tweens/timers/listeners não
   limpos, número de inimigos/partículas simultâneos)?
6. Afeta game feel ou UX (resposta de controle, timing, legibilidade, feedback de dano)?
7. Funciona em mobile/touch e em proporções de tela diferentes, ou só foi pensado pra desktop?
8. Está assumindo algo que o pedido não disse? Se sim, diga a suposição em vez de decidir calado.

Se o pedido parecer tecnicamente inadequado, não implemente em silêncio: explique o problema,
a evidência e a alternativa antes de codar. A meta é uma solução melhor, não obediência cega.

## 📚 Consistência com a Documentação do Projeto

Antes de mudar algo relevante, procure a spec relacionada em `docs/specs/` e os arquivos de
`docs/architecture/`. Quando o pedido do usuário conflitar com o que está documentado, ou com
o que o código já faz, aponte o conflito antes de alterar — não escolha uma interpretação
silenciosa quando isso muda o resultado de forma relevante.

Trate specs em `docs/specs/backlog/` ou `discovery/` como **ideias**, não requisitos ativos —
só o que está em `in-progress/` ou o próprio código em produção reflete o estado real do jogo.
O campo `status`/`progress` no frontmatter de uma spec pode estar desatualizado (specs
`in-progress` já 100% implementadas são comuns neste projeto; specs `delivered/` com efeito
ausente em runtime também) — confirme contra o código antes de assumir que algo falta ou já existe.

## 🎮 Qualidade de Jogo: Gameplay, Game Feel & UX

Uma feature não está "pronta" só porque funciona tecnicamente (compila, testa,
sem erro no console). Antes de considerar concluída — proporcionalmente ao
tamanho da mudança, não é checklist obrigatório pra todo PR pequeno — avalie:

- **Game Feel:** resposta de controles, timing de animação, feedback de acerto/dano — ver `phaser-4-animation-tweens/SKILL.md` (FSM Windup-Strike-Recovery) e `phaser-4-fx-filters/SKILL.md` (glow/vignette como feedback funcional, não decoração gratuita)
- **UX Mobile:** touch funciona? Legível em tela pequena? Joystick não quebra (ver bug conhecido de floating/fixed em `docs/critical/05_TROUBLESHOOTING_KNOWN_ISSUES.md`)?
- **Gameplay consistente:** a mecânica nova respeita as regras já estabelecidas (ex: Hemomancer gasta HP, não mana)? Não introduz comportamento indesejado (ex: dano por contato passivo indevido — guardrail 2 e `phaser-4-physics-combat/SKILL.md`)?
- **Performance real, não presumida:** não afirme "está performático" sem profiling — especialmente em waves 5+ (pico conhecido, ver Bugs Conhecidos)

Não adicione efeito visual/sonoro só para "ficar bonito" — deve ter propósito
funcional (feedback de dano, telegraph de ataque, leitura de estado) alinhado ao
tom gótico-sério do jogo. Efeito sem função é ruído visual, não polish. Não altere
cor/intensidade de iluminação sem testar em múltiplos biomas.

## ✅ Checklist Antes de Declarar uma Tarefa Concluída

- [ ] Todos os requisitos explícitos do pedido foram atendidos? Alguma suposição foi feita
      sem confirmação — e foi declarada?
- [ ] `pnpm run typecheck`, `pnpm test` e `pnpm run build` rodaram e passaram?
- [ ] Mudança em render/cena/geração de mundo: há **evidência de execução real** (E2E, sonda ou
      screenshot em WebGL), não só teste unitário?
- [ ] Funcionalidades relacionadas continuam funcionando (sem regressão)?
- [ ] Objetos/luzes/emissores/filtros criados são destruídos/limpos quando deixam de ser
      necessários (lifecycle de cena, ObjectPool, `shutdown`/`destroy`)?
- [ ] Fórmulas numéricas novas de combate/balance têm teste dedicado?
- [ ] Funciona em touch/mobile e em proporções de tela diferentes, quando aplicável?
- [ ] Releu o diff procurando de propósito por: bug, regressão, edge case, complexidade
      desnecessária, problema de game feel/UX/performance?
- [ ] Mocks de teste do engine usam só propriedades que existem em `node_modules/phaser/src`?
- [ ] O relatório final diz explicitamente o que foi validado (e como) e o que ficou como
      "não validado"?

Só depois de passar por isso é que a tarefa deve ser reportada como concluída.

---

## 🧪 Testes e Comandos

| Comando | O que faz de fato (conforme `package.json`) |
|---|---|
| `pnpm test` | Vitest — suíte unitária (`vitest run`) |
| `pnpm run typecheck` | `tsc --noEmit` do projeto |
| `pnpm run build` | Build de produção (Vite) |
| `pnpm run verify` | `verify-assets.cjs` + typecheck + build. **Não roda testes.** É o que o hook `pre-commit` executa (`npm run verify`) |
| `pnpm run verify:all` | typecheck + `typecheck:game` + testes |
| `pnpm e2e` / `pnpm e2e:update` | Playwright (usa o dev server); `e2e:update` regrava os snapshots |
| `pnpm test:coverage` | Cobertura |

> Corrigido em 2026-10-07: versões anteriores deste arquivo e do `AGENTS.md` diziam que
> `verify` roda testes e citavam `pnpm test:ui`/`pnpm test:e2e`, que não existem.
> Automação de gates (testes no hook, CI, `e2e:smoke`): specs `35.02` e `35.06`.

**Padrão de testes:** mudança em `.ts` de lógica crítica leva teste de regressão; `describe`/`it`
com nomes descritivos (pt ou en); exemplo: `VirtualJoystickSystem.test.ts` cobre o bug de
joystick floating/fixed. **Mocks do engine devem espelhar a API real do Phaser 4** (ver item 21 do troubleshooting).

**Chromium em ambiente de nuvem:** já vem em `/opt/pw-browsers` — não rode `playwright install`; para WebGL headless use os flags `--use-gl=angle --use-angle=swiftshader`.

---

## 📝 Git

### Convenção de commits
```
feat: <feature>      fix: <bug corrigido>       docs: <documentação>
refactor: <sem mudar comportamento>   perf: <otimização>   test: <testes>
```
Use escopo quando ajudar (`docs(specs): …`, `fix(campaign): …`).

### Branch designada e procedimento
Desenvolver em `claude/frentes-atuacao-projeto-qypbg3`:
1. `git fetch origin claude/frentes-atuacao-projeto-qypbg3`
2. `git checkout claude/frentes-atuacao-projeto-qypbg3`
3. Trabalhar e commitar com mensagens claras (o hook roda `pnpm run verify`)
4. `git push -u origin claude/frentes-atuacao-projeto-qypbg3`
5. **NÃO abrir PR** a menos que explicitamente solicitado. Nunca commitar em `main` sem autorização.

> O `AGENTS.md` da raiz traz um procedimento de push para `main` com token pessoal na URL do
> remote — é um contorno exclusivo do **Google AI Studio**. **Ignore-o aqui**: nunca grave token
> na URL do remote nem faça push para `main`.

---

## 📞 Contato & Escalations

**Proprietário do Projeto:** Felipe Teixeira (`felipeconceicao@grpereira.com.br`)

### Pare e converse com Felipe ANTES de commitar quando encontrar:
- ❌ Conflito de arquitetura
- ❌ Performance regression
- ❌ Breaking change em arquivos críticos (`Player.ts`, `Enemy.ts`, `GameScene.ts`)
- ❌ Dúvida sobre integridade de estado (Zustand ↔ Phaser)
- ❌ Mudança que afeta persistência/save data (`localStorage`, futura Cloud Save)
- ❌ Pedido que parece conflitar com um guardrail em `docs/AGENTS.md` / `docs/critical/` ou com uma decisão já registrada em `docs/architecture/07_DECISION_LOG.md`

Isso complementa (não repete) a seção 🧠 Antes de Implementar uma Mudança Significativa:
aqueles 8 pontos valem pra qualquer mudança de porte real; os gatilhos acima são o que
especificamente exige parar e falar com o Felipe **antes de commitar**, não só questionar
internamente antes de codar. Escale o rigor ao tamanho real do risco — não é necessário para
tarefas pequenas e bem escopadas (ex: specs de baixa criticidade como normal maps ou fixes de determinismo).

---

**Última atualização:** 2026-10-07
**Versão:** 2.0 — separação de papéis: contexto do projeto → `docs/AGENTS.md`; fluxo de trabalho com Claude Code → este arquivo
