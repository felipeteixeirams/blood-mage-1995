---
agent_context: Product Managers, Game Designers, Engenheiros e Agentes IA
target_module: Estratégia de Produto, Mobile-First UX, Retenção e Game Feel
priority: high
status: active
last_updated: 2026-08-28
tags: [mobile-first, retention-kpi, product-bible, game-feel, discovery-filter, simplicity]
---

# 📖 A Bíblia de Sucesso Mobile & Framework de Retenção (Blood Mage 1995)

> **Princípio Fundamental:**  
> O sucesso de um jogo mobile não é determinado pela quantidade de mecânicas ou complexidade de menus, mas pela **velocidade com que entrega dopamina (Time to Fun)**, **clareza visual no combate**, **fricção zero na jogabilidade** e **profundidade emergente acessível**.
>
> Este documento é a **Bíblia de Produto e Design** do *Blood Mage 1995*. Nenhuma nova funcionalidade, tela, habilidade ou refatoração entra no jogo sem passar pelo crivo dos princípios e KPIs aqui definidos.

---

## 🎯 1. Os 5 Pilares de Sucesso Mobile (Evidence-Based)

Baseado nas melhores práticas e métricas de sucessos consagrados do gênero (*Vampire Survivors*, *Soul Knight*, *Archero*, *Magic Survival*, *Brotato*, *Dead Cells Mobile*):

```
                     ┌─────────────────────────────────────────┐
                     │     OS 5 PILARES DE SUCESSO MOBILE      │
                     └────────────────────┬────────────────────┘
                                          │
       ┌──────────────────┬───────────────┴───────────────┬──────────────────┐
       ▼                  ▼                               ▼                  ▼
 [Time to Fun <10s] [Simplicidade &]             [Ergonomia &]       [Performance &]
  Fricção Zero       Legibilidade                 Polegar Seguro      Offline-First
 (Instant Combat)   (Zero Visual Slop)           (Zona de Alcance)   (60 FPS / <2.5MB)
```

### Pilar 1: Time to Fun (TTF) < 10 Segundos & Fricção Zero
* **Regra:** O jogador deve estar movimentando o personagem e estraçalhando o primeiro monstro em menos de 10 segundos após abrir o app.
* **Proibições Estritas:**
  * ❌ Proibido formulários de cadastro, login obrigatório ou telas de loading demoradas.
  * ❌ Proibido tutoriais de texto invasivos (paredes de texto) que travam o controle do jogador.
  * ❌ Proibido labirintos de menus antes de iniciar a primeira partida.
* **Diretriz de Ouro:** *O tutorial é o próprio gameplay.* O jogador aprende a desviar desviando e aprende a usar magia quando a barra brilha.

### Pilar 2: Simplicidade Elegante & O Loop de 30 Segundos
* **Regra:** O loop básico de combate precisa ser compreensível em 5 segundos e gerar satisfação a cada 30 segundos.
  $$\text{Loop Central: } \text{Mover/Posicionar} \longrightarrow \text{Esquivar/Telegrafia} \longrightarrow \text{Conjurar Magia} \longrightarrow \text{Explosão Visceral/Gore} \longrightarrow \text{Recompensa/XP/Sangue}$$
* **Carga Cognitiva:** No máximo 2 a 3 decisões ativas simultâneas durante o combate.
* **Profundidade sem Complexidade:** A complexidade deve nascer da combinação de itens/relíquias e posicionamento tático (profundidade emergente), nunca de microgerenciamento de inventário confuso em meio à ação.

### Pilar 3: Legibilidade Visual & Pixel Art Funcional (Anti-Slop)
* **Regra:** Em telas pequenas (4.7" a 6.8"), a leitura da ação deve ser instantânea, mesmo sob dezenas de inimigos.
* **Hierarquia de Contraste Óptico Obrigatória:**
  1. **Nível 1 (Crítico):** Jogador e Hitbox do Jogador (máximo destaque e silhueta limpa).
  2. **Nível 2 (Perigo Iminente):** Telegrafias inimigas e projéteis perigosos (cores vibrantes, contraste com o chão).
  3. **Nível 3 (Alvos):** Inimigos e silhuetas de monstros.
  4. **Nível 4 (Feedback):** Sangue, partículas de impacto, números de dano (não podem encobrir o Nível 1 e 2).
  5. **Nível 5 (Ambiente):** Chão, paredes e detalhes de cenário (tons escuros e neutros, sem ruído excessivo).

