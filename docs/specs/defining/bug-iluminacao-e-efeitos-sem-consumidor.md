# Iluminação e efeitos configurados sem consumidor (bug)

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Estado vs código:** verificado em 2026-10-11 (leitura estática): bug confirmado em `src/game/systems/LightingSystem.ts` (`BIOME_LIGHTING`, `enable`), `src/game/systems/WorldManager.ts`, `src/game/systems/AtmosphereSystem.ts`, `src/game/systems/ScreenShake.ts` e `src/game/systems/AdvancedParticles.ts` (`startAmbient`). Não validado em execução.

## Contexto
Cinco achados de configuração sem efeito (satélites [lighting-and-effects](../../gameplay/lighting-and-effects.md), [world-systems](../../architecture/world-systems.md)):

1. **`BIOME_LIGHTING.ambientColor` não aplicado.** `LightingSystem.enable` (`:92-117`) calcula `cascadeColor` por profundidade do andar e chama `lights.setAmbientColor(cascadeColor)`. O `ambientColor` de `BIOME_LIGHTING` (`:22-52`) nunca é lido; só `playerLightRadius/Color` e `torchRadius/Color` são usados (`:146`, `:162`, `:175`).
2. **Campos do `WorldManager` sem consumidor.** `darknessColor`, `darknessAlpha`, `lightRadius`, `fogAlpha` e `ambientDroneFreq` (`WorldManager.ts:7-12`) são só definidos e interpolados em `blendBiomes`. Fora do arquivo, o único uso do `WorldManager` é `DungeonFlowController` (`reverbLevel`, `isIndoor`; `:118-126`, `:334-350`). `AtmosphereSystem.ts:3` importa `worldManager` sem usá-lo. `updateLighting`, `currentLightRadius` e `targetLightRadius` não têm chamador/leitor fora do arquivo. (O `darknessOverlay` e o [ADR 0005](../../decisions/0005-iluminacao-escuridao-e-vinheta.md), Proposta, tratam de outro ponto; não duplicado.)
3. **`postProcessingEnabled` sem toggle e lido só na criação.** Não há toggle em `GameplayHUD` nem em `SettingsScene`; a única fonte é o padrão `true` de `localStorage.ts:217`. `AtmosphereSystem.initialize` (`:101`), `EnemyTelegraphSystem.initialize` (`:46`), `PostFXSystem` e `LightingSystem` (`GameScene.ts:297`, `:306`) o leem uma vez; mudar a opção no meio da partida não teria efeito.
4. **Dois tremores; só um respeita `screenShakeEnabled`.** `ScreenShake` (offset da câmera; `light/medium/heavy`, usado em `CombatEffectsSystem.ts:105`, `:303`, `CollisionHandlers.ts:354-361`, `Player.ts:1208`) não consulta a opção. `cameras.main.shake` respeita em `CombatFeel.ts:37` e `CollisionHandlers.ts:416`, mas não em `Traps.ts:111`, `CombatEffectsSystem.ts:145`, `:410`, `CollisionHandlers.ts:499` e `PlayerSkillSystem.ts:263`, `:424`, `:571`, `:627`, `:667`. O toggle de `GameplayHUD.tsx:349` bloqueia só parte dos tremores.
5. **`AdvancedParticles.startAmbient` sem chamada.** Definido em `:192`; só `AdvancedParticles.test.ts:91` o chama (`startForestAmbient` é usado em `ProceduralForestGenerator.ts:119`). Névoa/brasas do calabouço nunca iniciam por esse método.

## Objetivo (proposta)
Cada valor de configuração de iluminação e efeito passa a ter um consumidor ou é removido; as opções de acessibilidade e desempenho valem para todos os efeitos que descrevem.

