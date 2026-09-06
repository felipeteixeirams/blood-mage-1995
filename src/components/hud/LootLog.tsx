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
  const rarityTheme = {
    epic: { text: 'text-[#c084fc]', border: 'border-purple-600/70', bg: 'bg-[#180e22]/95', shadow: 'shadow-[0_0_10px_rgba(168,85,247,0.35)]', icon: '✦' },
    rare: { text: 'text-[#93c5fd]', border: 'border-blue-600/70', bg: 'bg-[#0e1624]/95', shadow: 'shadow-[0_0_10px_rgba(59,130,246,0.35)]', icon: '◆' },
    common: { text: 'text-[#e3dac9]', border: 'border-[#b8860b]/50', bg: 'bg-[#0c0a09]/95', shadow: 'shadow-[2px_2px_8px_rgba(0,0,0,0.85)]', icon: '⚔' },
  };
  const theme = rarityTheme[lootLog.rarity as 'epic' | 'rare'] || rarityTheme.common;

  return (
    <div className={`fixed bottom-28 left-4 md:bottom-24 md:left-6 z-40 pointer-events-none flex items-center gap-2 px-2.5 py-1 border ${theme.border} ${theme.bg} ${theme.shadow} backdrop-blur select-none transition-all duration-300 font-pixel`}>
      <span className="text-[10px] text-[#e8c76a]">{theme.icon}</span>
      <div className="flex flex-col text-left">
        <span className="text-[6.5px] text-[#b8860b] font-bold uppercase tracking-wider">ITEM COLETADO</span>
        <span className={`text-[8.5px] font-bold uppercase tracking-wide ${theme.text}`}>
          {lootLog.name}
        </span>
      </div>
    </div>
  );
};
