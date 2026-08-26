const fs = require('fs');
let content = fs.readFileSync('src/game/objects/Player.ts', 'utf8');

const replacement = `
    const { talentLevels } = useGameStore.getState();
    const talentsDataRaw = require('../../data/talents.json');
    let baseMaxHp = 100;
    let baseMoveSpeed = 160;
    let baseDmgMult = 1.0;
    let baseLifesteal = 0.0;
    let baseCooldownRed = 0.0;
    let baseSacrificeDiscount = 0.0;

    talentsDataRaw.forEach((t) => {
      const lvl = talentLevels[t.id] || 0;
      if (lvl > 0) {
        const bonus = t.bonusPerLevel * lvl;
        if (t.statKey === 'maxHp') baseMaxHp += bonus;
        if (t.statKey === 'moveSpeed') baseMoveSpeed += bonus;
        if (t.statKey === 'damage') baseDmgMult += bonus;
        if (t.statKey === 'lifesteal') baseLifesteal += bonus;
        if (t.statKey === 'cooldown') baseCooldownRed += bonus;
        if (t.statKey === 'sacrificeDiscount') baseSacrificeDiscount += bonus;
      }
    });

    this.stats = {
      hp: baseMaxHp,
      maxHp: baseMaxHp,
      mana: 100,
      maxMana: 100,
      level: 1,
      currentXp: 0,
      nextLevelXp: 50,
      moveSpeed: baseMoveSpeed,
      damageMultiplier: baseDmgMult,
      cooldownReduction: baseCooldownRed,
      vampirism: baseLifesteal,
      sacrificeDiscount: baseSacrificeDiscount,
      projectileBonus: 0,
`;

content = content.replace(
`    this.stats = {
      hp: 100,
      maxHp: 100,
      mana: 100,
      maxMana: 100,
      level: 1,
      currentXp: 0,
      nextLevelXp: 50,
      moveSpeed: 160,
      damageMultiplier: 1.0,
      cooldownReduction: 0.0,
      vampirism: 0.0,
      projectileBonus: 0,`, replacement);

fs.writeFileSync('src/game/objects/Player.ts', content);
