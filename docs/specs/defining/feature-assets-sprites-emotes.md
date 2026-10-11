# Feature: sprites de emotes de inimigo

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Classe:** B
**Depende de:** nenhum
**Prioridade:** P3 (sugerida)
**Esforço:** —
**Estado vs código:** verificado em 2026-10-11 (leitura estática): ícones de emote são procedurais, sem arquivo.

**Origem:** categoria "Emotes" do escopo de `feature-assets-mapeamento-de-sprites.md` (removida).

## Contexto
- Contrato comum: [feature-assets-sprites-contrato-do-manifesto](feature-assets-sprites-contrato-do-manifesto.md).

## Objetivo
Os ícones de emote têm sprite físico registrado no manifesto, com fallback procedural.

## Decisões de que depende
Nenhuma ADR; depende das decisões do contrato (resolução proposta: ícones 16x16 ou 32x32).

## Fatos técnicos verificados
Nenhum além do estado procedural acima (leitura estática, 2026-10-11).

## Escopo
`icon_alert`, `icon_suspicious`, `icon_flee`, `icon_skull`. Hoje: procedural.

## Fora de escopo
Gerar a arte; alterar a IA ou os gatilhos dos emotes.

## Arquivos e contratos
- Alterar: `src/game/assets/assetManifest.json`; `src/utils/textureGenerator.ts` só se uma chave mudar.
- Criar: arquivos em `public/assets/` (pasta a definir). Conferir o header com `file`.

## Critérios de aceite
- **EM-1** (novo, derivado de SP-1) Quando um ícone de emote tem arquivo registrado, o BootScene deve usar o sprite físico em vez da textura procedural (provisório).

## Plano de verificação
| Critério | Como verificar |
|---|---|
| EM-1 | `pnpm run test`; aparência: não validado, precisa de playtest humano |

## Questões em aberto
- Confirmar no manifesto as chaves dos ícones.

## Pendências para promover a backlog
- Aprovação do responsável; confirmar chaves; remover "(provisório)".

## Referências
- [contrato do manifesto](feature-assets-sprites-contrato-do-manifesto.md)
