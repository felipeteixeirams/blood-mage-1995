# Spec 11.01: Geração Orgânica de Dungeon (BSP + Cellular Automata)

## Objetivo
Estruturar e padronizar a geração procedural de masmorras do *Blood Mage 1995*
utilizando técnicas combinadas de Particionamento Espacial Binário (BSP) e
Autômatos Celulares. O foco principal é substituir a antiga malha retangular
rígida por layouts orgânicos com formato imprevisível, sem comprometer a
estabilidade das mecânicas de física, colisões ou navegação por minimapa.

## Status
🟢 COMPLETO

## O que foi Entregue
- **Divisão Espacial Iterativa via BSP (`bspSplit`):**
  Algoritmo que realiza partições sucessivas sobre as folhas de maior área do
  mapa, gerando uma quantidade variável de salas (sorteando entre 6 e 9 por
  andar) com proporções distintas, eliminando o antigo padrão de grade estática.
- **Distribuição Orgânica por Autômato Celular (`computeCorridorZoneGrid`):**
  Regra de vizinhança 8-direcional com duas passagens de suavização para
  distribuição natural de zonas de corredores e criptas quadradas.
- **Escultura de Salas Adaptativa (`carveRoomFromLeaf`):**
  Ajuste de proporção das salas de acordo com a zona sorteada (salas estreitas
  em zonas de corredores e salas mais amplas em zonas de criptas).
- **Garantia de Salas Especiais e Mapeamento Topológico:**
  Posicionamento determinístico da sala inicial (`spawn`), da sala de chefe
  (`boss`) na maior distância navegável, e da sala de tesouro secreto
  (`secret_treasure`) contendo baús de suprimentos.
- **Preservação de Colisões e Portas:**
  Alinhamento preciso de aberturas, passagens e tochas com o sistema Arcade
  Physics do Phaser.

## Contexto de Negócio e Impacto no Gameplay
A geração procedural orgânica eleva o fator de rejogabilidade ao garantir que
cada exploração traga um desenho único de masmorra. Corredores estreitos abrem
caminho para criptas amplas, criando pontos de emboscada e variabilidade tática
no uso de magias de área e posicionamento do personagem.

## Arquitetura e Contratos de Módulos
- **Módulo Principal:**
  `DungeonGenerator.ts` encapsula toda a lógica de partição BSP, simulação de
  autômato celular e escultura de salas.
- **Integração de Fluxo:**
  `DungeonFlowController.ts` consome a lista de salas geradas (`RoomData[]`) para
  posicionamento de inimigos, itens e colecionáveis.
- **Renderização de Cenas:**
  `GameScene.ts` aplica os conjuntos de azulejos (tilesets), ajusta colisões de
  parede e posiciona pontos de luz.

## Referência no Código
- `src/game/systems/DungeonGenerator.ts` —
  Algoritmo principal de BSP, autômato celular e criação de salas.
- `src/game/systems/DungeonGenerator.test.ts` —
  Suíte de testes unitários para o gerador de masmorra.
- `src/game/systems/DungeonFlowController.ts` —
  Controle de progressão e alocação de objetos por sala.
- `src/game/scenes/GameScene.ts` —
  Processamento visual da masmorra, posicionamento de luzes e camadas.

## Validação e Garantia de Qualidade
- **Verificação Estática:**
  Compilação com checagem estrita através do comando `pnpm run typecheck`,
  garantindo ausência de inconsistências em interfaces.
- **Suíte de Testes:**
  Testes unitários automatizados em `src/game/systems/DungeonGenerator.test.ts`
  validando contagem de salas, atribuição correta de salas especiais e ausência
  de sobreposição espacial.
- **Desempenho:**
  Teste de geração repetida (5000+ iterações) confirmando tempo de execução
  médio inferior a 5ms por andar.

## Notas e Evoluções Futuras
- A topologia gerada é 100% compatível com a renderização do minimapa React
  e com os sensores de descoberta da campanha.
