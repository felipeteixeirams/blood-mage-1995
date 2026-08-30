---
agent_context: technical_specification_in_media_res_onboarding
target_module: docs/specs/17_IN_MEDIA_RES_ONBOARDING_AND_COMBAT_FLOW.md
priority: high
status: implemented
last_updated: "2026-08-30"
tags:
  - onboarding
  - in_media_res
  - combat_flow
  - time_to_fun
  - mobile_retention
  - dodge_telegraph
---

# 📜 Spec 17: Onboarding "In Media Res" & Fluxo de Combate Imediato (<10s Time-to-Fun)

> **Status:** Implementado & Concluído (Merged via PR #59)  
> **Data:** 30 de Agosto de 2026  
> **Domínio:** Experiência do Jogador (FTUE), Curva de Retenção Mobile (D1), Telegrafia de Esquiva e Combate Imediato.

## Objetivo Geral
Redesenhar o fluxo de abertura e os primeiros 60 segundos de gameplay de *Blood Mage 1995*, inspirando-se em clássicos como *Diablo 2* e *Dungeon Siege 1*. O objetivo é eliminar o atrito de inicialização ("Time to Fun" < 10 segundos), iniciando o jogador diretamente no combate com ação visceral imediata, telegrafia responsiva, mecânica de esquiva clara e evolução de nível recompensadora nos primeiros 30 segundos.

---

## 1. Escopo

1. **Abertura *In Media Res* ("O Cerco ao Altar de Sangue"):**
   - No Andar 1 (Arcade) e na introdução da campanha, o jogador surge no centro do santuário sob ataque imediato.
   - 3 rastejantes/bestas fracas (`scout_beast`) invadem a sala de spawn nos primeiros 3-5 segundos, permitindo disparos imediatos e destruição instantânea do primeiro inimigo com gore procedural.
   - 1 guerreiro esqueleto (`skeleton_warrior`) de vanguarda desfere um ataque físico telegrafado com círculo de aviso no chão.

2. **Feedback e Telegrafia de Esquiva (Dash):**
   - Ao detectar a telegrafia de ataque do primeiro inimigo pesado, um banner/indicador flutuante sutil orienta o jogador: *"ESQUIVE! Toque em [DASH] ou duplo-toque para esquivar com invulnerabilidade."*
   - Executar o Dash ou derrotar o inimigo consome e oculta o aviso instantaneamente.

3. **Primeira Evolução Acelerada (Level 2 < 30s):**
   - A eliminação dos monstros da brecha inicial garante XP suficiente para atingir o Nível 2 imediatamente.
   - Disparo do modal de **RITUAL DE EVOLUÇÃO** com 3 Cartas de Sangue / Bênçãos selecionáveis pelo polegar, consolidando a sensação de poder e progressão rápida.

4. **Sinalização Ambiental e Transição:**
   - Após repelir a invasão inicial, o portal de descida e os serviços do santuário iluminam-se com partículas rúnicas.
   - O Ancião profere uma fala curta de ambiente: *"O selo das catacumbas se rompeu! Avance pelo portal antes que eles se reagrupem!"*

---

## 2. Fora do Escopo
- Tutoriais longos com pausas forçadas de texto estático.
- Modificação na geração procedural dos andares 2+.
- Alterações em sistemas de monetização ou saves em nuvem.

---

## 3. Arquitetura & Módulos Impactados

- `src/game/systems/DungeonFlowController.ts`: Implementação do spawn de cerco no Andar 1 e configuração da sala inicial.
- `src/game/systems/CombatEffectsSystem.ts`: Garantia de progressão fluida de XP e disparo de evento de onboarding no primeiro abate / level up.
- `src/game/objects/Player.ts`: Registro do evento de esquiva no onboarding.
- `src/components/GameplayHUD.tsx`: Banner reativo de combate e dicas visuais discretas para ações de combate.
- `src/types/game.ts` e `src/store/gameStore.ts`: Estados tipados de onboarding (`firstDashDone`, `firstSiegeCleared`).
- `src/utils/localStorage.ts`: Persistência validada via Zod com safe-parse.

---

## 4. Contratos & Interfaces

```typescript
export interface OnboardingState {
  firstKillDone: boolean;
  firstLevelUpDone: boolean;
  firstEquipDone: boolean;
  firstBossSeen: boolean;
  firstSkillCast: boolean;
  firstDashDone: boolean;
  firstSiegeCleared: boolean;
}
```

---

## 5. Critérios de Aceite

1. **Time-to-Fun < 10s:** O jogador entra no Andar 1 e tem o primeiro inimigo ao alcance do ataque em menos de 3 segundos.
2. **Primeiro Abate < 6s:** Disparar o Blood Bolt básico elimina o primeiro rastejante em 1 a 2 tiros, gerando gore procedural, som de impacto e XP visível.
3. **Telegrafia de Esquiva Funcional:** O inimigo pesado executa a animação de telegrafia com círculo vermelho no chão e orientação de Dash no HUD.
4. **Primeiro Level Up em < 30s:** A primeira onda de cerco garante subida para o Nível 2, abrindo a seleção das 3 Cartas de Evolução.
5. **Zero Bloqueios de UI:** Nenhuma tela de texto trava os controles do jogador sem que haja ação deliberada.
6. **Passagem sem Erros nos Testes:** `pnpm test` e `pnpm run verify` executam com 0 falhas e 0 erros de TypeScript.

---

## 📈 6. Status de Entrega & Verificação (PR #59)

- [x] **Spawn Inicial ("O Cerco ao Altar de Sangue")**: Implementado em `DungeonFlowController.ts` com 3 `scout_beast` e 1 `skeleton_warrior` em windup telegrafado.
- [x] **Telegrafia & Dica de Esquiva**: `Enemy.ts` e `Player.ts` vinculados ao `gameStore.ts` com banner inteligente no `GameplayHUD.tsx` e dismiss automático.
- [x] **Aceleração para Nível 2 (< 30s)**: Concessão de 65 XP no abate dos 4 monstros do cerco, disparando o Ritual de Evolução (3 cartas de bênção).
- [x] **Persistência Zod Segura**: `types/game.ts`, `gameStore.ts` e `localStorage.ts` atualizados com `OnboardingState`.
- [x] **Cobertura de Testes**: Suíte dedicada `src/game/systems/OnboardingFlow.test.ts` com 3 testes unitários 100% aprovados.
