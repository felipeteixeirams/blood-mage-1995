# Spec 11.03: Decals de Sangue e Reações do Mundo (World Reactions)

## Objetivo
Renderizar marcas persistentes de combate no solo, incluindo manchas de
sangue, pegadas ensanguentadas e zonas líquidas reflexivas em *Blood Mage 1995*.
O objetivo é oferecer um histórico visual dos confrontos sem exceder o
orçamento de memória e processamento.

## Status
🟢 COMPLETO

## O que foi Entregue
- **Fila de Decals com Limite FIFO:**
  Gerenciador de marcas no solo (`BloodSplatterSystem.ts`) que limita a
  quantidade ativa de decals, reciclando as marcas mais antigas.
- **Textura Procedural de Pegada (`footprint_bloody`):**
  Geração de silhuetas de pegadas de botas através do `textureGenerator.ts`,
  sem dependência de assets de imagem externos.
- **Rastreamento de Sangue Úmido:**
  Mecanismo de detecção de sangue fresco (`isNearWetBlood`) que gera uma
  trilha de pegadas desbotantes à medida que o personagem caminha após um
  combate.
- **Zonas Líquidas Reflexivas:**
  Associação de poças de sangue ao `ReflectionSystem.ts`, permitindo reflexos
  locais e interação com o sistema de iluminação.
- **Secagem e Escurecimento Gradual:**
  Transição progressiva de transparência e tonalidade simulando o
  envelhecimento do sangue no solo.

## Contexto de Negócio e Impacto no Gameplay
As marcas de sangue e pegadas proporcionam uma sensação palpável de impacto
das batalhas no ambiente. A presença de trilhas de passos ensanguentados e
poças reflexivas atua como um feedback tátil permanente das vitórias do jogador.

## Arquitetura e Contratos de Módulos
- **Sistema de Decals:**
  `BloodSplatterSystem.ts` gerencia o ciclo de vida, transições de alpha e
  desbotamento de todas as marcas no solo.
- **Gerador de Texturas:**
  `textureGenerator.ts` constrói proceduralmente a textura da pegada e
  variações de manchas.
- **Módulo de Reflexo:**
  `ReflectionSystem.ts` processa as regiões com poças úmidas para
  renderização de brilho e reflexos de feitiços.

## Referência no Código
- `src/game/systems/BloodSplatterSystem.ts` —
  Lógica do sistema de decals, detecção de fluidos úmidos e reciclagem FIFO.
- `src/game/systems/BloodSplatterSystem.test.ts` —
  Testes unitários do controle de limites e geração de pegadas.
- `src/game/systems/ReflectionSystem.ts` —
  Registro de zonas reflexivas em poças de sangue no chão.
- `src/utils/textureGenerator.ts` —
  Criação da textura procedural de pegada de bota ensanguentada.
- `src/game/scenes/GameScene.ts` —
  Sincronização do movimento do jogador com o disparo das pegadas no solo.

## Validação e Garantia de Qualidade
- **Checagem Estática:**
  Verificação de compilação sem erros executando `pnpm run typecheck`.
- **Testes Unitários:**
  Testes em `BloodSplatterSystem.test.ts` cobrindo adição de decals,
  desbotamento por distância e limite máximo de elementos na fila.
- **Estabilidade:**
  Execução contínua sem vazamentos de memória ou degradação da taxa de
  quadros após combates intensos.

## Notas e Evoluções Futuras
- A reciclagem automática garante uso consciente de memória em dispositivos
  móveis de especificações reduzidas.
