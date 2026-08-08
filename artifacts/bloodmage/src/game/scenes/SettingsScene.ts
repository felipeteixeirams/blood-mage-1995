import Phaser from "phaser";
import {
  createEmberTexture,
  createGlowTexture,
  createScanlineTexture,
} from "../../utils/uiTextures";
import { GameSettings } from "../../types/game";

import rockTileUrl from "../../assets/ui/rock-tile.jpg";
import stoneTileUrl from "../../assets/ui/stone-tile.jpg";
import cornerUrl from "../../assets/ui/ui-corner.png";
import plaqueUrl from "../../assets/ui/ui-plaque.png";
import gemUrl from "../../assets/ui/ui-gem.png";
import capUrl from "../../assets/ui/ui-slider-cap.png";

export const BASE_W = 960;
export const BASE_H = 540;

function flicker(t: number, seed: number) {
  return (
    0.55 * Math.sin(t * 6.9 + seed) +
    0.28 * Math.sin(t * 14.3 + seed * 2.13) +
    0.17 * Math.sin(t * 27.7 + seed * 3.71)
  );
}

type Slider = {
  key: keyof GameSettings;
  x: number;
  y: number;
  w: number;
  min: number;
  max: number;
  fill: Phaser.GameObjects.Graphics;
  gem: Phaser.GameObjects.Image;
  glow: Phaser.GameObjects.Image;
  value: Phaser.GameObjects.Text;
};

type Toggle = {
  key: keyof GameSettings;
  gem: Phaser.GameObjects.Image;
  box: Phaser.GameObjects.Graphics;
  x: number;
  y: number;
};

export class SettingsScene extends Phaser.Scene {
  private t0 = 0;
  private settingsState!: GameSettings;
  private savedState!: GameSettings;
  private sliders: Slider[] = [];
  private toggles: Toggle[] = [];
  private dragging: Slider | null = null;
  private scan!: Phaser.GameObjects.TileSprite;
  private plaqueGlow!: Phaser.GameObjects.Image;
  private logo!: Phaser.GameObjects.Text;
  private hint!: Phaser.GameObjects.Text;
  private lit: Phaser.GameObjects.Image[] = [];

  constructor() {
    super("settings");
  }

  preload() {
    this.load.image("rockTile", rockTileUrl);
    this.load.image("stoneTile", stoneTileUrl);
    this.load.image("uiCorner", cornerUrl);
    this.load.image("uiPlaque", plaqueUrl);
    this.load.image("uiGem", gemUrl);
    this.load.image("uiCap", capUrl);
  }

  create() {
    const initialSettings = (this.registry.get("settings") as GameSettings) || {
      minimapVisible: true,
      minimapAlpha: 0.65,
      animatedPortrait: true,
      sfxVolume: 1.0,
      bgmVolume: 1.0,
      virtualControlsOpacity: 0.5,
      touchSensitivity: 1.0,
      crtFilter: true,
      controlsMode: 'auto',
    };

    this.settingsState = { ...initialSettings };
    this.savedState = { ...initialSettings };

    createScanlineTexture(this, "scanline");
    createEmberTexture(this, "ember", 16);
    createGlowTexture(this, "gemGlow", 256, "rgba(226,32,54,0.75)", "rgba(120,8,18,0.25)");
    createGlowTexture(this, "warmGlow", 512, "rgba(255,176,74,0.7)", "rgba(160,64,12,0.2)");
    createGlowTexture(this, "logoGlow", 512, "rgba(178,26,26,0.55)", "rgba(90,10,10,0.18)");

    this.buildBackdrop();
    this.buildFrame();
    this.buildHeader();
    this.buildSliders();
    this.buildToggles();
    this.buildButtons();
    this.buildOverlays();
    this.bindInput();
    this.applyLive();
  }

