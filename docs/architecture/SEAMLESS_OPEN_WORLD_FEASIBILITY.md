---
agent_context: senior_software_architect
target_module: architecture
priority: high
status: active
last_updated: 2026-08-11
tags: [architecture, open-world, seamless, phaser3, react, performance, memory-culling, chunks, biomes, fixed-camera, transition-corridors]
---

# 🏛️ Relatório de Viabilidade Técnica: Mundo Contínuo Sem Costuras (Seamless Open World)

**Autor:** Arquiteto de Software Sênior (Sistemas de Jogos Web Phaser 3 + React)
**Projeto:** Bloodmage 1995
**Data:** 11 de Agosto de 2026
**Status:** Proposta de Arquitetura Aprovada / Análise de Viabilidade Técnica (Atualizado)

---

## 📋 Visão Geral Executiva

Este documento apresenta uma análise profunda de viabilidade técnica e arquitetural para a transição do sistema atual do **Bloodmage 1995** (baseado em andadores/instâncias isoladas por portais de carregamento) para um modelo de **Mundo Contínuo Sem Costuras (*Seamless Open World*)**, inspirado na transição fluida da campanha linear de *Dungeon Siege 1* e na atmosfera gótica/visceral dos clássicos dos anos 90 (*Diablo II*, *Blood*, *Doom*, *Dead Frontier 2*, *Diablo Immortal*).

O estudo considera como restrição crítica o suporte a **dispositivos móveis (PWA Mobile em navegadores Android/iOS intermediários)** com **perspectiva de câmera fixa e travada**, onde a meta de **60 FPS estáveis** deve coexistir com um orçamento de VRAM extremamente restrito (**< 128 MB de VRAM total**) e gerenciamento rigoroso de memória Heap de JavaScript para evitar falhas por *Out Of Memory* (OOM).

---

## 1. Otimizações de Câmera Fixa e Renderização Estática

A decisão de manter a **câmera fixa/travada em perspectiva isométrica/top-down (sem rotação pelo jogador)** simplifica drasticamente a matemática de geração dos tiles e a otimização de oclusão (*frustum culling*). Como o ângulo de visão é constante, a engine precisa detalhar e renderizar unicamente o que está visível a partir dessa orientação estática.

```
                  [ NORT (Parede Fundo: Alta Densidade & Detalhes) ]
                                    ▲
                                    │  Campo de Visão
 [ OESTE ] ◄────────────────── [ PLAYER ] ──────────────────► [ LESTE ]
                                    │  (Câmera Fixa)
                                    ▼
                  [ SUL (Paredes Baixas / Invisíveis / Cutaway) ]
```

### 1.1 Regras de Tilesets para Câmera Travada
1. **Paredes "Invisíveis" e Recorte ao Sul (Cutaway Walls):** Como a câmera está apontada do Sul para o Norte/Nordeste, paredes localizadas na borda inferior da tela (Sul) são geradas muito baixas, cortadas ou completamente transparentes. Isso elimina pontos cegos e impede que a geometria bloqueie a visão do jogador ou de inimigos atacando do Sul.
2. **Oclusão de Teto Automatizada:** Em biomas fechados (*Sanatório Profanado*, *Catacumbas*, *Esgotos*), o algoritmo de tiles omite totalmente as estruturas de teto, focando a renderização apenas nas camadas de chão (*Ground Layer*) e paredes de fundo (*North/East/West Wall Layers*).
3. **Densidade Visual Concentrada ao Norte:** A riqueza arquitetônica gótica (vitrais profanados, tubulações industriais vazando fuligem, altares e gargulas) é concentrada nas paredes da face Norte/Noroeste, onde os objetos permanecem constantemente imponentes na tela.
4. **Iluminação Assada (Baked Lightmaps) & Light2D:** A imobilidade do ângulo da câmera permite utilizar iluminação pré-renderizada (*baked*) nas texturas dos tilesets combinada com os efeitos de luz dinâmica do pipeline `Light2D` do Phaser, economizando até **40% de processamento de GPU** no mobile.
5. **Profundidade Falsa (Parallax Fixo):** Em áreas como o *Complexo Tecnológico-Infernal* ou a *Cidade Industrial*, fendas no chão e pontes revelam uma camada inferior com lava pulsante ou engrenagens rodando. Como a câmera é fixa, esse efeito de profundidade é simulado via camadas de fundo leve sem custo de cálculo de câmera 3D.

