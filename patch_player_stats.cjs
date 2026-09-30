const fs = require('fs');
let content = fs.readFileSync('src/types/game.ts', 'utf8');

content = content.replace(
  'vampirism: number; // % life steal',
  'vampirism: number; // % life steal\n  sacrificeDiscount?: number;'
);

fs.writeFileSync('src/types/game.ts', content);
