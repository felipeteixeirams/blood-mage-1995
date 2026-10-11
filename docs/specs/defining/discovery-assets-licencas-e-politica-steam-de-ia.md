# Discovery: IA generativa na arte, licenças e política da Steam

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Classe:** D
**Depende de:** nenhum
**Estado vs código:** verificado em 2026-10-11 (leitura estática): nenhuma ferramenta de IA geral é usada; existem só `scripts/pixellab_client.cjs`, `scripts/fetch-spritecook-sprite.cjs` e a skill `spritecook-integration`, nunca executados.

**Origem:** contexto, decisão 1, fatos de licença/Steam e questões de fonte de IA de `discovery-assets-pipeline-de-arte-com-ia.md` (removida).

## Contexto
- Discovery: nada é decisão. A ideia original era usar IA generativa como fonte de concepts, com limpeza humana (Aseprite/Photoshop) no meio.
- Motivo da proposta (afirmação do texto original, não verificada): IA gera "pixel art" sem grade real, frames desalinhados e dimensões incompatíveis com os frames fixos do manifesto.
- Fontes atuais: PixelLab e SpriteCook. A regra de binários e a origem do spritesheet do jogador estão em `CLAUDE.md`.
- Specs irmãs: [geração de prompt](feature-assets-pipeline-geracao-de-prompt.md), [ingestão](feature-assets-pipeline-ingestao-de-sprite.md), [discovery-assets-arte-ui-audio-e-sprites](discovery-assets-orcamento-licencas-e-creditos.md).

## Objetivo
O responsável decide quais fontes de IA a arte do jogo pode usar, com licença, uso comercial e requisitos da Steam verificados.

## Decisões de que depende
| ADR | Assunto | Status |
|---|---|---|
| — | Nenhum ADR existe; a decisão 1 abaixo é do responsável | Pendente |

## Fatos técnicos verificados
| Afirmação | Fonte | Verificado em |
|---|---|---|
| Steam (Content Survey, seção de IA): o foco é IA que gera conteúdo que acompanha o jogo e é consumido por jogadores (arte, som, narrativa, localização); ganho de eficiência no desenvolvimento "não é o foco" da seção | https://partner.steamgames.com/doc/gettingstarted/contentsurvey#ai | 2026-10-11 |
| Steam, IA pré-gerada (criada em desenvolvimento e distribuída com o jogo): a Valve avalia a saída como avalia conteúdo sem IA; o Acordo de Distribuição exige que o jogo não tenha conteúdo ilegal ou infrator | https://partner.steamgames.com/doc/gettingstarted/contentsurvey#ai | 2026-10-11 |
| Steam, IA gerada ao vivo (em execução): mesmas regras da pré-gerada, mais informar as salvaguardas (guardrails) aplicadas; a página não define quais são aceitáveis; sem IA gerada ao vivo de conteúdo sexual adulto "no momento" | https://partner.steamgames.com/doc/gettingstarted/contentsurvey#ai | 2026-10-11 |
| Steam: se o jogo usou serviços de IA no desenvolvimento ou os inclui no produto, o questionário pede descrever a implementação em detalhe (trecho lido por resumo de página, não texto integral) | https://partner.steamgames.com/doc/gettingstarted/contentsurvey#ai | 2026-10-11 |
| Atualização de jan/2026 (divulgação deixa de exigir ferramentas só de eficiência; data divulgada varia entre 16 e 19/01): só fontes secundárias; anúncio oficial da Valve não localizado. **Não verificado** em fonte primária | https://gigazine.net/gsc_news/en/20260120-steam-updates-ai-disclosure-guidelines (secundária) | 2026-10-11 |
| PixelLab, termos: seção 1.3 diz que o usuário detém os direitos das criações e pode usá-las comercialmente; 3.3 diz que mantém a propriedade e pode usar, modificar e distribuir as saídas para qualquer fim, exceto treinar outros modelos sem permissão (lido por resumo de página; não é aconselhamento jurídico) | https://www.pixellab.ai/termsofservice | 2026-10-11 |
| SpriteCook, termos, seção 6: "you may use, reproduce, and distribute outputs you generate", sujeito aos termos e à lei; sem menção explícita a propriedade ou uso comercial; saídas podem não ser únicas; o usuário é o único responsável por avaliar infração; seção 11: sem garantias | https://www.spritecook.ai/terms | 2026-10-11 |
| Termos de Steam sobre uso de arte de PixelLab/SpriteCook especificamente: nenhuma fonte oficial encontrada. **Não verificado** | n/a | 2026-10-11 |

## Decisões a confirmar
| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| 1 (decisão 1 original) | Usar IA generativa como fonte de concepts com limpeza humana | sim / não / manter só PixelLab e SpriteCook | Manter as fontes atuais (PixelLab, SpriteCook) e avaliar IA geral só se faltar arte; licença e custo são do responsável |

## Escopo
- Verificar, em fonte primária, licença e uso comercial das fontes de IA escolhidas e os requisitos da Steam.
- Registrar a decisão do responsável sobre as fontes permitidas.

## Fora de escopo
- Scripts de prompt e de ingestão (specs irmãs).
- Gerar arte final por IA sem limpeza humana.
- Aconselhamento jurídico.

## Arquivos e contratos
Nenhum arquivo de código. Resultado esperado: decisão registrada em [decisions](../../decisions/README.md) (ADR a criar pelo responsável), com o fato de licença, fonte e data.

## Critérios de aceite
Discovery sem critério de comportamento de código; o resultado é verificável por inspeção.
- **PL-1** (novo) Quando o responsável decide as fontes de IA, a decisão deve estar registrada em ADR com a licença verificada em fonte primária (provisório).

## Plano de verificação
| Critério | Como verificar |
|---|---|
| PL-1 | Inspeção do ADR e dos fatos desta spec |

## Questões em aberto
- Fonte de IA, licença e uso comercial dos assets gerados: não verificados.
- Atualização de jan/2026 da Steam e termos de Steam sobre arte de PixelLab/SpriteCook: sem fonte primária.

## Pendências para promover a backlog
- Discovery; depende de decisão de produto e custo: aprovação do responsável.
- Decisão 1 respondida; questões em aberto resolvidas.
- Fatos a verificar: licença da IA escolhida.

## Referências
- [asset-scripts](../../operations/asset-scripts.md), [pixel-lab-config](../../operations/pixel-lab-config.md)
- [discovery-assets-arte-ui-audio-e-sprites](discovery-assets-orcamento-licencas-e-creditos.md)
