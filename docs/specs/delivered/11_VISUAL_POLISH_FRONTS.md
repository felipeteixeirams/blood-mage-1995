# Spec 11: Visual Polish & VFX Fronts (Code-Driven Art)

## Objetivo Geral
Estruturar o polimento visual e os efeitos gráficos (VFX) do *Blood Mage 1995* utilizando técnicas "Code-Driven" (Shaders, Partículas, Iluminação Dinâmica). O foco é elevar a qualidade estética do projeto a um patamar *AAA indie* sem introduzir novos assets físicos complexos, preservando a performance e a infraestrutura híbrida (assets físicos + fallback procedural) já existente.

---

## Mapeamento Geral: As 8 Frentes de Polimento

> **Nota (27/08):** esta spec nunca tinha tags de status `[CONCLUÍDO]`/`[PARCIAL]`/`[PENDENTE]` nem changelog — foi escrita como proposta e ficou assim, mesmo depois de metade das frentes já estarem implementadas via outro trabalho (Frente 5 de iluminação veio meio de carona com o Eixo A de gráficos avançados, ver `docs/archive/specs/andamento/06_EIXO_A_GRAFICOS_AVANCADOS.md`). Auditoria de código feita em 27/08 — ver `## 📈 Histórico de Progresso` no fim do arquivo. **Atualização (27/08, mesmo dia):** o gap de Bloom PostFX identificado na auditoria foi fechado — Frente 5 passa de PARCIAL pra CONCLUÍDO. Também fechada a Frente 6 (Pitch Shifting + Drone de Tensão). **Atualização (27/08, "gaps rápidos"):** fechados os 3 gaps pequenos e independentes restantes — Frente 3 (pegadas ensanguentadas), Frente 4 (Hit Flash — já existia, gap era só de documentação) e Frente 8 (pulso do Altar Ancestral). **Atualização (27/08, mesmo dia):** Frente 1 fechada (geração orgânica de dungeon via BSP + Cellular Automata) e o achado de código morto da Frente 4 (`CombatFeel.triggerHitFlash`/`triggerSquashStretch`) removido do repositório. **Atualização (27/08, mesmo dia):** Frente 7 fechada (Palette Swap procedural de equipamento). **As 8 frentes do mapeamento geral estão todas `[CONCLUÍDO]`** — os itens em aberto do projeto agora são fora do escopo desta spec (ex.: unificação dos dois sistemas de achievements, ver ROADMAP.md).

1. **[CONCLUÍDO] Construção do Ambiente e Mundo (Dungeon & World Gen):**
   - Gerador de layouts orgânicos (BSP + Cellular Automata) e texturização via ruído procedural, mesclando corredores naturais com criptas quadradas.
2. **[CONCLUÍDO] Efeitos de Ambientação e Clima (Atmospherics & Weather):**
   - Sistema de névoa volumétrica usando *Perlin Noise* em movimento, ciclo de tempo base/tint, e chuvas de partículas (sangue/cinzas).
3. **[CONCLUÍDO] Efeitos de Mundo e Interação de Solo (World Reactions):**
   - Decals no solo persistentes (pegadas de sangue, cinzas) e reflexos locais em poças mapeadas dinamicamente.
4. **[CONCLUÍDO] Construção e Efeitos de Personagens (Atores - Mobs e Jogador):**
   - *Game feel* aplicado aos corpos: *Squash & Stretch*, dismemberment aprimorado (gore dinâmico particionado) e *Hit Stop/Hit Flash* para feedback de impacto.
5. **[CONCLUÍDO] Iluminação e Efeitos de Magia (Spell & Lighting VFX):**
   - Iluminação 2D com emissão dinâmica a partir de magias, orbes e tochas, com adição de Bloom FX no pipeline global para realçar energia.
6. **[CONCLUÍDO] Áudio e Feedback Sonoro (Audio Engineering):**
   - Sintetizadores espaciais proceduralmente ajustados (Pitch Shifting aleatório e drones dinâmicos de sub-grave para tensão dependente do ambiente).
7. **[CONCLUÍDO] Objetos, Loot e Cosméticos (Items & Wearables):**
   - Palette Swapping procedural. Equipamentos que alteram o `tint` base do personagem e adicionam emissores afixados (ex: manto flamejante gerando faíscas).
