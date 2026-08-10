---
validation_date: 2026-08-10
validator: Claude (leitura direta do código-fonte)
spec_reference: docs/legacy/DISCOVERY_DUNGEON_SIEGE_EVOLUTION.md
commits_validados: 4a58cf0, 7a4b96d, c4868b1, a88e40e
build_source: src/ (root) — é o que o Vercel builda, NÃO artifacts/bloodmage/src/
agent_context: all agents
target_module: root
priority: high
status: complete
last_updated: 2026-08-10
tags: [reviews, validation]
---

# ✅ Validação: Dungeon Siege Evolution vs Implementação Real

> **Método:** Cada linha abaixo foi confirmada lendo o código-fonte diretamente (grep + leitura de trechos), não por inferência. Onde não encontrei evidência no código, marquei como não implementado — mesmo que pareça "óbvio" que deveria estar lá.

⚠️ **Nota:** Existia um relatório de validação anterior neste mesmo arquivo (criado em sessão anterior) que apontava **100% de conformidade em todas as seções**, citando funções como `moveAwayFromBody()`, `clearAggro()` e `wakeUp()`. Verifiquei o código-fonte e **essas funções não existem** — a implementação real usa outro approach (explicado abaixo). Esse relatório anterior estava incorreto e foi substituído por este.

---

## 📊 Resultado Geral

```
Seção 2.1 (Inconsciência):        ✅ 95%  — Muito bem implementado
Seção 2.2 (Morte & Drops):        🟡 70%  — Implementado, mas adaptado (sem inventário real)
Seção 2.3 (Despawn do Corpo):     ❌ 0%   — Não implementado
Seção 2.4 (Status de Sobrevivência): 🟡 15% — Apenas scaffolding, sem gameplay
Seção 3.1 (Vilas & NPCs):         ✅ 85%  — Muito bem implementado
Seção 3.2 (Mundo Contínuo/Gates): 🟡 30%  — Estrutura de wave/andar, não jornada nômade
Seção 3.3 (Narrativa/Lore):       ❌ 0%   — Não implementado
Seção 4 (Scavenging):             ✅ 90%  — Muito bem implementado
Enemy AI (4 temperamentos):       ✅ 100% — Implementado fielmente
Anti-Regressão (Seção 8):         ✅ 100% — Arquivos críticos respeitados
─────────────────────────────────────────────
TOTAL PONDERADO:                  ~60% do discovery completo
```

**Conclusão:** A **Fase 1 (Inconsciência) está pronta para produção**. Fase 2 (Morte) está funcional mas simplificada. Fases 3 e 4 têm fundação de dados criada, mas a mecânica de jogo ainda não foi implementada.

---

## ✅ SEÇÃO 2.1: Estado de Inconsciência — 95%

| Requisito do spec | Status | Evidência real no código |
|---|---|---|
| HP <= 0 → Desmaio (não morte) | ✅ | `Player.ts:410-433` — `takeDamage()`: se `knockoutCount < 2`, seta `isUnconscious = true` |
| Imunidade total durante desmaio | ✅ | `Player.ts:410` — `takeDamage()` retorna `false` imediatamente se `isUnconscious` |
| Inimigos perdem aggro | ✅ | `Enemy.ts:262-265` — se player unconscious/dead, força `aiState = 'patrol'` (não existe função `clearAggro()`, é reset direto de estado) |
| Inimigos "se afastam" do corpo | 🟡 Parcial | Inimigos voltam a patrulhar entre 2 pontos fixos definidos na criação (`patrolP1`/`patrolP2`), **não** há afastamento radial calculado a partir do ponto de queda do jogador como o spec descreve literalmente. Efeito prático é parecido (param de perseguir), mas não é a mesma mecânica. |
| Regeneração passiva até 5% | ✅ | `Player.ts:138-150` — `0.02 * maxHp` por segundo, levanta ao atingir `0.05 * maxHp` |
| Limite de 2 desmaios, 3º = morte | ✅ | `Player.ts:418-433` — exatamente como o spec pede |
| Invulnerabilidade ao levantar | ✅ Bônus | `Player.ts:148-149` — 1.5s de invuln frames ao acordar (não estava no spec, mas é uma boa decisão de design) |
| Cooldowns continuam decrementando | ✅ | `Player.ts:163+` — loop de cooldowns roda mesmo durante `isUnconscious` |
| 4 temperamentos de monstro | ✅ | `Enemy.ts` — `highly_aggressive`, `territorial`, `defensive`, `totally_passive` todos implementados com raio de visão/audição diferenciado |

**Veredito:** Excelente implementação. O único gap é semântico (afastamento radial vs retorno à patrulha) e não afeta a experiência de jogo de forma perceptível.

---

## 🟡 SEÇÃO 2.2: Morte Definitiva & Drops — 70%

