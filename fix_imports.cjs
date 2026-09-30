const fs = require('fs');

function restoreImports(file) {
  let content = fs.readFileSync(file, 'utf8');

  // If imports don't exist, add them at the top
  if (!content.includes('import titleLogoUrl')) {
    const imports = `import titleLogoUrl from "@/assets/ui/title-logo.png";
import gargoyleTopUrl from "@/assets/ui/gargoyle-top.png";
import gargoyleBottomUrl from "@/assets/ui/gargoyle-bottom.png";
import torchUrl from "@/assets/ui/torch.png";
import altarUrl from "@/assets/ui/altar.png";
import runeArchUrl from "@/assets/ui/rune-arch.png";
import stoneTileUrl from "@/assets/ui/stone-tile.jpg";
import rockTileUrl from "@/assets/ui/rock-tile.jpg";
`;
    // Insert after the first few imports (e.g. Phaser)
    content = content.replace(/(import Phaser from "phaser";\n)/, "$1" + imports);
  }

  // Also UI components if missing
  if (!content.includes('import cornerUrl') && (file.includes('SettingsScene') || file.includes('RecordsScene'))) {
    const uiImports = `import cornerUrl from "@/assets/ui/ui-corner.png";
import plaqueUrl from "@/assets/ui/ui-plaque.png";
import gemUrl from "@/assets/ui/ui-gem.png";
import capUrl from "@/assets/ui/ui-slider-cap.png";
`;
    content = content.replace(/(import Phaser from "phaser";\n)/, "$1" + uiImports);
  }

  // Restore the usages
  content = content.replace(/"\/assets\/ui\/title-logo\.png"/g, 'titleLogoUrl');
  content = content.replace(/"\/assets\/ui\/gargoyle-top\.png"/g, 'gargoyleTopUrl');
  content = content.replace(/"\/assets\/ui\/gargoyle-bottom\.png"/g, 'gargoyleBottomUrl');
  content = content.replace(/"\/assets\/ui\/torch\.png"/g, 'torchUrl');
  content = content.replace(/"\/assets\/ui\/altar\.png"/g, 'altarUrl');
  content = content.replace(/"\/assets\/ui\/rune-arch\.png"/g, 'runeArchUrl');
  content = content.replace(/"\/assets\/ui\/stone-tile\.jpg"/g, 'stoneTileUrl');
  content = content.replace(/"\/assets\/ui\/rock-tile\.jpg"/g, 'rockTileUrl');
  
  content = content.replace(/"\/assets\/ui\/ui-corner\.png"/g, 'cornerUrl');
  content = content.replace(/"\/assets\/ui\/ui-plaque\.png"/g, 'plaqueUrl');
  content = content.replace(/"\/assets\/ui\/ui-gem\.png"/g, 'gemUrl');
  content = content.replace(/"\/assets\/ui\/ui-slider-cap\.png"/g, 'capUrl');

  fs.writeFileSync(file, content);
}

restoreImports('src/game/scenes/TitleScene.ts');
restoreImports('src/game/scenes/SettingsScene.ts');
restoreImports('src/game/scenes/RecordsScene.ts');
