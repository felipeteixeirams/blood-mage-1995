# Spec 11: Visual Polish & VFX Fronts (Code-Driven Art)

## Objetivo Geral
Estruturar o polimento visual e os efeitos gráficos (VFX) do *Blood Mage 1995* utilizando técnicas "Code-Driven" (Shaders, Partículas, Iluminação Dinâmica). O foco é elevar a qualidade estética do projeto a um patamar *AAA indie* sem introduzir novos assets físicos complexos, preservando a performance e a infraestrutura híbrida (assets físicos + fallback procedural) já existente.

---

## Mapeamento Geral: As 8 Frentes de Polimento

> **Nota (27/08):** esta spec nunca tinha tags de status `[CONCLUÍDO]`/`[PARCIAL]`/`[PENDENTE]` nem changelog — foi escrita como proposta e ficou assim, mesmo depois de metade das frentes já estarem implementadas via outro trabalho (Frente 5 de iluminação veio meio de carona com o Eixo A de gráficos avançados, ver `docs/archive/specs/andamento/06_EIXO_A_GRAFICOS_AVANCADOS.md`). Auditoria de código feita em 27/08 — ver `## 📈 Histórico de Progresso` no fim do arquivo. **Atualização (27/08, mesmo dia):** o gap de Bloom PostFX identificado na auditoria foi fechado — Frente 5 passa de PARCIAL pra CONCLUÍDO, ver última entrada do changelog.

1. **[PENDENTE] Construção do Ambiente e Mundo (Dungeon & World Gen):**
   - Gerador de layouts orgânicos (BSP + Cellular Automata) e texturização via ruído procedural, mesclando corredores naturais com criptas quadradas.
2. **[CONCLUÍDO] Efeitos de Ambientação e Clima (Atmospherics & Weather):**
   - Sistema de névoa volumétrica usando *Perlin Noise* em movimento, ciclo de tempo base/tint, e chuvas de partículas (sangue/cinzas).
3. **[PARCIAL] Efeitos de Mundo e Interação de Solo (World Reactions):**
   - Decals no solo persistentes (pegadas de sangue, cinzas) e reflexos locais em poças mapeadas dinamicamente.
4. **[PARCIAL] Construção e Efeitos de Personagens (Atores - Mobs e Jogador):**
   - *Game feel* aplicado aos corpos: *Squash & Stretch*, dismemberment aprimorado (gore dinâmico particionado) e *Hit Stop/Hit Flash* para feedback de impacto.
5. **[CONCLUÍDO] Iluminação e Efeitos de Magia (Spell & Lighting VFX):**
   - Iluminação 2D com emissão dinâmica a partir de magias, orbes e tochas, com adição de Bloom FX no pipeline global para realçar energia.
6. **[PENDENTE] Áudio e Feedback Sonoro (Audio Engineering):**
   - Sintetizadores espaciais proceduralmente ajustados (Pitch Shifting aleatório e drones dinâmicos de sub-grave para tensão dependente do ambiente).
7. **[PENDENTE] Objetos, Loot e Cosméticos (Items & Wearables):**
   - Palette Swapping procedural. Equipamentos que alteram o `tint` base do personagem e adicionam emissores afixados (ex: manto flamejante gerando faíscas).
8. **[PARCIAL] NPCs e Interatividade (Quests & World Events):**
   - Painéis de interação integrados no HUD (React), *barks* de texto flutuantes e pulsação em estruturas interativas como altares de sangue.

---

## 🎯 DEEP DIVE (Specs de Execução Imediata)

Abaixo estão detalhadas as duas frentes prioritárias recomendadas, preparadas para implementação sequencial e segura.

### [CONCLUÍDO] Prioridade 1: Frente 5 - Iluminação Dinâmica e Efeitos de Magia (Lighting & Spells)

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

### [CONCLUÍDO] Prioridade 2: Frente 2 - Atmosfera e Clima (Névoa Volumétrica)

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

---

## 📈 Histórico de Progresso (Changelog)

