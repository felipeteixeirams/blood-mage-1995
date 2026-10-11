# Cloud save automatizado

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Estado vs código:** verificado em 2026-10-11 (leitura estática): não implementado. Não há login, conta, identificador de jogador nem dependência de auth/nuvem em `package.json` e `src/`; o único armazenamento de progresso é `localStorage` via `src/utils/localStorage.ts` (15 chaves, ver `docs/architecture/persistence.md`). `src/utils/SaveMigration.ts` (envelope versionado) existe, mas nenhum arquivo de `src/` o importa. Falta tudo: identidade, armazenamento remoto, sincronização, política de privacidade e exclusão de dados.

## Contexto
- Item "Nice to Have" da Fase 5 ([feature-idioma-espanhol.md](feature-idioma-espanhol.md) (Fase 5, dividida)). O jogo é 100% offline e o progresso se perde ao limpar o navegador ou trocar de aparelho.
- Proposta original: login com provedor de identidade gerando `Player ID`, save multiplataforma sincronizado com o `localStorage` e Privacy Policy com exclusão de dados. Contexto: [account-and-data.md](../../product/account-and-data.md) e [persistence.md](../../architecture/persistence.md).
- O ADR 0011 compara manter só local (A), exportar/importar arquivo (B) e conta com nuvem (C). Está **Proposta**, com recomendação pela opção A. Esta spec só vale se o responsável escolher C.

## Objetivo
Se aprovado, o jogador entra com uma conta e o progresso salvo no aparelho é sincronizado entre aparelhos, mantendo o jogo jogável offline e sem conta.

## Decisões de que depende
| ADR | Assunto | Status |
|---|---|---|
| [0011](../../decisions/0011-conta-e-dados-do-jogador.md) | Conta e dados: save local ou nuvem | **Proposta** (não aprovada; bloqueia esta spec) |

## Fatos técnicos verificados
| Afirmação | Fonte | Verificado em |
|---|---|---|
| Sem auth/Supabase/Firebase/`playerId` em `src/` e `package.json` | `grep -rniE "firebase\|supabase\|oauth\|cloud.?save\|playerId" src package.json` sem resultado | 2026-10-11 |
| Progresso só em `localStorage`, via pares `loadX`/`saveX` com Zod | `src/utils/localStorage.ts` | 2026-10-11 |
| `SaveMigration.ts` não é importado por `src/` | `docs/architecture/persistence.md` (grep) | 2026-10-11 |
| `lib/db` e `artifacts/api-server` existem e `src/` não os importa | `docs/product/account-and-data.md` | 2026-10-11 |

## Decisões a confirmar
| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| 1 | O jogo terá conta e nuvem? | A) só local; B) exportar/importar arquivo; C) conta + nuvem | A (B se houver demanda): custo, privacidade e segurança sem demanda comprovada (ADR 0011) |
| 2 | Condição de demanda para avançar | a) validação no Beta; b) decisão direta do responsável | a, com métrica definida pelo responsável |
| 3 | Provedor de identidade e de armazenamento | Google Sign-in, Firebase/Firestore, Supabase ou equivalente (exemplos, nada escolhido) | Só depois da decisão 1; preferir o que o responsável já opera |
| 4 | Resolução de conflito save local x nuvem | a) mais recente vence; b) maior progresso; c) jogador escolhe | c: evita perder progresso sem aviso |
| 5 | Privacy Policy e exclusão de dados | texto e fluxo próprios | Obrigatória com login; conteúdo é do responsável |

## Escopo
Só se as decisões 1 a 5 forem aprovadas:
- Login com o provedor escolhido, gerando um identificador de jogador.
- Sincronização das áreas de `localStorage.ts` com o armazenamento remoto.
- Jogo continua funcional offline e sem conta (fallback local).
- Privacy Policy e fluxo de exclusão de dados.

## Fora de escopo
- Ranking global e anticheat (o ADR 0011 cita o risco de ranking trapaceável).
- Monetização ([discovery-app-mobile-e-monetizacao.md](discovery-app-mobile-e-monetizacao.md)) e cooperativo ([discovery-multijogador-cooperativo.md](discovery-multijogador-cooperativo.md)).
- Qualquer código antes da aprovação.

## Arquivos e contratos
- A definir após as decisões 1, 3 e 4. Ponto de integração provável: `src/utils/localStorage.ts` (todo acesso a `localStorage` passa por ele). Ler `docs/engineering/risky-files.md` antes de tocar `gameStore.ts` ou `localStorage.ts`.
- Contratos (formato do save remoto, endpoints, variáveis de ambiente, tabelas, migrations): a definir conforme o provedor.

## Critérios de aceite
- **CS-1** Onde a conta estiver habilitada, quando o jogador concluir o login, o sistema de cloud save deve associar o progresso local a um identificador de jogador (provisório).
- **CS-2** Quando o progresso local mudar com a sessão autenticada, o sistema de cloud save deve gravar o estado no armazenamento remoto (provisório).
- **CS-3** Se o jogador não tem conta ou está sem rede, então o jogo deve continuar lendo e gravando só em `localStorage`, sem erro visível (provisório).
- **CS-4** Se a gravação remota falhar, então o sistema de cloud save deve manter o save local íntegro e tentar de novo depois (provisório).
- **CS-5** Se o save local e o remoto divergirem no login, então o sistema de cloud save deve aplicar a regra aprovada na decisão 4 sem descartar o save local antes da confirmação (provisório).
- **CS-6** Quando o jogador pedir exclusão dos dados, o sistema de cloud save deve remover os dados remotos dele (provisório).
- **CS-7** O jogo deve exibir link para a Privacy Policy antes do login (provisório).

## Plano de verificação
| Critério | Como verificar |
|---|---|
| CS-1, CS-2, CS-5, CS-6 | Teste de integração com provedor simulado (arquivo a definir) |
| CS-3, CS-4 | Teste unitário com rede/provedor falhando; save local inalterado |
| CS-7 | Passo manual na tela de login |
| Fluxo completo de login | Não validado: depende do provedor escolhido |

## Questões em aberto
1. Decisões 1 a 5 sem resposta.
2. Provedor, formato do save remoto, custos e limites: não consultados (verificar em fonte primária).
3. Quais áreas de `localStorage.ts` sincronizam e como versionar o save (hoje nenhuma área tem versão).
4. Texto e jurisdição da Privacy Policy (LGPD).
5. Se `lib/db` e `artifacts/api-server` seriam reaproveitados.

## Pendências para promover a backlog
- Aprovação do responsável e ADR 0011 **Aprovado** com a opção C.
- Decisões 1 a 5 e questões 1 a 5 resolvidas; fatos do provedor verificados com fonte e data.
- Preencher *Arquivos e contratos* e remover "(provisório)" dos critérios.

## Referências
- [ADR 0011](../../decisions/0011-conta-e-dados-do-jogador.md), [account-and-data.md](../../product/account-and-data.md), [persistence.md](../../architecture/persistence.md)
- [feature-idioma-espanhol.md](feature-idioma-espanhol.md) (Fase 5, dividida)
