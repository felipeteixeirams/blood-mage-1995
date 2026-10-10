# Specs em definição — Documento Mestre

**Contexto:** specs de features e discoveries ainda sem aprovação do responsável; nenhuma está em `backlog/` ou `in-progress/`. Nenhuma foi verificada contra o código.
**Leia quando:** for propor, refinar ou pedir aprovação de uma spec, ou antes de implementar algo que possa já ter spec aqui. Mestre de specs: [specs](../README.md).

| Spec | Resumo |
|---|---|
| [Spec 18 — Topologia de Mundo Contínuo e Variedade Orgânica (Padrão Dungeon Siege)](arpg-continuous-world-topology.md) | Proposta de topologia de mundo contínuo e variedade orgânica estilo Dungeon Siege (gerador por trilha, setpieces, ecologia de monstros, linha de visão). |
| [Spec 11: Atmosfera, Tensão e Indicadores de Ameaça](atmosfera-tensao.md) | Atmosfera e tensão: indicador de ameaça fora de tela, áudio espacial, vinheta por perigo, lanterna rúnica e chamado de reforços em `flee`. |
| [Cloud Save Automatizado (Extraído da Fase 5)](cloud-save-fase5.md) | Proposta de save em nuvem (login, sincronização com `localStorage`, privacidade) extraída da Fase 5. |
| [Discovery: Pipeline de Arte Semi-Automatizado via IA (HuggingFace / ChatGPT)](discovery-ai-art-pipeline.md) | Discovery de pipeline semi-automático de arte com IA (prompt padronizado, limpeza humana, script de ingestão e scaffold de código). |
| [Discovery: Transição para ARPG Clássico (Campanha, Lore e Atmosfera)](discovery-campaign-progression-lore.md) | Discovery da transição para ARPG clássico: mundo contínuo, Safe House como início, lore do Mago de Sangue, economia tática e progressão. |
| [Proposta de Discovery — Evolução de UI e Assets Externos Góticos (Pixel Art)](discovery-ui-assets-externos.md) | Discovery de UI e assets externos góticos (Eixos A, B, C): direção de arte, UI híbrida, áudio, VRAM, licenças. |
| [Eixo A — Gráficos Avançados (postFX, Iluminação Light2D e Normal Maps)](eixo-a-graficos-avancados.md) | Especificação de postFX, iluminação Light2D e normal maps procedurais (PostFXSystem, LightingSystem, flag `postProcessingEnabled`). |
| [GDD & Especificação: Eventos Mundiais e Sazonais (Atmosphere & Retention)](eventos-mundiais-sazonais.md) | GDD de eventos mundiais (Eclipse de Sangue, Cerco, Rifts de Infecção) e sazonais (Halloween, Natal) com sincronização por calendário. |
| [Spec — Evolução Gráfica & Auditiva (Quick Wins & Roadmap Completo)](evolucao-grafica-audio-quickwins-roadmap.md) | Quick wins e roadmap gráfico/auditivo: distorção de medo, cascata de luz, tinnitus, animações 8 direções, ragdoll/gibs, sombras, status visuais e reflexos. |
| [Discovery: Avaliação Arquitetural: Phaser 4.2.1 e Renderização Procedural Avançada](evolucao-grafica-avancada.md) | Discovery de evolução gráfica em três eixos: A gráficos procedurais (postFX, Light2D), B assets externos, C áudio híbrido. |
| [Fase 3: Status de Sobrevivência](fase3-status-sobrevivencia.md) | Status de sobrevivência (sangramento, veneno etc.): dados, aplicação, dreno, morte por status, cura por UI e pelo NPC Clérigo. |
| [Fase 5: Polimento de Produção, Empacotamento Nativo (Play Store & Steam) e Imersão AAA](fase5-polimento-producao-pwa-steam.md) | Polimento de produção: performance, gamepad, haptics, PWA/TWA, Steam, partículas, achievements; itens i18n e Cloud Save pendentes. |
| [Spec 16: Evolução Gráfica, Resolução Adaptativa UI & Terreno Procedural 2.5D/3D](graphical-ui-terrain-evolution.md) | Resolução adaptativa e UI mobile, câmera isométrica, escala de entidades, zoom de chefe, terreno procedural com elevação e avaliação de motor gráfico. |
| [HUD de Gameplay & Dinâmica de Combate: Diretrizes Diablo II & Dungeon Siege 1](hud-referencias-visuais-diablo-dungeon-siege.md) | Análise de HUDs de Dungeon Siege 1 e Diablo II e plano de adoção por tiers (A sem assets, B por ergonomia, C com sprites). |
| [Mapeamento Completo de Sprites & Checklist de Substituição](mapeamento-sprites-checklist.md) | Mapa de todos os sprites do jogo por categoria, adequações de arquitetura prévias e checklist faseado de substituição por arte física. |
| [Discovery: Mobile App, Wrapper Nativo e Monetização Saudável](mobile-app-monetizacao-indie.md) | Discovery de wrapper nativo (Capacitor vs. Cordova), monetização fair-play em três níveis e marketing orgânico. |
| [Discovery: Multijogador Cooperativo e Interatividade (P2P WebRTC)](multijogador-cooperativo-interatividade.md) | Discovery de multijogador cooperativo P2P via WebRTC com broker de sinalização, lobby e mitigação de latência. |
| [Spec 11: Touchpad & Joystick Virtual Nativo no Phaser (Padrão Mobile Legends / Diablo Immortal)](native-phaser-touchpad-joystick.md) | Joystick virtual flutuante 100% nativo no Phaser (drag-to-follow, multi-touch, deadzone, curva) estilo MOBA/Diablo Immortal. |
| [Guia Direto para Pixel Lab (Bloodmage 1995)](pixel-lab-prompt-guide.md) | Guia de prompts e parâmetros para gerar cada sprite/tile no Pixel Lab (jogador, bestiário, NPCs, props, tiles). |
| [Spec 17 — Polimento Gráfico por Calibração dos Sistemas Existentes](polimento-grafico-calibracao-sistemas-existentes.md) | Calibração visual de sistemas existentes (glow, pós-processamento, `LightingSystem`, `AtmosphereSystem`, `ShadowSystem`) em frentes A a E. |
| [Sistema de Prestígio (Blood Seal) — Modal de UI (Concluído)](sistema-prestigio-blood-seal.md) | Modal de prestígio (Selo de Sangue) e o que ele expõe: alocação de selos, dificuldades e ritual de sacrifício. |
| [Discovery: Eixo B — Pipeline de Integração de Assets Externos](sprites-assets-externos-tiers.md) | Pipeline de integração de assets externos (chaves, manifesto, loader, lazy-loading por cena) com fallback procedural. |
| [Proposta de Discovery — Evolução de UI e Assets Externos Góticos (Pixel Art)](ui-assets-externos-framework.md) | Proposta de evolução da UI e de assets externos góticos: direção de arte, UI híbrida React+Phaser, transição de áudio, orçamento de VRAM, licenças. |
| [Spec 25 — Padronização de Modais Secundários, Navegação Gamepad & Retratos Rúnicos](ui-modais-secundarios-gamepad-navigation.md) | Padronização visual e blindagem de ponteiro dos modais secundários, navegação por gamepad em diálogo/inventário e retratos de NPC. |
