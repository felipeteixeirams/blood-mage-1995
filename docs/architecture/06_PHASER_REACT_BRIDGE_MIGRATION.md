---
agent_context: frontend, backend, game-engine
target_module: src/store/gameStore.ts, src/game/scenes/GameScene.ts, src/game/PhaserGame.tsx
priority: medium
status: em andamento — Fase 1 concluída; Fase 2 (cutover) 3/5 pontes migradas (respawn-player, update-cosmetic-tint, use-curative)
last_updated: 2026-08-25
tags: [architecture, phaser, react, zustand, event-bus, migration, tracker]
---

# 🌉 Migração da Ponte Phaser↔React: `window.dispatchEvent`/`CustomEvent` → Zustand tipado

> Este é o "item 9" do backlog de melhorias identificado a partir do Pilar 2 de
> `docs/archive/specs/propostas/08_GUIA_EVOLUCAO_COMERCIAL.md`. Documento vivo:
> registra o estado real do código (auditoria), a arquitetura-alvo, o plano de
> corte incremental e os testes que dão segurança para cada etapa — seguindo o
> mesmo padrão de tracker já usado em `05_GAMESCENE_REFACTOR.md`.

---

## 1. Por que isso importa (e por que não é tão grande quanto parecia)

O Pilar 2 do Guia Comercial descrevia a ponte Phaser↔React como "baseada em
`window.dispatchEvent`/`CustomEvent`", com tipagem frouxa ou nula, e apontava
risco de race conditions. Isso era verdade quando a proposta foi escrita
(11/08), mas o código evoluiu organicamente desde então: a maior parte da
comunicação entre o HUD React e o `GameScene` **já migrou para o Zustand**
(`touchMoveInput`, `touchAimInput`, `activeSkillTrigger`, `activeScavengeable`,
`activeNPC`, `currentTarget`, etc. — ver `src/store/gameStore.ts`).

A auditoria abaixo (feita em 25/08 lendo o código real, não a descrição da
proposta) mostra que sobra pouco: **5 pares evento→handler realmente ativos**
e **3 listeners mortos** (código morto, nunca disparado por ninguém). Migrar
o que resta é um trabalho pequeno e de baixo risco — não o "projeto grande"
que a lista de prioridades sugeria inicialmente.

---

## 2. Auditoria — estado real em 25/08/2026

### 2.1 — Pontes ativas (disparadas e escutadas de verdade)

| Evento | Disparado em | Escutado em | Direção | Frequência | Payload |
|---|---|---|---|---|---|
| `use-curative` | `src/components/hud/PlayerStatus.tsx` (3 botões) | `GameScene.ts:517` | React → Phaser | Baixa (clique) | `detail: 'bandages' \| 'antidotes' \| 'antibiotics'` |
| `respawn-player` | `src/components/GameOverModal.tsx:106` | `GameScene.ts:283` | React → Phaser | Muito baixa (1x por morte) | sem payload |
| `update-cosmetic-tint` | `src/components/GameplayHUD.tsx:675` | `GameScene.ts:595` | React → Phaser | Baixa (troca de paleta) | sem payload |
| `drag-aim-start`/`-move`/`-end` | `src/components/hud/SkillsOverlay.tsx:250,262,272,291` | `GameScene.ts:586-588` | React → Phaser | **Alta** — `move` dispara a cada `pointermove` durante o gesto | `detail: { spellId, dx?, dy?, isDrag? }` |
| `loot-acquired` | `src/game/objects/Player.ts:983` | `src/components/hud/LootLog.tsx:16` | Phaser → React | Baixa (a cada pickup) | `detail: LootItem` |

Só o grupo `drag-aim-*` é de alta frequência — é o único caso onde a
preocupação original de performance/race-condition tinha fundamento real.
Os outros quatro são comandos pontuais de baixíssimo volume.

