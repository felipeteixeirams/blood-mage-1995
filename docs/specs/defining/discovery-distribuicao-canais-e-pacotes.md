# Distribuição: canais e pacotes (TWA, Steam, privacidade)

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Estado vs código:** verificado em 2026-10-11 (leitura estática): `scripts/build-twa.sh` existe, exige `bubblewrap` no PATH (sai com 1 se ausente), roda `npm run build` e cria `twa-manifest.json` padrão sob demanda com `sha256Fingerprints` de placeholder e identificadores fixos (`com.felipeteixeira.bloodmage1995`, `bloodmage-1995.vercel.app`); falta `twa-manifest.json` versionado. `scripts/build-steam.sh` existe, instala `electron` e `electron-builder` sob demanda e cria `electron-builder.yml` cujo `files` lista `main.js`, que não existe; `electron` não está em `package.json`; faltam `main.js`, `electron-builder.yml` e as dependências. Não há política de privacidade em `src/`, `public/` nem `vercel.json`; `public/` tem `assets`, `audio_samples`, `favicon.svg`, `fonts`, `icon-*.png`, `manifest.webmanifest`, `robots.txt`; falta `public/privacy.html` (se a decisão 6 for A). Nada validado em execução.
**Origem:** consolidada de feature-empacotamento-twa-play-store, feature-empacotamento-steam-electron e feature-politica-de-privacidade (2026-10-11)

## Contexto
Discovery de distribuição fora do PWA, congelada até o [ADR 0010](../../decisions/0010-canais-de-distribuicao.md) ser aprovado; a recomendação do ADR é só PWA por ora, então nada aqui é implementável antes disso. Três entregas: pacote TWA para a Play Store, instalador Electron para a Steam e página pública de política de privacidade (a Play Store exige a URL; a Steam pede uma para a página da loja, mas ela não bloqueia o instalador). Ordem se TWA for aprovado: privacidade antes do TWA; Steam independe das demais. O endpoint de log ([ADR 0008](../../decisions/0008-endpoint-api-log.md)) e o [Cloud Save](feature-persistencia-cloud-save.md) afetam o que a política declara. O PWA já existe ([pwa](../../operations/pwa.md)); seus defeitos estão em [bug-distribuicao-pwa-manifest-e-service-worker.md](bug-distribuicao-pwa-manifest-e-service-worker.md) e não se repetem aqui. Independe de [feature-ui-idioma-espanhol.md](feature-ui-idioma-espanhol.md).

## Objetivo
Existem, para cada canal aprovado, configuração versionada e reprodutível que gera o pacote (Android TWA ou instalador Electron) e uma política de privacidade em URL pública estável.

## Decisões de que depende
| ADR | Assunto | Status |
|---|---|---|
| [0010](../../decisions/0010-canais-de-distribuicao.md) | Canais: PWA, TWA/Play Store e Steam | Proposta |
| [0011](../../decisions/0011-conta-e-dados-do-jogador.md) | Conta e dados (Cloud Save fica fora) | Proposta |
| [0004](../../decisions/0004-controles-mobile-e-orientacao.md) | Orientação paisagem (manifest e TWA) | Proposta |
| [0012](../../decisions/0012-monetizacao-preco-e-metas-de-retencao.md) | Preço e monetização (Play e Steam) | Proposta |

## Fatos técnicos verificados
| Afirmação | Fonte | Verificado em |
|---|---|---|
| `twa-manifest.json` não existe | `ls` na raiz | 2026-10-11 |
| `build-twa.sh` usa `npm`, cria config padrão sob demanda e exige `bubblewrap` no PATH (sai com 1 se ausente) | `scripts/build-twa.sh` | 2026-10-11 |
| `electron` não está em `package.json`; `electron-builder.yml` e `main.js` não existem | `package.json`; `ls` na raiz | 2026-10-11 |
| `build-steam.sh` usa `npm` e cria config padrão sob demanda | `scripts/build-steam.sh` | 2026-10-11 |
| `package.json` está em `version: 0.0.0` | `package.json` | 2026-10-11 |
| Sem menção a política de privacidade em `src/`, `public/`, `vercel.json` | `grep -rniE "privacy\|privacidade" src public vercel.json` | 2026-10-11 |
| Compatibilidade do Bubblewrap com a stack e requisitos da Play Store | não verificado (fonte primária pendente) | — |
| Compatibilidade do Phaser 4.2.1 com Electron e requisitos da Steam | não verificado (fonte primária pendente) | — |
| Requisitos de política de privacidade da Play Store e da Steam | não verificado (fonte primária pendente) | — |

## Decisões a confirmar
| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| 1 | Canais a empacotar (decisão 1 das originais) | A) só TWA; B) só Steam; C) ambos; D) nenhum por ora | Seguir o ADR 0010 (recomendação A dele: só PWA por ora); esta spec só entra após a aprovação |
| 2 | Identificador de pacote e domínio (decisão 6) | A) `com.felipeteixeira.bloodmage1995` e `bloodmage-1995.vercel.app` (padrões dos scripts); B) outros | Responsável confirma se são os reais |
| 3 | Assinatura e custódia de chaves e certificados (`.jks`, Steam) (decisão 10) | definir quem guarda e onde | Responsável decide; nunca no repositório |
| 4 | Steam: Electron ou web wrapper (decisão 7) | A) Electron; B) outro wrapper | A: já previsto pelo script; verificar compatibilidade |
| 5 | Integração Steamworks (conquistas, nuvem) (decisão 8) | A) fora desta spec; B) incluir | A: é escopo novo |
| 6 | Política de privacidade (decisão 9) | A) página em `public/` servida no site; B) externa | A: a Play Store exige URL |

