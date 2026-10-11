# Specs em definição — Documento Mestre

**Contexto:** specs de features e discoveries ainda sem aprovação do responsável; nenhuma está em `backlog/` ou `in-progress/`. O estado de cada uma contra o código foi verificado em 2026-10-10 por leitura estática (linha "Estado vs código" de cada spec); nada foi executado.
**Leia quando:** for propor, refinar ou pedir aprovação de uma spec, ou antes de implementar algo que possa já ter spec aqui. Mestre de specs: [specs](../README.md).


## Gráfico

| Spec | Resumo |
|---|---|
| [bug-grafico-iluminacao-e-efeitos-sem-consumidor](bug-grafico-iluminacao-e-efeitos-sem-consumidor.md) | `ambientColor` por bioma e campos do `WorldManager` sem consumidor, `postProcessingEnabled` sem toggle e lido só na criação, `screenShakeEnabled` ignorado por `ScreenShake` e por ~10 chamadas de `cameras.main.shake`, e `startAmbient` sem chamada. |
| [discovery-grafico-evolucao-pendente](discovery-grafico-evolucao-pendente.md) | O que falta da evolução gráfica (Pixelate, bloom por evento, Light2D em mais objetos, self-shadow, `maxLights`, normal map do jogador, fallback sem WebGL) e do mixer dinâmico de áudio |
| [feature-grafico-avancado-eixo-a](feature-grafico-avancado-eixo-a.md) | postFX, Light2D e normal maps existem; faltam normal map do jogador, fallback Canvas funcional (`ScreenEffects.render`, `darknessOverlay`) e toggle de UI para `postProcessingEnabled`. |
| [feature-grafico-calibracao-visual-por-bioma](feature-grafico-calibracao-visual-por-bioma.md) | Calibração por bioma de luz Light2D, atmosfera, sombras, reflexos, partículas, shader de árvores e terreno; depende do ADR 0005 e de playtest humano |
| [feature-grafico-camera-e-escala-de-entidades](feature-grafico-camera-e-escala-de-entidades.md) | Câmera por resolução lógica e proporção de tela, zoom de chefe suave e escala de entidades por ocupação vertical |
| [feature-grafico-glow-e-pos-processamento-calibrados](feature-grafico-glow-e-pos-processamento-calibrados.md) | Glow e PostFX (vignette, ColorMatrix, displacement, tint) validados contra o Phaser 4.2.1 e calibrados, sem estado residual |
| [feature-grafico-validacao-e-lifecycle](feature-grafico-validacao-e-lifecycle.md) | Baseline, ordem de profundidade, limpeza em shutdown/reinício, orçamento de performance e antes/depois nas 10 cenas |

## Áudio

| Spec | Resumo |
|---|---|
| [bug-audio-bgmgain-e-temas](bug-audio-bgmgain-e-temas.md) | `bgmGain` nunca é atribuído (ambiente e reverb inertes), o passa-baixas do tinnitus fica sem sinal, o contador de vozes é sempre 0, sinos 32/48 inalcançáveis e a BGM nunca volta a `safe_house`. |

## Controles

| Spec | Resumo |
|---|---|
| [bug-controles-joysticks-e-gamepad](bug-controles-joysticks-e-gamepad.md) | Joysticks duplicados, mira sem joystick, gamepad lido de slot fixo e joystick virtual nativo (CJG) |
| [feature-controles-mira-e-alvo-inteligente](feature-controles-mira-e-alvo-inteligente.md) | Hitbox de alvo +30% no toque e pontuação de alvo por distância, HP e ameaça |

## UI

