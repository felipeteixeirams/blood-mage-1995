import React, { useEffect, useState } from 'react';
import { useGameStore } from '../../store/gameStore';

// Migrado de window.addEventListener('loot-acquired', ...) para o store tipado
// (lastLootPickup) — ver docs/architecture/06_PHASER_REACT_BRIDGE_MIGRATION.md.
// O campo `id` incrementa a cada pickup, mesmo para o mesmo item, para que o
// toast reapareça/reinicie o timer também em coletas consecutivas idênticas
// (uma mudança de referência de objeto sozinha não seria suficiente aqui, já
// que dois pickups do mesmo tipo de item poderiam, em teoria, reaproveitar
// literais equivalentes).
export const LootLog: React.FC = () => {
  const lastLootPickup = useGameStore((s) => s.lastLootPickup);
  const [visibleId, setVisibleId] = useState<number | null>(null);

  useEffect(() => {
    if (!lastLootPickup) return;
    setVisibleId(lastLootPickup.id);
    const timer = setTimeout(() => {
      setVisibleId((current) => (current === lastLootPickup.id ? null : current));
    }, 3000); // clear after 3 seconds
    return () => clearTimeout(timer);
  }, [lastLootPickup]);

  if (!lastLootPickup || visibleId !== lastLootPickup.id) return null;

  const lootLog = lastLootPickup.item;
  const color = lootLog.rarity === 'epic' ? '#a855f7' : lootLog.rarity === 'rare' ? '#3b82f6' : '#ffffff';

  return (
    <div className="absolute top-14 left-1/2 -translate-x-1/2 animate-bounce bg-black/90 border border-gray-600 px-3 py-1.5 rounded-lg flex items-center gap-2 pointer-events-none">
      <span className="font-pixel text-[9px] uppercase" style={{ color }}>
        Novo Item: {lootLog.name}
      </span>
    </div>
  );
};
