# Título da spec

**Mestre:** [specs](README.md)
**Estágio:** defining | backlog | in-progress
**Aprovação do responsável:** pendente | aprovada por <nome> em <data>

> Os links relativos abaixo valem para este arquivo; ao copiar a spec para uma pasta de estágio, acrescente um `../`. Uma spec em `backlog/` ou `in-progress/` precisa ter **aprovação registrada**. Ela deve ser completa o bastante para que qualquer modelo de capacidade intermediária a implemente **sem decidir nada**: toda decisão já está tomada, todo fato técnico está verificado e todo comportamento está escrito.

## Contexto
Situação atual, com referências ao código (arquivos e funções) e aos documentos.

## Objetivo
O resultado observável, em uma ou duas frases.

## Decisões de que depende
ADRs em [decisions](../decisions/README.md) que precisam estar **Aprovadas**. Em `backlog/`/`in-progress/` todas estão.

| ADR | Assunto | Status |
|---|---|---|
| | | |

## Fatos técnicos verificados
Cada fato com fonte e data (ver [decisions](../decisions/README.md)). Sem fonte, não entra.

| Afirmação | Fonte | Verificado em |
|---|---|---|
| | | |

## Escopo
O que será feito, em itens verificáveis.

## Fora de escopo
O que não será feito (para o implementador não "completar").

## Arquivos e contratos
Tudo que o implementador precisa para não inferir:
- **Arquivos a criar/alterar** (caminhos exatos) e **a não tocar**.
- **Contratos**: entradas e saídas (formato, tipos, códigos HTTP), mensagens de erro, variáveis de ambiente, tabelas/colunas e migrations.
- **Valores concretos**: limites, tempos, nomes — nunca "adequado" ou "a definir".

## Critérios de aceite
Padrões [EARS](ears.md), cada um com ID (`XX-1`, `XX-2`…), cobrindo o caminho feliz e as falhas.

- **XX-1** Quando <gatilho>, o <sistema> deve <resposta>.

## Plano de verificação
Como cada critério é verificado: teste automatizado (nome/arquivo) ou verificação manual (passo a passo).

| Critério | Como verificar |
|---|---|
| XX-1 | |

## Questões em aberto
Só em `defining/`. Uma spec com questões em aberto **não** pode estar em `backlog/` nem `in-progress/`.

## Referências
Documentos e código relacionados.