---

## 2. Gerenciamento de Memória, Culling e Streaming por Chunks

### 2.1 Inviabilidade de Arquivo JSON Único do Tiled para Escala de 1,3 Million Tiles

Na estimativa técnica realizada, cobrir a jornada no estilo *Dungeon Siege 1* com 2.250 telas/salas em 6 biomas exige o processamento de aproximadamente **1.296.000 tiles**.

* **Por que um JSON único do Tiled FALHA no navegador mobile:**
  1. **Parse de JSON Bloqueante:** Um arquivo JSON contendo ~1,3 milhão de IDs de tiles (matriz `width: 36000, height: 36000`) teria um tamanho em disco superior a **150 MB - 300 MB**. O parse síncrono de string no JavaScript bloqueia a thread principal (*Main Thread*) por vários segundos ou causa estouro da memória RAM do celular.
  2. **Consumo Abusivo de RAM/VRAM:** O Phaser 3 precisaria instanciar estruturas internas para milhões de células de mapa. Mesmo com culling, a estrutura de dados na Heap excederia **500 MB**, provocando o desligamento da aba no navegador móvel pelo sistema operacional (iOS Safari / Android Chrome WebKit OOM Killer).

### 2.2 Arquitetura de Carregamento Dinâmico por Chunks (Chunk Manager)

A única solução viável e de alta performance é o **Streaming Dinâmico por Chunks Procedurais / Modulares**:

```
[ Chunk Buffer (-1,-1) ] [ Chunk Buffer (0,-1) ] [ Chunk Buffer (1,-1) ]
[ Chunk Buffer (-1,0)  ] [   CHUNK ATIVO (0,0) ] [ Chunk Buffer (1,0)  ]  <-- Câmera/Player
[ Chunk Buffer (-1,1)  ] [ Chunk Buffer (0,1)  ] [ Chunk Buffer (1,1)  ]
```

#### Especificações Técnicas do Chunk Manager:
1. **Tamanho do Chunk Ativo:** Matriz de **16x16** ou **32x32 tiles**. Para tiles de **32x32px** (ou 64x32px em isometricidade), um chunk de 32x32 tiles equivale a uma área de **1024x1024 pixels**.
2. **Janela Ativa de Carregamento (Grid Ring 3x3):** Apenas 9 chunks (o chunk onde o jogador se encontra + 8 chunks adjacentes) permanecem instanciados na cena do Phaser.
3. **Anel de Desalocação (Unload Ring Buffer):** Conforme o jogador se desloca, chunks que ficam a mais de 2 unidades de distância são destruídos (`tilemapLayer.destroy()`) e seus corpos físicos removidos do motor de física.
4. **Geração por Sementes (*Procedural Seeds*):** O mapa não é salvo como um JSON gigante, mas reconstruído deterministicamente a partir de uma `Seed` numérica com tabelas de peças modulares por bioma.

### 2.3 Culling Ativo e Otimizações de GPU / Renderização

Para manter a renderização controlada a 60 FPS:
* **Frustum Culling de Tilemap:** O Phaser 3 possui culling nativo habilitado por padrão em camadas de Tilemap (`layer.skipCull = false`). Devemos configurar `layer.setCullPadding(2, 2)` para evitar pop-in nas bordas da tela.
* **Pruning Espacial AABB para Entidades e Luzes:** Conforme diretrizes do projeto (`AGENTS.md`), verificações de linha de visão (LoS), detecção de som e luzes dinâmicas aplicam primeiro uma poda espacial AABB por distância quadrática (`dx * dx + dy * dy < thresholdSq`) antes de submeter objetos à GPU ou a testes de intersecção geométrica complexos.
* **Pool de Corpos Persistentes e Sangue:** Marcas de sangue (`blood_pool_stain`) e corpos ficam no chão limitados a um número máximo configurável (ex: no máximo 50 decalques ativos na janela visível). Decalques distantes no anel de desalocação são reciclados via *Object Pooling*.

---

## 3. Engenharia da Transição sem Carregamento: Corredores Gargalo (*Seamless Chokepoints*)

Para realizar a fusão contínua entre biomas diferentes sem travar o navegador móvel (*zero stuttering*), a melhor prática técnica consiste na criação de **Corredores Gargalo de Transição**.

