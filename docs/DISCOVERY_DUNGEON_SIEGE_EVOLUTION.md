# Documento de Discovery: Evolução de Dinâmica de Jogo (Dungeon Siege 1, Diablo 2 & Dead Frontier 2)
## Bloodmage 1995 — Direcionamento de Produto e Arquitetura de Design

---

## 1. Visão Geral e Objetivos do Produto

O objetivo desta evolução é transformar a dinâmica de partida isolada (Wave Shooter / Roguelike de Sobrevivência) do *Bloodmage 1995* em uma **jornada contínua, imersiva e de alta tensão**, fortemente inspirada nos clássicos ARPGs do final dos anos 90 e início dos anos 2000.

A nova dinâmica substitui a morte abrupta e o encerramento da partida por um sistema de **punição tática, sobrevivência orgânica e exploração nômade**. O jogador passará a transitar por um mundo interconectado onde a morte tem peso real, a preparação é essencial e o ambiente exala mistério e perigo.

### Pilares de Referência
*   **Dungeon Siege 1:** Mecânica de inconsciência (desmaio em vez de morte direta), dispersão/neutralização de ameaças pelos monstros, regeneração passiva para acordar, e progressão de mapa contínua sem telas de carregamento abruptas (viagem nômade).
*   **Diablo 2:** Perda de itens do inventário no local da morte, necessidade de recuperar o "corpo" para reaver os pertences, penalidade de Experiência (XP) sem regressão de nível, e elementos interativos do cenário (revistar corpos e recipientes).
*   **Dead Frontier 2:** Postos avançados seguros (Safe Zones) para preparação e comércio, gerenciamento tenso de recursos e status persistentes de sobrevivência (Envenenamento, Sangramento e Infecção) que geram urgência tática sem frustração imediata.

---

## 2. Detalhamento de Mecânicas de Jogabilidade

### 2.1. O Estado de Inconsciência (Desmaio)
Ao esgotar os pontos de vida (HP <= 0), o personagem não morre imediatamente. Em vez disso, ele entra em um estado de **Inconsciência**.

```
[Jogador com HP > 0]
       │
       ▼ (HP atinge 0)
[Inconsciente / Caído] ──► Monstros perdem o aggro e se afastam
       │               ──► Jogador ganha imunidade total a danos/projéteis
       │
       ├─► (HP regenera até 5% do HP Máximo) ──► [Jogador Levanta com HP Baixo]
       │
       └─► (Se nocauteado pela 3ª vez) ──► [Morte Definitiva]
```

*   **Comportamento de Nocaute:** O herói cai ao chão como se estivesse desmaiado. Durante esse tempo, ele fica **completamente invulnerável** a projéteis, explosões de área ou qualquer dano do cenário.
*   **Perda de Agressividade (Aggro Dump):** Os monstros consideram a ameaça neutralizada. Eles interrompem todos os ataques imediatamente e retornam ao seu comportamento natural (patrulha ou movimentação aleatória para longe do local onde o jogador caiu).
*   **Mecânica de Recuperação Dinâmica:** Não há um timer estático para levantar. A ressurreição depende do **sistema de regeneração passiva de HP** do jogo. Enquanto estiver inconsciente, a vida se restabelece lentamente. O personagem só se levanta ao alcançar **5% do seu HP Máximo**.
*   **O Risco do Retorno:** Ao levantar com apenas 5% de HP, o jogador está em extrema vulnerabilidade. Ele deve decidir instantaneamente se irá fugir, usar uma poção de vida ou conjurar feitiços de proteção rápida (como o Escudo de Ossos) antes que os monstros vizinhos detectem sua presença novamente.
*   **Limite de Desmaios:** O jogador pode desmaiar **até duas vezes** por corrida/sessão. Ao sofrer o terceiro nocaute (HP zerado pela terceira vez), ele atinge a **Morte Definitiva**. O contador de desmaios é redefinido ao descansar em uma área segura (Vila) ou através do uso de consumíveis específicos purificadores.

