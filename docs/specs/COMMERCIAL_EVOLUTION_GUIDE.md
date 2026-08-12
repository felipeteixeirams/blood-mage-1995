# 📜 Guia de Evolução e Preparação Comercial: Bloodmage 1995

Este documento serve como especificação técnica e de design para guiar os próximos passos de evolução do projeto **Bloodmage 1995** a fim de atingir um nível de polimento visual e técnico comparável a marcos como *Dungeon Siege 1* e *Diablo 2*, preparando o jogo para um lançamento comercial de sucesso em plataformas móveis (smartphones) e desktop.

---

## 1. 🔍 Análise de Limitações Tecnológicas Atuais e Recursos

Durante a nossa validação profunda e modificação da interface, identificamos as seguintes limitações de arquitetura e tecnologia na stack atual que devem ser resolvidas para a evolução do produto:

### A. Acoplamento entre Phaser e React 19
*   **Limitação:** Atualmente, a ponte de comunicação entre o Phaser (mecanismo físico) e o React (HUD e Modais) é baseada em eventos do DOM (`window.dispatchEvent` e `CustomEvent`). Isso cria uma tipagem frouxa (ou nula) para dados transitados de alta frequência (como cooldowns de feitiços e dano).
*   **Impacto Comercial:** Risco de race conditions na sincronização de estado, dificultando efeitos de transição mais complexos e diminuindo ligeiramente a performance de pico em smartphones de entrada.

### B. Ausência de Texturas de UI Complexas baseadas em Atlas / Spritesheets
*   **Limitação:** A UI do jogo depende majoritariamente de estilização CSS pura (Tailwind) e ícones de vetores planos (`lucide-react`). Embora tenhamos dado um acabamento gótico excelente usando bordas duplas e gradientes pesados, o nível de polimento de Diablo II depende de assets desenhados no estilo pixel-art ou pré-renderizados em 3D de alta qualidade (molduras de ferro esculpido, fivelas de bronze, anjos/demônios emoldurando as caixas).
*   **Impacto Comercial:** A interface parece moderna em alguns pontos por depender de vetores puros em vez de assets pixelados que transmitem "peso físico".

### C. Estrutura de Waves vs. Mundo Contínuo
*   **Limitação:** O loop de jogo ainda é baseado no modelo de waves (ondas) e andares procedimentais em um ambiente fechado. Para aproximar-se de Dungeon Siege 1, é preciso evoluir para uma geração de cenários nômades contínuos (biomas conectados por estradas ou portas bloqueadas por guardiões/bosses físicos).

---

## 2. 🗺️ Roteiro de Evolução Comercial ("Commercial-Readiness Roadmap")

Mapeamos a evolução em 4 pilares estratégicos de alta prioridade:

```
┌─────────────────────────────────────────────────────────────────────────┐
│              ROTEIRO DE EVOLUÇÃO COMERCIAL - BLOODMAGE 1995              │
├───────────────────┬───────────────────┬─────────────────────────────────┤
│ PILAR             │ OBJETIVO          │ AÇÕES DE IMPLEMENTAÇÃO          │
├───────────────────┼───────────────────┼─────────────────────────────────┤
│ 1. Assets Retrô   │ Texturas Góticas  │ Substituir SVG/Lucide por Atlas │
│ 2. Ponte de Dados │ Zustand Integrado │ Event Broker Tipado e Zustand   │
│ 3. UI Retrátil    │ Mobile-First      │ Colapsar log de loot flutuante  │
│ 4. Mundo Nômade   │ Geração Contínua  │ Biomas conectados e portões     │
└───────────────────┴───────────────────┴─────────────────────────────────┘
```

### Pilar 1: Arte Retrô de UI e Atlas de Elementos Visuais (Dungeon Siege / Diablo II Style)
Para alcançar o visual autêntico de 1998, a interface não pode depender de CSS vetorial moderno.

1.  **Geração ou Importação de Texturas Góticas:**
    *   Criar um asset pack próprio de UI (com licença comercial) contendo fivelas de bronze, pergaminhos rasgados para abas de modais, pedras esculpidas com runas e molduras metálicas de ferro fundido.
    *   Compilar esses elementos em um único **Sprite Atlas** de alta performance que possa ser carregado dinamicamente.
2.  **Substituição dos Ícones Lucide:**
    *   Substituir ícones modernos (`Backpack`, `Settings`, `Volume`) por pequenos sprites pixelados (ex: uma mochilinha de couro pixelada de 16x16 pixels com contorno dourado).

### Pilar 2: Ponte de Comunicação Estritamente Tipada (Phaser ↔ React)
1.  **Substituição de Eventos DOM por Zustand / RxJS:**
    *   Utilizar o próprio Zustand `gameStore.ts` de forma direta no Phaser. Fazer o loop físico do Phaser atualizar as variáveis do Zustand de forma otimizada utilizando throttling de frames para não re-renderizar o React em excesso.
    *   Isso resolverá lags de input no mobile e garantirá transições animadas ultra-suaves no HUD (via Framer Motion) quando o HP/MP cair rapidamente.

### Pilar 3: Maximização de Tela Mobile-First (Estilo Diablo Immortal / Mobile Native)
Para garantir um ótimo espaço útil de tela nos smartphones, a UI de gameplay deve ser refinada para ocupar no máximo **15%** do espaço total de combate:

1.  **Log de Loot Flutuante:**
    *   Atualmente o `LootLog.tsx` flutua no topo. Proponho integrá-lo em uma pequena "caixa de log" ou console colapsável na parte inferior esquerda (abaixo do joystick de movimento), ou deixá-lo no estilo de "floating text" que sobe diretamente das moedas/itens no próprio chão do Phaser (diminuindo sobreposição na HUD do React).
2.  **Tamanho Adaptativo de Botões de Ação:**
    *   O recurso de "Editar Layout de HUD" implementado é fantástico. Para fins comerciais, salve esses layouts editados diretamente no `localStorage` do dispositivo móvel do usuário por padrão, oferecendo layouts otimizados pré-configurados para destros ou canhotos.

### Pilar 4: Biomas Contínuos e Geração de Cenários Conectados
Para se parecer com o fluxo contínuo de Dungeon Siege 1:
1.  **DungeonGenerator Conectada:**
    *   A geração de masmorras deve conectar a "Vila Segura" (Room 0) a "Áreas de Estepes" e subsequentemente a "Catacumbas" usando passagens ou escadas visuais físicas, em vez de resetar a cena ao passar de wave.
2.  **Bloqueio por Chaves e Mini-Bosses:**
    *   Adicionar chaves rúnicas de metal como drop de mini-chefes para abrir grandes portais dourados, criando metas de exploração tática de curto prazo altamente recompensadoras.

---

**Mantido por:** Felipe + IA Agents
**Última revisão:** 11 de Agosto de 2026
**Status de Lançamento Comercial:** Em preparação visual profunda.
