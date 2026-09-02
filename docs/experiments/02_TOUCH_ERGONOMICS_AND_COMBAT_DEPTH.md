# Experimento 02: Ergonomia Touch Avançada, Safe Area & Profundidade de Combate

## 🎯 1. Hipótese
Em dispositivos móveis de diferentes tamanhos de mão, recortes de tela (Notches e Dynamic Island) e preferências de lateralidade (canhotos vs destros), oferecer calibração ergonômica da área de toque e respeito às bordas seguras reduz o cansaço dos polegares e eleva a retenção D1/D7.

---

## 🔍 2. Variáveis em Teste

### A. Ergonomia e Controles Touch
1. **Safe Area Insets:**
   - Adaptação dinâmica de `env(safe-area-inset-*)` no HUD, garantindo que botões de pausa, barras de vida e botões de ação nunca fiquem sob a câmera frontal ou os cantos curvos.
   - **[x] ENTREGUE NO CÓDIGO** (`src/index.css`, `src/components/GameplayHUD.tsx`).
2. **Escala do Joystick Virtual (`virtualStickScale`):**
   - Opções: `'small'` (0.8x / 80px), `'medium'` (1.0x / 100px - padrão), `'large'` (1.25x / 125px).
   - Medir a precisão de esquiva e taxa de falsos toques em telas menores (<6.1") vs telas grandes (>6.7").
   - **[x] ENTREGUE NO CÓDIGO** (`src/types/game.ts`, `src/utils/localStorage.ts`, `src/game/scenes/SettingsScene.ts`, `src/components/GameplayHUD.tsx`, `src/game/scenes/GameScene.ts`).
3. **Modo Canhoto (`leftHandedMode`):**
   - Inversão de layout: Joystick de movimento no quadrante inferior direito e botões de magia/esquiva no quadrante inferior esquerdo.
   - **[x] ENTREGUE NO CÓDIGO** (`src/types/game.ts`, `src/utils/localStorage.ts`, `src/game/scenes/SettingsScene.ts`, `src/components/GameplayHUD.tsx`, `src/game/scenes/GameScene.ts`).
4. **Joystick Flutuante vs Fixo (`floatingStick`):**
   - Modo fixo (ancorado) vs Modo dinâmico (surge onde o polegar toca no semi-plano lateral).
   - **[x] ENTREGUE NO CÓDIGO** (`src/types/game.ts`, `src/utils/localStorage.ts`, `src/game/systems/VirtualJoystickSystem.ts`, `src/game/systems/VirtualJoystickSystem.test.ts`).

### B. Profundidade de Combate & Telegrafias
1. **Telegrafias de Chefes Multiestágio & Danger Zones:**
   - Linhas de carga, círculos concêntricos e arcos de impacto telegrafados com área de perigo visual (Danger Zone) no chão da arena.
   - **[x] ENTREGUE NO CÓDIGO** (`src/game/systems/EnemyTelegraphSystem.ts`, `src/game/objects/Enemy.ts`).
2. **Ritual de Bênçãos (Cartas de Sangue / Mutações de Feitiços):**
   - Sinergias entre magias (ex: Blood Bolt congelante + Nova explosiva) com toque único no polegar sem interromper o fluxo mental.
   - **[ ] PENDENTE / EM BACKLOG** (Mapeado em `docs/specs/backlog/12_PROGRESSAO_E_QUESTS_CONTRATOS.md` e `docs/product/ROADMAP.md`).

---

## 📊 3. Critérios de Avaliação (Filtro de Sucesso Mobile)
- **Fricção Zero:** O jogador consegue alterar entre Destro e Canhoto e ajustar a escala com 1 toque no menu de configurações ou HUD overlay.
- **60 FPS Estável:** Zero impacto de Garbage Collection ou repaints no loop de renderização do toque (VirtualJoystick opera por pooling e reutilização de transformadas em Canvas/WebGL).
- **Retenção & Ergonomia:** Feedback táctil suave e suporte completo a telas modernas com entalhes de câmera (Notches/Dynamic Island).

---

