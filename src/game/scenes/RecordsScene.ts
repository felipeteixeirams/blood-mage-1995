import Phaser from "phaser";
import {
  createGlowTexture,
  createScanlineTexture,
} from "../../utils/uiTextures";
import { generateUITextures } from "../../utils/textureGenerator";
import { logger } from "../../utils/logger";

// Hybrid asset architecture (AGENTS.md): try the real physical asset first;
// create() falls back to the procedural generator only for keys that fail.
import rockTileUrl from "../../assets/ui/rock-tile.jpg";
import cornerUrl from "../../assets/ui/ui-corner.png";
import plaqueUrl from "../../assets/ui/ui-plaque.png";

export const BASE_W = 960;
export const BASE_H = 540;

const STORE_KEY = "bloodmage.records";

export type RecordEntry = { name: string; score: number; level: number };

const DEMO: RecordEntry[] = [
  { name: "VORTHAK", score: 98450, level: 12 },
  { name: "MORWENNA", score: 87120, level: 11 },
  { name: "GRIMHOLD", score: 74300, level: 10 },
  { name: "SELVARA", score: 61980, level: 8 },
  { name: "DRAKKEN", score: 53040, level: 7 },
  { name: "ISOLDE", score: 41220, level: 6 },
  { name: "KHARN", score: 32770, level: 5 },
  { name: "NYX", score: 21050, level: 4 },
];

function loadRecords(scene: Phaser.Scene): RecordEntry[] {
  const reg = scene.registry.get("scores");
  if (Array.isArray(reg) && reg.length > 0) {
    return reg.map((item: any, idx: number) => ({
      name: item.name || `BRUXO #${idx + 1}`,
      score: item.score || 0,
      level: item.levelReached || item.wave || 1,
    })).sort((a, b) => b.score - a.score).slice(0, 8);
  }
  try {
    const raw = localStorage.getItem("bloodmage_1995_high_scores") || localStorage.getItem(STORE_KEY);
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list) && list.length) {
        return list.map((item: any, idx: number) => ({
          name: item.name || `BRUXO #${idx + 1}`,
          score: item.score || 0,
          level: item.levelReached || item.wave || 1,
        })).sort((a: any, b: any) => b.score - a.score).slice(0, 8);
      }
    }
  } catch {
    /* ignore */
  }
  return DEMO;
}

function flicker(t: number, seed: number) {
  return (
    0.55 * Math.sin(t * 6.9 + seed) +
    0.28 * Math.sin(t * 14.3 + seed * 2.13) +
    0.17 * Math.sin(t * 27.7 + seed * 3.71)
  );
}

/** Draws a small 16-bit golden chalice/trophy into a graphics object. */
export function drawTrophy(g: Phaser.GameObjects.Graphics, x: number, y: number, s: number) {
  const gold = 0xe0b34a;
  const dark = 0x7a5312;
  const light = 0xffe9a8;
  g.fillStyle(dark, 1);
  g.fillRect(x - 9 * s, y + 9 * s, 18 * s, 3 * s);
  g.fillRect(x - 6 * s, y + 6 * s, 12 * s, 3 * s);
  g.fillStyle(gold, 1);
  g.fillRect(x - 2 * s, y + 1 * s, 4 * s, 6 * s);
  g.fillRect(x - 8 * s, y - 10 * s, 16 * s, 7 * s);
  g.fillRect(x - 6 * s, y - 3 * s, 12 * s, 3 * s);
  g.fillRect(x - 4 * s, y, 8 * s, 2 * s);
  // handles
  g.fillRect(x - 12 * s, y - 9 * s, 3 * s, 6 * s);
  g.fillRect(x + 9 * s, y - 9 * s, 3 * s, 6 * s);
  g.fillStyle(light, 1);
  g.fillRect(x - 6 * s, y - 9 * s, 3 * s, 5 * s);
}

export class RecordsScene extends Phaser.Scene {
  private t0 = 0;
  private lit: Phaser.GameObjects.Image[] = [];
  private plaqueGlow!: Phaser.GameObjects.Image;
  private rowGlows: Phaser.GameObjects.Image[] = [];

  constructor() {
    super("records");
  }

