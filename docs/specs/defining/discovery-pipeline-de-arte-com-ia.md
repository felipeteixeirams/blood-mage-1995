# Discovery: pipeline de arte semi-automatizado com IA

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Estado vs código:** verificado em 2026-10-11 (leitura estática): o pipeline proposto não existe (sem `tools/`, `docs/ART_STYLE.md`, `spec.yaml` de inimigo, scripts `generate-prompt`/`ingest-asset` nem `pngquant` em `package.json`). Existe ferramental correlato: `src/game/assets/assetManifest.json` (37 entradas, 19 com `required: true`) e `assetManifest.ts` (`queueAssetLoading` com fallback procedural), `scripts/verify-assets.cjs` (cabeçalho dos binários e manifesto), `scripts/pixellab_client.cjs`, `scripts/fetch-spritecook-sprite.cjs`, `scripts/build_bloodmage_spritesheet.cjs` e a skill `spritecook-integration`. Risco: `scripts/pixellab_client.cjs` tem um token padrão escrito no código (`DEFAULT_TOKEN`).

## Contexto
- Discovery: o que seria entregue se aprovado; nada é decisão. A ideia é usar IA generativa como fonte de concepts e scripts Node para validar e integrar o asset, com limpeza humana (Aseprite/Photoshop) no meio.
- Motivo da proposta: IA gera "pixel art" sem grade real, frames desalinhados e dimensões incompatíveis com os frames fixos do manifesto. Estas são afirmações do texto original, não verificadas.
- Passos propostos: (A) `generate-prompt` lê um guia de estilo e um `spec.yaml` por inimigo e emite o prompt; (B) humano gera e limpa o PNG; (C) `ingest-asset` valida, comprime, move para `public/assets/sprites/enemies/`, marca `required: true` e gera boilerplate (`preload`, animações, classe do inimigo).
- Os frames do manifesto não são todos 64x64: `spr_bloodmage` 68x68, `spr_skeleton` e `spr_cultist` 32x40, `spr_hound` 36x28 (`assetManifest.json`). A proposta de "múltiplos de 64" não vale hoje.
- Fluxo atual de arte e scripts: [asset-scripts](../../operations/asset-scripts.md). A regra de binários e a origem do spritesheet do jogador estão em `CLAUDE.md`.
- Specs relacionadas: [discovery-assets-externos-e-sprites](discovery-assets-externos-e-sprites.md), [feature-mapeamento-de-sprites](feature-mapeamento-de-sprites.md), [feature-guia-pixel-lab](feature-guia-pixel-lab/README.md).

## Objetivo
Se aprovado, adicionar um asset novo de inimigo exige gerar o prompt por script, limpar a imagem à mão e rodar um comando que valida e registra o arquivo no manifesto.

## Decisões de que depende
| ADR | Assunto | Status |
|---|---|---|
| [0015](../../decisions/0015-estrutura-do-repositorio-e-dependencias.md) | Estrutura do repositório e dependências (nova pasta `tools/` e novas dependências) | Proposta |

## Fatos técnicos verificados
| Afirmação | Fonte | Verificado em |
|---|---|---|
| Não existem `tools/`, `docs/ART_STYLE.md` nem YAML de inimigo (só `pnpm-workspace.yaml` e `lib/api-spec/openapi.yaml`) | `ls`, `find . -name "*.yaml"` | 2026-10-11 |
| Sem scripts `generate-prompt`, `ingest-asset` nem `pngquant` | `package.json` | 2026-10-11 |
| Manifesto: 37 entradas, 19 `required: true`; frames de tamanhos variados | `src/game/assets/assetManifest.json` | 2026-10-11 |
| `verify-assets.cjs` valida cabeçalhos de binários em `src/assets`, `public/assets`, `public/fonts` e o manifesto | `scripts/verify-assets.cjs` | 2026-10-11 |
| `pixellab_client.cjs` usa `process.env.PIXELLAB_API_KEY` ou um token escrito no arquivo | `scripts/pixellab_client.cjs` (l.17-20) | 2026-10-11 |
| `package.json` tem `pngjs` e `tsx`; não tem parser de YAML nem `pngquant` | `package.json` | 2026-10-11 |

## Decisões a confirmar
| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| 1 | Usar IA generativa como fonte de concepts com limpeza humana | sim / não / manter só PixelLab e SpriteCook | Manter as fontes atuais (PixelLab, SpriteCook) e avaliar IA geral só se faltar arte; licença e custo são do responsável |
| 2 | Adotar os scripts `generate-prompt` e `ingest-asset` e a pasta `tools/art-pipeline` | adotar / só `ingest-asset` / nada | Só a validação, estendendo `verify-assets.cjs`, sem geração de código |
| 3 | Congelar até a "Fase 3" (escala de produção) | congelar / iniciar agora | Congelar: hoje só jogador, baú e UI têm arte física |
| 4 | Geração automática de boilerplate (preload, animações, classe de inimigo) | gerar / manual | Manual: injeção em cenas toca arquivos de risco |
| 5 | Compressão (`pngquant` ou equivalente) | adotar / não | Avaliar após medir o peso dos PNGs; dependência nova é do responsável |
| 6 | Tamanho de célula padrão dos novos sprites | 64x64 (proposta) / manter por entidade | Manter por entidade, registrado no manifesto |

