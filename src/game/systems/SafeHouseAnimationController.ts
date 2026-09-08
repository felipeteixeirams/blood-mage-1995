import Phaser from 'phaser';
import type { GameScene } from '../scenes/GameScene';
import { logger } from '../../utils/logger';

/**
 * SafeHouseAnimationController — Orquestra animações, tweens encadeados, emissores de partículas
 * e efeitos visuais sofisticados da Safe House, aproveitando todo o poder do Phaser 4.2.1.
 *
 * Responsabilidades:
 * - Maelen: patrulha, olhar para o jogador quando próximo
 * - Hearth: chama cintilante com particle emitter + tweens de escala/alpha
 * - Portal: shimmer/pulse com Light2D integration
 * - Supplies Chest: bobbing animation contínua
 * - Ambient props: tweens sutis para vida
 *
 * Todas as animações usam tweens encadeados (Phaser 4 chain API) para sequências suaves
 * e sincronizadas com 60 FPS.
 */
export class SafeHouseAnimationController {
  private scene: GameScene;
  private maelen: any | null = null;
  private hearth: any | null = null;
  private bed: any | null = null;
  private suppliesChest: any | null = null;
  private portal: any | null = null;
  private flameEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  private ambientProps: any[] = [];

  // Tweens active (para cleanup ao transicionar de cenas)
  private activeTweens: any[] = [];
  private updateHandler: (() => void) | null = null;

  constructor(scene: GameScene) {
    this.scene = scene;
  }

  /**
   * Inicializa o controller após a Safe House ter sido gerada.
   * Assume que Player, Maelen, Hearth, Bed, Chest, Portal já foram criados.
   */
  public initialize(): void {
    this.maelen = this.scene.npcsGroup.getChildren().find((npc: any) => npc.getData('npcType') === 'maelen') || null;
    this.hearth = this.scene.wallsGroup
      .getChildren()
      .find((obj: any) => obj && obj.texture && obj.texture.key === 'spr_hearth_fireplace') || null;
    this.bed = this.scene.wallsGroup
      .getChildren()
      .find((obj: any) => obj && obj.texture && obj.texture.key === 'spr_straw_bed') || null;
    this.suppliesChest = this.scene.chestsGroup.getChildren().find((obj: any) => obj.getData('questChest') === 'starter_dagger') || null;
    this.portal = this.scene.portalSprite || null;
    this.ambientProps = (this.scene.wallsGroup.getChildren() as any[]).filter(
      (obj: any) => obj && obj.texture && obj.texture.key && obj.texture.key.includes('safehouse_detail')
    );

    logger.info('SafeHouseAnimationController.initialize', 'Initializing Safe House animations', {
      hasMaelen: !!this.maelen,
      hasHearth: !!this.hearth,
      hasBed: !!this.bed,
      hasChest: !!this.suppliesChest,
      hasPortal: !!this.portal,
      ambientPropCount: this.ambientProps.length,
    });

    // Inicializar cada subsistema
    this.setupMaelenPatrol();
    this.setupHearthFlameEffect();
    this.setupChestBobbing();
    this.setupPortalShimmer();
    this.setupAmbientPropAnimations();

    // Update loop para Maelen olhar pro jogador
    this.updateHandler = () => this.updateMaelenFacing();
    this.scene.events.on('update', this.updateHandler);
  }

  /**
   * Maelen patrulha de um lado a outro, com breath idle quando parado.
   * Usa tweens sequenciais para movimento suave.
   */
  private setupMaelenPatrol(): void {
    if (!this.maelen) return;

    const patrolRange = 80; // pixels à esquerda e direita do centro
    const baseX = this.maelen.x;

    // Patrulha contínua: direita → esquerda → direita
    this.scene.tweens.add({
      targets: this.maelen,
      x: baseX + patrolRange,
      duration: 1500,
      ease: 'Linear',
      yoyo: true,
      repeat: -1,
      repeatDelay: 400,
    });
  }

  /**
   * Update loop: Maelen olha para o jogador quando está próximo (<150px).
   * Modula scaleX (flip) baseado em posição relativa.
   */
  private updateMaelenFacing(): void {
    if (!this.maelen || !this.scene.player) return;

    const dx = this.scene.player.x - this.maelen.x;
    const distance = Math.abs(dx);

    // Se mais perto que 150px, virar para o jogador
    if (distance < 150) {
      const newScaleX = dx > 0 ? 1 : -1;
      if (this.maelen.scaleX !== newScaleX) {
        this.maelen.setScale(newScaleX, 1);
      }
    }
    // Senão, continua seguindo a patrulha natural (já modulada por patrol tweens)
  }

  /**
   * Hearth: lareira com chama cintilante usando tweens de escala/alpha.
   *
   * Padrão de fogo realista com Phaser 4 Filters:
   * 1. Flame sprite com tweens de breathing (1.0 → 1.1 → 0.95 → 1.0 @ 0.8s)
   * 2. Internal Glow filter (orange 0xffb347, radius 4px)
   * 3. Light2D glow pulse (fallback se disponível)
   */
  private setupHearthFlameEffect(): void {
    if (!this.hearth) return;

    // ===== HEARTH FLAME TWEEN: Breathing effect =====
    const flameBreathTween = this.scene.tweens.add({
      targets: this.hearth,
      scaleX: 1.08,
      scaleY: 1.12,
      alpha: 0.95,
      duration: 400,
      yoyo: true,
      ease: 'Sine.InOut',
      repeat: -1,
    });

    this.activeTweens.push(flameBreathTween);

    // ===== PHASER 4 BEAM RENDERER GLOW FILTER (WebGL2) =====
    this.setupHearthGlowFilter();

    // ===== LIGHT2D DYNAMIC GLOW (fallback / complementary) =====
    if ((this.scene as any).lightingSystem?.addLightSource) {
      try {
        const hearthLight = (this.scene as any).lightingSystem.addLightSource({
          x: this.hearth.x,
          y: this.hearth.y,
          radius: 200,
          color: 0xffb347, // Orange quente
          intensity: 0.7,
        });

        // Pulse a luz junto com a chama
        const lightPulseTween = this.scene.tweens.add({
          targets: hearthLight,
          intensity: 0.85,
          duration: 400,
          yoyo: true,
          ease: 'Sine.InOut',
          repeat: -1,
        });

        this.activeTweens.push(lightPulseTween);
      } catch (e) {
        logger.warn('SafeHouseAnimationController.setupHearthFlameEffect', 'Could not add Light2D source', { error: String(e) });
      }
    }

    logger.info('SafeHouseAnimationController.setupHearthFlameEffect', 'Hearth flame effect initialized', {
      hasGlowFilter: !!this.hearth.filters,
      hasLight2D: !!(this.scene as any).lightingSystem?.addLightSource,
    });
  }

