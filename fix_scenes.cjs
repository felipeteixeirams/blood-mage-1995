const fs = require('fs');

function processScene(file) {
  let content = fs.readFileSync(file, 'utf8');

  // Remove the imports
  content = content.replace(/import \w+Url from "\@\/assets\/ui\/[^"]+";\n/g, '');

  // Remove the load.image calls
  content = content.replace(/this\.load\.image\("logo", titleLogoUrl\);\n/g, '');
  content = content.replace(/this\.load\.image\("gargoyleTop", gargoyleTopUrl\);\n/g, '');
  content = content.replace(/this\.load\.image\("gargoyleBottom", gargoyleBottomUrl\);\n/g, '');
  content = content.replace(/this\.load\.image\("torch", torchUrl\);\n/g, '');
  content = content.replace(/this\.load\.image\("altar", altarUrl\);\n/g, '');
  content = content.replace(/this\.load\.image\("runeArch", runeArchUrl\);\n/g, '');
  content = content.replace(/this\.load\.image\("stoneTile", stoneTileUrl\);\n/g, '');
  content = content.replace(/this\.load\.image\("rockTile", rockTileUrl\);\n/g, '');

  content = content.replace(/this\.load\.image\("corner", cornerUrl\);\n/g, '');
  content = content.replace(/this\.load\.image\("plaque", plaqueUrl\);\n/g, '');
  content = content.replace(/this\.load\.image\("gem", gemUrl\);\n/g, '');
  content = content.replace(/this\.load\.image\("sliderCap", capUrl\);\n/g, '');

  // Remove the loaderror listener since we don't need it if we aren't loading images
  content = content.replace(/this\.load\.setCORS\("anonymous"\);\n\s*this\.load\.on\("loaderror", \(fileObj: any\) => \{\n\s*const key = fileObj \? fileObj\.key : "";\n\s*if \(key\) \{\n\s*generateUITextures\(this, \[key\]\);\n\s*\}\n\s*\}\);\n/g, '');

  fs.writeFileSync(file, content);
}

processScene('src/game/scenes/TitleScene.ts');
processScene('src/game/scenes/SettingsScene.ts');
processScene('src/game/scenes/RecordsScene.ts');
