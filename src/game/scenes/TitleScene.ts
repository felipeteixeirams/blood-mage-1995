import Phaser from "phaser";
import {
  createEmberTexture,
  createGlowTexture,
  createScanlineTexture,
  createSpiralTexture,
} from "../../utils/uiTextures";
import { generateUITextures } from "../../utils/textureGenerator";
import InputManager from "../systems/InputManager";
import titleLogoUrl from "../../assets/ui/title-logo.png";
import gargoyleTopUrl from "../../assets/ui/gargoyle-top.png";
import gargoyleBottomUrl from "../../assets/ui/gargoyle-bottom.png";
import torchUrl from "../../assets/ui/torch.png";
import altarUrl from "../../assets/ui/altar.png";
import runeArchUrl from "../../assets/ui/rune-arch.png";
import stoneTileUrl from "../../assets/ui/stone-tile.jpg";
import rockTileUrl from "../../assets/ui/rock-tile.jpg";

export const BASE_W = 960;
export const BASE_H = 540;

/** Deterministic pseudo-noise in [-1, 1] — the heartbeat of every flame. */
function flicker(t: number, seed: number) {
  return (
    0.55 * Math.sin(t * 6.9 + seed) +
    0.28 * Math.sin(t * 14.3 + seed * 2.13) +
    0.17 * Math.sin(t * 27.7 + seed * 3.71)
  );
}

type Torch = {
  x: number;
  y: number;
  seed: number;
  glow: Phaser.GameObjects.Image;
  halo: Phaser.GameObjects.Image;
  core: Phaser.GameObjects.Image;
  lit: Phaser.GameObjects.Image[];
  emitters: Phaser.GameObjects.Particles.ParticleEmitter[];
};

type Tintable = { setTint: (c: number) => unknown };

/** Small 16-bit golden chalice drawn with primitives. */
function drawTitleTrophy(g: Phaser.GameObjects.Graphics, x: number, y: number, s: number) {
  g.fillStyle(0x7a5312, 1);
  g.fillRect(x - 9 * s, y + 9 * s, 18 * s, 3 * s);
  g.fillRect(x - 6 * s, y + 6 * s, 12 * s, 3 * s);
  g.fillStyle(0xe0b34a, 1);
  g.fillRect(x - 2 * s, y + 1 * s, 4 * s, 6 * s);
  g.fillRect(x - 8 * s, y - 10 * s, 16 * s, 7 * s);
  g.fillRect(x - 6 * s, y - 3 * s, 12 * s, 3 * s);
  g.fillRect(x - 4 * s, y, 8 * s, 2 * s);
  g.fillRect(x - 12 * s, y - 9 * s, 3 * s, 6 * s);
  g.fillRect(x + 9 * s, y - 9 * s, 3 * s, 6 * s);
  g.fillStyle(0xffe9a8, 1);
  g.fillRect(x - 6 * s, y - 9 * s, 3 * s, 5 * s);
}

/** Blend two warm stone colours by a 0..1 light level. */
function warmTint(dark: number, bright: number, level: number) {
  const d = Phaser.Display.Color.IntegerToRGB(dark);
  const b = Phaser.Display.Color.IntegerToRGB(bright);
  const k = Phaser.Math.Clamp(level, 0, 1);
  return Phaser.Display.Color.GetColor(
    Math.round(d.r + (b.r - d.r) * k),
    Math.round(d.g + (b.g - d.g) * k),
    Math.round(d.b + (b.b - d.b) * k),
  );
}

export class TitleScene extends Phaser.Scene {
  private time0 = 0;
  private spiralA!: Phaser.GameObjects.Image;
  private spiralB!: Phaser.GameObjects.Image;
  private portalHaze!: Phaser.GameObjects.Image;
  private logo!: Phaser.GameObjects.Image;
  private logoGlow!: Phaser.GameObjects.Image;
  private prompt!: Phaser.GameObjects.Text;
  private torches: Torch[] = [];
  private litProps: Phaser.GameObjects.Image[] = [];
  private sideLit: Tintable[][] = [];
  private badges: Phaser.GameObjects.Container[] = [];
  private badgeActions: (() => void)[] = [];

