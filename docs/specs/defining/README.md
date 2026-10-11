# Specs em definição — Documento Mestre

**Contexto:** specs de features e discoveries ainda sem aprovação do responsável; nenhuma está em `backlog/` ou `in-progress/`. O estado de cada uma contra o código foi verificado em 2026-10-10 por leitura estática (linha "Estado vs código" de cada spec); nada foi executado.
**Leia quando:** for propor, refinar ou pedir aprovação de uma spec, ou antes de implementar algo que possa já ter spec aqui. Mestre de specs: [specs](../README.md).



## Triagem (2026-10-11)

Classificação por tipo de bloqueio, feita por leitura das specs e dos ADRs. Nenhuma decisão de negócio foi tomada: a classe só diz o que falta antes de promover a `backlog/`. Toda spec ainda precisa da aprovação do responsável. Uma spec pode se encaixar em mais de uma classe; vale a que mais pesa.

| Classe | Significado | Qtd | Specs |
|---|---|---|---|
| A. Técnica | Correção de código com recomendação descrita; só faltam aprovação e valores pontuais | 6 | bug-audio-bgmgain-e-temas, bug-grafico-iluminacao-e-efeitos-sem-consumidor, bug-mundo-chunks-sobre-safe-house-e-fosso, bug-persistencia-schemas-strict-e-migracao, bug-ui-fora-do-react-e-codigo-morto, bug-assets-credencial-escrita-no-pixellab-client |
| B. Regra de negócio | Depende de balance, conteúdo, UX, arte ou escopo que é do responsável | 26 | bug-campanha-quests-dos-capitulos-2-a-4, bug-combate-custo-de-skill-duplicado, bug-combate-status-duplicado, bug-distribuicao-pwa-manifest-e-service-worker, bug-progressao-bonus-de-equipamento-acumulam, bug-progressao-conquistas-e-codice-inalcancaveis, bug-progressao-orbes-modificadores-e-reliquias, feature-assets-entrega-de-arte-pixel-lab, feature-assets-pipeline-geracao-de-prompt, feature-assets-pipeline-ingestao-de-sprite, feature-assets-sprites-bestiario, feature-assets-sprites-cenario, feature-assets-sprites-coletaveis, feature-assets-sprites-contrato-do-manifesto, feature-assets-sprites-emotes, feature-assets-sprites-feiticos-e-vfx, feature-assets-sprites-inimigo-piloto, feature-assets-sprites-jogador, feature-assets-sprites-npcs-e-retratos, feature-combate-ritmo-inicial, feature-eventos-eclipse-de-sangue, feature-eventos-infraestrutura-mundial, feature-mundo-clima-dinamico, feature-progressao-eco-vital, feature-ui-idioma-espanhol, feature-ui-moldura-9-slice |
| C. Aguarda ADR proposto | Depende de ADR ainda `Proposta` (tabela abaixo) | 13 | bug-controles-joysticks-e-gamepad, feature-controles-mira-e-alvo-inteligente, feature-grafico-camera-e-escala-de-entidades, feature-ui-hud-escala-e-personalizacao, feature-ui-modais-secundarios-e-gamepad, feature-grafico-calibracao-visual-por-bioma, feature-grafico-glow-e-pos-processamento-calibrados, feature-grafico-validacao-e-lifecycle, feature-mundo-topologia-continua, feature-grafico-efeitos-restantes, feature-audio-mixer-dinamico, feature-audio-fisico-hibrido, feature-assets-carga-atlas-e-normal-maps |
| D. Discovery | Ainda sem critérios fechados; precisa de decisões antes de virar feature | 5 | discovery-assets-direcao-artistica-e-escopo-visual, discovery-assets-licencas-e-politica-steam-de-ia, discovery-assets-orcamento-licencas-e-creditos, discovery-campanha-premissa-e-paradigma, discovery-progressao-identidade-e-build |
| E. Congelada | Fora do escopo atual por decisão aprovada | 1 | discovery-distribuicao-canais-e-pacotes |

ADRs `Proposta` que desbloqueiam specs (a aprovação é do responsável):

| ADR | Specs que dependem |
|---|---|
| 0001 | joysticks, modais secundários, eventos (infraestrutura e eclipse) |
| 0004 | joysticks, mira, câmera, escala do HUD |
| 0005 e 0013 | calibração visual, glow, validação gráfica, efeitos restantes, carga de assets |
| 0002 e 0003 | topologia contínua |
| 0006 | mixer dinâmico, áudio físico híbrido |
| 0014 | modais secundários |
| 0015 | pipeline de arte com IA |

## Gráfico