#### Níveis de Agressividade de Monstros e Animais
Para dar suporte a essa dinâmica, a Inteligência Artificial (FSM) dos inimigos e criaturas do cenário será expandida para suportar quatro perfis de comportamento:
1.  **Altamente Agressivos (ex: Cães Infernais, Demônios):** Possuem um raio de visão e audição expandido. Iniciam a perseguição e o ataque de grandes distâncias assim que detectam o jogador.
2.  **Territoriais (ex: Cultistas, Mortos-Vivos):** Permanecem neutros ou em patrulha até que o jogador invada um perímetro próximo (seu território). Só atacam sob proximidade física direta.
3.  **Defensivos / Passivo-Agressivos (ex: Animais Selvagens, Criaturas Neutras):** Ignoram a presença do jogador. No entanto, se o jogador iniciar um ataque contra eles, eles entram em estado de combate e revidam para se defender.
4.  **Totalmente Passivos (ex: Criaturas da Floresta, Ratos, Cervos):** Nunca atacam, mesmo se forem atacados. Diante do perigo ou de ataques do jogador, eles simplesmente fogem em alta velocidade. Podem ser caçados para obtenção de pequenos recursos (pele, carne ou reagentes).

---

### 2.2. A Morte Definitiva e o Sistema de Drops
Caso o jogador atinja o limite de desmaios e sofra a Morte Definitiva, o fluxo de jogo muda para o gerenciamento de perdas.

#### O Menu "Você está morto" (Estilo Anos 90)
*   **Visual Grimdark Tradicional:** A tela do jogo escurece severamente com um efeito de vinheta profunda (extremidades totalmente pretas, centro levemente visível). No centro, surge um letreiro proeminente escrito **"Você está morto"** usando a fonte clássica de horror gótico escorrendo sangue (`Cinzel` ou `UnifrakturMaguntia`).
*   **Estatísticas da Vida Anterior:** O menu exibe um resumo estatístico daquela "vida" para gerar reflexão:
    *   *Tempo Sobrevivido*
    *   *Inimigos Purificados*
    *   *Ouro/Cristais Coletados*
    *   *Profundidade Alcançada*
*   **Persistência Extrema de Morte:** Se o jogador fechar o navegador de forma abrupta para tentar burlar a penalidade, o estado de morte permanece salvo de forma síncrona no backend/armazenamento local. Ao reabrir o jogo, ele retornará exatamente na tela de morte com o menu ativo.

#### Opções do Menu de Morte
1.  **Renascer no Ponto Seguro Mais Próximo:**
    *   O jogador resgasta na última Cidade ou Vila segura visitada.
    *   **Penalidade de XP:** O progresso acumulado para o próximo nível é parcialmente perdido. **Regra Absoluta:** O jogador nunca regride de nível. Se ele acabou de atingir o nível 5, a barra de XP poderá ser zerada para 0% do nível 5, mas ele nunca retornará ao nível 4.
    *   **Inventário Dropado (O "Corpo"):** Todos os itens guardados no inventário (reagentes, poções, equipamentos extras) caem no chão no exato local da morte, formando um receptáculo físico ("Túmulo" ou "Corpo").
    *   **Equipamento Preservado:** Itens que estavam **efetivamente equipados** nos slots ativos (Arma principal, Armadura corporal e as Relíquias equipadas) **não são dropados**. Eles permanecem com o personagem para garantir que ele tenha condições mínimas de combater no caminho de volta.
    *   **Itens de Quest Protegidos:** Itens chave de missões e documentos históricos são marcados como não-dropáveis e nunca caem do inventário.
    *   **Moedas/Cristais:** O jogador não perde seu saldo financeiro acumulado.
2.  **Voltar ao Menu Principal:**
    *   Retorna à tela inicial do jogo.
    *   Ao selecionar "Continuar" (Resume) no Menu Principal, o jogo carrega o jogador na mesma tela de morte ativa.
    *   Ao selecionar "Iniciar Nova Partida", um aviso proeminente alerta que o progresso não salvo da sessão atual será perdido permanentemente.

---

### 2.3. O Despawn Progressivo do Corpo (Loot Perdido)
Para evitar gargalos de performance por excesso de objetos persistentes nas salas do Phaser e instigar o senso de urgência, os pertences deixados no local da morte não duram para sempre.

