# Spec 13: Transição para ARPG Clássico & Safe House (Campanha Zero-to-Hero)

## Objetivo Geral
Transformar a estrutura de sessão do *Blood Mage 1995* de um arcade isolado para um **Action RPG Clássico com Modo Campanha**, integrando a *Safe House* (O Refúgio de Maelen), diálogos com retratos estilo CRPG, transição contínua para áreas externas com clima dinâmico e a progressão *Zero-to-Hero* (início desarmado, combate deliberado corpo a corpo e conquista gradual da magia de sangue).

---

## 🎯 As 3 Frentes da Fase 1

### [CONCLUÍDO] Frente 1: A Safe House (O Refúgio de Maelen)
- **Zona Segura:** Um ambiente pacífico inicial sem spawn de monstros, com iluminação quente de lareira/fogueira, áudio ambiente melancólico de violão e chuva suave no exterior.
- **NPC Interativo:** Presença de Maelen (o ermitão que resgatou o protagonista). Ao aproximar-se e interagir (tecla E ou toque no mobile), abre a janela de diálogo CRPG.
- **Baú Inicial de Suprimentos:** Um baú interativo no chão que contém a primeira arma física (Adaga de Aço) e ataduras.

### [PARCIAL] Frente 2: Sistema de Diálogos & Quests (React HUD Overlay)
- **Interface CRPG:** Caixa de diálogo em React com retrato 9-slice, texto formatado em máquina de escrever, subtítulo do locutor e opções de resposta ramificadas.
- **Gerenciamento de Estado:** Zustand sincronizado com a árvore de diálogos (`src/data/dialogues.json`) e registro de missões ativas (`src/data/campaignQuests.json`).
- **Ações de Diálogo:** Respostas que podem disparar ações no jogo (entregar missão, destravar arma, curar jogador, fechar diálogo).

### [PARCIAL] Frente 3: Economia Tática de Combate & Progressão Zero-to-Hero
- **Desacoplamento de Habilidades Iniciais:** No modo Campanha, o jogador inicia com `unlockedSpells: []`. A barra de habilidades exibe slots bloqueados ou vazios.
- **Ataque Físico Básico:** Ataque corpo a corpo com a Adaga (sem consumo de HP ou Mana). Inimigos iniciais exigem de 4 a 5 acertos, encorajando movimentação e tática.
- **Descoberta do Primeiro Feitiço:** O primeiro tomo arcano (`blood_bolt`) é descoberto em um Altar Ancestral na orla da floresta, introduzindo o projétil leve e o dilema do custo de vida.

---

## 📐 Arquitetura e Módulos Impactados

1. **Tipagens e Contratos (`src/types/campaign.ts`):**
   - Estruturas de dados para `DialogueTree`, `DialogueNode`, `DialogueChoice`, `QuestDefinition`, `QuestObjective`, `CampaignState`, `WorldZoneConfig`.
2. **Dados Estáticos (`src/data/`):**
   - `src/data/dialogues.json`: Árvores de conversa do Refúgio de Maelen.
   - `src/data/campaignQuests.json`: Definição de missões do Capítulo 1.
3. **Estado Global (`src/store/gameStore.ts`):**
   - Inclusão do estado da campanha: `activeDialogueTree`, `activeDialogueNodeId`, `campaignQuests`, `gameMode: 'campaign' | 'arcade'`.
   - Métodos: `startDialogue(treeId)`, `selectDialogueChoice(choiceId)`, `advanceQuestObjective(questId, objectiveId, amount)`.
4. **Interface React (`src/components/`):**
   - `src/components/hud/DialogueModal.tsx`: Interface overlay do diálogo CRPG (retrato, texto e escolhas).
   - `src/components/hud/QuestTracker.tsx`: Rastreador sutil de objetivos no canto superior direito.