| Requisito do spec | Status | Evidência real |
|---|---|---|
| Tela "Você está morto" grimdark | ✅ | `GameOverModal.tsx` — vinheta, texto exato do spec ("A terra consome seus restos...") |
| Estatísticas (tempo, kills, ouro, profundidade) | ✅ | `GameOverModal.tsx:37-70` — Pontuação, Abates, Nível/Andar, Tempo |
| Opção "Renascer na Vila" | ✅ | `GameScene.ts:181-208` — evento `respawn-player`, teleporta pro spawn room |
| Opção "Voltar ao Menu" | ✅ | `GameOverModal.tsx:88-96` |
| Penalidade de XP sem regressão de nível | ✅ | `GameScene.ts:194` — `currentXp = 0`, level nunca é decrementado |
| Persistência de morte (fechar aba e voltar) | ⚠️ Não verificado | Não encontrei teste ou lógica explícita de "carregar direto na tela de morte" ao reabrir o navegador. Recomendo validar manualmente. |
| **Drop de inventário no chão** | 🟡 Adaptado | O jogo **não tem inventário de consumíveis carregável** (só slots de equipamento: weapon/armor/relics). Ao morrer, o que acontece é um `Scavengeable` genérico tipo `'corpse'` aparecer no local — ele dá loot genérico ao ser vasculhado, **não é literalmente o inventário perdido do jogador**. É uma adaptação razoável dado que o jogo não tinha inventário de itens carregáveis, mas não é o que o spec descreve. |
| Equipamento ativo preservado | ✅ (por natureza) | Como não há drop de equipamento, ele nunca é perdido — atende ao requisito, mas por ausência da mecânica oposta |
| Itens de quest protegidos | N/A | Não existe sistema de quest items no jogo ainda |

**Veredito:** Funcional e com boa fidelidade visual/narrativa ao spec, mas a mecânica de "perder itens de verdade" não existe porque o jogo não tem inventário de consumíveis — só equipamento. Vale alinhar com Felipe se isso é aceitável ou se é preciso criar inventário real antes de ter "drop" de verdade.

---

## ❌ SEÇÃO 2.3: Despawn Progressivo do Corpo — 0%

| Requisito do spec | Status | Evidência real |
|---|---|---|
| Timer oculto de despawn (horas de jogo) | ❌ | Não encontrado. O campo `duration` em `Scavengeable.ts` é o **tempo de ação de vasculhar** (1.5-3s), não um timer de despawn. |
| Congelamento do timer ao ver o corpo (FOV) | ❌ | Não implementado — não existe lógica de FOV check para o corpo |
| Mensagem atmosférica ao renascer | ✅ | `GameScene.ts:207` — mensagem quase idêntica ao spec está lá |

**Veredito:** A mensagem atmosférica foi implementada (boa atenção ao detalhe de texto), mas a mecânica de urgência tática (timer + congelamento por FOV) **não existe**. O corpo provavelmente fica no mapa indefinidamente até ser coletado ou até o piso ser trocado.

---

## 🟡 SEÇÃO 2.4: Status de Sobrevivência — 15% (Scaffolding apenas)

| Requisito do spec | Status | Evidência real |
|---|---|---|
| Tipos `bleeding`/`poison`/`infection` no state | ✅ | `types/game.ts:154-158`, `gameStore.ts:129-132` |
| Curativas (bandages/antidotes/antibiotics) no state | ✅ | `types/game.ts:159-163` |
| `setStatusCondition()` / `useCurative()` no store | ✅ | `gameStore.ts:88, 327-340` — funções existem |
| **HP drain de sangramento ao mover** | ❌ | Não encontrei nenhuma chamada dessas funções em `GameScene.ts`, `Player.ts` ou `Enemy.ts`. Nada aplica esses status durante o gameplay. |
| **HP drain contínuo de veneno** | ❌ | Idem — não há loop de update que drene HP baseado em `poison: true` |
| **Bloqueio de regen por infecção** | ❌ | Idem |
| **Aplicação de status por ataques de inimigos** | ❌ | Nenhum `Enemy.ts` chama `setStatusCondition` |
| Cura via NPCs (Clérigo) | ⚠️ Não verificado | NPC 'cleric' existe fisicamente, mas não confirmei se a interação de cura de infecção está implementada |

**Veredito:** Isso é só a "fundação de dados" (types + store actions), correta para consistência de save/schema, mas **zero gameplay real**. Isso é esperado — no `docs/specs/andamento/`, a Fase 3 nem estava com ETA definido ainda no momento em que criamos o roadmap. Não é um problema, é só importante deixar claro que "está no schema" ≠ "está jogável".

---

## ✅ SEÇÃO 3.1: Vilas e Safe Zones — 85%