*   **O "Roubo" dos Pertences:** Narrativamente, o desaparecimento dos itens é justificado pela ação de carniceiros e ladrões de túmulos do subsolo.
*   **Tempo Limite Oculto:** O corpo e os pertences permanecem no chão por um tempo limite equivalente a algumas horas de jogo (ou um ciclo dia/noite do jogo). Esse tempo é **totalmente implícito e oculto** para o jogador.
*   **Mensagem Atmosférica:** Ao renascer, o jogador recebe um aviso imersivo na caixa de diálogos/HUD:
    > *"Você sente que a terra consome seus restos mortais... e que olhos carniceiros já espreitam seus pertences perdidos nas sombras. Apresse-se, Bloodmage."*
*   **Cessação do Despawn por Visão Direta:** Se o jogador conseguir retornar ao local do óbito e o receptáculo de itens entrar no seu campo de visão direta (FOV ativo na tela do Phaser), o temporizador de desaparecimento é **congelado permanentemente**. O Loot estará seguro para ser coletado.

---

### 2.4. Condições de Status de Sobrevivência (Estilo Dead Frontier 2)
Para adicionar uma camada rica de tática e imersão de sobrevivência, são introduzidos três efeitos de status negativos aplicados por ataques de monstros específicos, armadilhas ou consumo de itens contaminados.

```
┌─────────────────┬───────────────────────────────────┬───────────────────────────────────┐
│ Efeito de Status│ Impacto no Personagem             │ Cura / Solução                    │
├─────────────────┼───────────────────────────────────┼───────────────────────────────────┤
│ Sangramento     │ Drena HP lentamente a cada passo  │ Bandagens ou feitiços de cura     │
│ (Bleeding)      │ dado. Permanecer parado cessa.    │ aplicados enquanto imóvel.        │
├─────────────────┼───────────────────────────────────┼───────────────────────────────────┤
│ Envenenamento   │ Consome HP de forma contínua a    │ Antídotos alquímicos ou Magia de  │
│ (Poison)        │ cada segundo.                     │ Purificação Rúnica.               │
├─────────────────┼───────────────────────────────────┼───────────────────────────────────┤
│ Infecção        │ Reduz o HP máximo temporariamente │ Antibióticos raros ou visitas a   │
│ (Infection)     │ e bloqueia regeneração natural.   │ Clérigos/Médicos nas Vilas.       │
└─────────────────┴───────────────────────────────────┴───────────────────────────────────┘
```

*   **Tuning de Consumo Não-Brutal:** Nenhum desses efeitos deve matar o jogador de forma instantânea ou injusta ao andar poucos metros. O consumo é lento e gradual, projetado especificamente para atuar como um **fator de tensão psicológica**. O jogador, sabendo que está envenenado ou sangrando, pensará duas vezes antes de entrar em uma nova sala infestada e buscará tratar sua condição com prioridade.

---

## 3. Estrutura do Mundo: Vilas, Safe Zones e Progressão Contínua

Substituindo o loop repetitivo de andares isolados de masmorra por um progresso nomadismo linear contínuo, a estrutura do jogo se apoia em cenários unificados e hubs de segurança.

```
[Vila Segura] ──► (Caminho Contínuo) ──► [Estepes Infestadas] ──► (Mini-Chefe Bloqueando Ponte)
                                                                             │
                                                                             ▼ (Derrotar Chefe)
[Vila de Fronteira] ◄── (Avançar Entrada) ◄── [Catacumbas Sombrias] ◄───────┘
```

### 3.1. Vilas e Safe Zones (Zonas de Preparação)
*   **Integração Orgânica:** Vilas não são menus abstratos, mas locais físicos dentro do mapa do jogo, cercados por paliçadas, guardas ativos que eliminam inimigos que se aproximam e arquitetura gótica.
*   **Interações com NPCs:**
    *   **Clérigo / Curandeiro:** Remove efeitos de infecção, regenera vida e mana gratuitamente ou em troca de pequenas oferendas de Cristais de Sangue.
    *   **Mercador Alquimista:** Vende Poções de HP, Mana, Antídotos, Bandagens e Antibióticos. Compra itens inúteis coletados pelo jogador.
    *   **Ferreiro Necromântico:** Permite comparar, comprar ou aprimorar equipamentos (Armas, Armaduras).
    *   **NPC Giver de Missões (Ex: Ancião da Vila):** Introduz o contexto histórico local, entrega a quest principal do bioma e oferece micro-contratos de eliminação ou scavenging.