```
[ BIOMA A ]  ───►  [ GARGALO DE TRANSIÇÃO ]  ───►  [ BIOMA B ]
                       │             │
                       ▼             ▼
                 (Gatilho 1)   (Gatilho 2)
                 Async Load     Unload A &
                 & Banner UI    Object Pool
```

### 3.1 Estrutura do Corredor Gargalo
* **Limitação de Campo de Visão:** O corredor entre biomas é desenhado de forma estreita e linear (ex: uma descida de escadas em caracol, uma ponte sob névoa densa ou um túnel industrial com tubulações). Como a área visível reduz, a GPU processa pouquíssimos tiles e entidades simultâneas.
* **Fusão Gradual de Tilesets (*Tile Blending*):** No piso do corredor, as texturas do Bioma A dão lugar progressivamente aos elementos do Bioma B (ex: a terra morta do Vilarejo transiciona gradualmente para o mármore rachado do Sanatório ao longo de 10-15 tiles).

### 3.2 Lógica de Gatilhos Assíncronos (Triggers 1 & 2)
1. **Gatilho 1 (Entrada do Corredor):**
   * Dispara o carregamento assíncrono (*Async Chunk Stream*) dos primeiros chunks do Bioma B em segundo plano.
   * Aciona o evento no Zustand (`gameStore.ts`) para exibir o banner comemorativo de transição de ato na UI do React (ex: *"Ato II: O Sanatório Profanado"*), acompanhado por um efeito sutil de névoa ou sangue escorrendo no topo da tela.
2. **Gatilho 2 (Metade/Saída do Corredor):**
   * Assim que o Bioma A sai do campo de visão da câmera, o `ChunkManager` recicla os objetos e destrói as camadas de tiles do Bioma A.
   * **Zone Lock / AI Leashing:** Inimigos do Bioma A possuem um raio máximo de perseguição (*leash distance*) que os impede de seguir o jogador para dentro do corredor gargalo, evitando acúmulo de IA de biomas distintos e servindo como uma "zona neutra" segura temporária.

---

## 4. Arquitetura de Estado e Desacoplamento da UI (Phaser ↔ React)

### 4.1 Análise de Escalabilidade: EventBus (EventEmitter) vs. Zustand (`gameStore.ts`)

O padrão de comunicação via `Phaser.Events.EventEmitter` (como sugerido no código de exemplo) possui riscos de escalabilidade e vazamento de memória quando utilizado diretamente para re-renderizar componentes React a 60 FPS.

#### Riscos do EventBus Puro:
* **Re-renders em Cascata no React:** Disparar eventos de atualização de vida, mana ou coordenadas a cada frame (60Hz) força a árvore de componentes React a se reconciliar constantemente, gerando quedas de frame (*jank*).
* **Vazamento de Memória (*Memory Leaks*):** Se componentes React registrarem listeners em `GameEvents.on()` e o componente desmontar sem executar `GameEvents.off()` no cleanup do `useEffect`, a referência do listener impede o Garbage Collector de liberar a memória.

### 4.2 Estratégia Recomendada: Ponte de Eventos com Throttling e Zustand (`gameStore.ts`)

A arquitetura do **Bloodmage 1995** já possui a solução ideal implementada e centralizada em `src/store/gameStore.ts` (Zustand). A ponte Phaser-React deve obedecer às seguintes regras:

```
[ Phaser Game Loop (60 FPS) ]
         │
         ├── Mudança Discreta de Estado (Dano, Troca de Bioma, Level Up)
         │
         ▼
[ Event Bridge / Throttle Buffer ] ──(Atualiza apenas se houver variação real)──► [ Zustand Store (gameStore.ts) ]
                                                                                            │
                                                                                    Seletor Atômico
                                                                                            │
                                                                                            ▼
                                                                                   [ React HUD (GameHUD) ]
```

1. **Atualizações Atômicas via Seletores:** Componentes React assinam apenas fatias atômicas do estado do Zustand (ex: `const currentBiome = useGameStore(s => s.currentBiome)`). O componente React **só re-renderiza** quando o valor de `currentBiome` realmente se altera.
2. **Throttling para Atributos Contínuos (Vida/Mana):** Atributos de alta frequência de alteração são transmitidos com limite de taxa (*throttle*) de 100ms a 200ms, ou atualizados via manipulação direta de Refs/Canvas no React para barras de progresso sem acionar ciclos de renderização do React.
3. **Isolamento de Eventos de Ponteiro:** Eventos de clique/toque em modais e HUD do React devem executar obrigatoriamente `e.stopPropagation()` e `e.nativeEvent.stopImmediatePropagation()` para evitar que o clique atravesse a interface e acione comandos de ataque/movimento no Canvas do Phaser.

