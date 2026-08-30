---
agent_context: game-designer, backend, product-manager, frontend
target_module: docs/specs/propostas
priority: medium
status: draft
last_updated: 2026-08-11
tags: [specs, proposta, world-events, eventos-mundiais, retencao, sazonal]
---

# 🌍 GDD & Especificação: Eventos Mundiais e Sazonais (Atmosphere & Retention)

> Especificação conceitual e técnica para a criação de Eventos Mundiais e Sazonais dinâmicos em Bloodmage 1995. Inspirada em estratégias de engajamento de grandes RPGs de sobrevivência e ação como Dead Frontier 2 e Diablo, esta proposta define eventos globais temporais e comemorações sazonais que alteram a atmosfera, as mecânicas de combate e as recompensas para maximizar a retenção sem prejudicar o clima grimdark do jogo.

---

## 1. Contexto & Objetivos

Eventos dinâmicos em tempo real são um dos pilares mais fortes de engajamento e marketing orgânico em jogos modernos de serviço móveis e desktop. Eles trazem dinamismo, alterando temporariamente a rotina e incentivando os jogadores a entrarem no jogo em horários e dias específicos.

Esta especificação define a arquitetura para **Eventos Globais Dinâmicos** e **Eventos Sazonais Calendários** em *Bloodmage 1995*, projetados de forma que fiquem integrados ao universo gótico sombrio de terror do fim dos anos 90 do jogo.

### Objetivos do Sistema:
1.  **Foco em Retenção Sazonal:** Criar gatilhos estéticos e mecânicos para datas comemorativas reais que gerem picos de logins de usuários.
2.  **Dinamismo e Atmosfera Mutável:** Fazer o mundo parecer vivo e imprevisível, mudando regras de spawn de monstros e efeitos de iluminação e áudio.
3.  **Desenho Não-Invasivo:** Respeitar a cultura dos jogadores e manter as comemorações sazonais perfeitamente contextualizadas no lore medieval gótico do jogo (ex: sem decorações coloridas de natal modernas, mas sim rituais de solstício de inverno sombrios).

---

## 2. Tipos de Eventos Globais Propostos

Para manter a jogabilidade dinâmica e tática, propomos três modelos de eventos rotativos de curto prazo:

```
                  [ Eventos em Bloodmage 1995 ]
                                │
         ┌──────────────────────┼──────────────────────┐
         ▼                      ▼                      ▼
 [ Eclipse de Sangue ]   [ Cerco ao Vilarejo ]  [ Rifts de Infecção ]
(Clima e Drops Globais)   (Invasão à Safe Town)   (Zonas de Perigo)
```

### 🔴 Evento A: O Eclipse de Sangue (Atmospheric Event)
*   **Conceito:** Um evento global e cíclico de 2 horas de duração que mergulha todo o reino em uma escuridão rúnica avermelhada.
*   **Mecânicas de Combate:**
    *   *Escuridão Profunda:* O raio da aura de iluminação do jogador é reduzido em 30%. A névoa de escuridão visual ganha tons vermelhos intensos.
    *   *Fúria dos Monstros:* Todos os inimigos surgem com o modificador passivo `frenzy` ativado e velocidade de ataque aumentada em 15%.
    *   *Dádiva Carmesim:* O drop de Cristais de Sangue e a chance de encontrar equipamentos das categorias Épico e Lendário são aumentados em 50%.
*   **Efeitos Estéticos:** Partículas de cinza e faíscas de brasas vermelhas flutuam constantemente pela tela. O som ambiente ganha sussurros reverberados adicionais no `soundEngine`.

### 🛡️ Evento B: O Cerco ao Vilarejo Seguro (Village Siege)
*   **Conceito:** Evento defensivo cooperativo ou solo onde os limites da Safe Town (Room 0) são rompidos e ondas de monstros tentam atacar os NPCs sobreviventes.
*   **Mecânicas de Combate:**
    *   O combate é temporariamente habilitado nos limites da Room 0.
    *   O jogador deve proteger os 4 NPCs sobreviventes (Clérigo, Alquimista, Ferreiro, Ancião) das hordas invasoras.
    *   Se as defesas falharem, os NPCs podem ficar feridos temporariamente (fechando suas lojas por 10 minutos ou cobrando taxas mais altas para recuperação).
    *   *Sucesso Defensivo:* Completar o cerco com sucesso concede a todos os jogadores presentes um **Baú de Suprimentos Rúnicos** e 20% de desconto temporário nas compras com o Ferreiro e Alquimista por 1 hora.

