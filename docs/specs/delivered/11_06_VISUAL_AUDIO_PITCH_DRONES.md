# Spec 11.06: Pitch Shifting e Drones de Áudio (Audio Engineering)

## Objetivo
Enriquecer o feedback sonoro de *Blood Mage 1995* utilizando técnicas de
engenharia de áudio procedural. A spec introduz micro-variações de tom
(*Pitch Shifting*) nos sons repetitivos de combate e drones de sub-grave para
modulação de tensão.

## Status
🟢 COMPLETO

## O que foi Entregue
- **Micro-Variação Procedural de Tom:**
  Desvio aleatório de frequência (±6%) aplicado aos efeitos sonoros mais
  frequentes (golpes, disparos, grunhidos) em `soundEngine.ts`.
- **Sintetizador de Drone Sub-Grave:**
  Oscilador de onda dente de serra (38-52 Hz) filtrado por passa-baixas (160 Hz)
  e modulado por LFO para criar textura sonora de ameaça iminente.
- **Escalamento de Tensão Reativo:**
  Intensidade do drone calculada em tempo real combinando o número de inimigos
  hostis próximos e o percentual de vida restante do jogador.
- **Preservação Musical Harmônica:**
  Isenção proposital de variação de pitch em efeitos de interface, evolução de
  nível, abertura de baús e conclusão de contratos.
- **Sincronia com o Efeito de Tinnitus:**
  Coexistência harmônica com o som agudo de Tinnitus ativado em momentos de
  vida crítica (HP < 30%).

## Contexto de Negócio e Impacto no Gameplay
A variação orgânica de frequência impede a fadiga auditiva em sessões longas
de jogo. O drone sub-grave atua no subconsciente do jogador, elevando a
tensão em momentos de perigo iminente sem sobrecarregar a mixagem de áudio.

## Arquitetura e Contratos de Módulos
- **Motor Sonoro:**
  `soundEngine.ts` gerencia os sintetizadores Web Audio, gerador de variações
  de pitch e o oscilador de drone.
- **Gerenciador de Cena:**
  `GameScene.ts` alimenta os parâmetros de ameaça ambiente (`alertCount` e
  `hpRatio`) durante a atualização dos frames.

## Referência no Código
- `src/utils/soundEngine.ts` —
  Lógica do sintetizador, gerador de variação de frequência e controle do drone.
- `src/utils/soundEngine.test.ts` —
  Testes unitários do controle de tom aleatório, volume e modulação.
- `src/game/scenes/GameScene.ts` —
  Cálculo de ameaças próximas e disparo da atualização do drone.

## Validação e Garantia de Qualidade
- **Checagem Estática:**
  Verificação de compilação efetuada com sucesso através de `pnpm run typecheck`.
- **Testes Unitários:**
  Testes em `soundEngine.test.ts` cobrindo variação de frequência entre
  disparos sucessivos, criação lazy do oscilador e limites de ganho.
- **Integridade de Mixagem:**
  Teste de áudio confirmando que o drone permanece em volume sutil.

## Notas e Evoluções Futuras
- O volume do drone atinge no máximo 5% do volume de efeitos para atuar
  estritamente como textura de fundo.