5. **Engine Phaser (`src/game/`):**
   - `src/game/scenes/GameScene.ts` e `WorldManager.ts`: Suporte para carregar a zona `safe_house` com NPC Maelen e tocha/lareira.
   - `src/game/systems/PlayerSkillSystem.ts`: Suporte a 0 magias equipadas e ataque físico com adaga.

---

## 🧪 Critérios de Aceite (Testes & Validação)
1. [x] Ao iniciar o jogo no Modo Campanha, o jogador acorda no Refúgio sem magias equipadas na barra. — `campaignState.unlockedSpellIds` agora começa vazio e `isCampaignSpellUnlocked(spellId)` retorna `false` pra tudo em modo Campanha (retorna `true` sempre em modo Arcade, pra não quebrar o jogo existente); a barra (`SkillsOverlay.tsx`) mostra os slots trancados com cadeado em vez de esconder/mostrar a magia liberada.
2. [x] O NPC Maelen está presente no cenário com indicador de interação ("Pressione E para conversar").
3. [x] Abrir a conversa exibe a interface com o retrato de Maelen e a fala *"Ah... você finalmente acordou"*, permitindo navegar pelas ramificações. — retrato é textual (nome/título + ícone), não uma imagem; ver observação.
4. [x] Concluir o diálogo concede a primeira missão no Rastreador de Quests do HUD, e agora os 3 objetivos (baú, batedores, altar) progridem de verdade até a quest fechar como `completed`.
5. [x] Coletar a adaga no baú equipa a arma e permite desferir ataques físicos nos batedores da floresta. — a "adaga" ainda não é um item equipável de verdade: em modo Campanha, sem `blood_bolt` desbloqueado, o auto-ataque do jogador vira corpo a corpo automaticamente (mesmo padrão de auto-mira já usado pro Blood Bolt), sem custo de HP/Mana. Ver observação de escopo no changelog.
6. [ ] A bateria de testes automatizados (`pnpm test`) deve passar com 100% de sucesso sem quebrar o modo Arcade existente. — não executado neste ambiente (sandbox sem `node_modules`/rede para instalar dependências); testes novos foram escritos (Frente 2 e Frente 3) mas nunca rodados de verdade. Falta você rodar `pnpm test` + `pnpm verify` localmente.

---

## 📈 Histórico de Progresso (Changelog)

- **[2026-08-27] Frente 1 — A Safe House:**
  - Status: **CONCLUÍDO**
  - **Implementado:** zona `safe_house` no `WorldManager` (iluminação quente, sem
    monstros, sem drone ambiente), Maelen + lareira/cama posicionados no
    `DungeonFlowController`, texturas próprias geradas em `textureGenerator.ts`
    (`spr_npc_maelen`, `spr_hearth_fireplace`, `spr_straw_bed`, retrato
    `portrait_maelen`), portal de saída pro próximo trecho da campanha.
  - **Observação:** a "chuva suave no exterior" do objetivo geral ainda não tem um
    `WeatherType` dedicado — `gloomy_woods` (zona externa) reaproveita
    `particleWeather: 'ash_embers'` no `WorldManager`, não uma chuva de verdade.

