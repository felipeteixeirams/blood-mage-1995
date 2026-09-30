# Spec 11.02: Atmosfera e Névoa Volumétrica (Atmospherics & Weather)

## Objetivo
Prover uma camada superior visual de névoa volumétrica e poeira rasteira em
movimento contínuo sobre os cenários de *Blood Mage 1995*. O objetivo é
enriquecer a atmosfera gótica sem comprometer a visibilidade do jogador ou
afetar a taxa de quadros em dispositivos móveis.

## Status
🟢 COMPLETO

## O que foi Entregue
- **Névoa em Camadas Duplas:**
  Implementação de camadas de névoa rasteira (`groundFog`) e névoa alta
  (`upperHaze`) utilizando `Phaser.GameObjects.TileSprite`.
- **Deslocamento Procedural Contínuo:**
  Movimento suave de translação das texturas (`tilePositionX` e
  `tilePositionY`) simulando brisas dinâmicas e fumaça em suspensão.
- **Adaptação Reativa por Bioma:**
  Ajustes automáticos de tonalidade, velocidade do vento e densidade
  gerenciados através do `AtmosphereSystem.ts` e do `WorldManager.ts`.
- **Proteção da Visibilidade Tática:**
  Fixação da opacidade máxima (`fogAlpha <= 0.25`) para evitar a
  ocultação de inimigos, armadilhas ou projéteis em combate.
- **Rendimento sem Assets Adicionais:**
  Utilização de texturas geradas via Canvas/código, mantendo consumo de
  memória reduzido e taxa constante de 60 FPS.

## Contexto de Negócio e Impacto no Gameplay
A névoa volumétrica reforça a estética sombria de horror gótico sem
criar ruído visual excessivo. A suavidade da movimentação do vento dá vida
ao ambiente estático da masmorra, aumentando a imersão visual sem
interferir na leitura táctica do combate.

## Arquitetura e Contratos de Módulos
- **Módulo do Sistema:**
  `AtmosphereSystem.ts` controla a instanciação, translação e transição de
  opacidade dos sprites de névoa.
- **Gerenciador de Mundo:**
  `WorldManager.ts` fornece as variáveis públicas de clima e velocidade do
  vento por bioma.
- **Integração na Cena:**
  `GameScene.ts` orquestra a adição das camadas visuais na profundidade
  adequada, ficando abaixo do HUD e acima do cenário.

## Referência no Código
- `src/game/systems/AtmosphereSystem.ts` —
  Lógica de criação, atualização e transições do sistema de névoa.
- `src/game/systems/WorldManager.ts` —
  Parâmetros globais do mundo, variáveis de bioma e dados de clima.
- `src/game/scenes/GameScene.ts` —
  Atualização da cena e amarração do ciclo de vida das camadas visuais.

## Validação e Garantia de Qualidade
- **Checagem Estática:**
  Verificação estrita executada via `pnpm run typecheck` garantindo
  conformidade total de tipos.
- **Testes de Integração:**
  Suíte de ciclo de vida das cenas confirmando a correta alocação e remoção
  dos sprites durante a transição de andares.
- **Garantia de Desempenho:**
  Testes em tempo de execução garantindo estabilidade do loop sem consumo
  excessivo de memória de vídeo (VRAM).

## Notas e Evoluções Futuras
- O sistema ajusta-se automaticamente às opções de acessibilidade e redução
  de efeitos visuais do usuário sem causar erros no ciclo da cena.
