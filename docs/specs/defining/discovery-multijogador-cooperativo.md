# Discovery: multijogador cooperativo (P2P WebRTC)

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Estado vs código:** verificado em 2026-10-11 (leitura estática): não implementado. Sem WebRTC, PeerJS, sinalização, lobby nem "co-op" em `src`, `package.json` e `vite.config.ts`. Existem apenas pontos de reuso: estado de nocaute do jogador (`isUnconscious` em `src/game/objects/Player.ts`, regeneração passiva de 2% do HP máximo por segundo), `LootSystem` (`src/game/systems/LootSystem.ts`, sorteio local com `Math.random`) e o estilo de modais React góticos (`src/components/ui/ModalBase.tsx`). `DungeonGenerator.ts` não recebe seed e usa `Math.random`.

## Contexto
- Discovery técnico de longo prazo, depois da campanha solo; o jogo é offline-first (Zustand + `localStorage`).
- Proposta original: sessões cooperativas de até 4 jogadores, P2P por WebRTC (malha), com um servidor de sinalização leve só para trocar SDP/ICE; o criador do lobby é a autoridade da masmorra (inimigos, baús, mapa); clientes enviam movimento e ações, interpolam posições recebidas e fazem predição local do próprio movimento.
- Mecânicas propostas: mundo compartilhado (inimigos, portões, baús), magias com efeito em aliados (círculo de transmutação, escudo de ossos, fragmentos de alma coletáveis), ressurreição por canalização, loot individual por jogador e lobby por código curto.
- Correção em relação ao texto original: a regeneração passiva do nocaute é de 2% do HP máximo por segundo (`Player.ts`), não "1 HP/s".
- A ponte Phaser-React é só Zustand ([ADR 0001](../../decisions/0001-ponte-phaser-react-so-zustand.md)); a camada de rede teria de respeitá-la.
- O PvP é objetivo de prazo mais longo e está fora desta spec.

## Objetivo
Se aprovado, até 4 jogadores exploram a mesma masmorra em sessão cooperativa sem servidor de simulação, conectando-se por um código.

## Decisões de que depende
| ADR | Assunto | Status |
|---|---|---|
| [0001](../../decisions/0001-ponte-phaser-react-so-zustand.md) | Ponte Phaser-React só via Zustand (a rede não pode usar eventos globais para gameplay) | Proposta |
| [0011](../../decisions/0011-conta-e-dados-do-jogador.md) | Conta e dados (identidade de jogador na sessão) | Proposta |
| [0013](../../decisions/0013-metas-de-performance.md) | Metas de performance (60 FPS com rede) | Proposta |

## Fatos técnicos verificados
| Afirmação | Fonte | Verificado em |
|---|---|---|
| Sem biblioteca ou código de rede P2P | `grep -rniE "webrtc\|peerjs\|RTCPeer\|signaling\|multiplayer\|co-op" src package.json vite.config.ts` sem resultado | 2026-10-11 |
| `DungeonGenerator` sem seed, com `Math.random` | `src/game/systems/DungeonGenerator.ts` (`generate(mapW, mapH, biome, _offsetX, _offsetY)`) | 2026-10-11 |
| `LootSystem` sorteia com `Math.random`, sem noção de jogador | `src/game/systems/LootSystem.ts` | 2026-10-11 |
| Nocaute do jogador existe e regenera 2% do HP máximo por segundo | `src/game/objects/Player.ts` (~l.317-342) | 2026-10-11 |
| Há uma só instância de jogador no `GameScene` | `src/game/scenes/GameScene.ts` (`this.player`) | 2026-10-11 |

## Decisões a confirmar
| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| 1 | O jogo terá cooperativo? Escopo da cooperação | não / co-op leve / PvP | Só decidir após a campanha solo; se sim, co-op leve |
| 2 | Arquitetura de rede | A) P2P WebRTC com host autoritativo e sinalização; B) servidor autoritativo | A: custo baixo; B só se anti-trapaça for requisito |
| 3 | Tamanho da sessão | 2 / até 4 jogadores | Começar com 2: malha de 4 multiplica tráfego e casos de desconexão |
| 4 | Biblioteca | PeerJS ou WebRTC bruto | A decidir após o protótipo; não verificada em fonte primária |
| 5 | Servidor de sinalização | serviço gratuito, serverless, próprio | A definir (custo e privacidade são do responsável) |
| 6 | Lobby por código ("Runa de Invocação") | código alfanumérico curto / convite por link | Código curto (proposta original) |
| 7 | Loot | individual por jogador / compartilhado | Individual (proposta original), evita disputa |
| 8 | Ressurreição por canalização (3 s, 20% de HP, custo de vida do conjurador) | valores da proposta original | Provisório; balance é do responsável |
| 9 | Magias cooperativas | círculo, escudo de ossos, fragmentos de alma | Só após o protótipo base |

