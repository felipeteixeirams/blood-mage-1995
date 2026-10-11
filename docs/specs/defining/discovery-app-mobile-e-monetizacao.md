# Discovery: app mobile, wrapper nativo e monetização

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Estado vs código:** verificado em 2026-10-11 (leitura estática): wrapper, anúncios, passe, loja e compra com dinheiro real não existem (`package.json` sem `@capacitor/*`, Cordova, SDK de anúncio ou pagamento). Existem: PWA (`vite-plugin-pwa`, `vite.config.ts`), `scripts/build-twa.sh` e `scripts/build-steam.sh` (nunca executados), vibração via `navigator.vibrate` (`src/utils/haptics.ts`), paletas cosméticas gratuitas (`src/data/palettes.json`, 4 paletas; `activePaletteId` em `src/utils/localStorage.ts`; seletor em `src/components/GameplayHUD.tsx`) e a moeda de jogo `bloodCrystals` (`gameStore.ts`, ganha jogando). Faltam: tudo o que está em Escopo.

## Contexto
- Discovery: o texto abaixo é o que seria entregue se o responsável aprovar. Nada é decisão. Plataforma ativa hoje: PWA ([release-strategy](../../product/release-strategy.md)).
- A proposta original sugere um wrapper nativo (Capacitor) para Android/iOS, com serviços de loja (faturamento, notificações), e três frentes de receita sem pay-to-win: anúncios premiados voluntários, passe sazonal e loja de cosméticos com Cristais de Sangue premium.
- O código só tem uma moeda (`bloodCrystals`, ganha em jogo) e nenhum identificador de jogador na nuvem ([account-and-data](../../product/account-and-data.md)). Passe e compras exigem decidir conta/backend (ADR 0011) e canal de distribuição (ADR 0010).
- Na Campanha o único NPC da Safe House é Maelen; o Clérigo aparece só no modo Arcade ([campaign](../../gameplay/campaign.md), `DungeonFlowController.ts`).
- O marketing da proposta original (Reddit, micro-influenciadores, pré-registro) é plano de negócio, sem código; fica em Decisões a confirmar.

## Objetivo
Se aprovado, o jogo roda como app nativo empacotado (decisão de wrapper) e oferece monetização opcional que nunca vende poder de combate.

## Decisões de que depende
| ADR | Assunto | Status |
|---|---|---|
| [0010](../../decisions/0010-canais-de-distribuicao.md) | Canais de distribuição (PWA, TWA/Play Store, Steam) | Proposta |
| [0011](../../decisions/0011-conta-e-dados-do-jogador.md) | Conta e dados do jogador (passe e compras precisam de conta ou validação de recibo) | Proposta |
| [0012](../../decisions/0012-monetizacao-preco-e-metas-de-retencao.md) | Monetização, preço e metas de retenção | Proposta |

## Fatos técnicos verificados
| Afirmação | Fonte | Verificado em |
|---|---|---|
| Sem dependência de Capacitor, Cordova, anúncios ou pagamento | `package.json`; `grep -rniE "capacitor\|cordova\|admob\|rewarded\|survivalPass\|battlePass" src package.json vite.config.ts scripts` (só nomes de imagem) | 2026-10-11 |
| `vite.config.ts` não define `outDir` (padrão do Vite: `dist`) | `vite.config.ts` | 2026-10-11 |
| Vibração usa `navigator.vibrate` | `src/utils/haptics.ts` | 2026-10-11 |
| 4 paletas gratuitas (`crimson`, `corrupted`, `golden`, `shadow`) | `src/data/palettes.json` | 2026-10-11 |
| `bloodCrystals` é a moeda de jogo persistida em `localStorage` | `src/store/gameStore.ts`, `src/utils/localStorage.ts` | 2026-10-11 |
| Clérigo existe só no spawn Arcade; ação "curar" no HUD | `src/game/systems/DungeonFlowController.ts` (~l.439), `src/components/GameplayHUD.tsx` | 2026-10-11 |

## Decisões a confirmar
| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| 1 | Canal de loja (Android/iOS) | A) só PWA; B) TWA (Bubblewrap, já há script); C) Capacitor; D) Cordova | A por ora (ADR 0010); se houver loja, B antes de C: o script já existe e o jogo não precisa de API nativa além de vibração |
| 2 | Wrapper nativo | Capacitor ou Cordova | Capacitor, só se decisão 1 for C: mantido ativamente e integra com o `dist/` do Vite |
| 3 | Haver monetização | nenhuma / anúncios / passe / loja | Nenhuma por ora (ADR 0012): sem canal e sem medição |
| 4 | Anúncio premiado: quem o oferece e a recompensa | Clérigo (só existe no Arcade) ou Maelen na Campanha; Bênção da Catedral (HP leve temporário ou +10% de Cristais na próxima corrida, valores da proposta original) | Decidir só após 3; valores seguem como provisórios |
| 5 | Passe de Sobrevivência | preço (proposta: US$ 2 a 5), duração (mês/trimestre), trilha gratuita e premium | Fora até existir conta (ADR 0011) |
| 6 | Cristais de Sangue premium | reaproveitar `bloodCrystals` ou moeda separada | Moeda separada: `bloodCrystals` ganha em jogo não pode ser comprada sem mudar a economia |
| 7 | Cosméticos pagos | skins de corpo, visuais de arma, paletas de sangue (hoje 4 paletas são gratuitas) | Manter as 4 gratuitas; pagos só os novos |
| 8 | Marketing e lançamento orgânico | Reddit/Discord, micro-influenciadores, pré-registro na Play Store | Fora do repositório: é plano de negócio do responsável |