| Spec | Resumo |
|---|---|
| [bug-grafico-iluminacao-e-efeitos-sem-consumidor](bug-grafico-iluminacao-e-efeitos-sem-consumidor.md) | `ambientColor` por bioma e campos do `WorldManager` sem consumidor, `postProcessingEnabled` sem toggle e lido só na criação, `screenShakeEnabled` ignorado por `ScreenShake` e por ~10 chamadas de `cameras.main.shake`, e `startAmbient` sem chamada. |
| [feature-grafico-calibracao-visual-por-bioma](feature-grafico-calibracao-visual-por-bioma.md) | Calibração por bioma de luz Light2D, atmosfera, sombras, reflexos, partículas, shader de árvores e terreno; depende do ADR 0005 e de playtest humano |
| [feature-grafico-camera-e-escala-de-entidades](feature-grafico-camera-e-escala-de-entidades.md) | Câmera por resolução lógica e proporção de tela, zoom de chefe suave e escala de entidades por ocupação vertical |
| [feature-grafico-efeitos-restantes](feature-grafico-efeitos-restantes.md) | Se aprovada, entregar sobre a base atual: Pixelate, bloom por evento, Light2D em mais objetos, self-shadow, limite de luzes, normal map do jogador, toggle de qualidade, fallback sem WebGL e medição de FPS. |
| [feature-grafico-glow-e-pos-processamento-calibrados](feature-grafico-glow-e-pos-processamento-calibrados.md) | Glow e PostFX (vignette, ColorMatrix, displacement, tint) validados contra o Phaser 4.2.1 e calibrados, sem estado residual |
| [feature-grafico-validacao-e-lifecycle](feature-grafico-validacao-e-lifecycle.md) | Baseline, ordem de profundidade, limpeza em shutdown/reinício, orçamento de performance e antes/depois nas 10 cenas |

## Áudio

| Spec | Resumo |
|---|---|
| [bug-audio-bgmgain-e-temas](bug-audio-bgmgain-e-temas.md) | `bgmGain` nunca é atribuído (ambiente e reverb inertes), o passa-baixas do tinnitus fica sem sinal, o contador de vozes é sempre 0, sinos 32/48 inalcançáveis e a BGM nunca volta a `safe_house`. |
| [feature-audio-fisico-hibrido](feature-audio-fisico-hibrido.md) | Se aprovada, SFX de alta prioridade (conjuração, impacto de foice, rugidos) e a música migram gradualmente para arquivos, sem perder o som sintetizado como fallback. |
| [feature-audio-mixer-dinamico](feature-audio-mixer-dinamico.md) | Se aprovada, entregar no `soundEngine` o mixer dinâmico: percussão mais intensa com HP baixo, distorção em `frenzy`, áudio espacial de ameaças e SFX novos sintetizados. |

## Controles

| Spec | Resumo |
|---|---|
| [bug-controles-joysticks-e-gamepad](bug-controles-joysticks-e-gamepad.md) | Joysticks duplicados, mira sem joystick, gamepad lido de slot fixo e joystick virtual nativo (CJG) |
| [feature-controles-mira-e-alvo-inteligente](feature-controles-mira-e-alvo-inteligente.md) | Hitbox de alvo +30% no toque e pontuação de alvo por distância, HP e ameaça |

## UI

| Spec | Resumo |
|---|---|
| [bug-ui-fora-do-react-e-codigo-morto](bug-ui-fora-do-react-e-codigo-morto.md) | UI desenhada em cenas Phaser contra a regra "UI só em React", `onRestart` ignorado, componentes e código morto, `framer-motion` solto, textos sem i18n. |
| [feature-ui-hud-escala-e-personalizacao](feature-ui-hud-escala-e-personalizacao.md) | Escala global, opacidade, tamanho de botões e margens de safe area do HUD mobile, persistidos em `localStorage.ts` |
| [feature-ui-idioma-espanhol](feature-ui-idioma-espanhol.md) | Terceiro idioma (espanhol) com dicionário de 147 chaves, registro no i18n, schema e seletor de idioma |
| [feature-ui-modais-secundarios-e-gamepad](feature-ui-modais-secundarios-e-gamepad.md) | Modais secundários: maioria padronizada via `ModalBase` e gamepad integrado; faltam `HighScoresModal` com visual padrão, estilos de foco e ornamentos/halo nos retratos. |
| [feature-ui-moldura-9-slice](feature-ui-moldura-9-slice.md) | Se aprovada, a moldura gótica dos painéis e botões React vem de imagens 9-slice via CSS `border-image`, sem esticar a arte. |

## Mundo

