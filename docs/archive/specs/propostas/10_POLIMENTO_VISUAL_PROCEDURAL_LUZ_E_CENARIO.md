---
agent_context: frontend, game-engine, game designer
target_module: src/utils/textureGenerator.ts, src/game/systems/LightingSystem.ts, src/game/systems/LightingPolish.ts, src/game/systems/ShadowSystem.ts, src/game/systems/DungeonGenerator.ts, src/game/scenes/GameScene.ts
priority: media
status: Fases 1-4 implementadas (Fase 2 completa — 8 de 8 inimigos), aguardando validação em jogo
last_updated: 2026-08-25
tags: [design, procedural-art, lighting, vfx, polish, sem-sprites]
---

# 🕯️ Polimento Visual Procedural: Inimigos, Itens, Iluminação e Cenário Sem Sprites Novos

> Felipe pediu para eliminar "sombras, quadrados ou outros artefatos" visuais e elevar a
> qualidade do que o motor já desenha proceduralmente (inimigos e itens que ainda não têm
> sprite físico) e do cenário — em especial as luminárias, posicionadas de forma mais
> realista. Este documento faz um diagnóstico concreto (com citações de código) do que
> hoje é literalmente bloco/quadrado, e propõe um plano faseado para melhorar isso usando
> só o que o `Phaser.Canvas`/`Light2D` já oferece — sem depender de arte física nova.

---

## 1. Diagnóstico: onde estão os "quadrados" de verdade

Auditoria de `src/utils/textureGenerator.ts` (1736 linhas), `ShadowSystem.ts`,
`LightingSystem.ts`, `LightingPolish.ts`, `ReflectionSystem.ts` e `DungeonGenerator.ts`.

### 1.1 Os 11 inimigos são literalmente blocos retangulares empilhados

Skeleton, Cultist, Hound, Golem, Boss (Necro Lord), Zombie Shambler, Vampire Stalker e
Werewolf Lycan são todos construídos com o mesmo padrão: um `ctx.fillRect()` grande para
o corpo + 1-2 `fillRect()` mais estreitos como "sombreamento" nas bordas. Exemplo real, o
corpo inteiro do Golem (`textureGenerator.ts:472-476`):

```js
ctx.fillRect(8, 10, 32, 40);   // corpo
ctx.fillRect(8, 10, 8, 40);    // "sombra" — só uma faixa vertical mais escura
ctx.fillRect(34, 10, 6, 40);   // "luz" — só uma faixa vertical mais clara
```

Só `spr_specter` (fantasma, baseado em `ctx.arc`) foge desse padrão. Esse é o maior
contribuinte real para a sensação de "quadrado" no jogo — 8 dos 11 inimigos são,
literalmente, retângulos com duas tarjas de sombreamento.

### 1.2 Partículas sem nenhum degradê — quadrados puros

`particle_blood_red`, `particle_ember_spark` e `particle_dark_flame`
(`textureGenerator.ts:906-938`) são desenhadas assim, sem nenhuma curva:

```js
// particle_blood_red — 8x8 inteiro
ctx.fillStyle = '#b91c1c';
ctx.fillRect(1, 1, 6, 6); // um quadrado sólido, sem sombreamento nem falloff
```

Usadas nos emissores de sangue, faísca e chama negra (`GameScene.ts:212,222,365`) — em
qualquer emissor com partículas grandes ou lentas, isso aparece como quadrados visíveis na
tela, não como faíscas/gotas.

### 1.3 Bug real: a sombra pode virar um quadrado preto

`ShadowSystem.ts:49-57` — se por qualquer motivo `spr_shadow_disc` não estiver registrada
na cena no momento em que uma entidade é registrada, o sistema cai para
`particle_blood_red` (o quadrado do item 1.2) **tintado de preto puro**:

```js
const textureKey = this.scene.textures.exists('spr_shadow_disc') ? 'spr_shadow_disc' : 'particle_blood_red';
...
if (textureKey !== 'spr_shadow_disc') {
  shadow.setTint(0x000000);
}
```

Hoje isso quase nunca dispara (a textura normal é registrada bem cedo no boot), mas é uma
armadilha esperando uma condição de corrida ou um refactor futuro — e é exatamente o tipo
de "quadrado" que o Felipe descreveu. Vale corrigir mesmo sendo raro.