- **[2026-08-27] Auditoria de código — status real das 8 Frentes:**
  - Status: spec atualizada com tags de status pela primeira vez (nunca tinha
    changelog nem `[CONCLUÍDO]`/`[PARCIAL]`/`[PENDENTE]`); nenhum código foi
    escrito nesta entrada, só leitura + correção da documentação.
  - **Achados por Frente (evidência por arquivo:linha):**
    - **Frente 1 (World Gen) — PENDENTE:** `DungeonGenerator.ts:93-118` usa um
      grid fixo 3x3 de salas retangulares (`cols=3, rows=3, roomW=440,
      roomH=320`). Nenhum traço de BSP ou Cellular Automata — o layout é
      sempre a mesma malha, só o conteúdo das salas muda.
    - **Frente 2 (Atmosfera/Névoa) — CONCLUÍDO:** `AtmosphereSystem.ts`
      existe e implementa exatamente o descrito: `groundFog`/`upperHaze`
      via `Phaser.GameObjects.TileSprite` (linha 30-31), `setBiome(biome)`
      (linha 191) trocando o clima por bioma.
    - **Frente 3 (World Reactions) — PARCIAL:** `BloodSplatterSystem.ts`
      registra "zona líquida reflexiva" pro `ReflectionSystem.ts`
      (`BloodSplatterSystem.ts:310`, `ReflectionSystem.ts:29-77`,
      `registerEntity`/`unregisterEntity`) — decals de sangue e reflexos em
      poças existem. Não verificado: pegadas de passos persistentes (cinzas)
      mencionadas na spec; pode já existir noutro sistema não mapeado nesta
      auditoria, vale checar em jogo antes de assumir que falta.
    - **Frente 4 (Character FX) — PARCIAL:** `CombatFeel.ts:66-67` implementa
      Hit Stop (`hitStopDuration` 40-80ms) e `CombatFeel.ts:171-182`
      implementa Squash & Stretch de verdade (`squashX/Y`, `stretchX/Y`
      escalando o sprite no impacto). `DismembermentSystem.ts` existe e faz
      gore particionado. O que falta pra fechar: não foi confirmado Hit
      *Flash* (mudança de tint no frame do impacto, distinto do squash) — vale
      checar `CombatFeel.ts` de novo com mais tempo.
    - **Frente 5 (Iluminação) — PARCIAL:** `LightingSystem.ts:91` chama
      `lights.enable()`, linha 107 `lights.setAmbientColor()`, linha 117
      aplica o pipeline `'Light2D'` nos sprites — a base de iluminação 2D
      dinâmica está pronta e é usada em toda parte (magias, orbes, tochas).
      **O que falta:** nenhum Bloom PostFX real — `grep -rn "bloom" src/game/
      systems/*.ts` só acha um comentário solto em
      `VirtualJoystickSystem.ts:73` (blend mode ADD pro joystick, não
      correlato). O critério de aceite #4 da Frente 5 ("Bloom PostFX") segue
      pendente.
    - **Frente 6 (Áudio Procedural) — PENDENTE:** `soundEngine.ts` tem vários
      `filter.type = 'lowpass'` mas nenhum `playbackRate`/`detune` (pitch
      shift aleatório) nem oscilador dedicado de drone de tensão. O
      sintetizador de BGM (`bgmSynthesizer.ts`, ver spec 12 Frente 5) é um
      sistema *diferente e mais recente* que cobre música, não os SFX
      espaciais que esta frente descreve.
    - **Frente 7 (Palette Swap / Cosméticos) — PENDENTE:** `grep -n
      "equipment\." src/game/objects/Player.ts` não retorna nada — equipar
      arma/armadura/relíquia (`equipment: EquipmentSlots` no `gameStore.ts`)
      não muda o `tint` do sprite do jogador nem adiciona emissores de
      partícula afixados. O `setTint` que existe em `Player.ts` é todo pra
      feedback de dano/status (sangramento verde, veneno roxo, etc.), não pra
      cosmético de equipamento.
    - **Frente 8 (NPCs/Quests) — PARCIAL:** painéis de interação no HUD React
      e *barks* de texto flutuante existem e funcionam
      (`GameScene.spawnFloatingText`, `DialogueModal.tsx`, `QuestTracker.tsx`
      — ver spec 13). **O que falta:** nenhuma pulsação visual nas estruturas
      interativas (o Altar Ancestral de `spr_altar_crimson` é um sprite
      estático, sem tween de pulso/glow reagindo à proximidade do jogador).
  - **Validação:** auditoria por leitura de código + `grep` direcionado
    (sandbox sem `node_modules`, sem execução real do jogo — os itens
    marcados "não verificado"/"vale checar em jogo" acima são exatamente
    onde a leitura de código sozinha não é conclusiva).

