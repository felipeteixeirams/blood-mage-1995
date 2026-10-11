# Polimento de produção e empacotamento nativo (Play Store e Steam)

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Estado vs código:** verificado em 2026-10-11 (leitura estática): parcial. Existem `src/game/systems/ObjectPool.ts`, `ViewportCuller.ts`, `PerformanceMonitor.ts`, `InputManager.ts`, `AdvancedParticles.ts`, `ScreenShake.ts`, `ScreenEffects.ts`, `AchievementSystem.ts` (16 conquistas em `src/data/achievements.json`), `src/utils/haptics.ts`, PWA (`vite-plugin-pwa` em `vite.config.ts`, `public/manifest.webmanifest`), i18n `pt-BR` e `en-US` (`src/i18n/`) e os scripts `scripts/build-pwa.sh`, `build-twa.sh`, `build-steam.sh`. Faltam: idioma espanhol, projeto Electron (sem `electron`, `main.js` ou `electron-builder.yml`), projeto TWA (sem `twa-manifest.json`), política de privacidade. Cloud Save é a spec [feature-cloud-save.md](feature-cloud-save.md). Não validado em execução.

## Contexto
Épico de lançamento: idioma extra e empacotamento para lojas. O PWA e a performance já existem; os defeitos do manifest e do service worker estão em [bug-pwa-manifest-e-service-worker.md](bug-pwa-manifest-e-service-worker.md) e não são repetidos aqui. Satélites: [pwa](../../operations/pwa.md), [build-scripts](../../operations/build-scripts.md), [release-strategy](../../product/release-strategy.md), [i18n](../../ui/i18n.md).

Já implementado (não é escopo): pooling, culling e monitor de performance; gamepad e haptics; conquistas (o código tem 16, a versão anterior desta spec dizia 10; nenhuma mudança é pedida); PWA com service worker; pt-BR e en-US com fallback para pt-BR; scripts de build que criam configuração padrão sob demanda.

Lacunas:
- `Language` é `'pt-BR' | 'en-US'` (`src/types/game.ts:250`); `SettingsSchema.language` usa `z.enum` com os mesmos dois (`localStorage.ts:223`); o seletor da `SettingsScene` é binário (`:380`) e o rótulo só conhece PT-BR e EN-US (`:454`).
- `build-steam.sh` instala `electron` e `electron-builder` sob demanda e cria `electron-builder.yml` cujo `files` lista `main.js`, que não existe.
- `build-twa.sh` exige o Bubblewrap e cria `twa-manifest.json` com `sha256Fingerprints` de placeholder e identificadores fixos (`com.felipeteixeira.bloodmage1995`, `bloodmage-1995.vercel.app`) não confirmados.
- Não há política de privacidade em `src/`, `public/` nem `vercel.json`.

## Objetivo
O jogo pode ser jogado em espanhol e existe um projeto de empacotamento reprodutível para cada canal de distribuição que o responsável aprovar (TWA/Play Store e/ou Electron/Steam).

## Decisões de que depende
| ADR | Assunto | Status |
|---|---|---|
| [0010](../../decisions/0010-canais-de-distribuicao.md) | Canais: PWA, TWA/Play Store e Steam | Proposta |
| [0011](../../decisions/0011-conta-e-dados-do-jogador.md) | Conta e dados (Cloud Save fica fora) | Proposta |
| [0004](../../decisions/0004-controles-mobile-e-orientacao.md) | Orientação paisagem (manifest e TWA) | Proposta |
| [0012](../../decisions/0012-monetizacao-preco-e-metas-de-retencao.md) | Preço e monetização (Steam e Play) | Proposta |

