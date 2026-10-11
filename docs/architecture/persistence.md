# Persistence

**Mestre:** [architecture](README.md)
**Status:** verificado
**Verificado em:** 2026-10-11
**Método:** estático
**Fonte:** `src/utils/SaveMigration.ts`, `src/utils/localStorage.ts`, `src/`, `src/hooks/usePWA.ts`

Como o jogo guarda dados no navegador hoje. Tudo é `localStorage`, sem conta e sem nuvem (ver [conta e dados](../product/account-and-data.md)). Leitura estática de `src/utils/localStorage.ts`, `src/utils/SaveMigration.ts` e dos acessos diretos.

## Padrão do módulo
- Cada área tem um par `loadX`/`saveX` em `src/utils/localStorage.ts`, com schema Zod e valor padrão.
- Load: `JSON.parse` + `safeParse`. Se falhar (JSON inválido ou schema rejeitado), loga `warn` (namespace `PERSISTENCE`) e devolve o padrão. Só alguns loads também regravam o padrão (cristais, talentos, conquistas).
- Save: `safeParse` antes de gravar; se inválido, grava o padrão no lugar. Erro de `localStorage` é capturado e logado (`error`), nunca lançado.
- Formato gravado: JSON puro do valor, sem envelope de versão.
- `logger.debug` é suprimido em produção, então os "salvo/carregado com sucesso" só aparecem em dev.
- Campos usam `.catch(valor)`: um campo inválido vira o padrão sem derrubar o objeto.
- `.strict()` rejeita chave desconhecida: o objeto inteiro falha e volta ao padrão.

## Chaves e áreas

| Chave | Área | Load/Save | Padrão em falha |
|---|---|---|---|
| `bloodmage_1995_settings` | configurações | `loadSettings`/`saveSettings` | `defaultSettings` |
| `bloodmage_1995_highscores` | recordes (top 10 por `score`) | `loadHighScores`/`saveHighScore` | `defaultHighScores` (2 registros de 1995) |
| `bloodmage_1995_blood_crystals` | moeda de talentos | `loadBloodCrystals`/`saveBloodCrystals` | `0` |
| `bloodmage_1995_talents` | níveis de talento | `loadTalentLevels`/`saveTalentLevels` | 9 talentos em 0 |
| `bloodmage_1995_prestige` | prestígio (selos, dificuldade) | `loadPrestigeData`/`savePrestigeData` | `defaultPrestigeData` |
| `bloodmage_1995_campaign_state` | campanha (zona, capítulo, flags, quests, magias) | `loadCampaignState`/`saveCampaignState` | `defaultCampaignState` |
| `bloodmage_1995_achievements` | conquistas da store `{id, unlocked, redeemed}` | `loadAchievements`/`saveAchievements` | `{}` |
| `bloodmage_1995_achievements_progress` | progresso do `AchievementSystem` `{id, unlockedAt, progress, complete}` | `loadAchievementProgress`/`saveAchievementProgress` | `{}` |
| `bloodmage_1995_run_stats` | 13 contadores de estatística | `loadRunStats`/`saveRunStats` | todos 0 |
| `bloodmage_1995_codex` | códice (kills, entradas, marcos) | `loadCodexState`/`saveCodexState` | `defaultCodexState` |
| `bloodmage_1995_onboarding` | 7 flags de tutorial | `loadOnboarding`/`saveOnboarding` | todas `false` |
| `bloodmage_1995_death_state` | morte definitiva + stats de game over | `loadDeathState`/`saveDeathState` | `isDefinitivelyDead: false` |
| `bloodmage_1995_corpse_state` | corpo caído e itens | `loadDroppedCorpseState`/`saveDroppedCorpseState` | sem corpo |
| `bloodmage_1995_unlocked_relics` | relíquias desbloqueadas (máx. 50) | `loadUnlockedRelics`/`saveUnlockedRelics` | `selo_hemorragico`, `olho_de_carmim`, `anel_do_pacto_sanguineo` |
| `bloodmage_1995_equipped_relic_ids` | relíquias equipadas (máx. 3) | `loadEquippedRelicIds`/`saveEquippedRelicIds` | `selo_hemorragico` |
| `achievements_progress` (legada) | chave antiga sem namespace | lida só em `loadAchievementProgress` | migrada e removida |
| `bloodmage_pwa_install_dismissed` | dispensa do banner PWA (timestamp, 3 dias) | direto em `usePWA.ts` | n/a |