- **[2026-08-27] Frente 2 — Sistema de Diálogos & Quests:**
  - Status: **PARCIAL**
  - **Implementado:**
    - `src/components/hud/DialogueModal.tsx` (novo): interface CRPG com nome/título do
      falante, texto com efeito de máquina de escrever e escolhas ramificadas, lendo
      `campaignState.activeDialogueTree`/`activeDialogueNodeId` da store.
    - `src/components/hud/QuestTracker.tsx` (novo): rastreador no canto superior
      direito, mostra quests com status `active` e seus objetivos.
    - `E` (ou o botão "FALAR COM NPC" no mobile) perto do Maelen agora chama
      `startDialogue('safe_house_maelen_intro')` em vez do modal de loja genérico
      (`GameplayHUD.tsx`, `GameScene.ts`) — a árvore de `dialogues.json` roda de
      ponta a ponta, incluindo a ação `give_quest` que ativa
      `quest_ch1_first_steps` no rastreador.
  - **Observações / gaps conhecidos (decisão consciente de escopo, não bug):**
    - **Sem retrato em imagem no modal.** Os retratos gerados em
      `textureGenerator.ts` vivem só no canvas do Phaser; trazer isso pro React
      pediria uma ponte nova (ref da cena) fora do escopo desta leva. O header usa
      nome/título + ícone, no mesmo padrão 100% textual que o modal de NPC de loja
      já usava.
    - ~~`advanceQuestObjective` só marca a quest como `active`, não incrementa
      `currentCount` dos objetivos~~ — **resolvido em 27/08** (ver changelog
      abaixo): os 3 gatilhos existem e o progresso real funciona.
    - Ações de diálogo além de `give_quest` (`give_weapon`, `give_spell`,
      `heal_player`, `open_shop`) existem só no tipo `DialogueChoice['action']`, sem
      handler na store — não bloqueia a conversa do Maelen (só usa `give_quest`),
      mas qualquer diálogo futuro que dependa delas ainda não faz nada.
    - ~~`campaignState` não é persistido no `localStorage` — recarregar a página no
      meio da campanha perde o diálogo/quest em andamento.~~ — **resolvido em
      27/08** (ver changelog abaixo): zona, quests, zonas descobertas e magias
      desbloqueadas agora sobrevivem a um reload; só o diálogo aberto na tela se
      perde, de propósito.
  - **Validação:** verificado por leitura de código + balance-check de
    chaves/parênteses (sandbox sem `node_modules`). **Falta rodar `pnpm test` +
    `pnpm verify` localmente e validar em jogo** (conversar com o Maelen do início ao
    fim, conferir que a quest aparece no rastreador).

- **[2026-08-27] Frente 2 — Os 3 gatilhos de `quest_ch1_first_steps`:**
  - Status: fecha a Frente 2 de progresso de quest (ainda **PARCIAL** no geral —
    retrato/persistência/outras ações de diálogo continuam de fora, ver acima)
  - **Implementado:**
    - `gameStore.ts`: `advanceQuestObjective` agora incrementa
      `objectivesProgress` de verdade, fecha a quest como `completed` quando
      todos os objetivos batem o alvo, e concede a recompensa de Cristais de
      Sangue uma única vez (guardado por `justCompletedQuestId`, fora do
      updater do `set()` pra não reentrar `addBloodCrystals` no meio da própria
      atualização). `advanceQuestObjectiveByTarget(type, targetId, amount)`
      (novo) é o ponto único que os gatilhos de gameplay chamam — cada um só
      sabe "que tipo de coisa aconteceu", não precisa saber `questId`/`objectiveId`.
    - **`obj_loot_chest`:** `DungeonFlowController.ts` cria um baú com
      `setData('questChest', 'starter_dagger')` na Safe House;
      `CollisionHandlers.ts` reconhece esse baú e entrega a Adaga de Aço fixa
      (item estático, não `LootSystem.generateLoot`) em vez de loot aleatório.
    - **`obj_clear_woods`:** novo monstro `scout_beast` em `monsters.json`
      (reaproveita `spr_hound`, mais fraco que o Cão Infernal completo — hp 40,
      dano 8). `DungeonFlowController.ts` ganhou um branch dedicado pra
      `biome === 'gloomy_woods'`: nada de chefe/elite, só 4 `scout_beast`
      distribuídos pelas salas não-spawn. `onEnemyKilled` na store chama
      `advanceQuestObjectiveByTarget('kill_enemy', monsterId, 1)` como efeito
      colateral — funciona pra qualquer quest futura com objetivo `kill_enemy`,
      não só essa.
    - **`obj_find_altar`:** nova textura `spr_altar_crimson` (curvas + degradê,
      já com normal map) em `textureGenerator.ts`, posicionada na sala
      `secret_treasure` de `gloomy_woods`. `GameScene.ts` ganhou
      `campaignDiscoverables` (lista de marcos) checada por proximidade em
      `update()` — a 70px do altar, dispara `discover_zone` uma única vez
      (`setData('discovered', true)` evita repetir).
  - **Observação de escopo:** a recompensa de XP e o `spellUnlockId` da quest
    não são concedidos ainda (ver nota no código de `advanceQuestObjective`) —
    só Cristais de Sangue. Também não reduzi/pulei os `SpikeTrap`/`ExplosiveBarrel`
    que o `DungeonGenerator` normal ainda gera em `gloomy_woods` (não é uma
    masmorra dedicada, reaproveita o grid 3x3 padrão) — pode valer revisar se
    isso é duro demais pra uma introdução desarmada, quando a Frente 3 entrar.
  - **Validação:** 4 testes novos em `gameStore.test.ts` (`describe('campaign
    quests...')`) cobrindo ativação, progresso por tipo+alvo, conclusão da
    quest com recompensa única e o efeito colateral de `onEnemyKilled`.
    Verificado por leitura de código + balance-check de chaves/parênteses
    (sandbox sem `node_modules`). **Falta rodar `pnpm test` + `pnpm verify`
    localmente e validar em jogo** (Safe House → abrir baú → floresta → matar 4
    batedores → achar o altar → conferir quest `completed` no rastreador).

