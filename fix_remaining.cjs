const fs = require('fs');

function processScene(file) {
  let content = fs.readFileSync(file, 'utf8');

  content = content.replace(/\s*this\.load\.image\("uiCorner", [^)]+\);/g, '');
  content = content.replace(/\s*this\.load\.image\("uiPlaque", [^)]+\);/g, '');
  content = content.replace(/\s*this\.load\.image\("uiGem", [^)]+\);/g, '');
  content = content.replace(/\s*this\.load\.image\("uiCap", [^)]+\);/g, '');

  fs.writeFileSync(file, content);
}

processScene('src/game/scenes/SettingsScene.ts');
processScene('src/game/scenes/RecordsScene.ts');
