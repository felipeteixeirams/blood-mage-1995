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

## Status
- [x] Hipótese definida.
- [x] Ajustes iniciais implementados.
- [x] Testado e validado.
- [x] Decisão tomada: **APROVADO & INTEGRADO** (Specs 14, 16 e 17).