## Escopo
Condicional às decisões 1 a 3.
- Guia de estilo `docs/ART_STYLE.md` com paleta, perspectiva e contorno (conteúdo a definir pelo responsável).
- Especificação por inimigo (campos: tipo, frames de walk e attack, tamanho de célula) em formato a decidir.
- Script de geração de prompt a partir do guia e da especificação.
- Script de ingestão: valida dimensões e canal alfa, move o PNG, atualiza `assetManifest.json`.
- Remoção do token escrito em `pixellab_client.cjs` (independe das decisões; ver Pendências).

## Fora de escopo
- Gerar arte final por IA sem limpeza humana.
- Mudar o spritesheet do jogador (origem: `scripts/build_bloodmage_spritesheet.cjs`).
- Geração automática de lógica de IA do inimigo.
- Novas animações ou balance.

## Arquivos e contratos
- Criar (se aprovado; caminhos propostos): `docs/ART_STYLE.md`, `tools/art-pipeline/generator/generate-prompt.ts`, `tools/art-pipeline/ingestion/validate-sprite.ts`, `tools/art-pipeline/specs/enemies/<id>.yaml`; scripts em `package.json`. Rodar com `tsx` já instalado.
- Alterar: `src/game/assets/assetManifest.json` (via script, nunca à mão em binários), `scripts/verify-assets.cjs` se a validação for estendida.
- Não tocar: PNGs com ferramenta de texto (regra de binários); `bloodmage.png`; cenas do Phaser (sem injeção de `preload`).
- Contrato do `ingest-asset <tipo> <nome>`: entrada `asset_raw.png`; saída PNG em `public/assets/sprites/enemies/<nome>.png` e entrada no manifesto; código de saída diferente de 0 e mensagem se a validação falhar; só marca `required: true` se o arquivo existir e `pnpm run verify` passar.
- Variáveis de ambiente: `PIXELLAB_API_KEY` e `SPRITECOOK_API_KEY` (hoje só do ambiente local).

## Critérios de aceite
Todos dependem de decisão aberta.
- **PA-1** Quando o comando de geração de prompt recebe o id de um inimigo com especificação válida, o script deve imprimir o prompt com as regras do guia de estilo (provisório).
- **PA-2** Se o id do inimigo não tem especificação, então o script de geração deve sair com código diferente de 0 e informar o arquivo ausente (provisório).
- **PA-3** Quando o comando de ingestão recebe um PNG com dimensões compatíveis com a célula declarada, o script deve copiar o arquivo para `public/assets/sprites/enemies/` (provisório).
- **PA-4** Se o PNG tem cabeçalho inválido ou dimensões incompatíveis com a célula, então o script de ingestão deve sair com código diferente de 0 sem alterar o manifesto (provisório).
- **PA-5** Quando a ingestão termina com sucesso, o script deve registrar a entrada no `assetManifest.json` com `required: true` somente se `pnpm run verify` passar (provisório).
- **PA-6** O `scripts/pixellab_client.cjs` não deve conter credencial escrita no código; se `PIXELLAB_API_KEY` não existe, então o script deve sair com erro explicativo (provisório).

## Plano de verificação
| Critério | Como verificar |
|---|---|
| PA-1, PA-2 | teste unitário do gerador de prompt (arquivo novo, ao lado do script) |
| PA-3, PA-4 | teste unitário com PNGs de fixture (válido e corrompido) |
| PA-5 | teste de integração com manifesto temporário; manual: `pnpm run verify` |
| PA-6 | inspeção: `grep -n "DEFAULT_TOKEN" scripts/pixellab_client.cjs` sem resultado; teste sem a variável |

## Questões em aberto
- Fonte de IA, licença e uso comercial dos assets gerados: não verificados.
- Formato e campos do `spec.yaml` (e dependência de parser).
- Conteúdo do `ART_STYLE.md` (paleta, perspectiva).
- O token em `pixellab_client.cjs` é válido e foi exposto: revogar/rotacionar é decisão do responsável.
- Se os scripts PixelLab/SpriteCook ainda funcionam: nunca executados.

## Pendências para promover a backlog
- Discovery; depende de decisão de produto e custo: aprovação do responsável.
- ADR 0015 aprovado; decisões 1 a 6 respondidas.
- Questões em aberto resolvidas.
- Fatos a verificar: licença da IA escolhida e funcionamento dos clientes de arte.
- Item PA-6 pode virar spec de bug própria (segurança), independente do restante.

## Referências
- [asset-scripts](../../operations/asset-scripts.md), [ADR 0015](../../decisions/0015-estrutura-do-repositorio-e-dependencias.md)
- `src/game/assets/assetManifest.json`, `src/game/assets/assetManifest.ts`, `scripts/verify-assets.cjs`
- [discovery-assets-externos-e-sprites](discovery-assets-externos-e-sprites.md), [feature-mapeamento-de-sprites](feature-mapeamento-de-sprites.md)
