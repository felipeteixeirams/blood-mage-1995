# Spec 12: Expansion & Replayability Fronts

## Objetivo Geral
Estruturar o plano de expansão do *Blood Mage 1995*, focando em aprofundar as mecânicas, rejogabilidade e desafio do jogo, alinhando-se aos princípios da engenharia orientada a especificações (Spec-Driven). O objetivo é estender a vida útil do jogo com mecânicas duradouras sem corromper a base estável do projeto.

---

## Mapeamento Geral: As 4 Frentes de Expansão

> **Nota (27/08):** o changelog abaixo documenta uma 5ª Frente (Trilha Sonora
> Procedural) que nunca foi adicionada a este mapeamento — a lista ficou
> desatualizada em relação ao próprio changelog da spec. Corrigido abaixo.
> Auditoria de código feita em 27/08 confirmou as Frentes 1-3 e 5 batem com o
> que o changelog descreve; a Frente 4 teve uma ressalva séria (bug do
> inventário duplicado), **corrigida no mesmo dia** — ver
> `## 📈 Histórico de Progresso`.

1. **[CONCLUÍDO] Interações de Ambiente e Armadilhas (Dungeon Depth):**
    - Armadilhas procedurais nas salas (espinhos de chão, dardos, poças tóxicas) que punam tanto o jogador quanto os inimigos.
    - Estruturas de sacrifício (Altares Sombrios) para acordos de HP vs Bônus.
    - Elementos destrutíveis e voláteis (barris explosivos de sangue/veneno).

2. **[CONCLUÍDO] Inteligência Artificial e Modificadores de Elite (Combat Challenge):**
    - Novos afixos para elites: *Vampirismo* (rouba vida), *Teleporte* (esquiva agressiva), *Reflexão* (escudos que rebatem magias).
    - Telegrafia de ataques em área (zonas de perigo) para incentivar o uso do *dash*.

3. **[CONCLUÍDO] Meta-Progressão e Economia (Replayability):**
    - Sink para Cristais de Sangue no Hub/Menu.
    - Árvore de talentos permanente roguelite (vitalidade, crítico, regeneração).
    - Sinergia e mutação de relíquias (ex: feitiços que mudam de propriedades com certas relíquias).

4. **[CONCLUÍDO] Interface, UX e Polimento Sombrio (Game Feel):**
    - Comparativo visual de equipamentos e itens no chão (setas verde/vermelho).
    - Minimapa procedimental mapeado durante a exploração na HUD.
    - Aprimoramento da clareza de feedback visual de buffs/debuffs.

5. **[CONCLUÍDO] Trilha Sonora Procedural 16-Bit (Web Audio Synthesizer Engine):**
    - Sintetizador FM 100% código (sem arquivos de áudio externos) com temas dinâmicos por bioma e reatividade a HP crítico/modais abertos.

---

## 🎯 DEEP DIVE (Specs de Execução Imediata)

### [CONCLUÍDO] Prioridade 1: Frente 1 - Interações de Ambiente e Armadilhas

**1. Escopo**
- Implementar **Espinhos de Chão (Spike Traps)**, gerados dinamicamente em salas de tipo `chamber` (salas normais).
- Os espinhos devem operar em um ciclo (Timer): Oculto -> Preparando (Telegraph) -> Ativo (Dano) -> Oculto.
- Implementar **Barris Explosivos (Explosive Barrels)**, que podem ser atingidos pelo jogador ou inimigos. Ao destruídos, explodem causando grande dano em área (AoE).
- Adicionar os barris/espinhos na lógica do `DungeonGenerator.ts`.
- Geração visual procedural dos assets (`textureGenerator.ts`) para os barris e espinhos para manter a regra híbrida sem regressão de binários.

**2. Fora do Escopo**
- Altares sombrios (ficam para uma iteracão futura para focar o risco e limitar complexidade).
- Efeitos complexos de deformação de terreno. Apenas sobreposição de Sprites.

