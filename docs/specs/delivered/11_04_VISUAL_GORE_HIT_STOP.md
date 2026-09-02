# Spec 11.04: Gore, Hit-Stop e Character FX (Character FX & Combat Feel)

## Objetivo
Elevar o impacto e o feedback tátil durante as ações de combate físico e
mágico em *Blood Mage 1995*. A spec abrange micropausas no tempo de
execução (*Hit Stop*), deformações instantâneas de escala (*Squash & Stretch*),
flashes de dano (*Hit Flash*) e desmembramento violento de corpos.

## Status
🟢 COMPLETO

## O que foi Entregue
- **Pausa de Impacto (*Hit Stop*):**
  Micropausas programadas de 40ms a 80ms no processamento do frame através do
  `CombatFeel.ts` no momento de acertos críticos ou mortes.
- **Deformação Dinâmica (*Squash & Stretch*):**
  Alteração rápida de escala horizontal e vertical nos sprites para simular
  deformação física no impacto de ataques.
- **Flash Luminoso de Dano (*Hit Flash*):**
  Sequência acelerada de alternância de cores (branco/vermelho) integrada
  diretamente ao ciclo de dano do `Enemy.ts`.
- **Desmembramento Particionado:**
  Separação corporal e explosão de fragmentos de cadáveres executada via
  `DismembermentSystem.ts` ao aplicar dano letal.
- **Vetorização de Impulso:**
  Propagação de restos mortais e jorros de sangue calculados com base na
  direção do ataque e massa do inimigo.

## Contexto de Negócio e Impacto no Gameplay
A combinação de Hit Stop, Hit Flash e desmembramento garante o "game feel"
característico dos clássicos dos anos 90. Cada feitiço e golpe desferido
transmite peso e potência visceral, recompensando o jogador a cada abate.

## Arquitetura e Contratos de Módulos
- **Sensação de Combate:**
  `CombatFeel.ts` centraliza a lógica de alteração temporal e deformação tátil.
- **Sistema de Gore:**
  `DismembermentSystem.ts` processa o fracionamento de corpos e dispersão
  de fragmentos.
- **Entidade do Inimigo:**
  `Enemy.ts` consome os efeitos de dano instantâneo e executa o *Hit Flash*
  em sincronia com o recebimento de acertos.

## Referência no Código
- `src/game/systems/CombatFeel.ts` —
  Lógica de controle de Hit Stop e ajustes instantâneos de escala.
- `src/game/systems/DismembermentSystem.ts` —
  Sistema de desmembramento, gore e particionamento de cadáveres.
- `src/game/objects/Enemy.ts` —
  Aplicação do Hit Flash e processamento da direção de knockback.

## Validação e Garantia de Qualidade
- **Checagem Estática:**
  Compilação limpa confirmada através do comando `pnpm run typecheck`.
- **Testes Unitários:**
  Execução de suíte em `pnpm test` cobrindo o ciclo de vida dos inimigos e o
  cálculo de direção do desmembramento.
- **Inspeção Visual:**
  Execução em jogo confirmando a resposta de combate responsiva sem
  travamentos indesejados.

## Notas e Evoluções Futuras
- Lógicas obsoletas de escala que conflitivavam com o sistema de profundidade
  isométrica foram limpas para prevenir trepidação no sprite.
