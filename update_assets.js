const fs = require('fs');

function processFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Remove the imports
  content = content.replace(/import \w+Url from "@\/assets\/ui\/[^"]+";\n/g, '');

  // Replace variables with literal strings
  content = content.replace(/titleLogoUrl/g, '"/assets/ui/title-logo.png"');
  content = content.replace(/gargoyleTopUrl/g, '"/assets/ui/gargoyle-top.png"');
  content = content.replace(/gargoyleBottomUrl/g, '"/assets/ui/gargoyle-bottom.png"');
  content = content.replace(/torchUrl/g, '"/assets/ui/torch.png"');
  content = content.replace(/altarUrl/g, '"/assets/ui/altar.png"');
  content = content.replace(/runeArchUrl/g, '"/assets/ui/rune-arch.png"');
  content = content.replace(/stoneTileUrl/g, '"/assets/ui/stone-tile.jpg"');
  content = content.replace(/rockTileUrl/g, '"/assets/ui/rock-tile.jpg"');
  
  content = content.replace(/cornerUrl/g, '"/assets/ui/ui-corner.png"');
  content = content.replace(/plaqueUrl/g, '"/assets/ui/ui-plaque.png"');
  content = content.replace(/gemUrl/g, '"/assets/ui/ui-gem.png"');
  content = content.replace(/capUrl/g, '"/assets/ui/ui-slider-cap.png"');

  // Also remove the console log I added earlier
  content = content.replace(/console\.log\("Image URL:", "[^"]+"\); /g, '');

  fs.writeFileSync(file, content);
}

processFile('src/game/scenes/TitleScene.ts');
processFile('src/game/scenes/SettingsScene.ts');
processFile('src/game/scenes/RecordsScene.ts');