## Fatos técnicos verificados
| Afirmação | Fonte | Verificado em |
|---|---|---|
| `Language` só lista pt-BR e en-US; schema e seletor idem | `src/types/game.ts:250`; `src/utils/localStorage.ts:223`; `SettingsScene.ts:380,454` | 2026-10-11 |
| Dicionários têm 147 chaves em `ptBR.ts` e `enUS.ts`; `enUS` é tipado por `TranslationDictionary` | `src/i18n/ptBR.ts`, `enUS.ts`; [i18n](../../ui/i18n.md) | 2026-10-11 |
| `achievements.json` tem 16 conquistas | `src/data/achievements.json` | 2026-10-11 |
| `electron` não está em `package.json`; `electron-builder.yml`, `main.js`, `twa-manifest.json` não existem | `package.json`; `ls` na raiz | 2026-10-11 |
| `build-steam.sh` e `build-twa.sh` usam `npm` e criam config padrão sob demanda | `scripts/build-steam.sh`, `scripts/build-twa.sh` | 2026-10-11 |
| `build-twa.sh` exige `bubblewrap` no PATH e sai com erro 1 se ausente | `scripts/build-twa.sh` | 2026-10-11 |
| `package.json` está em `version: 0.0.0` | `package.json` | 2026-10-11 |
| Sem menção a política de privacidade em `src/`, `public/`, `vercel.json` | `grep -rniE "privacy\|privacidade" src public vercel.json` | 2026-10-11 |
| Compatibilidade do Phaser 4.2.1 com Electron, requisitos da Play Store e da Steam | não verificado (fonte primária pendente) | — |

## Decisões a confirmar
| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| 1 | Canais a empacotar | A) só TWA; B) só Steam; C) ambos; D) nenhum por ora | Seguir o [ADR 0010](../../decisions/0010-canais-de-distribuicao.md) (recomendação A dele: só PWA por ora); esta spec só entra após a aprovação |
| 2 | Idioma espanhol: código e escopo | A) `es-ES`; B) `es-419`; C) não adicionar | B: público latino-americano; confirmar o mercado-alvo |
| 3 | Origem da tradução | A) tradução humana; B) assistida por IA com revisão | B com revisão: 147 chaves, baixo risco |
| 4 | Textos fora do i18n (HUD, menus em pt-BR fixo) | A) fora de escopo; B) migrar para `t()` | A: já é lacuna de en-US; migrar é outra spec |
| 5 | Seletor de idioma | A) ciclo pt-BR, en-US, es; B) lista | A: menor mudança na `SettingsScene` |
| 6 | Identificador de pacote e domínio | A) `com.felipeteixeira.bloodmage1995` e `bloodmage-1995.vercel.app` (padrões dos scripts); B) outros | Responsável confirma se são os reais |
| 7 | Steam: Electron ou web wrapper | A) Electron; B) outro wrapper | A: já previsto pelo script; verificar compatibilidade |
| 8 | Integração Steamworks (conquistas, nuvem) | A) fora desta spec; B) incluir | A: é escopo novo |
| 9 | Política de privacidade | A) página em `public/` servida no site; B) externa | A: a Play Store exige URL |
| 10 | Assinatura e custódia de chaves (`.jks`, certificados) | definir quem guarda e onde | responsável decide; nunca no repositório |

## Escopo
- Dicionário `src/i18n/esXX.ts` com as 147 chaves, registro em `translations`, `Language`, `SettingsSchema.language` e ciclo no seletor da `SettingsScene` (conforme decisões 2 a 5).
- Teste do novo idioma em `src/i18n/i18n.test.ts`.
- Se decisão 1 incluir TWA: `twa-manifest.json` versionado com os valores da decisão 6 e política de privacidade (decisão 9).
- Se decisão 1 incluir Steam: dependência `electron` e `electron-builder` em `package.json`, `main.js` e `electron-builder.yml` versionados, `build-steam.sh` sem instalação sob demanda.

## Fora de escopo
- Cloud Save e conta ([feature-cloud-save.md](feature-cloud-save.md)); manifest, ícones e service worker ([bug-pwa-manifest-e-service-worker.md](bug-pwa-manifest-e-service-worker.md)).
- Publicação nas lojas, preço, classificação etária, integração Steamworks, migração de textos fixos para o i18n.

