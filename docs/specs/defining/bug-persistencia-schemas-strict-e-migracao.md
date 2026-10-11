# Persistência: schemas strict, migração sem uso e gravações sem schema (bug)

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Estado vs código:** verificado em 2026-10-11 (leitura estática): bug confirmado em `src/utils/localStorage.ts` (`SettingsSchema`, `TalentLevelsSchema`, `OnboardingSchema`, `CodexStateSchema`, `CampaignStateSchema`, `AchievementProgressRecordSchema`, `saveOnboarding`, `saveDroppedCorpseState`, `PrestigeDataSchema`) e `src/utils/SaveMigration.ts`. Não validado em execução.

## Contexto
Hoje (ver [persistência](../../architecture/persistence.md)):
- **`.strict()` em dado gravado.** Os schemas acima usam `.strict()`. Uma chave a mais (save de versão futura ou antiga) faz `safeParse` falhar e o load devolve o padrão do objeto inteiro. `loadTalentLevels` e `loadPrestigeData` regravam o padrão na hora; `loadSettings` não regrava, mas o `saveSettings` seguinte grava o estado em memória (padrão) por cima do salvo. Dado do jogador perdido.
- **`SaveMigration.ts` sem uso.** Nenhum arquivo de `src/`, `scripts/`, `tests/` ou `api/` importa `loadWithMigration` ou `saveWithEnvelope` (grep). Nenhuma área tem versão de save. `saveWithEnvelope` grava `{...valor, version, payload: valor}` para objetos (dado duplicado na raiz e no `payload`) e acessa `localStorage` fora do módulo principal.
- **Gravações sem schema.** `saveOnboarding(state: any)` grava direto, sem `OnboardingSchema`. `saveDroppedCorpseState(corpse: any)` grava o objeto original se o parse falhar (`validated.success ? validated.data : corpse`), contrariando o padrão "inválido grava o padrão" dos demais.
- **Conquistas em duas chaves.** `bloodmage_1995_achievements` (store: `loadAchievements`, formato `{id, unlocked, redeemed}`) e `bloodmage_1995_achievements_progress` (`AchievementSystem.ts`: `loadAchievementProgress`, formato `{id, unlockedAt, progress, complete}`). O comentário no código admite a coexistência e deixa a unificação fora de escopo. Há ainda a chave legada `achievements_progress`, migrada no load.
- **`usePWA` direto.** `src/hooks/usePWA.ts` lê, grava e remove `bloodmage_pwa_install_dismissed` com `localStorage` direto, sem Zod (regra do CLAUDE.md: todo acesso passa por `localStorage.ts`). O hook não está montado (ver [bug-distribuicao-pwa-manifest-e-service-worker](bug-distribuicao-pwa-manifest-e-service-worker.md)).
- **Prestígio.** `PrestigeDataSchema.unspentSealPoints` tem `.max(10).catch(0)`. `performPrestige` (`gameStore.ts` l.823) soma 1 por prestígio e `level` é limitado a 10, mas nada limita `unspent`: sem alocar selo, o valor passa de 10 e o load seguinte zera os pontos. Alcance prático baixo (exige mais de 10 prestígios sem alocar); não validado em execução.

## Objetivo
**Proposta:** chave desconhecida não apaga dado válido; toda gravação passa por schema; há um único caminho de versão/migração (ou nenhum código morto); conquistas têm um formato; nenhum ponto zera pontos de prestígio por limite.

## Decisões a confirmar
| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| 1 | Chave desconhecida | A) `.strip()` (descarta a chave, mantém o resto); B) `.passthrough()`; C) manter `.strict()` | A: mantém o dado válido e evita poluição de protótipo |
| 2 | `SaveMigration.ts` | A) remover; B) adotar nas áreas com envelope `{version, payload}` | A agora (nenhuma área tem versão); B só com ADR de versionamento, corrigindo a duplicação raiz+`payload` |
| 3 | Conquistas | A) unificar em uma chave com migração das duas; B) manter duas e documentar | B enquanto o bug de conquistas inalcançáveis não for resolvido; A depois, junto dele |
| 4 | Limite de `unspentSealPoints` | A) remover o `.max(10)`; B) limitar `performPrestige`; C) manter | A: o valor legítimo não tem teto de design conhecido; valor do teto é do responsável |
| 5 | Falha de parse ao carregar | A) não regravar o padrão e preservar o bruto (ex.: chave `*_backup`); B) regravar o padrão como hoje | A: evita perda silenciosa |
| 6 | `usePWA` | A) mover a chave para `localStorage.ts` com schema; B) remover o hook com o banner | Segue a decisão da spec de PWA |

## Escopo
- Aplicar a decisão 1 aos schemas listados; decisão 5 aos loads.
- `saveOnboarding` e `saveDroppedCorpseState` validam e, se inválido, gravam o padrão (sem `any`).
- Decisões 2, 3, 4 e 6.

## Fora de escopo
- Conta, nuvem e cloud save ([feature-persistencia-cloud-save](feature-persistencia-cloud-save.md)).
- Corrigir o conteúdo das conquistas ([bug-progressao-conquistas-e-codice-inalcancaveis](bug-progressao-conquistas-e-codice-inalcancaveis.md)).
- Mudar valores de balance.

## Arquivos e contratos
- Alterar: `src/utils/localStorage.ts`, `src/utils/localStorage.test.ts`; conforme decisões: `src/utils/SaveMigration.ts` (remover), `src/hooks/usePWA.ts`, `src/store/gameStore.ts` (só se o limite de prestígio for movido).
- Atualizar no mesmo commit: `docs/architecture/persistence.md`.
- Não tocar: `src/game/**`.
- Contrato: loads nunca lançam; saves nunca gravam objeto que falhou no schema.

## Critérios de aceite (provisórios)
- **PS-1** Quando `bloodmage_1995_settings` contiver todas as chaves válidas mais uma desconhecida, o `loadSettings` deve devolver os valores salvos, sem a chave extra.
- **PS-2** Quando o `saveSettings` for chamado depois do `PS-1`, o sistema não deve sobrescrever os valores do jogador pelos padrões.
- **PS-3** Quando `saveOnboarding` receber objeto inválido, o sistema deve gravar o padrão validado.
- **PS-4** Quando `saveDroppedCorpseState` receber objeto inválido, o sistema deve gravar o padrão (sem corpo), nunca o original.
- **PS-5** Quando o JSON salvo for ilegível, o `load` deve devolver o padrão e preservar o bruto conforme a decisão 5.
- **PS-6** Quando `unspentSealPoints` for 11, o `loadPrestigeData` deve preservar o valor conforme a decisão 4.
- **PS-7** Onde a decisão 2 for A, o repositório não deve conter `SaveMigration.ts` nem importá-lo.

## Plano de verificação
| Critério | Como verificar |
|---|---|
| PS-1, PS-2, PS-5, PS-6 | teste em `src/utils/localStorage.test.ts` com `localStorage` simulado |
| PS-3, PS-4 | idem, entradas inválidas |
| PS-7 | `grep -rn SaveMigration src` vazio; `pnpm run typecheck` |

Rodar `pnpm run test`, `pnpm run typecheck`, `pnpm run docs:check`.

## Questões em aberto
- Há saves reais com chave extra em produção? (sem telemetria para saber)
- Qual o teto de design de selos não gastos?

## Referências
[persistência](../../architecture/persistence.md), [conta e dados](../../product/account-and-data.md), [risky-files](../../engineering/risky-files.md), [ADR 0011](../../decisions/0011-conta-e-dados-do-jogador.md).
