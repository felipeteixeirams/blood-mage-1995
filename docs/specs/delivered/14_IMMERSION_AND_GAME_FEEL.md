# Spec 14: Imersão, UI Premium e Game Feel

## Objetivo Geral
Elevar a qualidade estética e a responsividade do jogo através de um polimento focado em interfaces narrativas, feedback visual de combate e imersão de controles (Câmera, Haptics e Mira).

---

## 1. Interface Mais Bonita & Imersiva (Aparência)

### 1.1 Retratos Pixel Art & Caixa de Diálogo Gótica 9-Slice
- **Problema:** Diálogo de NPC funcional, porém visualmente básico, usando caixas quadradas genéricas.
- **Solução (Implementado):**
  - **9-Slice CSS Border:** Construída uma moldura gótica procedimental via CSS complexo e SVG base64 inline para garantir texturização pesada, eliminando falhas de carregamento de imagens binárias.
  - **Placeholder Premium de Retrato:** Área de retrato à esquerda utilizando silhuetas icônicas (*Lucide Icons* + gradient overlay) para simular o estilo *Castlevania / Diablo*.
  - **Text Typing SFX:** Integrado som de máquina de escrever retro (`playDialogueBlip`) atrelado à renderização caractere-a-caractere na `DialogueModal.tsx`.

### 1.2 Retículo Rúnico de Mira no Chão (Target Lock-On FX)
- **Problema:** A mira automática do *Blood Bolt* já utilizava o Cone Inteligente internamente, porém o jogador não tinha como saber visualmente em quem estava travado.
- **Solução (Implementado):**
  - **Graphic Node na Player.ts:** Inclusão de um retículo procedural desenhado em tempo real no `updatePlayer`, sob os pés da entidade salva em `this.currentLockedTarget`.
  - **Efeito Pulsante:** A runa pulsa (size e opacity) baseada no relógio interno do Phaser (`time`), aumentando a clareza visual no combate escuro.

---

## 2. Melhoria da Experiência de Jogo (Game Feel)

### 2.1 Câmera Dinâmica com Antecipação (Look-Ahead Lerp)
- **Problema:** A câmera presa fixamente ao centro do jogador limitava o campo de visão na direção do perigo, forçando reações muito em cima da hora.
- **Solução (Implementado):**
  - Ao invés de usar o clássico `startFollow(player)`, a câmera foi fixada num objeto-alvo invisível (`cameraTarget`).
  - Durante o `update()`, o alvo se desloca até 80 pixels à frente do jogador baseado no vetor de movimento ou vetor de mira (`aimVector` / `moveVector`), interpolado suavemente (lerp = 0.1). 
  - Isso empurra a câmera para "olhar à frente", melhorando drasticamente a antecipação de ameaças fora da tela.

### 2.2 Feedback Tátil & Crítico (Haptics e Screen Shake)
- **Problema:** O mobile faltava "peso" nos combates e o jogador perdia a noção de que estava sangrando sem olhar pra barra de HP.
- **Solução (Implementado):**
  - Modificado o motor háptico `CombatFeel.ts` adicionando padrões de vibração via `navigator.vibrate`.
  - **Dano Crítico:** Dois baques secos quando um dano crítico entra.
  - **Sangramento:** Pulsos curtinhos sincronizados com o tick DoT de dano.
  - **Dano Tomado:** Além do haptic nativo, a câmera da `GameScene` agora invoca o `screenShake.trigger(150, 4)` gerando tremores intensos e perfeitamente ritmados com cada lapso de perda de HP do jogador.

---

## 📈 Histórico de Progresso (Changelog)

- **[2026-08-27] Frente 2 - Look-Ahead & Haptics:**
  - Status: **CONCLUÍDO**.
  - Finalizado o motor de Câmera de antecipação visual.
  - Injetado `triggerVibration` assíncrono e nativo e acoplado tremores da tela (`screenShake.trigger`) durante interações pesadas.
  - Tipo checado e bateria completa de testes 100% Ok.

- **[2026-08-27] Frente 1 - Aparência e UI Gótica:**
  - Status: **CONCLUÍDO**.
  - Desenvolvida a caixa de diálogo Gótica 9-Slice com tipografia de máquina de escrever acoplada ao novo gerador de bips sonoros em `soundEngine.ts`.
  - Implementado o renderizador do "Retículo Rúnico" em `Player.ts`, tornando evidente o *Smart Target Cone* (Mira Inteligente) já existente.