8. **[CONCLUÍDO] NPCs e Interatividade (Quests & World Events):**
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

- **[2026-08-27] Fix: Pitch Shifting + Drone de Tensão — fecha o gap da Frente 6:**
  - Status: **CONCLUÍDO** — restaura a Frente 6 de PENDENTE pra **CONCLUÍDO**
    no "Mapeamento Geral". Importante: isso é diferente da Frente 5 da spec 12
    (`bgmSynthesizer.ts`, trilha sonora/música implementada no fim de semana
    anterior) — essa cobre a MÚSICA de fundo; esta entrada cobre os SFX
    (efeitos sonoros de ação/impacto/tensão), que continuavam pendentes até
    aqui (auditoria de 27/08 já tinha distinguido os dois sistemas
    explicitamente).
  - **Implementado (`src/utils/soundEngine.ts`):**
    - **Pitch Shifting aleatório:** novo helper privado `pitchJitter(rangePercent)`
      (padrão ±6%), que retorna um multiplicador de frequência aplicado à
      frequência-base de cada disparo. Ligado nos 11 SFX mais repetitivos de
      combate/ação (os que o jogador ou os inimigos disparam dezenas de vezes
      por run): `playBloodBolt`, `playSwing`, `playBloodSquish`,
      `playPlayerHurt`, `playScytheSlash`, `playTelegraph`, `playHowl`,
      `playDash`, `playNova`, `playGoreExplosion`, `playOrbPickup`. Excluídos
      de propósito: SFX melódicos de múltiplas notas em escala musical
      (`playLevelUp`, `playChestOpen`, `playContractComplete` — desafinar
      notas soa quebrado, não orgânico) e SFX de UI/eventos raros
      (`playButtonClick`, `playPortalEnter`, `playEquipLoot`, `playBossRoar`,
      `playBoneShield`, `playSyphonSoul`, `playRitualCircle`,
      `playHemomancyBeam`, `playDemonRoar` — ou tocam raramente o bastante
      pra repetição não incomodar, ou precisam de tom consistente por
      clareza de feedback).
    - **Drone Dinâmico de Sub-Grave:** novo par `initTensionDrone()`/
      `updateTensionDrone(alertCount, hpRatio)` — oscilador sawtooth de
      38-52Hz (sub-grave, filtrado em lowpass a 160Hz pra não trazer
      harmônicos ásperos) com um LFO lento modulando o ganho (efeito de
      "respiração"/pulsação, não um zumbido estático). A intensidade
      (volume + frequência + profundidade da modulação) escala com um score
      de "perigo do ambiente" 0-1: nº de inimigos hostis em combate/frenzy
      perto do jogador (satura em 5) + HP baixo (abaixo de 50%) somando
      tensão extra. Ligado em `GameScene.updateThreatIndicator()`,
      reaproveitando o `alertCount` que a função já calculava pra outra
      finalidade (indicador de ameaça fora da tela) — sem laço novo sobre os
      inimigos. Sutil de propósito: ganho máximo de ~5% do `sfxVolume`, é
      textura ambiente, não deve competir com a trilha sonora ou os SFX de
      combate na mixagem.
    - Distinto do Tinnitus (`updateTinnitusState`, já existente): o Tinnitus é
      agudo (~3500Hz) e só ativa perto da morte (HP<30%) ou elite próximo — o
      Drone é sub-grave e reage de forma graduada à "tensão geral" do
      ambiente (mesmo com HP cheio, estar cercado de inimigos já sobe o
      drone). Os dois tocam juntos quando as duas condições se sobrepõem.
  - **Validação:** novo `src/utils/soundEngine.test.ts` (o arquivo não tinha
    testes antes) — mocka `window.AudioContext`, `bgmSynthesizer` e
    `useGameStore`, recarregando o módulo (`vi.resetModules()`) a cada teste
    porque `soundEngine` é um singleton (só a instância é exportada). Cobre:
    variação de frequência entre disparos consecutivos (`playBloodBolt`,
    `playPlayerHurt`, `playTelegraph`) via `Math.random` mockado; confirma que
    SFX melódicos (`playLevelUp`) NÃO variam; criação lazy do drone; ganho e
    frequência do drone escalando com perigo máximo (5 hostis + HP 20%);
    drone silencioso sem perigo; respeita mute/`sfxVolume=0` sem recriar
    osciladores. Balanceamento de chaves/parênteses checado programaticamente
    (sandbox sem `node_modules` — tentativa de `pnpm install` completo
    bloqueada por 403 em alguns pacotes do registro nesta sandbox; recomenda-se
    rodar `pnpm test`/`pnpm verify` localmente) e confirmar em jogo: golpes/
    hits/telegraphs soando com variação de tom, e um grave sutil de tensão ao
    ficar cercado ou com HP baixo.

