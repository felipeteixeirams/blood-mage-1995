# Assets de arte, UI, áudio e sprites: orçamento, licenças e créditos (parte 5)

**Mestre:** [discovery-assets-arte-ui-audio-e-sprites](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Origem:** consolidada de discovery-ui-e-assets-externos, partes 4 e 5 (2026-10-11)
**Estado vs código:** verificado em 2026-10-11 (leitura estática): parcial. Existe: `PerformanceMonitor` (`?perf`), `src/utils/logger.ts` (envia ao `/api/log`), `Sentry.init` em `src/main.tsx` (só com `VITE_SENTRY_DSN`), CSP com `connect-src` para Sentry em `vercel.json`, `vite-plugin-pwa` com `globPatterns` `**/*.{js,css,html,woff2,png,svg}` e limite de 5 MB por arquivo em `vite.config.ts`; arte do jogador e do baú gerada por scripts do projeto (`scripts/build_bloodmage_spritesheet.cjs`, `scripts/generate_chest_assets.cjs`), fontes locais, modal de configurações em React que hospeda `SettingsScene`. Falta: medição do pacote inicial ou da VRAM, script ou teste que imponha os limites, tamanho máximo de frame validado, `webp`/`json`/`mp3` no precache do PWA, tela de Créditos (nenhuma ocorrência em `src/`), registro de origem e licenças, qualquer asset de terceiros.

Parte 5 de 6. Índice: [README](README.md).

## Contexto
Limites de bytes e resoluções (originais, sem aprovação) e regras de licença valem para toda arte e áudio externos. O mecanismo (lazy-loading, compressão, atlas, telemetria de imagem) é da [parte 2](02-carga-atlas-e-normal-maps.md).

## Objetivo
Se aprovada, todo asset externo respeita um orçamento e uma regra de licença, com créditos visíveis e registro de origem.

## Decisões de que depende
[ADR 0013](../../../decisions/0013-metas-de-performance.md) (orçamento) e [ADR 0010](../../../decisions/0010-canais-de-distribuicao.md) (Steam e Play Store exigem uso comercial). Ambas Propostas.

## Fatos técnicos verificados
Fatos no "Estado vs código" acima (`vite.config.ts`, `vercel.json`, `src/main.tsx`, busca por "Créditos" em `src/`, verificado em 2026-10-11).

## Decisões a confirmar
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
- **Plano em etapas** (cada uma só com a anterior validada): 1) loader e fallback unificado (parte 2) e áudio híbrido (parte 4); 2) protótipo com uma spritesheet física do jogador sob a mesma chave, sem queda de FPS e com falha de download simulada; 3) migração de biomas e UI (9-slice, tilesets, inimigos homologados e comprimidos); 4) auditoria de VRAM em celulares antigos e lançamento.

## Fora de escopo
- Implementar loader, compressão e CI (parte 2); medir VRAM em aparelhos reais além do que o ADR 0013 definir; criar a infraestrutura de Sentry (existe).
- Comprar licenças, contratar artistas, escolher pacotes específicos.

## Arquivos e contratos
- Estender `scripts/verify-assets.cjs` e `src/game/assets/assetIntegrity.test.ts` (limites por frame, orçamento, registro de origem); alterar `vite.config.ts` (`globPatterns`) se houver formatos novos.
- Criar: componente React de Créditos em `src/components/` (nome a definir) e arquivo de registro de assets (formato e local a definir).
- Atualizar no mesmo commit: [performance](../../../engineering/performance.md), [performance-metrics](../../../engineering/performance-metrics.md), [pwa](../../../operations/pwa.md), [modals-and-screens](../../../ui/modals-and-screens.md) e `Verificado em`.
- Não tocar: `PerformanceMonitor.ts`, cenas Phaser de menu.
- Contrato: a verificação falha com a chave e a medida excedida; nenhum asset de terceiros sem entrada no registro; CC-BY e OGA-BY sem crédito visível bloqueiam a integração.

Critérios: [parte 6](06-criterios-e-pendencias.md) (`AAS-20` a `AAS-23`).

## Referências
- [Performance](../../../engineering/performance.md), [Métricas](../../../engineering/performance-metrics.md), [Telemetria e logs](../../../operations/telemetry-and-logging.md), [PWA](../../../operations/pwa.md), [Empacotamento TWA](../discovery-distribuicao-canais-e-pacotes.md), [pipeline de arte com IA](../discovery-assets-pipeline-de-arte-com-ia.md)