### 2.2 — Listeners mortos (código morto — nenhum dispatch encontrado em `src/` nem em testes)

| Evento | Onde está o listener morto | O que fazer |
|---|---|---|
| `trigger-npc` | `GameScene.ts:277` | Remover — a UI já chama `useGameStore.getState().setActiveNPC(npcType)` diretamente (`GameplayHUD.tsx:842`) |
| `trigger-scavenge` | `GameScene.ts:345` | Remover — nenhum disparo encontrado; scavenge hoje é resolvido via `activeScavengeable`/`scavengeProgress` no store |
| `trigger-blood-nova` | `GameScene.ts:578-579,598,610` + método `triggerBloodNova()` (linha 768) | Remover o listener; **manter** o método `triggerBloodNova()` se ele for chamado por outro caminho interno do Phaser (confirmar antes de apagar o método em si — só o listener é comprovadamente morto) |

Isso é limpeza de baixo risco e pode ser feita **antes** da migração de verdade,
como um commit isolado — reduz a superfície do arquivo sem tocar em nada que
funciona hoje.

### 2.3 — Padrão-alvo já validado em produção

O próprio código já prova que o padrão "store tipado + `useEffect` em
`PhaserGame.tsx`" funciona, inclusive em alta frequência:

```ts
// src/game/PhaserGame.tsx — já em produção, roda a cada frame que o joystick se move
useEffect(() => {
  if (gameSceneRef.current) {
    gameSceneRef.current.setTouchInputs(
      touchMoveInput.x, touchMoveInput.y, touchAimInput.x, touchAimInput.y
    );
  }
}, [touchMoveInput, touchAimInput]);
```

E o padrão "comando dispara → Phaser processa → reseta para `null`" também já
existe para `activeSkillTrigger`:

```ts
useEffect(() => {
  if (activeSkillTrigger && gameSceneRef.current) {
    gameSceneRef.current.triggerSkill(activeSkillTrigger);
    onSkillTriggerProcessed(null); // reseta para não re-disparar
  }
}, [activeSkillTrigger]);
```

A migração não inventa arquitetura nova — **replica um padrão que já roda em
produção sem problema conhecido**, para os 5 casos que ainda usam
`CustomEvent`. Isso é o que torna a migração segura: não é uma aposta, é
aplicar consistência.

---

## 3. Arquitetura-alvo por bridge

| Bridge | Novo campo no store | Consumido via | Padrão |
|---|---|---|---|
| `use-curative` | `activeCurativeTrigger: 'bandages' \| 'antidotes' \| 'antibiotics' \| null` | `useEffect` em `PhaserGame.tsx` chama `scene.useCurativeItem(type)` e reseta para `null` | Comando + reset (igual `activeSkillTrigger`) |
| `respawn-player` | `respawnRequested: boolean` | `useEffect` chama o método de respawn e reseta para `false` | Comando + reset |
| `update-cosmetic-tint` | `cosmeticTintVersion: number` (incrementado a cada chamada) | `useEffect` com dependência no número reage a qualquer mudança de valor, chama `player.applyCosmeticTint()` | Contador — sem payload, só precisa de "algo mudou" |
| `drag-aim-*` | `dragAim: { spellId, phase: 'start'\|'move'\|'end'\|null, dx, dy, isDrag }` | `useEffect` com dependência em `dragAim` chama o handler correspondente à `phase` | Objeto de estado (igual `touchMoveInput`/`touchAimInput`) |
| `loot-acquired` | `lastLootPickup: { item: LootItem; id: number } \| null` | `LootLog.tsx` passa a ser `useGameStore(s => s.lastLootPickup)` em vez de `addEventListener`; `id` incrementa a cada chamada para garantir que 2 pickups seguidos do "mesmo" item (por raridade/nome) ainda disparem o toast | Valor + versão (não dá pra confiar em mudança de referência de objeto sozinha) |

