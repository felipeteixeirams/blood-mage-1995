# Spec 16: Resolução Adaptativa, UI Mobile e Terreno 2.5D

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente

**Estado vs código:** parcial (verificado em 2026-10-10, leitura estática).
- Existe: terreno por heightmap (`HeightmapGenerator.ts`: `isoToScreen`, `screenToIso`, `calculateIsometricDepth`, `isTraversable` com regra de |delta Z|, `samplePoissonDisk`), usado por `DungeonGenerator.ts` (seed 1995, `setDepth` isométrico, faces de falésia, Poisson com distância mínima 4,5) e por `Enemy.ts`/`Projectile.ts` via `DungeonGenerator.isTraversable`; zoom adaptativo da câmera em `GameScene.ts` (`clamp(altura/300, 1.8, 3.0)`, fator 0,87 abaixo de proporção 1,5) e zoom-out de chefe (alvo 0,85x, lerp 0,04 por frame, quando `isBossActive()`); classes `safe-area-*` em `src/index.css` usadas em `GameplayHUD.tsx` (topo-esquerda, topo e topo-direita); configurações `virtualStickScale` (small/medium/large), `leftHandedMode`, `floatingStick` e `virtualControlsOpacity` (`src/types/game.ts`, `GameplayHUD.tsx`, `GameScene.ts`); alvo automático com histerese e retículo (`Player.findBestTarget`, `renderTargetLockReticle`).
- Falta (`grep -rn "1920" src` só acha o tamanho do mapa/chunk, não resolução virtual de UI): resolução lógica 1920x1080 com multiplicador por `devicePixelRatio`; expansão horizontal de FOV; escala global de HUD (80% a 120%) e diâmetro de botões; reposicionar livremente joystick e botões; safe area nos cantos inferiores; tabela de proporção de entidades (`scale` em `src/data/monsters.json` varia de 0,85 a 2,8, sem relação com percentagem da tela); hitbox +30%; fórmula de pontuação de alvo (`findBestTarget` não usa pesos de distância, HP e ameaça); easing `Cubic.Out` de 1,2 s no zoom de chefe; carimbo de estruturas 4x4/6x6; variante gráfica de rampa; A* tridimensional (só existe a regra de conectividade).

## Decisões a confirmar

Comportamento e escopo abaixo são propostas sem aprovação registrada; nada aqui está decidido.

| # | Decisão | Recomendação |
|---|---|---|
| 1 | Resolução virtual base e multiplicador de densidade (hoje: zoom por altura da tela) | Manter o zoom atual até haver problema medido em aparelho real |
| 2 | FOV horizontal e tratamento de telas 4:3 (hoje: zoom x0,87 abaixo de 1,5) | Manter; só revisar com teste em tablet |
| 3 | Safe area nos cantos inferiores e personalização do HUD (escala 80%-120%, opacidade, diâmetro, posição) | Fazer safe area inferior primeiro; o resto depende de playtest mobile |
| 4 | Tabela de proporção de entidades e hitbox +30% | Decidir só depois de playtest; hoje a escala vem de `monsters.json` |
| 5 | Pontuação de alvo (distância, HP, ameaça) | Propor pesos com o responsável; hoje há histerese por alcance |
| 6 | Terreno: carimbo de estruturas, rampas e A* 3D | Adiar; o gerador atual só usa conectividade |
| 7 | Motor gráfico: Phaser 2D puro, Phaser Mesh, camada Three.js ou migração (Unity/Godot) | Manter Phaser 2D; Mesh/Three.js só com requisito visual concreto |

## Proposta pendente (resumo do design)

- **Resolução e FOV:** coordenadas lógicas 1920x1080; escala = `clamp(largura/1920, 0,5, 2,5) x devicePixelRatio`; telas 4:3 com distância de câmera x1,15.
- **Safe area:** margens `env(safe-area-inset-*)` de 16 px (vertical) e 24 px (horizontal); minimapa e status no canto superior esquerdo, painel de habilidades no inferior direito, joystick no inferior esquerdo.
- **HUD personalizável:** escala global 80%-120%, opacidade 30%-100%, botões de 48 a 72 px, âncoras de joystick e feitiços móveis.
- **Câmera isométrica:** inclinação 45 a 50 graus, FOV vertical 35 a 40 graus.
- **Ocupação vertical de entidades (proposta):** props 2%-4%, minions 5%-7%, herói 8%-10%, elites 12%-15%, chefes 20%-35%.
- **Zoom de chefe:** 12%-15% em 1,2 s com `Cubic.Out`; retorno suave ao derrotar.
- **Assistência de toque:** hitbox +30%; pontuação `w1/distância + w2 x (1 - HP/HPmax) + w3 x ameaça` (chefe 3,0, elite 2,0, minion 1,0).
- **Terreno:** estruturas por carimbo em áreas planas 4x4 ou 6x6 nos níveis 1 e 2; variante gráfica de rampa quando |delta Z| = 1; falésia intransitável quando |delta Z| >= 2; A* com custo de elevação.

## Critérios de aceite

A definir (spec ainda sem EARS).
