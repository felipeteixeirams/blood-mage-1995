# Bug: credencial escrita no código do cliente PixelLab

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Classe:** A
**Depende de:** nenhum
**Estado vs código:** verificado em 2026-10-11 (leitura estática): `scripts/pixellab_client.cjs` (l.17-20) usa `process.env.PIXELLAB_API_KEY` ou, na falta dela, a constante `DEFAULT_TOKEN`, que tem um token escrito no arquivo. O valor não é reproduzido aqui.

**Origem:** item PA-6 de `discovery-assets-pipeline-de-arte-com-ia.md` (removida; a pendência dela previa esta spec própria, por ser segurança).

## Contexto
- `scripts/pixellab_client.cjs` carrega a credencial de duas fontes: a variável de ambiente `PIXELLAB_API_KEY` ou a constante `DEFAULT_TOKEN` escrita no arquivo. O arquivo está no Git, então o valor está no histórico.
- Os scripts PixelLab e SpriteCook nunca foram executados; não se sabe se ainda funcionam.
- Fluxo atual de scripts: [asset-scripts](../../operations/asset-scripts.md); guia Pixel Lab: [pixel-lab-config](../../operations/pixel-lab-config.md).
- Regra: nunca copiar token, chave ou DSN em documentos; citar só o nome da variável.

## Objetivo
O cliente PixelLab só obtém a credencial do ambiente e falha com erro explicativo quando ela falta.

## Decisões de que depende
| ADR | Assunto | Status |
|---|---|---|
| — | Nenhum ADR; a revogação/rotação do token já exposto é decisão do responsável (ver Questões em aberto) | Pendente |

## Fatos técnicos verificados
| Afirmação | Fonte | Verificado em |
|---|---|---|
| `pixellab_client.cjs` usa `process.env.PIXELLAB_API_KEY` ou um token escrito no arquivo (`DEFAULT_TOKEN`) | `scripts/pixellab_client.cjs` (l.17-20) | 2026-10-11 |
| `PIXELLAB_API_KEY` e `SPRITECOOK_API_KEY` hoje só existem no ambiente local | Texto da spec original (não reverificado) | 2026-10-11 |

## Escopo
- Remover a credencial escrita no código de `scripts/pixellab_client.cjs`.
- Sair com erro explicativo quando `PIXELLAB_API_KEY` não existir.

## Fora de escopo
- Revogar ou rotacionar o token (ação do responsável no serviço).
- Reescrever o histórico do Git.
- Qualquer outro comportamento do cliente ou dos scripts de arte.

## Arquivos e contratos
- Alterar: `scripts/pixellab_client.cjs`. Esta spec está em `defining/`: nenhum arquivo deve ser alterado até a aprovação.
- Variável de ambiente: `PIXELLAB_API_KEY`.
- Mensagem de erro e código de saída: a definir (ver Pendências).

## Critérios de aceite
- **PB-1** (PA-6, parte 1) O `scripts/pixellab_client.cjs` não deve conter credencial escrita no código (provisório).
- **PB-2** (PA-6, parte 2) Se `PIXELLAB_API_KEY` não existe, então o `scripts/pixellab_client.cjs` deve sair com erro explicativo (provisório).

## Plano de verificação
| Critério | Como verificar |
|---|---|
| PB-1 | Inspeção: `grep -n "DEFAULT_TOKEN" scripts/pixellab_client.cjs` sem resultado |
| PB-2 | Teste executando o script sem a variável |

## Questões em aberto
- O token em `pixellab_client.cjs` é válido e foi exposto: revogar/rotacionar é decisão do responsável.
- Se os scripts PixelLab/SpriteCook ainda funcionam: nunca executados.

## Pendências para promover a backlog
- Aprovação do responsável; decisão sobre a revogação/rotação do token.
- Definir mensagem e código de saída do erro (PB-2), removendo "(provisório)".
- Nomear o teste do plano de verificação.

## Referências
- [asset-scripts](../../operations/asset-scripts.md), [pixel-lab-config](../../operations/pixel-lab-config.md)
- `scripts/pixellab_client.cjs`
