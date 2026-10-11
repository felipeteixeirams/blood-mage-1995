# Eventos mundiais e sazonais

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Estado vs código:** verificado em 2026-10-11 (leitura estática): não implementado. Não existe `src/data/worldEvents.json`, estado `activeWorldEvent` na store, leitura de cabeçalho `Date` do servidor nem lógica de calendário (`grep -rniE "worldEvent|eclipse|seasonal|sazonal|halloween" src public` sem ocorrência relevante). Reaproveitáveis: `frenzy` como `AIState` em `src/types/game.ts` e `src/game/objects/Enemy.ts`; `statusEffectOnHit` com `infection` (`src/types/game.ts`); `src/game/systems/AtmosphereSystem.ts`, `LightingSystem.ts`, `WorldManager.ts` (raio de luz por bioma), `PostFXSystem.ts`; `contentIntensity` em `Settings`. Não existe status de congelamento (só `bleeding`, `poison`, `infection`).

## Contexto
Proposta de eventos dinâmicos (globais e por data real) para variar atmosfera, regras de spawn, loot e iluminação, ancorada no lore gótico (sem decoração natalina moderna). Referências de design: Dead Frontier 2 e Diablo. O objetivo de retenção é justificativa de produto, não verificada; metas em [ADR 0012](../../decisions/0012-monetizacao-preco-e-metas-de-retencao.md).

## Objetivo
Se aprovado, o jogo muda atmosfera, spawn e loot durante janelas de tempo definidas em `src/data/worldEvents.json`, ativadas por um estado global lido pela cena de jogo.

## Decisões de que depende
| ADR | Assunto | Status |
|---|---|---|
| [0001](../../decisions/0001-ponte-phaser-react-so-zustand.md) | Ponte Phaser-React só via Zustand | **Proposta** |
| [0005](../../decisions/0005-iluminacao-escuridao-e-vinheta.md) | Iluminação, escuridão e vinheta | **Proposta** (Eclipse altera o raio de luz) |
| [0012](../../decisions/0012-monetizacao-preco-e-metas-de-retencao.md) | Monetização, preço e metas de retenção | **Proposta** |

## Fatos técnicos verificados
| Afirmação | Fonte | Verificado em |
|---|---|---|
| Não há `worldEvents.json`, `activeWorldEvent` nem lógica de calendário | `grep` em `src` e `public`; `ls src/data` | 2026-10-11 |
| `frenzy` existe como estado de IA, não como modificador passivo | `src/types/game.ts` (`AIState`), `src/game/objects/Enemy.ts` | 2026-10-11 |
| `infection` é um `statusEffectOnHit`; não há status de congelamento | `src/types/game.ts` | 2026-10-11 |
| Raio de luz por bioma existe (`lightRadius`) | `src/game/systems/WorldManager.ts` | 2026-10-11 |
| Único endpoint de servidor é `api/log.ts`; sem endpoint de tempo | `ls api` | 2026-10-11 |
| NPCs (Clérigo, Alquimista, Ferreiro, Ancião) existem na Safe House | `src/game/systems/DungeonFlowController.ts`, `src/i18n/ptBR.ts` | 2026-10-11 |

## Decisões a confirmar
| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| 1 | Existência e regras dos três eventos globais (Eclipse de Sangue, Cerco ao Vilarejo, Rifts de Infecção) | todos / subconjunto / nenhum | Começar só pelo Eclipse (reusa luz, `frenzy` e loot) |
| 2 | Eventos sazonais por data real (Noite dos Ancestrais, Banquete do Gelo) | calendário real / sem sazonais | Adiar até o Eclipse validado |
| 3 | Fonte de tempo | a) relógio do dispositivo; b) cabeçalho `Date` do servidor de hospedagem | a: o jogo é offline e solo; b só se anticheat de evento importar |
| 4 | Retenção como justificativa de escopo | manter / remover | Definir métrica no ADR 0012 antes |
| 5 | Efeitos de gameplay do Eclipse (luz -30%, ataque +15%, drop de Cristais e Épico/Lendário +50%) | aprovar / ajustar | Aprovar após playtest; são valores da proposta original |
| 6 | Agenda dos eventos (duração de 2 h do Eclipse, cadência, janelas sazonais) | a definir | Responsável define o calendário |
| 7 | Cerco: combate na Room 0 e consequências a NPCs (loja fechada 10 min ou taxa maior; desconto de 20% por 1 h; Baú de Suprimentos Rúnicos) | aprovar / redesenhar | Redesenhar: afeta Safe House e economia, sem ADR |
| 8 | Rift: aura de Infecção e dreno de MP, selar em 5 s, ondas, recompensa | aprovar / ajustar | Aprovar após decisão 1 |
| 9 | Conteúdo de arte e recompensas sazonais (skin "Mago Esquelético do Fosso", paleta "Necrose Sombria", feitiço "Lança de Gelo de Sangue", congelar 1 s) | aprovar / adiar | Adiar: exige arte, novo status e feitiço |
| 10 | Respeitar `contentIntensity` reduzido e `atmosphereEffectsEnabled` nos efeitos | sim / não | Sim |

