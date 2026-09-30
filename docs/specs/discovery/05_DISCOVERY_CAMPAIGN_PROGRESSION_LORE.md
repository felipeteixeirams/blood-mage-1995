# Discovery: Transição para ARPG Clássico (Campanha, Lore e Atmosfera)

**Status:** Descoberta / Brainstorming Concluído & Consolidado
**Data:** 2026-08-26
**Referências:** Dungeon Siege 1, Diablo 2.

## 1. Visão Geral
Mudar o paradigma do *Blood Mage 1995* de um "Roguelite Arcade de arena/masmorra" para um **Action RPG Clássico focado em Campanha, Imersão e Progressão**. O objetivo é recriar a sensação de solidão, mistério e escalonamento de poder presente no final dos anos 90 e início dos 2000.

---

## 2. Pilares de Insight & Game Design

### A. O Mundo (Mapa Contínuo Estilo Dungeon Siege)
- **Estrutura:** O mundo é construído como um mapa massivo e contínuo, sem telas de carregamento intermediárias abruptas, permitindo fluidez na exploração e transição natural entre a Safe House, campos abertos e catacumbas profundas.

### B. O Ponto de Partida: A Safe House & O Despertar
- **Narrativa Inicial:** O jogador acorda em uma cama dentro da casa de um morador/aliado que o acolheu após os eventos trágicos. A clássica introdução (*"Ah, você finalmente acordou..."*) dá o tom acolhedor, contrastando com o perigo lá fora.
- **Mecânica Zero-to-Hero:** O personagem começa sem magias, apenas com um ataque físico rudimentar. O crescimento é gradual conforme explora o mundo aberto e encontra pergaminhos e itens.

### C. O Lore: A Maldição do "Mago de Sangue" Acidental
- **A Premissa do Protagonista:** Ele não é um mago nascido ou um cultista do mal. Ele era um homem comum de família cuja vila foi brutalmente massacrada por um senhor da guerra que dominava a magia de sangue.
- **A Reviravolta (A Maldição):** Sua esposa e filha pequena desapareceram (não estavam entre os mortos). Após uma batalha épica e desesperada, ele derrotou o tirano sangrento. O que ele ignorava é que **o poder de sangue é transferido compulsoriamente ao novo hospedeiro que derrote o anterior**. 
- **O Conflito Interno:** Ele detesta o poder arcano que carrega pela forma terrível como o obteve, mas é forçado a usá-lo como ferramenta em sua cruzada obsessiva para encontrar sua família. Por não ser um mago de origem, ele mantém a versatilidade de aprender e dominar outras habilidades e armas comuns.

### D. Atmosfera e Escopo Épico (Cenários Abertos e Dinâmicos)
- **Cenários:** Transição gradual entre vilarejos pacatos, florestas densas sob chuva persistente, pântanos neblinosos e as entranhas da terra.
- **Atmosfera Sistêmica:** Clima dinâmico (chuva com partículas, trovões e iluminação reativa), áudio procedural melancólico e interações ambientais.

### E. Gameplay Inicial e Economia Tática de Combate (Item 4)
- **Ritmo e Dificuldade (Estilo Dungeon Siege):** 
  - No início, os ataques físicos e magias são fracos. Derrotar um inimigo comum exige de 4 a 5 golpes calculados, exigindo posicionamento e hit-and-run (bater e correr).
  - Ausência total de "stunlock" automático em inimigos comuns sem feitiços específicos de controle de multidão (Crowd Control).
  - Sem magias destrutivas em massa no começo (nada de explosões limpa-telas); o foco é a vulnerabilidade tática.
- **O Dilema da Magia de Sangue:**
  - O jogador alterna organicamente entre ataques físicos (espada/adaga inicial) e feitiços rústicos de sangue.
  - **Projéteis Menores:** Magias de projétil leve que gastam pouco HP, servindo para cutucar inimigos à distância.
  - **Encantamentos:** Magias de suporte para potencializar o dano das armas brancas.
  - **Vampirismo Tático (Tier Superior):** Habilidades avançadas para drenar energia vital dos oponentes e restaurar o HP do jogador.
  - **Eco Vital (Kill Sustain):** Abater inimigos restaura uma fração mínima de vida, recompensando a agressividade calculada, mas sem substituir poções ou cautela.

