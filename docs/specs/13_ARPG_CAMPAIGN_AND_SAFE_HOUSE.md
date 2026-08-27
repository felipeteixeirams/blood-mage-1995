# Spec 13: Transição para ARPG Clássico & Safe House (Campanha Zero-to-Hero)

## Objetivo Geral
Transformar a estrutura de sessão do *Blood Mage 1995* de um arcade isolado para um **Action RPG Clássico com Modo Campanha**, integrando a *Safe House* (O Refúgio de Maelen), diálogos com retratos estilo CRPG, transição contínua para áreas externas com clima dinâmico e a progressão *Zero-to-Hero* (início desarmado, combate deliberado corpo a corpo e conquista gradual da magia de sangue).

---

## 🎯 As 3 Frentes da Fase 1

### Frente 1: A Safe House (O Refúgio de Maelen)
- **Zona Segura:** Um ambiente pacífico inicial sem spawn de monstros, com iluminação quente de lareira/fogueira, áudio ambiente melancólico de violão e chuva suave no exterior.
- **NPC Interativo:** Presença de Maelen (o ermitão que resgatou o protagonista). Ao aproximar-se e interagir (tecla E ou toque no mobile), abre a janela de diálogo CRPG.
- **Baú Inicial de Suprimentos:** Um baú interativo no chão que contém a primeira arma física (Adaga de Aço) e ataduras.

### Frente 2: Sistema de Diálogos & Quests (React HUD Overlay)
- **Interface CRPG:** Caixa de diálogo em React com retrato 9-slice, texto formatado em máquina de escrever, subtítulo do locutor e opções de resposta ramificadas.
- **Gerenciamento de Estado:** Zustand sincronizado com a árvore de diálogos (`src/data/dialogues.json`) e registro de missões ativas (`src/data/campaignQuests.json`).
- **Ações de Diálogo:** Respostas que podem disparar ações no jogo (entregar missão, destravar arma, curar jogador, fechar diálogo).

### Frente 3: Economia Tática de Combate & Progressão Zero-to-Hero
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
1. Ao iniciar o jogo no Modo Campanha, o jogador acorda no Refúgio sem magias equipadas na barra.
2. O NPC Maelen está presente no cenário com indicador de interação ("Pressione E para conversar").
3. Abrir a conversa exibe a interface com o retrato de Maelen e a fala *"Ah... você finalmente acordou"*, permitindo navegar pelas ramificações.
4. Concluir o diálogo concede a primeira missão no Rastreador de Quests do HUD.
5. Coletar a adaga no baú equipa a arma e permite desferir ataques físicos nos batedores da floresta.
6. A bateria de testes automatizados (`pnpm test`) deve passar com 100% de sucesso sem quebrar o modo Arcade existente.
