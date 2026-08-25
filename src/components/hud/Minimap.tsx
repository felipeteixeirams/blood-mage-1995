import React from 'react';
import { Home, Skull, Gem } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';

/**
 * Fase 2 de docs/archive/specs/propostas/09_HUD_REFERENCIAS_VISUAIS_DIABLO_DUNGEON_SIEGE.md.
 *
 * Minimap mínimo: a masmorra é sempre uma grade 3x3 fixa (DungeonGenerator),
 * então o "mapa" aqui é literalmente essa grade — sem precisar de nenhum
 * asset novo. GameScene empurra `minimapRooms` (store) a cada ~400ms com o
 * estado de exploração, posição do jogador e baús ainda não saqueados.
 *
 * Substitui os settings `minimapVisible`/`minimapAlpha`, que existiam em
 * `localStorage.ts`/`SettingsScene.ts` sem nenhum componente por trás.
 */
export const Minimap: React.FC = () => {
  const minimapRooms = useGameStore((s) => s.minimapRooms);
  const { minimapVisible, minimapAlpha } = useGameStore((s) => s.settings);

  if (!minimapVisible || minimapRooms.length === 0) return null;

  return (
    <div
      className="bg-[#0f0b09]/95 border-2 border-[#b8860b]/40 p-1.5 shadow-[4px_4px_12px_rgba(0,0,0,0.85)] pointer-events-none"
      style={{ opacity: minimapAlpha }}
    >
      <div className="grid grid-cols-3 gap-[3px] w-[84px] h-[84px] sm:w-[96px] sm:h-[96px]">
        {minimapRooms.map((room) => {
          const isBoss = room.type === 'boss';
          const isSecret = room.type === 'secret_treasure';
          const isSpawn = room.type === 'spawn';

          return (
            <div
              key={room.index}
              className={`relative flex items-center justify-center border transition-colors duration-300 ${
                room.explored
                  ? 'bg-[#1c140e] border-[#b8860b]/50'
                  : 'bg-black border-[#1f1a17]'
              }`}
            >
              {room.explored && (
                <>
                  {isSpawn && <Home size={10} className="text-[#e8c76a]" />}
                  {isBoss && <Skull size={10} className="text-[#ef4444]" />}
                  {isSecret && <Gem size={10} className="text-[#facc15]" />}

                  {room.hasChest && (
                    <span className="absolute top-[1px] right-[1px] w-[4px] h-[4px] rounded-full bg-[#e8c76a] shadow-[0_0_2px_rgba(232,199,106,0.9)]" />
                  )}

                  {room.hasPlayer && (
                    <span className="absolute w-[6px] h-[6px] rounded-full bg-[#ef4444] shadow-[0_0_4px_rgba(239,68,68,0.9)] animate-pulse" />
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