- **[2026-08-27] Fix: "Gaps rápidos" — fecha Frente 3, Frente 4 e Frente 8:**
  - Status: **CONCLUÍDO** nas três — restaura Frente 3 e Frente 8 de PARCIAL
    e Frente 4 de PARCIAL, todas pra **CONCLUÍDO** no "Mapeamento Geral".
    Escopo escolhido explicitamente pelo usuário como os 3 itens pequenos e
    independentes restantes, deixando de fora Frente 7 (Palette Swap) e
    Frente 1 (geração orgânica) por serem maiores/de risco mais alto.
  - **Frente 3 (pegadas ensanguentadas) — implementado:**
    - Nova textura procedural `footprint_bloody` (`textureGenerator.ts`),
      silhueta de pegada de bota 12x18 com realce mais escuro no centro,
      100% procedural (sem entrada no `assetManifest.json`, seguindo o
      padrão dos demais decals de sangue/ossos).
    - `BloodSplatterSystem.ts`: novo tipo de decal `'footprint'`, conjunto
      `WET_DECAL_TYPES` (poças/splatters ainda não secos), `isNearWetBlood(x,
      y, radius)` pra checar se há sangue fresco por perto, e
      `addFootprintDecal(x, y, angle, footSide, fadeRatio)` que cria o decal
      com offset lateral alternado (pé esquerdo/direito) e alpha proporcional
      ao `fadeRatio` (trilha desbota conforme o sangue nas botas seca).
      Reaproveita o pipeline de reciclagem FIFO (`maxDecals`) e o tween de
      secagem já existentes — nenhum sistema novo, só um novo tipo de decal.
    - `GameScene.ts`: no laço de movimento do jogador, reaproveita o timer de
      cadência de passos já existente (`lastFootstepNoiseTime`, 450ms) — ao
      detectar sangue fresco perto do jogador via `isNearWetBlood`, arma um
      contador `playerWetFootstepsRemaining = 6` (6 passos de trilha) e
      chama `addFootprintDecal` a cada passo enquanto o contador não zera,
      alternando o pé (`playerFootSideToggle`) e passando o `fadeRatio`
      proporcional ao contador restante. Sem novo loop por frame — só estende
      o bloco de passos que já rodava.
  - **Frente 4 (Hit Flash) — correção de auditoria, sem código novo:** a
    auditoria de 27/08 tinha marcado como "não confirmado". Investigação mais
    a fundo achou que `Enemy.ts` (método `takeDamage()`) já implementa um
    Hit Flash inline completo (sequência de tint branco → vermelho → tint
    original, via `Phaser.TintModes.FILL`/`MULTIPLY`) — o critério de aceite
    já estava satisfeito, só não documentado. **Achado paralelo (dívida
    técnica, não corrigida agora):** `CombatFeel.triggerHitFlash()` e
    `CombatFeel.triggerSquashStretch()` são implementações completas e
    funcionais do mesmo tipo de efeito, mas nunca chamadas em lugar nenhum do
    código — dead code. Decisão: **não remover nem conectar agora.**
    `triggerSquashStretch` em particular usa `setScale()` direto no sprite, o
    que provavelmente entraria em conflito com o sistema de escala próprio do
    `Enemy.ts` (`baseScale` + escala isométrica/"coil" recalculada a cada
    frame em `update()`, mais `setFlipX` pra virar o sprite) — conectar sem
    investigar essa interação a fundo arrisca introduzir uma regressão visual
    (sprite "tremendo"/voltando de escala errada). Fica registrado aqui como
    candidato a limpeza futura (remover o código morto) ou unificação
    (migrar `Enemy.ts` pra usar `CombatFeel` como fonte única de verdade),
    fora do escopo desta rodada.
  - **Frente 8 (pulso do Altar Ancestral) — implementado:**
    - `LightingPolish.ts`: dois métodos novos, `addAltarGlow(sprite)` —
      chamado uma vez na criação do altar, adiciona uma luz `Light2D`
      vermelha suave (`0x990000`, intensidade 0.5, raio 60) + Glow via
      `applyBloomFilter` (reaproveitando o helper da Frente 5) + um tween de
      "respiração" contínuo (escala e alpha oscilando bem sutilmente,
      `yoyo`+`repeat: -1`, mais discreto que o pulso de um portal) — e
      `updateAltarProximity(sprite, distanceRatio)` — chamado por frame
      enquanto o jogador está dentro de um raio de "sensor", intensifica
      progressivamente o `tint` do sprite pra um vermelho mais vivo conforme
      `distanceRatio` cai, como um aviso visual de "há algo aqui" antes do
      texto de descoberta aparecer.
      Os métodos que recebiam `Phaser.GameObjects.Sprite` foram alargados
      pra `Phaser.GameObjects.Image` (`Sprite extends Image`, mudança
      estritamente mais permissiva) porque o altar é um `Image` estático, não
      um `Sprite` animado.
    - `DungeonFlowController.ts`: `addAltarGlow(altar)` chamado logo após
      `applyLightPipeline(altar)`, no ponto de criação do altar (sala de
      tesouro secreto).
    - `GameScene.ts`: no laço `campaignDiscoverables.forEach` já existente
      (checagem de proximidade pra descoberta), adicionado um raio de sensor
      maior (`altarSensorRadius = 260`, contra o `discoverRadius = 70` de
      descoberta) — dentro dele chama `updateAltarProximity` a cada frame;
      a lógica de descoberta em si não mudou.
  - **Validação:**
    - Frente 3: 5 novos testes em `BloodSplatterSystem.test.ts` (detecção de
      sangue fresco dentro do raio; ignora sangue seco e tipos não-líquidos
      como `bone_dust`/`corpse`; guarda de sistema desabilitado em
      `isNearWetBlood`; offset L/R alternado por pé em `addFootprintDecal`;
      alpha desbotando com `fadeRatio`; no-op com sistema desabilitado).
    - Frente 4: nenhuma, mudança é só de documentação (`Enemy.ts` já tinha
      cobertura de teste própria do hit flash, não tocada aqui).
    - Frente 8: 4 novos testes em `LightingPolish.test.ts` (luz + Glow + tween
      contínuo em `addAltarGlow`; no-op em sprite inativo; tint intensificado
      em `distanceRatio=0` vs. neutro em `distanceRatio=1` em
      `updateAltarProximity`; clamp de ratio fora de `[0,1]` e no-op em
      sprite inativo).
    - Balanceamento de chaves/parênteses checado programaticamente em todos
      os arquivos tocados (sandbox sem `node_modules` — mesma limitação de
      rede já registrada nas entradas anteriores). Recomenda-se rodar `pnpm
      test`/`pnpm verify` localmente e confirmar em jogo: matar um inimigo,
      andar pelo sangue e se afastar deve deixar uma trilha de pegadas
      desbotando; aproximar-se do Altar Ancestral à distância deve
      intensificar o tint vermelho antes da descoberta, mantendo o pulso
      idle; levar hits continua mostrando o flash branco→vermelho existente,
      sem regressão (mudança da Frente 4 foi só documentação).