  constructor() {
    super("title");
  }

  preload() {
    this.load.on("loaderror", (fileObj: any) => {
      const key = fileObj ? fileObj.key : "";
      if (key && !this.textures.exists(key)) {
        generateUITextures(this, [key]);
      }
    });

    this.load.image("logo", titleLogoUrl);
    this.load.image("gargoyleTop", gargoyleTopUrl);
    this.load.image("gargoyleBottom", gargoyleBottomUrl);
    this.load.image("torch", torchUrl);
    this.load.image("altar", altarUrl);
    this.load.image("runeArch", runeArchUrl);
    this.load.image("stoneTile", stoneTileUrl);
    this.load.image("rockTile", rockTileUrl);
  }

  create() {
    const uiKeys = [
      "logo", "gargoyleTop", "gargoyleBottom", "torch", "altar", "runeArch", "stoneTile", "rockTile"
    ];
    const missingKeys = uiKeys.filter((k) => !this.textures.exists(k));
    if (missingKeys.length > 0) {
      generateUITextures(this, missingKeys);
    }

    createSpiralTexture(this, "spiral", 720);
    createEmberTexture(this, "ember", 16);
    createScanlineTexture(this, "scanline");
    createGlowTexture(this, "torchGlow", 512, "rgba(255,176,74,0.85)", "rgba(214,96,20,0.28)");
    createGlowTexture(this, "fireCore", 128, "rgba(255,238,196,0.95)", "rgba(255,150,40,0.45)");
    createGlowTexture(this, "portalHaze", 512, "rgba(120,104,168,0.55)", "rgba(46,34,74,0.25)");
    createGlowTexture(this, "logoGlow", 512, "rgba(178,26,26,0.55)", "rgba(90,10,10,0.18)");
    createGlowTexture(this, "vignette", 512, "rgba(0,0,0,0)", "rgba(0,0,0,0.15)");

    this.buildBackdrop();
    this.buildPortal();
    this.buildPillars();
    this.buildFrame();
    this.buildTitle();
    this.buildTorches();
    this.buildHud();
    this.buildMenu();
    this.buildOverlays();

    InputManager.init();

    // Input listener to trigger game start when clicking main arena
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // If clicking near center/prompt/altar area
      if (pointer.y > 380 && pointer.y < 500 && pointer.x > 280 && pointer.x < 680) {
        if (!this.menuOpen) {
          const onStart = this.registry.get("onStartGame") as (() => void) | undefined;
          if (onStart) onStart();
        }
      }
    });

    this.input.keyboard?.on('keydown-SPACE', () => {
      if (!this.menuOpen) {
        const onStart = this.registry.get("onStartGame") as (() => void) | undefined;
        if (onStart) onStart();
      }
    });

    this.input.keyboard?.on('keydown-ENTER', () => {
      if (!this.menuOpen) {
        const onStart = this.registry.get("onStartGame") as (() => void) | undefined;
        if (onStart) onStart();
      }
    });

    this.input.keyboard?.on('keydown-C', () => {
      if (!this.menuOpen) {
        const onContinue = this.registry.get("onContinueGame") as (() => void) | undefined;
        if (onContinue) onContinue();
      }
    });

    this.input.keyboard?.on('keydown-P', () => {
      if (!this.menuOpen) {
        const onStart = this.registry.get("onStartGame") as (() => void) | undefined;
        if (onStart) onStart();
      }
    });
  }

  /* ---------------------------------------------------------------- layers */

  private buildBackdrop() {
    const rock = this.add.tileSprite(0, 0, BASE_W, BASE_H, "rockTile").setOrigin(0);
    rock.setTileScale(0.5).setTint(0x4a4a4a).setDepth(0);

    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.45).fillRect(0, 0, BASE_W, BASE_H);
    g.setDepth(0);
  }

  private buildPortal() {
    const cx = BASE_W / 2;
    const cy = 288;

    const void_ = this.add.graphics();
    void_.fillStyle(0x0a0710, 1);
    void_.fillRoundedRect(cx - 232, 44, 464, 470, { tl: 232, tr: 232, bl: 6, br: 6 });
    void_.setDepth(1);

    this.spiralA = this.add
      .image(cx, cy, "spiral")
      .setDisplaySize(470, 470)
      .setAlpha(0.85)
      .setBlendMode(Phaser.BlendModes.SCREEN)
      .setDepth(2);
    this.spiralB = this.add
      .image(cx, cy, "spiral")
      .setDisplaySize(320, 320)
      .setAlpha(0.45)
      .setBlendMode(Phaser.BlendModes.SCREEN)
      .setDepth(2);

    this.portalHaze = this.add
      .image(cx, cy, "portalHaze")
      .setDisplaySize(460, 460)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0.35)
      .setDepth(2);

    const arch = this.add.image(cx, 30, "runeArch").setOrigin(0.5, 0);
    arch.setDisplaySize(560, 350).setDepth(4).setName("lit");

    const altar = this.add.image(cx, 514, "altar").setOrigin(0.5, 1);
    altar.setDisplaySize(470, 190).setDepth(10).setName("lit");
    this.litProps = [arch, altar];
  }

  private buildPillars() {
    const mk = (x: number, flip: boolean) => {
      const pillar = this.add
        .tileSprite(x, 30, 214, 484, "stoneTile")
        .setOrigin(0)
        .setTileScale(0.42)
        .setTint(0x8a7359)
        .setDepth(3);
      pillar.setName("pillar");

      const top = this.add.image(x + (flip ? 52 : 124), 112, "gargoyleTop");
      top.setDisplaySize(200, 200).setFlipX(flip).setName("lit").setDepth(4);

      const bottom = this.add.image(x + (flip ? 58 : 118), 424, "gargoyleBottom");
      bottom.setDisplaySize(176, 176).setFlipX(flip).setName("lit").setDepth(4);
      return [pillar, top, bottom];
    };
    this.sideLit = [mk(30, false), mk(BASE_W - 244, true)];
  }

  private buildFrame() {
    const g = this.add.graphics();
    const t = 26;
    g.fillStyle(0x6d6a63, 1);
    g.fillRect(0, 0, BASE_W, t);
    g.fillRect(0, BASE_H - t, BASE_W, t);
    g.fillRect(0, 0, t, BASE_H);
    g.fillRect(BASE_W - t, 0, t, BASE_H);

    g.lineStyle(3, 0x9a968c, 1).strokeRect(4, 4, BASE_W - 8, BASE_H - 8);
    g.lineStyle(3, 0x2e2c29, 1).strokeRect(t, t, BASE_W - t * 2, BASE_H - t * 2);

    g.fillStyle(0x3a3833, 1);
    for (let x = 16; x < BASE_W; x += 48) {
      g.fillCircle(x, 13, 3);
      g.fillCircle(x, BASE_H - 13, 3);
    }
    for (let y = 16; y < BASE_H; y += 48) {
      g.fillCircle(13, y, 3);
      g.fillCircle(BASE_W - 13, y, 3);
    }

    g.fillStyle(0x9a6a2f, 1);
    const corner = (cx: number, cy: number, sx: number, sy: number) => {
      g.fillTriangle(cx, cy, cx + 78 * sx, cy, cx, cy + 78 * sy);
    };
    corner(6, 6, 1, 1);
    corner(BASE_W - 6, 6, -1, 1);
    corner(6, BASE_H - 6, 1, -1);
    corner(BASE_W - 6, BASE_H - 6, -1, -1);
  }

  private buildTitle() {
    const cx = BASE_W / 2;
    this.logoGlow = this.add
      .image(cx, 226, "logoGlow")
      .setDisplaySize(560, 300)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0.14)
      .setDepth(11);
    this.logo = this.add.image(cx, 226, "logo");
    this.logo.setDisplaySize(520, 291).setDepth(12);
  }

  private buildTorches() {
    const positions = [
      { x: 206, y: 300, flip: false },
      { x: BASE_W - 206, y: 300, flip: true },
    ];

    positions.forEach((p, i) => {
      const bracket = this.add.image(p.x, p.y, "torch").setFlipX(p.flip);
      bracket.setDisplaySize(140, 140).setName("lit").setDepth(6);

      const fx = p.x + (p.flip ? -20 : 20);
      const fy = p.y - 42;

      const glow = this.add
        .image(fx, fy, "torchGlow")
        .setDisplaySize(430, 430)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setAlpha(0.5)
        .setDepth(7);
      const halo = this.add
        .image(fx, fy, "torchGlow")
        .setDisplaySize(180, 180)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setAlpha(0.7)
        .setDepth(8);
      const core = this.add
        .image(fx, fy - 6, "fireCore")
        .setDisplaySize(52, 76)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(9);

      const fire = this.add.particles(fx, fy, "ember", {
        speed: { min: 12, max: 40 },
        angle: { min: 250, max: 290 },
        gravityY: -110,
        scale: { start: 1.5, end: 0.05 },
        alpha: { start: 0.95, end: 0 },
        lifespan: { min: 380, max: 720 },
        frequency: 22,
        quantity: 2,
        blendMode: "ADD",
        tint: [0xffe9b0, 0xffb43c, 0xf4711d, 0xc03a10],
      });
      fire.setDepth(9);

      const sparks = this.add.particles(fx, fy - 10, "ember", {
        speed: { min: 10, max: 34 },
        angle: { min: 240, max: 300 },
        gravityY: -160,
        scale: { start: 0.5, end: 0 },
        alpha: { start: 1, end: 0 },
        lifespan: { min: 700, max: 1500 },
        frequency: 180,
        quantity: 1,
        blendMode: "ADD",
        tint: [0xffd479, 0xff8a2b],
      });
      sparks.setDepth(9);

      this.torches.push({
        x: fx,
        y: fy,
        seed: i * 4.31 + 1.7,
        glow,
        halo,
        core,
        lit: [bracket],
        emitters: [fire, sparks],
      });
    });
  }

  private buildHud() {
    const mkBadge = (x: number, y: number, key: string, label: string, onClick?: () => void) => {
      const c = this.add.container(x, y);
      const w = 150;
      const g = this.add.graphics();
      g.fillStyle(0x14120f, 0.88).fillRoundedRect(-w / 2, -18, w, 36, 6);
      g.lineStyle(2, 0x8c8578, 1).strokeRoundedRect(-w / 2, -18, w, 36, 6);

      const badge = this.add.graphics();
      badge.fillStyle(0xc98a2b, 1).fillCircle(-w / 2 + 20, 0, 11);
      badge.lineStyle(2, 0x5a3c11, 1).strokeCircle(-w / 2 + 20, 0, 11);

      const k = this.add
        .text(-w / 2 + 20, 0, key, {
          fontFamily: "monospace",
          fontSize: "13px",
          color: "#20160a",
          fontStyle: "bold",
        })
        .setOrigin(0.5);

      const l = this.add
        .text(-w / 2 + 38, 0, label, {
          fontFamily: "monospace",
          fontSize: "14px",
          color: "#e8e2d4",
          fontStyle: "bold",
        })
        .setOrigin(0, 0.5);

      c.add([g, badge, k, l]);
      c.setAlpha(0.95).setDepth(30);

      if (onClick) {
        c.setSize(w, 36)
          .setInteractive({ useHandCursor: true })
          .on("pointerover", () => c.setAlpha(1))
          .on("pointerout", () => c.setAlpha(0.95))
          .on("pointerdown", onClick);
      }
      return c;
    };

    // Bottom badges for HUD options
    const continueAction = () => {
      const fn = this.registry.get("onContinueGame") as (() => void) | undefined;
      if (fn) fn();
    };
    const continueBadge = mkBadge(168, BASE_H - 62, "C", "CONTINUAR", continueAction);
    this.badges.push(continueBadge);
    this.badgeActions.push(continueAction);

    const startAction = () => {
      const fn = this.registry.get("onStartGame") as (() => void) | undefined;
      if (fn) fn();
    };
    const startBadge = mkBadge(BASE_W / 2, BASE_H - 62, "P", "JOGAR", startAction);
    this.badges.push(startBadge);
    this.badgeActions.push(startAction);

    const settingsAction = () => {
      this.toggleMenu();
    };
    const settingsBadge = mkBadge(BASE_W - 168, BASE_H - 62, "O", "OPÇÕES", settingsAction);
    this.badges.push(settingsBadge);
    this.badgeActions.push(settingsAction);

    const trophyButton = this.add.container(BASE_W - 76, 76).setDepth(31);
    const plate = this.add.graphics();
    const drawPlate = (hover: boolean) => {
      plate.clear();
      plate.fillStyle(hover ? 0x241f17 : 0x14120f, 0.92).fillRoundedRect(-28, -28, 56, 56, 10);
      plate.lineStyle(2, hover ? 0xe0c25a : 0x8c8578, 1).strokeRoundedRect(-28, -28, 56, 56, 10);
    };
    drawPlate(false);

    const cup = this.add.graphics();
    drawTitleTrophy(cup, 0, 2, 1.35);

    const glow = this.add
      .image(0, 0, "torchGlow")
      .setDisplaySize(120, 120)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0.25);

    trophyButton.add([glow, plate, cup]);
    trophyButton
      .setSize(56, 56)
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => drawPlate(true))
      .on("pointerout", () => drawPlate(false))
      .on("pointerdown", () => {
        const fn = this.registry.get("onOpenHighScores") as (() => void) | undefined;
        if (fn) fn();
      });

    this.add
      .text(BASE_W - 76, 110, "RECORDES", {
        fontFamily: "monospace",
        fontSize: "12px",
        color: "#d9c79a",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setShadow(0, 2, "#000000", 3)
      .setDepth(31);

    this.prompt = this.add
      .text(BASE_W / 2, BASE_H - 110, "PRESSIONE PARA INICIAR", {
        fontFamily: "monospace",
        fontSize: "22px",
        color: "#f0d8a8",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setShadow(0, 3, "#2a0808", 0, true, true)
      .setDepth(30)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => {
        const fn = this.registry.get("onStartGame") as (() => void) | undefined;
        if (fn) fn();
      });
  }

  /* ------------------------------------------------------------- menu */

  private menu?: Phaser.GameObjects.Container;
  private menuOpen = false;
  private menuIndex = 0;
  private menuItems: {
    label: string;
    text: Phaser.GameObjects.Text;
    marker: Phaser.GameObjects.Graphics;
    action: () => void;
  }[] = [];

  private buildMenu() {
    const cx = BASE_W / 2;
    const cy = BASE_H / 2 + 6;
    const w = 400;
    const h = 340;

    const c = this.add.container(cx, cy).setDepth(60).setVisible(false).setAlpha(0);

    const veil = this.add.graphics();
    veil.fillStyle(0x05040a, 0.72).fillRect(-cx, -cy, BASE_W, BASE_H);
    veil.setInteractive(new Phaser.Geom.Rectangle(-cx, -cy, BASE_W, BASE_H), Phaser.Geom.Rectangle.Contains);

    const panel = this.add.graphics();
    panel.fillStyle(0x0e0b10, 0.96).fillRoundedRect(-w / 2, -h / 2, w, h, 8);
    panel.lineStyle(3, 0x6b5a3a, 1).strokeRoundedRect(-w / 2, -h / 2, w, h, 8);
    panel.lineStyle(1, 0x2a1d12, 1).strokeRoundedRect(-w / 2 + 7, -h / 2 + 7, w - 14, h - 14, 5);

    panel.fillStyle(0x8c1f22, 1);
    panel.fillRect(-w / 2 + 26, -h / 2 + 46, w - 52, 2);

    const glow = this.add
      .image(0, -h / 2 + 26, "logoGlow")
      .setDisplaySize(360, 140)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0.2);

    const heading = this.add
      .text(0, -h / 2 + 26, "GRIMÓRIO & OPÇÕES", {
        fontFamily: "Georgia, 'Times New Roman', serif",
        fontSize: "22px",
        color: "#e8c25e",
        fontStyle: "bold",
        stroke: "#2a1608",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setShadow(0, 3, "#000000", 4);

    c.add([veil, glow, panel, heading]);

    const entries: { label: string; action: () => void }[] = [
      {
        label: "BESTIÁRIO & LORE",
        action: () => {
          this.closeMenu();
          const fn = this.registry.get("onOpenBestiary") as (() => void) | undefined;
          if (fn) fn();
        },
      },
      {
        label: "CONQUISTAS",
        action: () => {
          this.closeMenu();
          const fn = this.registry.get("onOpenAchievements") as (() => void) | undefined;
          if (fn) fn();
        },
      },
      {
        label: "RECORDES",
        action: () => {
          this.closeMenu();
          const fn = this.registry.get("onOpenHighScores") as (() => void) | undefined;
          if (fn) fn();
        },
      },
      {
        label: "AJUSTES",
        action: () => {
          this.closeMenu();
          const fn = this.registry.get("onOpenSettings") as (() => void) | undefined;
          if (fn) fn();
        },
      },
      { label: "VOLTAR", action: () => this.closeMenu() },
    ];

    entries.forEach((e, i) => {
      const y = -h / 2 + 76 + i * 48;
      const marker = this.add.graphics();
      drawTitleTrophy(marker, -w / 2 + 46, y, 0.55);
      marker.setVisible(false);

      const text = this.add
        .text(-w / 2 + 78, y, e.label, {
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: "20px",
          color: "#8f2b2b",
          fontStyle: "bold",
        })
        .setOrigin(0, 0.5)
        .setShadow(0, 3, "#000000", 3);

      const zone = this.add
        .zone(0, y, w - 40, 42)
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on("pointerover", () => this.highlight(i))
        .on("pointerdown", () => {
          this.highlight(i);
          e.action();
        });

      c.add([marker, text, zone]);
      this.menuItems.push({ label: e.label, text, marker, action: e.action });
    });

    this.menu = c;
    this.highlight(0);

    this.input.keyboard?.on("keydown", (ev: KeyboardEvent) => {
      if (ev.key === "o" || ev.key === "O") {
        this.toggleMenu();
        return;
      }
      if (!this.menuOpen) return;
      if (ev.key === "ArrowDown") this.highlight((this.menuIndex + 1) % this.menuItems.length);
      else if (ev.key === "ArrowUp")
        this.highlight((this.menuIndex - 1 + this.menuItems.length) % this.menuItems.length);
      else if (ev.key === "Enter" || ev.key === " ") this.menuItems[this.menuIndex]?.action();
      else if (ev.key === "Escape") this.closeMenu();
    });
  }

  private highlight(i: number) {
    this.menuIndex = i;
    this.menuItems.forEach((item, k) => {
      item.marker.setVisible(k === i);
      item.text.setColor(k === i ? "#f0d8a8" : "#8f2b2b");
    });
  }

  private toggleMenu() {
    if (this.menuOpen) this.closeMenu();
    else this.openMenu();
  }

  private openMenu() {
    if (!this.menu) return;
    this.menuOpen = true;
    this.highlight(0);
    this.menu.setVisible(true);
    this.tweens.add({ targets: this.menu, alpha: 1, duration: 160, ease: "Quad.easeOut" });
  }

  private closeMenu() {
    if (!this.menu) return;
    this.menuOpen = false;
    this.tweens.add({
      targets: this.menu,
      alpha: 0,
      duration: 140,
      onComplete: () => this.menu?.setVisible(false),
    });
  }

  private buildOverlays() {
    const scan = this.add
      .tileSprite(0, 0, BASE_W, BASE_H, "scanline")
      .setOrigin(0)
      .setAlpha(0.16)
      .setDepth(50);
    scan.setTileScale(1, 1);

    const vig = this.add.graphics().setDepth(51);
    vig.fillStyle(0x000000, 0.35);
    vig.fillRect(0, 0, BASE_W, 30);
    vig.fillRect(0, BASE_H - 30, BASE_W, 30);
  }

  /* ----------------------------------------------------------------- loop */

  override update(_time: number, delta: number) {
    const dt = delta / 1000;
    this.time0 += dt;
    const t = this.time0;

    this.spiralA.rotation += dt * 0.16;
    this.spiralB.rotation -= dt * 0.1;
    this.portalHaze.setAlpha(0.3 + 0.08 * Math.sin(t * 0.9));

    let ambient = 0;
    for (const torch of this.torches) {
      const n = flicker(t, torch.seed);
      const n2 = flicker(t * 1.7, torch.seed + 9.2);
      ambient += n;

      torch.glow.setAlpha(0.42 + 0.14 * n);
      torch.glow.setDisplaySize(420 + 46 * n, 420 + 34 * n2);
      torch.halo.setAlpha(0.6 + 0.18 * n2);
      torch.halo.setDisplaySize(168 + 26 * n2, 176 + 30 * n);
      torch.core.setDisplaySize(48 + 9 * n2, 74 + 16 * n);
      torch.core.x = torch.x + 2.5 * n2;
      torch.core.setAlpha(0.85 + 0.15 * n);

      const tint = warmTint(0x9d8d78, 0xffe0b0, 0.4 + 0.6 * ((n + 1) / 2));
      torch.lit.forEach((o) => o.setTint(tint));
    }

    const a = ambient / Math.max(1, this.torches.length);
    this.sideLit.forEach((group, i) => {
      const n = flicker(t, this.torches[i]?.seed ?? 1);
      const tint = warmTint(0x6d5b46, 0xb08f66, (n + 1) / 2);
      group.forEach((o) => o.setTint(tint));
    });
    const propTint = warmTint(0x7a6650, 0xb99a70, (a + 1) / 2);
    this.litProps.forEach((o) => o.setTint(propTint));

    this.logo.y = 226 + Math.sin(t * 1.1) * 3;
    this.logoGlow.setAlpha(0.22 + 0.12 * ((a + 1) / 2) + 0.05 * Math.sin(t * 2.2));

    this.prompt.setAlpha(0.45 + 0.55 * (0.5 + 0.5 * Math.sin(t * 3.2)));

    // Gamepad Navigation no Menu Principal
    if (InputManager.isGamepadConnected()) {
      if (!this.menuOpen) {
        if (InputManager.wasButtonPressed("a") || InputManager.wasButtonPressed("start")) {
          const fn = this.registry.get("onStartGame") as (() => void) | undefined;
          if (fn) fn();
        } else if (InputManager.wasButtonPressed("y") || InputManager.wasButtonPressed("select")) {
          this.openMenu();
        }
      } else {
        if (InputManager.wasButtonPressed("dpadDown")) {
          this.highlight((this.menuIndex + 1) % this.menuItems.length);
        } else if (InputManager.wasButtonPressed("dpadUp")) {
          this.highlight((this.menuIndex - 1 + this.menuItems.length) % this.menuItems.length);
        } else if (InputManager.wasButtonPressed("a") || InputManager.wasButtonPressed("start")) {
          this.menuItems[this.menuIndex]?.action();
        } else if (InputManager.wasButtonPressed("b") || InputManager.wasButtonPressed("select")) {
          this.closeMenu();
        }
      }
    }
  }
}
