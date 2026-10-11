# Conta e Dados

**Mestre:** [product](README.md)
**Status:** verificado
**Verificado em:** 2026-10-10
**Método:** estático
**Fonte:** `src/`, `artifacts/api-server`, `lib/db`, `src/game/`

Verificação por leitura estática do código.

## Identidade

- O código não tem login, conta nem identificador de jogador na nuvem. Nenhuma dependência de auth, Supabase, Firebase ou pagamento em `package.json`; `grep` por esses termos em `src/` não encontra uso.
- O logger envia um `sessionId` por sessão a `/api/log` (ver [operations](../operations/README.md)); não é identidade de jogador.

## Armazenamento

- O progresso persiste em `localStorage` do navegador, com prefixo `bloodmage_1995_`. Chaves em `src/utils/localStorage.ts`: settings, highscores, blood_crystals, talents, prestige, onboarding, death_state, corpse_state, unlocked_relics, equipped_relic_ids, codex, achievements, run_stats, campaign_state, achievements_progress.
- Leituras e gravações dessas chaves passam por funções `load*`/`save*` com Zod (`catch`/`safeParse` e valor padrão). `src/game/` (Phaser) não chama `localStorage` diretamente; usa `gameStore.ts` ou as funções utilitárias (`AchievementSystem.ts`, `RecordsScene.ts`, `RecordsDisplay.tsx`).
- Acessos diretos fora de `localStorage.ts`: `src/utils/SaveMigration.ts` (migração com envelope versionado) e `src/hooks/usePWA.ts` (chave `bloodmage_pwa_install_dismissed`).
- `lib/db` (Drizzle + PostgreSQL) e `artifacts/api-server` (Express) existem no repositório, mas `src/` não os importa. Alto escore também é local.

## Intenção (não ratificada)

Planos antigos citavam login e cloud save em fase futura. Não há decisão do responsável registrada e nenhum código os implementa.

## Não verificado

- Se `lib/db` e `artifacts/api-server` são usados por algum deploy (confirmado só que `src/` não os importa).