| Requisito do spec | Status | Evidência real |
|---|---|---|
| Vila física no mapa (não menu) | ✅ | `GameScene.ts:519-544` — Room 0 (`spawn room`) vira zona segura com sprites físicos |
| Clérigo/Curandeiro | ✅ | `GameScene.ts:523` — NPC `'cleric'` |
| Mercador Alquimista | ✅ | `GameScene.ts:528` — NPC `'alchemist'` |
| Ferreiro Necromântico | ✅ | `GameScene.ts:533` — NPC `'blacksmith'` |
| Ancião (missões) | ✅ | `GameScene.ts:538` — NPC `'elder'` |
| Interação por proximidade | ✅ | `GameScene.ts:780-802` — range de 50px, evento `trigger-npc` |
| Paliçadas/guardas ativos eliminando inimigos | ❌ | Não encontrado — a "vila" é a spawn room sem inimigos, mas não há guardas NPC combatentes |
| Menus via clique em objetos do cenário (mesa de alquimia, forja) | ⚠️ Parcial | A interação é via NPC sprite + tecla, não via clicar em elementos cenográficos específicos como o spec sugere na Seção 5.1 |

**Veredito:** Os 4 NPCs core estão lá com nomes e função corretos — ótimo trabalho. Faltam os detalhes de ambientação (guardas, cenário interativo) que são "nice to have" da Seção 5.

---

## 🟡 SEÇÃO 3.2: Viagem Nômade & Bloqueios — 30%

| Requisito do spec | Status | Evidência real |
|---|---|---|
| Transição seamless entre biomas sem loading abrupto | ⚠️ Não verificado como "nômade contínuo" | O jogo ainda usa estrutura de **andares/waves** (`floorDepth`, `currentWave`) gerados proceduralmente por `DungeonGenerator.ts`, e não um mundo aberto contínuo interligando vilas. Isso é a arquitetura antiga do jogo (roguelike de ondas) que a Fase 4 do discovery pretendia substituir. |
| Mini-chefes como guardiões físicos de passagem (gate/lock) | ❌ | Existe uma **Boss Room** por andar (`room.type === 'boss'`), mas não encontrei lógica de porta trancada / chave dropada / bloqueio físico de progresso até derrotar o chefe — não há `isLocked`, `unlockDoor` ou equivalente no código. |
| 3 biomas (Fosso, Catacumbas, Santuário) | ✅ | `types/game.ts:26` — `BiomeType` já modelado |

**Veredito:** Esta é a maior lacuna estrutural: o jogo continua sendo "andares gerados por wave" em vez da "jornada nômade contínua entre vila-estepes-catacumbas" que o discovery propõe como pilar central (Seção 3). Isso é esperado — é a mudança arquitetural mais profunda do documento e normalmente seria a última a ser feita (a Fase 4 tinha ETA para novembro no nosso roadmap).

---

## ❌ SEÇÃO 3.3: Narrativa e Lore — 0%

| Requisito do spec | Status |
|---|---|
| Origem do protagonista narrada in-game | ❌ Não encontrado no código (pode existir só em texto de marketing/menu, não confirmei) |
| Documentos perdidos (diários, pergaminhos de lore) | ❌ Os "pergaminhos" que existem no jogo são pergaminhos de **magia/spell** (ex: "Pergaminho de Hemomancia"), não documentos narrativos |
| Diálogos de NPC que mudam com progresso | ❌ Não encontrado |

**Veredito:** Não implementado. Não é crítico para jogabilidade, mas é 100% do pilar de "Environmental Storytelling" do spec.

---

## ✅ SEÇÃO 4: Mecânicas de Scavenging — 90%

| Requisito do spec | Status | Evidência real |
|---|---|---|
| Pilhagem de recipientes (caixas, ossos, corpos) | ✅ | `Scavengeable.ts` — tipos `skeleton`, `corpse`, `crate` |
| Indicador `[E] Revistar` | ✅ | `GameScene.ts:806-831` — `store.setActiveScavengeable` alimenta HUD |
| Barra de progresso 1.5-3s | ✅ | `GameScene.ts:849` — `scavengeTimeElapsed / duration` |
| Imobilidade durante ação | ⚠️ Não confirmei se velocity é zerada durante scavenge | Vale checar manualmente |
| Cancelamento ao ser atacado/mover | ⚠️ Não confirmei a condição de cancelamento no código lido | Vale checar manualmente |

**Veredito:** Muito bem implementado no essencial. Dois detalhes de "cancelamento" merecem teste manual antes de dar 100%.

---

## ✅ Enemy AI — 4 Temperamentos — 100%