## Escopo
Condicional às decisões 1 a 3.
- Protótipo técnico: dois clientes conectados por WebRTC trocando mensagens, sem simulação.
- Sincronização mínima: posição e sprite do segundo jogador na Safe House.
- `DungeonGenerator` e geradores de zona aceitam um seed determinístico recebido do host.
- Lobby React (Tela de Aliança): host gera código, convidado digita código, indicador de conexão.
- Host autoritativo: spawn de inimigos, baús e dano; clientes enviam entrada e recebem estado.
- Interpolação de posições remotas e predição do jogador local.
- Loot individual e ressurreição cooperativa (decisões 7 e 8).

## Fora de escopo
- PvP e ranking competitivo.
- Servidor dedicado de simulação.
- Matchmaking com desconhecidos.
- Chat e voz.

## Arquivos e contratos
- Criar (nomes provisórios, a confirmar): `src/network/` (transporte e protocolo), componente React do lobby em `src/components/`, campos de rede no `gameStore` (sem `CustomEvent`).
- Alterar: `src/game/systems/DungeonGenerator.ts` e `ProceduralForestGenerator.ts` (seed), `src/game/systems/LootSystem.ts` (jogador alvo). Arquivos de risco: ler `docs/engineering/risky-files.md` antes de tocar `GameScene.ts`, `Player.ts`, `Enemy.ts`, `DungeonGenerator.ts`, `gameStore.ts`.
- Contrato de mensagem: versão do protocolo, tipo, tick, carga (movimento, ação, estado); formato a definir.
- Não tocar: `localStorage.ts` para dados de rede (estado de sessão não persiste).
- Valores (limite de jogadores, taxa de envio, timeout): a definir.

## Critérios de aceite
Todos dependem de decisão aberta.
- **MP-1** Quando o host cria uma sala, o lobby React deve exibir um código de convite (provisório).
- **MP-2** Quando um convidado insere um código válido, o sistema de rede deve estabelecer a conexão com o host (provisório).
- **MP-3** Se o código é inválido ou a sala não existe, então o lobby deve exibir mensagem de erro sem iniciar a partida (provisório).
- **MP-4** Dado o mesmo seed do host, o DungeonGenerator deve gerar o mesmo mapa em todos os clientes (provisório).
- **MP-5** Enquanto conectado, o sistema deve exibir ao jogador local a posição e o sprite dos outros jogadores (provisório).
- **MP-6** Enquanto a sessão está ativa, o host deve decidir spawn e dano dos inimigos (provisório).
- **MP-7** Se um peer perde a conexão, então o host deve remover o jogador da sessão e a partida dos demais deve continuar (provisório).
- **MP-8** Se o host perde a conexão, então os clientes devem encerrar a sessão e voltar ao menu com mensagem (provisório).
- **MP-9** Quando um inimigo morre, o LootSystem deve gerar drops separados para cada jogador (provisório).
- **MP-10** Quando um aliado canaliza a ressurreição por 3 s ao lado de um jogador inconsciente, o jogo deve reanimá-lo com 20% do HP (provisório).
- **MP-11** Se o aliado se afasta antes dos 3 s, então a canalização deve ser cancelada e o jogador continua inconsciente (provisório).
- **MP-12** O jogo solo (sem sessão) deve funcionar sem rede, como hoje (provisório).

## Plano de verificação
| Critério | Como verificar |
|---|---|
| MP-1 a MP-3 | teste de componente do lobby com transporte simulado; manual com dois navegadores |
| MP-4 | teste unitário do DungeonGenerator: mesmo seed, mesmas salas |
| MP-5, MP-6 | manual com dois navegadores; não validado: precisa de playtest humano |
| MP-7, MP-8 | teste unitário do protocolo com desconexão simulada |
| MP-9 | teste unitário do LootSystem com 2 jogadores |
| MP-10, MP-11 | teste unitário da canalização; manual: não validado, precisa de playtest humano |
| MP-12 | teste: jogo inicia e roda sem módulo de rede ativo |

## Questões em aberto
- Cooperativo entra no escopo do jogo (decisão 1)? Servidor de sinalização e custo (decisão 5).
- Tamanho da sessão, biblioteca, taxa de envio, timeout.
- NAT e restrições de rede móvel em WebRTC: não verificados em fonte primária.
- Efeito dos geradores com `Math.random` fora do `DungeonGenerator` (loot, detalhes) no determinismo: não verificado.
- Efeito da rede nos 60 FPS em mobile: exige execução.

## Pendências para promover a backlog
- Discovery; depende de decisão de produto, custo e arquitetura: aprovação do responsável.
- ADRs 0001, 0011 e 0013 aprovados.
- Decisões 1 a 9 respondidas; questões em aberto resolvidas.
- Fatos a verificar: biblioteca de WebRTC, NAT/TURN, determinismo da geração.
- Dividir em specs (protótipo, seed, lobby, host autoritativo, loot, ressurreição): hoje é um épico.

## Referências
- [architecture](../../architecture/README.md), [world-generation](../../gameplay/world-generation.md), [feature-topologia-de-mundo-continuo](feature-topologia-de-mundo-continuo.md)
- [ADR 0001](../../decisions/0001-ponte-phaser-react-so-zustand.md), [ADR 0011](../../decisions/0011-conta-e-dados-do-jogador.md), [ADR 0013](../../decisions/0013-metas-de-performance.md)
