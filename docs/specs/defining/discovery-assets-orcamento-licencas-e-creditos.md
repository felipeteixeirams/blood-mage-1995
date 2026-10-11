# Assets: orçamento, licenças e créditos (discovery)

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Classe:** D
**Depende de:** ADR 0010, ADR 0013
**Prioridade:** P3 (sugerida)
**Esforço:** —
**Origem:** dividida de discovery-assets-arte-ui-audio-e-sprites (parte 05 e critérios AAS-20..23), 2026-10-11 (ex-UIA, partes 4 e 5)
**Estado vs código:** verificado em 2026-10-11 (leitura estática): parcial. Existe: `PerformanceMonitor` (`?perf`), `src/utils/logger.ts` (envia ao `/api/log`), `Sentry.init` em `src/main.tsx` (só com `VITE_SENTRY_DSN`), CSP com `connect-src` para Sentry em `vercel.json`, `vite-plugin-pwa` com `globPatterns` `**/*.{js,css,html,woff2,png,svg}` e limite de 5 MB por arquivo em `vite.config.ts`; arte do jogador e do baú gerada por scripts do projeto (`scripts/build_bloodmage_spritesheet.cjs`, `scripts/generate_chest_assets.cjs`), fontes locais, modal de configurações em React que hospeda `SettingsScene`. Falta: medição do pacote inicial ou da VRAM, script ou teste que imponha os limites, tamanho máximo de frame validado, `webp`/`json`/`mp3` no precache do PWA, tela de Créditos (nenhuma ocorrência em `src/`), registro de origem e licenças, qualquer asset de terceiros. Nenhum critério abaixo está implementado.

## Contexto
Limites de bytes e resoluções (originais, sem aprovação) e regras de licença valem para toda arte e áudio externos. O mecanismo (lazy-loading, compressão, atlas, telemetria de imagem) é de [feature-assets-carga-atlas-e-normal-maps](feature-assets-carga-atlas-e-normal-maps.md).

## Objetivo
Se aprovada, todo asset externo respeita um orçamento e uma regra de licença, com créditos visíveis e registro de origem.

## Decisões de que depende
| ADR | Assunto | Status |
|---|---|---|
| [0013](../../decisions/0013-metas-de-performance.md) | Metas de performance e bundle (orçamento) | Proposta |
| [0010](../../decisions/0010-canais-de-distribuicao.md) | Steam e Play Store exigem uso comercial | Proposta |

## Fatos técnicos verificados
Fatos no "Estado vs código" acima (`vite.config.ts`, `vercel.json`, `src/main.tsx`, busca por "Créditos" em `src/`, verificado em 2026-10-11).

## Decisões a confirmar
Numeração original (preservada).

| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| 9 | Orçamento e limites (ex-UIA 9) | A) limites do original; B) outros | A como ponto de partida, após medir o pacote atual |
| 10 | Licenças aceitas (ex-UIA 10) | A) CC0, CC-BY, OGA-BY; B) só CC0 | A, com crédito obrigatório para CC-BY e OGA-BY |
| 11 | Onde fica a tela de Créditos (ex-UIA 11) | A) Configurações; B) Menu Principal; C) ambos | A: um ponto de entrada só |

## Escopo
Se aprovado:

| Item | Limite proposto |
|---|---|
| Piso isométrico / parede | 64x32 / 32x32 |
| Personagem e inimigo médio, por frame | 48x48 ou 64x64 |
| Inimigo grande ou chefe, por frame | 128x128 |
| Ícone de menu ou skill | 32x32 ou 48x48 |
| Pacote inicial do PWA (Título, Menu, Safe Zone) | 2,5 MB |
| PNG de produção | paleta de 256 cores via `pngquant` |
| Fundos e tilesets em WebP | qualidade 80 |
| Ícones de inventário e magias | um único atlas (1 draw call) |

- **Licenças:** preferência por CC0; CC-BY e OGA-BY só com crédito (autor, link da licença, link da fonte); toda licença permite uso comercial.
- **Créditos:** tela React acessível por Configurações ou Menu, listando cada asset CC-BY ou OGA-BY com autor, licença e fonte.
- **Registro de origem:** autor, licença e URL de cada asset externo (local a definir).
- **Fontes de busca (propostas, não verificadas):** OpenGameArt.org ("dark fantasy", "gothic tileset", "necromancer spell", "rpg item icons"), Itch.io (gratuitos), Surt's Public Domain Treasures (CC0).
- **Plano em etapas** (cada uma só com a anterior validada): 1) loader e fallback unificado ([spec de carga](feature-assets-carga-atlas-e-normal-maps.md)) e áudio híbrido ([spec de áudio](feature-audio-fisico-hibrido.md)); 2) protótipo com uma spritesheet física do jogador sob a mesma chave, sem queda de FPS e com falha de download simulada; 3) migração de biomas e UI ([9-slice](feature-ui-moldura-9-slice.md), tilesets, inimigos homologados e comprimidos); 4) auditoria de VRAM em celulares antigos e lançamento.