| Spec | Resumo |
|---|---|
| [bug-mundo-chunks-sobre-safe-house-e-fosso](bug-mundo-chunks-sobre-safe-house-e-fosso.md) | `loadChunkBiome` gera chunks vizinhos sem deslocamento sobre a Safe House e o fosso; precisa de playtest para confirmar o efeito. |
| [feature-mundo-clima-dinamico](feature-mundo-clima-dinamico.md) | Se aprovado, cada zona pode definir um clima (chuva leve, trovão) que o `AtmosphereSystem` exibe. |
| [feature-mundo-topologia-continua](feature-mundo-topologia-continua.md) | Mundo contínuo estilo Dungeon Siege: gerador por trilha, setpieces e ecologia por habitat existem no código, mas não são chamados em produção; falta decidir qual gerador vale. |

## Campanha

| Spec | Resumo |
|---|---|
| [bug-campanha-quests-dos-capitulos-2-a-4](bug-campanha-quests-dos-capitulos-2-a-4.md) | O objetivo `discover_zone` dos capítulos 2 a 4 nunca avança (só existe o marco `altar_crimson`); proposta de disparo por zona. |
| [discovery-campanha-premissa-e-paradigma](discovery-campanha-premissa-e-paradigma.md) | Se aprovado, a campanha adota paradigma, lore e tema definidos pelo responsável como base de um ARPG clássico. |

## Eventos

| Spec | Resumo |
|---|---|
| [feature-eventos-eclipse-de-sangue](feature-eventos-eclipse-de-sangue.md) | Eclipse de Sangue com luz -30%, inimigos em `frenzy` e drop +50% (valores provisórios); nada implementado |
| [feature-eventos-infraestrutura-mundial](feature-eventos-infraestrutura-mundial.md) | Agenda em `worldEvents.json`, fonte de tempo e estado `activeWorldEvent`, base dos eventos mundiais; nada implementado |

## Assets

| Spec | Resumo |
|---|---|
| [bug-assets-credencial-escrita-no-pixellab-client](bug-assets-credencial-escrita-no-pixellab-client.md) | O cliente PixelLab só obtém a credencial do ambiente e falha com erro explicativo quando ela falta. |
| [discovery-assets-direcao-artistica-e-escopo-visual](discovery-assets-direcao-artistica-e-escopo-visual.md) | Se aprovada, o jogo troca gradualmente arte procedural por arte gótica licenciada, mantendo a legibilidade em mobile, sem quebrar o fallback procedural por chave. Esta spec fixa a direção e o escopo visual;... |
| [discovery-assets-licencas-e-politica-steam-de-ia](discovery-assets-licencas-e-politica-steam-de-ia.md) | O responsável decide quais fontes de IA a arte do jogo pode usar, com licença, uso comercial e requisitos da Steam verificados. |
| [discovery-assets-orcamento-licencas-e-creditos](discovery-assets-orcamento-licencas-e-creditos.md) | Se aprovada, todo asset externo respeita um orçamento e uma regra de licença, com créditos visíveis e registro de origem. |
| [feature-assets-carga-atlas-e-normal-maps](feature-assets-carga-atlas-e-normal-maps.md) | Se aprovada, arte externa entra por chave, sem quebrar o fallback procedural, carregando por cena e reportando falhas, sem perder FPS. |
| [feature-assets-entrega-de-arte-pixel-lab](feature-assets-entrega-de-arte-pixel-lab.md) | Se aprovada, a arte de 11 inimigos, 4 NPCs, `spr_portal`, `spr_skeleton_remains` e tiles entra no repositório como PNG no caminho do manifesto, com grade compatível e canal alpha, sem quebrar o fallback... |
| [feature-assets-pipeline-geracao-de-prompt](feature-assets-pipeline-geracao-de-prompt.md) | Se aprovado, um comando gera o prompt de arte de um inimigo a partir do guia de estilo e da especificação do inimigo. |
| [feature-assets-pipeline-ingestao-de-sprite](feature-assets-pipeline-ingestao-de-sprite.md) | Se aprovado, um comando valida o PNG limpo e o registra no manifesto, sem alterá-lo se a validação falhar. |
| [feature-assets-sprites-bestiario](feature-assets-sprites-bestiario.md) | Cada inimigo do bestiário tem sprite físico registrado no manifesto, mantendo o fallback procedural. |
| [feature-assets-sprites-cenario](feature-assets-sprites-cenario.md) | Tiles e objetos de cenário têm arte física registrada no manifesto, com fallback procedural. |
| [feature-assets-sprites-coletaveis](feature-assets-sprites-coletaveis.md) | Orbes, gemas, bolsa de loot e frasco têm sprite físico registrado no manifesto, com fallback procedural. |
| [feature-assets-sprites-contrato-do-manifesto](feature-assets-sprites-contrato-do-manifesto.md) | Toda chave do manifesto com arquivo usa o sprite físico, e toda chave sem arquivo mantém o fallback procedural. |
| [feature-assets-sprites-emotes](feature-assets-sprites-emotes.md) | Os ícones de emote têm sprite físico registrado no manifesto, com fallback procedural. |
| [feature-assets-sprites-feiticos-e-vfx](feature-assets-sprites-feiticos-e-vfx.md) | Projéteis, círculos, explosões e partículas têm sprite físico registrado no manifesto, com fallback procedural. |
| [feature-assets-sprites-inimigo-piloto](feature-assets-sprites-inimigo-piloto.md) | Um inimigo, registrado no manifesto com `frameWidth` e `frameHeight` iguais aos do arquivo, usa o sprite físico no jogo. |
| [feature-assets-sprites-jogador](feature-assets-sprites-jogador.md) | As variações do jogador (sem capuz, mantos tier 2/3, cajado, foice) têm arte física em vez de tint procedural. |
| [feature-assets-sprites-npcs-e-retratos](feature-assets-sprites-npcs-e-retratos.md) | Clérigo, alquimista, ferreiro e ancião têm sprite e retrato físicos registrados no manifesto. |

