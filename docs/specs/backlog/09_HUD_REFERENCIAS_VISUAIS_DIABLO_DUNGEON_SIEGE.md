---
agent_context: frontend, game designer
target_module: src/components/GameplayHUD.tsx, src/components/hud, src/game/scenes/GameScene.ts
priority: media
status: implementado (Tier A completo, validado)
last_updated: 2026-08-31
tags: [design, ui, hud, referencia-visual, diablo2, dungeon-siege-1, mobile, combat-dynamics]
---

# 🖥️ HUD de Gameplay & Dinâmica de Combate: Diretrizes Diablo II & Dungeon Siege 1

> **Diretrizes Definitivas de Referência (Alinhamento de Produto):**
> 1. **Visual & Fidelidade Gráfica:** A referência primária de arte é **Diablo II** (tom gótico sombrio, atmosfera pesada noventista, paleta austera e fidelidade de pixel-art/2.5D visceral). *Diablo 1 não é a referência principal.*
> 2. **Estrutura de HUD (Status Bars):** A referência de interface é **Dungeon Siege 1** (barras de vida e mana horizontais, estruturadas sob o retrato no topo-esquerdo). **É terminantemente proibido o uso de esferas/orbes circulares de vida/mana estilo Diablo.**
> 3. **Dinâmica de Combate & Esquiva Ativa:** A movimentação e o combate seguem o dinamismo de **Dungeon Siege 1** com a estética de **Diablo II**:
>    - Ao iniciar um ataque ou conjuração, o personagem e os inimigos comprometem-se com a animação (FSM `Windup` -> `Strike` -> `Recovery`).
>    - **A esquiva é manual e espacial:** Cabe exclusivamente à habilidade motora do jogador movimentar o personagem para o lado, desviando ativamente da trajetória de flechas, orbes e feitiços inimigos (sem depender de rolagem estatística passiva/RNG de "Dodge %").

---

## 1. Análise crítica das referências

### Imagem 1 — estilo *Dungeon Siege 1* (combate tático, barras estruturadas, esquiva espacial)

Dungeon Siege 1 traz uma interface limpa com barras de status horizontais integradas ao retrato do personagem, além de uma dinâmica de combate onde o posicionamento espacial e a leitura dos disparos no cenário determinam o sucesso do jogador. Pontos adotados:

- **Retratos com barras de vida/mana horizontais** no canto superior esquerdo (`PlayerStatus.tsx`) — barras compactas, entalhadas em metal/pedra com moldura forjada gótica.
- **Esquiva Cinética Ativa**: Projéteis e magias possuem caixas de colisão físicas precisas no mundo, exigindo que o jogador se mova ativamente para sair da linha de tiro.
- **Minimap no topo-direito**: Representação geométrica e limpa das salas exploradas da masmorra.

### Imagem 2 — estilo *Diablo II* (fidelidade visual, atmosfera sombria, cinturão de atalhos)

Diablo II define o padrão de opressão visual, paleta grimdark, iluminação rústica e fluidez de combate de ação. Pontos adotados:

- **Estética & Paleta Gótica**: Tons de cinza, ferro, pedra gótica, fogo de tochas e rubro infernal.
- **Cinturão de curativos com atalhos**: Slots organizados (`Z`/`X`/`V` em `PlayerStatus.tsx`) com feedback claro de recarga.
- **Marcador flutuante sobre NPCs**: Glifo procedural roxo/rúnico acima de Maelen e NPCs interagíveis para identificação rápida.
- ❌ **Orbes Circulares de Vida/Mana**: **Descartados permanentemente por decisão de design.** O jogo mantém o padrão de barras retangulares do Dungeon Siege 1.

---

## 2. Cruzamento com o estado real do HUD hoje