## Fora de escopo
- Implementar loader, compressão e CI ([spec de carga](feature-assets-carga-atlas-e-normal-maps.md)); medir VRAM em aparelhos reais além do que o ADR 0013 definir; criar a infraestrutura de Sentry (existe).
- Comprar licenças, contratar artistas, escolher pacotes específicos.

## Arquivos e contratos
- Estender `scripts/verify-assets.cjs` e `src/game/assets/assetIntegrity.test.ts` (limites por frame, orçamento, registro de origem); alterar `vite.config.ts` (`globPatterns`) se houver formatos novos.
- Criar: componente React de Créditos em `src/components/` (nome a definir) e arquivo de registro de assets (formato e local a definir).
- Atualizar no mesmo commit: [performance](../../engineering/performance.md), [performance-metrics](../../engineering/performance-metrics.md), [pwa](../../operations/pwa.md), [modals-and-screens](../../ui/modals-and-screens.md) e `Verificado em`.
- Não tocar: `PerformanceMonitor.ts`, cenas Phaser de menu.
- Contrato: a verificação falha com a chave e a medida excedida; nenhum asset de terceiros sem entrada no registro; CC-BY e OGA-BY sem crédito visível bloqueiam a integração.

## Critérios de aceite
Prefixo `ORC`; ID antigo entre parênteses. Provisórios.
- **ORC-1** (AAS-20, UIA-11) Se um frame de spritesheet excede o tamanho máximo da tabela de limites, então o verify-assets deve falhar nomeando a chave (provisório).
- **ORC-2** (AAS-21, UIA-12) Se o pacote inicial do PWA excede 2,5 MB, então o verify-assets deve falhar (provisório; método de medição em aberto, Q1).
- **ORC-3** (AAS-22, UIA-13) Quando o jogador abre Créditos, a tela de Créditos deve listar autor, licença e fonte de cada asset CC-BY e OGA-BY (provisório).
- **ORC-4** (AAS-23, UIA-14) Se um asset externo não tem entrada no registro de origem, então o verify-assets deve falhar nomeando o arquivo (provisório).

## Plano de verificação
| Critério | Como verificar |
|---|---|
| ORC-1, ORC-2, ORC-4 | `pnpm run verify` com arquivo fora do limite ou sem registro |
| ORC-3 | Teste de componente da tela de Créditos |

## Questões em aberto
Numeração original entre parênteses.
1. (Q1) Como medir o "pacote inicial de 2,5 MB" (bytes transferidos, comprimidos ou no precache do PWA) e qual é o valor atual; meta numérica de redução com lazy-loading (hoje não medida).
2. (Q4) Estimativa de esforço e roadmap de 3 fases do original não verificados.
3. (Q5) `globPatterns` do PWA em `vite.config.ts` não inclui `webp`, `json`, `mp3` nem `ogg`.
4. (Q7) Formato e local do registro de origem dos assets; local do componente de Créditos.
5. (Q9) Fontes e artistas citados (OpenGameArt, Itch.io, Surt) e suas licenças não verificados.
6. (Q12, referência cruzada) Conflito registrado: o guia gera inimigos em 48 ou 64 px e as células do manifesto variam (32x40, 48x56...), enquanto a tabela de limites acima restringe frames a 48x48/64x64 (128x128 para chefes); definir tamanhos finais junto com a decisão 9 e a decisão 19. A questão pertence a [feature-assets-entrega-de-arte-pixel-lab](feature-assets-entrega-de-arte-pixel-lab.md).

## Pendências para promover a backlog
- Discovery: depende de decisão de produto (orçamento de arte); sem aprovação do responsável.
- Aprovar as decisões 9 a 11 e os ADRs 0010 e 0013 (Propostos).
- Fechar as questões acima e trocar os limites "propostos" por valores aprovados; verificar os fatos externos (Q9) e medir o pacote atual antes de fixar 2,5 MB.

## Referências
- [Performance](../../engineering/performance.md), [Métricas](../../engineering/performance-metrics.md), [Telemetria e logs](../../operations/telemetry-and-logging.md), [PWA](../../operations/pwa.md), [Empacotamento TWA](discovery-distribuicao-canais-e-pacotes.md), [pipeline de arte com IA](discovery-assets-licencas-e-politica-steam-de-ia.md)
