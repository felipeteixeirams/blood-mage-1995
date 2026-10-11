# Empacotamento Steam com Electron

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Estado vs código:** verificado em 2026-10-11 (leitura estática): `scripts/build-steam.sh` existe, instala `electron` e `electron-builder` sob demanda e cria `electron-builder.yml` cujo `files` lista `main.js`, que não existe. `electron` não está em `package.json`. Faltam `main.js`, `electron-builder.yml` versionados e as dependências. Não validado em execução.
**Origem:** dividida da spec feature-polimento-de-producao-pwa-e-steam (2026-10-11)

## Contexto
Canal Steam do [ADR 0010](../../decisions/0010-canais-de-distribuicao.md). Independe das specs de [espanhol](feature-idioma-espanhol.md) e [TWA](feature-empacotamento-twa-play-store.md). A [política de privacidade](feature-politica-de-privacidade.md) é pedida pela loja, mas não bloqueia o instalador. O PWA já existe ([pwa](../../operations/pwa.md)); defeitos em [bug-pwa-manifest-e-service-worker.md](bug-pwa-manifest-e-service-worker.md).

## Objetivo
Existe um projeto Electron reprodutível que gera o instalador a partir de configuração versionada.

## Decisões de que depende
| ADR | Assunto | Status |
|---|---|---|
| [0010](../../decisions/0010-canais-de-distribuicao.md) | Canais: PWA, TWA/Play Store e Steam | Proposta |
| [0011](../../decisions/0011-conta-e-dados-do-jogador.md) | Conta e dados (Cloud Save fica fora) | Proposta |
| [0012](../../decisions/0012-monetizacao-preco-e-metas-de-retencao.md) | Preço e monetização (Steam) | Proposta |

## Fatos técnicos verificados
| Afirmação | Fonte | Verificado em |
|---|---|---|
| `electron` não está em `package.json`; `electron-builder.yml` e `main.js` não existem | `package.json`; `ls` na raiz | 2026-10-11 |
| `build-steam.sh` usa `npm` e cria config padrão sob demanda | `scripts/build-steam.sh` | 2026-10-11 |
| `package.json` está em `version: 0.0.0` | `package.json` | 2026-10-11 |
| Compatibilidade do Phaser 4.2.1 com Electron e requisitos da Steam | não verificado (fonte primária pendente) | — |

## Decisões a confirmar
| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| 1 | Canais a empacotar (decisão 1 da original) | A) só TWA; B) só Steam; C) ambos; D) nenhum por ora | Seguir o ADR 0010 (recomendação A dele: só PWA por ora); esta spec só entra após a aprovação |
| 2 | Identificador de pacote (decisão 6) | A) `com.felipeteixeira.bloodmage1995` (padrão do script); B) outro | Responsável confirma se é o real |
| 3 | Steam: Electron ou web wrapper (decisão 7) | A) Electron; B) outro wrapper | A: já previsto pelo script; verificar compatibilidade |
| 4 | Integração Steamworks (conquistas, nuvem) (decisão 8) | A) fora desta spec; B) incluir | A: é escopo novo |
| 5 | Assinatura e custódia de certificados (decisão 10) | definir quem guarda e onde | responsável decide; nunca no repositório |

## Escopo
- Dependências `electron` e `electron-builder` em `package.json`.
- `main.js` e `electron-builder.yml` versionados; `build-steam.sh` sem instalação nem criação sob demanda.

## Fora de escopo
- Publicação na Steam, preço, classificação etária, integração Steamworks (decisão 4, opção A), Cloud Save ([feature-cloud-save.md](feature-cloud-save.md)).

## Arquivos e contratos
- Criar: `electron-builder.yml`, `main.js` na raiz.
- Alterar: `scripts/build-steam.sh`, `package.json`.
- Atualizar no mesmo commit: `docs/operations/build-scripts.md`, `docs/product/release-strategy.md` e `Verificado em`.
- Não tocar: `vite.config.ts` e `public/manifest.webmanifest`.
- Contrato: saída em `dist/electron/`; `appId` conforme a decisão 2.

## Critérios de aceite
- **STM-1** Quando `build-steam.sh` roda, o script deve gerar o instalador em `dist/electron/` usando `main.js` e `electron-builder.yml` versionados (provisório). *(PP-7)*
- **STM-2** Quando o app Electron inicia, o `main.js` deve carregar o jogo de `dist/` sem rede (provisório). *(PP-8)*

## Plano de verificação
| Critério | Como verificar |
|---|---|
| STM-1, STM-2 | execução manual em máquina com Electron: não validado, depende de ambiente |
| Comportamento no Windows | não validado: precisa de playtest humano |

## Questões em aberto
- Decisões 1 a 5 sem resposta; sem a decisão 1 aprovada, STM-1 e STM-2 não têm escopo.
- Compatibilidade de Electron com a stack atual (Phaser 4.2.1) e requisitos da Steam: sem fonte primária.
- Certificado de assinatura real: do responsável.

## Pendências para promover a backlog
- Aprovação do responsável; ADRs 0010, 0011 e 0012 Aprovados.
- Decisões 1 a 5 respondidas; questões fechadas; fatos verificados em fonte primária.
- Parte de discovery: depende de decisão de produto sobre canais.

## Referências
- [pwa](../../operations/pwa.md), [build-scripts](../../operations/build-scripts.md), [release-strategy](../../product/release-strategy.md)
- [bug-pwa-manifest-e-service-worker.md](bug-pwa-manifest-e-service-worker.md), [ADR 0010](../../decisions/0010-canais-de-distribuicao.md)
- Spec original dividida: feature-polimento-de-producao-pwa-e-steam (removida)
