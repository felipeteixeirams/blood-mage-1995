---
name: phaser-4-playtest-harness
description: Verificação em tempo de execução para Phaser 4.2.1, testes de fumaça headless via Playwright, detecção de telas pretas, assets 404 e erros de ciclo de vida de Scenes no Bloodmage 1995.
---

# 🧪 Skill: Phaser 4.2.1 Playtest Harness & Runtime Verification

Esta skill ensina a realizar **verificação de runtime automatizada** para jogos em Phaser 4.2.1, prevenindo regressões silenciosas que passam despercebidas pelo compilador TypeScript (`tsc --noEmit`).

---

## 🛑 Por que TypeScript Não é Suficiente?

O comando `pnpm run typecheck` ou `tsc --noEmit` garante apenas a validade sintática e de tipos do código. Ele **não detecta**:

| Falha Comum | Sintoma para o Jogador | O que o TypeScript diz |
| :--- | :--- | :--- |
| Erro de digitação na chave do asset | Sprite invisível / crash silencioso | Nada (chaves são strings) |
| Cena faltando no array `scene: []` | Tela preta completa | Nada (o array aceita qualquer cena) |
| Exceção lançada dentro de `create()` | Masmorra pela metade / trava o loop | Nada |
| Câmera com zoom 0 ou fora do mapa | Canvas em branco | Nada |
| `enableFilters()` não chamado antes de acessar `filters` | Crash de WebGL em runtime | Nada |
| Emitter de partículas sem limite de vida | Queda para 10 FPS | Nada |

---

## 🚀 1. Estrutura do Teste de Fumaça (Smoke Test)

No Bloodmage 1995, utilizamos o **Playwright** (`pnpm test:e2e`) para validar se o jogo realmente sobe e roda:

### O que o teste deve verificar:
1. **O Canvas foi renderizado?** Um elemento `<canvas>` existe com dimensões maiores que 0.
2. **A instância do Phaser existe?** `window.__PHASER_GAME__` ou o objeto do jogo está inicializado.
3. **O jogo completou o boot?** `game.isBooted === true`.
4. **A cena principal está ativa?** A cena `GameScene` está no estado `running` e contém Game Objects instanciados.
5. **Console limpo de erros críticos?** Nenhum erro 404 de imagem/áudio e nenhum uncaught error de shader.

---

## 📋 2. Exemplo de Verificação Automatizada no Playwright

```typescript
import { test, expect } from '@playwright/test';

test('Phaser 4 Engine boots cleanly without black screen or WebGL errors', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  await page.goto('/');

  // 1. Aguarda a montagem do canvas do Phaser
  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible({ timeout: 10000 });

  // 2. Confere dimensões não nulas
  const box = await canvas.boundingBox();
  expect(box?.width).toBeGreaterThan(100);
  expect(box?.height).toBeGreaterThan(100);

  // 3. Aguarda boot da engine e transição para GameScene
  await page.waitForFunction(() => {
    const game = (window as any).__PHASER_GAME__;
    if (!game || !game.isBooted) return false;
    const scene = game.scene.getScene('GameScene');
    return scene && scene.scene.isActive();
  }, { timeout: 15000 });

  // 4. Garante que nenhum erro fatal de WebGL/Shader ocorreu
  const fatalErrors = consoleErrors.filter(
    (err) => err.includes('WebGL') || err.includes('Shader') || err.includes('Cannot read properties of null')
  );
  expect(fatalErrors).toEqual([]);
});
```

---

## 🛡️ 3. Portão de Segurança Antes de Commits

Sempre que alterar códigos de renderização, física ou carregamento de assets:
1. Execute os testes unitários rápidos:
   ```bash
   pnpm test
   ```
2. Execute a verificação completa (typecheck + linters + testes):
   ```bash
   pnpm run verify
   ```
3. Se alterou o ciclo de vida de cenas ou o pipeline WebGL, rode o teste E2E:
   ```bash
   pnpm test:e2e
   ```
