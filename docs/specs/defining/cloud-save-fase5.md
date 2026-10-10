# Cloud Save Automatizado (Extraído da Fase 5)

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente

**Estado vs código:** não verificado

## Decisões a confirmar

Comportamento e escopo abaixo são propostas sem aprovação registrada; nada aqui está decidido.

1. Se o jogo terá conta/nuvem (hoje 100% offline) e a condição de demanda validada no Beta.
2. Provedor de identidade e de armazenamento (Google Sign-in, Firebase/Firestore são apenas exemplos).
3. Privacy Policy e fluxo de exclusão de dados.

---

## Origem
Item "Nice to Have" extraído de
`in-progress/05_FASE5_POLIMENTO_PRODUCAO_PWA_STEAM.md`
em 2026-09-07, durante triagem de impedimentos — todo o resto da Fase 5
(Must-Have) já está `delivered/05_FASE5_POLIMENTO_PRODUCAO_COMPLETO.md`;
só este item ficava preso em `in-progress/` sem próximo passo executável.

## Escopo (quando desbloqueado)
- Provedor de identidade (ex: Google Sign-in) gerando `Player ID` único.
- Salvamento em nuvem multiplataforma (Firebase/Firestore ou equivalente)
  sincronizado com o `localStorage` local existente (`src/utils/localStorage.ts`),
  sem quebrar o fluxo 100% offline atual como fallback.
- Privacy Policy e fluxo de exclusão de dados (obrigação legal que acompanha
  login — motivo pelo qual isso foi deliberadamente adiado desde o início,
  ver `docs/product/ACCOUNT_AND_DATA.md`).

## Critério para desbloquear
1. Felipe confirma explicitamente que quer avançar com Cloud Save.
2. Validação de demanda real de jogadores (Beta) — conforme o próprio
   `ACCOUNT_AND_DATA.md` prevê como pré-condição.

Até lá, esta spec fica em `backlog/` sem ETA.