- **[2026-08-27] Fix: Frente 1 (geração orgânica via BSP + Cellular Automata) e limpeza do código morto da Frente 4:**
  - Status: **CONCLUÍDO** — restaura a Frente 1 de PENDENTE pra **CONCLUÍDO** no
    "Mapeamento Geral". Escolhida pelo usuário junto com a limpeza de dívida
    técnica registrada na entrada anterior (`CombatFeel.triggerHitFlash`/
    `triggerSquashStretch`), deixando a Frente 7 (Palette Swap) como o único
    item ainda pendente da spec.
  - **Contexto:** `DungeonGenerator.ts` sempre gerava a mesma malha —
    `cols=3, rows=3, roomW=440, roomH=320` fixos, com `rx = 100 + c*580` e
    `ry = 80 + r*440` — só o CONTEÚDO das 9 salas variava (tipo de sala,
    armadilhas, baús), nunca o LAYOUT. A auditoria de 27/08 já tinha marcado
    isso como o gap da Frente 1.
  - **Implementado (`src/game/systems/DungeonGenerator.ts`):**
    - `bspSplit(root, targetCount, minW, minH)`: Binary Space Partitioning
      iterativo — a cada passo, corta ao meio (variação 42%-58%, não sempre
      exatamente no centro) a folha de MAIOR área ainda divisível, ao longo
      do seu eixo mais longo, até atingir `targetCount` folhas (aleatório
      entre 6 e 9 por andar, via `Phaser.Math.Between`) ou não haver mais
      nenhuma folha grande o bastante. Isso já mata sozinho a reclamação
      principal da auditoria: número, tamanho e posição das salas agora
      variam a cada geração, não é mais sempre a mesma malha 3x3.
    - `computeCorridorZoneGrid(cols, rows)`: Cellular Automata clássico —
      regra 4-5 de vizinhança 8-direcional (bordas contam como "vivas" pra
      fechar bolsões em vez de vazar infinitamente), 2 iterações de
      suavização sobre uma grade grosseira 6x5 semeada com 45% de
      preenchimento aleatório. Gera zonas "corredor natural" vs. "cripta
      quadrada" espalhadas organicamente pelo mapa (não em blocos regulares).
    - `carveRoomFromLeaf(...)`: esculpe a sala de verdade dentro de cada
      folha do BSP, amostrando a zona do CA sob o centro da folha — zonas de
      corredor esculpem salas mais estreitas (50%-68% da folha) e zonas de
      cripta esculpem salas quase do tamanho da folha inteira (74%-90%),
      nunca preenchendo 100%: a sobra à direita/embaixo da sala é o que
      conecta com a próxima (igual ao antigo grid, que tinha folgas fixas de
      140x120px — agora a folga varia por sala). É literalmente a mistura que
      o "Mapeamento Geral" desta spec já descrevia: "corredores naturais com
      criptas quadradas".
    - Sala de spawn = a de menor `centerX + centerY` (canto superior-esquerdo
      utilizável, papel do antigo `(0,0)` do grid) — sempre reordenada pra
      `rooms[0]`, contrato que `DungeonFlowController`/`CollisionHandlers`
      dependem (`scene.rooms[0]`). Sala boss = a mais distante da spawn; sala
      secret_treasure = a segunda mais distante (excluindo a boss).
    - **Decisão de escopo deliberada — convenção de porta preservada:** as
      salas continuam só com parede+porta centralizada no topo/esquerda
      (quando a folha não encosta na borda utilizável do mapa) e totalmente
      abertas embaixo/direita, exatamente como o grid antigo. Isso foi
      proposital: o código de tochas em `GameScene.ts` (`doorHalf =
      DOOR_WIDTH / 2`, flanqueando `room.centerX`/`room.centerY`) assume essa
      topologia especificamente — generalizar portas pros 4 lados exigiria
      também reescrever o posicionamento de tochas (risco de tochas
      flutuando ao lado de parede sólida ou portas sem tocha), sem ganho
      visual proporcional ao risco. A variedade orgânica vem inteira do
      tamanho/posição/proporção das salas (BSP) e da mistura corredor/cripta
      (CA), não da topologia de portas.
    - Todos os outros consumidores (`DungeonFlowController.ts`,
      `GameScene.ts`, `CollisionHandlers.ts`, `gameStore.ts`/`Minimap.tsx`)
      foram auditados antes de mexer: todos operam genericamente sobre
      `RoomData[]` (`.type`, `.x/.y/.width/.height/.centerX/.centerY`), sem
      nenhuma suposição de grid 3x3 ou de exatamente 9 salas — o `Minimap.tsx`
      inclusive já renderiza por bounding-box percentual, não por índice de
      grade (o comentário "grade 3x3 fixa" que existia em `gameStore.ts`/
      `GameScene.ts` estava desatualizado, corrigido nesta entrada). Zero
      mudança necessária nesses arquivos.
  - **Validação:**
    - Novo `src/game/systems/DungeonGenerator.test.ts` (arquivo não existia
      antes): cobre contagem de salas (6-9), `rooms[0].type === 'spawn'`,
      exatamente 1 boss + 1 secret_treasure, todas as salas dentro dos limites
      do mapa e sem sobreposição entre si (propriedade de particionamento do
      BSP), variação entre gerações consecutivas, portas só nas bordas que
      não encostam no perímetro, `safe_house` inalterada (sala única
      800x600), e os 2 baús garantidos da sala secret_treasure.
    - **Simulação adicional fora do vitest** (sandbox sem `node_modules`):
      script Node.js standalone reimplementando `bspSplit`/
      `computeCorridorZoneGrid`/`carveRoomFromLeaf` rodado 5000 vezes —
      contagem de salas sempre entre 6 e 9, **zero violações** de limites do
      mapa ou sobreposição entre salas. Complementa (não substitui) os testes
      de verdade, que não puderam ser executados aqui pela mesma limitação de
      rede já registrada nas entradas anteriores.
    - Balanceamento de chaves/parênteses checado programaticamente em todos
      os arquivos tocados. Recomenda-se rodar `pnpm test`/`pnpm verify`
      localmente e confirmar em jogo: descer pra um andar novo várias vezes
      seguidas deve mostrar layouts visivelmente diferentes a cada vez (sem
      nunca voltar ao grid 3x3 antigo), com salas de tamanhos variados, sem
      áreas inacessíveis, portas sempre alinhadas com a abertura real da
      parede, e tochas nunca flutuando ao lado de parede sólida.
  - **Limpeza de código morto (achado da Frente 4, não é uma frente da spec):**
    Status: **removido**. `CombatFeel.triggerHitFlash()` e
    `CombatFeel.triggerSquashStretch()` (e os testes correspondentes em
    `CombatFeel.test.ts`) foram deletados — confirmado via `grep` que não
    havia nenhuma chamada real no jogo (só nos próprios testes que foram
    removidos junto). O Hit Flash de verdade continua sendo o inline em
    `Enemy.ts.takeDamage()`, com sua própria cobertura de teste, não tocada
    aqui. O motivo de não ter sido conectado antes (conflito provável entre
    `setScale()` direto do Squash & Stretch e o sistema de escala
    isométrico/"coil" próprio do `Enemy.ts`) fica registrado no comentário que
    substituiu os métodos removidos, caso alguém reconsidere unificar os dois
    sistemas no futuro. Balanceamento de chaves/parênteses checado nos dois
    arquivos tocados (`CombatFeel.ts`, `CombatFeel.test.ts`) — sem mudança de
    comportamento em runtime, só remoção de código inalcançável.