---

## 5. Transição Dinâmica de Biomas & Ambientação Gótica (Anos 90)

### 5.1 Transição de Iluminação Adaptativa (*Pupil Light Adaptation* & Light2D)

Ao cruzar a fronteira entre biomas (ex: do Vilarejo para as Catacumbas), o sistema não executa uma tela de carregamento, mas sim uma transição visual contínua de adaptação de pupila utilizando o pipeline **Light2D** do Phaser e a overlay de iluminação do projeto:

```typescript
// Exemplo de Transição Suave de Iluminação entre Biomas
public transitionLighting(targetBiome: BiomeType, durationMs: number = 1000): void {
  const config = BIOME_LIGHTING_CONFIG[targetBiome];

  // Interpolação suave do tom da Luz Ambiente (Light2D Pipeline)
  this.scene.tweens.addCounter({
    from: 0,
    to: 1,
    duration: durationMs,
    onUpdate: (tween) => {
      const v = tween.getValue();
      const r = Phaser.Math.Interpolation.Linear([this.currentAmbient.r, config.ambient.r], v);
      const g = Phaser.Math.Interpolation.Linear([this.currentAmbient.g, config.ambient.g], v);
      const b = Phaser.Math.Interpolation.Linear([this.currentAmbient.b, config.ambient.b], v);

      this.scene.lights.setAmbientColor(Phaser.Display.Color.GetColor(r, g, b));
    }
  });

  // Adaptação de Pupila (Ajuste do Raio do DarknessOverlay e Flash Suave)
  this.scene.cameras.main.flash(300, config.flashColor.r, config.flashColor.g, config.flashColor.b, false);
  this.updateDarknessRadius(config.targetRadius, durationMs);
}
```

### 5.2 Suíte de Áudio Reativo e Soundscapes por Bioma

A troca de bioma aciona o `soundEngine.ts` para transição da paisagem sonora:
* **Filtros de Reverb Convolucional / Low-Pass:** Em biomas fechados (Catacumbas/Esgotos), o áudio recebe atenuação de alta frequência e eco. Em biomas abertos (Vilarejo/Deserto de Cinzas), o reverb é reduzido e camadas de vento/sussurros são misturadas.
* **Crossfade de BGM:** A música de fundo sofre um crossfade suave de 2,5 segundos entre a faixa do bioma anterior e do novo bioma.

### 5.3 Tabelas de Spawn e Progressão dos 6 Biomas Góticos

Conforme as definições acordadas para a lore e estética gótica noventista (*Blood, Doom, Diablo II, Dead Frontier 2*), a tabela abaixo resume a progressão dos biomas e seus parâmetros de iluminação e spawn:

| Bioma | Inspiração Visceral | Estética Visual de Tiles | Iluminação & Visão | Inimigos & Perigos |
| :--- | :--- | :--- | :--- | :--- |
| **1. O Vilarejo Flagelado e Periferia Decrépita** | Diablo II (Act 1), Blood, Dead Frontier 2 | Cabanas podres, lama, poças de sangue coagulado, vegetação morta | Névoa cinza-azulada, iluminação de campo aberto (Raio: 320px) | Cultistas de capa, zumbis lacerados, cães sarnentos |
| **2. O Sanatório / Mosteiro Profanado** | Diablo II (Cathedral), Blood (Asilos), Doom | Pedras frias, vitrais quebrados projetando luz vermelha, celas de tortura | Luz ambiente avermelhada/sombria, tochas pontuais (Raio: 220px) | Fanáticos portando correntes, gárgulas de pedra, torturadores |
| **3. As Catacumbas e Esgotos de Sangue** | Diablo II (Catacombs), Doom | Tijolos úmidos com limo, paredes de crânios, canais de sangue/resíduos | Visão reduzida claustrofóbica, filtro de névoa esverdeada (Raio: 140px) | Abominações de ossos, vermes gigantes, mortos-vivos tóxicos |
| **4. Cidade Industrial Abandonada (Necrotérios)** | Dead Frontier 2, Blood (Victorian Industrial) | Paralelepípedos, fumaça negra de bueiros, estruturas de ferro oxidado | Luzes a gás piscando (flicker), tom sépia/fuligem (Raio: 200px) | Autômatos profanos, corpos reanimados por vapor/sangue, carrascos |
| **5. Complexo Tecnológico-Infernal (Cyber-Gótico)** | Doom (Phobos/Deimos), Blood | Placas de metal escuro mescladas com carne pulsante e runas satânicas | Pulsos neon de sangue e fogo, contraste alto (Raio: 250px) | Demonios cibernéticos, amálgamas de carne e metal, impuros |
| **6. O Abismo / Deserto de Cinzas** | Diablo II (Act 4), Doom (Hell) | Rocha vulcânica preta, solo de cinza cinzento, fendas de lava | Visão ampla opressiva, tom alaranjado/incandescente (Raio: 300px) | Senhores do Abismo, espectros de cinza, cavaleiros infernais |