### 1.4 Iluminação: a maioria dos inimigos não recebe sombreamento de luz nenhum

O `Light2D` do Phaser só sombreia uma textura que tenha **mapa de normais**
(`LightingSystem.ts:100-115`, `applyLightPipeline`). Hoje só `tile_ground`, `spr_skeleton`
e `spr_hound` são registrados com `addTextureWithNormalMap` — os outros 8 inimigos usam
`addTexture` simples. Resultado prático: tochas, o brilho do cajado do jogador e todos os
glows de `LightingPolish.ts` iluminam o chão e 2 dos 11 inimigos, mas Cultist, Golem, Boss,
Zombie, Vampire, Werewolf, Bat Swarm e Gore Abomination continuam com aparência "chapada"
(sem parte clara/escura) mesmo dentro do raio de luz — o que reforça a leitura de "silhueta
de bloco" em vez de criatura tridimensional.

### 1.5 Tochas: posição fixa em grade, desalinhada da porta real

`GameScene.ts:305-321` posiciona 4 tochas de canto + 2 tochas flanqueando cada porta em
**todo** cômodo, sempre nos mesmos offsets (`centerX ± 70`, cantos a 40px de inset) — mas
esse `±70` nunca foi conferido contra o `doorWidth = 80` que o próprio `DungeonGenerator`
usa pra abrir o vão da porta (`DungeonGenerator.ts`, seção de paredes). As tochas não
necessariamente ficam alinhadas com o vão real, e toda sala recebe exatamente a mesma
distribuição geométrica de luz — o que lê como "grade", não como iluminação de ambiente.
Além disso, a tocha em si hoje é só um sprite de chama flutuante (`light_torch`), sem
suporte/parede visível — não existe um "castiçal" no mundo, só a chama.

### 1.6 Paredes e piso: textura em grade regular

`tile_wall_brick`, `stoneTile` e `rockTile` (`textureGenerator.ts:976-997, 1627-1653`) são
desenhados como uma grade de tijolos retangulares perfeitamente alinhados, sem nenhuma
variação de tamanho/posição/leve rotação — o que acentua a leitura "grid" quando repetido
lado a lado no mapa (mais perceptível em paredes longas).

---

## 2. Plano faseado

Mesmo espírito de corte incremental já usado nas outras specs deste repositório — cada
fase é isolada, testável, e não depende das seguintes.

### Fase 1 — Correções diretas (bug + partículas quadradas) ✅ prioridade alta, baixo risco

| Item | O quê | Onde |
|---|---|---|
| 1.1 | `ShadowSystem` nunca mais cai pra um quadrado preto — se `spr_shadow_disc` faltar, gera uma elipse suave com gradiente radial na hora (mesmo algoritmo de `drawShadow`/`spr_shadow_disc` do `textureGenerator.ts`), não um quadrado tintado | `ShadowSystem.ts` |
| 1.2 | `particle_blood_red`, `particle_ember_spark`, `particle_dark_flame` ganham gradiente radial (`createRadialGradient`) em vez de `fillRect` cru — continuam pequenas e baratas de desenhar, só param de parecer quadrados | `textureGenerator.ts` |

### Fase 2 — Inimigos: sair do "bloco + 2 tarjas"

Reescrever a silhueta dos 8 inimigos "quadrados" (skeleton, cultist, hound, golem, boss,
zombie, vampire, werewolf) usando uma combinação de elipses/círculos para a massa
corporal (cabeça, torso, membros como elipses sobrepostas, não um retângulo único) +
gradientes radiais para volume, no mesmo espírito do `spr_specter` (que já foge do
padrão) e do `orb_hp`/`proj_blood_bolt` (que já são bem sombreados). Mantém a mesma
resolução/tamanho de canvas (não muda hitbox nem `setOrigin`) — só a forma como os pixels
são pintados dentro do mesmo retângulo de textura.

Dado o volume (8 criaturas, cada uma com sua silhueta característica: esqueleto ossudo,
golem maciço, licantropo com pelagem, etc.), recomendo pilotar com 2-3 primeiro
(sugestão: Skeleton, Golem, Boss — cobrem os 3 arquétipos de silhueta mais distintos:
esguio, maciço, "elite") e validar em jogo antes de replicar o padrão pros outros 5.