| Spec | Resumo |
|---|---|
| [bug-ui-fora-do-react-e-codigo-morto](bug-ui-fora-do-react-e-codigo-morto.md) | UI desenhada em cenas Phaser contra a regra "UI só em React", `onRestart` ignorado, componentes e código morto, `framer-motion` solto, textos sem i18n. |
| [feature-ui-atmosfera-e-tensao](feature-ui-atmosfera-e-tensao.md) | Atmosfera e tensão: indicador de borda, áudio espacial, vinheta por perigo, zumbido, luz por HP e reforços em `flee` existem; faltam vinheta desligável e alinhar os valores da lanterna. |
| [feature-ui-hud-escala-e-personalizacao](feature-ui-hud-escala-e-personalizacao.md) | Escala global, opacidade, tamanho de botões e margens de safe area do HUD mobile, persistidos em `localStorage.ts` |
| [feature-ui-hud-referencias-visuais](feature-ui-hud-referencias-visuais.md) | Tier A (barras, marcador de NPC, minimapa, curativos) existe; faltam menu contextual de mouse e Tier C (arte própria). |
| [feature-ui-idioma-espanhol](feature-ui-idioma-espanhol.md) | Terceiro idioma (espanhol) com dicionário de 147 chaves, registro no i18n, schema e seletor de idioma |
| [feature-ui-modais-secundarios-e-gamepad](feature-ui-modais-secundarios-e-gamepad.md) | Modais secundários: maioria padronizada via `ModalBase` e gamepad integrado; faltam `HighScoresModal` com visual padrão, estilos de foco e ornamentos/halo nos retratos. |

## Mundo

| Spec | Resumo |
|---|---|
| [bug-mundo-chunks-sobre-safe-house-e-fosso](bug-mundo-chunks-sobre-safe-house-e-fosso.md) | `loadChunkBiome` gera chunks vizinhos sem deslocamento sobre a Safe House e o fosso; precisa de playtest para confirmar o efeito. |
| [feature-mundo-terreno-rampas-e-estruturas](feature-mundo-terreno-rampas-e-estruturas.md) | Rampas, falésias, estruturas por carimbo e A* com custo de elevação no terreno 2.5D |
| [feature-mundo-topologia-continua](feature-mundo-topologia-continua.md) | Mundo contínuo estilo Dungeon Siege: gerador por trilha, setpieces e ecologia por habitat existem no código, mas não são chamados em produção; falta decidir qual gerador vale. |

## Campanha

| Spec | Resumo |
|---|---|
| [bug-campanha-quests-dos-capitulos-2-a-4](bug-campanha-quests-dos-capitulos-2-a-4.md) | O objetivo `discover_zone` dos capítulos 2 a 4 nunca avança (só existe o marco `altar_crimson`); proposta de disparo por zona. |
| [discovery-campanha-progressao-e-lore](discovery-campanha-progressao-e-lore.md) | Discovery de ARPG de campanha: Safe House, despertar, zero-to-hero, destrave de feitiços por nível e talentos exclusivos existem; faltam mundo único contínuo, trovões e Eco Vital. |

## Eventos

| Spec | Resumo |
|---|---|
| [feature-eventos-eclipse-de-sangue](feature-eventos-eclipse-de-sangue.md) | Eclipse de Sangue com luz -30%, inimigos em `frenzy` e drop +50% (valores provisórios); nada implementado |
| [feature-eventos-infraestrutura-mundial](feature-eventos-infraestrutura-mundial.md) | Agenda em `worldEvents.json`, fonte de tempo e estado `activeWorldEvent`, base dos eventos mundiais; nada implementado |

## Assets

