# Bloodmage 1995: Roadmap & Evolution 🩸🚀

Este documento detalha o futuro planejado para o projeto, focando em mecânicas, tecnologia e imersão.

---

## 🛡️ Fase 1: Refinamento Core (Atual)
- [x] **Juice System**: Screen shake e flash de dano.
- [x] **PWA Support**: Instalação mobile e offline.
- [x] **Touch Joysticks**: Controles otimizados para telas pequenas.

## ⚔️ Fase 2: Conteúdo & Variedade (Próximo)
- [ ] **Sistemas de Loot**: Itens raros (Drop rate procedural) com modificadores de atributos.
- [ ] **Boss Fights**: Encontros únicos a cada 5 andares com mecânicas de "Bullet Hell".
- [ ] **Bestiário Dinâmico**: Inimigos com fraquezas elementais (Sangue, Osso, Fogo).

## 🔮 Fase 3: Integração IA (Geração de Conteúdo)
- [ ] **IA-Driven Lore**: Uso do Gemini para gerar descrições únicas de itens e lore das masmorras baseada na seed do andar.
- [ ] **Sistemas de Voz**: Narração procedural de eventos épicos.
- [ ] **Diálogos de NPCs**: Fantasmas ou mercadores com personalidades geradas via LLM.

## 🌐 Fase 4: Conectividade & Comunidade
- [ ] **Cloud Saves**: Integração com Firebase para persistir progresso entre dispositivos.
- [ ] **Leaderboards Globais**: Competição de andares mais profundos.
- [ ] **Multiplayer Local/Coop**: Suporte básico para dois jogadores na mesma tela ou via WebSockets.

---

## 💡 Percepções de Desenvolvimento
1. **Performance Procedural**: A geração de texturas via código (Base64) se provou extremamente eficiente para deploys leves (Vercel), mantendo o bundle abaixo de 2MB mesmo com a engine Phaser.
2. **Hibridismo UI**: O uso de React para HUD e Phaser para Jogo permite uma separação de estado limpa, facilitando a manutenção e testes de interface sem interferir no loop de 60fps.
3. **PWA First**: A abordagem mobile-first aumentou a acessibilidade, transformando o jogo em um "app nativo" virtual.
