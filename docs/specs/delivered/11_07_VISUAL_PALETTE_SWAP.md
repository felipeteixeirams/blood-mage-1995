# Spec 11.07: Palette Swap Procedural e Cosméticos de Itens (Items Wearables)

## Objetivo
Refletir visualmente o progresso e o equipamento do jogador em *Blood Mage 1995*.
A spec altera proceduralmente a tonalidade de cor do personagem e gera
partículas emulando a aura dos itens equipados de alta raridade.

## Status
🟢 COMPLETO

## O que foi Entregue
- **Cálculo de Tonalidade por Raridade (`equipmentPalette.ts`):**
  Módulo puro que define a cor base do personagem a partir da maior raridade
  entre arma e armadura equipadas (raro, épico ou lendário).
- **Aplicação de Tint no Sprite:**
  Atualização dinâmica em `Player.ts` mantendo a cor do equipamento sincronizada
  e redefinindo a paleta após o término de efeitos de status.
- **Faíscas Cosméticas Lendárias (`particle_ember_spark`):**
  Emissão probabilística de brasas ao redor do personagem quando pelo menos um
  item lendário está em uso.
- **Integração com Eventos de Inventário:**
  Notificação via `gameStore.ts` ao equipar, desequipar ou perder itens na
  morte, atualizando instantaneamente a aparência.
- **Fallback para Paleta Personalizada:**
  Restauração para a cor padrão ou para a escolha manual do jogador nas
  configurações caso nenhum item raro+ esteja equipado.

## Contexto de Negócio e Impacto no Gameplay
O feedback cosmético imediato ao equipar armas e armaduras de alta raridade
aumenta o prazer da progressão. A aura dourada e as faíscas em equipamentos
lendários reforçam visualmente a ascensão de poder do personagem.

## Arquitetura e Contratos de Módulos
- **Módulo de Paletas:**
  `equipmentPalette.ts` centraliza as funções puras de inferência de cor e
  ativação de faíscas.
- **Entidade do Jogador:**
  `Player.ts` consome os dados do equipamento, aplica a tonalidade no sprite e
  gerencia o emissor de partículas.
- **Estado Global:**
  `gameStore.ts` notifica as alterações nos slots de equipamento (`weapon` e
  `armor`) disparando a atualização cosmética.

## Referência no Código
- `src/utils/equipmentPalette.ts` —
  Lógica pura de derivação da tonalidade por raridade e emissão de partículas.
- `src/utils/equipmentPalette.test.ts` —
  Testes unitários do cálculo de raridade e comportamento de equipamentos.
- `src/game/objects/Player.ts` —
  Aplicação da cor cosmética no sprite e controle do emissor de faíscas.
- `src/store/gameStore.ts` —
  Incremento da versão da paleta ao modificar itens equipados.

## Validação e Garantia de Qualidade
- **Checagem Estática:**
  Compilação limpa sem warnings ou erros verificada via `pnpm run typecheck`.
- **Testes Unitários:**
  Testes em `equipmentPalette.test.ts` e `gameStore.test.ts` validando
  precedência de raridade, isolamento de relíquias e reatividade.
- **Sincronismo:**
  Verificação em tempo de execução confirmando a alteração imediata de cor.

## Notas e Evoluções Futuras
- Tints de status negativos (como veneno ou sangramento) têm precedência
  temporária sobre a cor cosmética do equipamento.