## Arquivos e contratos
- Criar: `src/i18n/<codigo-do-idioma>.ts` (decisão 2); `twa-manifest.json`, `electron-builder.yml`, `main.js` na raiz (conforme decisão 1); `public/privacy.html` (decisão 9).
- Alterar: `src/types/game.ts`, `src/i18n/index.ts`, `src/utils/localStorage.ts` (arquivo crítico: ver [risky-files](../../engineering/risky-files.md)), `src/game/scenes/SettingsScene.ts`, `src/i18n/i18n.test.ts`, `scripts/build-steam.sh`, `scripts/build-twa.sh`, `package.json`.
- Atualizar no mesmo commit: `docs/ui/i18n.md`, `docs/operations/build-scripts.md`, `docs/product/release-strategy.md` e `Verificado em`.
- Não tocar: `vite.config.ts` e `public/manifest.webmanifest` (spec de bug do PWA).
- Contrato: o valor persistido de `settings.language` inválido volta para `pt-BR` (comportamento atual do schema).

## Critérios de aceite
- **PP-1** Quando o jogador escolhe espanhol nas configurações, o i18n deve devolver o texto em espanhol para toda chave de `TranslationDictionary` (provisório).
- **PP-2** Se uma chave falta no dicionário espanhol, então o i18n deve usar o texto em pt-BR (comportamento atual de fallback).
- **PP-3** Quando o jogador aciona o seletor de idioma, a `SettingsScene` deve avançar pt-BR, en-US, espanhol e voltar a pt-BR (provisório).
- **PP-4** Se o `localStorage` guarda um idioma não suportado, então o `SettingsSchema` deve restaurar `pt-BR`.
- **PP-5** Quando `build-twa.sh` roda com Bubblewrap instalado, o script deve gerar o pacote Android a partir do `twa-manifest.json` versionado, sem criar arquivo padrão (provisório).
- **PP-6** Se o Bubblewrap não está instalado, então `build-twa.sh` deve sair com código 1 e mensagem de instalação (comportamento atual).
- **PP-7** Quando `build-steam.sh` roda, o script deve gerar o instalador em `dist/electron/` usando `main.js` e `electron-builder.yml` versionados (provisório).
- **PP-8** Quando o app Electron inicia, o `main.js` deve carregar o jogo de `dist/` sem rede (provisório).
- **PP-9** O servidor web deve servir a política de privacidade na URL definida na decisão 9 (provisório).

## Plano de verificação
| Critério | Como verificar |
|---|---|
| PP-1, PP-2, PP-4 | teste em `src/i18n/i18n.test.ts` e teste do schema |
| PP-3 | teste unitário do ciclo (extrair a lógica da `SettingsScene`); manual no menu |
| PP-5 a PP-8 | execução manual dos scripts em máquina com Bubblewrap/Electron: não validado, depende de ambiente |
| PP-9 | `curl` na URL publicada ou preview da Vercel |
| Qualidade da tradução, comportamento no aparelho Android e no Windows | não validado: precisa de revisão e playtest humanos |

## Questões em aberto
- Decisões 1 a 10 sem resposta; sem decisão 1 aprovada, os critérios PP-5 a PP-9 não têm escopo.
- Compatibilidade de Electron e de Bubblewrap com a stack atual e requisitos de Play Store e Steam: sem fonte primária.
- Código do idioma, revisor da tradução e prazo: a definir.
- Fingerprint e chave de assinatura reais: do responsável.
- Quais dos 9 valores idênticos nos dois dicionários (`mainMenu.title` etc.) devem repetir em espanhol.

## Pendências para promover a backlog
- Aprovação do responsável; ADRs 0010, 0011, 0004 e 0012 Aprovados.
- Decisões 1 a 10 respondidas e questões em aberto fechadas; fatos de compatibilidade verificados em fonte primária.
- Dividir em specs menores (espanhol; TWA; Steam), pois é um épico.
- Esta spec parte de discovery: depende de decisão de produto sobre canais.

## Referências
- [pwa](../../operations/pwa.md), [build-scripts](../../operations/build-scripts.md), [release-strategy](../../product/release-strategy.md), [i18n](../../ui/i18n.md)
- [feature-cloud-save.md](feature-cloud-save.md), [bug-pwa-manifest-e-service-worker.md](bug-pwa-manifest-e-service-worker.md), [ADR 0010](../../decisions/0010-canais-de-distribuicao.md)