**Status desta seção: implementado.** Os 5 campos acima já foram adicionados a
`src/store/gameStore.ts` (aditivo — nada foi removido, o bridge antigo por
`CustomEvent` continua funcionando exatamente como antes) e cobertos por
testes novos em `src/store/gameStore.test.ts`, describe
`"Phaser<->React typed bridge"`. Isso é a Fase 1 abaixo.

---

## 4. Plano de corte — incremental, um bridge por vez

Mesma lógica de segurança usada no refactor do `GameScene.ts`
(`05_GAMESCENE_REFACTOR.md`): nunca trocar tudo de uma vez, sempre manter o
jogo rodável entre commits, sempre validar com `pnpm verify` antes de seguir
para o próximo.

### Fase 0 — Limpeza dos listeners mortos (opcional, pode ser feita já)
- Remover os 3 listeners de §2.2.
- Risco: baixíssimo (nenhum dispatch encontrado). Ainda assim, validar com
  `pnpm verify` + um playtest manual rápido (abrir NPC, fazer scavenge,
  conjurar Explosão Sanguínea) antes de dar commit, porque grep não prova
  ausência com 100% de certeza (ex.: dispatch dinâmico por string montada em
  runtime não apareceria no grep).

### Fase 1 — Scaffolding do store ✅ Concluído (25/08/2026)
- 5 campos novos + ações em `gameStore.ts`, aditivos, não usados ainda por
  ninguém em produção.
- Testes unitários cobrindo cada campo em `gameStore.test.ts`.
- Zero risco: nada foi removido, nada foi trocado. O jogo continua 100%
  funcional exatamente como estava.

### Fase 2 — Cutover, um bridge por vez (esta é a parte que toca `GameScene.ts` e os componentes)

Ordem sugerida — da mais simples/baixo risco para a mais delicada:

1. ✅ **`respawn-player`** — migrado em 25/08/2026 (mais simples: sem payload, dispara 1x por morte)
   - `GameOverModal.tsx`: dispatch trocado por `useGameStore.getState().setRespawnRequested(true)`.
   - `PhaserGame.tsx`: novo `useEffect` (dependência `[respawnRequested]`) chama `gameSceneRef.current.respawnPlayer()` e reseta para `false`.
   - `GameScene.ts`: `window.addEventListener('respawn-player', ...)` removido; corpo extraído para `public respawnPlayer()` (mesmo local, mesma lógica, zero mudança de comportamento).
   - **Pendente de você:** validar manualmente — morrer em jogo, confirmar respawn na Safe Town, stats resetados, corpo dropado no local da morte — e rodar `pnpm verify` antes do commit.

2. ✅ **`update-cosmetic-tint`** — migrado em 25/08/2026 (sem payload, baixa frequência)
   - `GameplayHUD.tsx`: dispatch trocado por `useGameStore.getState().bumpCosmeticTint()`.
   - `PhaserGame.tsx`: novo `useEffect` (dependência `[cosmeticTintVersion]`) chama `gameSceneRef.current.applyCosmeticTint()` quando o contador incrementa (guard `> 0` evita chamada redundante no mount).
   - `GameScene.ts`: listener removido; corpo extraído para `public applyCosmeticTint()`.
   - **Pendente de você:** validar manualmente — trocar paleta cosmética nas configurações, confirmar que o tint do sprite muda em tempo real — e `pnpm verify` antes do commit.

3. ✅ **`use-curative`** — migrado em 25/08/2026
   - `PlayerStatus.tsx`: os 3 `onClick` agora chamam `useGameStore.getState().setActiveCurativeTrigger('bandages' | 'antidotes' | 'antibiotics')`.
   - `PhaserGame.tsx`: novo `useEffect` (dependência `[activeCurativeTrigger]`) chama `gameSceneRef.current.useCurativeItem(type)` e reseta para `null`.
   - `GameScene.ts`: listener removido. `useCurativeItem()` já era público (também usado pelos atalhos de teclado Z/X/V — nada mudou ali).
   - **Pendente de você:** validar manualmente — usar cada um dos 3 curativos clicando na UI (e também pelos atalhos Z/X/V, que usam o mesmo método e não devem ter sido afetados) — e `pnpm verify` antes do commit.

