---
agent_context: technical_specification_graphics_ui_terrain_evolution
target_module: docs/specs/16_GRAPHICAL_UI_TERRAIN_EVOLUTION.md
priority: high
status: implemented
last_updated: "2026-08-30"
tags:
  - ui_scaling
  - isometric_camera
  - procedural_terrain
  - heightmap
  - dungeon_siege
  - engine_feasibility
  - phaser3
  - threejs
---

# 📜 Spec 16: Evolução Gráfica, Resolução Adaptativa UI & Terreno Procedural 2.5D/3D

> **Status:** Implementado & Ativo (Fases 1 e 2 Concluídas via PRs #54, #57 e #58)  
> **Data:** 30 de Agosto de 2026  
> **Domínio:** Arquitetura Gráfica, Layout Responsivo Mobile, Câmera Isométrica, Terreno Procedural e Viabilidade Tecnológica de Motores.

---

## 🎯 1. Visão Geral e Motivação

O objetivo desta especificação é formalizar a evolução arquitetural e estética do *Bloodmage 1995*, superando as limitações de geração procedural plana em 2D para alcançar uma experiência visual imersiva, anatômica e escalável no ecossistema mobile e desktop.

Inspirado em títulos de referência como **Diablo Immortal**, **Mobile Legends: Bang Bang** e **Dungeon Siege (2001)**, este documento estabelece:
1. Um **sistema responsivo de UI e Safe Area** baseado em resolução virtual de 1920x1080 (16:9) com âncoras elásticas.
2. Uma **hierarquia visual rígida de proporção de entidades e câmera isométrica** com Zoom Dinâmico e assistência de mira.
3. Um **pipeline de geração procedural de terreno 2.5D com elevação ($Z$)** (Heightmap, Poisson Disk Sampling, Pathfinding tridimensional).
4. Uma **análise crítica de maturidade tecnológica e viabilidade de transição** entre Phaser 3 puro, Phaser 3 `Mesh`, integração WebGL/Three.js e migração para motores 3D nativos (Unity / Godot / Babylon.js).

---

## 📱 2. Capítulo 1: Arquitetura de Resolução & UI Mobile Adaptativa

### 2.1. Resolução Base Virtual & Densidade de Pixels (DPI/PPI)
Para evitar distorção visual em telas com proporções heterogêneas (16:9, 19.5:9, 20:9, 4:3), o jogo adota uma **Resolução Lógica Padrão de 1920 x 1080 pixels (Landscape)**.

* **Canvas Lógico:** As coordenadas do mundo e da interface são calculadas sobre a grade $1920 \times 1080$.
* **Multiplicador de Densidade Adaptativo:** O motor lê o `window.devicePixelRatio` e a densidade física do dispositivo (DPI), aplicando escala matricial:
  $$\text{ScaleFactor} = \text{clamp}\left(\frac{\text{ViewportWidth}}{1920}, 0.5, 2.5\right) \times \text{devicePixelRatio}$$
* **Resultado:** Botões e texto mantêm o mesmo tamanho físico na mão do jogador (em milímetros/polegadas), independentemente de a tela ser HD, Full HD ou 4K.

---

### 2.2. Campo de Visão (FOV) & Expansão Horizontal Dinâmica
Para lidar com telas ultrawide (ex: 20:9 dos smartphones modernos) e telas quadradas (ex: iPads 4:3 e dobráveis):

1. **Expansão Horizontal (20:9 / 19.5:9):** O motor gráfico estende o plano de corte lateral da câmera (*Hor+ FOV Scaling*). A imagem não é esticada; o jogador ganha campo de visão lateral estratégico no cenário.
2. **Tratamento de Telas Quadradas (4:3 / iPads):** Para evitar o corte agressivo de visão horizontal que tornaria inimigos invisíveis, aplica-se uma compensação de distância da câmera:
   $$\text{CameraDistance}_{\text{4:3}} = \text{CameraDistance}_{\text{16:9}} \times 1.15$$

---

### 2.3. Área Segura (Safe Area) & Notches (16dp a 24dp)
Para garantir que furos de câmera (*punch-holes*), cantos arredondados ou barras de navegação do SO não obstruam a UI clicável:

* **Margens Dinâmicas de Safe Area:**
  ```css
  padding-top: env(safe-area-inset-top, 16px);
  padding-bottom: env(safe-area-inset-bottom, 16px);
  padding-left: env(safe-area-inset-left, 24px);
  padding-right: env(safe-area-inset-right, 24px);
  ```
* **Âncoras Elásticas de Canto:**
  * **Minimapa / Status do Personagem:** Ancorado estritamente no canto Superior Esquerdo `(SafeLeft + 16, SafeTop + 16)`.
  * **Painel de Ações / Habilidades (Runestons):** Ancorado no canto Inferior Direito `(ViewportWidth - SafeRight - 16, ViewportHeight - SafeBottom - 16)`.
  * **JoyStick Virtual Touchpad:** Ancorado no canto Inferior Esquerdo `(SafeLeft + 24, ViewportHeight - SafeBottom - 24)`.

---

### 2.4. Layout Customizável (Fator Humano)
Seguindo o padrão de *Mobile Legends* e *Diablo Immortal*, o jogador pode ajustar nas Configurações:
* **Escala Global de HUD:** Multiplicador de $80\%$ a $120\%$ dos elementos de UI.
* **Opacidade e Diâmetro de Botões:** Ajuste de transparência ($30\%$ a $100\%$) e diâmetro dos botões de ação ($48\text{px}$ a $72\text{px}$ lógicos).
* **Posição dos Comandos:** Opção de mover livremente a âncora do joystick e dos botões de magia.

---

## 👁️ 3. Capítulo 2: Hierarquia Visual, Escala de Entidades e Câmera Isométrica

### 3.1. Especificação de Câmera Isométrica
A câmera adota uma projeção ortográfica/perspectiva de cinto alto (High-Belt Isometric Projection):

| Parâmetro | Valor de Referência | Justificativa |
| :--- | :--- | :--- |
| **Ângulo de Inclinação ($\theta$)** | $45^\circ \text{ a } 50^\circ$ | Preserva profundidade dos sprites/modelos 3D sem ocultar o chão ou achatar os personagens em visão top-down pura ($90^\circ$). |
| **FOV Vertical** | $35^\circ \text{ a } 40^\circ$ | Elimina distorções olho-de-peixe (*barrel distortion*) nas extremidades da tela mobile. |
| **Altura Virtual de Câmera ($Z_c$)** | $14.0\text{m}$ (equivalente) | Enquadra a área tática de combate ($20\text{m} \times 12\text{m}$ de área jogável simultânea). |

---

### 3.2. Tabela de Proporção e Ocupação Visual de Entidades
Tomando a **altura vertical total da tela física ($Y_{\text{max}}$)** como $100\%$:

| Categoria | Ocupação ($\% Y$) | Escala Relativa ao Herói | Descrição e Função Visual |
| :--- | :--- | :--- | :--- |
| **Props / Pequenos Animais** | $2\% - 4\%$ | $0.2x - 0.4x$ | Ratos, sapos, cinzas, caixas destrutíveis. Meramente decorativos, sem barra de HP. |
| **Monstros Normais (Minions)** | $5\% - 7\%$ | $0.6x - 0.75x$ | Esqueletos, cultistas básicos. Visualmente menores/magros para denotar facilidade de abate em horda. |
| **Heroi Principal (Player)** | $8\% - 10\%$ | $1.0x$ (Base) | Destaque imediato no centro visual. Modelo físico é $15\%$ maior que portas/cenário para legibilidade. |
| **Monstros Elites / Minibosses** | $12\% - 15\%$ | $1.4x - 1.6x$ | Quase o dobro dos minions, com auras luminosas (Elite Affix Halos) e animações marcantes. |
| **Chefes de Calabouço (Bosses)** | $20\% - 35\%$ | $2.5x - 4.0x$ | Ocupam até $1/3$ da tela. Disparam o sistema mecânico de Zoom Dinâmico. |

---

### 3.3. Mecânica de Zoom Dinâmico (Boss Zoom Out)
Ao engajar um Boss ou entrar em uma arena de chefe:
1. **Interpolação Suave:** A câmera realiza um zoom-out gradual de $12\%$ a $15\%$ no decorrer de $1.2$ segundos (usando easing `Cubic.Out`).
2. **Objetivo:** Ampliar o campo de visão para expor o telegrafiamento de ataques em área no chão (*Telegraphed AOE indicators*).
3. **Retorno:** Ao derrotar o chefe, a câmera retorna suavemente à distância padrão de $14.0\text{m}$.

---

### 3.4. Hitboxes Generosas & Assistência de Mira por Proximidade
Em dispositivos touch, a imprecisão anatômica do polegar exige assistência algorítmica:

* **Hitbox Expandida (+30%):** A caixa/círculo de recepção de toques e projéteis para entidades é $30\%$ maior do que o contorno visual da malha/sprite.
* **Algoritmo de Prioridade de Alvo (Target Lock Assistance):**
  Ao acionar o botão de ataque rápido ou magia sem mira manual, o sistema calcula a pontuação de prioridade para cada inimigo no raio de ação:
  $$\text{Score}(E) = w_1 \cdot \frac{1}{\text{Distancia}(P, E)} + w_2 \cdot (1 - \frac{\text{HP}_{E}}{\text{HP}_{\text{max}}}) + w_3 \cdot \text{ThreatTier}(E)$$
  Onde $\text{ThreatTier}$ atribui peso $3.0$ para Heróis Inimigos/Bosses, $2.0$ para Elites e $1.0$ para Minions.

---

## ⛰️ 4. Capítulo 3: Geração Procedural de Terreno & Mundo estilo Dungeon Siege

Para recriar o visual clássico de *Dungeon Siege (2001)* — com montanhas, vales, colinas elevadas, rampas navegáveis e pontes onde personagens sobem e descem em 2.5D/3D — a arquitetura de geração divide-se em 5 etapas:

```
[ Matriz de Elevação Heightmap (Simplex/Perlin Noise) ]
                         │
                         ▼
[ Classificação de Camadas de Altura Z (0 a 4) ]
                         │
                         ▼
[ Matemática de Projeção Isométrica & HeightStep ]
                         │
                         ▼
[ Amostragem Poisson Disk (Vegetação) & Stamping de Estruturas ]
                         │
                         ▼
[ Graph Pathfinding 3D (Rampas & Conectividade Delta Z <= 1) ]
```

---

### 4.1. Estrutura de Dados: Heightmap Procedural
A base do mapa é uma matriz de elevação gerada via Simplex Noise combinando duas frequências (Octaves):
$$\text{Height}(x, y) = \text{clamp}\Big( \lfloor \left( N_{\text{macro}}(x, y) \times 0.7 + N_{\text{micro}}(x, y) \times 0.3 \right) \times 4 \rfloor, 0, 4 \Big)$$

* **Nível 0 (Vale / Rio):** Relevo baixo, com água ou pântano.
* **Nível 1 (Planície):** Chão padrão de navegação e combate.
* **Nível 2 & 3 (Colinas e Plateau):** Relevo elevado com rampas.
* **Nível 4 (Montanhas):** Picos elevados intransitáveis (bloqueio de visão e física).

---

### 4.2. Projeção Isométrica com Elevação ($Z$)
Para renderizar coordenadas tridimensionais do grid $(\text{gridX}, \text{gridY}, \text{altura})$ em coordenadas 2D da tela $(\text{screenX}, \text{screenY})$:

```typescript
export interface ScreenCoords {
  x: number;
  y: number;
}

export function isoToScreen(
  gridX: number,
  gridY: number,
  altura: number,
  tileWidth = 64,
  tileHeight = 32,
  heightStep = 16
): ScreenCoords {
  // Projeção isométrica padrão com deslocamento vertical proporcional à altura Z
  const screenX = (gridX - gridY) * (tileWidth / 2);
  const screenY = (gridX + gridY) * (tileHeight / 2) - (altura * heightStep);

  return { x: screenX, y: screenY };
}
```

#### Regra Dinâmica de Profundidade (`setDepth`)
Para impedir erros de sobreposição (ex: uma colina na frente ser desenhada atrás de um personagem):
$$\text{Depth} = (\text{gridX} + \text{gridY}) \times 10 + (\text{altura} \times 2) + \text{LayerOffset}$$

---

### 4.3. Posicionamento de Vegetação & Construções

1. **Vegetação (Poisson Disk Sampling):**
   * Emprega-se o algoritmo de *Poisson Disk Sampling* para distribuir árvores, rochas e arbustos respeitando um raio mínimo $R_{\text{min}} = 3.5 \text{ tiles}$ de separação.
   * **Filtro de Relevo:** Árvores são proibidas de nascer no Nível 0 (água) ou em superfícies com inclinação íngreme ($\Delta h > 1$).
2. **Construções (Ruínas / Casas):**
   * O gerador busca sub-matrizes planas contínuas de tamanho $4 \times 4$ ou $6 \times 6$ no Nível 1 ou 2.
   * Aplica-se o carimbo (*stamping*) de modelos pré-definidos (conjunto de tiles de parede, pilares e telhado com colisores Arcade configurados).

---

### 4.4. Navegação e Pathfinding Tridimensional (A* com Custo de Elevação)
A IA de busca de caminho (Pathfinding) opera sobre a malha de relevo com regras de conectividade espacial:

* **Conexão Válida:** O movimento entre a tile $(x_1, y_1)$ e $(x_2, y_2)$ é permitido se e somente se:
  $$|\text{Height}(x_1, y_1) - \text{Height}(x_2, y_2)| \le 1$$
* **Rampas de Transição:** Quando $|\Delta h| = 1$, a tile adjacente deve conter uma variante gráfica de "Rampa" para manter a continuidade do sprite.
* **Paredes / Falésias:** Se $|\Delta h| \ge 2$, o nó é marcado como **Impassable** (obstáculo intransitável).

---

## 🛠️ 5. Capítulo 4: Avaliação Tecnológica & Viabilidade de Transição de Motor Gráfico

Esta é a análise de viabilidade técnica (Pros, Contras, Complexidade e Maturidade) sobre as alternativas para sustentar os requisitos gráficos e de relevo procedural do projeto.

---

### 5.1. Matriz Comparativa de Opções Arquiteturais

| Arquitetura | Prós | Contras | Complexidade de Transição | Performance / Budget Mobile | Maturidade da Solução |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Opção A: Phaser 3 Puro 2D (Isometric Tilemap)** | • Sem necessidade de refatorar a base atual.<br>• Leve e com carregamento instantâneo em PWA.<br>• Compatibilidade $100\%$ com a stack atual. | • Exige milhares de variações de sprites para rampas/curvas.<br>• Sem iluminação 3D real por vértice.<br>• Relevo com aspecto "escada/blocudo". | **Muito Baixa** (0 - 1 semana) | **Excelente** (60 FPS em qualquer device) | **Alta** (Sustentada pelo motor atual) |
| **Opção B: Phaser 3 + `Phaser.GameObjects.Mesh`** | • Mantém a infraestrutura do Phaser 3.<br>• Permite deformação de vértices $Z$ em tempo real.<br>• Aplica texturas e iluminação dinamica WebGL sobre a malha. | • API de Mesh do Phaser 3 é limitada para mapas imensos.<br>• Custo elevado de construção manual de UV Mappings.<br>• Escassez de ferramentas de pipeline/editor. | **Média / Alta** (3 - 5 semanas) | **Boa** (Requer culling rigoroso de vértices) | **Média** (Funcionalidade existente, mas pouco usada na comunidade) |
| **Opção C: Arquitetura Híbrida (Phaser 3 UI/Lógica + Three.js 3D Layer)** | • Terreno 3D fluido e real no estilo *Dungeon Siege*.<br>• Sombras dinâmicas, Shaders de terreno e iluminação de ponta.<br>• Mantém a UI React e a lógica de jogo existentes. | • Sincronização de 2 loops de renderização (Phaser/Three).<br>• Duplicação de ponte de estado e transformadas de câmera.<br>• Aumento no consumo de VRAM e bateria mobile. | **Alta** (6 - 8 semanas) | **Média** (Exige limitar sombras e sombras de picos) | **Alta** (Padrão consagrado em jogos Web de alta fidelidade) |
| **Opção D: Migração Total de Motor (Unity WebGL / Godot 4 Web)** | • Motor 3D nativo de primeira linha.<br>• Pipeline completo de Animação, Iluminação e Pathfinding 3D.<br>• Qualidade visual equivalente a *Diablo Immortal*. | • Reescrever $100\%$ do código TypeScript em C# / GDScript.<br>• Bundle inicial elevado (>15MB - 30MB), penalizando PWA.<br>• Perda total da stack React/Zustand atual. | **Extremamente Alta** (3 - 6 meses) | **Variável** (Ótima em nativo, pesada em WebGL) | **Máxima** (Motores líderes da indústria) |

---

### 5.2. Diagnóstico e Recomendação de Arquitetura

1. **Curto / Médio Prazo (Recomendação Principal): Arquitetura Híbrida Gradual (Opção B & C)**
   * **Fase 1:** Implementar a **UI Adaptativa (1920x1080), Safe Area, Escala de Entidades e Zoom Dinâmico** diretamente na stack Phaser 3 + React atual. Esta fase entrega $80\%$ do ganho de legibilidade e Game Feel sem quebrar nenhum sistema.
   * **Fase 2:** Introduzir a elevação 2.5D através do `isoToScreen` e `heightStep` usando Phaser 3 Tilemaps elevados e ordenação de profundidade (`setDepth`).
   * **Fase 3 (Se necessário maior fidelidade visual):** Adotar o objeto `Phaser.GameObjects.Mesh` para áreas de relevo contínuo (montanhas fluidas) ou acoplar uma camada leve do **Three.js** dedicada estritamente à renderização do terreno 3D enquanto o Phaser gerencia entidades 2D/UI.

2. **Longo Prazo (Se o escopo migrar para lançamento nativo em lojas):**
   * Se o objetivo estratégico se consolidar como um lançamento nativo mobile distribuído na Google Play e App Store com gráficos 3D modernos comparáveis a *Diablo Immortal*, a migração para **Unity** ou **Godot 4** torna-se a decisão correta.

---

## 🗺️ 6. Capítulo 5: Roadmap de Implementação por Fases

- [x] **FASE 1: UI Responsiva & Câmera (PR #54)**
  - [x] 1.1 Configurar Base Lógica 1920x1080 com multiplicador de densidade (DPI) e câmera escalonada.
  - [x] 1.2 Ajustar escala visual das entidades (Player 9%, Elites 14%, Bosses 25%).
  - [x] 1.3 Adicionar Boss Zoom Out (15% suave com interpolação `Cubic.Out`) ao engajar chefes.
- [x] **FASE 2: Sistema de Terreno 2.5D com Elevação Z (PRs #54, #57 e #58)**
  - [x] 2.1 Implementar gerador de Heightmap Simplex Noise com octaves (`HeightmapGenerator.ts`).
  - [x] 2.2 Integrar função de projeção `isoToScreen` com elevação e `heightStep` em `DungeonGenerator.ts`.
  - [x] 2.3 Implementar regras de transitabilidade e colisão de falésias ($\Delta Z \le 1$ transitável, $\Delta Z \ge 2$ bloqueio).
  - [x] 2.4 Renderizar paredes de falésia (Cliff Faces) com sombreamento de desnível, biome tints, profundidade isométrica e iluminação 2D (`spr_wall`).
- [ ] **FASE 3: Personalização Ergonômica Mobile & Safe Area Insets**
  - [ ] 3.1 Suporte a safe-area-insets nos containers do React HUD (`GameplayHUD.tsx`).
  - [ ] 3.2 Opções de escala do joystick (`small`, `medium`, `large`), Modo Canhoto (*Left-Handed*) e joystick flutuante.

---

## 📑 7. Conclusão e Próximos Passos

Esta especificação fornece o arcabouço técnico rigoroso para transformar a apresentação visual do *Bloodmage 1995*. Com as métricas anatômicas de UI e Câmera bem estabelecidas, o projeto garante legibilidade mobile de nível AAA, enquanto o pipeline de terreno 2.5D/3D pavimenta o caminho para ambientes expansivos inspirados nos maiores clássicos do gênero.
