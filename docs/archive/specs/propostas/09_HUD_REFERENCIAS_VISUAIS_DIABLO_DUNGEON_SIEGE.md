---
agent_context: frontend, game designer
target_module: src/components/GameplayHUD.tsx, src/components/hud, src/game/scenes/GameScene.ts
priority: media
status: proposta
last_updated: 2026-08-25
tags: [design, ui, hud, referencia-visual, diablo, dungeon-siege, mobile]
---

# 🖥️ HUD de Gameplay: Análise de Referências Visuais e Plano de Evolução Sem Sprites Novos

> Felipe trouxe 2 prints de jogos de referência (um no estilo *Dungeon Siege*, outro no
> estilo *Diablo II*) para inspirar melhorias no HUD de gameplay do Bloodmage 1995. Este
> documento analisa criticamente cada referência, cruza com o estado real do código e com
> a identidade visual já definida (`docs/archive/design/`), e propõe uma spec incremental
> **executável hoje, sem depender da criação de sprites novos** — só CSS/Tailwind, SVG e
> `Phaser.Graphics`/`Phaser.Text` procedural, seguindo o mesmo espírito de "rede de
> segurança sem asset físico" já usado em `textureGenerator.ts`.

---

## 1. Análise crítica das referências

### Imagem 1 — estilo *Dungeon Siege* (aldeia com moinho d'água, combate tático)

Ambientação 3D em tempo real, aldeia rústica com moinho d'água e cachoeira, luz quente
de tocha e forja cruzando com o azul frio da água — um bom exemplo de contraste de
iluminação, mas a fidelidade 3D e a paleta viva (verdes de grama, azuis de água, marrons
claros de madeira) contrariam diretamente o pilar "Opressão Visual" descrito em
`00_DESIGN_PHILOSOPHY.md`. Essa imagem não deve ser lida como referência de paleta ou de
iluminação — só de **mecânica de UI**. Dela, três ideias são transferíveis:

- **Retratos de grupo empilhados** no canto superior esquerdo, cada um com barra de vida
  compacta embaixo — já temos o equivalente (um só personagem, em `PlayerStatus.tsx`).
- **Menu contextual de ação** junto ao cursor (`ENGAGE` / `ATTACK FREELY` / `TARGET
  CLOSEST`) ao passar sobre um inimigo — não temos equivalente hoje. É a ideia mais nova
  dessa imagem, mas só faz sentido para mouse/desktop.
- **Minimap circular** (bússola/radar) no canto superior direito — não temos nenhum
  minimap real hoje, apesar de já existir um *setting* morto para isso (ver seção 2).
- A hotbar quadrada pequena no canto inferior direito é estruturalmente mais pobre do que
  o que já temos (arco de skills estilo Diablo com drag-to-aim) — nada a copiar aqui.

### Imagem 2 — estilo *Diablo II* (vilarejo, NPC de missão, orbes)

Orbes de vida (vermelho, com caveira) e mana (azul) nos cantos inferiores da tela, com
preenchimento líquido animado; cinturão de poções numeradas ao lado do orbe de mana;
barra de skills central com 6 slots numerados; ícone de exclamação roxo brilhante
flutuando sobre o NPC de missão; paleta terrosa, pedra e tocha. Essa referência está
**muito mais alinhada** com a nossa própria inspiração declarada (`01_VISUAL_IDENTITY.md`
cita *Diablo I* explicitamente) do que a imagem 1. Pontos transferíveis:

- **Orbes líquidos de vida/mana** — hoje usamos barras retangulares horizontais no canto
  superior esquerdo, não orbes circulares.
- **Cinturão de poções numerado** — conceito muito próximo do que já existe (curativos com
  atalhos `Z`/`X`/`V` em `PlayerStatus.tsx`), só que posicionado no rodapé em vez de junto
  ao HP/mana no topo.
- **Marcador flutuante sobre NPC de missão** — não temos nenhum indicador visual no mundo
  hoje, só um prompt textual quando o jogador se aproxima (`GameplayHUD.tsx`, bloco
  `closestNPCType && !activeNPC`).

---

## 2. Cruzamento com o estado real do HUD hoje