## Decisões a confirmar
| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| 1 | `BIOME_LIGHTING.ambientColor` | A) misturar com a cascata de profundidade; B) apagar o campo e manter a cascata; C) usar o bioma e descartar a cascata | B: a cascata é o visual atual; evita mudar todos os biomas sem playtest |
| 2 | Campos do `WorldManager` | A) ligar cada um (raio da luz, fog, drone); B) manter só `isIndoor`/`reverbLevel` e apagar o resto | B: `AtmosphereSystem` e `LightingSystem` já têm tabelas por bioma |
| 3 | Toggle de `postProcessingEnabled` | A) adicionar em `SettingsScene` com reação em tempo real; B) adicionar com efeito na próxima partida; C) remover a opção | B: menor risco e coerente com a leitura na criação |
| 4 | Tremores | A) `ScreenShake` e todos os `cameras.main.shake` respeitam `screenShakeEnabled` por ponto único; B) só `ScreenShake` passa a respeitar | A: é a promessa do toggle (acessibilidade) |
| 5 | `startAmbient` | A) chamar na criação do mapa de masmorra; B) apagar | B: `AtmosphereSystem` já cobre a névoa; evita partículas duplicadas e custo em mobile |

## Escopo
- Aplicar as decisões acima aos itens 1 a 5.
- Testes unitários onde o comportamento for verificável sem renderização.

## Fora de escopo
- Calibração visual de cores e intensidades (exige teste em mais de um bioma), restaurar `darknessOverlay` (ADR 0005), novos efeitos.

## Arquivos e contratos
- Alterar (conforme decisões): `src/game/systems/LightingSystem.ts`, `src/game/systems/WorldManager.ts`, `src/game/systems/AtmosphereSystem.ts`, `src/game/systems/ScreenShake.ts`, `src/game/systems/CombatFeel.ts`, `src/game/systems/AdvancedParticles.ts`, `src/game/scenes/SettingsScene.ts` (toggle) e os arquivos com `cameras.main.shake` listados no item 4.
- Atualizar no mesmo commit: `docs/gameplay/lighting-and-effects.md`, `docs/architecture/world-systems.md` e `Verificado em`.
- Não tocar: `Enemy.ts`, `gameStore.ts`.

## Critérios de aceite (provisórios)
- **LE-1** Quando `screenShakeEnabled` é `false`, o sistema não deve deslocar a câmera por `ScreenShake` nem por `cameras.main.shake`.
- **LE-2** Quando `screenShakeEnabled` é `true` ou ausente, o sistema deve manter os tremores atuais.
- **LE-3** O `WorldManager` não deve conter campo de configuração que nenhum módulo leia (conforme decisão 2).
- **LE-4** Quando `BIOME_LIGHTING` define `ambientColor`, o `LightingSystem` deve usá-lo, ou o campo não deve existir (decisão 1).
- **LE-5** Quando o jogador altera `postProcessingEnabled` nas opções, o sistema deve aplicá-lo no momento definido na decisão 3 e persisti-lo via `src/utils/localStorage.ts`.
- **LE-6** Se `startAmbient` for mantido, a masmorra deve chamá-lo uma vez por mapa; se removido, nenhum símbolo deve referenciá-lo.
- **LE-7** Se Light2D falhar ou o renderer for Canvas, o `LightingSystem` não deve lançar exceção ao aplicar a opção.

## Plano de verificação
| Critério | Como verificar |
|---|---|
| LE-1, LE-2 | teste unitário do ponto único de tremor com `screenShakeEnabled` false/true; manual: levar dano, usar skill e pisar em armadilha com a opção desligada |
| LE-3, LE-4, LE-6 | `grep` dos símbolos e `pnpm run typecheck`; revisão do diff |
| LE-5 | teste de `localStorage.ts` (safe-parse); manual: alternar a opção e iniciar nova partida |
| LE-7 | teste unitário com `scene.lights` que lança |

## Questões em aberto
- O responsável quer a opção de pós-processamento em tempo real (afeta Light2D, PostFX, atmosfera e telégrafos)?

## Referências
- [lighting-and-effects](../../gameplay/lighting-and-effects.md), [world-systems](../../architecture/world-systems.md), [ADR 0005](../../decisions/0005-iluminacao-escuridao-e-vinheta.md)
