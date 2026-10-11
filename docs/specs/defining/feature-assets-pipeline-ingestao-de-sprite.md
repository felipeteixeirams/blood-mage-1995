# Feature: ingestão e validação de sprite no manifesto

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Classe:** B
**Depende de:** ADR 0015
**Estado vs código:** verificado em 2026-10-11 (leitura estática): não existe script `ingest-asset`. Existem `scripts/verify-assets.cjs` (cabeçalho dos binários e manifesto) e `src/game/assets/assetManifest.json` (37 entradas, 19 com `required: true`) com `assetManifest.ts` (`queueAssetLoading`, fallback procedural).

**Origem:** passo C, decisões 2 (parte ingestão), 4, 5 e 6, escopo, contrato do `ingest-asset` e critérios PA-3, PA-4 e PA-5 de `discovery-assets-pipeline-de-arte-com-ia.md` (removida).

## Contexto
- Passo C proposto: `ingest-asset` valida, comprime, move para `public/assets/sprites/enemies/`, marca `required: true` e gera boilerplate (`preload`, animações, classe do inimigo).
- Os frames do manifesto não são todos 64x64: `spr_bloodmage` 68x68, `spr_skeleton` e `spr_cultist` 32x40, `spr_hound` 36x28. A proposta de "múltiplos de 64" não vale hoje.
- Geração do prompt: [feature-assets-pipeline-geracao-de-prompt](feature-assets-pipeline-geracao-de-prompt.md). Fluxo atual: [asset-scripts](../../operations/asset-scripts.md).

## Objetivo
Se aprovado, um comando valida o PNG limpo e o registra no manifesto, sem alterá-lo se a validação falhar.

## Decisões de que depende
| ADR | Assunto | Status |
|---|---|---|
| [0015](../../decisions/0015-estrutura-do-repositorio-e-dependencias.md) | Estrutura do repositório e dependências (nova pasta `tools/` e novas dependências) | Proposta |

## Fatos técnicos verificados
| Afirmação | Fonte | Verificado em |
|---|---|---|
| Manifesto: 37 entradas, 19 `required: true`; frames de tamanhos variados | `src/game/assets/assetManifest.json` | 2026-10-11 |
| `verify-assets.cjs` valida cabeçalhos de binários em `src/assets`, `public/assets`, `public/fonts` e o manifesto | `scripts/verify-assets.cjs` | 2026-10-11 |
| `package.json` tem `pngjs` e `tsx`; não tem `pngquant` | `package.json` | 2026-10-11 |

## Decisões a confirmar
| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| 1 (decisão 2 original, parte ingestão) | Adotar o script `ingest-asset` e a pasta `tools/art-pipeline` | adotar / só `ingest-asset` / nada | Só a validação, estendendo `verify-assets.cjs`, sem geração de código |
| 2 (decisão 4 original) | Geração automática de boilerplate (preload, animações, classe de inimigo) | gerar / manual | Manual: injeção em cenas toca arquivos de risco |
| 3 (decisão 5 original) | Compressão (`pngquant` ou equivalente) | adotar / não | Avaliar após medir o peso dos PNGs; dependência nova é do responsável |
| 4 (decisão 6 original) | Tamanho de célula padrão dos novos sprites | 64x64 (proposta) / manter por entidade | Manter por entidade, registrado no manifesto |

## Escopo
Condicional às decisões 1 a 4.
- Script de ingestão: valida dimensões e canal alfa, move o PNG, atualiza `assetManifest.json`.

## Fora de escopo
- Geração de prompt e guia de estilo; token do `pixellab_client.cjs` (specs próprias).
- Injeção de `preload` em cenas Phaser; mudar o spritesheet do jogador (origem: `scripts/build_bloodmage_spritesheet.cjs`).

## Arquivos e contratos
- Criar (se aprovado; caminho proposto): `tools/art-pipeline/ingestion/validate-sprite.ts`; script em `package.json`. Rodar com `tsx` já instalado.
- Alterar: `src/game/assets/assetManifest.json` (via script, nunca à mão em binários); `scripts/verify-assets.cjs` se a validação for estendida.
- Não tocar: PNGs com ferramenta de texto (regra de binários); `bloodmage.png`; cenas do Phaser.
- Contrato do `ingest-asset <tipo> <nome>`: entrada `asset_raw.png`; saída PNG em `public/assets/sprites/enemies/<nome>.png` e entrada no manifesto; código de saída diferente de 0 e mensagem se a validação falhar; só marca `required: true` se o arquivo existir e `pnpm run verify` passar.

## Critérios de aceite
Todos dependem de decisão aberta.
- **PI-1** (PA-3) Quando o comando de ingestão recebe um PNG com dimensões compatíveis com a célula declarada, o script deve copiar o arquivo para `public/assets/sprites/enemies/` (provisório).
- **PI-2** (PA-4) Se o PNG tem cabeçalho inválido ou dimensões incompatíveis com a célula, então o script de ingestão deve sair com código diferente de 0 sem alterar o manifesto (provisório).
- **PI-3** (PA-5) Quando a ingestão termina com sucesso, o script deve registrar a entrada no `assetManifest.json` com `required: true` somente se `pnpm run verify` passar (provisório).

## Plano de verificação
| Critério | Como verificar |
|---|---|
| PI-1, PI-2 | Teste unitário com PNGs de fixture (válido e corrompido) |
| PI-3 | Teste de integração com manifesto temporário; manual: `pnpm run verify` |

## Questões em aberto
- Compressão depende de medir o peso dos PNGs (decisão 3).

## Pendências para promover a backlog
- Aprovação do responsável; ADR 0015 aprovado; decisões 1 a 4 respondidas.
- Questões em aberto resolvidas; remover "(provisório)".

## Referências
- [asset-scripts](../../operations/asset-scripts.md), [ADR 0015](../../decisions/0015-estrutura-do-repositorio-e-dependencias.md)
- `src/game/assets/assetManifest.json`, `src/game/assets/assetManifest.ts`, `scripts/verify-assets.cjs`