## Escopo
Se o ADR 0010 aprovar canais:
- Privacidade: `public/privacy.html` na URL da decisão 6, com o texto fornecido pelo responsável.
- TWA: `twa-manifest.json` versionado com os valores da decisão 2; `scripts/build-twa.sh` sem criação de arquivo padrão.
- Steam: dependências `electron` e `electron-builder` em `package.json`; `main.js` e `electron-builder.yml` versionados; `build-steam.sh` sem instalação nem criação sob demanda.

## Fora de escopo
- Publicação nas lojas, preço, classificação etária; redação jurídica (do responsável), termos de uso, consentimento de cookies.
- Manifest, ícones e service worker ([bug-distribuicao-pwa-manifest-e-service-worker.md](bug-distribuicao-pwa-manifest-e-service-worker.md)).
- Integração Steamworks (decisão 5, opção A) e Cloud Save ([feature-persistencia-cloud-save.md](feature-persistencia-cloud-save.md)).

## Arquivos e contratos
- Criar: `public/privacy.html`, `twa-manifest.json` (raiz), `electron-builder.yml` e `main.js` (raiz), conforme os canais aprovados.
- Alterar: `scripts/build-twa.sh`, `scripts/build-steam.sh`, `package.json`.
- Atualizar no mesmo commit: [build-scripts](../../operations/build-scripts.md), [release-strategy](../../product/release-strategy.md), [pwa](../../operations/pwa.md) e `Verificado em`.
- Não tocar: `vite.config.ts` e `public/manifest.webmanifest`.
- Contratos: a URL da política é pública, sem autenticação e sem redirecionamento para o jogo; saída do Electron em `dist/electron/` com `appId` conforme a decisão 2; fingerprint, chave e certificado reais não entram no repositório sem a decisão 3.

## Critérios de aceite
- **DIST-1** O servidor web deve servir a política de privacidade na URL definida na decisão 6 (provisório). *(PRV-1, PP-9)*
- **DIST-2** Quando `build-twa.sh` roda com Bubblewrap instalado, o script deve gerar o pacote Android a partir do `twa-manifest.json` versionado, sem criar arquivo padrão (provisório). *(TWA-1, PP-5)*
- **DIST-3** Se o Bubblewrap não está instalado, então `build-twa.sh` deve sair com código 1 e mensagem de instalação (comportamento atual). *(TWA-2, PP-6)*
- **DIST-4** Quando `build-steam.sh` roda, o script deve gerar o instalador em `dist/electron/` usando `main.js` e `electron-builder.yml` versionados (provisório). *(STM-1, PP-7)*
- **DIST-5** Quando o app Electron inicia, o `main.js` deve carregar o jogo de `dist/` sem rede (provisório). *(STM-2, PP-8)*

## Plano de verificação
| Critério | Como verificar |
|---|---|
| DIST-1 | `curl` na URL publicada ou preview da Vercel |
| DIST-2 | execução manual em máquina com Bubblewrap: não validado, depende de ambiente |
| DIST-3 | executar o script sem Bubblewrap e conferir código de saída 1 |
| DIST-4, DIST-5 | execução manual em máquina com Electron: não validado, depende de ambiente |
| Comportamento no aparelho Android e no Windows | não validado: precisa de playtest humano |

## Questões em aberto
- Decisões 1 a 6 sem resposta; sem a decisão 1 aprovada, DIST-1 a DIST-5 não têm escopo.
- Compatibilidade do Bubblewrap e do Electron (Phaser 4.2.1) com a stack e requisitos das lojas: sem fonte primária.
- Fingerprint, chave e certificado de assinatura reais: do responsável.
- Texto da política e dados declarados (log, Cloud Save): do responsável.

## Pendências para promover a backlog
- **Discovery congelada:** depende de decisão de produto sobre canais; só descongela quando o ADR 0010 for aprovado, e ele recomenda apenas PWA por ora.
- Aprovação do responsável; ADRs 0010, 0011, 0004 e 0012 Aprovados.
- Decisões 1 a 6 respondidas; questões fechadas; fatos verificados em fonte primária.
- Se promovida, considerar dividir por canal (privacidade antes do TWA).

## Referências
- [pwa](../../operations/pwa.md), [build-scripts](../../operations/build-scripts.md), [release-strategy](../../product/release-strategy.md)
- [bug-distribuicao-pwa-manifest-e-service-worker.md](bug-distribuicao-pwa-manifest-e-service-worker.md), [ADR 0010](../../decisions/0010-canais-de-distribuicao.md), [ADR 0008](../../decisions/0008-endpoint-api-log.md)
- Specs originais consolidadas: feature-empacotamento-twa-play-store, feature-empacotamento-steam-electron, feature-politica-de-privacidade (removidas)
