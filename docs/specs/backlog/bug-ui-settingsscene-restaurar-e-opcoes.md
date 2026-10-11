# Reset de opções pela SettingsScene e opções sem UI (bug)

**Mestre:** [backlog](README.md)
**Estágio:** backlog
**Aprovação do responsável:** aprovada por Felipe Teixeira em 2026-10-11, conforme conversa de 2026-10-11 (decisões conforme a coluna Recomendação)
**Estado vs código:** verificado em 2026-10-11 (leitura estática): bug confirmado em `src/game/scenes/SettingsScene.ts` (`buildButtons`, `setFromPointer`) e `src/utils/localStorage.ts` (`SettingsSchema.floatingStick`). Não validado em execução.

## Contexto
**Bug**
- `SettingsScene.buildButtons`, botão RESTAURAR: monta `defaults` com 14 campos, faz `this.settingsState = { ...defaults }` e chama `onUpdateSettings` (= `updateSettings`, que substitui `settings` inteiro na store). Valores diferentes de `defaultSettings`: `sfxVolume` 1,0 (padrão 0,8), `bgmVolume` 1,0 (0,3), `virtualControlsOpacity` 0,5 (0,7).
- O objeto omite `language`, `joystickDeadzone`, `joystickCurve`, `screenShakeEnabled`, `flashesEnabled`, `atmosphereEffectsEnabled`, `lowPerformanceParticles`, `highContrastDamageTexts`, `postProcessingEnabled`, `contentIntensity`, `hudLayout`, `activePaletteId`: ficam `undefined` na store (o `saveSettings` repõe os padrões do `catch` só no disco).
- `SettingsSchema.floatingStick` é `z.boolean().catch(false)`; `defaultSettings.floatingStick` é `true`.
- `setFromPointer` chama `onUpdateSettings` (grava no `localStorage`) a cada `pointermove` de slider (`bindInput`).
- `savedState` é atribuído em `create` e em APLICAR e nunca lido.
- Fallback de `create()` quando o registry está vazio: objeto próprio de 12 campos (sfx 1,0, bgm 1,0, opacidade 0,5), também diferente de `defaultSettings`.

**Lacunas**
- Sem UI de edição: `controlsMode`, `joystickDeadzone`, `joystickCurve`, `minimapVisible`, `minimapAlpha`, `lowPerformanceParticles`, `postProcessingEnabled` (grep: nenhum `updateSettings` ou componente os escreve).
- Seletor de idioma binário (`curLang === 'pt-BR' ? 'en-US' : 'pt-BR'`).
- Chaves i18n: `settings` tem 33 chaves e a cena usa 10; `resetDefaults`, `controlsMode*`, `postProcessing`, `lowPerformanceParticles`, `languagePtBR/EnUS` etc. não têm chamada. Cabeçalho, botões APLICAR/RESTAURAR/SAIR, "CRT" e "PADRÕES RESTAURADOS" são texto fixo.

## Objetivo
Proposta: RESTAURAR devolve `defaultSettings` completo (sem campos `undefined`); `floatingStick` tem um único padrão; a gravação deixa de ocorrer a cada `pointermove`; as opções hoje invisíveis ficam editáveis conforme as decisões abaixo.

## Decisões aprovadas
Aprovadas em 2026-10-11; a coluna Recomendação é a decisão.

| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| 1 | RESTAURAR preserva `language`, `hudLayout`, `activePaletteId`? | A: tudo volta ao padrão; B: preserva os três | B: são personalização, não "opções" |
| 2 | Padrão de `floatingStick` | A: `true` (como `defaultSettings`); B: `false` | A: o comentário em `defaultSettings` justifica `true` |
| 3 | Gravação de slider | A: só no `pointerup`; B: debounce; C: manter | A: o efeito ao vivo pode usar o estado local da cena |
| 4 | `savedState` | A: remover; B: SAIR descarta o não aplicado | A: alterações já são ao vivo; B muda o fluxo |
| 5 | Opções sem UI | A: expor todas; B: só `controlsMode`, `lowPerformanceParticles`, `postProcessingEnabled`, `minimapVisible`; C: manter ocultas | B: deadzone e curva são ajuste fino de risco para o jogador |
| 6 | Idioma | A: ciclo sobre os idiomas de `translations`; B: manter binário | A: pronto para novo idioma sem custo |
| 7 | Textos da cena | A: traduzir com chaves existentes; B: só remover chaves mortas | A |

## Escopo
- RESTAURAR monta o resultado a partir de `defaultSettings` (mais preservações da decisão 1).
- Corrigir o `catch` de `floatingStick` (decisão 2); fallback de `create()` usa `defaultSettings`.
- Mover a gravação do slider (3); remover `savedState` (4).
- UI das opções da decisão 5; seletor de idioma (6); textos (7).

## Fora de escopo
Painel rápido do HUD, novas opções, novos idiomas, mudar outros valores de `defaultSettings`.

## Arquivos e contratos
- Alterar: `src/game/scenes/SettingsScene.ts`, `src/utils/localStorage.ts` (schema), `src/i18n/ptBR.ts` e `enUS.ts` (só se faltar chave).
- Testes: `src/utils/localStorage.test.ts`; a cena não tem teste hoje, então extrair o cálculo do reset para função pura em `src/utils/`.
- Não tocar: `src/store/gameStore.ts` (contrato de `updateSettings` mantido).

## Critérios de aceite (provisórios)
- **SO-1** Quando o jogador aciona RESTAURAR, a SettingsScene deve enviar à store um objeto com todas as chaves de `defaultSettings` e valores iguais (exceto as preservadas pela decisão 1).
- **SO-2** Quando RESTAURAR é acionado, o `localStorage` deve conter os mesmos valores enviados à store.
- **SO-3** Se o `floatingStick` salvo for inválido, então o `loadSettings` deve devolver o padrão definido na decisão 2.
- **SO-4** Enquanto o jogador arrasta um slider, a SettingsScene deve gravar no `localStorage` apenas conforme a decisão 3.
- **SO-5** Onde a decisão 5 expõe uma opção, a SettingsScene deve permitir alterá-la e a opção deve ter efeito no sistema que a lê.
- **SO-6** Se o registry da SettingsScene não traz `settings`, então a cena deve usar `defaultSettings`.

## Plano de verificação
| Critério | Como verificar |
|---|---|
| SO-1, SO-2 | teste unitário da função de reset; manual: alterar tudo, RESTAURAR, conferir `bloodmage_1995_settings` |
| SO-3 | `localStorage.test.ts` com `floatingStick: "x"` |
| SO-4 | manual: arrastar slider com spy em `saveSettings` |
| SO-5, SO-6 | manual por opção; teste com registry vazio |

## Questões em aberto
Nenhuma. As decisões 1 a 7 foram aprovadas conforme a Recomendação. Verificação: o efeito visual das opções expostas precisa de playtest humano.

## Referências
[settings](../../ui/settings.md), [i18n](../../ui/i18n.md), [input-and-controls](../../ui/input-and-controls.md).