## Escopo
Tudo o abaixo é condicional às decisões 1 a 7.
- Wrapper: projeto nativo apontando para o build web, com script de build e documentação em `docs/operations/`.
- Vibração pelo wrapper, se a API do wrapper substituir `navigator.vibrate`.
- Anúncio premiado opcional: interação do jogador, vídeo, recompensa da decisão 4, sem anúncio forçado.
- Passe sazonal com trilha gratuita e premium, só cosmética.
- Loja de cosméticos com compra via loja do sistema operacional, sem item de poder.

## Fora de escopo
- Qualquer item pago que altere dano, vida, drop ou progressão.
- Anúncios forçados, banners em combate, pop-ups.
- Marketing (decisão 8) e política de privacidade/classificação etária (tratadas pelo ADR 0010).
- Cloud save (spec `feature-cloud-save.md`).

## Arquivos e contratos
- A definir após as decisões; sem arquivo nomeado porque o wrapper e o SDK de pagamento não foram escolhidos.
- Provável: `package.json` (dependências do wrapper), pasta do projeto nativo, `src/utils/haptics.ts`, `src/store/gameStore.ts` (moeda/direitos de compra), `src/utils/localStorage.ts` (novas chaves com schema Zod), HUD React para loja e anúncio (UI só em React).
- Não tocar: regras de combate e balance; `src/game/assets/assetManifest.json`.

## Critérios de aceite
Todos dependem de decisão aberta.
- **MON-1** Quando o build nativo é gerado a partir do build web, o wrapper deve empacotar o jogo sem alterar o comportamento de gameplay (provisório).
- **MON-2** Se o dispositivo não suporta vibração, então o sistema de haptics deve ignorar a chamada sem lançar exceção (provisório).
- **MON-3** O jogo não deve exibir anúncio sem ação explícita do jogador (provisório).
- **MON-4** Quando o jogador conclui o anúncio premiado, o gameStore deve conceder a recompensa definida na decisão 4 uma única vez (provisório).
- **MON-5** Se o anúncio falha ao carregar ou é interrompido, então o jogo não deve conceder a recompensa e deve exibir mensagem de erro no HUD React (provisório).
- **MON-6** O gameStore não deve aplicar nenhum bônus numérico de combate a partir de item adquirido com dinheiro real (provisório).
- **MON-7** Se a compra é cancelada ou falha, então o jogo não deve conceder o item nem debitar moeda (provisório).
- **MON-8** Quando o jogador compra um cosmético, o jogo deve aplicá-lo pelo mesmo caminho de tint/paleta já usado em `Player.applyCosmeticTint` (provisório).

## Plano de verificação
| Critério | Como verificar |
|---|---|
| MON-1 | manual: rodar o app nativo e jogar uma partida; não validado: precisa de playtest humano |
| MON-2 | teste unitário de `haptics.ts` sem `navigator.vibrate` (novo, `src/utils/haptics.test.ts`) |
| MON-3 | inspeção: nenhuma chamada de anúncio fora do handler de clique da recompensa |
| MON-4, MON-5 | teste unitário do gameStore com SDK simulado |
| MON-6 | teste unitário: stats de combate idênticos com e sem item pago |
| MON-7 | teste unitário com resposta de compra simulada (falha/cancelamento) |
| MON-8 | teste unitário de seleção de tint; manual: ver a cor no jogador |

## Questões em aberto
- Responsável aprovar a existência de monetização e do wrapper (decisões 1 a 3).
- Valores: duração do passe, preço, duração/valor da Bênção (decisões 4 a 5).
- SDK de anúncio e de pagamento: não escolhidos; compatibilidade não verificada em fonte primária.
- Exigências atuais de Play Store/App Store e IARC: não consultadas.
- Moeda separada para compras (decisão 6).

## Pendências para promover a backlog
- Discovery; depende de decisão de produto e negócio: aprovação do responsável.
- ADRs 0010, 0011 e 0012 aprovados.
- Decisões 1 a 8 respondidas; questões em aberto resolvidas.
- Fatos a verificar: SDKs e requisitos de loja em fonte oficial.
- Dividir em specs menores (wrapper, anúncio, passe, loja) antes de implementar: hoje é um épico.

## Referências
- [release-strategy](../../product/release-strategy.md), [account-and-data](../../product/account-and-data.md), [campaign](../../gameplay/campaign.md)
- ADRs [0010](../../decisions/0010-canais-de-distribuicao.md), [0011](../../decisions/0011-conta-e-dados-do-jogador.md), [0012](../../decisions/0012-monetizacao-preco-e-metas-de-retencao.md)
- [feature-polimento-de-producao-pwa-e-steam](feature-polimento-de-producao-pwa-e-steam.md), [feature-cloud-save](feature-cloud-save.md)
