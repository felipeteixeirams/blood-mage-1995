# Empacotamento TWA para a Play Store

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Estado vs código:** verificado em 2026-10-11 (leitura estática): `scripts/build-twa.sh` existe, exige `bubblewrap` no PATH (sai com 1 se ausente), roda `npm run build` e cria `twa-manifest.json` padrão sob demanda com `sha256Fingerprints` de placeholder e identificadores fixos (`com.felipeteixeira.bloodmage1995`, `bloodmage-1995.vercel.app`). Falta `twa-manifest.json` versionado. Não validado em execução.
**Origem:** dividida da spec feature-polimento-de-producao-pwa-e-steam (2026-10-11)

## Contexto
Canal TWA/Play Store do [ADR 0010](../../decisions/0010-canais-de-distribuicao.md). Depende da [política de privacidade](feature-politica-de-privacidade.md) (a Play Store exige a URL) e dos defeitos do manifest e do service worker em [bug-pwa-manifest-e-service-worker.md](bug-pwa-manifest-e-service-worker.md) (não repetidos aqui). Independe das specs de [espanhol](feature-idioma-espanhol.md) e [Steam](feature-empacotamento-steam-electron.md).

## Objetivo
Existe um projeto TWA reprodutível que gera o pacote Android a partir de configuração versionada.

## Decisões de que depende
| ADR | Assunto | Status |
|---|---|---|
| [0010](../../decisions/0010-canais-de-distribuicao.md) | Canais: PWA, TWA/Play Store e Steam | Proposta |
| [0011](../../decisions/0011-conta-e-dados-do-jogador.md) | Conta e dados (Cloud Save fica fora) | Proposta |
| [0004](../../decisions/0004-controles-mobile-e-orientacao.md) | Orientação paisagem (manifest e TWA) | Proposta |
| [0012](../../decisions/0012-monetizacao-preco-e-metas-de-retencao.md) | Preço e monetização (Play) | Proposta |

## Fatos técnicos verificados
| Afirmação | Fonte | Verificado em |
|---|---|---|
| `twa-manifest.json` não existe | `ls` na raiz | 2026-10-11 |
| `build-twa.sh` usa `npm` e cria config padrão sob demanda | `scripts/build-twa.sh` | 2026-10-11 |
| `build-twa.sh` exige `bubblewrap` no PATH e sai com erro 1 se ausente | `scripts/build-twa.sh` | 2026-10-11 |
| `package.json` está em `version: 0.0.0` | `package.json` | 2026-10-11 |
| Compatibilidade do Bubblewrap e requisitos da Play Store | não verificado (fonte primária pendente) | — |

## Decisões a confirmar
| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| 1 | Canais a empacotar (decisão 1 da original) | A) só TWA; B) só Steam; C) ambos; D) nenhum por ora | Seguir o ADR 0010 (recomendação A dele: só PWA por ora); esta spec só entra após a aprovação |
| 2 | Identificador de pacote e domínio (decisão 6) | A) `com.felipeteixeira.bloodmage1995` e `bloodmage-1995.vercel.app` (padrões dos scripts); B) outros | Responsável confirma se são os reais |
| 3 | Assinatura e custódia de chaves (`.jks`) (decisão 10) | definir quem guarda e onde | responsável decide; nunca no repositório |

## Escopo
- `twa-manifest.json` versionado com os valores da decisão 2.
- `scripts/build-twa.sh` sem criação de arquivo padrão.

## Fora de escopo
- Publicação na loja, preço, classificação etária; manifest, ícones e service worker (spec de bug do PWA); política de privacidade ([spec própria](feature-politica-de-privacidade.md)); Cloud Save ([feature-cloud-save.md](feature-cloud-save.md)).

## Arquivos e contratos
- Criar: `twa-manifest.json` na raiz.
- Alterar: `scripts/build-twa.sh`, `package.json` se necessário.
- Atualizar no mesmo commit: `docs/operations/build-scripts.md`, `docs/product/release-strategy.md` e `Verificado em`.
- Não tocar: `vite.config.ts` e `public/manifest.webmanifest`.
- Contrato: fingerprint e chave reais não entram no repositório sem a decisão 3.

## Critérios de aceite
- **TWA-1** Quando `build-twa.sh` roda com Bubblewrap instalado, o script deve gerar o pacote Android a partir do `twa-manifest.json` versionado, sem criar arquivo padrão (provisório). *(PP-5)*
- **TWA-2** Se o Bubblewrap não está instalado, então `build-twa.sh` deve sair com código 1 e mensagem de instalação (comportamento atual). *(PP-6)*

## Plano de verificação
| Critério | Como verificar |
|---|---|
| TWA-1 | execução manual em máquina com Bubblewrap: não validado, depende de ambiente |
| TWA-2 | executar o script sem Bubblewrap e conferir código de saída 1 |
| Comportamento no aparelho Android | não validado: precisa de playtest humano |

## Questões em aberto
- Decisões 1 a 3 sem resposta; sem a decisão 1 aprovada, TWA-1 e TWA-2 não têm escopo.
- Compatibilidade do Bubblewrap com a stack atual e requisitos da Play Store: sem fonte primária.
- Fingerprint e chave de assinatura reais: do responsável.

## Pendências para promover a backlog
- Aprovação do responsável; ADRs 0010, 0011, 0004 e 0012 Aprovados.
- Decisões 1 a 3 respondidas; questões fechadas; fatos verificados em fonte primária.
- Spec de [política de privacidade](feature-politica-de-privacidade.md) promovida antes.
- Parte de discovery: depende de decisão de produto sobre canais.

## Referências
- [pwa](../../operations/pwa.md), [build-scripts](../../operations/build-scripts.md), [release-strategy](../../product/release-strategy.md)
- [bug-pwa-manifest-e-service-worker.md](bug-pwa-manifest-e-service-worker.md), [ADR 0010](../../decisions/0010-canais-de-distribuicao.md)
- Spec original dividida: feature-polimento-de-producao-pwa-e-steam (removida)