Confirmado line-by-line em `Enemy.ts`:
- `highly_aggressive`: `maxDist *= 1.5` (visão expandida) + `multiplier = 1.5` (audição expandida)
- `territorial`: `maxDist = Math.min(maxDist, 120)` (raio curto, só ataca por proximidade)
- `defensive`: só entra em combate `if (!this.isAngered)` retorna false — precisa ser atacado primeiro
- `totally_passive`: sempre retorna `false` em `canSeePlayer`, e foge (`aiState = 'flee'`) se o jogador chegar perto

Isso está **fielmente implementado** conforme os 4 perfis descritos na Seção 2.1 do discovery.

---

## ✅ SEÇÃO 8: Anti-Regressão — 100%

| Regra crítica | Status |
|---|---|
| `ACCELERATION`/`DECELERATION` intactos em `Player.ts` | ✅ Confirmado: `ACCELERATION = 1400`, `DECELERATION = 1000`, lógica de `moveToward` preservada |
| FSM do `Enemy.ts` preservada (idle/patrol/investigating/combat/frenzy/flee) | ✅ Todos os 6 estados presentes, interceptados no topo do update sem reescrever a máquina |
| `physics.add.collider`/`overlap` preservados em `GameScene.ts` | ✅ 12 ocorrências confirmadas |
| Dano ignorado durante inconsciência | ✅ `takeDamage()` retorna cedo se `isUnconscious` |
| Schema Zod com `.catch()` para backward-compatibility | ✅ Confirmado em `localStorage.ts` (`BloodCrystalsSchema`, `TalentLevelsSchema`, `SettingsSchema` etc, todos com `.catch()`) |
| TypeScript strict (`pnpm run typecheck`) | ✅ **Zero erros** (rodei `tsc --noEmit` diretamente) |
| Build de produção | ✅ Build completou em 15s sem erros (apenas warning de bundle >500kb, não bloqueante) |

**Veredito:** O Guia Anti-Regressão foi seguido rigorosamente. Nenhum arquivo crítico teve sua lógica core alterada de forma perigosa.

---

## ⚠️ Achado Fora do Escopo do Spec: Árvore de Código Duplicada

Durante a validação encontrei que o repositório agora tem **dois diretórios de código-fonte**:

```
/artifacts/bloodmage/src/   ← versão antiga (Lovable/legado)
/src/                       ← versão atual (o que o Vercel builda)
```

Confirmei que **já divergem** — 4 arquivos são diferentes entre as duas cópias:
- `components/GameplayHUD.tsx`
- `components/MainMenu.tsx`
- `components/hud/ActionButtons.tsx`
- `components/hud/SkillsOverlay.tsx`

**Risco:** Se alguém (humano ou agente de IA) editar `artifacts/bloodmage/src/` achando que é a versão viva, o trabalho não vai refletir em produção (o `vite.config.ts` raiz aponta pro `src/` raiz, e o `vercel.json` builda a partir daí). Isso já aconteceu no commit `c4868b1`, onde Felipe teve que editar os dois lugares manualmente.

**Recomendação:** Decidir com Felipe se `artifacts/bloodmage/` deve ser arquivado/removido, ou se há um motivo (ex: referência histórica do Lovable) para mantê-lo. Se for mantido, vale marcar claramente em `docs/critical//01_CRITICAL_FILES.md` que **`/src/` é a fonte da verdade**, não `/artifacts/bloodmage/src/`.

---

## 📋 Recomendações Priorizadas

1. **🔴 Alta prioridade:** Resolver a duplicidade `src/` vs `artifacts/bloodmage/src/` antes que mais trabalho seja feito no lugar errado.
2. **🟡 Média prioridade:** Decidir se vale criar um inventário de consumíveis de verdade para a mecânica de drop de morte funcionar como o spec descreve, ou se a adaptação atual (loot genérico no corpo) é aceitável como está.
3. **🟡 Média prioridade:** Implementar o loop de gameplay da Fase 3 (Status Effects) — o schema já está pronto, falta só ligar aos eventos de dano/movimento.
4. **🟢 Baixa prioridade:** Fase 4 (mundo contínuo, portões, lore) é a mudança mais estrutural — sugiro tratar como um discovery técnico à parte antes de implementar, já que muda a arquitetura de "andares por wave" para "mundo aberto contínuo".
5. **✅ Testar manualmente:** persistência de morte ao fechar/reabrir aba, imobilidade + cancelamento durante scavenging.

---

## 📚 Documentação Relacionada

- Spec original: [[../legacy/DISCOVERY_DUNGEON_SIEGE_EVOLUTION.md]]
- Roadmap por fase: [[../specs/README.md]]
- Fase 1 (deveria ser movida para FINALIZADAS ou quase): [[../specs/andamento/01_FASE1_INCONSCIENCIA.md]]
- Arquivos críticos: [[../critical/01_CRITICAL_FILES.md]]

---

**Validado por:** Claude, lendo o código-fonte diretamente (não por inferência de nomes de commit)
**Ambiente:** typecheck + build rodados localmente com sucesso