## 🔬 4. Relatório de Auditoria de Código (2026-09-02)

O código-fonte real do projeto foi auditado e confirma a implementação da grande maioria das hipóteses ergonômicas e telegrafias:

1. **Safe Area Insets:**
   - `src/index.css` define utilitários Tailwind/CSS (`.safe-area-top`, `.safe-area-bottom`, `.safe-area-left`, `.safe-area-right`, `.safe-area-container`) usando `padding-*: max(16px, env(safe-area-inset-*, 16px))`.
   - `src/components/GameplayHUD.tsx` aplica essas classes CSS nos overlays superiores (barras de vida, timer) e inferiores (painel de skills e joysticks).

2. **Calibração Ergonômica de Joystick (`virtualStickScale`, `leftHandedMode`, `floatingStick`):**
   - **Contrato e Persistência:** `src/types/game.ts` define `virtualStickScale`, `leftHandedMode` e `floatingStick`. `src/utils/localStorage.ts` valida e persiste as opções via Zod com fallbacks seguros.
   - **Interface de Configurações e HUD:** `src/game/scenes/SettingsScene.ts` e `src/components/GameplayHUD.tsx` permitem ao jogador alterar o modo canhoto, o joystick flutuante e a escala (Pequeno 0.8x, Médio 1.0x, Grande 1.25x) com apenas um toque em tempo real.
   - **Integração no Loop de Jogo:** `src/game/scenes/GameScene.ts` (linhas 502, 1314, 1336) lê as configurações ativas e ajusta o multiplicador de escala e o espelhamento de zonas de movimento/mira (`moveZone` e `aimZone`) no `VirtualJoystickSystem`.
   - **Joystick Flutuante Dinâmico:** `src/game/systems/VirtualJoystickSystem.ts` (linhas 116 e 321) reposiciona o centro do joystick no ponto exato do toque inicial quando `floatingStick: true`. Testado e validado em `src/game/systems/VirtualJoystickSystem.test.ts`.

3. **Telegrafias de Chefes & Danger Zones:**
   - `src/game/systems/EnemyTelegraphSystem.ts` gerencia o desenho de indicadores no chão da arena (depth 740) com formas geométricas (`cone` de corte, `line` de investida, `circle` de feitiço e `boss_slam` de impacto) e preenchimento expansivo animado por progresso do windup.
   - `src/game/objects/Enemy.ts` emite os dados de telegrafia via `getTelegraphInfo()` durante o combate.

4. **Ritual de Bênçãos (Cartas de Sangue):**
   - **Situação:** Permanece como a única hipótese exploratória não concluída deste arquivo. Está formalmente documentada como proposta de expansão em `docs/specs/backlog/12_PROGRESSAO_E_QUESTS_CONTRATOS.md` e rastreada como item futuro em `docs/product/ROADMAP.md`.

### 📌 Recomendação de Promoção / Atualização
Recomenda-se que a frente de **Ergonomia Touch & Controles de Inset** (Seção 2.A) seja promovida para `docs/specs/delivered/` como spec satélite (por exemplo, `16_01_TOUCH_ERGONOMICS_AND_SAFE_AREA.md`), já que está 100% implementada, testada e integrada no código real. O Ritual de Bênçãos (Seção 2.B.2) deve permanecer rastreado no backlog em `docs/specs/backlog/12_PROGRESSAO_E_QUESTS_CONTRATOS.md`.

---

## 📈 5. Status do Experimento
- [x] Hipótese definida e mapeada na Bíblia Mobile.
- [x] Implementação do suporte a Safe Area e opções de Joystick no Settings & GameplayHUD.
- [x] Testes de usabilidade e calibração de escala (unidade `VirtualJoystickSystem.test.ts` e `localStorage.test.ts`).
- [x] Telegrafias de ataque e Danger Zones integradas (`EnemyTelegraphSystem.ts`).
- [ ] Conclusão do Ritual de Bênçãos / Cartas de Sangue (mantido em backlog `docs/specs/backlog/12_PROGRESSAO_E_QUESTS_CONTRATOS.md`).