  /**
   * Adiciona Glow Filter (Phaser 4 Beam Renderer) ao hearth com fallback seguro.
   */
  private setupHearthGlowFilter(): void {
    if (!this.hearth) return;

    try {
      const renderer = this.scene.game.renderer as any;

      // Verificar se WebGL2 está disponível
      if (renderer?.isWebGL && typeof this.hearth.enableFilters === 'function') {
        this.hearth.enableFilters();

        if (this.hearth.filters?.internal) {
          // Adicionar glow interno: orange quente, radius 4px, sem offset, intensidade 1.2
          this.hearth.filters.internal.addGlow(0xffb347, 4, 0, 1.2);
          logger.info('SafeHouseAnimationController.setupHearthGlowFilter', 'Hearth glow filter applied', {
            color: '0xffb347',
            radius: 4,
          });
        }
      }
    } catch (e) {
      // Fallback silencioso: sem glow, continua funcionando
      logger.warn('SafeHouseAnimationController.setupHearthGlowFilter', 'Glow filter not available (Canvas/headless mode)', {
        error: String(e),
      });
    }
  }

  /**
   * Supplies Chest: bobbing suave contínuo (0 → -4px → 0 @ 1.5s).
   * Simula peso/suspensão levemente mágica.
   */
  private setupChestBobbing(): void {
    if (!this.suppliesChest) return;

    const baseY = this.suppliesChest.y;

    const bobbingTween = this.scene.tweens.add({
      targets: this.suppliesChest,
      y: baseY - 4,
      duration: 1500,
      yoyo: true,
      ease: Phaser.Math.Easing.Sine.InOut,
      repeat: -1,
    });

    this.activeTweens.push(bobbingTween);
  }

  /**
   * Portal de Descida: shimmer + pulse (escala 1.0 → 1.12 → 1.0 @ 0.9s).
   * Alpha também oscila para efeito de brilho etéreo.
   */
  /**
   * `scene.portalSprite` deixou de ser um portal mágico giratório — desde a
   * Fase D de `docs/specs/backlog/25_MUNDO_CONTINUO_CHUNK_STREAMING.md`
   * (`DungeonFlowController.revealDescentDoor()`) é uma porta física com luz
   * de tocha quente própria. Um scale-pulse + glow roxo etéreo (tratamento
   * antigo do portal giratório) ficaria errado numa porta de madeira/pedra
   * estática — aqui só um alpha shimmer bem sutil, convidando o jogador sem
   * parecer magia. Sem luz adicional: `revealDescentDoor()` já aplica tocha
   * quente na soleira, duplicar a fonte de luz aqui só competiria com ela.
   */
  private setupPortalShimmer(): void {
    if (!this.portal) return;

    const doorGlowTween = this.scene.tweens.add({
      targets: this.portal,
      alpha: 0.85,
      duration: 900,
      yoyo: true,
      ease: 'Sine.InOut',
      repeat: -1,
    });

    this.activeTweens.push(doorGlowTween);
  }

  /**
   * Ambient Props (tapete, estante, vela, ervas, barril, tapeçaria):
   * cada um recebe uma oscilação sutil diferente para simular "vida" ambiental.
   *
   * Técnica: deslocar cada prop com uma fase aleatória para parecer desincronizado.
   */
  private setupAmbientPropAnimations(): void {
    this.ambientProps.forEach((prop, index) => {
      const phaseOffset = (index * 0.3) % 1.0; // Fase desincronizada

      // Oscillate y posição: ±2px @ 2.5s por prop
      const propSwayTween = this.scene.tweens.add({
        targets: prop,
        y: prop.y - 2,
        duration: 2500 + index * 200, // Slight variation per prop
        yoyo: true,
        ease: Phaser.Math.Easing.Sine.InOut,
        repeat: -1,
        delay: phaseOffset * 500, // Stagger startup
      });

      this.activeTweens.push(propSwayTween);
    });

    logger.info('SafeHouseAnimationController.setupAmbientPropAnimations', 'Ambient props animation initialized', {
      propCount: this.ambientProps.length,
    });
  }

  /**
   * Limpa todos os tweens e emissores ao destruir (transição de cenas).
   */
  public destroy(): void {
    this.activeTweens.forEach((tween: any) => {
      if (tween && tween.isPlaying()) {
        tween.stop();
      }
    });
    this.activeTweens = [];

    if (this.flameEmitter) {
      this.flameEmitter.stop();
    }

    if (this.updateHandler) {
      this.scene.events.off('update', this.updateHandler);
      this.updateHandler = null;
    }

    logger.info('SafeHouseAnimationController.destroy', 'Safe House animation controller destroyed');
  }
}