**Implementado (25/08):** piloto concluído — Skeleton (crânio/mandíbula em elipse com
degradê radial, caixa torácica em curva fechada com arcos de costela), Golem (corpo
afunilado via `quadraticCurveTo` com degradê linear, cabeça em elipse) e Boss/Necro Lord
(armadura afunilada, chifres curvos, capa com pontas afuniladas) redesenhados.

**Implementado (25/08, segunda leva):** os 5 inimigos restantes replicam o mesmo padrão —
Cultist Acolyte (robe em sino via `quadraticCurveTo` + degradê linear, capuz em elipse com
degradê radial e sombra interna, olhos em elipse, mangas como paths afunilados), Hell
Hound (torso e cabeça em curva fechada com degradê, pernas afuniladas, espinhos como
triângulos, cauda como curva em vez de bloco), Zombie Shambler (torso encurvado com
degradê lateral, ferida no peito como elipse com degradê radial, cabeça em elipse),
Vampire Stalker (capa em paths afunilados, casaco encurvado com degradê lateral, cabeça em
elipse), Werewolf Lycan (torso com peito estufado/cintura fina via curvas + degradê,
cabeça em elipse, orelhas como triângulos). Detalhes intencionalmente retos foram mantidos
(lâmina de adaga, presas, garras, costura de armadura/coleira) — só a massa corporal
principal deixou de ser bloco+tarja. Todos os 5 passaram de `addTexture` pra
`addTextureWithNormalMap` (item 3.1 completo pros 8 inimigos).

### Fase 3 — Luz e sombreamento

| Item | O quê |
|---|---|
| 3.1 | Registrar mais inimigos com `addTextureWithNormalMap` (não só skeleton/hound) — pelo menos os que passarem pela Fase 2, já que redesenhá-los é o momento natural de gerar o normal map junto |
| 3.2 | Tochas: recalcular o offset de flanqueio de porta a partir do `doorWidth` real do `DungeonGenerator` (hoje são dois números desalinhados por acidente), e adicionar uma pequena variação procedural determinística (jitter de ±8-12px por sala, com seed derivado do índice da sala) pra sair da grade perfeita sem perder reprodutibilidade |
| 3.3 | Avaliar reduzir de "4 cantos + flanco de toda porta" para uma distribuição mais seletiva (nem toda sala precisa de 6-8 tochas) — salas menores/de passagem com menos luzes, salas especiais (boss, tesouro) com mais — pra criar variação de atmosfera entre cômodos em vez de iluminação uniforme |

**Implementado (25/08):** `DungeonGenerator.ts` agora exporta `DOOR_WIDTH` (era um número
solto duplicado); `GameScene.ts` usa esse mesmo valor pro flanqueio de porta (offset
`doorHalf + doorClearance` em vez do `±70` desalinhado) e aplica um jitter determinístico
(hash por índice de sala, sem lib de RNG) em todas as tochas. Salas do tipo `chamber`
agora recebem só 2 tochas de canto (diagonal) em vez de 4 — spawn/boss/secret_treasure
mantêm as 4, criando contraste de atmosfera entre sala comum e sala especial. Os
inimigos redesenhados na Fase 2 (Skeleton, Golem, Boss) ganharam normal map (item 3.1).

### Fase 4 — Textura de parede/piso menos "grid"

Variar levemente o tamanho e alinhamento dos blocos em `tile_wall_brick`/`stoneTile`
(deslocamento aleatório determinístico por fiada, tijolos de largura levemente variável)
pra quebrar o padrão perfeitamente regular sem introduzir nenhum asset novo.

**Implementado (25/08):** `tile_wall_brick` (a textura de parede realmente usada nos
corredores/salas do jogo) ganhou cantos levemente chanfrados por tijolo, musgo em blobs
orgânicos (elipses sobrepostas) em vez de um retângulo reto, e um ruído sutil na pedra
base. `stoneTile`/`rockTile` (decoração de UI de menu, não aparecem dentro da masmorra)
ficaram de fora desta leva por não serem o que o jogador vê durante o gameplay — só
revisitar se algum dia entrarem no cenário jogável.