### Pilar 4: Ergonomia Mobile & Zona de Polegar (Thumb Zone)
* **Regra:** 100% dos controles e ações críticas devem estar dentro da zona de alcance natural dos polegares em modo paisagem (*Landscape*).
* **Alvos de Toque (Touch Targets):** Mínimo de **48x48px** para botões de combate e atalhos rápidos.
* **Controles Híbridos/Flutuantes:** Joystick virtual dinâmico que se adapta onde o polegar toca, evitando fadiga muscular e erros de toque.

### Pilar 5: Resiliência Offline & Performance Extrema
* **Regra:** Jogo 100% funcional sem conexão de rede (avião, metrô, áreas sem sinal).
* **Frame Rate:** 60 FPS estáveis mesmo em aparelhos de entrada, sem quedas causadas por Garbage Collection (*Object Pooling* obrigatório em projéteis, sangue e textos).
* **Preservação de Estado:** Se o jogador receber uma ligação, alternar de app ou fechar a tampa, o jogo **pausa imediatamente e salva o estado da sala localmente**. Perder progresso por fechar o app destrói a retenção.

---

## 📊 2. Métricas & KPIs de Sucesso (Benchmarks da Indústria)

Toda decisão de design deve ser orientada a impactar diretamente uma das 4 métricas vitais de retenção:

| Métrica / KPI | Meta (Benchmark Sucesso) | O que impacta diretamente? | Como o Blood Mage 1995 otimiza |
|---|---|---|---|
| **D1 Retention (Dia 1)** | **> 42% - 48%** | Primeira impressão, Time to Fun, fluidez dos controles e Game Feel visceral. | Ação imediata em <10s, hit-stop satisfatório, tela responsiva e sem travamentos. |
| **D7 Retention (Dia 7)** | **> 18% - 24%** | Meta-progressão, variedade de builds, contratos rápidos e curiosidade. | Santuário com upgrades visíveis, desbloqueio de novas magias e relíquias com sinergias reais. |
| **D30 Retention (Dia 30)** | **> 8% - 12%** | Domínio do sistema, modificadores de run (Run Modifiers), desafios endgame e Codex. | Modo Pesadelo/Contratos de Sangue, colecionismo de monstros e itens raros. |
| **Session Length (Duração)** | **5 a 12 minutos** | Adequação ao estilo de vida mobile (micro-sessões vs partidas completas). | Salas compactas com checkpoints claros entre andares da masmorra. |
| **Crash & ANR Rate** | **< 0.1%** | Estabilidade técnica e ausência de bugs fatais. | Schemas Zod seguros no storage, testes automatizados e fallback procedural. |

---

## 🛑 3. O Filtro de Sucesso de Discovery & Specs (O Crivo Obrigatório)

> **REGRA DE OURO:** Nenhuma proposta entra na fila de desenvolvimento ou vira código se não responder positivamente aos 5 critérios do **Filtro de Sucesso**.

```
  [Ideia / Proposta de Feature]
                │
                ▼
  ┌──────────────────────────┐
  │ 1. Impacto em KPI?       │ ── NÃO ──► [DESCARTAR / DEFERIR]
  └─────────────┬────────────┘
               SIM
                ▼
  ┌──────────────────────────┐
  │ 2. Simplicidade < 5s?    │ ── NÃO ──► [SIMPLIFICAR ANTES DE AVANÇAR]
  └─────────────┬────────────┘
               SIM
                ▼
  ┌──────────────────────────┐
  │ 3. Ergonomia Mobile OK?  │ ── NÃO ──► [REDESENHAR INTERFACE TOUCH]
  └─────────────┬────────────┘
               SIM
                ▼
  ┌──────────────────────────┐
  │ 4. Performance & 60 FPS? │ ── NÃO ──► [OTIMIZAR ARQUITETURA]
  └─────────────┬────────────┘
               SIM
                ▼
  ┌──────────────────────────┐
  │ 5. ROI & Anti-Overeng.?  │ ── NÃO ──► [RECUSAR OVERENGINEERING]
  └─────────────┬────────────┘
               SIM
                ▼
  [APROVADO PARA SPEC & IMPLEMENTAÇÃO]
```

### Checklist do Filtro de Sucesso (Copie e use em toda Spec):