---

## 6. Análise Crítica do Código de Exemplo Fornecido

Abaixo está a avaliação técnica detalhada da estrutura apresentada no prompt, identificando gargalos reais de execução e propondo correções arquiteturais alinhadas às diretrizes do projeto:

### ❌ Gargalo 1: Risco Severo de Memory Leak no `EventBus` e React
* **Código de Exemplo:**
  ```javascript
  useEffect(() => {
      const onBiomeChange = (data) => { setZoneName(data.displayName); };
      GameEvents.on('BIOME_CHANGED', onBiomeChange);
      return () => { GameEvents.off('BIOME_CHANGED', onBiomeChange); };
  }, []);
  ```
* **Análise:** Embora o `useEffect` limpe o listener no desmonte, o uso do `Phaser.Events.EventEmitter` fora da árvore do Zustand força o estado local do React a gerenciar o valor. Se houver múltiplos componentes escutando o mesmo evento sem seleção atômica, ocorrem re-renders sincronizados desnecessários.
* **Correção Arquitetural:** Substituir o `EventBus` direto pelo **Zustand (`gameStore.ts`)**. O Phaser invoca `useGameStore.getState().setBiome(newBiome)` e o React consome com `useGameStore(s => s.currentBiome)`.

### ❌ Gargalo 2: Carregamento Estático do Tilemap (`world_map.json`)
* **Código de Exemplo:**
  ```javascript
  this.map = this.make.tilemap({ key: 'world_map' });
  ```
* **Análise:** Como demonstrado na Seção 2.1, carregar `world_map.json` diretamente assume que o mapa completo cabe em um único arquivo do Tiled. Para 1,3 milhão de tiles, este comando falha com erro de memória no browser mobile.
* **Correção Arquitetural:** Implementar o `ChunkManager.ts`, que invoca `this.make.tilemap()` e `createLayer()` **apenas para os chunks de 32x32 tiles que entram na janela de visualização do jogador**.

### ❌ Gargalo 3: Criação Excessiva de Zonas Físicas Fixas (`this.add.zone`)
* **Código de Exemplo:**
  ```javascript
  this.caveZone = this.add.zone(2000, 1500, 200, 200);
  this.physics.add.existing(this.caveZone, true);
  ```
* **Análise:** Se o jogo possuir milhares de transições de bioma no mundo contínuo, instanciar e manter milhares de objetos `Phaser.GameObjects.Zone` estáticos na árvore do Arcade Physics degrada o desempenho do loop de colisão `physics.world.update()`.
* **Correção Arquitetural:** As fronteiras de biomas devem ser calculadas matematicamente via coordenada de grid ou limítrofes dos Chunks em `ChunkManager` (ex: `if (playerChunkX > 50) triggerBiome('cave')`), eliminando a necessidade de zonas físicas estáticas pesadas no Arcade Physics.

### ❌ Gargalo 4: Incompatibilidade de UI e Falta de Interceptação de Pointer Events
* **Código de Exemplo:**
  ```jsx
  <div style={{ position: 'absolute', bottom: '20px', left: '20px', pointerEvents: 'auto' }}>
      <button onClick={() => alert('Inventário')}>Inventário</button>
  </div>
  ```