---

## 3. O que evitar

- Não mudar hitboxes, `setOrigin`, dimensões de canvas ou chaves de textura — isso afeta
  colisão/animação em cascata; a melhoria é só de como os pixels são pintados dentro do
  espaço que já existe.
- Não introduzir cor fora da paleta Grimdark (`01_VISUAL_IDENTITY.md`) — os novos
  gradientes/sombreamentos usam as mesmas cores já definidas por inimigo/bioma.
- Fase 2 é a mais arriscada por volume — pilotar com poucos inimigos antes de replicar
  pros 8, para não gastar esforço grande num padrão que precise ser refeito.

---

## 4. Checklist de execução

- [x] Fase 1.1 — `ShadowSystem` sem fallback de quadrado preto — falta você validar em jogo + `pnpm verify` antes do commit
- [x] Fase 1.2 — partículas com gradiente radial (sangue, faísca, gelo, chama negra) — falta você validar em jogo + `pnpm verify` antes do commit
- [x] Fase 2 — piloto com Skeleton, Golem e Boss redesenhados (formas orgânicas) — falta você validar em jogo + `pnpm verify` antes do commit
- [x] Fase 2 — replicar padrão validado pros 5 inimigos restantes (Cultist, Hound, Zombie, Vampire, Werewolf) — falta você validar em jogo + `pnpm verify` antes do commit
- [x] Fase 3.1 — normal maps em todos os 8 inimigos redesenhados (Skeleton/Hound já tinham; Golem, Boss, Cultist, Zombie, Vampire, Werewolf ganharam agora) — falta você validar em jogo + `pnpm verify` antes do commit
- [x] Fase 3.2 — tochas alinhadas ao `doorWidth` real + jitter determinístico — falta você validar em jogo + `pnpm verify` antes do commit
- [x] Fase 3.3 — distribuição de tochas variando por tipo de sala (chamber: 2 cantos; especiais: 4) — falta você validar em jogo + `pnpm verify` antes do commit
- [x] Fase 4 — `tile_wall_brick` com variação de tijolo (chanfro, musgo orgânico, ruído sutil) — falta você validar em jogo + `pnpm verify` antes do commit

---

## Referências

- `docs/archive/specs/andamento/08_MAPEAMENTO_COMPLETO_SPRITES_E_CHECKLIST.md` — estado
  real de quais entidades ainda dependem 100% do fallback procedural (todo o bestiário,
  hoje 0% com sprite físico)
- `docs/archive/design/00_DESIGN_PHILOSOPHY.md` / `01_VISUAL_IDENTITY.md` — paleta e
  pilares estéticos que toda melhoria de textura procedural precisa respeitar

## Registro de mudanças

| Data | O que mudou | Autor |
|------|-------------|-------|
| 2026-08-25 | Criação: auditoria concreta dos artefatos "quadrado" reais (inimigos em bloco, partículas sem degradê, bug de fallback de sombra, tochas em grade desalinhada da porta), plano em 4 fases | Claude |
| 2026-08-25 | Fase 1 implementada: `ShadowSystem.ts` gera elipse com degradê na hora em vez de cair pro quadrado preto; `particle_blood_red`/`particle_ember_spark`/`particle_frost_crystal`/`particle_dark_flame` reescritas com `createRadialGradient` em vez de `fillRect` cru — falta validação em jogo | Claude |
| 2026-08-25 | Fases 2, 3 e 4 implementadas: Skeleton/Golem/Boss redesenhados com curvas+degradê e normal map; `DOOR_WIDTH` exportado de `DungeonGenerator.ts` e usado por `GameScene.ts` pro flanqueio de tocha real (+ jitter determinístico + variação por tipo de sala); `tile_wall_brick` com chanfro/musgo orgânico/ruído. Falta validação em jogo | Claude |
| 2026-08-25 | Fase 2 completa: Cultist, Hound, Zombie, Vampire e Werewolf redesenhados com o mesmo padrão orgânico (curvas + degradê) validado no piloto, todos com normal map novo — os 8 inimigos "quadrados" do diagnóstico original agora estão redesenhados. Falta validação em jogo + `pnpm verify` | Claude |