| Zona | Implementação atual | Imagem 1 | Imagem 2 | Veredito |
|---|---|---|---|---|
| Vida/Mana | Barra retangular horizontal, canto superior esquerdo (`PlayerStatus.tsx`) | Barra compacta sob retrato, topo-esquerda | Orbe circular líquido, rodapé | **Decidido (25/08):** forma continua retangular (sem orbe) e posição continua no topo-esquerda (sem mover pro rodapé). Único ganho é de acabamento — ver Tier A.3 |
| Minimap | **Não existe.** `minimapVisible`/`minimapAlpha` são settings persistidos em `localStorage.ts`/`SettingsScene.ts` sem nenhum componente que os leia | Bússola circular, topo-direita | Não aparece | Vale construir um minimap mínimo agora — zero dependência de sprite, e fecha um gap de settings mortos |
| Alvo em combate | `TargetFrame.tsx` já existe: nome, nível, barra de HP do inimigo no topo-centro (estilo WoW/Diablo) | — | — | Já resolvido, nenhuma mudança necessária |
| Menu contextual de alvo | Inexistente — clique/toque já ataca direto | Texto contextual junto ao cursor | Não aparece | Valor real só em desktop com mouse; no touch (nosso público mobile-first) já resolvemos com tap direto. Baixa prioridade |
| Skills | Arco circular com drag-to-aim, canto inferior direito (`SkillsOverlay.tsx`) — já citado no próprio código como "Diablo-like arc layout" | Hotbar quadrada pequena | Slots numerados 1–6 | Já bem servidos, nenhuma mudança necessária |
| Curativos | 3 botões dentro do painel topo-esquerda, junto ao HP/mana | Não aparece | Cinturão de poções no rodapé, numerado | Se movermos HP/mana para o rodapé no futuro (Tier B), os curativos migram junto formando um cinturão único |
| Indicador de NPC/quest | Prompt textual "aperte E para conversar" quando o jogador está perto | Não aparece | Ícone "!" roxo brilhante flutuando sobre o NPC | Fácil de fazer com `Phaser.Graphics`/`Phaser.Text`, sem sprite novo — melhora a legibilidade à distância, hoje só se percebe a proximidade quando já está quase em cima |
| Contratos/missões ativas | `ContractHUD.tsx`, painel retrátil no topo-direita | — | — | Já resolvido, nenhuma mudança necessária |

---

## 3. O que faz sentido adotar — organizado por dependência de asset

### Tier A — Fazível agora, zero sprites novos (CSS/SVG/`Phaser.Graphics` apenas)

1. **Marcador flutuante sobre NPCs interagíveis.** Um glifo "!" desenhado com
   `Phaser.Graphics` (círculo + glow) e `Phaser.Text`, na cor roxa da referência,
   ancorado acima do NPC (mesmo pivô usado hoje para nomes/labels). Reforça — não
   substitui — o prompt textual existente, dando legibilidade a distância.
2. **Minimap mínimo funcional**, canto superior direito. Não precisa ser um radar
   pixel-perfeito: um retângulo simples renderizado em Canvas/SVG a partir das
   coordenadas de `this.rooms` que a `DungeonGenerator` já produz — salas exploradas
   preenchidas, não exploradas escuras, um ponto para o jogador e um ponto dourado por
   baú não saqueado. Sincronizado via Zustand no mesmo padrão "valor + versão" já
   validado no item 9 (`docs/architecture/06_PHASER_REACT_BRIDGE_MIGRATION.md`). Isso
   também fecha o gap dos settings `minimapVisible`/`minimapAlpha`, que hoje existem no
   `SettingsModal` sem nenhum efeito real.
3. **HP/Mana: elevar o acabamento da barra retangular atual, sem virar orbe.** Felipe
   pediu explicitamente para não usar o orbe circular do Diablo — mantemos a barra
   horizontal como forma, mas com um tratamento mais "entalhado em ferro/osso": moldura
   dupla (já existe uma versão simples disso), textura sutil de metal batido no fundo
   (`repeating-linear-gradient` bem discreto), rebites/parafusos decorativos nos cantos
   da moldura (pequenos círculos com sombra, no mesmo espírito das "cantoneiras douradas"
   já usadas nos modais), e um brilho líquido mais pronunciado na barra de HP (reforço do
   gradiente `#990000 → #ef4444` já existente com uma leve animação de "pulso" quando o
   HP está crítico, reaproveitando o padrão de urgência que já existe em outros lugares
   do HUD). Tudo em CSS puro, mesma posição, mesma leitura de `hpPercent`/`manaPercent`.
4. **Unificar visualmente os 3 botões de curativo como "cinturão"** — hoje já são uma
   fileira funcional; falta só uma moldura única (como um slot de poção) em vez de 3
   botões soltos lado a lado.

### Tier B — Depende de decisão de produto (ergonomia, testar antes de comprometer)

