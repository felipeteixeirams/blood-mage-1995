const fs = require('fs');
const files = [
  'src/game/objects/Player.ts',
  'src/game/objects/Enemy.ts',
  'src/game/objects/Scavengeable.ts',
  'src/game/objects/Projectile.ts',
  'src/game/objects/Collectible.ts',
  'src/game/objects/Loot.ts'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('applyLightPipeline')) {
    content = content.replace(
      /(super\(scene,\s*x,\s*y,\s*[^;]+;)/,
      "$1\n    if ((scene as any).lightingSystem) { (scene as any).lightingSystem.applyLightPipeline(this); }"
    );
    fs.writeFileSync(file, content);
    console.log(`Patched ${file}`);
  }
});
