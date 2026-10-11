# UI — Documento Mestre

**Contexto:** as telas do jogo como estão hoje: HUD em jogo, modais e telas fora do HUD, e as opções de acessibilidade. Descreve o código; não registra decisões. Verificação por leitura estática, sem execução.
**Leia quando:** for mexer em telas React (HUD, modais, menus), em atalhos de teclado e gamepad da interface ou nas opções de acessibilidade. Para as regras de jogo, veja [gameplay](../gameplay/README.md).

| Documento | Papel | Status |
|---|---|---|
| [hud.md](hud.md) | Componentes do HUD em jogo, atalhos de teclado, gamepad, joystick flutuante, hooks e i18n | verificado |
| [modals-and-screens.md](modals-and-screens.md) | Modais e telas fora do HUD (ModalBase, cenas Phaser embutidas) e componentes não montados | verificado |
| [accessibility.md](accessibility.md) | Ajustes de acessibilidade que existem no código; o que não existe | verificado |
| [input-and-controls.md](input-and-controls.md) | Teclado, gamepad, toque e joystick virtual: mapa de entradas em jogo e nos menus, hooks e haptics | verificado |
| [settings.md](settings.md) | Tela de opções: cada opção com chave, padrão, onde é lida e persistência | verificado |
| [i18n.md](i18n.md) | Idiomas, chaves, quem usa `t()` e textos fixos fora do i18n | verificado |