> **Atualização (25/08):** o item 5 (mover HP/mana/curativos pro rodapé) foi decidido e
> descartado — os indicadores continuam no topo-esquerda. Resta só o item 6 em aberto.

5. ~~Mover vida/mana/curativos do topo-esquerda para o rodapé~~ — **descartado por
   decisão do Felipe (25/08).** Os indicadores continuam no canto superior esquerdo; o
   ganho aqui é só de acabamento visual (Tier A.3 / Fase 3), sem mudança de posição ou
   de ergonomia. Item mantido riscado só como registro histórico da ideia avaliada.
6. **Menu contextual "ENGAGE / ATACAR / MIRAR MAIS PRÓXIMO"** ao passar o mouse sobre um
   alvo. Só tem valor real em desktop com mouse — no touch já resolvemos com tap direto.
   Baixa prioridade dado o público mobile-first do projeto (ver
   `docs/archive/specs/propostas/04_MOBILE_APP_E_MONETIZACAO_INDIE.md`).

### Tier C — Só faz sentido quando houver sprites customizados (fora do escopo desta spec)

- Trocar a moldura CSS entalhada da barra de HP/MP por uma moldura pintada à mão
  (bezel de metal/osso ilustrado) — mantendo a forma de barra, nunca virando orbe.
- Ícones de item/poção desenhados à mão em vez dos emojis/ícones `lucide-react` atuais.
- Sprite dedicado para o marcador de NPC em vez do glifo procedural do Tier A.1.

---

## 4. Plano incremental de execução (Tier A)

Mesma filosofia de corte incremental usada em `05_GAMESCENE_REFACTOR.md` e
`06_PHASER_REACT_BRIDGE_MIGRATION.md`: cada fase é isolada, testável e não quebra a
anterior.

| Fase | Escopo | Arquivos principais | Critério de aceite |
|---|---|---|---|
| 1 | Marcador "!" sobre NPC interagível | `GameScene.ts` (`createNpcMarker`/`clearNpcMarkers`), `DungeonFlowController.ts` (spawn dos 4 NPCs) | Marcador visível a média distância, some ao entrar em diálogo, sem custo de frame perceptível |
| 2 | Minimap mínimo | `gameStore.ts` (`minimapRooms`/`setMinimapRooms` + teste), `GameScene.ts` (`initMinimap`/`pushMinimapSnapshot`, throttle de ~400ms em `update()`), `DungeonFlowController.ts` (chama `initMinimap` após gerar as salas), novo `hud/Minimap.tsx`, `GameplayHUD.tsx` (integra no painel topo-direita) | Salas exploradas aparecem preenchidas, jogador e baús marcados, liga/desliga respeita `minimapVisible`/`minimapAlpha` já existentes |
| 3 | Acabamento entalhado da barra de HP/MP (sem virar orbe) | `PlayerStatus.tsx` | Mesma posição e mesma forma retangular, moldura/textura/rebites novos, pulso de HP crítico funcionando |
| 4 | Cinturão visual de curativos | `PlayerStatus.tsx` (`CURATIVE_SLOTS`) | Moldura única visível, atalhos `Z`/`X`/`V` inalterados |

**Implementado (25/08):** as 4 fases foram codificadas nesta sessão. Falta a validação
manual em jogo (ver seção 7) antes do commit final.

Cada fase segue o padrão já validado no projeto: implementação, `pnpm verify`, validação
manual em jogo, commit isolado — sem acumular mudanças de fases diferentes no mesmo
commit.

---

## 5. O que evitar

- Não copiar a estética "high-fantasy 3D colorida" da imagem 1 — contraria diretamente
  `00_DESIGN_PHILOSOPHY.md` (opressão visual, terror orgânico, pátina CRT de 1995).
- Não introduzir cor viva/saturada fora da paleta Grimdark de `01_VISUAL_IDENTITY.md`
  (`#171309`, `#990000`, `#b8860b`, `#e3dac9`, preto) — inclusive o glow roxo do
  marcador de NPC (Tier A.1) deve ser ajustado para um tom compatível com a paleta, não
  copiado literalmente da referência.
- Qualquer elemento novo deve seguir `02_UI_PATTERNS.md`: tipografia restrita
  (`Cinzel`/`Press Start 2P`/`VT323`/`UnifrakturMaguntia`), bordas douradas espessas,
  fundo escuro semi-transparente, transições sutis via Framer Motion.
