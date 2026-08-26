# Spec 11: Visual Polish & VFX Fronts (Code-Driven Art)

## Objetivo Geral
Estruturar o polimento visual e os efeitos gráficos (VFX) do *Blood Mage 1995* utilizando técnicas "Code-Driven" (Shaders, Partículas, Iluminação Dinâmica). O foco é elevar a qualidade estética do projeto a um patamar *AAA indie* sem introduzir novos assets físicos complexos, preservando a performance e a infraestrutura híbrida (assets físicos + fallback procedural) já existente.

---

## Mapeamento Geral: As 8 Frentes de Polimento

1. **Construção do Ambiente e Mundo (Dungeon & World Gen):** 
   - Gerador de layouts orgânicos (BSP + Cellular Automata) e texturização via ruído procedural, mesclando corredores naturais com criptas quadradas.
2. **Efeitos de Ambientação e Clima (Atmospherics & Weather):** 
   - Sistema de névoa volumétrica usando *Perlin Noise* em movimento, ciclo de tempo base/tint, e chuvas de partículas (sangue/cinzas).
3. **Efeitos de Mundo e Interação de Solo (World Reactions):** 
   - Decals no solo persistentes (pegadas de sangue, cinzas) e reflexos locais em poças mapeadas dinamicamente.
4. **Construção e Efeitos de Personagens (Atores - Mobs e Jogador):** 
   - *Game feel* aplicado aos corpos: *Squash & Stretch*, dismemberment aprimorado (gore dinâmico particionado) e *Hit Stop/Hit Flash* para feedback de impacto.
5. **Iluminação e Efeitos de Magia (Spell & Lighting VFX):** 
   - Iluminação 2D com emissão dinâmica a partir de magias, orbes e tochas, com adição de Bloom FX no pipeline global para realçar energia.
6. **Áudio e Feedback Sonoro (Audio Engineering):** 
   - Sintetizadores espaciais proceduralmente ajustados (Pitch Shifting aleatório e drones dinâmicos de sub-grave para tensão dependente do ambiente).
7. **Objetos, Loot e Cosméticos (Items & Wearables):** 
   - Palette Swapping procedural. Equipamentos que alteram o `tint` base do personagem e adicionam emissores afixados (ex: manto flamejante gerando faíscas).
8. **NPCs e Interatividade (Quests & World Events):** 
   - Painéis de interação integrados no HUD (React), *barks* de texto flutuantes e pulsação em estruturas interativas como altares de sangue.

---

## 🎯 DEEP DIVE (Specs de Execução Imediata)

Abaixo estão detalhadas as duas frentes prioritárias recomendadas, preparadas para implementação sequencial e segura.

### Prioridade 1: Frente 5 - Iluminação Dinâmica e Efeitos de Magia (Lighting & Spells)

**1. Escopo**
- Ativar o sistema de `Light2D` (Pipeline WebGL) no `LightingSystem.ts` e mapas base.
- Escurecer o nível de iluminação ambiente global do mapa.
- Configurar magias (`blood_bolt`, orbes) e o próprio mago para emitirem luz (`Light` point) com raios, intensidade e atenuação configuráveis.
- Adicionar Bloom PostFX no `PostFXSystem.ts` (ou pipeline principal) acionado apenas nas camadas e objetos que brilham (luzes altas).

**2. Fora do Escopo**
- Criação de normal maps para texturas (os assets atuais são *flat* 2D, a luz vai incidir sobre a cor base (Diffuse), simplificando a implementação e focando no brilho em si).
- Refatoração física dos projéteis; a mecânica permanece idêntica, apenas o `addSpellGlow` ganha funcionalidade real.

**3. Arquitetura e Módulos Impactados**
- `src/game/scenes/GameScene.ts`: Habilitar `this.lights.enable()` e configurar o `this.lights.setAmbientColor()`.
- `src/game/systems/LightingPolish.ts` e `LightingSystem.ts`: Implementar a lógica real que instancia objetos `Phaser.GameObjects.Light` amarrados às coordenadas de projéteis e orbes via `update()`.
- `src/game/systems/PlayerSkillSystem.ts`: Conectar o disparo de magias ao emissor de luz, se não estiver conectado.
- `src/game/systems/PostFXSystem.ts`: Incluir suporte ao pipeline de *Bloom* para realce global (se compatível com a performance mobile).