- **[2026-08-27] Fix: Frente 7 (Palette Swap procedural de equipamento) — última frente pendente da spec:**
  - Status: **CONCLUÍDO** — restaura a Frente 7 de PENDENTE pra **CONCLUÍDO**.
    Com esta entrada, as 8 frentes do "Mapeamento Geral" ficam todas
    `[CONCLUÍDO]`.
  - **Contexto:** `Player.ts` já tinha um sistema de paleta cosmética manual
    (`applyCosmeticTint()`, `settings.activePaletteId`, escolhida pelo jogador
    em Configurações via `GameplayHUD.tsx`) — mas nada ligava o tint do
    personagem ao EQUIPAMENTO de verdade (`useGameStore().equipment`), que é
    o que a Frente 7 pede. `EquipmentSlots`/`LootItem` (`types/game.ts`) não
    têm campo de "elemento" (o "manto flamejante" do texto da spec é só um
    exemplo ilustrativo) — só `rarity: 'common'|'rare'|'epic'|'legendary'`,
    então a paleta foi derivada da raridade, reaproveitando EXATAMENTE a
    mesma paleta de cor que `LightingPolish.ts` já usa pro glow de itens no
    chão (`0x3b82f6` rare / `0xa855f7` epic / `0xf59e0b` legendary) — cria uma
    associação visual consistente em vez de inventar uma paleta nova do zero.
  - **Implementado:**
    - Novo `src/utils/equipmentPalette.ts` — módulo puro, sem dependência de
      Phaser/Scene: `getEquipmentRarityTint(equipment)` deriva o tint da
      MAIOR raridade entre arma e armadura equipadas (relíquias ficam de
      fora — não são renderizadas "vestidas" no sprite), retornando `null`
      pra common (personagem fica neutro/na paleta manual, mesmo corte que
      `LightingPolish` usa pro glow só em rare+); `shouldEmitLegendarySparks(
      equipment)` — só true quando arma OU armadura é lendária.
    - `Player.ts` — `applyCosmeticTint()` agora checa o tint de equipamento
      PRIMEIRO (precedência sobre a paleta cosmética manual quando rare+),
      caindo pra paleta manual/neutro só se o equipamento for common. Como
      `applyCosmeticTint()` já era chamado em todo frame como fallback do
      bloco de "Visual Status Tints" (quando não há sangramento/veneno/
      infecção ativos) e no wake-up de desmaio, o tint de equipamento já sai
      de graça sem plumbing novo nesses casos.
    - Novo método `Player.applyBaseTint()` — alias de `applyCosmeticTint()`.
      Achado paralelo: `StatusEffectSystem.ts` já tinha um contrato genérico
      `StatusTarget.applyBaseTint?()` que `Enemy.ts` implementa (chamado
      quando um status burning/frozen/cursed expira, pra restaurar o tint
      "de base" em vez de um `clearTint()` cego) — o Player NUNCA implementava
      esse método, então esse caminho de restore falhava silenciosamente pra
      ele. Corrigido preventivamente aqui (hoje `applyStatus()` só é chamado
      em inimigos — `grep` confirmou nenhum `applyStatus(player, ...)` no
      código — então isso não era um bug visível ainda, mas fecha a lacuna
      pra quando/se status elementais chegarem no jogador).
    - `Player.updateLegendarySparks()` — emissor de faíscas (`particle_ember_
      spark`, textura procedural já existente) só quando equipamento
      lendário está ativo. Reaproveita o padrão JÁ EM PRODUÇÃO do
      `StatusEffectSystem` (`emberEmitter.emitParticleAt(x,y)` probabilístico
      por frame, 30% de chance) em vez de inventar um emissor contínuo com
      `.startFollow()`/`.start()`/`.stop()` sem precedente nesta base de
      código — emitter próprio do Player, lazy (só criado se realmente
      precisar), 25% de chance por frame, posicionado com jitter ao redor do
      jogador.
    - `gameStore.ts` — `equipItem()`, `clearInventoryOnDeath()` e
      `retrieveCorpseLoot()` (os 3 pontos que mutam `equipment.weapon`/
      `.armor`) agora chamam `bumpCosmeticTint()`, reaproveitando o canal de
      refresh que já existia pra paleta manual (`cosmeticTintVersion` →
      `PhaserGame.tsx` → `GameScene.applyCosmeticTint()` →
      `Player.applyCosmeticTint()`) — trocar de arma/armadura em jogo
      atualiza o tint/faíscas imediatamente, sem esperar o próximo frame de
      status.
  - **Validação:**
    - Novo `src/utils/equipmentPalette.test.ts` — testes puros (sem mock de
      Phaser/Scene) cobrindo: `null` sem equipamento e com só common; cor
      correta por raridade rare/epic/legendary; usa a MAIOR raridade entre
      arma e armadura; ignora relíquias; `shouldEmitLegendarySparks` true só
      com lendário em arma OU armadura, ignorando relíquia lendária.
    - `gameStore.test.ts` — 2 novos testes: `equipItem` incrementa
      `cosmeticTintVersion` ao equipar arma/armadura; `clearInventoryOnDeath`
      também incrementa.
    - Balanceamento de chaves/parênteses checado programaticamente em todos
      os arquivos tocados (sandbox sem `node_modules`, mesma limitação de
      rede já registrada nas entradas anteriores). Recomenda-se rodar `pnpm
      test`/`pnpm verify` localmente e confirmar em jogo: equipar uma arma ou
      armadura rara/épica deve tingir o personagem na cor correspondente
      (azul/roxo) imediatamente; equipar algo lendário deve tingir dourado E
      começar a soltar faíscas; desequipar/voltar pra common deve restaurar a
      paleta cosmética manual (ou o personagem neutro); tomar veneno/
      sangramento/infecção continua sobrescrevendo o tint normalmente e
      volta pro tint de equipamento (não pro branco puro) quando o status
      passa.