- Não comprometer o Tier B (mover HP/mana pro rodapé) sem prototipar — é a mudança de
  maior risco de regressão de usabilidade em mobile desta spec.
- **Não usar orbe circular para HP/mana em nenhuma fase** — decisão explícita do Felipe
  (25/08). HP/mana continuam em forma de barra retangular, mesmo se movidos de posição
  no Tier B.

---

## 6. Checklist de execução

- [x] Fase 1 — marcador "!" sobre NPC interagível — falta você validar em jogo + `pnpm verify` antes do commit
- [x] Fase 2 — minimap mínimo (substitui settings mortos `minimapVisible`/`minimapAlpha`) — falta você validar em jogo + `pnpm verify` antes do commit
- [x] Fase 3 — acabamento entalhado da barra de HP/MP (sem orbe) — falta você validar em jogo + `pnpm verify` antes do commit
- [x] Fase 4 — cinturão visual de curativos — falta você validar em jogo + `pnpm verify` antes do commit
- [x] Tier B.5 avaliado e decidido — descartado, HP/mana/curativos continuam no topo-esquerda
- [ ] Tier B.6 (menu contextual de mouse) — ainda em aberto, baixa prioridade
- [ ] Tier C revisitado quando houver sprites customizados de UI

---

## Referências

- `docs/archive/design/00_DESIGN_PHILOSOPHY.md` — pilares estéticos que toda mudança de
  HUD precisa respeitar
- `docs/archive/design/01_VISUAL_IDENTITY.md` — paleta Grimdark
- `docs/archive/design/02_UI_PATTERNS.md` — regras de composição de UI
- `docs/architecture/06_PHASER_REACT_BRIDGE_MIGRATION.md` — padrão "valor + versão" a
  reaproveitar na sincronização do minimap (Fase 2)
- `docs/archive/specs/propostas/04_MOBILE_APP_E_MONETIZACAO_INDIE.md` — prioridade
  mobile-first que pesa contra o menu contextual de mouse (Tier B.6)
- `docs/archive/specs/andamento/08_MAPEAMENTO_COMPLETO_SPRITES_E_CHECKLIST.md` — estado
  real dos sprites físicos pendentes (nenhum item deste documento depende deles)

## Registro de mudanças

| Data | O que mudou | Autor |
|------|-------------|-------|
| 2026-08-25 | Criação: análise crítica das 2 referências visuais trazidas por Felipe, cruzamento com o HUD atual, plano incremental em 4 fases (Tier A) executável sem sprites novos | Claude |
| 2026-08-25 | Ajuste por decisão do Felipe: descartado o orbe circular de HP/mana no estilo Diablo; Tier A.3 e Fase 3 reescritos para elevar o acabamento da barra retangular existente em vez de trocar a forma | Claude |
| 2026-08-25 | Decidido: indicadores de vida/mana/curativos continuam no canto superior esquerdo (Tier B.5 descartado) — escopo fecha em melhoria de acabamento visual, sem mudança de posição | Claude |
| 2026-08-25 | Fase 3 implementada: `PlayerStatus.tsx` ganhou moldura forjada (textura de metal batido + rebites de canto + highlight superior) nas barras de HP/MP e pulso vermelho quando HP ≤ 25%. Mesma posição, mesma forma retangular — falta validação em jogo | Claude |
| 2026-08-25 | Fases 1, 2 e 4 implementadas: marcador "!" procedural sobre os 4 NPCs (bob + some em diálogo); minimap mínimo 3x3 sincronizado via Zustand (`minimapRooms`, throttle ~400ms, teste em `gameStore.test.ts`) substituindo os settings mortos; cinturão único de curativos com a mesma moldura forjada da Fase 3. Tier A da spec completo — falta validação em jogo | Claude |
| 2026-08-31 | Registro das Diretrizes Definitivas de Design (Felipe): 1) Visual/atmosfera baseado estritamente em Diablo II (e não Diablo 1); 2) HUD com barras de status horizontais estruturadas no estilo Dungeon Siege 1 (proibido o uso de esferas/orbes); 3) Combate dinâmico e esquiva espacial ativa/manual (desvio motor de projéteis/feitiços) alinhado ao Dungeon Siege 1. | Antigravity |