### 3.2. A Viagem Nômade e Bloqueios de Progresso
*   **Cenário de Conexão Seamless:** A transição entre florestas escuras, masmorras e ruínas ocorre de forma física. Portões de ferro, pontes destruídas ou desfiladeiros atuam como divisores naturais de áreas.
*   **Mini-Chefes como Guardiões de Passagem:** Para progredir de um cenário ao outro (ex: sair das Estepes para entrar nas Catacumbas), o jogador encontra um Mini-Chefe fisicamente posicionado no Gargalo da rota. O progresso só é liberado (ex: o portão se abre ou a chave da ponte é dropada) após derrotar o guardião em combate.

### 3.3. Narrativa, História e Lore-Delivery
A motivação do Bloodmage para se aventurar por estas terras hostis é contada de forma fragmentada e instintiva (estilo Souls-like e Diablo 1).
*   **A Origem do Protagonista:** Um mago renegado da ordem carmesim em busca do Sangue Primordial para impedir a corrupção de sua própria alma.
*   **Documentos Perdidos (Environmental Storytelling):** Diários de soldados mortos, pergaminhos em altares profanados e inscrições em paredes revelam detalhes da queda das civilizações locais e fraquezas de chefes específicos.
*   **Diálogos Enigmáticos:** Os NPCs nas Vilas mudam seus diálogos conforme os chefes são derrotados, criando a sensação de que o mundo reage aos avanços do jogador.

---

## 4. Mecânicas de Scavenging (Vasculhar)
Inspirado em *Dead Frontier 2*, além do drop direto de monstros, o jogador adquire recursos revistando o ambiente.

*   **Pilhagem de Recipientes:** Caixas, pilhas de ossos, armários de ferro abandonados e corpos de aventureiros caídos pelo cenário tornam-se interativos.
*   **Indicador Visual Sutil:** Ao se aproximar de um objeto vasculhável, uma tecla de interação surge na HUD (ex: `[E] Revistar`).
*   **Barra de Progresso (Tensão):** Revistar um corpo leva de 1.5 a 3 segundos, exibindo uma barra de progresso. O jogador fica imóvel durante o ato. Se for atacado ou se mover, a ação é cancelada. Isso cria momentos de extrema tensão onde o jogador precisa limpar a área antes de buscar suprimentos.

---

## 5. Design de Interface (UI/UX) — Estilo "Anos 90"

Fiel ao tom *Majestic Kingdom* e clássicos de estratégia/RPG dos anos 90, o design de UI prioriza a integração artística em detrimento de menus genéricos.

### 5.1. Integração Cenográfica de Menus
*   **Elementos Físicos Interativos:** Em vez de botões planos em um painel cinza para acessar as funcionalidades das vilas, os menus de interação podem ser representados por cliques diretos nos elementos do próprio cenário da Vila.
    *   Clicar na *Mesa de Alquimia* abre o menu de poções.
    *   Clicar na *Forja* ativa o inventário de upgrades.
*   **Aparência:** Texturas de pedra desgastada, molduras de ferro escuro batido, detalhes em ouro envelhecido e pergaminhos rasgados.

### 5.2. O Menu de Morte de Alto Impacto
*   A vinheta escura progressiva causa a sensação de estreitamento de visão (túnel).
*   Texto principal em alta definição com tipografia gótica clássica, aplicando um efeito shader sutil de sangue gotejando sobre a tela.
*   Botões de opção estilizados como lápides de pedra rúnica que acendem com um brilho vermelho brasa ao passar o ponteiro.

---

## 6. Arquitetura Técnica e Implementação

Para preparar o desenvolvimento seguro destas mecânicas no motor Phaser 3 + React/Zustand, mapeia-se a arquitetura de dados e de fluxo abaixo.

### 6.1. Esquema JSON de Persistência (Save Game Schema)
Abaixo está o modelo proposto de dados unificado para armazenar o estado do jogador de forma robusta e segura, permitindo salvar em base de dados (MongoDB/PostgreSQL) ou serializar em `localStorage` sanitizado com Zod.