  preload() {
    this.load.image("rockTile", rockTileUrl);
    this.load.image("uiCorner", cornerUrl);
    this.load.image("uiPlaque", plaqueUrl);

    this.load.on("loaderror", (fileObj: Phaser.Loader.File) => {
      logger.warn("ASSET_LOADER", `RecordsScene: asset físico não encontrado [${fileObj?.key}] em '${fileObj?.url}'. Fallback procedural ativado.`, {
        key: fileObj?.key,
        url: fileObj?.url,
      });
    });
  }

  create() {
    const uiKeys = ["rockTile", "uiCorner", "uiPlaque"];
    const missingKeys = uiKeys.filter((k) => !this.textures.exists(k));
    if (missingKeys.length > 0) {
      logger.warn("ASSET_LOADER", `RecordsScene: ${missingKeys.length} asset(s) de UI usando fallback procedural.`, { missingKeys });
      generateUITextures(this, missingKeys);
    }

    createScanlineTexture(this, "scanline");
    createGlowTexture(this, "logoGlow", 512, "rgba(178,26,26,0.55)", "rgba(90,10,10,0.18)");
    createGlowTexture(this, "warmGlow", 512, "rgba(255,176,74,0.7)", "rgba(160,64,12,0.2)");

    this.buildBackdrop();
    this.buildFrame();
    this.buildHeader();
    this.buildList();
    this.buildButtons();
    this.buildOverlays();
  }

  private buildBackdrop() {
    const rock = this.add.tileSprite(0, 0, BASE_W, BASE_H, "rockTile").setOrigin(0);
    rock.setTileScale(0.55).setTint(0x2a2c33).setDepth(0);
    this.add.graphics().setDepth(0).fillStyle(0x05060a, 0.62).fillRect(0, 0, BASE_W, BASE_H);
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

    const size = 190;
    const mk = (x: number, y: number, fx: boolean, fy: boolean) => {
      const img = this.add.image(x, y, "uiCorner").setOrigin(fx ? 1 : 0, fy ? 1 : 0);
      img.setDisplaySize(size, size).setFlipX(fx).setFlipY(fy).setDepth(2).setAlpha(0.95);
      this.lit.push(img);
    };
    mk(14, 14, false, false);
    mk(BASE_W - 14, 14, true, false);
    mk(14, BASE_H - 14, false, true);
    mk(BASE_W - 14, BASE_H - 14, true, true);
  }

  private buildHeader() {
    const cx = BASE_W / 2;
    const plaque = this.add.image(cx, 64, "uiPlaque").setDisplaySize(560, 120).setDepth(3);
    this.lit.push(plaque);
    this.plaqueGlow = this.add
      .image(cx, 64, "logoGlow")
      .setDisplaySize(480, 160)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0.16)
      .setDepth(3);

    const trophyY = 64;
    const trophy = this.add.graphics().setDepth(5);
    drawTrophy(trophy, cx - 186, trophyY, 1.35);
    drawTrophy(trophy, cx + 186, trophyY, 1.35);

