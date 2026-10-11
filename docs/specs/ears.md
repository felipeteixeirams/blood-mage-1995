# Critérios de aceite com EARS

**Mestre:** [specs](README.md)

Os critérios de aceite das specs seguem o **EARS** (*Easy Approach to Requirements Syntax*), criado por Alistair Mavin e colegas na Rolls-Royce. Cada critério é uma frase com forma fixa, o que o torna curto, sem ambiguidade e testável.

Estrutura geral: `[pré-condição] [gatilho] o <sistema> deve <resposta>`

## Os padrões

| Padrão | Palavra-chave | Forma | Use para |
|---|---|---|---|
| Ubíquo | — | O `<sistema>` deve `<resposta>`. | Comportamento sempre válido |
| Orientado a evento | **Quando** | Quando `<gatilho>`, o `<sistema>` deve `<resposta>`. | Reação a um evento pontual |
| Orientado a estado | **Enquanto** | Enquanto `<estado>`, o `<sistema>` deve `<resposta>`. | Comportamento válido durante um estado |
| Comportamento indesejado | **Se … então** | Se `<condição indesejada>`, então o `<sistema>` deve `<resposta>`. | Erros, falhas, entradas inválidas |
| Recurso opcional | **Onde** | Onde `<recurso presente>`, o `<sistema>` deve `<resposta>`. | Comportamento que depende de configuração/capacidade |
| Complexo | combinação | Enquanto `<estado>`, quando `<gatilho>`, o `<sistema>` deve `<resposta>`. | Estado + evento |

Equivalência com o EARS original (inglês): *The* `<system>` *shall* · *When* · *While* · *If … then* · *Where*.

## Regras

1. **Um comportamento por critério.** Se há "e" ligando duas respostas, divida em dois.
2. **Sistema nomeado.** Use o componente real (ex.: "o PlayerSkillSystem", "o HUD React", "o gameStore"), nunca "o sistema".
3. **Verificável.** Quem lê deve saber como testar: sem "rápido", "adequado", "amigável". Números só quando existirem; senão, vão para *Questões em aberto*.
4. **Sem solução escondida.** Descreva o *quê* observável; o *como* fica em Escopo.
5. **Cubra o caminho infeliz.** Para cada fluxo normal, pergunte "e se falhar?" e escreva o critério `Se … então`.
6. **ID estável.** Prefixo da spec + número (`SB-1`, `MP-3`), para citar em testes, PRs e commits.

## Formato na spec

Seção `## Critérios de aceite`, uma lista numerada com ID em negrito:

```markdown
## Critérios de aceite
- **XX-1** Quando <gatilho>, o <sistema> deve <resposta>.
- **XX-2** Se <condição indesejada>, então o <sistema> deve <resposta>.
```

## Quando exigir

- **backlog/** e **in-progress/**: critérios EARS obrigatórios, e a spec deve cumprir a *Definition of Ready* abaixo.
- **defining/**: critérios podem ser provisórios ou "A definir"; a spec lista as lacunas que impedem a promoção.

## Definition of Ready (entrar em `backlog/`)

A spec deve poder ser implementada por **qualquer modelo de capacidade intermediária, sem decidir nada**. Ela só sai de `defining/` quando todas as respostas forem "sim":

**Decisões e fatos**
1. Todas as decisões de que depende estão em ADRs **Aprovados** pelo responsável ([decisions](../decisions/README.md)), e a spec os cita?
2. Todo comportamento de produto ou de negócio da spec foi **aprovado** pelo responsável (nada é suposição de quem escreveu)? A aprovação está registrada no cabeçalho da spec.
3. Todo fato técnico de que a spec depende (a tecnologia existe, é compatível, a versão instalada oferece o recurso) está verificado, com fonte e data?

**Completude**
4. Todo critério segue um padrão EARS, tem ID e é verificável por teste ou inspeção?
5. Não há valores em aberto ("a definir", "e.g.", "conforme necessário") nem questões em aberto?
6. *Arquivos e contratos* lista caminhos, entradas/saídas, erros, variáveis de ambiente e migrations, de modo que o implementador não precise inferir nada?
7. Há *Plano de verificação* ligando cada critério a um teste ou passo manual?

**Consistência e tamanho**
8. Não contradiz outra spec, o [architecture.md](../architecture/architecture.md) nem o código existente (ou a divergência foi decidida e registrada)?
9. A spec reaproveita o que já existe no código (sistemas, utilitários, store) em vez de reimplementar, e diz o que é novo e o que é reuso?
10. As dependências de outras specs estão listadas e resolvidas ou também em `backlog/`/`in-progress/`?
11. É pequena o bastante para ser implementada e validada como uma unidade (não é um épico)?

Se falhar em qualquer item, a spec fica (ou volta) para `defining/` com as lacunas listadas. Modelo: [spec-template.md](spec-template.md).

## Quem faz o quê

- **Definir e especificar** (decisões propostas, fatos verificados, critérios, contratos): trabalho de modelos de maior capacidade, sempre sob aprovação do responsável.
- **Implementar**: qualquer modelo de capacidade intermediária, seguindo a spec à risca. Se a spec for ambígua, incompleta ou contradisser o código, o implementador **para e pergunta**; não decide nem completa a lacuna.
