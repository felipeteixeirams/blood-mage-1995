/**
 * Procedural UI textures generated at runtime (no external image needed):
 * rotating arcane spiral, soft light glows, flame particles and scanlines.
 */
import type Phaser from "phaser";

function makeCanvas(scene: Phaser.Scene, key: string, w: number, h: number) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const tex = scene.textures.createCanvas(key, w, h);
  return tex!;
}

/** Deep arcane vortex: layered logarithmic spiral arms. */
export function createSpiralTexture(scene: Phaser.Scene, key = "spiral", size = 720) {
  const tex = makeCanvas(scene, key, size, size);
  const ctx = tex.getContext();
  const c = size / 2;
  ctx.clearRect(0, 0, size, size);

  const arms = 3;
  const turns = 3.1;
  const layers = [
    { width: 26, alpha: 0.3, color: "#5a5170" },
    { width: 14, alpha: 0.35, color: "#7d7396" },
    { width: 6, alpha: 0.4, color: "#a79dc0" },
  ];
  layers.forEach((cfg, layer) => {
    for (let a = 0; a < arms; a++) {
      ctx.beginPath();
      const offset = (Math.PI * 2 * a) / arms + layer * 0.12;
      for (let t = 0; t <= 1; t += 0.004) {
        const ang = offset + t * Math.PI * 2 * turns;
        const r = 14 + Math.pow(t, 0.85) * (c - 24);
        const x = c + Math.cos(ang) * r;
        const y = c + Math.sin(ang) * r;
        if (t === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = cfg.color;
      ctx.globalAlpha = cfg.alpha;
      ctx.lineWidth = cfg.width;
      ctx.lineCap = "round";
      ctx.stroke();
    }
  });
  ctx.globalAlpha = 1;

  // Fade the arms out towards the rim and swallow the core in darkness.
  const fade = ctx.createRadialGradient(c, c, c * 0.12, c, c, c);
  ctx.globalCompositeOperation = "destination-in";
  fade.addColorStop(0, "rgba(0,0,0,0.15)");
  fade.addColorStop(0.35, "rgba(0,0,0,1)");
  fade.addColorStop(0.82, "rgba(0,0,0,0.9)");
  fade.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = fade;
  ctx.fillRect(0, 0, size, size);
  ctx.globalCompositeOperation = "source-over";

  tex.refresh();
  return key;
}

/** Soft radial gradient used for torch light, portal haze and particles. */
export function createGlowTexture(
  scene: Phaser.Scene,
  key: string,
  size: number,
  inner: string,
  outer: string,
  hardness = 0.0,
) {
  const tex = makeCanvas(scene, key, size, size);
  const ctx = tex.getContext();
  const c = size / 2;
  const g = ctx.createRadialGradient(c, c, size * hardness, c, c, c);
  g.addColorStop(0, inner);
  g.addColorStop(0.45, outer);
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  tex.refresh();
  return key;
}

/** 1x4 CRT scanline strip, tiled over the whole screen. */
export function createScanlineTexture(scene: Phaser.Scene, key = "scanline") {
  const tex = makeCanvas(scene, key, 4, 4);
  const ctx = tex.getContext();
  ctx.clearRect(0, 0, 4, 4);
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillRect(0, 2, 4, 2);
  tex.refresh();
  return key;
}

/** Pixel-ish blob used by the fire emitters. */
export function createEmberTexture(scene: Phaser.Scene, key = "ember", size = 16) {
  const tex = makeCanvas(scene, key, size, size);
  const ctx = tex.getContext();
  const c = size / 2;
  const g = ctx.createRadialGradient(c, c, 0, c, c, c);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.4, "rgba(255,225,170,0.9)");
  g.addColorStop(1, "rgba(255,150,40,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  tex.refresh();
  return key;
}
