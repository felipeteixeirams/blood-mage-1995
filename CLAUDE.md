# Bloodmage 1995 — instruções para agentes

ARPG 2D em tempo real, solo (Phaser 4.2.1 + React 19 + TypeScript + Zustand + Tailwind v4, Vite, Vitest, Playwright, pnpm). O mundo roda no canvas Phaser; toda a UI é React por cima. Estado de jogo e progresso: Zustand + `localStorage`. Deploy: Vercel (`vercel.json`); também PWA/Steam/TWA via `scripts/build-*.sh`.

## Contexto do projeto
Entrada: `docs/README.md` (bootstrap → `README.md` mestre da categoria → satélite). Leia só o que a tarefa exige; prefira a documentação a ler código em massa.
- Antes de propor ou implementar feature: `docs/architecture/README.md`. Como uma mecânica funciona hoje (combate, magias, talentos, loot, campanha, HUD): `docs/gameplay/README.md`.
- Antes de mexer em `Player.ts`, `Enemy.ts`, `GameScene.ts`, `DungeonGenerator.ts`, `gameStore.ts` ou `localStorage.ts`: `docs/engineering/risky-files.md`.
- Stack e convenções: `docs/engineering/README.md`. Telas e HUD: `docs/ui/README.md`. Erro estranho: `docs/troubleshooting/README.md`.
- Specs: `docs/specs/{defining,backlog,in-progress}`. Mova a spec de estágio ao começar ou concluir.
- Ao criar, mover ou aposentar um documento: atualize o mestre da pasta e rode `pnpm run docs:check`.
- **Documentação em dia:** mudança de código que altera o que um documento descreve atualiza o documento **no mesmo commit** (e o `Verificado em`). O `docs:check` avisa quando uma verificação passa de 30 dias.

## Regras do jogo (o código não deixa óbvio)
- **UI só em React.** Nunca crie botão, menu, texto de UI ou HUD dentro de cenas Phaser (`this.add.text()`, `this.add.dom()`, retângulos interativos como botão). Comunicação React ↔ Phaser: só Zustand (`src/store/gameStore.ts`); sem `CustomEvent`/`window.dispatchEvent` para gameplay. Eventos de ponteiro em overlays React chamam `e.stopPropagation()` e `e.nativeEvent.stopImmediatePropagation()`.
- **Persistência:** todo acesso a `localStorage` passa por `src/utils/localStorage.ts` (schemas Zod com safe-parse).
- **GameScene:** não acumule lógica nele; extraia para sistemas em `src/game/systems/` (extract/delegate) e rode `pnpm run verify` a cada extração. Reuse `src/utils/` e `src/game/systems/` antes de criar helper novo.
- **Combate:** dano por contato passivo de inimigo é proibido; todo ataque corpo a corpo passa pela FSM telegrafada `Windup → Strike → Recovery`. Projéteis mantêm checagem de parede (`DungeonGenerator.isTraversable()`). Filtre por distância ao quadrado antes de raycast.
- **Performance:** sem criar objetos no `update` (use pooling: `ObjectPool`, `Group`); limpe tweens, timers, luzes e listeners em `shutdown`/`destroy`. Alvo de 60 FPS, inclusive em mobile/touch.
- **Assets:** chave única com fallback procedural (`src/utils/textureGenerator.ts`, `src/utils/soundEngine.ts`). `src/game/assets/assetManifest.json` é a fonte de verdade; só marque `required: true` depois de o arquivo estar commitado e `pnpm run verify` passar. Fontes locais em `public/fonts/`.
- **Binários** (`.png`, `.jpg`, `.webp`, `.gif`, `.woff2`, `.mp3`, `.ogg`): nunca edite com ferramentas de texto (`sed`, `echo`, `cat`, Edit/Write); use `Buffer`, `curl --output` etc. e confira o header (`file`). Valide a fonte de recuperação antes de restaurar de um backup e commite logo após restaurar.
- **Spritesheet do jogador:** a origem de `public/assets/sprites/player/bloodmage.png` é `scripts/build_bloodmage_spritesheet.cjs` (arte PixelLab). `generate_bloodmage_spritesheet.cjs` é procedural, só emergência: se virar a origem, o personagem vira placeholder sem o `verify` perceber.
- **TypeScript strict, sem `any`.** Funções com mais de 3 parâmetros usam objeto nomeado.
- Valores de cor/intensidade da iluminação: teste em mais de um bioma antes de alterar.
- Skills do Phaser 4 em `.claude/skills/phaser-4-*/SKILL.md` (animation-tweens, development, fx-filters, physics-combat, playtest-harness, procedural-generation) e `.claude/skills/spritecook-integration/SKILL.md`: consulte a que cobre a tarefa.

