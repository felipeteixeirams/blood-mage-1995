---
agent_context: frontend
target_module: src/game
priority: high
status: active
last_updated: 2026-08-24
tags: [architecture, phaser, patterns]
---
# 👾 Padrões de Desenvolvimento no Phaser

Bloodmage 1995 utiliza padrões consagrados no ecossistema do Phaser para garantir taxas de quadro estáveis de 60 FPS e prevenir vazamentos de memória (GC stutters).

## 🛠️ Padrões Adotados
1. **Reutilização de Objetos (Pooling)**:
   - Projéteis, efeitos de sangue, e danos flutuantes são reciclados usando `Phaser.GameObjects.Group` para evitar instanciar novas entidades frequentemente no loop de update.
2. **Pruning Espacial de IA**:
   - Inimigos realizam uma filtragem rápida por distância (distância quadrática) ou AABB antes de executar cálculos caros de raycasting de campo de visão ou som.
3. **Padrão State para FSM de Inimigos**:
   - Cada inimigo gerencia seu comportamento através de estados bem definidos (`idle`, `patrol`, `investigating`, `combat`, `frenzy`, `flee`), isolando as ações no ciclo de física.
4. **Extração/Delegação de GameScene**:
   - `GameScene.ts` cresceu demais para caber num único arquivo de forma
     sustentável (chegou a ~117KB / 2900 linhas). Blocos de responsabilidade
     única foram movidos para classes em `src/game/systems/` seguindo sempre
     o mesmo procedimento, para minimizar risco de regressão:
     1. **Ampliar visibilidade** dos campos/métodos que o bloco extraído
        precisa ler ou escrever, de `private` para `public`, com um
        comentário `// público: usado por <NomeDaClasse>` — mudança de
        visibilidade apenas, sem alterar comportamento em runtime.
     2. **Mover o corpo do método** para uma nova classe com
        `constructor(private scene: GameScene) {}`, renomeando `this.X` para
        `scene.X`.
     3. **Substituir o original por um wrapper fino** que delega para a
        nova classe, preservando o nome e a assinatura exatos — crítico
        porque `physics.add.overlap`/`.on(...)` e `.bind(this)` em listeners
        de window referenciam esses métodos pelo nome.
     4. **Instanciar a nova classe em `create()`**, na ordem de dependência
        correta.
     5. Verificar com `pnpm verify` a cada extração (nunca acumular várias
        extrações sem validar entre elas).
   - Sistemas já extraídos por esse padrão: `PlayerSkillSystem.ts`,
     `CollisionHandlers.ts`, `DungeonFlowController.ts`, `ScavengingSystem.ts`
     e `CombatEffectsSystem.ts`. Histórico completo e estado atual em
     `05_GAMESCENE_REFACTOR.md`.
5. **Renderização WebGL2, Dynamic Textures e Shaders Customizados (Phaser 4.2.1)**:
   - Arte procedural pesada (como árvores fractais de `ProceduralForestGenerator.ts`) deve ser assada uma única vez no WebGL2 via `textures.addDynamicTexture(...)` e renderizada como `Sprite` leve ou `Shader` de alta performance. NUNCA desenhe gráficos procedurais a cada frame no loop `update()`.
   - Para efeitos visuais atmosféricos (como o vento balançando galhos e sombreamento difuso/AO), utilize `Phaser.GameObjects.Shader` com `ShaderQuadConfig` e `setupUniforms` (ver `src/game/shaders/AtmosphericTreeShader.ts`).
   - Consulte a suíte de skills especializadas em `.claude/skills/`:
     - `phaser-4-development/SKILL.md`: WebGL2, baking pattern e shaders GLSL
     - `phaser-4-animation-tweens/SKILL.md`: Spritesheets, tweens encadeados (`this.tweens.chain`) e FSM de ataque telegrafado (`Windup` -> `Strike` -> `Recovery`)
     - `phaser-4-physics-combat/SKILL.md`: Arcade Physics, hitboxes isométricas, colisão com paredes e poda espacial (`distanceSquared`) antes de raycasts
     - `phaser-4-fx-filters/SKILL.md`: Beam Renderer, regra de `enableFilters()`, auras sanguíneas e vinhetas
     - `phaser-4-playtest-harness/SKILL.md`: Smoke tests automatizados no Playwright para detecção de telas pretas e assets 404