**3. Arquitetura e Módulos Impactados**
- `src/game/objects/Traps.ts` (Novo): Criar as classes `SpikeTrap` e `ExplosiveBarrel` estendendo `Phaser.Physics.Arcade.Sprite`.
- `src/game/scenes/GameScene.ts`: Adicionar grupos físicos estáticos ou dinâmicos `trapsGroup` e gerenciar a atualização / colisão com Player e Inimigos.
- `src/game/systems/DungeonGenerator.ts`: Inserir lógica para spawn de `SpikeTrap` no meio de salas com determinada chance, e pequenos clusters de barris.
- `src/game/systems/CollisionHandlers.ts`: Adicionar colisões de magias com barris, e detecção de sobreposição de personagens nos espinhos ativos.
- `src/utils/textureGenerator.ts`: Criar os canvases 2D/pixel art básicos para 'spr_spiketrap', 'spr_barrel', 'spr_barrel_red'.

**4. Contratos**
- Entidades de armadilha terão o método público genérico `trigger()` (para barris) e um ciclo de vida baseado em state machine interna via classe de Phaser Scene Update.

**5. Fluxo (Barris)**
1. Jogador dispara `blood_bolt`.
2. Colisão entre `playerProjectiles` e `trapsGroup` detecta o barril.
3. Barril invoca `explode()`. Instancia uma hitbox temporária circular.
4. Qualquer `Enemy` ou `Player` na área sofre Dano Base e repulsão (knockback).
5. Partículas visuais e remoção do sprite.

**6. Fluxo (Espinhos)**
1. Loop contínuo a cada X segundos: Oculto -> Mostra pontas (`spr_spike_warn`) -> Sai (`spr_spike_active`).
2. Enquanto `spr_spike_active` estiver ativo, evento `overlap` inflige Dano (e Cooldown interno no player/inimigo) ignorando I-Frames de dash levemente (ou respeitando).

**7. Corner Cases (Riscos & Soluções)**
- *Inimigos morrendo nas armadilhas de forma anti-climática:* Inimigos podem evitar espinhos, mas por agilidade, aplicaremos dano total a eles (para incentivar o jogador a usar o cenário a seu favor).
- *Clusters bloqueando caminhos:* O gerador da masmorra deve spawnar armadilhas e barris no centro e bordas das salas, longe das entradas, para não quebrar a navegação (pathfinding).

**8. Critérios de Aceite**
- Ao entrar em algumas salas, espinhos no chão alternam ciclos e causam dano a quem pisar.
- Barris de sangue/explosivos podem ser destruídos com magias e explodem matando/danificando a área.
- Testes limpos e integridade de assets `pnpm verify` válida.



---

## 📈 Histórico de Progresso (Changelog)

- **[2026-08-26] Frente 1 - Interações e Armadilhas:**
  - Status: **CONCLUÍDO**
  - **Implementado:** 
    - Texturas procedurais (`spr_spike_hidden`, `spr_spike_warn`, `spr_spike_active`, `spr_barrel`) adicionadas no `textureGenerator.ts`.
    - Lógica de estados para `SpikeTrap` (ciclo temporal de 3 estados) e `ExplosiveBarrel` (explosão baseada em colisão de projéteis e dano em área) no novo arquivo `Traps.ts`.
    - Integração de `spikeTrapsGroup` e `barrelsGroup` no `CollisionHandlers.ts` e `GameScene.ts` (incluindo camera shake e repasse de dano).
    - Lógica de geração procedural (40% para espinhos e 30% para barris em salas regulares) inserida no `DungeonGenerator.ts`.
  - **Validação:** `npm run build` e bateria de testes (243 testes) passando corretamente, provando integridade da base.


- **[2026-08-26] Frente 2 - Inteligência Artificial e Modificadores de Elite:**
  - Status: **CONCLUÍDO**
  - **Implementado:**
    - Novos afixos de elite integrados ao enum e lógica do monstro: `teleporter` (remodelagem tática com reposicionamento por teleporte/blink, partículas de vácuo sombrio e esquiva reativa a dano) e `reflective` (mitigação de 35% de dano contra projéteis e reflexão de contra-centelha azulada em direção à origem).
    - Telegrafia de ataques atualizada com halos e cores dedicadas no `EnemyTelegraphSystem` e `Enemy.ts` (`0x9333ea` para teleporter e `0x0284c7` para reflective).
    - Distribuição procedural no `DungeonFlowController.ts` a partir do piso 2 com probabilidade escalonada.
    - Método `spawnReflectedSpark` no `GameScene.ts` para disparos de contra-ataque a partir do projétil do inimigo.
  - **Validação:** 245 testes unitários passando, 0 erros no TypeScript (`npm run lint` / `tsc --noEmit`).

