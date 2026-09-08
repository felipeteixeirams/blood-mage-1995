---
agent_context: frontend, game designer
target_module: src/components/GameplayHUD.tsx, src/components/hud, src/game/scenes/GameScene.ts
priority: medium
criticality: medium
status: delivered
last_updated: 2026-09-08
tags: [design, ui, hud, referencia-visual, diablo2, dungeon-siege-1, mobile, combat-dynamics]
---

> **Separado de `backlog/09_HUD_REFERENCIAS_VISUAIS_DIABLO_DUNGEON_SIEGE.md`
> em 2026-09-08** durante a padronização das specs: o Tier A desta frente
> (4 fases) já estava com o código 100% escrito desde 2026-08-25, só
> faltando QA manual — mantê-lo em `backlog/` (que por definição é "0% de
> código") estava incorreto. `backlog/09` continua existindo, mas reduzido
> ao residual real ainda não iniciado (Tier B.6). Tier C segue
> explicitamente fora de escopo (depende de sprites customizados).

# 🖥️ HUD de Gameplay & Dinâmica de Combate: Diretrizes Diablo II & Dungeon Siege 1 (Tier A)

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

## 2. Cruzamento com o estado real do HUD (na época da criação desta spec)

| Zona | Implementação atual | Imagem 1 | Imagem 2 | Veredito |
|---|---|---|---|---|
| Vida/Mana | Barra retangular horizontal, canto superior esquerdo (`PlayerStatus.tsx`) | Barra compacta sob retrato, topo-esquerda | Orbe circular líquido, rodapé | **Decidido (25/08):** forma continua retangular (sem orbe) e posição continua no topo-esquerda (sem mover pro rodapé). Único ganho é de acabamento — ver Tier A.3 |
| Minimap | **Não existia.** `minimapVisible`/`minimapAlpha` eram settings persistidos em `localStorage.ts`/`SettingsScene.ts` sem nenhum componente que os lesse | Bússola circular, topo-direita | Não aparece | Construído — fecha o gap dos settings mortos |
| Alvo em combate | `TargetFrame.tsx` já existia: nome, nível, barra de HP do inimigo no topo-centro (estilo WoW/Diablo) | — | — | Já resolvido, nenhuma mudança necessária |
| Skills | Arco circular com drag-to-aim, canto inferior direito (`SkillsOverlay.tsx`) | Hotbar quadrada pequena | Slots numerados 1–6 | Já bem servidos, nenhuma mudança necessária |
| Curativos | 3 botões dentro do painel topo-esquerda, junto ao HP/mana | Não aparece | Cinturão de poções no rodapé, numerado | Unificado visualmente como cinturão nesta frente |
| Indicador de NPC/quest | Prompt textual "aperte E para conversar" quando o jogador está perto | Não aparece | Ícone "!" roxo brilhante flutuando sobre o NPC | Construído com `Phaser.Graphics`/`Phaser.Text`, sem sprite novo |

---

## 3. Tier A — Entregue (zero sprites novos, CSS/SVG/`Phaser.Graphics` apenas)

1. **Marcador flutuante sobre NPCs interagíveis.** Glifo "!" desenhado com
   `Phaser.Graphics` (círculo + glow) e `Phaser.Text`, na cor roxa da referência,
   ancorado acima do NPC (mesmo pivô usado hoje para nomes/labels).
2. **Minimap mínimo funcional**, canto superior direito. Retângulo simples
   renderizado a partir das coordenadas de `this.rooms` que a
   `DungeonGenerator` já produz — salas exploradas preenchidas, não
   exploradas escuras, um ponto para o jogador e um ponto dourado por baú
   não saqueado. Sincronizado via Zustand no padrão "valor + versão"
   (`docs/architecture/06_PHASER_REACT_BRIDGE_MIGRATION.md`).
3. **HP/Mana: acabamento entalhado, sem virar orbe.** Moldura dupla,
   textura sutil de metal batido (`repeating-linear-gradient` discreto),
   rebites/parafusos decorativos nos cantos, brilho líquido reforçado
   (gradiente `#990000 → #ef4444`) com pulso quando o HP está crítico.
4. **Cinturão visual unificado dos 3 botões de curativo** — moldura única
   (como um slot de poção) em vez de 3 botões soltos lado a lado.

## 4. Plano de execução (como foi entregue)

| Fase | Escopo | Arquivos principais | Critério de aceite |
|---|---|---|---|
| 1 | Marcador "!" sobre NPC interagível | `GameScene.ts` (`createNpcMarker`/`clearNpcMarkers`), `DungeonFlowController.ts` (spawn dos 4 NPCs) | Marcador visível a média distância, some ao entrar em diálogo, sem custo de frame perceptível |
| 2 | Minimap mínimo | `gameStore.ts` (`minimapRooms`/`setMinimapRooms` + teste), `GameScene.ts` (`initMinimap`/`pushMinimapSnapshot`, throttle de ~400ms em `update()`), `DungeonFlowController.ts` (chama `initMinimap` após gerar as salas), `hud/Minimap.tsx`, `GameplayHUD.tsx` (integra no painel topo-direita) | Salas exploradas aparecem preenchidas, jogador e baús marcados, liga/desliga respeita `minimapVisible`/`minimapAlpha` já existentes |
| 3 | Acabamento entalhado da barra de HP/MP (sem virar orbe) | `PlayerStatus.tsx` | Mesma posição e mesma forma retangular, moldura/textura/rebites novos, pulso de HP crítico funcionando |
| 4 | Cinturão visual de curativos | `PlayerStatus.tsx` (`CURATIVE_SLOTS`) | Moldura única visível, atalhos `Z`/`X`/`V` inalterados |

---

## 5. O que evitar (guardrails desta frente)

- Não copiar a estética "high-fantasy 3D colorida" — contraria diretamente
  `docs/archive/design/00_DESIGN_PHILOSOPHY.md`.
- Não introduzir cor viva/saturada fora da paleta Grimdark de
  `docs/archive/design/01_VISUAL_IDENTITY.md`.
- **Nunca usar orbe circular para HP/mana** — decisão explícita do Felipe
  (25/08), vale para qualquer fase futura.

---

## 6. Validação

```
✅ tsc --noEmit: zero erros
✅ vite build: sucesso
```

**Ainda dependente de QA manual (Felipe jogar), não de código:**
- [ ] Confirmar visualmente marcador "!", minimap, acabamento HP/MP e
  cinturão de curativos em jogo real (não só headless/testes).

---

## Referências

- `docs/archive/design/00_DESIGN_PHILOSOPHY.md` — pilares estéticos
- `docs/archive/design/01_VISUAL_IDENTITY.md` — paleta Grimdark
- `docs/archive/design/02_UI_PATTERNS.md` — regras de composição de UI
- `docs/architecture/06_PHASER_REACT_BRIDGE_MIGRATION.md` — padrão "valor + versão"
- [[../backlog/09_HUD_REFERENCIAS_VISUAIS_DIABLO_DUNGEON_SIEGE.md]] — residual Tier B.6 ainda em backlog

## Registro de mudanças

| Data | O que mudou | Autor |
|------|-------------|-------|
| 2026-08-25 | Criação: análise crítica das 2 referências visuais, cruzamento com o HUD atual, plano incremental em 4 fases (Tier A) | Claude |
| 2026-08-25 | Ajuste por decisão do Felipe: descartado o orbe circular de HP/mana; Tier A.3 reescrito para elevar o acabamento da barra retangular existente | Claude |
| 2026-08-25 | Decidido: indicadores de vida/mana/curativos continuam no canto superior esquerdo | Claude |
| 2026-08-25 | Fase 3 implementada: `PlayerStatus.tsx` ganhou moldura forjada e pulso vermelho quando HP ≤ 25% | Claude |
| 2026-08-25 | Fases 1, 2 e 4 implementadas: marcador "!" procedural, minimap mínimo 3x3 via Zustand, cinturão único de curativos. Tier A completo — falta validação em jogo | Claude |
| 2026-08-31 | Registro das Diretrizes Definitivas de Design (Felipe) | Antigravity |
| 2026-09-08 | Movido de `backlog/09` para `delivered/09` — Tier A já estava com código 100% escrito, só faltando QA manual; residual (Tier B.6) permanece em `backlog/09` | Claude |
