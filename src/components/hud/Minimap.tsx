import React, { useMemo } from 'react';
import { Home, Skull, Gem, Compass } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';

/**
 * Frente 4 (Expansion Fronts): Minimapa Procedimental
 *
 * Minimapa gótico responsivo: Renderiza salas baseado em geometria real.
 * Não restringe mais a matrizes estáticas. Escala dinamicamente com as bounding boxes da masmorra.
 */
export const Minimap: React.FC = () => {
  const minimapRooms = useGameStore((s) => s.minimapRooms);
  const { minimapVisible, minimapAlpha } = useGameStore((s) => s.settings);
  const floorDepth = useGameStore((s) => s.playerStats.floorDepth);

  const { bounds, mappedRooms } = useMemo(() => {
    if (minimapRooms.length === 0) return { bounds: null, mappedRooms: [] };

    // Find full bounding box of all generated rooms (even unexplored) so map doesn't jitter when discovering
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    minimapRooms.forEach((r) => {
      if (r.x < minX) minX = r.x;
      if (r.y < minY) minY = r.y;
      if (r.x + r.width > maxX) maxX = r.x + r.width;
      if (r.y + r.height > maxY) maxY = r.y + r.height;
    });

    // Add some padding to bounds to prevent rooms from touching the very edge
    const padding = 150;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;

    const bWidth = Math.max(maxX - minX, 1);
    const bHeight = Math.max(maxY - minY, 1);

    // Create percentage-based bounds for responsive rendering inside a fixed aspect-ratio box
    const mapped = minimapRooms.map((r) => ({
      ...r,
      pctX: ((r.x - minX) / bWidth) * 100,
      pctY: ((r.y - minY) / bHeight) * 100,
      pctW: (r.width / bWidth) * 100,
      pctH: (r.height / bHeight) * 100,
    }));

    return { bounds: { minX, minY, bWidth, bHeight }, mappedRooms: mapped };
  }, [minimapRooms]);

  if (!minimapVisible || minimapRooms.length === 0 || !bounds) return null;

  return (
    <div
      className="bg-[#0f0b09]/95 border-2 border-[#b8860b]/50 p-1.5 shadow-[4px_4px_12px_rgba(0,0,0,0.85)] pointer-events-none flex flex-col items-center select-none w-[100px] sm:w-[120px]"
      style={{ opacity: minimapAlpha }}
    >
      {/* Floor Depth & Compass Header */}
      <div className="w-full flex items-center justify-between px-1 pb-1 mb-1 border-b border-[#b8860b]/30 text-[8px] font-pixel text-[#e8c76a]">
        <span className="flex items-center gap-0.5">
          <Compass size={9} className="text-[#e8c76a]" /> PISO {floorDepth || 1}
        </span>
        <span className="text-[7px] text-[#b8860b]/80 uppercase">MAPA</span>
      </div>

      <div className="relative w-full aspect-square bg-black overflow-hidden">
        {mappedRooms.map((room) => {
          const isBoss = room.type === 'boss';
          const isSecret = room.type === 'secret_treasure';
          const isSpawn = room.type === 'spawn';

          // Hide rooms until they are explored (True procedural feel)
          if (!room.explored) return null;

          return (
            <div
              key={room.index}
              className={`absolute border flex items-center justify-center transition-colors duration-500 ${
                isBoss
                  ? 'bg-[#2a0e0e] border-[#ef4444]/60'
                  : isSecret
                  ? 'bg-[#1c1a0e] border-[#facc15]/60'
                  : 'bg-[#1c140e] border-[#b8860b]/50'
              }`}
              style={{
                left: `${room.pctX}%`,
                top: `${room.pctY}%`,
                width: `${room.pctW}%`,
                height: `${room.pctH}%`,
              }}
            >
              {isSpawn && <Home size={10} className="text-[#e8c76a]/80" />}
              {isBoss && <Skull size={10} className="text-[#ef4444]/80" />}
              {isSecret && <Gem size={10} className="text-[#facc15]/80" />}
              {room.hasChest && (
                <span className="absolute top-[1px] right-[1px] w-[4px] h-[4px] rounded-full bg-[#e8c76a] shadow-[0_0_3px_rgba(232,199,106,0.9)]" />
              )}
              {room.hasPlayer && (
                <span className="absolute w-[6px] h-[6px] rounded-full bg-[#ef4444] shadow-[0_0_6px_rgba(239,68,68,1)] ring-1 ring-white/50 animate-pulse z-10" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

