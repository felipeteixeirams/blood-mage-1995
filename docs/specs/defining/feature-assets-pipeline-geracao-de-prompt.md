# Feature: geração de prompt de arte por script

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Estado vs código:** verificado em 2026-10-11 (leitura estática): não existem `tools/`, `docs/ART_STYLE.md`, `spec.yaml` de inimigo nem script `generate-prompt`; `package.json` tem `tsx` mas não tem parser de YAML.

**Origem:** passo A, decisões 2 (parte geração) e 3, escopo e critérios PA-1 e PA-2 de `discovery-assets-pipeline-de-arte-com-ia.md` (removida).

## Contexto
- Passo A proposto: `generate-prompt` lê um guia de estilo e um `spec.yaml` por inimigo e emite o prompt; depois o humano gera e limpa o PNG (ingestão: [feature-assets-pipeline-ingestao-de-sprite](feature-assets-pipeline-ingestao-de-sprite.md)).
- Fonte de IA e licença: [discovery-assets-licencas-e-politica-steam-de-ia](discovery-assets-licencas-e-politica-steam-de-ia.md).
- Hoje só jogador, baú e UI têm arte física.

## Objetivo
Se aprovado, um comando gera o prompt de arte de um inimigo a partir do guia de estilo e da especificação do inimigo.

## Decisões de que depende
| ADR | Assunto | Status |
|---|---|---|
| [0015](../../decisions/0015-estrutura-do-repositorio-e-dependencias.md) | Estrutura do repositório e dependências (nova pasta `tools/` e novas dependências) | Proposta |

## Fatos técnicos verificados
| Afirmação | Fonte | Verificado em |
|---|---|---|
| Não existem `tools/`, `docs/ART_STYLE.md` nem YAML de inimigo (só `pnpm-workspace.yaml` e `lib/api-spec/openapi.yaml`) | `ls`, `find . -name "*.yaml"` | 2026-10-11 |
| Sem scripts `generate-prompt`, `ingest-asset` nem `pngquant` | `package.json` | 2026-10-11 |
| `package.json` tem `pngjs` e `tsx`; não tem parser de YAML nem `pngquant` | `package.json` | 2026-10-11 |

## Decisões a confirmar
| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| 1 (decisão 2 original, parte geração) | Adotar o script `generate-prompt` e a pasta `tools/art-pipeline` | adotar / só `ingest-asset` / nada | Só a validação, estendendo `verify-assets.cjs`, sem geração de código |
| 2 (decisão 3 original) | Congelar até a "Fase 3" (escala de produção) | congelar / iniciar agora | Congelar: hoje só jogador, baú e UI têm arte física |

## Escopo
Condicional às decisões 1 e 2 e à spec de licenças.
- Guia de estilo `docs/ART_STYLE.md` com paleta, perspectiva e contorno (conteúdo a definir pelo responsável).
- Especificação por inimigo (campos: tipo, frames de walk e attack, tamanho de célula) em formato a decidir.
- Script de geração de prompt a partir do guia e da especificação.

## Fora de escopo
- Gerar arte final por IA sem limpeza humana.
- Ingestão e registro no manifesto (spec de ingestão).
- Geração automática de lógica de IA do inimigo; novas animações ou balance.

## Arquivos e contratos
- Criar (se aprovado; caminhos propostos): `docs/ART_STYLE.md`, `tools/art-pipeline/generator/generate-prompt.ts`, `tools/art-pipeline/specs/enemies/<id>.yaml`; script em `package.json`. Rodar com `tsx` já instalado.
- Não tocar: PNGs com ferramenta de texto; `bloodmage.png`; cenas do Phaser.
- Formato do `spec.yaml` e dependência de parser: a decidir.

## Critérios de aceite
Todos dependem de decisão aberta.
- **PG-1** (PA-1) Quando o comando de geração de prompt recebe o id de um inimigo com especificação válida, o script deve imprimir o prompt com as regras do guia de estilo (provisório).
- **PG-2** (PA-2) Se o id do inimigo não tem especificação, então o script de geração deve sair com código diferente de 0 e informar o arquivo ausente (provisório).

## Plano de verificação
| Critério | Como verificar |
|---|---|
| PG-1, PG-2 | Teste unitário do gerador de prompt (arquivo novo, ao lado do script) |

## Questões em aberto
- Formato e campos do `spec.yaml` (e dependência de parser).
- Conteúdo do `ART_STYLE.md` (paleta, perspectiva).

## Pendências para promover a backlog
- Aprovação do responsável (decisão de produto e custo).
- ADR 0015 aprovado; decisões 1 e 2 respondidas; questões em aberto resolvidas.
- Remover "(provisório)".

## Referências
- [asset-scripts](../../operations/asset-scripts.md), [ADR 0015](../../decisions/0015-estrutura-do-repositorio-e-dependencias.md)
- [discovery-assets-arte-ui-audio-e-sprites](discovery-assets-direcao-artistica-e-escopo-visual.md)