- **[2026-08-26] Frente 3 - Meta-Progressão e Economia:**
  - Status: **CONCLUÍDO**
  - **Implementado:**
    - Menu de `Árvore de Talentos` acessível pela `TitleScene` e no componente React `MainMenu`.
    - Lógica de persistência da evolução roguelite gravada em `gameStore.ts`, suportando bônus para vida, dano, vampirismo e recarga de feitiços através de Cristais de Sangue.
    - Inicialização de atributos bônus diretamente na classe `Player.ts`, permitindo que os efeitos passivos entrem em vigor instantaneamente ao começar a run.
  - **Validação:** `npm run build` passando. 100% tipado.

- **[2026-08-26] Frente 4 - Interface, UX e Polimento Sombrio:**
  - Status: **CONCLUÍDO**
  - **Implementado:**
    - **Comparativo Visual no Inventário:** Adicionado card de comparação dinâmica de atributos no `InventoryModal.tsx` ao inspecionar ou clicar em relíquias, exibindo ganhos/perdas com badges e setas verdes/vermelhas, além de filtros por categoria (Todas / Desbloqueadas / Equipadas).
    - **Minimapa Aprimorado:** Adicionado cabeçalho de piso com ícone de bússola, indicador de escala 3x3, destaque visual de perigo para a sala do chefe e orbe pulsante para o jogador em `Minimap.tsx`.
    - **Feedback de Buffs e Maldições:** Adicionada barra de status no `PlayerStatus.tsx` para exibição instantânea de Sangramento, Veneno, Infecção e Fúria Crítica (<25% HP).
  - **Validação:** `npm run lint` e testes unitários 100% aprovados.

- **[2026-08-26] Frente 5 - Trilha Sonora Procedural 16-Bit (Web Audio Synthesizer Engine):**
  - Status: **CONCLUÍDO**
  - **Implementado:**
    - **Sintetizador FM Procedural Completo (`src/utils/bgmSynthesizer.ts`):** Motor Web Audio API puro com relógio de lookahead (`0.12s` window) para sequenciamento em tempo real com zero drift, zero sobrecarga de VRAM e sem arquivos externos pesados.
    - **3 Temas Dinâmicos:**
      - *Catacumbas dos Mártires (Floor 1-2):* Cravo gótico, linha de baixo FM em escala menor harmônica de Lá (A minor), tambor de masmorra e sino de catedral.
      - *Santuário de Sangue (Floor 3-4):* Drone de ritual misterioso, corais harmônicos e sinos rituais.
      - *Fúria do Chefe / Plutonia 1995 (Boss Room):* Riff acelerado estilo Sound Blaster FM / DOOM Plutonia a 130 BPM, caixa de ruído industrial e bumbo duplo.
    - **Reatividade Dinâmica:**
      - *Filtro de Abafamento Suave (Lowpass Muffle Filter):* Transiciona suavemente para 700Hz ao abrir qualquer modal (Inventário, Talentos, Bestiário, Configurações, Observabilidade, Level Up) e restaura para 20.000Hz ao fechar.
      - *Modo Pânico / HP Crítico (<25% HP):* Aceleração de BPM (+12%) e pulso de batimento cardíaco sombrio em tempo real.
    - **Integração:** `soundEngine.ts`, `GameScene.ts` e `App.tsx` sincronizados com volumes e mudo das configurações.
  - **Validação:** Testes dedicados em `src/utils/bgmSynthesizer.test.ts` (8 testes passando) e TypeScript verificado com 0 erros.

