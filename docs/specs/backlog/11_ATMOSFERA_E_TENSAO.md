---
agent_context: technical_specification_atmosphere_and_tension
target_module: docs/specs/backlog/11_ATMOSFERA_E_TENSAO.md
priority: medium
status: backlog
last_updated: "2026-09-01"
tags:
  - atmosphere
  - threat_indicator
  - spatial_audio
  - vignette
  - dynamic_lighting
  - ai_flee
---

# 📜 Spec 11: Atmosfera, Tensão e Indicadores de Ameaça

> **Status:** 🟡 PARCIALMENTE IMPLEMENTADO (Quick Wins de Tensão & Efeitos de Pânico Ativos no Código)
> **Data:** Setembro de 2026
> **Domínio:** Atmosfera Gótica, Indicadores Telegrafados, Áudio Espacial e Efeitos Visuais de Tensão.

## 1. 🎯 Objetivo Geral
Elevar a imersão, o suspense e a tensão tática de *Bloodmage 1995*, inspirando-se em clássicos de horror e sobrevivência (como *Silent Hill* e *Alien*). O objetivo é conectar os estados existentes da Inteligência Artificial dos inimigos a feedbacks visuais e sonoros diretos ao jogador, permitindo antecipar ameaças fora do campo de visão, sentir a intensidade dos cercos e reagir taticamente ao comportamento das criaturas.

---

## 2. 🔍 Contexto & Estado Real de Implementação
Embora o indicador de ameaça no mapa de borda direcional seja um item de backlog futuro, os principais efeitos visuais e sonoros de tensão da especificação **já foram implementados no código-fonte**:

- **Threat Tinnitus (Zumbido de Ameaça):**
  - Implementado em `src/utils/soundEngine.ts` (`startTinnitus()`, `stopTinnitus()`, `updateTinnitus()`) e acionado em `src/game/scenes/GameScene.ts` quando o HP do jogador cai abaixo de 30% ou diante de ameaças elites/bosses.
  - Sintetiza um tom agudo de ~3500 Hz na Web Audio API e aplica filtro Low-Pass no BGM.
- **Fear Distortion (Distorção de Pânico):**
  - Implementado em `src/game/scenes/GameScene.ts` (`triggerFearDistortion()`) acionado em uivos de Lycan / urros de chefes. Aplica vinheta roxa pulsante e distorção ondulatória na tela.
- **Configurações de Acessibilidade:**
  - Toggles `fearDistortionEnabled` e `tinnitusEnabled` em `src/types/game.ts`, `src/store/gameStore.ts`, `src/utils/localStorage.ts` e `SettingsScene.ts` permitindo desativar esses efeitos para acessibilidade.
- **`Enemy.ts`:** Máquina de estados de IA totalmente funcional (`idle`, `patrol`, `investigating`, `combat`, `frenzy`, `flee`) e o método de percepção auditiva `onHearNoise()`.

---

## 3. 📐 Especificação do Escopo

### 3.1. Indicador de Ameaça Fora de Tela (Threat Indicator)
- Quando um inimigo fora do campo de visão da câmera entra em estado `combat` ou `frenzy`, exibir uma pulsação sutil na borda da tela (arco translúcido avermelhado) indicando o ângulo do inimigo em relação ao jogador.
- Se o inimigo estiver apenas em estado `investigating`, o indicador pulsa em tom âmbar suave.
- Ao entrar na tela ou ser derrotado, o indicador correspondente desaparece.

### 3.2. Áudio Espacial e Ruído Estático Direcional
- Integração de `StereoPannerNode` no `soundEngine.ts` conectado à posição relativa (vetor X/Y) das ameaças fora de tela.
- Emissão de um ruído estático/ressonância sutil direcionada para o canal de áudio correspondente (esquerda/direita), sinalizando aproximação antes da visão direta.

### 3.3. Vinheta Pulsante por Nível de Perigo
- Evolução da vinheta escura de `GameScene.ts`:
  - **Perigo Baixo (1–3 inimigos em combate):** Vinheta estática padrão.
  - **Perigo Médio (4–10 em combate):** Pulsação lenta da borda escura (1 ciclo a cada 2s).
  - **Perigo Alto (>10 em combate ou Chefe ativo):** Pulsação rápida com matriz de cor avermelhada.

### 3.4. Iluminação Dinâmica (Lanterna Rúnica)
- Aura de "luz de sangue" de ~200px ao redor do jogador.
- Fora do raio de luz, o cenário apresenta escurecimento progressivo (sem oclusão total de terreno).
- Quando o HP do jogador cai abaixo de 30%, o raio de luz encolhe levemente, intensificando a sensação de claustrofobia.

### 3.5. Chamado de Reforços no Estado `flee`
- Quando uma criatura entra em estado de fuga (`flee`) por baixo HP, se sobreviver por mais de 5 segundos, dispara o evento `onHearNoise()` em um raio 3× maior para convocar inimigos vizinhos.

---

## 4. 🧪 Critérios de Aceite
- [ ] Indicador direcional na borda da tela visível para ameaças ativas fora do FOV da câmera.
- [ ] Indicador oculta-se imediatamente quando o inimigo é eliminado ou entra na tela.
- [ ] Vinheta ajusta frequência de pulsação e tonalidade em tempo real conforme a contagem de inimigos em combate.
- [ ] Iluminação dinâmica opera sem impacto na taxa de quadros (garantindo 60 FPS estáveis).
- [ ] Criaturas no estado `flee` acionam o chamado de reforços de forma consistente após 5 segundos.
- [ ] Opção nas Configurações permite desativar ou suprimir os efeitos visuais de tensão para acessibilidade.

---

## 📊 Status & Esforço Estimado
- **Status:** 🔵 BACKLOG (0% implementado)
- **Esforço Estimado:** 4–6 dias de desenvolvimento.