4. **`loot-acquired`** (muda de direção — Phaser → React)
   - `Player.ts:983`: trocar `window.dispatchEvent(...)` por `useGameStore.getState().notifyLootPickup(item)`.
   - `LootLog.tsx`: reescrever de `useState` + `addEventListener` para `const pickup = useGameStore(s => s.lastLootPickup)` + `useEffect` que arma o `setTimeout` de 3s toda vez que `pickup?.id` muda.
   - Validar: coletar 2 itens do mesmo tipo em sequência rápida, confirmar que o toast reaparece/reinicia a cada um (é exatamente o caso que o campo `id` existe para cobrir).

5. **`drag-aim-start`/`-move`/`-end`** (a única de alta frequência — deixar por último, com mais atenção)
   - `SkillsOverlay.tsx`: os 3 `window.dispatchEvent` viram `useGameStore.getState().setDragAim({ spellId, phase: 'start'|'move'|'end', dx, dy, isDrag })`.
     - Atenção: o `dragStateRef` local do componente (posição do gesto) **continua existindo** — ele é estado de UI pura do gesto de toque, não precisa ir para o store. Só o que já cruzava para o Phaser via evento é que migra.
   - `PhaserGame.tsx`: `useEffect` com dependência em `dragAim` despacha para `scene.handleDragAimStart/Move/End(dragAim)` conforme `dragAim.phase`.
   - `GameScene.ts`: os 3 métodos `handleDragAimStart/Move/End` já existem e já são públicos (usados por `PlayerSkillSystem.ts`) — só muda quem os chama; remover os 3 `window.addEventListener`.
   - **Ponto de atenção real:** como `move` dispara a cada `pointermove`, e Zustand com `set()` idêntico não gera novo objeto por padrão, é preciso garantir que cada chamada de `setDragAim` realmente crie um objeto novo (o plano acima já faz isso — `{ spellId, phase, dx, dy, isDrag }` é sempre um literal novo) para que o `useEffect` dispare a cada movimento, exatamente como já acontece hoje com `touchMoveInput`.
   - Validar: usar drag-to-aim nas 3 skills direcionais (Foice Carmim, Feixe de Hemomancia, Círculo de Transmutação) em mouse e touch, confirmar preview de mira segue o dedo/cursor sem lag perceptível e a skill dispara na direção correta ao soltar.

### Fase 3 — Remoção final
- Depois que os 5 bridges estiverem migrados e validados individualmente,
  confirmar via grep que não sobrou nenhum `window.dispatchEvent`/
  `window.addEventListener` relacionado a gameplay em `src/` (os que ficam de
  fora, e são legítimos: `gamepadconnected`, `keydown`, `visibilitychange`,
  `beforeunload`, `resize`, `orientationchange` — esses são eventos nativos do
  browser, não fazem parte da ponte Phaser↔React e não devem ser tocados).

---

## 5. Por que isso é seguro (mitigação de risco)

- **Nunca migra tudo de uma vez.** Cada bridge é um commit isolado, validável
  com `pnpm verify` + um playtest manual específico daquela mecânica antes de
  seguir para o próximo.
- **O padrão já roda em produção.** Não é uma arquitetura nova sendo
  inventada — é a mesma receita de `touchMoveInput`/`activeSkillTrigger`
  aplicada aos 5 casos que ainda não a usam.
- **Reversível a qualquer momento.** Como o CustomEvent antigo só é removido
  *depois* que o novo caminho for validado (não em paralelo, mas em sequência
  por bridge), um `git revert` do commit da bridge problemática volta o jogo
  ao estado funcional anterior sem afetar as outras 4 já migradas.