| Zona | Implementação atual | Imagem 1 | Imagem 2 | Veredito |
|---|---|---|---|---|
| Vida/Mana | Barra retangular horizontal, canto superior esquerdo (`PlayerStatus.tsx`) | Barra compacta sob retrato, topo-esquerda | Orbe circular líquido, rodapé | Orbe é esteticamente mais fiel ao Diablo I que já é nossa referência — mas mover para o rodapé é uma mudança de ergonomia à parte (ver Tier B) |
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
3. **HP/Mana como "orbe" circular em CSS puro** (gradiente radial + `clip-path` circular
   + borda dourada entalhada, reaproveitando exatamente a paleta de
   `01_VISUAL_IDENTITY.md`), mantendo a posição atual no canto superior esquerdo. Ganho
   estético alinhado à nossa própria referência (Diablo I) sem mexer em ergonomia mobile.
4. **Unificar visualmente os 3 botões de curativo como "cinturão"** — hoje já são uma
   fileira funcional; falta só uma moldura única (como um slot de poção) em vez de 3
   botões soltos lado a lado.

### Tier B — Depende de decisão de produto (ergonomia, testar antes de comprometer)

5. **Mover vida/mana/curativos do topo-esquerda para o rodapé** (estilo cinturão
   Diablo). Melhora o alcance do polegar em mobile (a *thumb zone* inferior é mais
   acessível que o canto superior), mas o rodapé hoje já está ocupado pelo joystick
   (esquerda) e pelo arco de skills (direita) — precisaria virar uma barra fina
   centro-inferior ou orbes pequenos nos dois cantos inferiores, disputando espaço.
   Recomendo prototipar isoladamente antes de comprometer, dado o risco de regressão de
   usabilidade em telas pequenas.
6. **Menu contextual "ENGAGE / ATACAR / MIRAR MAIS PRÓXIMO"** ao passar o mouse sobre um
   alvo. Só tem valor real em desktop com mouse — no touch já resolvemos com tap direto.
   Baixa prioridade dado o público mobile-first do projeto (ver
   `docs/archive/specs/propostas/04_MOBILE_APP_E_MONETIZACAO_INDIE.md`).

### Tier C — Só faz sentido quando houver sprites customizados (fora do escopo desta spec)

- Trocar o orbe CSS por uma moldura pintada à mão (bezel de metal/osso ilustrado).
- Ícones de item/poção desenhados à mão em vez dos emojis/ícones `lucide-react` atuais.
- Sprite dedicado para o marcador de NPC em vez do glifo procedural do Tier A.1.

---

## 4. Plano incremental de execução (Tier A)

Mesma filosofia de corte incremental usada em `05_GAMESCENE_REFACTOR.md` e
`06_PHASER_REACT_BRIDGE_MIGRATION.md`: cada fase é isolada, testável e não quebra a
anterior.

| Fase | Escopo | Arquivos principais | Critério de aceite |
|---|---|---|---|
| 1 | Marcador "!" sobre NPC interagível | `GameScene.ts` (desenho do glifo, ligado ao mesmo raio de proximidade que já dispara o prompt textual) | Marcador visível a média distância, some ao entrar em diálogo, sem custo de frame perceptível |
| 2 | Minimap mínimo | novo `src/store` slice (`exploredRooms`, versão), novo componente `hud/Minimap.tsx`, leitura de `this.rooms` na `DungeonGenerator` | Salas exploradas aparecem preenchidas, jogador e baús marcados, liga/desliga respeita `minimapVisible`/`minimapAlpha` já existentes |
| 3 | Orbes de HP/MP em CSS | `PlayerStatus.tsx` | Mesma posição, mesma leitura de `hpPercent`/`manaPercent`, sem barras retangulares residuais |
| 4 | Cinturão visual de curativos | `PlayerStatus.tsx` | Moldura única visível, atalhos `Z`/`X`/`V` inalterados |

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

---

## 6. Checklist de execução

- [ ] Fase 1 — marcador "!" sobre NPC interagível
- [ ] Fase 2 — minimap mínimo (substitui settings mortos `minimapVisible`/`minimapAlpha`)
- [ ] Fase 3 — HP/MP em orbe CSS
- [ ] Fase 4 — cinturão visual de curativos
- [ ] Tier B avaliado e decidido (prototipar antes de comprometer)
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