- **[2026-08-27] Frente 3 — Economia Tática de Combate & Progressão Zero-to-Hero:**
  - Status: **PARCIAL**
  - **Implementado:**
    - **Sistema de desbloqueio de magias:** `CampaignState.unlockedSpellIds: string[]`
      (novo campo, começa `[]`) substitui o antigo `playerStats.unlockedSpells`, que
      era dado morto (definido em `Player.ts`/`gameStore.ts` mas nunca lido em lugar
      nenhum — a barra de skills sempre leu de `skillPreset`, sem gating). Duas ações
      novas na store: `unlockCampaignSpell(spellId)` (idempotente, ignora id repetido)
      e `isCampaignSpellUnlocked(spellId)` — retorna `true` sempre fora do modo
      Campanha (não regride o Arcade), e checa `unlockedSpellIds` dentro dele.
    - **Ataque corpo a corpo com a adaga:** `Player.ts` ganhou
      `castDaggerStrike(time, target)` e um branch novo em `updatePlayer()`: quando
      `blood_bolt` não está desbloqueado em modo Campanha, o auto-ataque vira corpo a
      corpo (alcance `MELEE_RANGE = 50`, cooldown `500ms`, sem custo de HP/Mana) em
      vez de invocar o Blood Bolt à distância — reaproveita o mesmo laço de busca de
      alvo (`findBestTarget`) já usado pro ataque à distância, só com alcance menor.
      A aplicação de dano de verdade roda em `CollisionHandlers.handleMeleeHitEnemy`
      (espelha `handleProjectileHitEnemy`: partículas de sangue, crítico 15% a 1.75x,
      lifesteal de vampirismo, efeitos de relíquia on-hit, morte via
      `scene.handleEnemyDeath(..., 'dagger_strike', ...)`), sinalizada de
      `Player`→`GameScene` pelo mesmo padrão de "campo pendente lido no `update()`"
      já usado pro delta de mana do Blood Bolt (`pendingMeleeHitTarget`), porque
      `Player` só decide elegibilidade — quem aplica o efeito no mundo é
      `GameScene`/`CollisionHandlers`.
    - **Descoberta do Blood Bolt no altar:** `GameScene.ts` ganhou um mapa
      `SPELL_UNLOCK_BY_DISCOVERABLE` (`{ altar_crimson: 'blood_bolt' }`) checado no
      mesmo bloco de proximidade que já disparava `discover_zone` pro `altar_crimson`
      (Frente 2) — ao chegar perto do altar, além de avançar a quest, chama
      `unlockCampaignSpell('blood_bolt')` e mostra "BLOOD BOLT DESBLOQUEADO!" com texto
      flutuante. A partir daí o auto-ataque do jogador volta a ser à distância
      automaticamente (o branch em `Player.updatePlayer()` reavalia
      `isCampaignSpellUnlocked('blood_bolt')` a cada frame).
    - **Barra de habilidades trancada:** `SkillsOverlay.tsx` — `checkCanCast(spellId)`
      agora nega o cast se `isCampaignSpellUnlocked(spellId)` for `false`; `renderSkill`
      ganhou um branch de retorno antecipado pra magias trancadas: ícone de cadeado
      (`lucide-react`'s `Lock`), estilo dessaturado/opaco, `cursor-not-allowed`, e
      feedback tátil (`CombatFeel.triggerVibration('cooldown_warning')`) ao tocar num
      slot trancado em vez de tentar castar.
    - **Skills manuais bloqueadas:** `PlayerSkillSystem.triggerSkill(skillKey)` ganhou
      um mapa `SKILL_KEY_TO_SPELL_ID` e um guard no topo — se a magia do slot não
      estiver em `unlockedSpellIds`, mostra "FEITIÇO NÃO DESCOBERTO" flutuante e
      cancela o cast, cobrindo hotkeys/gamepad/drag-aim (o mesmo caminho que
      `SkillsOverlay` já cobre pro toque no botão).
  - **Observação de escopo:** a "Adaga de Aço" que sai do baú (Frente 2) continua
    sendo um `LootItem` de inventário comum — ela **não** é o gatilho que ativa o
    corpo a corpo; o corpo a corpo liga sozinho sempre que `blood_bolt` está
    trancado em modo Campanha, tenha o jogador pego a adaga do baú ou não. Isso
    cobre o critério de aceite #5 na prática (dá pra bater nos batedores sem
    magia), mas quem quiser fidelidade 100% ao texto do critério (adaga
    fisicamente equipada como pré-requisito do corpo a corpo) ainda precisaria de
    um sistema de arma equipada, que não existe. Além disso, o desbloqueio via
    `unlockCampaignSpell` só está ligado a `blood_bolt`/altar — os outros 6
    feitiços que existiam na lista antiga e morta de `unlockedSpells`
    (`hellfire_nova`, `syphon_soul`, `bone_shield`, `crimson_scythe`,
    `blood_ritual_circle`, `hemomancy_beam`) continuam sem nenhum gatilho de
    desbloqueio definido — ficam permanentemente trancados em modo Campanha até
    quests futuras definirem como/quando liberá-los. Por isso a Frente 3 está
    marcada **PARCIAL**, não **CONCLUÍDO**.
  - **Validação:** 4 testes novos em `gameStore.test.ts` (`describe('campaign
    spell unlocks — Frente 3 Zero-to-Hero...')`) cobrindo: magia sempre
    liberada em modo Arcade, tudo trancado ao entrar em modo Campanha,
    `unlockCampaignSpell` liberando só o id certo, e idempotência (chamar duas
    vezes não duplica o id). Verificado por leitura de código + balance-check de
    chaves/parênteses em todos os arquivos tocados (sandbox sem `node_modules`).
    **Falta rodar `pnpm test` + `pnpm verify` localmente e validar em jogo**:
    entrar em modo Campanha, conferir barra de skills com cadeados, bater em um
    `scout_beast` corpo a corpo sem gastar mana, achar o altar e conferir que o
    Blood Bolt desbloqueia e o auto-ataque volta a ser à distância.