- **A parte de maior risco real (`drag-aim`, alta frequência) vai por último**,
  quando o padrão já tiver sido exercitado 4 vezes nos casos mais simples.
- **Zero mudança de UX.** Isso é refactor puro de mecanismo de comunicação —
  em nenhum momento o comportamento do jogo, visto pelo jogador, deveria
  mudar. Se mudar, é sinal de bug introduzido na migração, não uma consequência esperada.

## 6. Testes

- ✅ **Feito:** `src/store/gameStore.test.ts` — 6 testes novos cobrindo os 5
  campos adicionados (incluindo o caso de borda do `id` incremental em
  `lastLootPickup` para pickups consecutivos do mesmo item).
- **Pendente (Fase 2, por bridge):** não há testes automatizados para
  `GameScene.ts` em si (não há infraestrutura de mock de cena Phaser no
  projeto hoje) nem para os componentes React que disparam os eventos (o
  projeto não tem React Testing Library instalado). Por isso, a validação de
  cada bridge na Fase 2 é **manual, guiada pelo checklist descrito em cada
  item da seção 4** — adicionar RTL só para isso seria desproporcional ao
  tamanho do problema. Se no futuro o projeto adotar RTL por outro motivo,
  vale revisitar e automatizar esses checklists.

## 7. Checklist de execução (Fase 2)

- [ ] Fase 0 — remover os 3 listeners mortos (`trigger-npc`, `trigger-scavenge`, `trigger-blood-nova`)
- [x] `respawn-player` migrado (código); `CustomEvent` antigo removido — falta você validar em jogo + `pnpm verify` antes do commit
- [x] `update-cosmetic-tint` migrado (código); `CustomEvent` antigo removido — falta você validar em jogo + `pnpm verify` antes do commit
- [x] `use-curative` migrado (código); `CustomEvent` antigo removido — falta você validar em jogo + `pnpm verify` antes do commit
- [ ] `loot-acquired` migrado, validado, `CustomEvent` antigo removido
- [ ] `drag-aim-start/move/end` migrado, validado (mouse + touch), `CustomEvent` antigo removido
- [ ] Fase 3 — grep final confirma zero `CustomEvent` de gameplay restante em `src/`
- [ ] `docs/architecture/04_STATE_MANAGEMENT.md` atualizado para mencionar que a ponte é 100% Zustand (remover a lacuna que hoje não menciona o bridge antigo nem o novo)

---

## Referências

- [[05_GAMESCENE_REFACTOR.md]] — mesmo padrão de tracker e mesma filosofia de corte incremental
- [[04_STATE_MANAGEMENT.md]] — visão geral do Zustand como camada de sincronização
- [[../archive/specs/propostas/08_GUIA_EVOLUCAO_COMERCIAL.md]] — Pilar 2, origem deste item

## Registro de mudanças

| Data | O que mudou | Autor |
|------|-------------|-------|
| 2026-08-25 | Criação: auditoria completa da ponte atual, arquitetura-alvo, plano de corte incremental, Fase 1 (scaffolding + testes) implementada | Claude |
| 2026-08-25 | Fase 2, ponte 1/5 (`respawn-player`) migrada: `GameOverModal.tsx`, `GameScene.ts` (`respawnPlayer()` público) e `PhaserGame.tsx` atualizados | Claude |
| 2026-08-25 | Fase 2, ponte 2/5 (`update-cosmetic-tint`) migrada: `GameplayHUD.tsx`, `GameScene.ts` (`applyCosmeticTint()` público) e `PhaserGame.tsx` atualizados | Claude |
| 2026-08-25 | Fase 2, ponte 3/5 (`use-curative`) migrada: `PlayerStatus.tsx`, `GameScene.ts` (listener removido, `useCurativeItem()` já era público) e `PhaserGame.tsx` atualizados | Claude |
