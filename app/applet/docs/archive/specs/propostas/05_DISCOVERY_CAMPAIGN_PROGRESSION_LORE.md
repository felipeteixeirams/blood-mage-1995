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

