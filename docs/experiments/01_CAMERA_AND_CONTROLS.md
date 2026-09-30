# Experimento 01: Câmera e Controles (Touch)

## Hipótese
A câmera original estava distante demais, prejudicando a leitura do combate e a imersão. Ao aproximar, precisamos garantir que o touchpad e a mira continuem funcionais no mobile e que o "game feel" seja agressivo, mas não claustrofóbico.

## Problema Atual (Ponto de Partida)
- O usuário já fez um primeiro ajuste no zoom da câmera (afastando da visão "avião"), mas ainda precisa de refinos.
- O touchpad foi modificado, mas o usuário reportou que ainda há áreas "grosseiras" na movimentação e resposta.

## Parâmetros do Experimento
- **Câmera:**
  - Ajuste fino de Zoom (testar valores que equilibrem visão de ameaças vs imersão).
  - Testar deadzone/lerp (suavidade) da câmera seguindo o jogador.
- **Controles Touch & Mira (Aiming & Game Feel):**
  - Área ativa do Virtual Joystick e responsividade na mudança rápida de direção.
  - **Sistema de Mira Inteligente Híbrido (Cone Direcional + Proximidade):**
    - Quando o jogador está se movendo (joystick/teclas ativas) ou apontando, a seleção de alvos prioriza inimigos no cone frontal de movimento/visão (calculado por produto escalar / diferença angular).
    - Pontuação de alvo balanceia ângulo frontal com proximidade (alvo direto na frente tem prioridade sobre alvo atrás mesmo que ligeiramente mais próximo).
    - Fallback: Quando parado e sem input direcional, prioriza o alvo mais próximo radialmente (< 350px).
  - Feedback visual no toque.

## Resultados e Conclusão
- **Câmera:** Câmera com interpolação Lerp Look-Ahead, resolução lógica Full HD 1080p e Boss Zoom-Out de 15% proporcionaram visão ampla para telegrafias e excelente proximidade durante o combate comum.
- **Controles Touch & Mira:** Sistema híbrido de Mira Inteligente (Cone Frontal + Proximidade) e Virtual Joystick twin-stick permitiram disparar e esquivar fluidamente em telas touch sem necessidade de mira cirúrgica.

## 🔬 Relatório de Auditoria de Código (2026-09-02)

O código-fonte real do projeto foi auditado e confirma a implementação integral das hipóteses e parâmetros deste experimento:

1. **Câmera (Look-Ahead Lerp & Zoom Adaptativo & Boss Zoom-Out):**
   - **Lerp & Seguidor Suave:** `src/game/scenes/GameScene.ts` (linhas 440-446 e 986-1002) utiliza `this.cameras.main.startFollow(this.cameraTarget, true, 0.08, 0.08)` com um alvo suavizado por interpolação de lerp factor `0.1`.
   - **Zoom Adaptativo por Resolução:** `src/game/scenes/GameScene.ts` (linhas 486-498 e 1003-1016) calcula o zoom dinâmico baseado na altura da tela (`Math.max(1.8, Math.min(3.0, screenH / 300))`) com ajuste proporcional de aspecto.
   - **Dynamic Boss Zoom-Out:** `src/game/scenes/GameScene.ts` (linhas 1003-1016) recua a câmera em 15% (`baseZoom * 0.85`) suavemente durante engajamento com chefes (`hasBossEngagement`), permitindo visualização adequada de indicadores AoE e telegrafias.

2. **Sistema Híbrido de Mira Inteligente (Cone Direcional + Proximidade):**
   - **Algoritmo de Seleção de Alvos:** `src/game/objects/Player.ts` (`findBestTarget()`, linhas 698-800) implementa a fórmula exata proposta no experimento:
     - Calcula produto escalar (`dot = normRefX * normDx + normRefY * normDy`) em relação ao vetor de movimento/mira.
     - Aplica multiplicador direcional com bônus de cone frontal de 120° (`1.0 + dot * 2.2`), penalizando alvos na retaguarda.
     - Aplica pontuação por proximidade radial (`1000 / (dist + 40)`) com suporte a travamento/histerese (`lockDist <= maxRange * 1.2`) e fallback radial em alcances de até 380px.
     - Pondera ameaças prioritárias (Elites e Bosses) com pesos `threatTierWeight`.

3. **Virtual Joystick & Retículo Direcional:**
   - **Controles Twin-Stick:** `src/game/systems/VirtualJoystickSystem.ts` processa os eixos virtuais com áreas ativas dinâmicas e feedback visual.
   - **Feedback Visual de Mira:** `src/game/objects/Player.ts` (`renderDirectionReticle()`) desenha o retículo de orientação no chão abaixo do jogador em tempo real.

4. **Specs Entregues Vinculadas:**
   - As soluções técnica e ergonômica foram consolidadas e entregues nas specs `docs/specs/delivered/14_IMMERSION_AND_GAME_FEEL.md`, `docs/specs/delivered/16_GRAPHICAL_UI_TERRAIN_EVOLUTION.md` e `docs/specs/delivered/17_IN_MEDIA_RES_ONBOARDING_AND_COMBAT_FLOW.md`.

### 📌 Recomendação de Promoção
Este experimento deixou de ser exploratório e tornou-se uma feature central totalmente integrada e testada. Recomenda-se a sua promoção formal para o diretório `docs/specs/delivered/` (por exemplo, criando a spec satélite `11_09_CAMERA_AND_TOUCH_CONTROLS.md` vinculada à Spec Master 11).

## Status
- [x] Hipótese definida.
- [x] Ajustes iniciais implementados.
- [x] Testado e validado.
- [x] Decisão tomada: **APROVADO & INTEGRADO** (Specs 14, 16 e 17).