**4. Contratos**
- A interface `LightSourceConfig` (já existente ou nova) receberá os parâmetros: `radius`, `color`, `intensity`, e `duration` (se não for contínua).

**5. Fluxo**
1. Ao iniciar a GameScene, a luz ambiente é configurada como `#1a1a2e` (azul muito escuro).
2. O `LightingSystem` injeta uma luz suave (`radius: 120`, `color: #ff3333`) centrada no jogador (Cajado/Sangue).
3. Ao usar `blood_bolt`, o projétil cria uma PointLight pulsante.
4. No ciclo `update`, as luzes ativas sincronizam a posição X/Y com os objetos alvo (projétil, mago).

**6. Corner Cases (Riscos & Soluções)**
- *Impacto em Performance Móvel:* Renderizar múltiplas luzes WebGL pode gargalar aparelhos antigos.
  - *Solução:* Limitar dinamicamente o máximo de luzes na tela (`maxLights = 10` ou similar), dependendo do `PerformanceMonitor.ts`.
- *Assets apagados e escuros:* A UI ou textos do HUD (no Phaser) não podem ser afetados pela luz. Ignorar `Pipeline` nos elementos que precisam estar sempre acesos, ou mantê-los no React.

**7. Critérios de Aceite**
- O cenário é escurecido por padrão.
- O mago tem uma aura luminosa (PointLight).
- O ataque `blood_bolt` e os orbes no chão emitem luz visível que clareia o cenário no raio especificado.
- Os testes unitários de `LightingPolish.test.ts` e compilação do `tsc` passam limpos. Nenhuma regressão de colisão.

---

### Prioridade 2: Frente 2 - Atmosfera e Clima (Névoa Volumétrica)

**1. Escopo**
- Adicionar uma camada superior visual de "Névoa" (Fog) que flutua independentemente da câmera.
- Utilizar a geração procedural (Noise/Textura gerada via Canvas ou shader) no `PostFXSystem.ts` e gerenciada pelo `WorldManager.ts` (variável `fogAlpha`).
- Adicionar suporte contínuo e orgânico ao movimento do Fog (vento, translação da textura ao longo do tempo).

**2. Fora do Escopo**
- Partículas de chuva/neve complexas (isso pode ser tratado numa próxima rodada para não estourar complexidade simultânea).
- Alterar o `textureGenerator.ts` para ser um web worker, manteremos a textura gerada uma única vez no boot.

**3. Arquitetura e Módulos Impactados**
- `src/game/systems/WorldManager.ts`: Controle global da opacidade do fog e velocidade do vento.
- `src/game/systems/PostFXSystem.ts` ou um novo `AtmosphereSystem.ts`: Camada onde um `Phaser.GameObjects.TileSprite` ou *Shader* contendo o ruído do fog será renderizado com `blendMode = SCREEN` ou `MULTIPLY` acima das camadas de chão/mobs e abaixo do HUD (se houver HUD no canvas).

**4. Contratos**
- Sem mudanças drásticas. O `WorldManager` terá variáveis públicas legíveis: `fogSpeedX`, `fogSpeedY`, `fogColor`.

**5. Fluxo**
1. No carregamento da fase, o sistema verifica a opacidade do Fog (`fogAlpha > 0`).
2. Cria ou ativa uma textura de Noise sem costura, que sobrepõe a tela (TileSprite).
3. No loop `update`, desloca as coordenadas da textura (`tilePositionX`, `tilePositionY`), simulando movimento de nuvens baixas/fumaça.
4. Aplica alpha tween dependendo do bioma (ex: áreas de salas iluminadas reduzem o alpha).

**6. Corner Cases (Riscos & Soluções)**
- *Visibilidade de Inimigos:* A névoa não deve encobrir inimigos importantes a ponto de afetar a jogabilidade (*gameplay > visual*). O Alpha máximo não deve exceder 0.25 (25%).
- *Performance de Tela Cheia:* Renderizar um TileSprite por cima da tela o tempo todo pode afetar *fill rate*. Como será um sprite de textura gerada via código com baixa resolução redimensionada, o peso será mínimo.

**7. Critérios de Aceite**
- Uma névoa visual translúcida desliza pelo mapa do jogo de forma contínua.
- A mudança de opacidade funciona a depender da configuração do `WorldManager` sem estourar o limite da CPU (60fps consistentes).
- Ausência de regressão nos assets ou controles, integridade mantida.