* **Análise:** Clicar no botão aciona o `onClick`, mas não impede que o evento de toque atravesse até o Canvas do Phaser se não houver interrupção explícita. Além disso, a estilização em linha viola o padrão de **9-Slice CSS / Tailwind** exigido para a UI do projeto (`AGENTS.md`).
* **Correção Arquitetural:**
  ```jsx
  <button
    className="btn-gothic-9slice"
    onClick={(e) => {
      e.stopPropagation();
      e.nativeEvent.stopImmediatePropagation();
      openInventory();
    }}
  >
    Inventário
  </button>
  ```

---

## 7. Orçamento de Performance & Matriz de Impacto Mobile

Para garantir que a transição de biomas e a geração contínua não comprometam a performance em navegadores móveis, a tabela a seguir estabelece o **Orçamento de Performance Máximo (Teto Técnico)**:

| Métrica de Performance | Teto Máximo Tolerado | Estratégia de Mitigação / Monitoramento |
| :--- | :--- | :--- |
| **Uso de VRAM (Texturas na GPU)** | **< 128 MB** | Texturas compactadas em spritesheets de no máx. 2048x2048px; destruição de texturas não utilizadas na troca de biomas longínquos. |
| **Heap Memory JS (RAM)** | **< 65 MB** | Manter no máximo 9 Chunks ativos (32x32 tiles); reuso de objetos de geometria estática (`Phaser.Geom.Rectangle` estático para cálculos). |
| **Draw Calls (GPU Calls/Frame)** | **< 35 calls/frame** | Batching de camadas do Tilemap por Tileset único; uso de Render Textures para luzes e sombras. |
| **Taxa de Quadros (FPS)** | **60 FPS constantes** | Poda espacial AABB em verificações de física e IA de monstros; limite de no máximo 40 inimigos ativos simultâneos na viewport. |
| **Garbage Collection Spikes** | **< 4ms por ciclo** | Eliminação total de instanciação de objetos novos (`new Object()`, `new Vector2()`) dentro do loop de `update()`. |

---

## 8. Recomendação Arquitetural e Roadmap de Implementação

Com base na análise efetuada, **a transição para um Mundo Contínuo Sem Costuras é TOTALMENTE VIÁVEL e RECOMENDADA**, desde que siga a arquitetura de **Chunks Dinâmicos**, **Corredores Gargalo de Transição** e aproveite a estrutura já existente no projeto (`gameStore.ts`, `WorldManager.ts`, `soundEngine.ts`, `textureGenerator.ts`).

### Roadmap Recomendado por Fases:

1. **Fase 4.1 — Implementação do ChunkManager & Grid Streaming (Core Engine):**
   * Criar a classe `src/game/systems/ChunkManager.ts` responsável por gerar e descarregar dinamicamente matrizes de 32x32 tiles em torno do jogador.
   * Integrar o algoritmo de semente procedural (*Deterministic Seed Generator*) para conectar os 6 biomas góticos sob perspectiva de câmera fixa.

2. **Fase 4.2 — Corredores Gargalos de Transição Assíncrona & UI:**
   * Implementar o padrão de *Transition Corridors* entre biomas, contendo o Trigger 1 (Stream do próximo bioma + aviso "Ato X" na HUD) e Trigger 2 (Desalocação do bioma anterior).

3. **Fase 4.3 — Integração da Ponte de Estado com Zustand (`gameStore.ts`):**
   * Conectar as trocas de zona e bioma ao `gameStore.ts`.
   * Atualizar os componentes de UI (`GameplayHUD.tsx`, `ContractHUD.tsx`) para assinar os seletores do estado com throttling e interceptação de ponteiros.

4. **Fase 4.4 — Transições Visuais e Sonoras por Bioma:**
   * Conectar a transição de iluminação do Light2D e do `darknessOverlay` com o efeito de adaptação de pupila em `GameScene.ts`.
   * Configurar os perfis de Reverb e Crossfade no `soundEngine.ts` para os 6 biomas.

5. **Fase 4.5 — Validação de Performance e Testes Automatizados Mobile:**
   * Executar suíte de testes unitários (`pnpm test`) e testes E2E com Playwright (`pnpm test:e2e`) simulando condições de restrição de memória móvel.
   * Auditar contagem de FPS, VRAM e Heap Memory para assegurar aprovação no gate de qualidade.

---

**Conclusão:** A abordagem de câmera fixa aliada a corredores de transição gargalo elimina os gargalos de memória do Tiled, protege a performance mobile PWA e entrega uma experiência imersiva, sombria e contínua no mais puro estilo dos clássicos RPGs dos anos 90.
