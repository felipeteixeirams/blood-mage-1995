# UI: regras violadas e código morto (bug)

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Classe:** A
**Depende de:** nenhum
**Estado vs código:** verificado em 2026-10-11 (leitura estática): bug confirmado em `GameOverModal`, `MainMenu`, `SettingsModal`, `HighScoresModal`, `GameplayHUD` e `GameScene`. Não validado em execução.

> [ADR 0005](../../decisions/0005-iluminacao-escuridao-e-vinheta.md) (Proposta) trata do `darknessOverlay`; [ADR 0006](../../decisions/0006-audio-e-conquistas.md) trata do áudio e do `AchievementSystem`. Esta spec os cita e não os duplica.

## Contexto
| Item | Evidência |
|---|---|
| `onRestart` ignorado | `GameOverModal.tsx` recebe `onRestart` (`App.tsx:384`), mas os dois botões chamam `setRespawnRequested(true)` e `onGoHome` |
| UI em cenas Phaser | `MainMenu.tsx`, `SettingsModal.tsx`, `HighScoresModal.tsx` criam `new Phaser.Game` com `TitleScene`, `SettingsScene`, `RecordsScene` (12 usos de `add.text`/`setInteractive`/`add.rectangle` nas três), contra "UI só em React" do `CLAUDE.md` |
| Componentes sem montagem | `BestiaryModal`, `OfflineStatusBadge`, `PWAInstallBanner` e os hooks `usePWA`, `useJoystick` não têm importadores em produção (`grep` em `src/`) |
| Código morto no HUD | `GameplayHUD.tsx`: `aimJoystick` (linha 104) só é declarado; `handleBackgroundTapRemoved` e `splatters` nunca ligados nem renderizados. O `aimJoystick` de `GameScene` é outro objeto (`VirtualJoystickSystem`) e está em uso |
| Biblioteca solta | `AchievementToast.tsx` importa `framer-motion`; `TargetFrame.tsx` usa `motion/react`; `package.json` mantém `framer-motion` |
| Textos sem i18n | `GameOverModal` ("GOLPE FATAL", "RENASCER NA VILA"), `GameplayHUD`/`hud/*`, `CodexModal` (maioria) e título/descrição das conquistas em pt-BR fixo |
| Escuridão | `GameScene.darknessOverlay` é preenchido em `create` e apagado todo frame (`:1845`); `ScreenEffects.render()` nunca é chamado (só `update`, `GameScene.ts:1085`) |

## Objetivo
Proposta: a UI segue a regra do projeto (React), o `GameOverModal` e o HUD não têm entradas ignoradas, e os arquivos sem uso saem ou são ligados.

## Decisões a confirmar
| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| 1 | `onRestart` | A) remover a prop; B) adicionar botão "Reiniciar" | A: o fluxo atual é renascer na Vila ou menu |
| 2 | Menu, Config e Recordes em Phaser | A) reescrever em React; B) abrir exceção registrada em ADR | A, por etapas (um modal por vez); exige playtest touch |
| 3 | `BestiaryModal`, `OfflineStatusBadge`, `PWAInstallBanner`, `usePWA`, `useJoystick` | remover; montar | Remover `BestiaryModal` e `useJoystick`; montar o banner PWA só com decisão de produto (spec da Fase 5) |
| 4 | `aimJoystick` (HUD), `handleBackgroundTapRemoved`, `splatters` | remover; religar | Remover |
| 5 | `framer-motion` | trocar por `motion/react`; manter | Trocar e remover a dependência se ficar sem uso |
| 6 | i18n dos textos fixos | migrar para `t()`; adiar | Migrar GameOver e HUD primeiro; espanhol fica fora |
| 7 | `darknessOverlay` e `ScreenEffects.render` | conforme ADR 0005 | Aguardar a decisão do ADR 0005 |

## Escopo
- Aplicar as decisões 1 a 6 (e 7 após o ADR 0005), uma por commit, com `pnpm run verify`.

## Fora de escopo
- Visual novo, nova arte, mudança de layout; `AchievementSystem.ts` e áudio (ADR 0006); joystick DOM vs nativo (spec `native-phaser-touchpad-joystick`).

## Arquivos e contratos
- Alterar: `src/components/GameOverModal.tsx`, `src/App.tsx`, `src/components/GameplayHUD.tsx`, `src/components/hud/AchievementToast.tsx`, `package.json` e lockfile (decisão 5), `src/i18n/ptBR.ts`, `src/i18n/enUS.ts`.
- Remover (conforme decisão 3): `src/components/BestiaryModal.tsx`, `src/hooks/useJoystick.ts`, e os de PWA se aprovado.
- Reescrever (decisão 2): `MainMenu.tsx`, `SettingsModal.tsx`, `HighScoresModal.tsx`; `TitleScene`, `SettingsScene`, `RecordsScene` passam a não ter UI.
- Docs no mesmo commit: `docs/ui/hud.md`, `docs/ui/modals-and-screens.md`.
- Chaves i18n: `pt-BR` e `en-US` com as mesmas chaves.

## Critérios de aceite (provisórios)
- **UI-1** O GameOverModal não deve receber props que nenhum botão use.
- **UI-2** Quando o jogador toca em "Renascer na Vila", o GameOverModal deve chamar `setRespawnRequested(true)`.
- **UI-3** O menu principal, as configurações e os recordes não devem criar texto nem botão dentro de cenas Phaser.
- **UI-4** O GameplayHUD não deve conter estado ou função sem uso (`aimJoystick`, `splatters`, `handleBackgroundTapRemoved`).
- **UI-5** O AchievementToast deve usar a mesma biblioteca de animação dos demais componentes do HUD.
- **UI-6** Quando `settings.language` muda, o GameOverModal e o HUD devem exibir os textos no idioma escolhido.
- **UI-7** Se uma chave i18n falta em `enUS`, então `t()` deve cair para pt-BR sem erro.
- **UI-8** O projeto não deve ter componente ou hook sem importador de produção.

## Plano de verificação
| Critério | Como verificar |
|---|---|
| UI-1, UI-2 | Teste de componente do `GameOverModal` |
| UI-3 | `grep` por `add.text`/`setInteractive` nas cenas de menu; playtest manual (touch, não validado) |
| UI-4, UI-8 | `grep` dos símbolos; `pnpm run typecheck` |
| UI-5 | Revisão do import; `pnpm run build` |
| UI-6, UI-7 | Teste de `t()` com as duas línguas |

## Questões em aberto
- A exceção da decisão 2 já existe de fato (ADR)? Hoje nenhum ADR a registra.
- `PWAInstallBanner` entra na Fase 5 ou sai?

## Referências
- `docs/ui/hud.md`, `docs/ui/modals-and-screens.md`, `docs/architecture/world-systems.md`
- [ADR 0005](../../decisions/0005-iluminacao-escuridao-e-vinheta.md), [ADR 0006](../../decisions/0006-audio-e-conquistas.md)
