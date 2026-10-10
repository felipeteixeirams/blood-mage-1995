# TypeError `this.scene.tweens` em timer disparado depois do destroy

**Mestre:** [troubleshooting](README.md)
**Verificado em:** 2026-10-10
**Evidência da solução:** `src/game/objects/Enemy.ts` (`showEmote`, `spawnGibs`, bloco de hit flash em `takeDamage`), `src/game/systems/DismembermentSystem.ts`, `src/game/systems/CombatEffectsSystem.ts`

## Sintoma
Durante o combate (morte de inimigo, gibs, acerto de projétil) o console mostra `TypeError: undefined is not an object (evaluating 'this.scene.tweens')` e o loop de update trava. No Phaser 4 também aparece o aviso de que `setTintFill` foi removido.

## Causa raiz
`destroy()` de um GameObject zera a referência `scene`. Timers e tweens agendados antes (`time.delayedCall`, `time.addEvent`) disparam depois e acessam `this.scene.tweens` numa closure sobre o objeto já destruído. (Mecânica do `destroy()` conhecida do Phaser; não reverificada no pacote instalado por ausência de `node_modules`.)

`setTintFill()` foi substituído no Phaser 4 por `setTint(cor)` com `setTintMode(Phaser.TintModes.FILL)`.

## Solução
- Capturar `const scene = this.scene; if (!scene || !scene.add) return;` antes de agendar qualquer timer ou tween que sobreviva ao objeto, e usar `scene` (não `this.scene`) dentro dos callbacks.
- Dentro dos callbacks, guardar com `this.active` / `gib.active` / `decal.active` antes de tocar no objeto.
- Flash de dano: `setTint(0xffffff)` seguido de `setTintMode(Phaser.TintModes.FILL)` (com checagem de existência), depois `MULTIPLY`.

## Como verificar
```bash
grep -rn "setTintFill" src                                  # deve retornar vazio
grep -n "this\.scene\.tweens" src/game/objects/Enemy.ts     # callbacks atrasados não devem usar this.scene
```
Manual: matar inimigos em sequência rápida com gibs e observar o console sem `GLOBAL_EXCEPTION`.
