---
name: phaser-4-fx-filters
description: Filtros visuais, shaders de pós-processamento, Glow, Vignette, Bloom, renderizador Beam e limites de performance no Phaser 4.2.1 para o Bloodmage 1995.
---

# 🔮 Skill: Phaser 4.2.1 Filters, Shaders & Post-Processing (Beam Renderer)

Esta skill ensina a utilizar o novo subsistema de **Filters** do renderizador WebGL2 (**Beam Renderer**) no **Phaser 4.2.1**, garantindo atmosfera gótica imersiva e mantendo a taxa de 60 FPS no **Bloodmage 1995**.

---

## ⚡ 1. A Regra de Ouro dos Filtros no Phaser 4

> ⚠️ **ATENÇÃO:** No Phaser 4, em qualquer Game Object (Sprite, Image, Text), a propriedade `filters` inicia como `null` até que você chame explicitamente `enableFilters()`.
> Chamar `sprite.filters.internal...` sem antes chamar `sprite.enableFilters()` causa um erro fatal de runtime: `Cannot read properties of null`.
> As **Câmeras** são a única exceção (a propriedade `this.cameras.main.filters` já vem instanciada).

```typescript
// ✅ FORMA CORRETA para Game Objects:
sprite.enableFilters();
sprite.filters!.internal.addGlow(0x880000, 3, 0, 1);

// ✅ FORMA CORRETA para Câmeras:
this.cameras.main.filters.external.addVignette(0.5, 0.5, 0.45, 0.6);
```

---

## 🌓 2. Filtros Internos vs Externos (`internal` vs `external`)

O Phaser 4 divide a lista de filtros em dois escopos distintos:

| Escopo | Descrição | Uso Típico |
| :--- | :--- | :--- |
| `filters.internal` | Roda no espaço local do próprio objeto. Move-se e rotaciona junto com ele. | Glow de magia de sangue em armas, brilho em relíquias, silhueta de feitiço. |
| `filters.external` | Roda no espaço de tela da câmera ou do buffer final. | Vinheta gótica da masmorra, névoa escura, distorção de insanidade, color grading. |

---

## 🕯️ 3. Efeitos Atmosféricos Típicos no Bloodmage 1995

### A. Aura Sanguínea / Glow em Relíquias e Elites
```typescript
export function applyBloodAura(sprite: Phaser.GameObjects.Sprite): void {
  const isWebGL = (sprite.scene.game.renderer as any)?.isWebGL === true;
  if (!isWebGL || typeof sprite.enableFilters !== 'function') return;

  sprite.enableFilters();
  if (sprite.filters?.internal) {
    // Glow vermelho escuro com intensidade controlada
    sprite.filters.internal.addGlow(0xaa1122, 4, 0, 1.2);
  }
}
```

### B. Vinheta de Masmorra e Névoa Gótica na Câmera
```typescript
export function setupDungeonAtmosphere(camera: Phaser.Cameras.Scene2D.Camera): void {
  const isWebGL = (camera.scene.game.renderer as any)?.isWebGL === true;
  if (!isWebGL || !camera.filters?.external) return;

  // Vinheta escurecendo as bordas da tela (aspecto opressivo de 1995)
  camera.filters.external.addVignette(0.5, 0.5, 0.35, 0.7);
}
```

---

## 🛡️ 4. Padrão Defensivo de Fallback para Testes (Vitest / Headless)

Em ambientes headless ou navegadores onde WebGL2 não está disponível, a inicialização de filtros pode falhar. **Sempre proteja o código:**

```typescript
export function safeAddGlow(target: Phaser.GameObjects.Sprite, color: number): void {
  try {
    const renderer = target.scene?.game?.renderer as any;
    if (renderer?.isWebGL && typeof target.enableFilters === 'function') {
      target.enableFilters();
      target.filters?.internal.addGlow(color, 3, 0, 1);
      return;
    }
  } catch (err) {
    // Ignora silenciosamente em ambiente headless
  }

  // Fallback seguro: tint visual clássico
  target.setTint(color);
}
```

---

## ⏱️ 5. Orçamento de Performance (VRAM & 60 FPS)

1. **Limite de Filtros Full-Screen**:
   - No máximo **2 filtros externos ativos** na câmera principal em qualquer momento (ex: Vinheta + Leve Color Grading). Excesso de passes de pós-processamento derruba a taxa de quadros em dispositivos móveis e navegadores modestos.
2. **Descarte Imediato**:
   - Ao destruir uma entidade ou mudar de fase, chame `sprite.filters?.clear()` ou `sprite.disableFilters()` para liberar os framebuffers da GPU.
3. **Respeito ao Guardrail #7**:
   - Filtros de shader pertencem ao mundo do jogo e à câmera de renderização. Toda interface, textos de dano na tela, barras e menus são renderizados como elementos DOM React no topo do canvas.
