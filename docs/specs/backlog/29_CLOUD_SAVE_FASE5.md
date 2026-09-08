---
agent_context: backend, release-engineer, product-manager
target_module: src/utils/localStorage.ts
priority: medium
criticality: high
status: backlog
last_updated: 2026-09-07
tags: [specs, cloud-save, account, fase-5, extracted, impediment]
---

> ⛔ **IMPEDIMENTO:** integração de conta/nuvem requer confirmação prévia
> explícita de Felipe — mandato registrado em `docs/README.md` e
> `docs/product/ACCOUNT_AND_DATA.md`: *"Futuro (Fase 5): Cloud Save
> acoplado ao Player ID (se aplicável)... caso o jogo seja validado no
> Beta e haja demanda."* Essa validação/demanda ainda não aconteceu e
> essa confirmação nunca foi dada. **Não implementar nenhum código de
> conta/nuvem sem essa confirmação primeiro.**

# ☁️ Cloud Save Automatizado (Extraído da Fase 5)

## Origem
Item "Nice to Have" extraído de
[`in-progress/05_FASE5_POLIMENTO_PRODUCAO_PWA_STEAM.md`](../in-progress/05_FASE5_POLIMENTO_PRODUCAO_PWA_STEAM.md)
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
