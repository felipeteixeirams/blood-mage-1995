const fs = require('fs');
let content = fs.readFileSync('src/game/scenes/GameScene.ts', 'utf8');

const insertion = `
    // Traps and Barrels
    this.physics.add.collider(this.player, this.barrelsGroup);
    this.physics.add.collider(this.enemiesGroup, this.barrelsGroup);
    
    // Projectiles hit barrels
    this.physics.add.overlap(this.playerProjectiles, this.barrelsGroup, (proj, barrel) => {
      proj.destroy();
      (barrel as any).explode(this);
    });
    this.physics.add.overlap(this.enemyProjectiles, this.barrelsGroup, (proj, barrel) => {
      proj.destroy();
      (barrel as any).explode(this);
    });

    // Spikes overlap
    this.physics.add.overlap(this.player, this.spikeTrapsGroup, (p, spike) => {
      if ((spike as any).isActive()) {
        this.collisionHandlers.handleTrapDamage(this.player, 10);
      }
    });
    this.physics.add.overlap(this.enemiesGroup, this.spikeTrapsGroup, (enemy, spike) => {
      if ((spike as any).isActive()) {
        this.collisionHandlers.handleEnemyTrapDamage(enemy as any, 10);
      }
    });
`;

content = content.replace("this.physics.add.collider(this.player, this.chestsGroup", insertion + "\n    this.physics.add.collider(this.player, this.chestsGroup");
fs.writeFileSync('src/game/scenes/GameScene.ts', content);
