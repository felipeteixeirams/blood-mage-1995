# Bloodmage 1995 🩸💀

**Bloodmage 1995** é um Action-RPG / Dungeon Crawler isométrico com estética "Boomer Shooter" 16-bit. Inspirado em clássicos como *Diablo*, *Blood* e *Doom*, o jogo coloca você na pele de um necromante mestre do sangue explorando calabouços perigosos.

## 🕹️ Funcionalidades
- **Visual Retrô 2.5D**: Estética pixelada sombria com filtros CRT opcionais.
- **IA Tática**: Inimigos com temperamentos (agressivo, tático, tímido) e estados de percepção (visão e audição).
- **Combate Twin-Stick**: Controle preciso de movimentação e mira para disparar magias de sangue.
- **Progressão RPG**: Sistema de níveis com upgrades aleatórios e descente por andares infinitos.
- **Geração Procedural**: Salas e corredores gerados dinamicamente a cada novo andar.
- **Totalmente Procedural**: Áudio e texturas gerados via código (zero assets externos pesados).

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

## 📦 Deploy
Este projeto é um SPA (Single Page Application) estático.
Para fazer o deploy manual:
1. `npm install`
2. `npm run build`
3. Suba o conteúdo da pasta `dist/` para qualquer serviço de hospedagem estática (Vercel, Netlify, GitHub Pages).

---
*Desenvolvido com disciplina Spec-Driven no Google AI Studio.*