    this.add
      .text(cx, trophyY, "SALÃO DOS RECORDES", {
        fontFamily: "Georgia, 'Times New Roman', serif",
        fontSize: "28px",
        color: "#e8c25e",
        fontStyle: "bold",
        stroke: "#2a1608",
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setDepth(5)
      .setShadow(0, 3, "#000000", 5);
  }

  private buildList() {
    const records = loadRecords(this);
    const cx = BASE_W / 2;
    const w = 660;
    const startY = 176;
    const gap = 38;

    const head = (label: string, x: number, origin: number) =>
      this.add
        .text(x, startY - 22, label, {
          fontFamily: "monospace",
          fontSize: "13px",
          color: "#8f8a76",
          fontStyle: "bold",
        })
        .setOrigin(origin, 0.5)
        .setDepth(6);
    head("#", cx - w / 2 + 18, 0);
    head("BRUXO", cx - w / 2 + 64, 0);
    head("NÍVEL", cx + w / 2 - 150, 0.5);
    head("PONTOS", cx + w / 2 - 18, 1);

    records.forEach((r, i) => {
      const y = startY + i * gap;
      const top = i < 3;
      const row = this.add.graphics().setDepth(5);
      row.fillStyle(top ? 0x1c1218 : 0x101116, i % 2 ? 0.9 : 0.72);
      row.fillRoundedRect(cx - w / 2, y - 15, w, 30, 4);
      row.lineStyle(1, top ? 0x7a1420 : 0x2a2c33, 1);
      row.strokeRoundedRect(cx - w / 2, y - 15, w, 30, 4);

      if (top) {
        const glow = this.add
          .image(cx - w / 2 + 30, y, "logoGlow")
          .setDisplaySize(120, 70)
          .setBlendMode(Phaser.BlendModes.ADD)
          .setAlpha(0.25)
          .setDepth(5);
        this.rowGlows.push(glow);
        const g = this.add.graphics().setDepth(7);
        drawTrophy(g, cx - w / 2 + 30, y - 2, 0.62);
      }

      const color = top ? "#f0d8a8" : "#b9b1a0";
      this.add
        .text(cx - w / 2 + 18, y, `${i + 1}`, {
          fontFamily: "monospace",
          fontSize: "15px",
          color: top ? "#e0b34a" : "#7f7a6c",
          fontStyle: "bold",
        })
        .setOrigin(0, 0.5)
        .setDepth(7);
      this.add
        .text(cx - w / 2 + 64, y, r.name, {
          fontFamily: "monospace",
          fontSize: "16px",
          color,
          fontStyle: "bold",
        })
        .setOrigin(0, 0.5)
        .setDepth(7);
      this.add
        .text(cx + w / 2 - 150, y, `${r.level}`, {
          fontFamily: "monospace",
          fontSize: "15px",
          color,
        })
        .setOrigin(0.5)
        .setDepth(7);
      this.add
        .text(cx + w / 2 - 18, y, r.score.toLocaleString("pt-BR"), {
          fontFamily: "monospace",
          fontSize: "16px",
          color: top ? "#ffdf9a" : "#c9a227",
          fontStyle: "bold",
        })
        .setOrigin(1, 0.5)
        .setDepth(7);
    });
  }

  private buildButtons() {
    const y = BASE_H - 30;
    const w = 220;
    const x = BASE_W / 2;
    const g = this.add.graphics().setDepth(6);
    const draw = (hover: boolean) => {
      g.clear();
      g.fillStyle(hover ? 0x2a2b33 : 0x1a1b21, 1).fillRoundedRect(x - w / 2, y - 20, w, 40, 5);
      g.lineStyle(3, hover ? 0xe0c25a : 0x767a86, 1).strokeRoundedRect(x - w / 2, y - 20, w, 40, 5);
      g.lineStyle(1, 0x0a0a0c, 1).strokeRoundedRect(x - w / 2 + 6, y - 14, w - 12, 28, 3);
    };
    draw(false);
    const label = this.add
      .text(x, y, "VOLTAR", {
        fontFamily: "monospace",
        fontSize: "19px",
        color: "#ddd0a6",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(7)
      .setShadow(0, 2, "#000000", 2);

    this.add
      .zone(x, y, w, 44)
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
      .on("pointerdown", () => {
        const onClose = this.registry.get("onClose") as (() => void) | undefined;
        if (onClose) {
          onClose();
        } else if (this.scene.manager.getScene("title")) {
          this.scene.start("title");
        }
      });
  }

  private buildOverlays() {
    this.add
      .tileSprite(0, 0, BASE_W, BASE_H, "scanline")
      .setOrigin(0)
      .setAlpha(0.16)
      .setDepth(50);
  }

  override update(_time: number, delta: number) {
    this.t0 += delta / 1000;
    const t = this.t0;
    const n = (flicker(t, 1.7) + 1) / 2;
    this.plaqueGlow.setAlpha(0.12 + 0.08 * n + 0.04 * Math.sin(t * 1.6));
    const tint = Phaser.Display.Color.GetColor(
      Math.round(150 + 70 * n),
      Math.round(142 + 62 * n),
      Math.round(132 + 46 * n),
    );
    this.lit.forEach((o) => o.setTint(tint));
    this.rowGlows.forEach((glowObj, i) => {
      const p = (flicker(t * 0.8, i * 3.1 + 2) + 1) / 2;
      glowObj.setAlpha(0.18 + 0.16 * p);
    });
  }
}
