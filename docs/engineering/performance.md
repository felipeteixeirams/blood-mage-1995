# Otimizações de Performance no Código

**Mestre:** [engineering](README.md)
**Status:** verificado
**Verificado em:** 2026-10-10
**Método:** estático
**Fonte:** `node_modules/phaser`, `src/game/systems/ObjectPool.ts`, `src/game/systems/ViewportCuller.ts`, `vite.config.ts`

Técnicas de performance que o código aplica hoje. Conferido por leitura estática; não houve medição de FPS nem de memória (ver [performance-metrics](performance-metrics.md)).

| Técnica | Onde | Como funciona hoje |
|---|---|---|
| Poda AABB no raycast de visão | `DungeonGenerator.hasLineOfSight` (linhas 788-815) | Descarta a parede se a caixa dela (32x32) não cruza a caixa do segmento; só então chama `Phaser.Geom.Intersects.LineToRectangle` |
| Reuso de geometria | `DungeonGenerator` (`cachedLine`, `cachedRect`, linhas 55-56) | Reutiliza uma `Geom.Line` e um `Geom.Rectangle` com `.setTo(...)` em vez de criar objetos por chamada |
| Raycast só quando necessário | `GameScene.update` (linhas 1595-1620) | Inimigos em `combat`/`frenzy`/`flee` calculam o raycast se a distância ao jogador for até 800 px (acima disso assume parede). Os demais só calculam se a distância for até `config.visionDistance` (padrão 320) |
| Culling de inimigos passivos | `ViewportCuller` (`src/game/systems/ViewportCuller.ts`), usado em `GameScene.update` | Inimigos fora da tela que não estão em `combat`/`frenzy`/`flee` não executam `updateEnemy` |
| Distância quadrática | `Enemy.ts` (linhas 363-371 e 815-822) | Compara `dx*dx + dy*dy` com limiares ao quadrado (ex.: 32400 = 180²) e filtra por `Math.abs(dx)`/`Math.abs(dy)` antes. `Math.sqrt` ainda é usado onde o valor da distância é necessário (linhas 424, 823, 1132) |
| Pool de projéteis | `ObjectPool` (`src/game/systems/ObjectPool.ts`); `playerProjectilePool` e `enemyProjectilePool` em `GameScene` | Projéteis são reciclados em vez de destruídos |
| Divisão de bundle | `vite.config.ts` (`manualChunks`) | `node_modules/phaser` vira o chunk `phaser`; o restante de `node_modules` vira `vendor` |
| Monitor opcional | `PerformanceMonitor` | Ativado com `?perf=...` na URL (ver [performance-metrics](performance-metrics.md)) |

## Exceções

- `PlayerSkillSystem.ts` (linhas 595 e 602) cria `new Phaser.Geom.Line` e `new Phaser.Geom.Circle` por inimigo ao resolver um feixe: não segue o padrão de reuso acima.
- Não existe no código um limite de 300 px em X/Y para pular o raycast (afirmação de versões anteriores deste documento). A poda real é por `visionDistance` (padrão 320) e 800 px, descrita acima.
- `vite.config.ts` não define `chunkSizeWarningLimit`: vale o limite padrão do Vite para o aviso de chunk grande.

## Não verificado

- Ganho real de cada técnica (sem benchmark).
- Se `ObjectPool` cobre outros efeitos além dos projéteis (só os pools de projétil foram localizados).
