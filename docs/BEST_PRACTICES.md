# Game Development & Deployment Best Practices
## (Bloodmage 1995 Adaptation)

Este documento consolida as melhores práticas de engenharia e design adotadas no projeto Bloodmage 1995, integrando lições do padrão Aimee para garantir performance e refinamento.

---

## 1. Arquitetura Híbrida (React + Phaser)

A separação de responsabilidades é vital para evitar o "God Object".

### 🏗️ Estrutura de Domínio
- **Engine (Phaser 3):** Controla o loop de física, renderização e lógica espacial (src/game).
- **UI (React + Tailwind):** Gerencia HUDs, menus e overlays (src/components), mantendo-os descolados da lógica de física.
- **Data (JSON):** Configurações de inimigos, magias e ondas são isoladas em arquivos de dados para fácil balanceamento.

### 🧠 Gerenciamento de Estado
- **Single Source of Truth:** O estado do jogador vive no objeto `Player` e é sincronizado com a UI React via callbacks de eventos no `GameScene`.
- **Separação de Frequência:** O Phaser processa a física a 60fps, enquanto o React atualiza apenas os componentes necessários (barras de vida, cooldowns) quando o estado muda.

---

## 2. Spec-Driven Development

Seguimos o fluxo rigoroso de especificação antes da implementação de novas features:

1. **Spec Phase:** Documentar em `/docs/SPEC.md` a mecânica.
2. **Contract Phase:** Definir os Tipos e Interfaces em `src/types/game.ts` antes de codar. Isso garante consistência entre o HUD e a Engine.

---

## 3. UI/UX & Visual Performance (Juice)

Seguindo os princípios de refinamento visual:

- **Feedback Imediato (Juice):** Cada ação do jogador tem feedback. Exemplo: *Screen Shake* e *Flash Vermelho* ao receber dano.
- **Typographic Hierarchy:** Usamos fontes góticas e "Press Start 2P" com escalas claras para garantir legibilidade durante o combate intenso.
- **Motion:** Usamos `motion/react` para transições suaves de menus, evitando processamento pesado no loop principal de jogo.

---

## 4. Deploy & PWA (Mobile First)

### ⚡ Otimização
- **Zero Assets Externos:** Texturas e áudio são gerados proceduralmente via código (Base64), garantindo um carregamento instantâneo.
- **PWA (Progressive Web App):** O jogo é instalável e funciona offline, configurado via `vite-plugin-pwa`.

### 🔐 Segurança
- **API Keys:** A chave do Gemini (se usada para geração de lore/bestiário) deve ser mantida no lado do servidor ou em rotas seguras se o projeto evoluir para Full-Stack.

---

## 5. Checklist de Lançamento

- [ ] **Build local:** `npm run build` deve passar sem erros de TypeScript.
- [ ] **Mobile Touch Test:** Verificar se os joysticks virtuais não sofrem interferência de gestos do sistema.
- [ ] **Manifest Check:** Garantir que o ícone e o tema estão corretos no manifesto do PWA.
