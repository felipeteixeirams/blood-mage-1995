---
agent_context: all agents
target_module: artifacts/bloodmage/src/game
priority: high
status: active
last_updated: 2026-08-11
tags: [specs, graphics, audio, postfx, tinnitus, quickwins, roadmap]
---

# Spec — Evolução Gráfica & Auditiva (Quick Wins & Roadmap Completo)

> Documento de Especificação Técnica. Define as funcionalidades de **Curto Prazo (Quick Wins)** implementadas, as regras de **Acessibilidade**, a justificativa do aditamento da Aura de Inimigo, e o roteiro detalhado de **Médio** e **Longo Prazo**.

---

## 🎯 Visão Geral & Filosofia

O objetivo deste ciclo é evoluir a qualidade gráfica e imersão auditiva de *Bloodmage 1995* sem abandonar a arquitetura procedural nem comprometer a taxa de quadros (60 FPS em dispositivos móveis).

- **Quick Wins (Implementados)**: 3 melhorias de impacto direto de curto prazo (Distorção de Medo, Cascata de Luz e Tinnitus de Ameaça), acompanhadas de toggles de acessibilidade nas Configurações.
- **Aura de Inimigo (Adiada)**: Adiada para a fase de integração de sprites/atlas 2D (Eixo B), evitando custo visual artefato ou poluição em sprites planares procedurais sem normal maps pre-baked.
- **Médio e Longo Prazo (Roadmap)**: Especificações técnicas prontas para execução futura sem sprites (Animações 8-direcionais, Efeitos de Dano, Ragdoll/Gib, Mesh Distortion, Shaders de Status e Reflexos).

---

## 🟢 Parte 1 — Quick Wins (Curto Prazo)

### A.1 — Distorção de Medo (Fear Distortion)

- **Conceito**: Ao encarar Bosses ou Elites com habilidades aterrorizantes (ex: rugido de entrada do Boss, uivo do Lycan em frenzy, rituais de cultistas), a tela sofre um pulso de distorção de onda (displacement) instantâneo combinando vinheta escura pulsante, transmitindo pavor direto ao jogador.
- **Impacto**: ALTO (atmosfera visceral e aterrorizante inspirada em *Dead Frontier 2*).
- **Gatilhos**:
  - Invocado via `PostFXSystem.triggerFearDistortion(durationMs)` / `ScreenEffects.applyDistortion()`.
  - Disparado em `Enemy.ts` quando monstro aciona `playBossRoar()`, `playHowl()` (Lycan frenzy) ou habilidades de área de elites.
- **Controle de Acessibilidade**:
  - Opção no menu de Ajustes: `Distorção Visual de Medo` (`fearDistortionEnabled` no Store).
  - Quando desativado, o pulso de distorção visual é suprimido para evitar fotossensibilidade ou enjoo.

### A.2 — Aura de Inimigo (Aditada / Postergada)

- **Decisão**: A aura colorida direta sobre sprites planares 2D sem assets de iluminação/spritesheet dedicados gera sobreposição indesejada e poluição visual.
- **Plan de Ação Futuro**: Será implementada na **Fase de Pipeline de Assets (Eixo B)** utilizando atlas de sprites com normais e blend modes aditivos (`Light2D` glow halos em `violeta` para mágicos, `vermelho` para sangue, `laranja` para infernais).

### A.3 — Cascata de Luz (Light Cascade)

- **Conceito**: Transição dinâmica de cor ambiente e gradação de iluminação por profundidade de andar (`floorDepth`).
- **Impacto**: ALTO (sensação constante de descida às profundezas do inferno).
- **Especificação**:
  - **Andares Superiores (Floor 1–2)**: Azul espectral frio (`#1e293b` / saturação -0.2).
  - **Andares Intermediários (Floor 3–5)**: Púrpura/violeta necromântico (`#311b92` / hue +190).
  - **Andares Profundos (Floor 6+)**: Vermelho infernal sangrento (`#881337` / hue -15, brilho +0.05).
- **Mecânica**: O `WorldManager` calcula o gradiente `floorDepth` e sincroniza com o `PostFXSystem` (ColorMatrix GPU ou Canvas overlay) sem overhead de renderização.

### A.4 — Tinnitus de Ameaça (Threat Tinnitus)

- **Conceito**: Feedback auditivo de alta tensão combinando tom senoidal agudo suave (~3.5kHz com modulação binaural em rampa) + abafamento de filtro passa-baixas (low-pass filter) no áudio ambiente.
- **Impacto**: MÉDIO-ALTO (tensão e pavor auditivo refinado).
- **Gatilhos**:
  - Ativado quando `Player.hp / Player.maxHp < 0.30` (HP crítico em pânico) ou durante rugidos/ameaças de elite a curta distância (< 220px).
- **Controle de Acessibilidade**:
  - Opção no menu de Ajustes: `Tinnitus de Ameaça` (`tinnitusEnabled` no Store).
  - Quando desativado, o zumbido de alta frequência é desligado, mantendo apenas a vinheta visual.

