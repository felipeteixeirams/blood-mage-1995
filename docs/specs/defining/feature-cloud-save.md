# Cloud Save Automatizado (Extraído da Fase 5)

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente

**Estado vs código:** verificado: não implementado (verificado em 2026-10-10). `grep -rniE "firebase|firestore|google.?sign|cloud.?save|playerId|supabase|oauth" src package.json public scripts vite.config.*` não retorna nada; o único armazenamento de progresso é `src/utils/localStorage.ts`. Ver também `docs/product/account-and-data.md`.

## Decisões a confirmar

Comportamento e escopo abaixo são propostas sem aprovação registrada; nada aqui está decidido.

1. Se o jogo terá conta/nuvem (hoje 100% offline) e a condição de demanda validada no Beta.
2. Provedor de identidade e de armazenamento (Google Sign-in, Firebase/Firestore são apenas exemplos).
3. Privacy Policy e fluxo de exclusão de dados.

---

## Origem
Item "Nice to Have" da Fase 5, listado em [feature-polimento-de-producao-pwa-e-steam.md](feature-polimento-de-producao-pwa-e-steam.md).

## Escopo proposto (quando desbloqueado)
- Provedor de identidade (ex: Google Sign-in) gerando `Player ID` único.
- Salvamento em nuvem multiplataforma (Firebase/Firestore ou equivalente) sincronizado com o `localStorage` local existente (`src/utils/localStorage.ts`), mantendo o fluxo 100% offline atual como fallback.
- Privacy Policy e fluxo de exclusão de dados (obrigação legal que acompanha login). Contexto: [product](../../product/README.md) ([account-and-data.md](../../product/account-and-data.md)).

## Critério proposto para desbloquear
1. O responsável confirma explicitamente que quer avançar com Cloud Save.
2. Validação de demanda real de jogadores (Beta).