- **[2026-08-27] Auditoria de código — status real das 5 Frentes:**
  - Status: confirma Frentes 1, 2, 3 e 5 batendo com o changelog (evidência
    abaixo); **rebaixa a Frente 4 de CONCLUÍDO pra PARCIAL** por um bug real
    achado nesta auditoria. Também corrige o "Mapeamento Geral" (tags de
    status acima), que nunca listava a Frente 5 apesar dela já estar
    documentada como concluída no changelog há uma leva.
  - **Confirmado por leitura de código:**
    - Frente 1: `Traps.ts` (`SpikeTrap`/`ExplosiveBarrel`), geração em
      `DungeonGenerator.ts` — ok (e agora com um ajuste de escopo: não spawna
      mais em `gloomy_woods`, ver spec 13).
    - Frente 2: `spawnReflectedSpark` em `GameScene.ts:1761`, afixos
      `teleporter`/`reflective` em `EliteAffix` (`types/game.ts:131`) — ok.
    - Frente 3: `talentLevels` persistido em `gameStore.ts` (`loadTalentLevels`/
      `saveTalentLevels`) — ok.
    - Frente 5: `bgmSynthesizer.ts` + `bgmSynthesizer.test.ts` existem — ok.
  - **Frente 4 — o que achamos:** `src/components/InventoryModal.tsx` existe
    de verdade e é o modal real, renderizado por `App.tsx` (`isInventoryOpen &&
    <InventoryModal ... />`), com o comparativo de atributos
    (`ArrowUpRight`/`ArrowDownRight` de `lucide-react`) que o changelog
    descreve — até aqui bate. **Mas** `GameplayHUD.tsx` (linha ~464, seção
    comentada `{/* ── INVENTORY MODAL OVERLAY (Gothic Stone Slab Style) ── */}`)
    tem um **segundo** overlay de inventário, gatilhado pelo **mesmo**
    `isInventoryOpen`, com item fixos hardcoded ("Cajado de Osso — LENDÁRIO",
    "Gema de Sangue — SANGUÍNEO", 6 slots vazios "+", 2 pergaminhos estáticos)
    que não lê `equipment`/loot real nenhum — parece ser a versão antiga/mockup
    do inventário, esquecida no lugar depois que `InventoryModal.tsx` foi
    construído por cima. Os dois têm `z-50` e `fixed inset-0` — quando o
    jogador abre o inventário hoje, os dois provavelmente renderizam ao mesmo
    tempo (qual fica por cima depende da ordem no DOM, não verificado
    visualmente nesta auditoria). Isso não foi corrigido nesta entrada — só
    documentado; é candidato natural pra próxima leva (ver sugestões de
    frentes na conversa).
  - **Validação:** achado por leitura de código (`grep`/`Read` direcionados),
    não confirmado visualmente em jogo — sandbox sem `node_modules`/browser
    real. Recomenda-se abrir o inventário em jogo e checar se dá pra ver as
    duas versões sobrepostas antes de decidir como remover a antiga.

- **[2026-08-27] Fix: removido o overlay de inventário duplicado (bug acima):**
  - Status: **RESOLVIDO** — restaura a Frente 4 de PARCIAL pra **CONCLUÍDO**
    no "Mapeamento Geral".
  - **Implementado:**
    - Removido de `GameplayHUD.tsx` o bloco inteiro do segundo overlay
      (`{/* ── INVENTORY MODAL OVERLAY (Gothic Stone Slab Style) ── */}` até
      seu `)}` de fechamento, ~linhas 463-569), que era gatilhado pelo mesmo
      `isInventoryOpen` e nunca lia `equipment`/loot real (item fixos
      hardcoded). Deixado no lugar um comentário explicando a remoção e
      referenciando esta entrada de auditoria.
    - Removido o estado agora morto
      `const [inventoryActiveTab, setInventoryActiveTab] = useState<'items' |
      'scrolls'>('items')`, usado só dentro do bloco removido.
    - Removido `Scroll` do import de `lucide-react` em `GameplayHUD.tsx`
      (usado só dentro do bloco removido); `Backpack` foi mantido — ainda usado
      em outro botão do HUD.
    - `src/components/InventoryModal.tsx` (renderizado por `App.tsx`) agora é
      o único inventário do jogo.
  - **Observação:** correção feita a pedido explícito do usuário, selecionada
    dentre as opções de "novas frentes" sugeridas nesta mesma auditoria.
  - **Validação:** balanceamento de chaves/parênteses/colchetes do arquivo
    checado programaticamente (sandbox sem `node_modules`). Recomenda-se
    abrir o inventário em jogo após o merge e confirmar que só um modal
    renderiza, sem sobreposição visual, e rodar `pnpm test` / `pnpm verify` /
    `tsc --noEmit` localmente.