---

## 3. Diretrizes Técnicas para Implementação Futura
1. **Sistema de NPCs e Diálogos:** Janela de conversa estilo CRPG clássico (com portrait e texto formatado) disparada por proximidade e clique em NPCs na Safe House.
2. **Desacoplamento de Habilidades Iniciais:** Permitir slots de magia vazios ao iniciar o jogo, exigindo a descoberta do primeiro grimório ou artefato.
3. **Gerador de Mundo Híbrido:** Evoluir o DungeonGenerator para suportar áreas externas abertas (florestas/estradas) intercaladas com calabouços fechados.

---

## 4. 🧭 Decisão de Design Resolvida (2026-09-02): Identidade do Protagonista vs. Liberdade de Build

> **Contexto da dúvida:** durante a concepção do jogo, o tema "sangue" (originado de uma referência pontual ao FPS *Blood* de 1997, citada apenas como inspiração de tom/atmosfera) acabou sendo interpretado de forma literal e expandido para todo o vocabulário mecânico do jogo (Cristais de Sangue, Selo de Sangue, Mago de Sangue). Isso gerou duas dúvidas de design que ficaram em aberto: (1) se o tema "sangue" onipresente poderia prejudicar classificação indicativa/lançamento, e (2) se o protagonista deveria ser travado como mago ou liberado num sistema de progressão livre por uso (estilo Dungeon Siege 1, onde os atributos sobem conforme o tipo de arma/magia usada em combate).

### Decisão 1 — Tema "Sangue" é mantido; o risco real é intensidade visual, não nomenclatura
- **Mantemos a lore e o vocabulário como estão** (Mago de Sangue, Cristais de Sangue, Selo de Sangue, etc.). Precedente de gênero: *Diablo* usa o mesmo padrão temático (orbes de vida vermelhos, "Blood Stone") e é M/16+ nas classificações — isso nunca foi um impeditivo de lançamento ou sucesso comercial.
- **O que de fato influencia classificação indicativa é a intensidade visual da violência** (desmembramento gráfico, volume de partículas de gore), não o nome das mecânicas.
- **Mitigação:** adicionar um toggle de "Intensidade de Conteúdo" nas configurações (ver `backlog/15_TOGGLE_INTENSIDADE_CONTEUDO_CLASSIFICACAO.md`) que suaviza o gore visual sem alterar a identidade temática do jogo. Essa é a alavanca real para uma classificação mais branda em lojas mais rígidas (Play Store/IARC), preservando a experiência completa pra quem optar por ela.

### Decisão 2 — Identidade narrativa do protagonista permanece FIXA; a liberdade fica na árvore de talentos
- **Não adotamos o sistema de progressão livre por uso do Dungeon Siege 1** (atributos sobem pelo tipo de ação/arma usada, sem classe fixa). Esse sistema faz sentido num jogo sem identidade narrativa de personagem — o oposto do Blood Mage 1995, cuja premissa inteira depende do protagonista **não ter escolhido** esse poder e ser obrigado a carregá-lo contra a própria vontade. Liberar o jogador pra ignorar magia inteiramente descaracterizaria o conflito central da história.
- **Em vez disso:** a identidade do personagem (mago amaldiçoado, arma inicial física antes da primeira magia) permanece fixa, mas a **liberdade de build** é entregue via ramificação mutuamente exclusiva na árvore de talentos — o mesmo padrão usado pelo *Diablo 2* (classe fixa, build livre dentro dela). Ver expansão dessa ramificação em `backlog/12_PROGRESSAO_E_QUESTS_CONTRATOS.md` §3.1, agora também cobrindo arquétipos melee-pesado / híbrido / caster-puro, além dos exemplos de dano vs. utilidade já descritos.

**Status:** ✅ Resolvido — decisões acima são canônicas até serem revisitadas formalmente.

