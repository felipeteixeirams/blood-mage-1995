---
agent_context: all agents
target_module: docs/domain
priority: critical
status: active
last_updated: 2026-08-11
tags: [domain, spec, architecture, rules, retro]
---
# 📜 Domínio de Jogo & Regras de Negócio Core

Este documento unifica e define formalmente as regras de domínio, mecânicas e diretrizes visuais do projeto **Bloodmage 1995**, servindo como fonte única de verdade para futuros desenvolvimentos de software e integrações de IA, garantindo máxima fidelidade ao design original e prevenindo regressões de jogabilidade.

---

## 🎮 1. Filosofia de Design e Identidade Visual

### 🌌 Nostalgia Moderna (Modern Nostalgia)
O Bloodmage 1995 não se propõe a ser um clone rudimentar de jogos do início da era dos microcomputadores ou consoles de 8 bits. Sua filosofia inspira-se no conceito de **Nostalgia Moderna**:
* **Gráficos Pixelados de Altíssima Resolução:** A estética evoca a era dos anos 90 (pixel-art, tons de charcoal, gótico obscuro) combinando-se com tecnologias e resoluções modernas (até 4K, suporte fluido a telas de alta densidade DPI), sombras ricas de pós-processamento, atmosferas pulsantes e transições responsivas.
* **Efeitos de Atmosfera:** Neblina flutuante, efeitos de balanço de tela (*Screen Shake*), oscilação dinâmica de luz de tochas e flashes estéticos ao sofrer dano, que elevam a imersão sensorial mantendo a essência clássica (Minecraft-like modern graphics).

### 📱 Prioridade Mobile-First (Mobile Legends / Diablo Immortal)
A hierarquia máxima das proporções e da usabilidade de layout é **Mobile-First**.
* **Sem Distorções ou Sobreposição de Controles:** Componentes de desktop (como a inspiração em Dungeon Siege) servem para colorização, estética de barras e frames metálicos, porém a adaptabilidade, posicionamento de botões de toque de fácil alcance, joysticks flutuantes e painéis colapsáveis seguem a usabilidade dos maiores expoentes *State of the Art* de RPGs Mobile contemporâneos.
* **Toque vs Teclado:** O jogo intercepta e isola cliques do React sobre o Canvas do Phaser, utilizando propagação limpa (`e.stopPropagation()` / `e.nativeEvent.stopImmediatePropagation()`) para que menus de HUD não ativem mecânicas subjacentes na cena de batalha.

---

## ⚔️ 2. Sistemas Críticos e Regras de Negócio

### 🔄 FSM de Inimigos & Combate Direto
* **Proibição de Touch Damage Passivo:** Nenhum inimigo causa dano ao jogador simplesmente por colidir fisicamente com ele.
* **FSM Telegrafada:** Todo ataque físico e corpo a corpo de monstro deve obrigatoriamente fluir através de uma máquina de estados telegrafada clara:
  1. **Windup (Preparação):** O monstro brilha ou prepara a arma (telegrafia visual de carga).
  2. **Strike (Ataque):** A colisão física ou área de dano é ativada no frame exato do golpe.
  3. **Recovery (Recuperação):** Período de fadiga pós-ataque onde o monstro fica vulnerável.

### 💀 Sistema de Inconsciência & Morte
* **Knockout Limite (Até 2 Vezes):** Ao zerar a vida, o jogador não morre instantaneamente em primeira instância. Ele entra em estado de **Inconsciência**.
  * A visão torna-se dessaturada (filtro em tons de cinza) e um gradiente preto radial reduz o campo visual (*Tunnel Vision*).
  * O jogador pode regenerar seu HP gradualmente e deve "agarrar o sopro de vida" para levantar-se de forma heróica.
  * O limite máximo é de **2 desmaios**. O terceiro nocaute resulta em **Morte Definitiva**.
* **Morte e Perda de Pertences:**
  * No caso de Morte Definitiva, o jogador é transportado de volta para a Vila Segura (Room 0) e sofre uma penalidade de perda de XP.
  * Suas curas (ataduras, antídotos e antibióticos) são despejadas em um cadáver no local da queda (*Gothic Corpse Retrieval*), devendo ser recuperadas ao retornar ao calabouço.

### 🧪 Condições de Status & Itens Curativos
O jogador está sujeito a três males debilitantes que exigem curativos específicos:
1. **Sangramento (Bleeding) 🩸:** Drena a vida do jogador continuamente quando em movimento. Curado usando **Ataduras**.
2. **Veneno (Poison) 🍇:** Drena a vida a uma taxa constante, independente de movimento. Curado usando **Antídotos**.
3. **Infecção (Infection) 🧪:** Bloqueia a regeneração natural e reduz a vida máxima do jogador. Curado usando **Antibióticos**.

---

## 🔒 3. Governança de Desenvolvimento para Agentes de IA

Este domínio é estritamente protegido. Qualquer alteração ou refatoração que altere o comportamento das mecânicas descritas neste documento **deve passar por verificação prévia ou aprovação explícita do usuário**, garantindo que modificações cosméticas ou refatorações de código nunca gerem regressões funcionais.