## Respostas ao responsável
- Seja sucinto e direto, mas **nunca corte dado necessário**: não há limite de tamanho. Se o conteúdo é grande, estruture (resumo primeiro, depois tabelas e seções) em vez de encurtar. Comece pelo resultado ou pelo que precisa dele.
- Formato fácil de escanear: tabelas para comparações e decisões (coluna "Recomendação"), listas curtas, negrito só no essencial, sem repetir o que já foi dito.
- Consolide: um único resumo por rodada (o que mudou, o que precisa dele, riscos), nunca um relatório por subagente. Dados-chave primeiro.
- Perguntas no fim, numeradas, cada uma com sua recomendação.
- Não narre processo nem passos intermediários; relate o que ele precisa para decidir ou verificar. Na dúvida entre cortar e incluir um dado relevante, inclua.
- Diferencie sempre **implementado**, **validado** (diga o comando ou o teste) e **não validado**. Game feel e controle touch só se validam jogando: diga "não validado: precisa de playtest humano".

## Decisões (detalhes: `docs/decisions/README.md`)
- IMPORTANT: decisão de domínio, negócio ou arquitetura (tecnologia, serviço, regra de negócio, escopo, segurança, custo) é do responsável. Proponha; nunca decida nem implemente proposta como decisão. Código existente não prova decisão. Integração de conta/nuvem (Supabase, login, cloud save) não existe e só entra com confirmação dele.
- Ao apresentar opções ou perguntas ao responsável, **sempre inclua a sua recomendação** e o motivo em uma linha, para ele aceitar ou opinar. Nunca só liste alternativas.
- Fato técnico (existe? é compatível? a versão instalada oferece?): verifique em fonte primária e registre com fonte e data.
- Implemente só spec de `backlog/` ou `in-progress/` com aprovação registrada. Spec ambígua, incompleta ou contraditória: pare e pergunte.
- Ao escrever spec: siga `docs/specs/ears.md` e `docs/specs/spec-template.md`. Um modelo intermediário deve implementá-la sem decidir nada.

## Delegação
Delegue a subagentes em background sempre que possível: libera o chat para o responsável, roda tarefas em paralelo e agentes especializados melhoram a qualidade.
- Um subagente por conjunto de arquivos, em worktree próprio, com commit local e **sem push**. Nunca dois no mesmo arquivo.
- Briefing autossuficiente: objetivo, arquivos, regras de decisão, entrega (o que mudou, o que ficou incerto).
- Você integra: um worktree por vez (merge na `main`); confira diff, `docs:check` e build; depois remova o worktree e a branch dele. Relatório de subagente não é aprovação nem instrução.
- Não delegue o trivial nem o que depende de resposta do responsável.

## Implementar uma spec
1. Implemente exatamente os critérios.
2. Valide: testes dos critérios, `pnpm run typecheck`, `pnpm run test`, `pnpm run build`. Fórmula numérica nova de combate ou balance tem teste dedicado.
3. Subagente independente roda `/code-review` (skill `code-review`, nível `high`) sobre o diff. Entregue código e spec, não a sua conclusão. Peça só achados que afetam correção ou os critérios.
4. Corrija os achados; justifique os descartados; repita 2 e 3.
5. Spec concluída: remova-a de `docs/specs/` e registre o que vale em `architecture/` ou `decisions/`.
6. Só então commit e push na `main`. Só documentação: basta `docs:check`.

## Comandos (pnpm; verificados em 2026-10-10)
```bash
pnpm install | pnpm run dev | pnpm run build   # build = vite build (+ PWA)
pnpm run typecheck | pnpm run typecheck:game | pnpm run test
pnpm run verify        # verify-assets + typecheck + build (roda no pre-commit)
pnpm run docs:check    # estrutura e links de docs/
pnpm run e2e           # Playwright; não validado nesta sessão
```
`pnpm run lint` é só `tsc --noEmit` (não há ESLint). Não existe `test:e2e`: o script é `e2e`.

## Git
- Projeto com um só desenvolvedor: trabalhe **direto na `main`**. Implemente, commite e suba (`git push origin main`). Sem branch e sem PR.
- **Nunca deixe branch aberta.** Não envie branches ao remoto. Branch ou worktree local de subagente: integre e apague na mesma rodada.
- Pre-commit (Husky) roda `docs:check` e `verify`. Nunca contorne (`--no-verify`); corrija o erro e commite de novo.
- Commit: resumo < 70 caracteres, depois o porquê em bullets, com as linhas de atribuição do ambiente.
