const fs = require('fs');

// Patch App.tsx
let appContent = fs.readFileSync('src/App.tsx', 'utf8');
appContent = appContent.replace(
  'onOpenAchievements={() => setAchievementsOpen(true)}',
  'onOpenAchievements={() => setAchievementsOpen(true)}\n          onOpenTalents={() => setTalentsOpen(true)}'
);
fs.writeFileSync('src/App.tsx', appContent);

// Patch MainMenu.tsx
let menuContent = fs.readFileSync('src/components/MainMenu.tsx', 'utf8');
menuContent = menuContent.replace(
  'onOpenAchievements: () => void;',
  'onOpenAchievements: () => void;\n  onOpenTalents?: () => void;'
);
menuContent = menuContent.replace(
  'onOpenBestiary,',
  'onOpenBestiary,\n  onOpenTalents,'
);
menuContent = menuContent.replace(
  'game.registry.set("onOpenAchievements", onOpenAchievements);',
  'game.registry.set("onOpenAchievements", onOpenAchievements);\n    game.registry.set("onOpenTalents", onOpenTalents || (() => setTalentsOpen(true)));'
);
menuContent = menuContent.replace(
  'gameRef.current.registry.set("onOpenAchievements", onOpenAchievements);',
  'gameRef.current.registry.set("onOpenAchievements", onOpenAchievements);\n      gameRef.current.registry.set("onOpenTalents", onOpenTalents || (() => setTalentsOpen(true)));'
);
menuContent = menuContent.replace(
  'onOpenAchievements, handleOpenBestiary]);',
  'onOpenAchievements, onOpenTalents, handleOpenBestiary]);'
);
// Make sure setTalentsOpen is imported in MainMenu.tsx from useGameStore if needed.
// Actually, useGameStore already imports setBestiaryOpen.
menuContent = menuContent.replace(
  'const { setBestiaryOpen } = useGameStore();',
  'const { setBestiaryOpen, setTalentsOpen } = useGameStore();'
);

fs.writeFileSync('src/components/MainMenu.tsx', menuContent);
