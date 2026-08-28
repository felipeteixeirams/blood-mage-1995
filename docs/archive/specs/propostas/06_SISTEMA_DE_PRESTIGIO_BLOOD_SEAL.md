---
agent_context: game-designer, backend, product-manager
target_module: docs/specs/propostas
priority: medium
status: draft
last_updated: 2026-08-11
tags: [specs, proposta, prestige, progressao, end-game, retention]
---

# 🏅 GDD & Especificação: Sistema de Prestígio (Blood Seal Progression)

> Especificação conceitual e mecânica para a introdução do modo Prestige ("Selo de Sangue") em Bloodmage 1995. Inspirado no ciclo de reset estratégico de Dead Frontier 2, no progresso infinito de Diablo Immortal e no avanço de dificuldades de Dungeon Siege 1, esta proposta oferece uma progressão de fim de jogo (endgame) envolvente de baixo esforço técnico e alta retenção.

---

## 1. Contexto & Objetivos

No estado atual, *Bloodmage 1995* é focado em sobreviver às 5 ondas básicas em andares progressivos procedimentais. Após atingir o fim da run ou maximizar os talentos, o jogador atinge o teto do jogo e a retenção de longo prazo diminui.

Para oferecer um objetivo contínuo, propomos o **Sistema de Prestígio: Selo de Sangue (Blood Seal)**. Ele incentivará o jogador a "recomeçar" voluntariamente em troca de recompensas permanentes, expandindo as horas de jogo e oferecendo profundidade estratégica sem exigir a criação constante de novos biomas ou inimigos.

### Objetivos Principais:
1.  **Ciclo de Retenção Sustentável:** Fornecer um loop de progresso infinito ou altamente durável para jogadores dedicados de fim de jogo.
2.  **Fusão Equilibrada de Inspirações:** Combinar o "Hard Reset" (Dead Frontier 2), os bônus acumulativos contínuos (Diablo) e o desbloqueio de novas dificuldades de campanha (Dungeon Siege 1).
3.  **Simplicidade e Escalabilidade:** Uma arquitetura que utilize os sistemas de atributos, ondas e salvamento existentes, reduzindo riscos de bugs.

---

## 2. O Ciclo de Prestígio: O Ritual do Selo de Sangue

O prestígio é opcional e pode ser ativado na Safe Town (Room 0) ao interagir com o NPC **Ancião** após cumprir os requisitos mínimos de avanço.

```
[ Nível Máximo Alcançado (ex: Lvl 20) ]
                  │
                  ▼
   [ Ritual do Selo de Sangue ]  <─── (Reseta Atributos e Nível para 1)
                  │
                  ├───────────────────────────────┐
                  ▼                               ▼
     [ Ganha 1 Selo de Sangue ]      [ Desbloqueia Próxima Dificuldade ]
  (Bônus passivos permanentes +      (Ex: Pesadelo, Inferno - Inimigos
   títulos e brasões rúnicos)         mais agressivos e drops épicos)
```

### Regras do Reset de Prestígio:
1.  **O Sacrifício (O que é resetado):**
    *   O nível do jogador retorna para **1**.
    *   O XP atual retorna para 0.
    *   Os atributos base são resetados para os padrões iniciais de level 1.
    *   O ouro temporário e itens normais/incomuns da corrida ativa são descartados (simulando a purificação pelo sangue).
2.  **A Herança (O que é preservado):**
    *   Todos os Cristais de Sangue acumulados no metajogo.
    *   Os níveis da Árvore de Talentos Permanentes (comprados com Cristais).
    *   Todos os cosméticos desbloqueados (Skins de Corpo, Visuais de Armas e Paletas de Sangue).
    *   O histórico de Recordes e Conquistas.

---

## 3. Recompensas de Prestígio: Selos de Sangue & Brasões

Cada vez que o jogador realiza o Ritual de Prestígio, ele grava em sua alma um **Selo de Sangue permanente** (máximo de 10 Selos no lançamento). Cada Selo concede um bônus à escolha do jogador:

| Tipo de Selo | Efeito Permanente | Descrição Gótica |
|---|---|---|
| **Selo da Carnificina** | +3% Dano Global | *"Sua lâmina anseia por mais fluidos vitais."* |
| **Selo da Vitalidade Escura** | +5 Max HP | *"O sangue antigo corre mais denso em suas veias."* |
| **Selo da Fluidez Rúnica** | +2% Redução de Cooldown (CDR) | *"As runas respondem aos seus sussurros com velocidade."* |
| **Selo do Vampirismo Profundo**| +0.5% Roubo de Vida (Lifesteal) | *"Cada corte projeta uma névoa que nutre seu corpo."* |
| **Selo da Fortuna Macabra** | +4% Chance de Encontrar Itens Raros | *"Os mortos carregam segredos mais valiosos para você."* |

### Brasões Estéticos de Prestígio:
Ao lado do nome do jogador nos menus de recordes e na HUD de status, um pequeno ícone rúnico dourado de "Prestígio" aparecerá, evoluindo de uma adaga rústica de bronze para uma imponente foice de ouro rúnica cintilante de acordo com o nível de Prestígio alcançado.

---

## 4. Desbloqueio de Dificuldades (Estilo Dungeon Siege)

O prestígio não apenas concede bônus passivos, mas também abre as passagens para novos reinos de dificuldade no vilarejo seguro.

1.  **Dificuldade Básica (Iniciante):** Escalonamento padrão dos biomas (Fosso das Chagas, Catacumbas, Santuário de Sangue).
2.  **Dificuldade Pesadelo (Desbloqueada no Prestígio I):**
    *   Inimigos possuem 30% mais HP e causam 20% mais dano.
    *   As chances de infecção e veneno ao ser atingido por monstros aumentam em 15%.
    *   **Drops Elevados:** Baús têm chance de dropar a categoria de itens **Lendários/Épicos**, indisponíveis na dificuldade padrão.
3.  **Dificuldade Inferno (Desbloqueada no Prestígio III):**
    *   Inimigos ganham habilidades passivas adicionais (velocidade aumentada, pequenos surtos de fúria).
    *   A névoa de escuridão da vinheta é mais fechada e claustrofóbica.
    *   Chance máxima de drops de equipamentos ancestrais e Cristais de Sangue duplicados nas execuções.

---

## 5. UI/UX: O Altar dos Selos de Sangue

O Ritual de Prestígio será acessado através de uma interface dedicada e intimidadora, mantendo a atmosfera medieval do jogo:

*   **O Altar Rúnico:** Uma ilustração animada proceduralmente no centro do modal mostrando uma bacia rúnica de pedra cheia de sangue fervendo.
*   **Contrato de Sacrifício:** Um texto manuscrito gótico que exige que o jogador "assine" clicando e segurando um botão de canalização por 3 segundos (evitando cliques acidentais). O botão exibe um texto dramático: *"Verter minha alma em troca do Selo Eterno"*.
*   **Feedback Visual e Sonoro:** Ao confirmar o sacrifício, a tela pisca em vermelho escuro intenso, o controle vibra fortemente (`navigator.vibrate([100, 50, 150])`) e o sintetizador toca uma nota de órgão fúnebre grave de alta reverberação.

---

## Referências

- [[docs/specs/propostas/04_MOBILE_APP_E_MONETIZACAO_INDIE.md]] — Monetização e retenção de jogadores
- [[docs/gameplay/00_CORE_MECHANICS.md]] — Atributos base e escalonamento

## Registro de mudanças

| Data | O que mudou | Autor |
|------|-------------|-------|
| 2026-08-11 | Criação da proposta de Prestígio e escalonamento de dificuldade | Jules (Google AI) |