## Escopo
Se aprovado (por evento aprovado na decisão 1):
- Criar `src/data/worldEvents.json` com id, janela de tempo e parâmetros do evento.
- Criar o estado `activeWorldEvent` em `gameStore.ts` e a verificação de calendário ao iniciar.
- A `GameScene` (delegando a um sistema em `src/game/systems/`) aplica luz, partículas, multiplicador de spawn e de loot do evento ativo.
- Eclipse: luz reduzida, inimigos em `frenzy`, bônus de drop, partículas de brasa e sussurros no `soundEngine`.
- Cerco e Rifts: conforme decisões 7 e 8.

## Fora de escopo
- Servidor de tempo próprio e anticheat de relógio (a menos que a decisão 3 escolha `Date` do servidor).
- Cooperativo ([discovery-multijogador-cooperativo.md](discovery-multijogador-cooperativo.md)).
- Arte final de skins e novos feitiços (decisão 9).

## Arquivos e contratos
- Criar: `src/data/worldEvents.json`, sistema novo em `src/game/systems/` (nome a definir). Alterar: `src/store/gameStore.ts` (`activeWorldEvent`), `src/game/scenes/GameScene.ts` (só delegar; ler `docs/engineering/risky-files.md`).
- Contrato do JSON (campos, fuso, formato de intervalo), valores numéricos finais e tratamento de data inválida: a definir (decisões 3, 5 e 6).
- Comunicação React/Phaser só via Zustand (ADR 0001).

## Critérios de aceite
- **EV-1** Quando a data/hora corrente cair na janela de um evento do `worldEvents.json`, o gameStore deve definir `activeWorldEvent` com o id do evento (provisório).
- **EV-2** Quando a janela do evento terminar, o gameStore deve limpar `activeWorldEvent` (provisório).
- **EV-3** Se a leitura da fonte de tempo falhar, então o jogo deve iniciar sem evento ativo (provisório).
- **EV-4** Enquanto o Eclipse de Sangue estiver ativo, o LightingSystem deve reduzir o raio de iluminação do jogador em 30% (provisório).
- **EV-5** Enquanto o Eclipse de Sangue estiver ativo, o Enemy deve surgir em estado `frenzy` (provisório).
- **EV-6** Enquanto o Eclipse de Sangue estiver ativo, o LootSystem deve aumentar em 50% o drop de Cristais de Sangue e a chance de Épico e Lendário (provisório).
- **EV-7** Se `contentIntensity` for `reduced` ou `atmosphereEffectsEnabled` for falso, então a GameScene não deve ativar partículas e filtros do evento (provisório).
- **EV-8** Quando o jogador sair do jogo ou a cena for encerrada, a GameScene deve limpar tweens, timers, partículas e listeners do evento (provisório).

## Plano de verificação
| Critério | Como verificar |
|---|---|
| EV-1, EV-2, EV-3 | Teste unitário da função de calendário com relógio simulado (arquivo novo, ex. `src/game/systems/WorldEventSystem.test.ts`) |
| EV-4, EV-5, EV-6 | Teste unitário dos multiplicadores; padrão de `LootSystem.test.ts` e `LightingSystem.test.ts` |
| EV-7, EV-8 | Teste de sistema e passo manual alternando as configurações |
| Atmosfera e game feel | Não validado: precisa de playtest humano (testar em mais de um bioma) |

## Questões em aberto
1. Decisões 1 a 10 sem resposta; valores numéricos vêm da proposta original e não têm aprovação.
2. Agenda (cadência do Eclipse, datas sazonais, fuso) e formato do `worldEvents.json`: a definir.
3. Eventos sazonais pedem arte, status de congelamento e feitiço novos que não existem.
4. Cerco depende de combate na Room 0 e de efeito em lojas, sem spec de Safe House que o suporte; "cooperativo" não existe no jogo.
5. Fonte de tempo (decisão 3) e comportamento offline/PWA.

## Pendências para promover a backlog
- Aprovação do responsável; ADRs 0001, 0005 e 0012 aprovados.
- Decisões 1 a 10 e questões 1 a 5 resolvidas; dividir por evento (a spec atual é um épico).
- Remover "(provisório)" dos critérios e preencher *Arquivos e contratos*.

## Referências
- [world-generation.md](../../gameplay/world-generation.md), [enemies-and-bestiary.md](../../gameplay/enemies-and-bestiary.md), [lighting-and-effects.md](../../gameplay/lighting-and-effects.md)
- [feature-atmosfera-e-tensao.md](feature-atmosfera-e-tensao.md)
