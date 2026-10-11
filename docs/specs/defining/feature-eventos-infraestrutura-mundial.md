# Infraestrutura de eventos mundiais

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Classe:** B
**Depende de:** ADR 0001, ADR 0012
**Estado vs código:** verificado em 2026-10-11 (leitura estática): não implementado. Não existe `src/data/worldEvents.json`, estado `activeWorldEvent` na store, leitura de cabeçalho `Date` do servidor nem lógica de calendário (`grep -rniE "worldEvent|eclipse|seasonal|sazonal|halloween" src public` sem ocorrência relevante). Existem `src/game/systems/AtmosphereSystem.ts`, `LightingSystem.ts`, `WorldManager.ts`, `PostFXSystem.ts` e `contentIntensity` em `Settings`, onde os eventos vão se apoiar.
**Origem:** dividida da spec feature-eventos-mundiais-e-sazonais (2026-10-11)

## Contexto
Base comum dos eventos dinâmicos (globais e por data real): agenda em dados, fonte de tempo, estado global lido pela cena e limpeza de recursos. Sem evento concreto, entrega só o mecanismo. Os eventos são specs próprias e dependem desta: [Eclipse de Sangue](feature-eventos-eclipse-de-sangue.md), Cerco ao Vilarejo (spec removida), Rifts de Infecção (spec removida) e eventos sazonais (spec removida). Referências de design: Dead Frontier 2 e Diablo. O objetivo de retenção é justificativa de produto, não verificada; metas em [ADR 0012](../../decisions/0012-monetizacao-preco-e-metas-de-retencao.md).

## Objetivo
Se aprovado, o jogo identifica o evento ativo por janela de tempo definida em `src/data/worldEvents.json` e o expõe como estado global lido pela cena de jogo.

## Decisões de que depende
| ADR | Assunto | Status |
|---|---|---|
| [0001](../../decisions/0001-ponte-phaser-react-so-zustand.md) | Ponte Phaser-React só via Zustand | **Proposta** |
| [0012](../../decisions/0012-monetizacao-preco-e-metas-de-retencao.md) | Monetização, preço e metas de retenção | **Proposta** |

## Fatos técnicos verificados
| Afirmação | Fonte | Verificado em |
|---|---|---|
| Não há `worldEvents.json`, `activeWorldEvent` nem lógica de calendário | `grep` em `src` e `public`; `ls src/data` | 2026-10-11 |
| Único endpoint de servidor é `api/log.ts`; sem endpoint de tempo | `ls api` | 2026-10-11 |

## Decisões a confirmar
| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| 1 | Fonte de tempo | a) relógio do dispositivo; b) cabeçalho `Date` do servidor de hospedagem | a: o jogo é offline e solo; b só se anticheat de evento importar |
| 2 | Retenção como justificativa de escopo | manter / remover | Definir métrica no ADR 0012 antes |
| 3 | Agenda dos eventos (cadência, janelas, fuso) | a definir | Responsável define o calendário |
| 4 | Respeitar `contentIntensity` reduzido e `atmosphereEffectsEnabled` nos efeitos | sim / não | Sim |

## Escopo
- Criar `src/data/worldEvents.json` com id, janela de tempo e parâmetros do evento.
- Criar o estado `activeWorldEvent` em `gameStore.ts` e a verificação de calendário ao iniciar.
- Criar sistema em `src/game/systems/` para o qual a `GameScene` só delega: expõe o evento ativo e o ciclo de vida de partículas, timers e listeners.
- Aplicar o respeito a `contentIntensity` e `atmosphereEffectsEnabled` a qualquer efeito de evento.

## Fora de escopo
- Efeitos de cada evento (specs dos eventos).
- Servidor de tempo próprio e anticheat de relógio (a menos que a decisão 1 escolha `Date` do servidor).

## Arquivos e contratos
- Criar: `src/data/worldEvents.json`, sistema novo em `src/game/systems/` (nome a definir). Alterar: `src/store/gameStore.ts` (`activeWorldEvent`), `src/game/scenes/GameScene.ts` (só delegar; ler `docs/engineering/risky-files.md`).
- Contrato do JSON (campos, fuso, formato de intervalo), valores numéricos finais e tratamento de data inválida: a definir (decisões 1 e 3).
- Comunicação React/Phaser só via Zustand (ADR 0001).

## Critérios de aceite
- **EVI-1** Quando a data/hora corrente cair na janela de um evento do `worldEvents.json`, o gameStore deve definir `activeWorldEvent` com o id do evento (provisório).
- **EVI-2** Quando a janela do evento terminar, o gameStore deve limpar `activeWorldEvent` (provisório).
- **EVI-3** Se a leitura da fonte de tempo falhar, então o jogo deve iniciar sem evento ativo (provisório).
- **EVI-4** Se `contentIntensity` for `reduced` ou `atmosphereEffectsEnabled` for falso, então a GameScene não deve ativar partículas e filtros do evento (provisório).
- **EVI-5** Quando o jogador sair do jogo ou a cena for encerrada, a GameScene deve limpar tweens, timers, partículas e listeners do evento (provisório).

## Plano de verificação
| Critério | Como verificar |
|---|---|
| EVI-1, EVI-2, EVI-3 | Teste unitário da função de calendário com relógio simulado (arquivo novo, ex. `src/game/systems/WorldEventSystem.test.ts`) |
| EVI-4, EVI-5 | Teste de sistema e passo manual alternando as configurações |

## Questões em aberto
1. Decisões 1 a 4 sem resposta.
2. Agenda (cadência, datas, fuso) e formato do `worldEvents.json`: a definir.
3. Fonte de tempo (decisão 1) e comportamento offline/PWA.
4. Existência de cada evento é decisão do responsável (ver as specs de evento): esta spec só vale se ao menos um for aprovado.

## Pendências para promover a backlog
- Aprovação do responsável; ADRs 0001 e 0012 aprovados.
- Decisões 1 a 4 e questões 1 a 4 resolvidas.
- Remover "(provisório)" dos critérios e preencher *Arquivos e contratos*.

## Referências
- [world-generation.md](../../gameplay/world-generation.md), [lighting-and-effects.md](../../gameplay/lighting-and-effects.md)
