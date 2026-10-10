# Resolução de erros — Documento Mestre

**Contexto:** casos de erros complexos já resolvidos, com causa raiz e solução presentes no código atual. Não é histórico de tarefas.
**Leia quando:** depurar um erro estranho ou recorrente; procure o sintoma na tabela antes de investigar do zero.

## O que entra
Um caso só entra se cumprir todos os critérios:
1. Foi complexo ou é armadilha de plataforma ou SDK.
2. A causa raiz está confirmada (não é hipótese).
3. A solução existe no código atual, com evidência (arquivo e função).
4. Dá para verificar que o problema não voltou (teste, comando ou passo manual).

Cada caso segue: Sintoma, Causa raiz, Solução, Como verificar.

## Casos

| Caso | Sintoma |
|---|---|
| [png-corrompido-utf8](png-corrompido-utf8.md) | Fallback procedural com asset presente; `file` diz `data`; arquivo restaurado volta corrompido |
| [fallback-procedural-por-ordem-de-preload](fallback-procedural-por-ordem-de-preload.md) | Cenas de UI sempre mostram placeholders, com o asset íntegro e sem erro de carga |
| [phaser-recriado-a-cada-render](phaser-recriado-a-cada-render.md) | FPS cai no menu, áudio duplicado, vários `Phaser.Game` |
| [scene-indefinido-apos-destroy](scene-indefinido-apos-destroy.md) | `TypeError ... 'this.scene.tweens'` em combate; aviso de `setTintFill` |
| [unhandled-rejection-reason-vazio](unhandled-rejection-reason-vazio.md) | `[UNHANDLED_REJECTION] {"reason": {}}` sem causa |
| [joystick-base-fixa-sem-movimento-esquerda](joystick-base-fixa-sem-movimento-esquerda.md) | Tocar à esquerda move para a direita |
| [campanha-safe-house-rebake-crash-renderer](campanha-safe-house-rebake-crash-renderer.md) | Campanha trava com `reading 'resolution'` |
| [spritesheet-jogador-celulas-48-vs-68](spritesheet-jogador-celulas-48-vs-68.md) | Personagem "pula" ao parar/andar ou anda para a direção errada |
