# Bloodmage 1995 🩸💀

**Bloodmage 1995** é um Action-RPG / Dungeon Crawler isométrico com estética "Boomer Shooter" 16-bit. Inspirado em clássicos como *Diablo*, *Blood* e *Doom*, o jogo coloca você na pele de um necromante mestre do sangue explorando calabouços perigosos.

## 🕹️ Funcionalidades
- **Visual Retrô 2.5D**: Estética pixelada sombria com filtros CRT opcionais.
- **Suporte Mobile (PWA)**: O jogo pode ser instalado no celular e jogado offline.
- **Controles Touch**: Joysticks virtuais para movimentação e mira Twin-Stick.
- **IA Tática**: Inimigos com temperamentos (agressivo, tático, tímido) e estados de percepção (visão e audição).

## 🚀 Como Jogar
1. **Movimentação**: Teclas `W`, `A`, `S`, `D` ou Joysticks virtuais (Mobile).
2. **Mira**: Mouse ou Joystick direito.
3. **Magias**:
   - `Q` / `1`: **Hellfire Nova** (Explosão em área).
   - `E` / `2`: **Syphon Soul** (Drena vida e mana).
   - `Espaço` / `3`: **Bone Shield** (Ossos orbitais defensivos).

## 🛠️ Tecnologias
- **Engine**: [Phaser 3](https://phaser.io/)
- **UI**: [React](https://reactjs.org/) + [Tailwind CSS](https://tailwindcss.com/)
- **Linguagem**: TypeScript
- **Bundler**: Vite

## 📁 Estrutura do Projeto
- `/src/game`: Toda a lógica Phaser (Cenas, Objetos, Física).
- `/src/components`: Interfaces React (HUD, Menus, Modais).
- `/src/data`: Configurações de monstros, magias e ondas.
- `/src/utils`: Geradores de textura e áudio procedurais.
- `/docs`: Documentação técnica detalhada (Arquitetura, Roadmap).

## 📱 Como Instalar no Celular (PWA)
Este jogo é um **Progressive Web App**:
1. Abra a URL do deploy no seu navegador móvel (Chrome no Android, Safari no iOS).
2. **Android**: Toque nos três pontos (menu) e selecione **"Instalar aplicativo"** ou "Adicionar à tela inicial".
3. **iOS (iPhone)**: Toque no botão **Compartilhar** (ícone de quadrado com seta) e selecione **"Adicionar à Tela de Início"**.
4. O jogo aparecerá na sua lista de aplicativos e funcionará em tela cheia sem a barra do navegador.

---
*Desenvolvido com disciplina Spec-Driven no Google AI Studio.*