### ☣️ Evento C: Rifts de Infecção (Infection Rifts)
*   **Conceito:** Fendas espaciais tóxicas que rasgam o chão dos cenários de forma aleatória durante as runs.
*   **Mecânicas de Combate:**
    *   Uma fenda roxa pulsante surge no centro de um andar. Ela emana uma aura ácida constante.
    *   Ficar perto do Rift causa o status condition de **Infecção** gradual e drena o MP do jogador.
    *   O jogador pode interagir por 5 segundos com o Rift para "selá-lo", mas o ato de selagem gera ondas rápidas de inimigos infectados e agressivos que devem ser derrotados.
    *   *Recompensa:* Selar o Rift concede Cristais de Sangue de forma concentrada e materiais raros para a criação de curativos lendários (antídotos e antibióticos).

---

## 3. Eventos Sazonais Alinhados à Identidade Visual Gótica

Grandes datas comemorativas reais serão adaptadas e rebatizadas para se encaixarem organicamente no folclore de *Bloodmage 1995*:

### 🎃 Solstício de Outono / Noite dos Ancestrais (Halloween)
*   **Descrição:** Os véus entre o mundo dos vivos e o fosso dos mortos se tornam finos.
*   **Mudanças Visuais:** Pequenas abóboras entalhadas rústicas com fogo de sangue roxo decoram as bordas da Safe Town. Os inimigos esqueletos usam máscaras e coroas de ossos.
*   **Recompensas Sazonais:** Desbloqueio da skin exclusiva **"Mago Esquelético do Fosso"** e da paleta de sangue **"Necrose Sombria"** (sangue de cor preta com partículas de fumaça cinzenta).

### ❄️ Solstício de Inverno / O Banquete do Gelo (Natal/Ano Novo)
*   **Descrição:** Uma era de gelo escuro e vento congelante atinge o vilarejo seguro.
*   **Mudanças Visuais:** Uma névoa fria esbranquiçada e neve caindo cobrem as cenas de combate. Tochas ganham uma chama azul de gelo.
*   **Mecânicas Sazonais:** Inimigos têm ataques que congelam levemente a velocidade de movimento do jogador por 1 segundo, mas o jogador ganha acesso ao feitiço temporário rúnico **"Lança de Gelo de Sangue"**.

---

## 4. Arquitetura Técnica de Sincronização de Calendário

Para que os eventos sazonais e de hora em hora funcionem sem a necessidade de um servidor de tempo ultra-complexo, o jogo utilizará a API de tempo do navegador e checagens com o fuso horário internacional (UTC):

1.  **Checagem de Tempo Confiável:** Ao iniciar o jogo, o cliente faz uma requisição HTTP simples de cabeçalho `Date` para o servidor backend ou de hospedagem (Vercel) para obter a data e hora mundiais confiáveis, evitando que o jogador manipule o relógio local do sistema operacional para burlar eventos.
2.  **Ativação do Estado de Evento:** Se a data/hora coincidir com os intervalos definidos no arquivo de configuração do jogo `src/data/worldEvents.json`, o estado global do Zustand `activeWorldEvent` é definido para a ID correspondente.
3.  **Gatilho das Cenas Phaser:** A `GameScene` escuta a mudança no Zustand e ativa os filtros de pós-processamento, os emissores de partículas climáticas (chuva de brasas, neve) e altera os multiplicadores de spawn e loot correspondentes ao evento em tempo real.

---

## Referências

- [[docs/specs/propostas/04_MOBILE_APP_E_MONETIZACAO_INDIE.md]] — Conexão com o Passe de Batalha de Sobrevivência
- [[docs/specs/andamento/04_FASE4_MUNDO_CONTINUO.md]] — Configurações de iluminação e biomas contínuos

## Registro de mudanças

| Data | O que mudou | Autor |
|------|-------------|-------|
| 2026-08-11 | Criação da proposta conceitual e técnica de Eventos Mundiais e Sazonais | Jules (Google AI) |
