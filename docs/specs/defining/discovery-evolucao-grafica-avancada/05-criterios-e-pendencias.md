# Evolução gráfica avançada: critérios e pendências (parte 5)

**Mestre:** [discovery-evolucao-grafica-avancada](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Estado vs código:** verificado em 2026-10-11 (leitura estática): os critérios abaixo cobrem só o que falta do Eixo A e do mixer do Eixo C; o restante do Eixo A já existe (parte 2). Nenhum critério abaixo está implementado.

Parte 5 de 5. Índice das partes: [README](README.md). Esta é uma discovery: os critérios são provisórios e dependem de decisão de produto do responsável. Prefixo `EGA`. Critérios dos Eixos B e C estão em AES e UIA.

## Critérios de aceite
- **EGA-1** Quando um crítico ou execução ocorre e `postProcessingEnabled` é verdadeiro, o LightingPolish deve ativar o bloom apenas durante o evento (provisório).
- **EGA-2** Quando a cena entra em um limite de cena e o Pixelate foi aprovado, o PostFXSystem deve aplicar o filtro Pixelate (provisório; decisão 5).
- **EGA-3** Enquanto o renderer é WebGL e `postProcessingEnabled` é verdadeiro, o LightingSystem deve iluminar o jogador, os tiles e as partículas por Light2D (provisório).
- **EGA-4** Enquanto `postProcessingEnabled` é falso, o LightingSystem não deve criar luzes nem aplicar `setLighting` (provisório).
- **EGA-5** Se o renderer não é WebGL, então o PostFXSystem e o LightingSystem devem permanecer inativos sem lançar erro (provisório).
- **EGA-6** O LightingSystem não deve manter mais luzes ativas que o `maxLights` configurado (provisório; valor em aberto).
- **EGA-7** O gerador de texturas deve registrar um normal map para a spritesheet do jogador (provisório).
- **EGA-8** Se a spritesheet do jogador cai no fallback procedural, então o jogador deve continuar visível sob a mesma chave com ou sem normal map (provisório).
- **EGA-9** Onde o self-shadow foi aprovado, o renderizador deve ativar `selfShadow` em jogador e inimigos (provisório; decisão 7).
- **EGA-10** Quando o jogador altera o toggle de qualidade nas Configurações, o SettingsScene deve gravar `postProcessingEnabled` (provisório).
- **EGA-11** Quando a cena é destruída, o LightingSystem e o PostFXSystem devem remover suas luzes e filtros (provisório).
- **EGA-12** Quando o HP do jogador chega a 30% ou menos, o soundEngine deve intensificar a percussão da BGM (provisório; só se o mixer dinâmico for aprovado).
- **EGA-13** Quando um chefe entra em `frenzy`, o soundEngine deve aplicar distorção ao som (provisório; idem).
- **EGA-14** Enquanto o jogo está mudo, o soundEngine não deve produzir os efeitos de mixer dinâmico (provisório).

## Plano de verificação
| Critério | Como verificar |
|---|---|
| EGA-1, EGA-2 | Estender `src/game/systems/LightingPolish.test.ts` e `PostFXSystem.test.ts` |
| EGA-3, EGA-4, EGA-6, EGA-11 | Estender `src/game/systems/LightingSystem.test.ts` (cena simulada) |
| EGA-5 | Teste unitário com renderer Canvas simulado |
| EGA-7, EGA-8 | Estender `src/utils/textureGenerator.test.ts` |
| EGA-9 | Manual com `?perf` (não validado) |
| EGA-10 | Teste da cena de Configurações; manual |
| EGA-12 a EGA-14 | Teste unitário em `src/utils/soundEngine.test.ts`; sensação: não validado, precisa de playtest humano |
| 60 FPS e aparência | Não validado: precisa de playtest humano em celular (`?perf`) |

## Questões em aberto
- Valores de `maxLights`, raios e intensidades; definição de "dispositivo médio" para o gate de 60 FPS (ADR 0013).
- Destino do fallback sem WebGL e do overlay de escuridão (ADR 0005).
- Pixelate e self-shadow: custo e aparência não medidos.
- Se `setLighting` em tiles e partículas é viável no Phaser 4.2.1 instalado: fato não verificado (só `Enemy.ts` o usa hoje).
- Normal map do jogador: por derivada ou arte manual.
- Estimativas de esforço do original não verificadas.

## Pendências para promover a backlog
- Discovery: depende de decisão de produto; não há aprovação do responsável.
- Aprovar as decisões 1 a 7 (parte 1) e os ADRs 0005, 0006 e 0013.
- Fechar as questões em aberto e verificar o suporte a `setLighting`, Pixelate e `selfShadow` no Phaser instalado.
- Dividir o Eixo A restante e o mixer dinâmico em specs pequenas.

## Referências
- [Parte 4](04-matriz-riscos-referencias.md), [lighting-and-effects](../../../gameplay/lighting-and-effects.md)
- [AES](../discovery-assets-externos-e-sprites.md), [UIA](../discovery-ui-e-assets-externos/README.md)