- **[2026-08-27] Persistência do `campaignState`:**
  - Status: fecha o gap de persistência apontado na Frente 2 (item já riscado
    acima); não é uma "Frente" nova da spec, é infraestrutura da qual várias
    dessas frentes dependiam.
  - **Implementado:**
    - `src/utils/localStorage.ts` ganhou o par `loadCampaignState()` /
      `saveCampaignState()` seguindo exatamente o mesmo padrão já usado pra
      cristais/talentos/codex/etc. neste arquivo: uma chave própria
      (`bloodmage_1995_campaign_state`), um schema Zod `.strict()` com
      `.catch()` por campo (sanitiza valor inválido sem jogar fora o resto do
      save), e uma exportação `defaultCampaignState`/`PersistedCampaignState`
      pros valores padrão. O formato salvo é um subconjunto de `CampaignState`
      mais o `gameMode` (que vive um nível acima na store, fora de
      `CampaignState`): `currentZone`, `chapter`, `storyFlags`, `quests`,
      `discoveredZones`, `unlockedSpellIds`. **De propósito** ficam de fora
      `activeDialogueTree`/`activeDialogueNodeId` — são estado de sessão (a
      janela de diálogo aberta na tela), não progresso; recarregar a página no
      meio de uma conversa agora preserva a quest e o resto do progresso, só
      fecha o modal de diálogo em vez de tentar retomá-lo do zero.
    - `gameStore.ts`: `campaignState` e `gameMode` agora inicializam a partir de
      `loadCampaignState()` (chamado uma vez no carregamento do módulo) em vez
      de valores fixos. Uma função `persistCampaignSnapshot(gameMode,
      campaignState)` no nível do módulo monta o snapshot e chama
      `saveCampaignState` — chamada depois de qualquer mutação que representa
      progresso real: `setGameMode`, `setCampaignZone`, `advanceQuestObjective`
      (cobre também `advanceQuestObjectiveByTarget`, que delega pra ela) e
      `unlockCampaignSpell`. `startDialogue`/`selectDialogueChoice`/
      `closeDialogue` **não** persistem por si só — só o `give_quest` dentro de
      `selectDialogueChoice` persiste, indiretamente, por chamar
      `advanceQuestObjective`.
  - **Observação de escopo:** o fluxo "Continuar" do menu principal
    (`TitleScene.ts` → `onContinueGame` → `App.tsx:handleContinueGame`) não foi
    alterado — ele já resume `gameState: 'playing'` sem mexer em `gameMode`, e
    agora que `gameMode` também é restaurado do `localStorage` no boot da
    store, "Continuar" depois de um reload volta pro modo certo (Campanha ou
    Arcade) automaticamente. Já "Nova Campanha" (`handleStartCampaign`)
    continua forçando `setCampaignZone('safe_house')` de propósito — é o
    caminho de começar do zero, não de retomar; não criei ainda um jeito de
    "resetar" o progresso salvo (ex.: um botão "Nova Campanha" que apague o
    `localStorage` antigo em vez de só sobrescrever a partir da Safe House) —
    se isso for necessário, é leva futura.
  - **Validação:** 5 testes novos em `localStorage.test.ts`
    (`describe('Campaign State...')`: default vazio, round-trip completo,
    JSON corrompido, sanitização de `gameMode`/zona inválidos, e schema
    `strict()` rejeitando chave desconhecida) e 5 testes novos em
    `gameStore.test.ts` (`describe('campaign state persistence...')`:
    `setGameMode`/`setCampaignZone`/`advanceQuestObjective`/
    `unlockCampaignSpell` cada um gravando no `localStorage`, e um teste de
    "reload simulado" lendo de volta a mesma chave depois de uma sequência
    completa de ações, confirmando que diálogo/nó ativo nunca aparecem no
    snapshot salvo). Verificado por leitura de código + balance-check de
    chaves/parênteses (sandbox sem `node_modules`; a única "quebra" que o
    balance-check acusou foi a string proposital de JSON corrompido
    `'{not valid json'` num teste, não um erro de sintaxe real). **Falta rodar
    `pnpm test` + `pnpm verify` localmente e validar em jogo**: abrir o baú,
    matar um `scout_beast`, dar F5 na página, conferir que a quest continua com
    o progresso salvo e que o modo Campanha é restaurado.