- **[2026-08-27] Fix: Bloom PostFX — fecha o gap da Frente 5:**
  - Status: **CONCLUÍDO** — restaura a Frente 5 de PARCIAL pra **CONCLUÍDO**
    no "Mapeamento Geral" e no header do Deep Dive.
  - **Contexto:** o Phaser 4.2.1 (versão usada pelo projeto, ver `package.json`)
    não tem um filtro `addBloom` nativo — a API de Filtros por câmera/objeto
    (`filters.internal`/`filters.external`, ver `PostFXSystem.ts`) expõe
    `addBarrel`, `addBlend`, `addBlocky`, `addBlur`, `addBokeh`,
    `addColorMatrix`, `addDisplacement`, `addGlow`, `addMask`, `addPixelate`,
    `addShadow`, `addThreshold`, `addTiltShift` — sem Bloom dedicado. `Glow`
    (`Phaser.Filters.Glow`, halo luminoso ao redor do objeto) é o equivalente
    funcional mais próximo, e como o próprio escopo da Frente 5 já pedia
    "Bloom... acionado apenas nas camadas e objetos que brilham" (ou seja,
    por objeto, não full-screen), um filtro Glow por sprite é uma
    implementação fiel ao critério de aceite, não um desvio.
  - **Implementado (`src/game/systems/LightingPolish.ts`):**
    - Novo helper privado `applyBloomFilter(sprite, color, strength)`, que
      aplica `sprite.filters.internal.addGlow(...)` nos sprites emissivos —
      complementa (não substitui) as luzes `Light2D` que já existiam: a luz
      ilumina o CENÁRIO ao redor, o Glow faz o próprio sprite "vazar" brilho.
      Idempotente (`filters.internal.clear()` antes de reaplicar) pra não
      empilhar Glows de cores/spells diferentes em sprites reciclados de
      `ObjectPool` (projéteis).
    - Ligado nos pontos que já existiam e já são chamados em toda a gameplay
      real (sem plumbing novo, só o helper dentro dos métodos existentes):
      `addItemGlow` (itens raros+, não em comuns), `addCollectibleGlow`
      (orbes de HP/Mana/gemas), `addSpellGlow` (projéteis de magia, incl.
      `blood_bolt` via `PlayerSkillSystem.ts:240`), `addMonsterGlow` (só
      tiers fortes — elites/chefes/abominações, `intensity >= 0.7` —
      propositalmente NÃO em mobs comuns, pra não gerar ruído visual/custo de
      GPU em toda entidade da tela) e `addPortalGlow`.
    - **Excluído de propósito:** `addPlayerStaffGlow` — aplicar Glow no
      sprite inteiro do jogador (em vez de só na ponta do cajado, que a luz
      Light2D já simula via offset) deixaria o Bloodmage com um halo vermelho
      permanente, pesado demais pro sprite principal sempre visível em tela.
    - **Corner case de performance (mobile):** `MAX_ACTIVE_BLOOM_TARGETS = 16`
      filtros simultâneos, e respeita as configs existentes
      `settings.postProcessingEnabled` (já usada por `PostFXSystem`/
      `LightingSystem`) e `settings.lowPerformanceParticles` (que antes não
      era consumida em lugar nenhum do código — esta é a primeira vez que a
      flag realmente desliga algo).
  - **Validação:** 8 novos testes em `LightingPolish.test.ts` (mock da Filters
    API do Phaser 4: `sprite.filters.internal.addGlow`/`clear`) cobrindo:
    aplica em item lendário / não aplica em item comum; orbe e projétil de
    magia; só monstro de tier alto; NÃO aplica no cajado do jogador; respeita
    `postProcessingEnabled=false` e `lowPerformanceParticles=true`; idempotência
    (limpa antes de reaplicar); teto de 16 alvos simultâneos. Balanceamento de
    chaves/parênteses checado programaticamente (sandbox sem `node_modules`) —
    recomenda-se rodar `pnpm test`/`pnpm verify` localmente e confirmar
    visualmente em jogo (orbes/projéteis/itens raros com halo, sem impacto de
    FPS perceptível).
