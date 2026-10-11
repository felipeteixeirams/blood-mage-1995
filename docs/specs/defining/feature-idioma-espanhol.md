# Idioma espanhol

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Estado vs código:** verificado em 2026-10-11 (leitura estática): só existem `pt-BR` e `en-US` (`src/types/game.ts:250`, `src/i18n/ptBR.ts`, `enUS.ts`). Faltam o dicionário espanhol, o registro em `translations`, o valor em `Language`/`SettingsSchema.language` e a opção no seletor da `SettingsScene`. Não validado em execução.
**Origem:** dividida da spec feature-polimento-de-producao-pwa-e-steam (2026-10-11)

## Contexto
O jogo tem pt-BR e en-US com fallback para pt-BR ([i18n](../../ui/i18n.md)). Esta spec adiciona o terceiro idioma. É independente das specs de empacotamento ([TWA](feature-empacotamento-twa-play-store.md), [Steam](feature-empacotamento-steam-electron.md), [privacidade](feature-politica-de-privacidade.md)) e pode ser entregue sozinha.
- `Language` é `'pt-BR' | 'en-US'` (`src/types/game.ts:250`); `SettingsSchema.language` usa `z.enum` com os mesmos dois (`localStorage.ts:223`); o seletor da `SettingsScene` é binário (`:380`) e o rótulo só conhece PT-BR e EN-US (`:454`).

## Objetivo
O jogo pode ser jogado em espanhol, escolhido nas configurações.

## Decisões de que depende
Nenhuma. As decisões abaixo são só desta spec.

## Fatos técnicos verificados
| Afirmação | Fonte | Verificado em |
|---|---|---|
| `Language` só lista pt-BR e en-US; schema e seletor idem | `src/types/game.ts:250`; `src/utils/localStorage.ts:223`; `SettingsScene.ts:380,454` | 2026-10-11 |
| Dicionários têm 147 chaves em `ptBR.ts` e `enUS.ts`; `enUS` é tipado por `TranslationDictionary` | `src/i18n/ptBR.ts`, `enUS.ts`; [i18n](../../ui/i18n.md) | 2026-10-11 |

## Decisões a confirmar
| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| 1 | Idioma espanhol: código e escopo (decisão 2 da original) | A) `es-ES`; B) `es-419`; C) não adicionar | B: público latino-americano; confirmar o mercado-alvo |
| 2 | Origem da tradução (decisão 3) | A) tradução humana; B) assistida por IA com revisão | B com revisão: 147 chaves, baixo risco |
| 3 | Textos fora do i18n (HUD, menus em pt-BR fixo) (decisão 4) | A) fora de escopo; B) migrar para `t()` | A: já é lacuna de en-US; migrar é outra spec |
| 4 | Seletor de idioma (decisão 5) | A) ciclo pt-BR, en-US, es; B) lista | A: menor mudança na `SettingsScene` |

## Escopo
- Dicionário `src/i18n/esXX.ts` com as 147 chaves, registro em `translations`, `Language`, `SettingsSchema.language` e ciclo no seletor da `SettingsScene` (conforme as decisões 1 a 4).
- Teste do novo idioma em `src/i18n/i18n.test.ts`.

## Fora de escopo
- Migração de textos fixos para o i18n (decisão 3, opção A recomendada); empacotamento nas lojas (specs de empacotamento).

## Arquivos e contratos
- Criar: `src/i18n/<codigo-do-idioma>.ts` (decisão 1).
- Alterar: `src/types/game.ts`, `src/i18n/index.ts`, `src/utils/localStorage.ts` (arquivo crítico: ver [risky-files](../../engineering/risky-files.md)), `src/game/scenes/SettingsScene.ts`, `src/i18n/i18n.test.ts`.
- Atualizar no mesmo commit: `docs/ui/i18n.md` e `Verificado em`.
- Contrato: o valor persistido de `settings.language` inválido volta para `pt-BR` (comportamento atual do schema).

## Critérios de aceite
- **ES-1** Quando o jogador escolhe espanhol nas configurações, o i18n deve devolver o texto em espanhol para toda chave de `TranslationDictionary` (provisório). *(PP-1)*
- **ES-2** Se uma chave falta no dicionário espanhol, então o i18n deve usar o texto em pt-BR (comportamento atual de fallback). *(PP-2)*
- **ES-3** Quando o jogador aciona o seletor de idioma, a `SettingsScene` deve avançar pt-BR, en-US, espanhol e voltar a pt-BR (provisório). *(PP-3)*
- **ES-4** Se o `localStorage` guarda um idioma não suportado, então o `SettingsSchema` deve restaurar `pt-BR`. *(PP-4)*

## Plano de verificação
| Critério | Como verificar |
|---|---|
| ES-1, ES-2, ES-4 | teste em `src/i18n/i18n.test.ts` e teste do schema |
| ES-3 | teste unitário do ciclo (extrair a lógica da `SettingsScene`); manual no menu |
| Qualidade da tradução | não validado: precisa de revisão humana |

## Questões em aberto
- Decisões 1 a 4 sem resposta.
- Código do idioma, revisor da tradução e prazo: a definir.
- Quais dos 9 valores idênticos nos dois dicionários (`mainMenu.title` etc.) devem repetir em espanhol.

## Pendências para promover a backlog
- Aprovação do responsável.
- Decisões 1 a 4 respondidas; questões em aberto fechadas.
- Origem: parte de discovery; depende de decisão de produto sobre mercado-alvo.

## Referências
- [i18n](../../ui/i18n.md), [release-strategy](../../product/release-strategy.md)
- Spec original dividida: feature-polimento-de-producao-pwa-e-steam (removida)