---

## 🟡 Parte 2 — Médio Prazo — Animações & Detalhes Procedurais (Roadmap 5h)

### 2.1 — Animações 8-Direcionais Procedurais para Inimigos
- **Arquitetura**: Utilizar a matriz de rotação e espelhamento já existente em `animationManager.ts` e `Enemy.ts`.
- **Implementação**:
  - Mapear os 8 vetores angulares: `N (0°)`, `NE (45°)`, `E (90°)`, `SE (135°)`, `S (180°)`, `SW (225°)`, `W (270°)`, `NW (315°)`.
  - Aplicar deformação de skew / escala em runtime (`setScale(baseX * cos, baseY * sin)`) para dar efeito de ângulo isométrico aos sprites sem novas artes.

### 2.2 — Efeitos de Dano Avançados (Flinch, Flash, Knockback)
- **Flinch**: Deslocamento de frame traseiro (2–4px por 60ms) em direção oposta à origem do ataque.
- **Hit Flash**: Sobrelayer `setTintFill(0xffffff)` de 2 frames (33ms) no acerto direto, transicionando para a cor de sangramento (`0xff0000`).
- **Knockback Posicional**: Impulso com decaimento exponencial baseado no atributo de massa do monstro (ex: Morcegos 180px/s, Golens 20px/s).

### 2.3 — Variantes Procedurais de Inimigos (Elite / Damaged / Furious)
- **Elite**: Halo reluzente + tamanho +15% + tintura por afixo (`vampiric`, `cursed`, `frenzied`, `spectral`).
- **Damaged (Inimigo Ferido)**: Quando HP < 40%, o sprite passa a emitir partículas de sangue contínuas e o parâmetro de oscilação de marcha (`walkPulse`) torna-se manco/assimétrico.
- **Furious**: Quando entra em `frenzy`, pulsação de tinta vermelha viva (`0xff2222`) com velocidade de animação de 1.4×.

### 2.4 — Morte Ragdoll com Gib Effects (Desmembramento Procedural)
- **Gore Explosion & Gibs**: Ao morrer com execução ou crítico > 150% de dano residual:
  - Fatiar a textura do sprite em 4 quadrantes (`Phaser.GameObjects.Image`).
  - Lançar cada pedaço (gib) com velocidade angular randômica (`angularVelocity`) e gravidade simulada em 2.5D.
  - Manter as manchas de sangue (`spr_blood_splatter`) no chão com rotação e opacidade estática no tilemap.

---

## 🔴 Parte 3 — Longo Prazo — Shaders & Distortion WebGL (Roadmap 6h)

### 3.1 — Mesh Distortion & Sombras Dinâmicas GPU
- **Sombras Direcionais Dinâmicas**: Desenhar a projeção da sombra do jogador e monstros como uma malha inclinada (`skewX`) com gradiente alpha opaco sob a luz mais próxima do `WorldManager`.
- **Wave Mesh Distortion**: Usar um shader fragment GLSL simples na câmera principal para distorções de ambiente (portais necromânticos e poços de lava).

### 3.2 — Shaders de Status de Personagem & Inimigos
- **Queimado (Burn)**: Shader de brasas pulsantes com descarte de fragmento por ruído Perlin (`dissolve effect`).
- **Congelado / Petrificado (Freeze/Stun)**: Overlay de refração gélida com desaceleração total da taxa de quadros de animação do sprite.
- **Maledicência / Corrupção**: Halo de fogo negro e deslocamento de coordenadas U/V em ondas senoidais.

### 3.3 — Reflexos Procedurais em Superfícies Líquidas
- **Pisos de Sangue & Água (Fosso das Chagas)**:
  - Inverter verticalmente os sprites de entidades próximas a tiles de água/sangue (`flipY: true`, `alpha: 0.35`).
  - Aplicar uma pequena onda de deslocamento na textura refletida em tempo real.

---

## 📊 Matriz de Rastreabilidade & Aceite

| Feature | Categoria | Estado | Teste de Aceite |
|---------|-----------|--------|-----------------|
| Distorção de Medo (A.1) | Quick Win | Implementado | Pulso na tela em roars/howls de Boss/Elite; desativável nos Ajustes |
| Aura de Inimigo (A.2) | Quick Win | Adiado para Eixo B | Spec de transição com sprites/atlas documentada |
| Cascata de Luz (A.3) | Quick Win | Implementado | Gradação de tom de iluminação conforme `floorDepth` |
| Tinnitus de Ameaça (A.4) | Quick Win | Implementado | Som agudo e abafamento quando HP < 30%; desativável nos Ajustes |
| Animações & Detalhes | Médio Prazo | Especificado | Roadmap de 5h validado |
| Shaders & Distortion | Longo Prazo | Especificado | Roadmap de 6h validado |

---

## Registro de Mudanças

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-08-11 | Criação da spec técnica completa de Evolução Gráfica e Auditiva (Quick Wins + Roadmap) | Jules (AI Assistant) |
