const fs = require('fs');
const path = 'src/game/scenes/TitleScene.ts';
let content = fs.readFileSync(path, 'utf8');

const oldEntries = `
    const entries: { label: string; action: () => void }[] = [
      {
        label: "BESTIÁRIO & LORE",
        action: () => {
          this.closeMenu();
          const fn = this.registry.get("onOpenBestiary") as (() => void) | undefined;
          if (fn) fn();
        },
      },
`;

const newEntries = `
    const entries: { label: string; action: () => void }[] = [
      {
        label: "ÁRVORE DE TALENTOS",
        action: () => {
          this.closeMenu();
          const fn = this.registry.get("onOpenTalents") as (() => void) | undefined;
          if (fn) fn();
        },
      },
      {
        label: "BESTIÁRIO & LORE",
        action: () => {
          this.closeMenu();
          const fn = this.registry.get("onOpenBestiary") as (() => void) | undefined;
          if (fn) fn();
        },
      },
`;

content = content.replace(oldEntries.trim(), newEntries.trim());
fs.writeFileSync(path, content);
