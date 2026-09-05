---
name: phaser-4-animation-tweens
description: Padrões de animações frame-a-frame, tweens encadeados, timelines, game feel e máquinas de estados de ataque (FSM Windup-Strike-Recovery) no Phaser 4.2.1 para o Bloodmage 1995.
---

# 🎞️ Skill: Phaser 4.2.1 Animations, Tweens & Combat States

Esta skill ensina a construir animações frame-a-frame e sistemas de tweening no **Phaser 4.2.1**, integrados com a máquina de estados finitos (FSM) e o sistema de combate do **Bloodmage 1995**.

---

## 🎭 1. Animações de Spritesheet no Phaser 4

No Phaser 4, as animações são gerenciadas globalmente pelo `AnimationManager` (`this.anims`).

### A. Registro de Animações Globais
Cadastre as animações preferencialmente no `BootScene` ou `create()` da cena para evitar recriação desnecessária:

```typescript
// Exemplo: Animação de caminhada e ataque
create(): void {
  // Caminhada direcional
  if (!this.anims.exists('player-walk-se')) {
    this.anims.create({
      key: 'player-walk-se',
      frames: this.anims.generateFrameNumbers('bloodmage', { start: 9, end: 17 }),
      frameRate: 12,
      repeat: -1, // loop contínuo
    });
  }

  // Ataque telegrafado
  if (!this.anims.exists('cultist-attack')) {
    this.anims.create({
      key: 'cultist-attack',
      frames: this.anims.generateFrameNumbers('cultist_sword', { start: 8, end: 14 }),
      frameRate: 10,
      repeat: 0, // executa uma única vez
    });
  }
}
```

### B. Eventos de Ciclo de Vida da Animação
No Phaser 4, escute eventos diretamente no Sprite para sincronizar o combate:

```typescript
// Detecta momento exato do impacto e fim do golpe
sprite.on(Phaser.Animations.Events.ANIMATION_UPDATE, (anim: Phaser.Animations.Animation, frame: Phaser.Animations.AnimationFrame) => {
  if (anim.key === 'cultist-attack' && frame.index === 3) {
    // Frame ativo de dano (Strike) — ativa hitbox efêmera
    this.triggerMeleeHitbox(sprite);
  }
});

sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, (anim: Phaser.Animations.Animation) => {
  if (anim.key === 'cultist-attack') {
    // Entra na fase de recuperação (Recovery)
    sprite.fsm.transitionTo('Recovery');
  }
});
```

---

## ⚡ 2. Tweens Encadeados e Timelines no Phaser 4

O Phaser 4 unificou e modernizou a API de Tweens:

### A. Tween Simples com Easing
```typescript
this.tweens.add({
  targets: enemySprite,
  scaleX: 1.25,
  scaleY: 0.8,
  duration: 120,
  yoyo: true,
  ease: Phaser.Math.Easing.Back.Out,
  onComplete: () => {
    // Retorna à escala original
  }
});
```

### B. Encadeamento Nativo com `this.tweens.chain()`
Para sequências complexas de movimento, use `chain()` em vez de callbacks aninhados:

```typescript
this.tweens.chain({
  targets: bossSprite,
  tweens: [
    {
      // 1. Windup (elevação e contração telegrafada)
      scaleY: 1.3,
      scaleX: 0.85,
      y: '-=20',
      duration: 350,
      ease: 'Cubic.easeOut',
    },
    {
      // 2. Strike (impacto violento contra o chão)
      y: '+=20',
      scaleY: 0.75,
      scaleX: 1.35,
      duration: 90,
      ease: 'Expo.easeIn',
      onComplete: () => {
        this.cameras.main.shake(150, 0.015);
        this.soundEngine.playSfx('hammer_smash');
      }
    },
    {
      // 3. Recovery (retorno gradual ao repouso)
      scaleX: 1.0,
      scaleY: 1.0,
      duration: 400,
      ease: 'Quad.easeOut',
    }
  ]
});
```

---

## 🩸 3. Game Feel de Combate (Juice & Feedback)

### A. Hit Flash (Flash de Dano Branco)
Ao receber dano, aplique um flash branco puro por 60-90ms:
```typescript
export function applyHitFlash(scene: Phaser.Scene, target: Phaser.GameObjects.Sprite): void {
  target.setTintFill(0xffffff);
  scene.time.delayedCall(75, () => {
    if (target.active) {
      target.clearTint();
    }
  });
}
```

### B. Impact Stop (Hitstop / Micro-Freeze)
Congela levemente o alvo e o atacante por 2 a 3 frames para conferir peso ao golpe:
```typescript
export function applyHitstop(scene: Phaser.Scene, durationMs: number = 45): void {
  scene.physics.world.isPaused = true;
  scene.time.delayedCall(durationMs, () => {
    scene.physics.world.isPaused = false;
  });
}
```

---

## 🛡️ 4. Guardrails do Bloodmage 1995 (MANDATÓRIO)

1. **FSM Telegrafada Obrigatória (Guardrail #2)**:
   - Inimigos NUNCA causam dano por mero contato passivo (*touch damage* é estritamente proibido).
   - Todo golpe físico de inimigo deve transicionar explicitamente por:
     `Windup` (aviso visual sonoro) ➔ `Strike` (momento ativo do dano) ➔ `Recovery` (vulnerabilidade).
2. **Alinhamento de Bounding Box (Guardrail #6b)**:
   - Spritesheets exportados com dimensões diferentes (ex: Idle 48x48 vs Walk 68x68) devem ser alinhados pela caixa delimitadora inferior do personagem (`origin = (0.5, 0.85)` ou centralizado na base do pé) para evitar saltos visuais na transição de animações.
3. **Proibição de UI no Canvas (Guardrail #7)**:
   - NUNCA use tweens ou animações para criar botões, textos flutuantes de menu ou barras de vida em Canvas. A interface gráfica pertence exclusivamente aos componentes React overlay (`src/components/`).
