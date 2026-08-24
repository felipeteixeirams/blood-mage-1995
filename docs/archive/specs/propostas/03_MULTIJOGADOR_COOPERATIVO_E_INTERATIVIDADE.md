---
agent_context: game-designer, backend, product-manager
target_module: docs/specs/propostas
priority: medium
status: draft
last_updated: 2026-08-11
tags: [specs, proposta, multiplayer, cooperativo, webrtc, peer-to-peer]
---

# ⚔️ GDD & Especificação: Multijogador Cooperativo e Interatividade

> Especificação conceitual e técnica para a introdução de interatividade cooperativa entre jogadores em Bloodmage 1995, priorizando um modelo de conexão de custo zero de servidor (P2P via WebRTC) e focado em exploração conjunta de masmorras e eventos globais, inspirado nas interações de Diablo Immortal.

---

## 1. Contexto & Objetivos

Embora o combate PvP (Jogador vs. Jogador) seja um objetivo de longo prazo, a prioridade para o amadurecimento multiplayer de *Bloodmage 1995* é a **cooperação e a interatividade**. Permitir que jogadores explorem as profundezas das masmorras, protejam a Safe Town (Vila Segura) juntos e compartilhem a tensão dos eventos mundiais cria um ecossistema mais acolhedor e focado em engajamento e retenção.

### Objetivos de Negócio (Solo Developer):
*   **Custo Zero de Infraestrutura:** Implementar uma arquitetura de rede que não necessite de servidores dedicados de simulação física caros para rodar o jogo, tornando o projeto viável para um desenvolvedor solo.
*   **Aumento de Retenção orgânica:** Jogar com amigos aumenta significativamente as sessões de jogo e a divulgação boca a boca.
*   **Simplicidade e Estabilidade:** Utilizar conexões diretas para sincronização de estado básico, focando no cooperativo leve antes de tentar sincronizações competitivas ultra-precisas.

---

## 2. Visão Geral da Jogabilidade Cooperativa

O multijogador operará sob o conceito de **Sessões Compartilhadas (Co-op de até 4 Jogadores)**. Os jogadores poderão convidar amigos ou parear com aventureiros no vilarejo seguro (Room 0) para desbravar os biomas contínuos.

```
       [ Jogador 1 (Host) ]
          /           \
     (WebRTC)       (WebRTC)
        /               \
[ Jogador 2 ]       [ Jogador 3 ]
```

### Mecânicas de Cooperação Core:
1.  **Exploração Conectada:** Todos os jogadores compartilham o mesmo estado da masmorra gerado pelo Host. Inimigos, portões, baús e scavengeables são sincronizados.
2.  **Sinergia de Magias de Sangue:** As magias de sangue interagem de forma cooperativa:
    *   *Círculo de Transmutação:* O círculo rúnico de um jogador no chão também cura e concede bônus de dano para companheiros que pisarem nele.
    *   *Escudo de Ossos:* Habilidades de escudo podem ser conjuradas para proteger aliados sob risco de morte.
    *   *Sinfonia Necromântica:* Matar inimigos gera fragmentos de almas e poças de sangue que podem ser coletados por qualquer membro do grupo.
3.  **Ressurreição Cooperativa (Prevenção de Nocaute):**
    *   Quando um companheiro entra no estado de **Inconsciência (Nocaute)**, em vez de esperar a regeneração passiva de 1 HP/s, um aliado pode interagir com o corpo caído por 3 segundos para canalizar uma "Transfusão de Sangue", reanimando o parceiro instantaneamente com 20% de HP (compartilhando um custo de vida do conjurador).
4.  **Loot Individualizado (Instanced Loot):**
    *   Para evitar conflito ("loot-stealing"), cada jogador enxerga e coleta seus próprios drops de itens gerados pelo `LootSystem`, baseados em sua própria sorte e nível de prestígio.

---

## 3. Arquitetura Técnica: P2P via WebRTC com Broker de Sinalização