## Schemas
| Schema | `.strict()` | Limites e ids opcionais |
|---|---|---|
| `SettingsSchema` | sim | volumes 0-1; `touchSensitivity` 0.5-2; opcionais: `language`, `joystickDeadzone`, `joystickCurve`, `virtualStickScale`, `leftHandedMode`, `floatingStick`, `fearDistortionEnabled`, `tinnitusEnabled`, `atmosphereEffectsEnabled`, `contentIntensity`, `hudLayout`, `activePaletteId` |
| `TalentLevelsSchema` | sim | nível 0-100; `vampiric_thirst` e `sacrifice_mastery` opcionais (fora de `defaultTalents`) |
| `HighScoreSchema` | sim | `score` até 10 000 000; `id` e `date` ganham valor via `.catch` |
| `OnboardingSchema` | sim | só booleanos |
| `CodexStateSchema` | sim | `unlockedEntries` até 200; kills até 10 000 000 |
| `CampaignStateSchema`, `QuestLogEntrySchema` | sim | zonas: `safe_house`, `gloomy_woods`, `fosso_chagas`, `catacumbas_martires`, `santuario_sangue`; `chapter` 1-100 |
| `AchievementProgressRecordSchema` | sim | `progress` 0-100 |
| `PrestigeDataSchema` | não | `level` 0-10, selos 0-5, dificuldades `normal`/`nightmare`/`inferno` |
| `DeathStateSchema`, `CorpseSchema`, `RunStatsSchema`, `AchievementStateSchema` | não | `RunStatsSchema` e `AchievementStateSchema` usam `.catch` no objeto inteiro |

## Cristais de sangue (formato especial)
`loadBloodCrystals` aceita número cru, JSON ou envelope com `payload`. Valor fora de `0..1_000_000_000` ou não numérico: loga `warn`, grava `0` e devolve `0`.

## SaveMigration.ts
- Exporta `loadWithMigration` (lê envelope `{version, payload}`, roda migrações sequenciais `version -> version+1`, valida com Zod) e `saveWithEnvelope`.
- Acessa `localStorage` direto (`getItem`/`setItem`), fora do módulo principal, com chave, versão e schema por parâmetro.
- Nenhum arquivo em `src/` importa `SaveMigration.ts` (grep): hoje é código sem uso e nenhuma área tem versão de save.
- `saveWithEnvelope` grava o objeto espalhado na raiz mais `version` e `payload` (duplica o dado). Suspeito; sem chamadores.

## Acessos diretos a `localStorage` fora do módulo
| Arquivo | Uso |
|---|---|
| `src/utils/SaveMigration.ts` | ver acima (sem chamadores) |
| `src/hooks/usePWA.ts` | `bloodmage_pwa_install_dismissed`: lê, grava `Date.now()` e remove ao expirar; sem Zod (hook não montado, ver [pwa](../operations/pwa.md)) |

Os demais usos em `src/` são testes e comentários. A regra do CLAUDE.md ("todo acesso passa por `localStorage.ts`") não vale para esses dois.

## Quem chama
`src/store/gameStore.ts` carrega tudo na criação da store e salva nas ações. `AchievementSystem.ts` usa `loadAchievementProgress`/`saveAchievementProgress`. `RecordsScene.ts` e `RecordsDisplay.tsx` usam `loadHighScores`.

## Suspeitos (descritos, não corrigidos)
- `.strict()` em dado já gravado: chave a mais (de versão futura ou antiga) faz o objeto inteiro voltar ao padrão; um `saveX` seguinte sobrescreve o salvo.
- `saveOnboarding` grava sem usar o schema; `saveDroppedCorpseState` grava o objeto original se o parse falhar.
- Dois sistemas de conquistas coexistem, com chaves e formatos diferentes.

## Onde fica no código
`src/utils/localStorage.ts` (funções acima e `default*`), `src/utils/SaveMigration.ts`, `src/hooks/usePWA.ts`, `src/store/gameStore.ts`, `src/utils/logger.ts` (namespace `PERSISTENCE`).

Relacionados: [state-management](state-management.md), [conta e dados](../product/account-and-data.md), [segurança](../engineering/security.md), [risky-files](../engineering/risky-files.md).