  private buildBackdrop() {
    const rock = this.add.tileSprite(0, 0, BASE_W, BASE_H, "rockTile").setOrigin(0);
    rock.setTileScale(0.55).setTint(0x2a2c33).setDepth(0);

    const dark = this.add.graphics().setDepth(0);
    dark.fillStyle(0x05060a, 0.75).fillRect(0, 0, BASE_W, BASE_H);

    this.add
      .image(BASE_W / 2, BASE_H / 2, "warmGlow")
      .setDisplaySize(1100, 700)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0.06)
      .setDepth(0);
  }

  private buildFrame() {
    const g = this.add.graphics().setDepth(1);
    g.lineStyle(4, 0x11131a, 1).strokeRect(10, 10, BASE_W - 20, BASE_H - 20);
    g.lineStyle(2, 0x3d424f, 1).strokeRect(18, 18, BASE_W - 36, BASE_H - 36);

    const size = 180;
    const mk = (x: number, y: number, fx: boolean, fy: boolean) => {
      const img = this.add.image(x, y, "uiCorner").setOrigin(fx ? 1 : 0, fy ? 1 : 0);
      img.setDisplaySize(size, size).setFlipX(fx).setFlipY(fy).setDepth(2).setAlpha(0.95);
      this.lit.push(img);
      return img;
    };
    mk(14, 14, false, false);
    mk(BASE_W - 14, 14, true, false);
    mk(14, BASE_H - 14, false, true);
    mk(BASE_W - 14, BASE_H - 14, true, true);
  }

  private buildHeader() {
    const cx = BASE_W / 2;
    const plaque = this.add.image(cx, 54, "uiPlaque").setDisplaySize(600, 130).setDepth(3);
    this.lit.push(plaque);

    this.plaqueGlow = this.add
      .image(cx, 56, "logoGlow")
      .setDisplaySize(500, 160)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0.16)
      .setDepth(3);

    this.logo = this.add
      .text(cx, 50, "BLOODMAGE 1995", {
        fontFamily: "Georgia, 'Times New Roman', serif",
        fontSize: "42px",
        color: "#e8c76a",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(4)
      .setStroke("#2a1a06", 8)
      .setShadow(0, 4, "#000000", 4, true, true);

    this.add
      .text(cx, 98, "AJUSTES  E  CONFIGURAÇÕES", {
        fontFamily: "monospace",
        fontSize: "13px",
        color: "#8f8a76",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(4);
  }

  private sliderDefs: { key: keyof GameSettings; label: string; min: number; max: number }[] = [
    { key: "sfxVolume", label: "VOLUME DOS EFEITOS", min: 0, max: 1 },
    { key: "bgmVolume", label: "VOLUME DA MÚSICA", min: 0, max: 1 },
    { key: "virtualControlsOpacity", label: "OPACIDADE DOS CONTROLES", min: 0.2, max: 1 },
    { key: "touchSensitivity", label: "SENSIBILIDADE DE TOQUE", min: 0.5, max: 2.0 },
  ];

  private buildSliders() {
    const cx = BASE_W / 2;
    const w = 500;
    const startY = 145;
    const gap = 58;

    this.sliderDefs.forEach((def, i) => {
      const y = startY + i * gap;

      this.add
        .text(cx, y - 20, def.label, {
          fontFamily: "monospace",
          fontSize: "15px",
          color: "#e6d8ad",
          fontStyle: "bold",
        })
        .setOrigin(0.5)
        .setDepth(6)
        .setShadow(0, 2, "#000000", 2);

      const track = this.add.graphics().setDepth(5);
      track.fillStyle(0x0a0a0c, 1).fillRoundedRect(cx - w / 2, y + 2, w, 16, 4);
      track.lineStyle(2, 0xc9a227, 1).strokeRoundedRect(cx - w / 2, y + 2, w, 16, 4);

      const fill = this.add.graphics().setDepth(6);

      const capL = this.add.image(cx - w / 2 - 6, y + 10, "uiCap");
      capL.setDisplaySize(50, 50).setDepth(7);
      const capR = this.add.image(cx + w / 2 + 6, y + 10, "uiCap");
      capR.setDisplaySize(50, 50).setFlipX(true).setDepth(7);
      this.lit.push(capL, capR);

      const glow = this.add
        .image(cx, y + 10, "gemGlow")
        .setDisplaySize(110, 110)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setAlpha(0.5)
        .setDepth(7);
      const gem = this.add.image(cx, y + 10, "uiGem").setDisplaySize(40, 40).setDepth(8);

      const value = this.add
        .text(cx + w / 2 + 36, y + 10, "", {
          fontFamily: "monospace",
          fontSize: "14px",
          color: "#c9a227",
          fontStyle: "bold",
        })
        .setOrigin(0, 0.5)
        .setDepth(8);

      const s: Slider = { key: def.key, x: cx, y: y + 10, w, min: def.min, max: def.max, fill, gem, glow, value };
      this.sliders.push(s);

      const hit = this.add
        .zone(cx, y + 10, w + 80, 46)
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
      hit.on("pointerdown", (p: Phaser.Input.Pointer) => {
        this.dragging = s;
        this.setFromPointer(s, p.worldX);
      });

      this.renderSlider(s);
    });
  }

  private setFromPointer(s: Slider, worldX: number) {
    const fraction = Phaser.Math.Clamp((worldX - (s.x - s.w / 2)) / s.w, 0, 1);
    const rawVal = s.min + fraction * (s.max - s.min);
    const rounded = Math.round(rawVal * 100) / 100;

    (this.settingsState[s.key] as number) = rounded;
    this.renderSlider(s);
    this.applyLive();

    const onUpdate = this.registry.get("onUpdateSettings") as ((s: GameSettings) => void) | undefined;
    if (onUpdate) onUpdate(this.settingsState);
  }

  private renderSlider(s: Slider) {
    const rawVal = this.settingsState[s.key] as number;
    const fraction = Phaser.Math.Clamp((rawVal - s.min) / (s.max - s.min), 0, 1);
    const left = s.x - s.w / 2;
    
    s.fill.clear();
    s.fill.fillStyle(0x7a1420, 1).fillRoundedRect(left + 2, s.y - 6, Math.max(2, s.w * fraction - 4), 12, 3);
    s.fill.fillStyle(0xc9282f, 0.75).fillRect(left + 3, s.y - 5, Math.max(1, s.w * fraction - 6), 3);
    
    s.gem.x = left + s.w * fraction;
    s.glow.x = s.gem.x;
    s.value.setText(`${Math.round(fraction * 100)}%`);
  }

  private toggleDefs: { key: keyof GameSettings; label: string }[] = [
    { key: "crtFilter", label: "SCANLINES CRT" },
  ];

  private buildToggles() {
    const y = 398;
    const cx = BASE_W / 2;

    this.toggleDefs.forEach((def) => {
      const box = this.add.graphics().setDepth(6);
      const gem = this.add.image(cx - 90, y, "uiGem").setDisplaySize(24, 24).setDepth(7);
      
      this.add
        .text(cx - 68, y, def.label, {
          fontFamily: "monospace",
          fontSize: "14px",
          color: "#ccc0a0",
          fontStyle: "bold",
        })
        .setOrigin(0, 0.5)
        .setDepth(7);

      const t: Toggle = { key: def.key, gem, box, x: cx, y };
      this.toggles.push(t);
      this.renderToggle(t);

      this.add
        .zone(cx, y, 220, 36)
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on("pointerdown", () => {
          (this.settingsState[t.key] as boolean) = !(this.settingsState[t.key] as boolean);
          this.renderToggle(t);
          this.applyLive();

          const onUpdate = this.registry.get("onUpdateSettings") as ((s: GameSettings) => void) | undefined;
          if (onUpdate) onUpdate(this.settingsState);
        });
    });
  }

  private renderToggle(t: Toggle) {
    const on = this.settingsState[t.key] as boolean;
    t.box.clear();
    t.box.fillStyle(0x0c0d11, 0.85).fillRoundedRect(t.x - 110, t.y - 15, 220, 30, 5);
    t.box.lineStyle(2, on ? 0xc9a227 : 0x4a4740, 1).strokeRoundedRect(t.x - 110, t.y - 15, 220, 30, 5);
    t.gem.setAlpha(on ? 1 : 0.28).setTint(on ? 0xffffff : 0x6a6a6a);
  }

  private buildButtons() {
    const y = 468;
    const defs: { label: string; run: () => void }[] = [
      {
        label: "APLICAR",
        run: () => {
          this.savedState = { ...this.settingsState };
          const onUpdate = this.registry.get("onUpdateSettings") as ((s: GameSettings) => void) | undefined;
          if (onUpdate) onUpdate(this.settingsState);

          const onClose = this.registry.get("onClose") as (() => void) | undefined;
          if (onClose) onClose();
        },
      },
      {
        label: "RESTAURAR",
        run: () => {
          const defaults: GameSettings = {
            minimapVisible: true,
            minimapAlpha: 0.65,
            animatedPortrait: true,
            sfxVolume: 1.0,
            bgmVolume: 1.0,
            virtualControlsOpacity: 0.5,
            touchSensitivity: 1.0,
            crtFilter: true,
            controlsMode: 'auto',
          };
          this.settingsState = { ...defaults };
          this.sliders.forEach((s) => this.renderSlider(s));
          this.toggles.forEach((t) => this.renderToggle(t));
          this.applyLive();

          const onUpdate = this.registry.get("onUpdateSettings") as ((s: GameSettings) => void) | undefined;
          if (onUpdate) onUpdate(this.settingsState);
          this.flash("PADRÕES RESTAURADOS");
        },
      },
      {
        label: "SAIR",
        run: () => {
          const onClose = this.registry.get("onClose") as (() => void) | undefined;
          if (onClose) onClose();
        },
      },
    ];

    const w = 180;
    const spacing = 200;
    const startX = BASE_W / 2 - spacing;

    defs.forEach((def, i) => {
      const x = startX + i * spacing;
      const g = this.add.graphics().setDepth(6);
      const draw = (hover: boolean) => {
        g.clear();
        g.fillStyle(hover ? 0x2a2b33 : 0x1a1b21, 1).fillRoundedRect(x - w / 2, y - 18, w, 36, 5);
        g.lineStyle(3, hover ? 0xe0c25a : 0x767a86, 1).strokeRoundedRect(x - w / 2, y - 18, w, 36, 5);
        g.lineStyle(1, 0x0a0a0c, 1).strokeRoundedRect(x - w / 2 + 5, y - 13, w - 10, 26, 3);
      };
      draw(false);

      const label = this.add
        .text(x, y, def.label, {
          fontFamily: "monospace",
          fontSize: "16px",
          color: "#ddd0a6",
          fontStyle: "bold",
        })
        .setOrigin(0.5)
        .setDepth(7)
        .setShadow(0, 2, "#000000", 2);

      this.add
        .zone(x, y, w, 40)
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on("pointerover", () => {
          draw(true);
          label.setColor("#ffeec0");
        })
        .on("pointerout", () => {
          draw(false);
          label.setColor("#ddd0a6");
        })
        .on("pointerdown", def.run);
    });
  }

  private flash(msg: string) {
    this.hint.setText(msg).setAlpha(1);
    this.tweens.add({ targets: this.hint, alpha: 0, duration: 1800, delay: 700 });
  }

  private buildOverlays() {
    this.scan = this.add
      .tileSprite(0, 0, BASE_W, BASE_H, "scanline")
      .setOrigin(0)
      .setAlpha(0.16)
      .setDepth(50);

    this.hint = this.add
      .text(BASE_W / 2, 120, "", {
        fontFamily: "monospace",
        fontSize: "13px",
        color: "#e0b34a",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(52);
  }

  private applyLive() {
    this.scan.setAlpha(this.settingsState.crtFilter ? 0.16 : 0);
  }

  private bindInput() {
    this.input.on("pointermove", (p: Phaser.Input.Pointer) => {
      if (this.dragging && p.isDown) this.setFromPointer(this.dragging, p.worldX);
    });
    const stop = () => {
      this.dragging = null;
    };
    this.input.on("pointerup", stop);
    this.input.on("pointerupoutside", stop);
  }

  override update(_time: number, delta: number) {
    this.t0 += delta / 1000;
    const t = this.t0;
    const n = (flicker(t, 1.7) + 1) / 2;

    this.plaqueGlow.setAlpha(0.12 + 0.08 * n + 0.04 * Math.sin(t * 1.6));
    this.logo.y = 50 + Math.sin(t * 1.1) * 2;

    const level = 0.55 + 0.45 * n;
    const tint = Phaser.Display.Color.GetColor(
      Math.round(150 + 70 * level),
      Math.round(142 + 62 * level),
      Math.round(132 + 46 * level),
    );
    this.lit.forEach((o) => o.setTint(tint));

    this.sliders.forEach((s, i) => {
      const p = (flicker(t * 0.8, i * 3.1 + 2) + 1) / 2;
      s.glow.setAlpha(0.32 + 0.22 * p);
      s.glow.setDisplaySize(96 + 20 * p, 96 + 20 * p);
    });
  }
}
