const fs = require('fs');
let content = fs.readFileSync('src/game/objects/Player.ts', 'utf8');

content = content.replace("import spellsData from '../../data/spells.json';", "import spellsData from '../../data/spells.json';\nimport talentsData from '../../data/talents.json';");

content = content.replace("const talentsDataRaw = require('../../data/talents.json');", "");
content = content.replace(/talentsDataRaw/g, "talentsData");

fs.writeFileSync('src/game/objects/Player.ts', content);
