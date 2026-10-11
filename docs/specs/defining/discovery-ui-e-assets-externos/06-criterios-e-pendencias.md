# Evolução de UI e assets externos góticos: critérios e pendências (parte 6)

**Mestre:** [discovery-ui-e-assets-externos](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Estado vs código:** verificado em 2026-10-11 (leitura estática): nenhum dos critérios abaixo está implementado. Hoje: som 100% sintetizado (`src/utils/soundEngine.ts`), moldura com `border-image` só no `DialogueModal.tsx`, sem tela de Créditos, sem verificação de orçamento. Detalhes por tema nas partes 1 a 5.

Parte 6 de 6. Índice das partes: [README](README.md). Esta é uma discovery: os critérios são provisórios e dependem de decisão de produto do responsável.

## Critérios de aceite
Prefixo `UIA`. Todos dependem de decisões abertas (partes 1 a 5). Carga, lazy-loading, atlas e telemetria de imagem estão em AES (`AES-1` a `AES-9`).

- **UIA-1** Quando o InventoryModal é aberto, o InventoryModal deve renderizar a moldura do painel por `border-image` com o slice de 16 px (provisório).
- **UIA-2** Se a imagem da moldura não carrega, então o painel React deve exibir a borda sólida de `.gothic-border` (provisório).
- **UIA-3** Quando o jogador aciona o SFX de uma chave que tem arquivo físico, o soundEngine deve tocar o buffer do arquivo (provisório).
- **UIA-4** Se o arquivo de SFX falta ou não decodifica, então o soundEngine deve executar a síntese da mesma chave (provisório).
- **UIA-5** Se o arquivo de SFX falta ou não decodifica e o Sentry está inicializado, então o soundEngine deve enviar a chave ao Sentry (provisório).
- **UIA-6** Enquanto o jogo está mudo, o soundEngine não deve emitir som de arquivo físico (provisório).
- **UIA-7** Quando a trilha física de um tema existe, o soundEngine deve tocá-la em loop (provisório).
- **UIA-8** Se a trilha física falha, então o bgmSynthesizer deve tocar o tema procedural (provisório).
- **UIA-9** Quando um diálogo com NPC abre e existe retrato, o DialogueModal deve exibir o retrato; sem o arquivo, deve exibir o ícone atual (provisório).
- **UIA-10** Quando o jogador equipa armadura ou arma, o renderizador do jogador deve exibir a camada correspondente (provisório; só se a decisão 3 for B).
- **UIA-11** Se um frame de spritesheet excede o tamanho máximo da parte 4, então o verify-assets deve falhar nomeando a chave (provisório).
- **UIA-12** Se o pacote inicial do PWA excede 2,5 MB, então o verify-assets deve falhar (provisório; método de medição em aberto).
- **UIA-13** Quando o jogador abre Créditos, a tela de Créditos deve listar autor, licença e fonte de cada asset CC-BY e OGA-BY (provisório).
- **UIA-14** Se um asset externo não tem entrada no registro de origem, então o verify-assets deve falhar nomeando o arquivo (provisório).

## Plano de verificação
| Critério | Como verificar |
|---|---|
| UIA-1, UIA-2 | Teste de componente do InventoryModal (classe aplicada); manual com a imagem removida (não validado) |
| UIA-3 a UIA-6 | Teste unitário em `src/utils/soundEngine.test.ts` com `AudioContext` e `fetch` simulados |
| UIA-7, UIA-8 | Teste unitário do soundEngine e do bgmSynthesizer; audição: não validado, precisa de playtest humano |
| UIA-9 | Teste de componente do DialogueModal com e sem retrato |
| UIA-10 | Manual: equipar e olhar o sprite (não validado, precisa de playtest humano) |
| UIA-11, UIA-12, UIA-14 | `pnpm run verify` com arquivo de teste fora do limite ou sem registro |
| UIA-13 | Teste de componente da tela de Créditos |
| Legibilidade mobile da arte | Não validado: precisa de playtest humano em celular |

## Questões em aberto
- Como medir o "pacote inicial de 2,5 MB" (bytes transferidos, comprimidos ou no precache do PWA) e qual é o valor atual.
- Alvo mínimo de toque dos botões com moldura nova.
- Formato e local do registro de origem dos assets; local do componente de Créditos.
- Cache negativo: se o arquivo de áudio falta, evitar nova tentativa de download a cada disparo.
- O PWA precisa incluir `mp3`, `webp` e `json` no precache (`globPatterns` hoje não inclui).
- Fontes e artistas citados (OpenGameArt, Itch.io, Surt) e suas licenças não foram verificados.
- Orçamento de arte e direção artística (decisão de negócio) inexistentes; custo de `pngquant`/WebP no fluxo de build.
- Arte e BGM externas versus o [pipeline de arte com IA](../discovery-pipeline-de-arte-com-ia.md): qual caminho vale.

## Pendências para promover a backlog
- Discovery: depende de decisão de produto; não há aprovação do responsável.
- Aprovar as decisões 1 a 11 (parte 1) e os ADRs 0006, 0010 e 0013.
- Fechar as questões em aberto acima e substituir os limites "propostos" por valores aprovados.
- Dividir em specs implementáveis (por exemplo: 9-slice, áudio híbrido, créditos e licenças), cada uma pequena; esta é um épico.
- Alinhar com [AES](../discovery-assets-externos-e-sprites.md) a dependência da infraestrutura de carga.

## Referências
- [Assets externos e sprites](../discovery-assets-externos-e-sprites.md), [Evolução gráfica](../discovery-evolucao-grafica-avancada/README.md)
- [Áudio](../../../gameplay/audio.md), [HUD](../../../ui/hud.md), [Modais e telas](../../../ui/modals-and-screens.md)
- [ADR 0006](../../../decisions/0006-audio-e-conquistas.md), [ADR 0013](../../../decisions/0013-metas-de-performance.md)
