# Política de privacidade

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Estado vs código:** verificado em 2026-10-11 (leitura estática): não há política de privacidade em `src/`, `public/` nem `vercel.json`; `public/` tem `assets`, `audio_samples`, `favicon.svg`, `fonts`, `icon-*.png`, `manifest.webmanifest`, `robots.txt`. Falta `public/privacy.html` (se a decisão 1 for A). Não validado em execução.
**Origem:** dividida da spec feature-polimento-de-producao-pwa-e-steam (2026-10-11)

## Contexto
A Play Store exige uma URL de política de privacidade (a spec de [TWA](feature-empacotamento-twa-play-store.md) depende desta). A Steam também pede uma para a página da loja ([Steam](feature-empacotamento-steam-electron.md)). Esta spec entrega só a página; o conteúdo jurídico e os dados coletados são do responsável. O endpoint de log ([ADR 0008](../../decisions/0008-endpoint-api-log.md)) e o Cloud Save ([feature-cloud-save.md](feature-cloud-save.md)) afetam o que a política deve declarar.

## Objetivo
O site serve uma política de privacidade em URL pública estável.

## Decisões de que depende
| ADR | Assunto | Status |
|---|---|---|
| [0010](../../decisions/0010-canais-de-distribuicao.md) | Canais: PWA, TWA/Play Store e Steam | Proposta |
| [0011](../../decisions/0011-conta-e-dados-do-jogador.md) | Conta e dados (Cloud Save fica fora) | Proposta |

## Fatos técnicos verificados
| Afirmação | Fonte | Verificado em |
|---|---|---|
| Sem menção a política de privacidade em `src/`, `public/`, `vercel.json` | `grep -rniE "privacy\|privacidade" src public vercel.json` | 2026-10-11 |
| Requisitos de política de privacidade da Play Store e da Steam | não verificado (fonte primária pendente) | — |

## Decisões a confirmar
| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| 1 | Política de privacidade (decisão 9 da original) | A) página em `public/` servida no site; B) externa | A: a Play Store exige URL |
| 2 | Canais que exigem a política (decisão 1 da original) | A) só TWA; B) só Steam; C) ambos; D) nenhum por ora | Seguir o [ADR 0010](../../decisions/0010-canais-de-distribuicao.md) (recomendação A dele: só PWA por ora); esta spec só entra após a aprovação |

## Escopo
- Página `public/privacy.html` na URL definida na decisão 1, com o texto fornecido pelo responsável.

## Fora de escopo
- Redação jurídica (do responsável); termos de uso; consentimento de cookies; empacotamento; Cloud Save.

## Arquivos e contratos
- Criar: `public/privacy.html` (decisão 1).
- Não tocar: `vite.config.ts` e `public/manifest.webmanifest` (spec de bug do PWA: [bug-pwa-manifest-e-service-worker.md](bug-pwa-manifest-e-service-worker.md)).
- Atualizar no mesmo commit: `docs/operations/pwa.md` ou `docs/product/release-strategy.md` e `Verificado em`.
- Contrato: a URL é pública, sem autenticação e sem redirecionamento para o jogo.

## Critérios de aceite
- **PRV-1** O servidor web deve servir a política de privacidade na URL definida na decisão 1 (provisório). *(PP-9)*

## Plano de verificação
| Critério | Como verificar |
|---|---|
| PRV-1 | `curl` na URL publicada ou preview da Vercel |

## Questões em aberto
- Decisões 1 e 2 sem resposta; sem canal aprovado, a spec não tem escopo.
- Texto da política e dados declarados (log, Cloud Save): do responsável.
- Requisitos da Play Store e da Steam: sem fonte primária.

## Pendências para promover a backlog
- Aprovação do responsável; ADRs 0010 e 0011 Aprovados.
- Decisões 1 e 2 respondidas; fatos verificados em fonte primária.
- Parte de discovery: depende de decisão de produto sobre canais.

## Referências
- [release-strategy](../../product/release-strategy.md), [pwa](../../operations/pwa.md)
- Spec original dividida: feature-polimento-de-producao-pwa-e-steam (removida)