| Spec | Resumo |
|---|---|
| [discovery-assets-arte-ui-audio-e-sprites](discovery-assets-arte-ui-audio-e-sprites/README.md) | Carga de assets (loader por cena, atlas, normal maps, Sentry), direção artística, 9-slice, áudio híbrido, orçamento, licenças, créditos e critérios de entrega de arte (AAS-1..37) |
| [parte 01](discovery-assets-arte-ui-audio-e-sprites/01-visao-e-direcao-artistica.md) | Visão e direção artística (paleta, escopo, decisões) |
| [parte 02](discovery-assets-arte-ui-audio-e-sprites/02-carga-atlas-e-normal-maps.md) | Manifesto, loader por cena, atlas, normal maps, Sentry |
| [parte 03](discovery-assets-arte-ui-audio-e-sprites/03-ui-9slice.md) | UI com 9-slice |
| [parte 04](discovery-assets-arte-ui-audio-e-sprites/04-audio-hibrido.md) | Áudio físico híbrido |
| [parte 05](discovery-assets-arte-ui-audio-e-sprites/05-orcamento-licencas-creditos.md) | Orçamento, licenças e créditos |
| [parte 06](discovery-assets-arte-ui-audio-e-sprites/06-criterios-e-pendencias.md) | Critérios EARS, plano de verificação, questões em aberto |
| [discovery-assets-pipeline-de-arte-com-ia](discovery-assets-pipeline-de-arte-com-ia.md) | Discovery de pipeline semi-automático de arte com IA; nada do pipeline proposto existe (só manifesto, `verify-assets` e clientes PixelLab/SpriteCook). |
| [feature-assets-mapeamento-de-sprites](feature-assets-mapeamento-de-sprites.md) | Pipeline e fallback prontos; só jogador, baú e UI têm arte física, o resto segue procedural. |

## Distribuição

| Spec | Resumo |
|---|---|
| [bug-distribuicao-pwa-manifest-e-service-worker](bug-distribuicao-pwa-manifest-e-service-worker.md) | Manifest cita ícones e screenshots inexistentes e `/share` sem rota; service worker registrado duas vezes e atualizando sem aviso apesar de `registerType: prompt`; banner e hook não montados; replay e plugin do Sentry sem efeito. |
| [discovery-distribuicao-app-mobile-e-monetizacao](discovery-distribuicao-app-mobile-e-monetizacao.md) | Proposta de Capacitor, anúncios premiados, passe e loja de cosméticos; nada implementado. |
| [discovery-distribuicao-canais-e-pacotes](discovery-distribuicao-canais-e-pacotes.md) | TWA/Play Store, Steam/Electron e política de privacidade; congelada até o ADR 0010 ser aprovado |

## Persistência

| Spec | Resumo |
|---|---|
| [bug-persistencia-schemas-strict-e-migracao](bug-persistencia-schemas-strict-e-migracao.md) | Schemas `.strict()` descartam o save inteiro por uma chave a mais, `SaveMigration.ts` é código morto, saves sem schema, conquistas em duas chaves, `usePWA` fora do módulo e teto de 10 em `unspentSealPoints`. |
| [feature-persistencia-cloud-save](feature-persistencia-cloud-save.md) | Proposta de save em nuvem (login, sincronização com `localStorage`, privacidade); não implementada e sem aprovação. |

## Combate

| Spec | Resumo |
|---|---|
| [bug-combate-custo-de-skill-duplicado](bug-combate-custo-de-skill-duplicado.md) | Skill cobra custo duas vezes; `blood_tendrils` sem desbloqueio, textos de talentos e prestígio errados, nível sobe sem abrir o `LevelUpModal`. |
| [bug-combate-status-duplicado](bug-combate-status-duplicado.md) | Status aplicado em dobro (% do HP máximo + tick fixo com i-frames), projétil ignora a escala por andar/afixo e ramo `boss_slam` morto por id errado. |

## Progressão

| Spec | Resumo |
|---|---|
| [bug-progressao-bonus-de-equipamento-acumulam](bug-progressao-bonus-de-equipamento-acumulam.md) | Bônus de armas, armaduras e relíquias acumulam a cada pickup; crítico, regeneração e redução de cooldown gerados não têm efeito. |
| [bug-progressao-conquistas-e-codice-inalcancaveis](bug-progressao-conquistas-e-codice-inalcancaveis.md) | 3 conquistas sem escritor, `gargoyle_hunter` e `all_spells` com meta errada, 4 entradas do Códice sem desbloqueio, `scout_beast` sem entrada e resgate sem multiplicador de relíquia. |
| [bug-progressao-orbes-modificadores-e-reliquias](bug-progressao-orbes-modificadores-e-reliquias.md) | Orbes de HP/mana nunca são criados, modificadores de run não podem ser ativados e 5 relíquias não têm como ser desbloqueadas. |