```json
{
  "saveVersion": 1,
  "timestamp": 1693000000,
  "character": {
    "name": "Bloodmage",
    "level": 5,
    "xp": 240,
    "hp": 100,
    "maxHp": 120,
    "mana": 80,
    "maxMana": 100,
    "crystals": 1500,
    "knockoutCount": 1,
    "isDefinitivelyDead": false,
    "statusConditions": {
      "bleeding": true,
      "poison": false,
      "infection": false
    }
  },
  "equipment": {
    "weapon": { "id": "scythe_carmine_01", "rarity": "rare", "name": "Foice de Ferro Carmesim" },
    "armor": { "id": "robe_acolyte_02", "rarity": "epic", "name": "Manto de Acólito Corrompido" },
    "relics": [
      { "id": "relic_eye_bat", "rarity": "common", "name": "Olho Petrificado de Morcego" }
    ]
  },
  "inventory": {
    "items": [
      { "id": "potion_hp_minor", "quantity": 3 },
      { "id": "bandage_linen", "quantity": 1 },
      { "id": "reagent_sulfur", "quantity": 12 }
    ],
    "questItems": [
      { "id": "key_catacomb_gate", "name": "Chave das Catacumbas dos Mártires" }
    ]
  },
  "worldState": {
    "currentZone": "catacumbas_martires",
    "playerPosition": { "x": 1240, "y": 890 },
    "beatenBosses": ["necro_lord_boss"],
    "unlockedCheckpoints": ["safe_village_01", "outpost_catacombs"]
  },
  "droppedCorpse": {
    "hasDroppedCorpse": true,
    "zone": "catacumbas_martires",
    "position": { "x": 1820, "y": 1100 },
    "droppedTimestamp": 1692998500,
    "itemsInside": [
      { "id": "potion_mana_minor", "quantity": 2 },
      { "id": "reagent_iron_ore", "quantity": 5 }
    ]
  }
}
```

### 6.2. Estrutura de Estado de IA no Phaser 3 (Finite State Machine)
A máquina de estados dos inimigos (`Enemy.ts`) deve incorporar o estado de desmaio do jogador no loop de update de IA.

```typescript
// No ciclo de update da IA do Inimigo:
updateEnemyAI(player: Player) {
  if (player.isUnconscious) {
    if (this.state === 'combat' || this.state === 'frenzy') {
      this.clearTargetAndAggro();
      this.transitionToState('patrol_away_from_player');
    }
    return;
  }

  // Fluxo normal de detecção se o jogador está vivo...
  let distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
  this.evaluateAgressiveBehavior(distance);
}
```

---

## 7. Próximos Passos e Fases de Implementação Propostas

1.  **Fase 1: Prototipagem da Inconsciência (Phaser 3 Core)**
    *   Ajustar `Player.ts` para capturar `hp <= 0` e transicionar para o estado de desmaio em vez de trigger de Game Over.
    *   Implementar a perda de aggro nos inimigos com movimentação radial reversa (fugir do ponto de queda).
    *   Implementar a regeneração passiva obrigatória de HP durante a inconsciência para ressuscitar o jogador ao atingir 5%.
2.  **Fase 2: Tela de Morte e Sistema de Drops**
    *   Criar o componente React `DeathScreen.tsx` estilizado com o fundo em vinheta gótica e a fonte sangrenta.
    *   Integrar o gerenciamento do inventário no Zustand store (`gameStore.ts`) para gerar o receptáculo de Loot ("Corpo") no chão do Phaser ao atingir o 3º desmaio.
    *   Implementar o salvamento automático síncrona no backend/localStorage contendo o estado de morte ativo.
3.  **Fase 3: Condições de Status e Sobrevivência**
    *   Adicionar os status de Sangramento, Envenenamento e Infecção ao loop de atualização do jogador.
    *   Criar consumíveis (Bandagens, Antídotos) e lógica de uso com pequenas barras de progresso.
4.  **Fase 4: Mundo Contínuo e NPCs**
    *   Unificar as salas procedurais geradas pelo `DungeonGenerator.ts` em rotas contínuas de exploração.
    *   Criar as zonas seguras (Vilas) com NPCs interativos cenográficos.

---

> **Nota final de Discovery:** Esta proposta técnica e de design posiciona o *Bloodmage 1995* em um patamar artístico e tático extremamente diferenciado, resgatando a essência nostálgica e sombria que tornou clássicos de RPG imortais.