## Distribuição

| Spec | Resumo |
|---|---|
| [bug-distribuicao-pwa-manifest-e-service-worker](bug-distribuicao-pwa-manifest-e-service-worker.md) | Manifest cita ícones e screenshots inexistentes e `/share` sem rota; service worker registrado duas vezes e atualizando sem aviso apesar de `registerType: prompt`; banner e hook não montados; replay e plugin do Sentry sem efeito. |
| [discovery-distribuicao-canais-e-pacotes](discovery-distribuicao-canais-e-pacotes.md) | TWA/Play Store, Steam/Electron e política de privacidade; congelada até o ADR 0010 ser aprovado |

## Persistência

| Spec | Resumo |
|---|---|
| [bug-persistencia-schemas-strict-e-migracao](bug-persistencia-schemas-strict-e-migracao.md) | Schemas `.strict()` descartam o save inteiro por uma chave a mais, `SaveMigration.ts` é código morto, saves sem schema, conquistas em duas chaves, `usePWA` fora do módulo e teto de 10 em `unspentSealPoints`. |

## Combate

| Spec | Resumo |
|---|---|
| [bug-combate-custo-de-skill-duplicado](bug-combate-custo-de-skill-duplicado.md) | Skill cobra custo duas vezes; `blood_tendrils` sem desbloqueio, textos de talentos e prestígio errados, nível sobe sem abrir o `LevelUpModal`. |
| [bug-combate-status-duplicado](bug-combate-status-duplicado.md) | Status aplicado em dobro (% do HP máximo + tick fixo com i-frames), projétil ignora a escala por andar/afixo e ramo `boss_slam` morto por id errado. |
| [feature-combate-ritmo-inicial](feature-combate-ritmo-inicial.md) | Se aprovado, o início da campanha tem ritmo de 4 a 5 golpes por inimigo comum, sem stunlock sem controle de grupo. |

## Progressão

| Spec | Resumo |
|---|---|
| [bug-progressao-bonus-de-equipamento-acumulam](bug-progressao-bonus-de-equipamento-acumulam.md) | Bônus de armas, armaduras e relíquias acumulam a cada pickup; crítico, regeneração e redução de cooldown gerados não têm efeito. |
| [bug-progressao-conquistas-e-codice-inalcancaveis](bug-progressao-conquistas-e-codice-inalcancaveis.md) | 3 conquistas sem escritor, `gargoyle_hunter` e `all_spells` com meta errada, 4 entradas do Códice sem desbloqueio, `scout_beast` sem entrada e resgate sem multiplicador de relíquia. |
| [bug-progressao-orbes-modificadores-e-reliquias](bug-progressao-orbes-modificadores-e-reliquias.md) | Orbes de HP/mana nunca são criados, modificadores de run não podem ser ativados e 5 relíquias não têm como ser desbloqueadas. |
| [discovery-progressao-identidade-e-build](discovery-progressao-identidade-e-build.md) | Se aprovado, a campanha entrega crescimento gradual de poder e liberdade de build dentro de uma identidade fixa. |
| [feature-progressao-eco-vital](feature-progressao-eco-vital.md) | Se aprovado, abater um inimigo na Campanha cura o jogador por uma quantidade fixa e limitada. |