Para eliminar os custos de manter servidores dedicados rodando loops de física Phaser de alta frequência, a arquitetura proposta é **Peer-to-Peer (P2P) baseada em WebRTC**, utilizando um servidor de sinalização (Signaling Server) extremamente leve e barato de manter (podendo rodar em servidores serverless/WebSockets básicos ou instâncias gratuitas).

### Componentes de Rede:

```
┌────────────────────────────────────────────────────────┐
│               Servidor de Sinalização                  │
│  (Apenas conecta os peers no início - WebSockets/HTTP)  │
└───────────────┬────────────────────────┬───────────────┘
                │                        │ (Troca de SDP/Ice Candidates)
                ▼                        ▼
      ┌──────────────────┐     ┌──────────────────┐
      │  Jogador 1 (Host)│◄───►│  Jogador 2 (Peer)│
      │  (Simula a Sala) │P2P  │(Envia inputs/pos)│
      └──────────────────┘     └──────────────────┘
```

1.  **Servidor de Sinalização (Signaling):** Utilizado apenas para "apresentar" os jogadores (troca de metadados de conexão SDP e ICE Candidates). Após estabelecida a conexão WebRTC, o tráfego do servidor de sinalização cai para zero.
2.  **O Host (Autoridade da Sala):** O jogador que cria o lobby atua como a autoridade lógica da masmorra. Ele gerencia o spawn dos inimigos, o estado dos baús e a geração procedural do mapa.
3.  **Os Clientes (Peers):** Enviam suas coordenadas de movimento, ações de ataque/esquiva e cooldowns para o Host. O Host processa e devolve a posição sincronizada de todos os monstros e projéteis ativos.

### Estratégias de Mitigação de Latência:
*   **Interpolação de Posições (Client-side Interpolation):** Para evitar "teleportes" visuais de monstros ou aliados causados por flutuações de ping, os clientes interpolam suavemente as posições recebidas nos últimos frames em vez de aplicá-las instantaneamente.
*   **Previsão de Input de Movimento (Client-side Prediction):** O próprio jogador se move instantaneamente na tela local sem esperar o pacote do Host confirmar a posição física. Se houver discrepância leve com o Host, ela é corrigida de forma suave (soft correction).

---

## 4. UI/UX: Modais de Conectividade e Lobby

A interface do multijogador cooperativo respeitará rigorosamente o design system clássico gótico de 1995 de *Bloodmage*:

### Tela de Aliança (Lobby de Conexão):
*   Uma seção estilizada como um pergaminho rústico de pedra escura com bordas de ferro batido e ornamentos rúnicos dourados.
*   **Conexão Simplificada por Código:** O Host gera uma "Runa de Invocação" (um código alfanumérico curto, ex: `ANX-995`). Outros jogadores inserem essa runa na aba "Invocar Aliados" para se conectar instantaneamente via WebRTC.
*   **Indicador de Conexão:** Pequenos corações pulsando em vermelho (ping estável) ou cinza escuro de pedra (lag/desconexão).

---

## 5. Próximos Passos para o Desenvolvimento

1.  **Fase de Protótipo Técnico:** Criar uma branch de pesquisa para validar a biblioteca `PeerJS` ou WebRTC bruto rodando em conjunto com o ciclo de atualização do Phaser.
2.  **Sincronização Mínima Viável:** Sincronizar primeiro apenas a posição e sprite do segundo jogador na Room 0 (Safe Town).
3.  **Geração Cooperativa de Masmorras:** Modificar a inicialização do `DungeonGenerator` para aceitar uma semente de mapa (seed) gerada pelo Host, garantindo que ambos gerem o mesmo mapa localmente.

---

## Referências

- [[docs/specs/README.md]] — Status de desenvolvimento
- [[docs/architecture/03_PHASER_PATTERNS.md]] — Integração com o loop do Phaser
- [[docs/design/02_UI_PATTERNS.md]] — Padrões visuais de UI/UX

## Registro de mudanças

| Data | O que mudou | Autor |
|------|-------------|-------|
| 2026-08-11 | Criação da proposta cooperativa de rede e interface | Jules (Google AI) |
