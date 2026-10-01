---
agent_context: all agents
target_module: root
priority: high
status: active
last_updated: 2026-08-11
tags: [specs, evolution]
---
# Bloodmage 1995 — Specs de Evolução por Contexto

> Baseado no Discovery de Produto (Agosto/2026) e análise direta do código-fonte.
> Cada spec detalha: **o que existe hoje**, **o que deve mudar**, **critérios de aceite** e **estimativa de esforço**.

---

## Índice de Contextos

| # | Contexto | Prioridade | Fase |
|---|----------|------------|------|
| 1 | [PWA — Reconstrução](#1-pwa--reconstrução) | 🔴 Crítico | Fase 1 |
| 2 | [Combate — Peso e Gore](#2-combate--peso-e-gore) | 🔴 Alta | Fase 1–2 |
| 3 | [Controles Mobile](#3-controles-mobile) | 🟠 Alta | Fase 1 |
| 4 | [Atmosfera e Tensão](#4-atmosfera-e-tensão) | 🟠 Média-Alta | Fase 2 |
| 5 | [Progressão e Quests](#5-progressão-e-quests) | 🟡 Média | Fase 2–3 |
| 6 | [UI/UX e Onboarding](#6-uiux-e-onboarding) | 🟠 Alta | Fase 1–2 |
| 7 | [Áudio e Trilha](#7-áudio-e-trilha) | 🟡 Média | Fase 3 |

---

## 1. PWA — Reconstrução

### Contexto
O jogo foi construído com intenção de ser um PWA, mas o suporte foi **removido** durante uma migração para o Replit (`virtual:pwa-register` deletado do `main.tsx`). Hoje o `index.html` tem meta tags de PWA mas não existe `manifest.json` nem service worker — o jogo **parece** mas não **é** um PWA instalável.

### O que existe hoje
- `index.html` com `<meta name="apple-mobile-web-app-capable" content="yes">` e similares
- `public/` com ícone base (512px mencionado no discovery)
- `RotateDeviceOverlay.tsx` — prova de que o jogo assume landscape
- `vercel.json` com headers de segurança configurados
- Fontes Google carregadas via CDN externo (quebra offline)

### Spec de Mudanças

#### 1.1 — `manifest.json`
Criar `artifacts/bloodmage/public/manifest.json`:
```json
{
  "name": "Bloodmage 1995",
  "short_name": "Bloodmage",
  "description": "ARPG de sobrevivência gótico",
  "start_url": "/",
  "display": "standalone",
  "orientation": "landscape",
  "background_color": "#0a0307",
  "theme_color": "#7a0f1a",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icon-512-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

#### 1.2 — Service Worker com estratégia de cache por tipo
Usar `vite-plugin-pwa` com configuração:
- **Cache-first** para bundle JS/CSS e engine Phaser
- **Stale-while-revalidate** para JSONs de dados (`waves.json`, `monsters.json`, `spells.json`)
- **Pré-cache** do shell da aplicação (index.html, fontes)

#### 1.3 — Fontes auto-hospedadas
Baixar e servir localmente (em `public/fonts/`):
- `Press Start 2P`
- `Cinzel`
- `UnifrakturMaguntia`
- `VT323`

Remover todas as referências a `fonts.googleapis.com` do `index.html` e do CSS global.

#### 1.4 — Ícones gerados proceduralmente
Gerar os ícones PWA (192px, 512px, maskable) a partir do próprio `textureGenerator.ts` em um script de build — mantém zero dependência de design tool e alinha com a filosofia do projeto.

#### 1.5 — Validação no pipeline
Adicionar `pnpm lighthouse --only-categories=pwa` ao `pnpm verify` como gate de qualidade. Critério mínimo: score ≥ 90.

### Critérios de Aceite
- [ ] Jogo instalável via "Adicionar à tela inicial" em Android e iOS Safari
- [ ] Jogo funciona 100% offline após primeira carga (sem erros de rede no DevTools)
- [ ] Fontes renderizam corretamente offline
- [ ] Lighthouse PWA ≥ 90
- [ ] Orientação bloqueada em landscape ao instalar
- [ ] `theme_color` aparece na barra de status do Android

### Esforço Estimado
**Baixo** — 1–2 dias. Toda a infraestrutura do Vite já suporta isso nativamente.

---

## 2. Combate — Peso e Gore

### Contexto
O combate atual é tecnicamente sofisticado (FSM de windup/strike/recovery, FOV, audição, esquiva) mas tem **sensação de leve** — sem hit-stop, sem finalização, gore apenas como partículas genéricas iguais para todos os monstros. A referência é **Dungeon Siege** (peso posicional) + **Brutal Doom/ZDoom** (finalizações com impacto visual).

### O que existe hoje
- `Enemy.ts`: FSM com estados `idle/patrol/investigating/combat/frenzy/flee`, `attackWindupTime`, `attackRecoveryTime`
- `Player.ts`: `invulnerabilityTime` passivo (800ms pós-dano), sem dash ativo
- `GameScene.ts`: partículas de sangue genéricas, `createBloodSplatter()`
- `textureGenerator.ts`: ~630 linhas gerando todos os sprites proceduralmente — **suporta sprites picotados** para desmembramento
- `spells.json`: Foice Sacrificial já tem semântica de "golpe sacrificial" — candidata natural para gore

### Spec de Mudanças

#### 2.1 — Hit-stop (Freeze Frame)
Ao acertar um golpe forte (crítico, habilidade especial, HP do inimigo ≤ 20%):
- Pausar a cena Phaser por **2–4 frames** (40–80ms) via `this.time.addEvent` + `this.physics.pause()`
- Retomar automaticamente
- Não interromper o áudio
- Criar `CombatFeel.ts` em `src/game/systems/` para centralizar hit-stop, screen shake e haptics

#### 2.2 — Screen Shake escalável
- Shake proporcional ao dano causado (golpe leve: 2px/2 frames; crítico: 6px/8 frames; habilidade especial: 10px/12 frames)
- Deve ter **opção de desativar** nas settings (acessibilidade)
- Reutilizar `this.cameras.main.shake()` do Phaser

#### 2.3 — Sistema de Execução (Gore)
Quando um inimigo atinge ≤ 15% HP e o golpe final vem de uma das habilidades sacrificiais (Foice Carmim, Explosão Necromântica):

1. **Hit-stop de 5–8 frames** (mais longo que o normal)
2. **Desmembramento procedural**: dividir o sprite do inimigo em 3–4 fragmentos usando `Phaser.GameObjects.Image` com texturas recortadas do canvas original. Cada fragmento aplica velocidade de impulso radial e gravidade leve.
3. **Splash de sangue intenso**: partículas em quantidade 3× maior, ângulo 360°, velocidade alta
4. **Vibração tátil**: `navigator.vibrate([30, 10, 20])` — padrão curto-longo para finalização
5. **SFX dedicado**: novo sample sintetizado via Web Audio (mais visceral — distorção + transiente grave)

Estrutura de dados necessária em `monsters.json` (adicionar por monstro):
```json
"executionFragments": 3,
"executionImpulse": 180,
"executionBloodScale": 3.0
```

#### 2.4 — Dash com Frames de Invulnerabilidade
Adicionar ao `Player.ts`:
- Tecla/botão: **Shift** no desktop, **botão dedicado** na HUD mobile (ícone de asas)
- Duração: 150ms, distância: 120px na direção do movimento
- Invulnerabilidade durante o dash: 200ms
- Cooldown: 3s (redutível por talento)
- Animação: trail de partículas vermelhas durante o dash
- Custo: 0 (mana), para não conflitar com o sistema de custo de sangue existente

#### 2.5 — Tuning de Densidade de Inimigos
- Manter totais de onda mas implementar **spawn cap em tela**: máximo de 18 inimigos ativos simultâneos (onda 1–3), 24 (onda 4), 30 (onda 5)
- Inimigos além do cap ficam em fila de spawn e entram quando um morre
- Isso preserva o total por onda mas melhora leitura tática e performance em dispositivos médios

### Critérios de Aceite
- [ ] Hit-stop perceptível em críticos sem causar lag
- [ ] Execução disparada corretamente pelas skills sacrificiais
- [ ] Fragmentos do desmembramento gerados em runtime sem sprites externos
- [ ] Dash com invulnerabilidade verificada (não tomar dano durante animação)
- [ ] Densidade máxima respeitada em todas as ondas
- [ ] Screen shake desativável nas configurações

### Esforço Estimado
- Hit-stop + screen shake: **Baixo** (meio dia)
- Sistema de execução/gore: **Médio** (3–4 dias)
- Dash: **Médio** (2–3 dias)
- Tuning de spawn: **Baixo** (1 dia)

---

## 3. Controles Mobile

### Contexto
O jogo já tem duplo joystick flutuante funcional. O gap em relação à referência (Mobile Legends) é: sem **drag-to-aim** nas habilidades, sem preview de área de efeito, sem customização de posição de botões e sem resposta tátil diferenciada por ação.

### O que existe hoje
- `useFloatingJoystick.ts` + `useJoystick.ts`: lógica de duplo joystick
- `App.tsx`: painel de botões de skill fixo no canto inferior direito
- `settings.virtualControlsOpacity` já existe no store — boa base para expandir
- Sem suporte a gamepad

### Spec de Mudanças

#### 3.1 — Drag-to-Aim nas Habilidades Direcionais
Para skills com direcionamento (Foice, Feixe de Hemomancia, Círculo):
- **Segurar** o botão da skill ativa modo de mira
- Arrastar na direção desejada exibe um **preview visual** (seta ou arco de área em vermelho translúcido sobre o canvas Phaser)
- **Soltar** dispara a skill na direção do arraste
- Se soltar sem arrastar (tap rápido), dispara na direção atual de movimento do jogador
- Comunicação HUD→Phaser via `EventBus` já existente no projeto

#### 3.2 — Preview de AoE
Durante o drag-to-aim:
- `Foice Carmim`: preview de arco de 120° na direção do arraste
- `Explosão Necromântica`: preview de círculo com raio real da explosão
- `Círculo de Transmutação`: preview de anel estático na posição do jogador
- Preview renderizado no canvas Phaser via `Graphics` temporário, destruído ao soltar

#### 3.3 — Customização de Layout de HUD
Novo item em **Configurações**:
- Opção "Editar Layout de Botões" que ativa modo de edição
- Cada botão de skill se torna arrastável (drag na própria HUD)
- Posição salva em `localStorage` via esquema Zod existente
- Também permitir ajuste de **tamanho** (pequeno/médio/grande) para acomodar tamanhos diferentes de polegar
- Resetar para o padrão como opção

#### 3.4 — Curva de Resposta do Joystick
Ajustar `useJoystick.ts`:
- Implementar curva não-linear: resposta lenta nos 30% centrais (zona de precisão), rápida nos 70% externos
- Dead zone configurável (default 8%)
- Tornar os parâmetros editáveis nas configurações avançadas

#### 3.5 — Suporte a Gamepad (Web Gamepad API)
- Detectar gamepad via `window.addEventListener('gamepadconnected')`
- Mapear: stick esquerdo → mover, stick direito → mirar/dash, gatilhos/botões → skills
- HUD se adapta: esconde joystick virtual quando gamepad detectado
- Baixíssimo esforço, alto valor para usuários desktop que instalam o PWA

#### 3.6 — Feedback Tátil Diferenciado
Via `Vibration API`:
| Evento | Padrão de Vibração |
|--------|-------------------|
| Dano recebido | `[50]` — um pulso médio |
| Esquiva bem-sucedida ("MISS!") | `[20, 30, 20]` — dois pulsos rápidos |
| Nível up | `[80, 20, 80]` — dois pulsos longos |
| Execução/Gore | `[30, 10, 20]` — padrão grave |
| Botão de skill sem cooldown suficiente | `[10]` — um pulso fraco |

### Critérios de Aceite
- [x] Drag-to-aim funcionando nas 3 skills direcionais em touch e mouse
- [x] Preview de área aparece durante arraste e desaparece ao soltar
- [x] Botões de skill reposicionáveis e tamanho persistido em localStorage
- [x] Gamepad detectado e mapeado corretamente (testar com controle físico)
- [x] Vibração funciona em Android (iOS não suporta a API — não é blocker)
- [x] Dead zone e curva configuráveis nas settings avançadas

> **Status (2026-08-15):** Item 3 evoluído para arquitetura Canvas-Native (Spec 11). Joystick flutuante e responsivo processado diretamente no ciclo do Phaser com latência zero (60/120 FPS), drag-to-follow (estilo Mobile Legends / Diablo Immortal), suporte a multitouch isolado e renderização gráfica WebGL sincronizada com `useGameStore` e `joystickResponse.ts`.

### Esforço Estimado
- Drag-to-aim + preview: **Médio** (3–4 dias)
- Customização de layout: **Médio** (2–3 dias)
- Curva de joystick: **Baixo** (1 dia)
- Gamepad: **Baixo** (1 dia)
- Haptics: **Baixo** (meio dia)

---

## 4. Atmosfera e Tensão

### Contexto
O jogo tem lore e IA sofisticadas (estados `investigating`, `flee`, detecção de som/visão) mas **nada disso é perceptível ao jogador visualmente ou sonoramente**. A referência é **Silent Hill** (tensão pela ausência + rádio como indicador de perigo) e **Alien** (ameaça fora do campo de visão).

### O que existe hoje
- `Enemy.ts`: estados `investigating`, `flee`, `frenzy` com lógica funcional
- `onHearNoise()`: método completo de detecção sonora nos inimigos
- `GameScene.ts`: vinheta escura já implementada, scanlines de CRT
- `soundEngine.ts`: sintetizador Web Audio com múltiplos contextos
- Nenhuma conexão entre estado de IA do inimigo e feedback visual/sonoro ao jogador

### Spec de Mudanças

#### 4.1 — Indicador de Ameaça Fora de Tela (Silent Hill-style)
Criar `ThreatIndicator.tsx` (componente React) ou `ThreatIndicatorSystem.ts` (Phaser):
- Quando qualquer inimigo fora do campo de visão do jogador entrar em estado `combat` ou `frenzy`:
  - Exibir **pulsação direcional** na borda da tela (arco translúcido vermelho/âmbar) apontando para o inimigo mais próximo em estado de alerta
  - Intensidade proporcional ao número de inimigos em estado de combate fora de tela
- Quando inimigo em `investigating` mas não em `combat`:
  - Pulsação sutil âmbar (menos intensa que vermelho de combate)
- Quando não há ameaça: indicador invisível

#### 4.2 — Distorção de Áudio Direcional
No `soundEngine.ts`:
- Criar um `StereoPannerNode` dinâmico ligado à posição relativa do inimigo mais ameaçador
- Quando inimigo em `combat` estiver fora de tela: adicionar layer de "ruído estático" sutil com pan direcional (esquerda/direita conforme posição x do inimigo relativa ao jogador)
- Inspirado no rádio de Silent Hill: o som não é explicativo, é instintivo

#### 4.3 — Vinheta Pulsante por Nível de Perigo
A vinheta escura já existe. Evoluí-la para:
- **Perigo baixo** (≤3 inimigos em combate): vinheta estática atual
- **Perigo médio** (4–10 em combate): vinheta pulsa lentamente (1 ciclo/2s)
- **Perigo alto** (>10 em combate ou boss ativo): vinheta pulsa rápido + levemente rubra
- Implementar via CSS animation dinâmica ou canvas overlay no PhaserGame.tsx

#### 4.4 — Iluminação Dinâmica (Lanterna/Aura do Jogador)
Usar `Phaser.GameObjects.Light` ou overlay de Canvas:
- Círculo de "luz de sangue" ao redor do jogador com raio de ~200px
- Fora do raio: escurecimento progressivo (não total) do cenário
- Raio diminui levemente quando HP baixo (abaixo de 30%)
- Monstros fora do raio aparecem como silhuetas até entrar na zona de luz
- Sem assets novos — puro efeito de blend mode sobre os sprites procedurais existentes

#### 4.5 — Estado `flee` como Mecanismo de Tensão
Atualmente o estado `flee` existe mas não gera consequência narrativa. Adicionar:
- Quando um inimigo foge (HP ≤ `coragem`%), após 5 segundos ele "chama reforços" via `onHearNoise()` em raio 3× maior
- Isso cria o loop: matar completamente é mais seguro que deixar fugir — decisão tática real
- Inimigo fugindo emite um SFX de "grito/chamado" distinto para comunicar isso ao jogador

### Critérios de Aceite
- [ ] Indicador direcional visível quando inimigo em `combat` está fora de tela
- [ ] Indicador desaparece quando todos os inimigos entram no campo de visão
- [ ] Vinheta muda de intensidade em tempo real conforme contagem de inimigos em combate
- [ ] Iluminação dinâmica renderiza sem queda de FPS (medir com Phaser debug stats)
- [ ] Inimigo fugitivo dispara evento de "chamar reforços" após 5s
- [ ] Todos os efeitos têm opção de desativar nas settings (acessibilidade)

### Esforço Estimado
- Indicador direcional + vinheta: **Médio** (2–3 dias)
- Áudio direcional: **Médio** (2 dias, depende de familiaridade com Web Audio)
- Iluminação dinâmica: **Médio-Alto** (3–4 dias — risco de performance)
- `flee` como tensão narrativa: **Baixo** (1 dia)

---

## 5. Progressão e Quests

### Contexto
O jogo tem boa base de progressão (XP→nível, talentos, loot com raridade) mas **nenhuma estrutura de missão** — o único objetivo é sobreviver às 5 ondas. O discovery identifica micro-quests por run como a forma mais eficiente de adicionar propósito sem mudar o gênero.

### O que existe hoje
- `talents.json`: 5 nós de talento com até 10 níveis cada
- `LootSystem.ts`: raridades, slots, efeitos em stats
- `waves.json`: 5 ondas com pools de monstros configuráveis
- `gameStore.ts`: estado global — boa base para adicionar estado de quest
- Nenhuma estrutura de quest no código

### Spec de Mudanças

#### 5.1 — Micro-Quests por Run (Fase 2)
Sistema de "Contratos de Run" — 3 objetivos opcionais gerados no início de cada run a partir dos dados existentes:

**Estrutura de dados** (`src/data/contracts.json`):
```json
[
  {
    "id": "no_scythe_wave3",
    "label": "Disciplinado",
    "description": "Sobreviva à Onda 3 sem usar a Foice Sacrificial",
    "condition": { "type": "spell_not_used", "spell": "foice_sacrificial", "wave": 3 },
    "reward": { "bloodCrystals": 50, "xpBonus": 0.15 }
  },
  {
    "id": "kill_10_hounds_nodamage",
    "label": "Predador",
    "description": "Mate 10 Cães Infernais consecutivos sem tomar dano",
    "condition": { "type": "kill_streak_nodamage", "enemy": "hell_hound", "count": 10 },
    "reward": { "bloodCrystals": 80 }
  }
]
```

**Implementação:**
- `ContractSystem.ts` em `src/game/systems/`: rastreia condições em tempo real
- `ContractHUD.tsx`: painel dobrável no canto superior direito exibindo os 3 contratos da run
- Contratos selecionados aleatoriamente de um pool por corrida (sem seed — pura aleatoriedade)
- Recompensa entregue ao completar (animação de "Contrato Cumprido!" + Cristais de Sangue)

#### 5.2 — Expansão da Árvore de Talentos (Fase 2)
A árvore atual tem 5 nós lineares. Expandir com **ramificações exclusivas**:

**Novo layout proposto:**
```
[Dano Base] → ESCOLHA: [Vampirismo Profundo] OU [Execuções em Área]
[HP + Regen] → ESCOLHA: [Escudo de Ossos Aprimorado] OU [Aura de Medo]
[Redução de Cooldown] → ESCOLHA: [Sobrecarga Rúnica] OU [Tempestade Contínua]
```

- Escolher um nó bloqueia o outro permanentemente na run
- Cria identidade de build sem novos sistemas de base
- `talents.json` já suporta estrutura de nós — adicionar campo `"exclusive_with": ["id_do_outro_nó"]`

#### 5.3 — Evolução por Habilidade (Fase 2–3)
Adicionar upgrades específicos por skill (além dos stats globais):
- Ao atingir nível 5 e 10, o jogador escolhe um upgrade para uma skill específica
- Ex: Foice Sacrificial nível 2 → "Desmembramento em Área" (gore em AoE de 60px)
- `upgrades.json` já tem estrutura de efeitos combináveis — amarrar por `"spellId": "foice_sacrificial"`

#### 5.4 — Modificadores de Run (Fase 2)
Na tela de seleção antes de iniciar uma run, oferecer 2 modificadores opcionais:
- `"Maré de Sangue"`: +40% inimigos, +30% loot
- `"Penúria Rúnica"`: skills custam 2× mana, recompensa em Cristais de Sangue +100%
- `"Fúria do Fosso"`: todos os inimigos nascem em estado `frenzy`, XP +50%
- Dados em `src/data/runModifiers.json` — nenhuma mudança de engine

### Critérios de Aceite
- [ ] 3 contratos gerados aleatoriamente a cada nova run
- [ ] Progresso dos contratos visível na HUD durante o jogo
- [ ] Recompensa entregue no momento de conclusão (não só ao fim da run)
- [ ] Árvore de talentos com pelo menos 2 pontos de ramificação exclusivos
- [ ] Modificadores de run persistem na run mas não no localStorage entre runs
- [ ] Evolução por habilidade aparece no fluxo de level-up existente

### Esforço Estimado
- Micro-quests/contratos: **Médio** (4–5 dias)
- Ramificação de talentos: **Baixo** (1–2 dias — majoritariamente dados)
- Evolução por habilidade: **Médio** (2–3 dias)
- Modificadores de run: **Baixo** (1 dia)

---

## 6. UI/UX e Onboarding

### Contexto
A arquitetura React + Zustand + HUD desacoplada do Phaser já está pronta. O gap está em: falta de onboarding, inconsistência entre os 8+ modais existentes e falta de feedback tátil/visual em momentos-chave de UX.

### O que existe hoje
- 8+ modais: inventário, talentos, bestiário, recordes, settings, observabilidade, level-up, game-over
- HUD com 4 regiões bem definidas
- Nenhum tutorial ou onboarding progressivo
- `settings.virtualControlsOpacity` — base para expandir configurações de UX

### Spec de Mudanças

#### 6.1 — Onboarding Progressivo (Primeira Run)
Sistema de "Revelação Progressiva" — apresentar sistemas conforme o jogador encontra cada um pela primeira vez:

| Gatilho | Revelação |
|---------|-----------|
| Primeira morte de inimigo | Tooltip: "Colete o loot no chão antes de continuar" |
| Primeiro level-up | Modal de talentos abre automaticamente com highlight |
| Primeiro item equipado | Tooltip: "Compare com o que você tem no inventário" |
| Primeiro boss (onda 5) | Cutscene mínima: texto + shake de câmera de apresentação |
| Primeira execução de skill | Indicador de cooldown com highlight |

- Estado salvo em localStorage: onboarding não se repete na segunda run
- Implementar via `OnboardingSystem.ts` que escuta eventos do `EventBus`

#### 6.2 — Padronização de Modais
Passe de padronização nos 8 modais:
- Mesmo componente base de backdrop (`ModalBase.tsx`) com entrada/saída animada (Motion)
- Mesma hierarquia tipográfica: título em Cinzel, corpo em Press Start 2P tamanho menor
- Tecla `Escape` fecha qualquer modal aberto (verificar que todos implementam)
- Padrão de botão de fechar: `×` no canto superior direito, tamanho mínimo 44px (touch)
- Transição entre modais: fade 120ms (não pisca entre telas)

#### 6.3 — Auditoria de Legibilidade em Combate
- Auditar contraste de textos flutuantes de dano sobre fundo do jogo (alvo: mínimo WCAG AA)
- Garantir que dano crítico, miss e heal são distinguíveis por **forma + cor** (não só cor)
- Testar com 20+ inimigos em tela em modo mobile (320px largura mínima)
- Criar modo de "alto contraste" em settings: aumenta tamanho de fonte e adiciona contorno preto nos textos flutuantes

#### 6.4 — Acessibilidade de Movimento
Opção em Configurações:
- Desativar screen shake
- Desativar flashes de tela (ex.: flash branco ao tomar dano)
- Reduzir intensidade de partículas (modo de baixa performance)
- Essas opções já fazem sentido para performance em dispositivos mais fracos também

#### 6.5 — Paleta Cosmética por Progressão
Recompensa cosmética leve usando `setTint()` do Phaser (já usado nos inimigos):
- Desbloquear "paletas de sangue" para o sprite do jogador como recompensa de contrato/milestone
- Ex: "Sangue Carmesim" (default), "Sangue Corrupto" (roxo), "Sangue Dourado" (boss killer), "Sangue Negro" (100 kills)
- Configurado em `src/data/palettes.json`, aplicado via `player.setTint(hex)` em `Player.ts`
- Custo zero de arte nova

### Critérios de Aceite
- [ ] Onboarding aparece somente na primeira run, não nas seguintes
- [ ] Todos os modais têm o mesmo backdrop, animação e botão de fechar padronizados
- [ ] Escape fecha qualquer modal em qualquer contexto
- [ ] Opções de acessibilidade persistem em localStorage
- [ ] Textos flutuantes de dano legíveis com 20 inimigos em tela
- [ ] Pelo menos 3 paletas cosméticas desbloqueáveis via contratos

### Esforço Estimado
- Onboarding: **Médio** (3–4 dias)
- Padronização de modais: **Baixo-Médio** (2–3 dias)
- Auditoria de legibilidade: **Baixo** (1 dia)
- Acessibilidade: **Baixo** (1 dia)
- Paletas cosméticas: **Baixo** (1 dia)

---

## 7. Áudio e Trilha

### Contexto
O projeto tem 665 linhas de sintetizador Web Audio elegante — zero assets de áudio. Isso é tecnicamente admirável e mantém o bundle leve, mas tem teto artístico para trilha de chefe/tensão atmosférica. A recomendação é um modelo híbrido, não abandonar o procedural.

### O que existe hoje
- `soundEngine.ts`: SFX sintetizados (disparo, explosão, shield etc.) + trilha de fundo gerada em runtime
- Sem nenhum arquivo de áudio externo
- Sem áudio ambiente por bioma

### Spec de Mudanças

#### 7.1 — Manter SFX Sintetizados
Todos os SFX de gameplay (projéteis, impactos, UI, collectibles) permanecem 100% sintetizados. É onde o procedural entrega mais valor por custo.

**Adicionar SFX novos via síntese** (sem assets):
- SFX de execução/gore (spec 2.3): transiente grave + distorção
- SFX de dash (spec 2.4): whoosh com pitch descendente
- SFX de contrato completo: fanfara curta de 3 notas
- SFX de "chamado de reforços" dos inimigos fugitivos (spec 4.5)

#### 7.2 — Trilha Híbrida (Fase 3)
Para as cenas de maior carga emocional, introduzir trilhas compostas:
- **Loop de Exploração**: drone ambiente por bioma (Fosso, Catacumbas, Santuário) — ~30s loop, comprimido em OGG
- **Loop de Combate**: percussão intensa, carregado dinamicamente quando a primeira onda inicia
- **Loop de Boss**: tema de boss distinto, carregado na onda 5
- **Loop de Menu**: tema melancólico de abertura

**Estratégia de bundle:**
- Faixas em OGG (melhor compressão em browsers modernos), fallback MP3
- Carregadas pelo service worker do PWA — não impactam o load inicial
- Web Audio ainda usado como **mixer dinâmico** por cima: intensificar layer de percussão quando HP ≤ 30%, adicionar distorção quando boss entra em `frenzy`

#### 7.3 — Áudio Ambiente por Bioma
Mesmo sintetizado, criar 3 texturas de áudio ambiente:
- **Fosso das Chagas**: gotejamento + ressonância metálica
- **Catacumbas dos Mártires**: eco profundo + respiração distante
- **Santuário de Sangue**: canto gregoriano distorcido (osciladores Web Audio em harmonia)

#### 7.4 — Auto-hospedar vs Licenciar
Se o time decidir não compor a trilha internamente, opções de licenciamento:
- **itch.io / OpenGameArt.org**: tracks góticas/dark ambient com licença CC (custo zero, citação obrigatória)
- **Epidemic Sound** (pago): curadoria profissional, sem obrigação de citação, melhor opção se houver budget
- Recomendado: Fase 3 só após validar retenção das Fases 1 e 2 com jogadores reais

### Critérios de Aceite
- [ ] Novos SFX de execução/dash/contrato/chamado adicionados ao `soundEngine.ts`
- [ ] Se trilha composta adotada: carregada via service worker sem impactar load inicial
- [ ] Áudio ambiente ativo por "bioma" quando a onda correspondente inicia
- [ ] Mixagem dinâmica: percussão intensifica quando HP ≤ 30%
- [ ] Todas as fontes de áudio têm controle de volume independente nas settings

### Esforço Estimado
- Novos SFX sintetizados: **Baixo** (1–2 dias)
- Áudio ambiente sintetizado: **Baixo-Médio** (1–2 dias)
- Trilha híbrida (se composta): **Alto** — depende de produção musical (fora do escopo do time de eng)
- Mixer dinâmico: **Médio** (2 dias)

---

## Matriz de Decisão — O Que Tocar Primeiro

> [!IMPORTANT]
> O discovery é correto que o **PWA é pré-requisito de tudo**. Se o jogo não é instalável, nenhuma melhoria de UX chega ao jogador da forma pretendida.

| Iniciativa | Impacto | Esforço | Fase |
|-----------|---------|---------|------|
| Reconstruir PWA | 🔴 Crítico | ⬇️ Baixo | **Fase 1** |
| Hit-stop + screen shake | 🔴 Alto | ⬇️ Baixo | **Fase 1** |
| Haptics (vibração tátil) | 🔴 Alto | ⬇️ Baixo | **Fase 1** |
| Dash com invulnerabilidade | 🟠 Alto | ↔️ Médio | **Fase 1** |
| Drag-to-aim + AoE preview | 🟠 Alto | ↔️ Médio | **Fase 1** |
| Vinheta de perigo + indicador | 🟠 Alto | ↔️ Médio | **Fase 2** |
| Sistema de execução (gore) | 🟠 Alto | ↔️ Médio | **Fase 2** |
| Micro-quests/contratos | 🟠 Alto | ↔️ Médio | **Fase 2** |
| Onboarding progressivo | 🟠 Alto | ↔️ Médio | **Fase 2** |
| Tuning de densidade | 🟡 Médio | ⬇️ Baixo | **Fase 2** |
| Ramificação de talentos | 🟡 Médio | ⬇️ Baixo | **Fase 2** |
| Paletas cosméticas | 🟡 Médio | ⬇️ Baixo | **Fase 2** |
| Padronização de modais | 🟡 Médio | ↔️ Médio | **Fase 2** |
| Gamepad support | 🟡 Médio | ⬇️ Baixo | **Fase 1** |
| Iluminação dinâmica | 🟠 Alto | ⬆️ Alto | **Fase 3** |
| Trilha híbrida composta | 🟠 Alto | ⬆️ Alto | **Fase 3** |
| Spritesheets reais | 🟠 Alto | ⬆️ Alto | **Fase 3** |
| Estrutura de masmorras/biomas | 🔴 Alto | ⬆️ Muito Alto | **Fase 4** |

---

## Notas Finais

> [!NOTE]
> As specs de **Fase 3 e 4** (spritesheets reais, trilha composta, masmorras por bioma) envolvem decisões de orçamento de produção de arte/áudio que vão além do time de engenharia. Recomenda-se validar as Fases 1 e 2 com jogadores reais antes de comprometer esse investimento.

> [!TIP]
> O maior "hack" de alto impacto com baixo esforço deste projeto é o **Contexto 4 (Atmosfera)** — todos os sistemas de IA já existem no código, falta só conectá-los a feedback visual/sonoro. É o tipo de trabalho que faz o jogo parecer muito mais elaborado sem escrever quase nenhuma mecânica nova.
