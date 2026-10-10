# Spec 11: Atmosfera, Tensão e Indicadores de Ameaça

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente

**Estado vs código:** parcial (verificado em 2026-10-10, leitura estática + `grep`; nenhum teste executado). Existe: indicador de borda para ameaças fora da tela, âmbar em `investigating` e vermelho em `combat`/`frenzy`, até 8 (`GameScene.updateThreatIndicator`, ~l.1741, `ThreatIndicator.test.ts`); áudio espacial com `StereoPannerNode` (`soundEngine.updateSpatialThreat`, `initThreatStatic`); zumbido (`soundEngine.updateTinnitusState`, portadora de 3500 Hz, low-pass em 1200 Hz) quando HP < 30% ou elite/chefe a menos de 220 px; vinheta por perigo (`PostFXSystem.setDangerTension`: 4 a 10 em combate = pulso de 2000 ms; mais de 10, chefe ou HP <= 25% = 800 ms/1200 ms com tint vermelho; chamado em `GameScene` ~l.1849); luz do jogador por HP (`LightingSystem.updatePlayerLight`); reforços em `flee` após 5 s com `emitSound(x, y, 660)` (`Enemy.ts` ~l.675); `fearDistortionEnabled` e `tinnitusEnabled` em `SettingsScene.ts`; `atmosphereEffectsEnabled` no `GameplayHUD.tsx`. Diverge ou falta: o raio da luz é por bioma (`BIOME_LIGHTING`: 140 a 320 px; 200 px só em `gloomy_woods`) e encolhe de forma contínua (`0.6 + 0.4 * hpRatio`), não só abaixo de 30% de HP; a vinheta (`setDangerTension`) não é desligada por nenhuma opção (`atmosphereEffectsEnabled` só controla indicador e áudio em `GameScene`, e não há toggle dela em `SettingsScene`); desempenho de 60 FPS não verificado (exige execução).

## Decisões a confirmar

Comportamento e escopo abaixo são propostas sem aprovação registrada; nada aqui está decidido.

1. Faixas de perigo da vinheta (1 a 3, 4 a 10, mais de 10 inimigos) e frequências de pulsação.
2. Raio da aura de luz (~200 px) e encolhimento abaixo de 30% de HP (o código usa raio por bioma e encolhimento contínuo).
3. Reforços por `flee` após 5 s em raio 3x.
4. Indicador direcional na borda (vermelho em `combat`/`frenzy`, âmbar em `investigating`).
5. Opções de acessibilidade que desativam os efeitos (inclusive se a vinheta de perigo deve respeitar `atmosphereEffectsEnabled`).

---

> **Domínio:** Atmosfera Gótica, Indicadores Telegrafados, Áudio Espacial e Efeitos Visuais de Tensão.

## 1. Objetivo
Elevar a imersão, o suspense e a tensão tática de *Bloodmage 1995*, inspirando-se em clássicos de horror e sobrevivência (como *Silent Hill* e *Alien*). O objetivo é conectar os estados existentes da Inteligência Artificial dos inimigos a feedbacks visuais e sonoros diretos ao jogador, permitindo antecipar ameaças fora do campo de visão, sentir a intensidade dos cercos e reagir taticamente ao comportamento das criaturas.

---

## 2. Escopo proposto

### 2.1. Indicador de Ameaça Fora de Tela (Threat Indicator)
- Quando um inimigo fora do campo de visão da câmera entra em estado `combat` ou `frenzy`, exibir uma pulsação sutil na borda da tela (arco translúcido avermelhado) indicando o ângulo do inimigo em relação ao jogador.
- Se o inimigo estiver apenas em estado `investigating`, o indicador pulsa em tom âmbar suave.
- Ao entrar na tela ou ser derrotado, o indicador correspondente desaparece.

### 2.2. Áudio Espacial e Ruído Estático Direcional
- Integração de `StereoPannerNode` no `soundEngine.ts` conectado à posição relativa (vetor X/Y) das ameaças fora de tela.
- Emissão de um ruído estático/ressonância sutil direcionada para o canal de áudio correspondente (esquerda/direita), sinalizando aproximação antes da visão direta.

### 2.3. Vinheta Pulsante por Nível de Perigo
- Evolução da vinheta escura (hoje no `PostFXSystem`):
  - **Perigo Baixo (1–3 inimigos em combate):** Vinheta estática padrão.
  - **Perigo Médio (4–10 em combate):** Pulsação lenta da borda escura (1 ciclo a cada 2s).
  - **Perigo Alto (>10 em combate ou Chefe ativo):** Pulsação rápida com matriz de cor avermelhada.

### 2.4. Iluminação Dinâmica (Lanterna Rúnica)
- Aura de "luz de sangue" de ~200px ao redor do jogador.
- Fora do raio de luz, o cenário apresenta escurecimento progressivo (sem oclusão total de terreno).
- Quando o HP do jogador cai abaixo de 30%, o raio de luz encolhe levemente, intensificando a sensação de claustrofobia.

### 2.5. Chamado de Reforços no Estado `flee`
- Quando uma criatura entra em estado de fuga (`flee`) por baixo HP, se sobreviver por mais de 5 segundos, dispara o evento `onHearNoise()` em um raio 3× maior para convocar inimigos vizinhos.

---

## 3. Critérios de aceite (provisórios, sem IDs EARS)
- Indicador direcional na borda da tela visível para ameaças ativas fora do FOV da câmera.
- Indicador oculta-se imediatamente quando o inimigo é eliminado ou entra na tela.
- Vinheta ajusta frequência de pulsação e tonalidade em tempo real conforme a contagem de inimigos em combate.
- Iluminação dinâmica opera sem impacto na taxa de quadros (garantindo 60 FPS estáveis).
- Criaturas no estado `flee` acionam o chamado de reforços de forma consistente após 5 segundos.
- Opção nas Configurações permite desativar ou suprimir os efeitos visuais de tensão para acessibilidade.