```markdown
### 🎯 Validação do Filtro de Sucesso Mobile
- [ ] **1. Impacto Direto em KPI:** Esta feature move D1 (satisfação/game feel), D7 (meta-progressão/curiosidade) ou D30 (rejogabilidade)? Qual é o indicador-alvo?
- [ ] **2. Simplicidade & Fricção Zero:** O jogador consegue entender e utilizar a mecânica em menos de 5 segundos sem ler um manual? Gera complexidade de menu desnecessária?
- [ ] **3. Ergonomia & Mobile Native:** Funciona perfeitamente com toque/polegar? Respeita a zona de alcance e área mínima de toque (48px)?
- [ ] **4. Clareza Visual & Performance:** Prejudica a legibilidade dos combates em tela pequena? Mantém 60 FPS estáveis com pooling de objetos?
- [ ] **5. ROI & Pragmatismo:** É a solução mais simples e de maior impacto possível? Evita dependências externas e infraestrutura desnecessária nesta fase?
```

---

## 💡 4. Diretrizes Específicas por Domínio

### 4.1. Game Feel & Combate Visceral
* **Hit-Stop & Screen Shake Calibrados:** Cada golpe bem-sucedido deve ter micropausa (16-32ms) e leve tremor de câmera para transmitir peso, sem causar desorientação visual no mobile.
* **Áudio com Punch:** Sons de magia e impacto cortantes sintetizados ou carregados via áudio limpo, audíveis mesmo em alto-falantes de smartphone com volume moderado.
* **Feedback de Dano Telegrafado:** Inimigos sempre telegrafam ataques pesados com contornos ou círculos de aviso claros (*Windup -> Strike -> Recovery*).

### 4.2. UI & Overlays (React DOM)
* **Sem Menus Aninhados:** Evite "menus dentro de menus". O jogador deve conseguir equipar, aprimorar ou voltar ao jogo com no máximo 2 toques.
* **Layout Slicing (9-Slice) Gótico:** Botões e painéis estilizados com texturas retrô compactas que se ajustam organicamente à densidade de pixels de qualquer smartphone.
* **Feedback Háptico Suave:** Usar vibração sutil (`navigator.vibrate`) em momentos de impacto crítico, baixa vida ou morte de chefes para aumentar a imersão sensorial.

### 4.3. Salvamento & Persistência Local
* **Tolerância Zero a Perda de Dados:** Todas as escritas em `localStorage` devem ser validadas com Schemas Zod e tratamento de fallback gracioso.
* **Salvar no Fim de Cada Sala/Andar:** Não esperar o fim da partida para persistir cristais coletados ou conquistas alcançadas.

---

## 🚀 5. Exemplos Práticos: O que Fazer vs O que Rejeitar

| Proposta / Ideia | Análise pelo Filtro de Sucesso | Decisão |
|---|---|---|
| **Sistema de chat multiplayer global em tempo real no Canvas** | Baixo impacto em D1/D7 para RPG single-player, adiciona sobrecarga de servidor, polui tela pequena com teclado virtual. | ❌ **REJEITAR (Viola Pilares 1, 2, 4 e 5)** |
| **Paredes de texto de 5 minutos antes da primeira masmorra** | Destrói Time to Fun, aumenta taxa de abandono (churn) no primeiro minuto. | ❌ **REJEITAR (Viola Pilar 1)** |
| **Novas magias com efeitos em área imediatos e sinergias visuais** | Aumenta satisfação no combate, melhora Game Feel, fortalece D1 e D7 com experimentação de builds. | ✅ **APROVAR (Alinhado aos Pilares 1, 2 e 3)** |
| **Botão de Esquiva (Dash) com recarga visual no polegar direito** | Ergonomia perfeita, adiciona profundidade tática com controle simples e intuitivo. | ✅ **APROVAR (Alinhado aos Pilares 2 e 4)** |
| **Inventário com 50 slots de peso, durabilidade e micro-organização** | Aumenta fricção e carga cognitiva, inadequado para sessões rápidas de mobile. | ❌ **REJEITAR (Viola Pilares 2 e 4)** |
| **Santuário com seleção de 3 bênçãos rápidas ao subir de nível** | Decisão instantânea, alta dopamina, zero fricção de leitura, incentiva D7. | ✅ **APROVAR (Alinhado aos Pilares 1, 2 e 3)** |
