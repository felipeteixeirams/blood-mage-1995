import React, { useState, useEffect } from 'react';
import { LootItem } from '../../types/game';

export const LootLog: React.FC = () => {
  const [lootLog, setLootLog] = useState<LootItem | null>(null);

  useEffect(() => {
    const handleLoot = (e: Event) => {
      const customEvent = e as CustomEvent<LootItem>;
      setLootLog(customEvent.detail);
      setTimeout(() => {
        setLootLog(null);
      }, 3000); // clear after 3 seconds
    };

    window.addEventListener('loot-acquired', handleLoot);
    return () => window.removeEventListener('loot-acquired', handleLoot);
  }, []);

  if (!lootLog) return null;

  const color = lootLog.rarity === 'epic' ? '#a855f7' : lootLog.rarity === 'rare' ? '#3b82f6' : '#ffffff';

  return (
    <div className="absolute top-14 left-1/2 -translate-x-1/2 animate-bounce bg-black/90 border border-gray-600 px-3 py-1.5 rounded-lg flex items-center gap-2 pointer-events-none">
      <span className="font-pixel text-[9px] uppercase" style={{ color }}>
        Novo Item: {lootLog.name}
      </span>
    </div>
  );
};
